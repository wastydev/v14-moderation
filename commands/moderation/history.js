const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');

const ITEMS_PER_PAGE = 5;

const typeInfo = {
  ban: { color: 'Red', emoji: '🔨' },
  mute: { color: 'Orange', emoji: '🔇' },
  jail: { color: 'DarkBlue', emoji: '⛓️' },
  kick: { color: 'DarkRed', emoji: '👢' },
  warn: { color: 'Yellow', emoji: '⚠️' },
  default: { color: 'Grey', emoji: '❔' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Bir kullanıcının moderasyon sicilini sayfa sayfa gösterir.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcıyı seç').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('kullanıcı');
    const history = await getUserHistory(user.id);

    if (history.length === 0) {
      return interaction.editReply({ content: 'Bu kullanıcının sicili temiz.' });
    }

    let currentPage = 0;
    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

    const stats = history.reduce((acc, entry) => {
      const type = entry.type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const generateEmbed = (page) => {
      const slice = history.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
      const firstEntryType = slice[0]?.type.toLowerCase() || 'default';
      const embedColor = typeInfo[firstEntryType]?.color || typeInfo.default.color;

      const embed = new EmbedBuilder()
        .setTitle(`${user.tag} - Moderasyon Sicili (${page + 1}/${totalPages})`)
        .setColor(embedColor)
        .setTimestamp();

      slice.forEach(entry => {
        const lowerType = entry.type.toLowerCase();
        const emoji = typeInfo[lowerType]?.emoji || typeInfo.default.emoji;
        const isByInvoker = entry.moderator === interaction.user.tag;

        embed.addFields({
          name: `${emoji} ${entry.type.toUpperCase()} - ${new Date(entry.date).toLocaleString()}`,
          value: `**Sebep:** ${entry.reason}\n**Yetkili:** ${entry.moderator}` + (isByInvoker ? ' *(Sen verdin)*' : ''),
          inline: false
        });
      });

      let statsText = '';
      for (const [key, val] of Object.entries(stats)) {
        const emoji = typeInfo[key]?.emoji || typeInfo.default.emoji;
        statsText += `${emoji} **${key.toUpperCase()}**: ${val}\n`;
      }
      embed.addFields({ name: 'Toplam Ceza İstatistikleri', value: statsText, inline: false });

      return embed;
    };

    const createButtons = (page) => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️ Geri')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('İleri ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('clear')
        .setLabel('🗑️ Sicili Temizle')
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [createButtons(currentPage)] });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 2 dakika
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu butonu sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
      }

      if (i.customId === 'next') {
        currentPage = Math.min(currentPage + 1, totalPages - 1);
      } else if (i.customId === 'prev') {
        currentPage = Math.max(currentPage - 1, 0);
      } else if (i.customId === 'clear') {
        collector.stop();

        await i.update({
          content: `**${user.tag}** kullanıcısının sicilini temizlemek istediğine emin misin? Bu işlem geri alınamaz.`,
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirmClear')
              .setLabel('Evet, temizle')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('cancelClear')
              .setLabel('İptal')
              .setStyle(ButtonStyle.Secondary)
          )],
          embeds: []
        });

        const filter = btnInteraction =>
          btnInteraction.user.id === interaction.user.id &&
          ['confirmClear', 'cancelClear'].includes(btnInteraction.customId);

        const confirmCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

        confirmCollector.on('collect', async btnInteraction => {
          if (btnInteraction.customId === 'confirmClear') {
            const historyAll = await getHistory();
            if (historyAll[user.id]) {
              delete historyAll[user.id];
              await saveHistory(historyAll);
            }
            await btnInteraction.update({ content: `${user.tag} kullanıcısının sicili temizlendi.`, components: [], embeds: [] });
          } else {
            await btnInteraction.update({ content: 'Sicil temizleme işlemi iptal edildi.', components: [], embeds: [] });
          }
        });

        confirmCollector.on('end', async collected => {
          if (collected.size === 0) {
            try {
              await interaction.editReply({ content: 'Sicil temizleme işlemi zaman aşımına uğradı.', components: [], embeds: [] });
            } catch {}
          }
        });

        return;
      }

      await i.update({ embeds: [generateEmbed(currentPage)], components: [createButtons(currentPage)], content: null });
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Geri').setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('next').setLabel('İleri ➡️').setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('clear').setLabel('🗑️ Sicili Temizle').setStyle(ButtonStyle.Danger).setDisabled(true)
      );

      try {
        if (!interaction.deleted) {
          await interaction.editReply({ components: [disabledRow] });
        }
      } catch (e) {
        // Interaction süresi geçmiş olabilir, burada hata yoksayılır
      }
    });
  }
};
