const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const Mute = require(path.resolve(__dirname, '..', "..", 'models', 'mute'));
const config = require("../../config.json");
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı süreli olarak susturur.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Mute atılacak kullanıcı')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('süre')
        .setDescription('Mute süresi (dakika)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Mute sebebi')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.mutePermission)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Bu komutu kullanamazsın.')],
        flags: 64
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('kullanıcı');
    const minutes = interaction.options.getInteger('süre');
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

    // Kendine mute atmayı engelle
    if (user.id === interaction.user.id) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Kendine mute atamazsın.')]
      });
    }

    // Bot mute engeli
    if (user.bot) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Botlara mute atamazsın.')]
      });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Kullanıcı bulunamadı.')]
      });
    }

    const mutedRole = interaction.guild.roles.cache.get(config.roles.muted);
    if (!mutedRole) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Muted rolü bulunamadı.')]
      });
    }

    // Rol hiyerarşisi kontrolü
    if (interaction.member.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Bu kullanıcıyı mute atamazsın (rol hiyerarşisi).')]
      });
    }

    // Muted rolü yetkili rollerin üstünde mi kontrol
    if (interaction.guild.members.me.roles.highest.position <= mutedRole.position) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Muted rolü, botun rolünden yüksek olduğu için mute atılamıyor.')]
      });
    }

    // Zaten mute'lu mu kontrol et
    if (member.roles.cache.has(mutedRole.id)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Bu kullanıcı zaten mute\'lu.')]
      });
    }

    const endTime = new Date(Date.now() + minutes * 60000);
    const formattedEndTime = endTime.toLocaleString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    try {
      await member.roles.add(mutedRole, `Mute sebep: ${reason}`);

      await Mute.create({
        userId: user.id,
        guildId: interaction.guild.id,
        endTime,
        reason,
      });

      addHistory(member.id, {
        type: 'mute',
        moderator: interaction.user.tag,
        reason,
        date: new Date().toISOString()
      });

      const muteEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('🔇 Yeni Mute')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)`, inline: true },
          { name: 'Süre', value: `${minutes} dakika`, inline: true },
          { name: 'Sebep', value: reason, inline: false },
          { name: 'Yetkili', value: interaction.user.tag, inline: true },
          { name: 'Bitiş Zamanı', value: formattedEndTime, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [muteEmbed] });

      // Log kanalı
      const logChannel = interaction.guild.channels.cache.get(config.channels.muteLog);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#f39c12')
          .setTitle('🔇 Mute Uygulandı')
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)`, inline: true },
            { name: 'Süre', value: `${minutes} dakika`, inline: true },
            { name: 'Sebep', value: reason, inline: false },
            { name: 'Yetkili', value: interaction.user.tag, inline: true },
            { name: 'Bitiş Zamanı', value: formattedEndTime, inline: true }
          )
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Mute komutu hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bir hata oluştu.');
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
      } catch {}
    }
  }
};
