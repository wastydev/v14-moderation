const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const Jail = require(path.resolve(__dirname, '..', "..", 'models', 'jail'));
const config = require('../../config.json');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Bir kullanıcıyı süreli jail\'e atar.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Jail atılacak kullanıcı')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('süre')
        .setDescription('Jail süresi (dakika)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Jail sebebi')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.jailPermission)) {
      const noPermEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bu komutu kullanamazsın.');
      return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('kullanıcı');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Kullanıcı bulunamadı.');
      return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
    }

    const jailRole = interaction.guild.roles.cache.get(config.roles.jailed);
    if (!jailRole) {
      const roleNotFoundEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Jail rolü bulunamadı.');
      return interaction.reply({ embeds: [roleNotFoundEmbed], ephemeral: true });
    }

    const durationMinutes = interaction.options.getInteger('süre');
    if (durationMinutes <= 0) {
      const invalidTimeEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Geçerli bir süre girin (dakika).');
      return interaction.reply({ embeds: [invalidTimeEmbed], ephemeral: true });
    }

    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const now = Date.now();
    const endTime = new Date(now + durationMinutes * 60 * 1000);

    try {
      // Önceden jaildeyse kaldır
      await Jail.deleteOne({ userId: user.id, guildId: interaction.guild.id });

      // Jail rolü ver
      await member.roles.add(jailRole, `Jail sebep: ${reason}`);

      // Veritabanına kaydet
      await Jail.create({
        userId: user.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        reason,
        endTime,
      });

await addHistory(user.id, {
  type: 'jail',
  moderator: interaction.user.tag,
  reason,
  date: new Date().toISOString()
});

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🚓 Jail Atıldı')
        .addFields(
          { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
          { name: 'Süre', value: `${durationMinutes} dakika` },
          { name: 'Sebep', value: reason },
          { name: 'Yetkili', value: interaction.user.tag }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

      // Log kanalı
      const logChannel = interaction.guild.channels.cache.get(config.channels.jailLog);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('Orange')
          .setTitle('🚓 Jail Uygulandı')
          .addFields(
            { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
            { name: 'Süre', value: `${durationMinutes} dakika` },
            { name: 'Sebep', value: reason },
            { name: 'Yetkili', value: interaction.user.tag }
          )
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
      }

    } catch (error) {
      console.error('Jail komutu hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bir hata oluştu.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
