const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const Mute = require(path.resolve(__dirname, '..', "..", 'models', 'mute'));
const config = require("../../config.json");
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bir kullanıcının mutesini kaldırır.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Mute kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.mutePermission)) {
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

    const mutedRole = interaction.guild.roles.cache.get(config.roles.muted);
    if (mutedRole) {
      await member.roles.remove(mutedRole, "Unmute işlemi");
    }

    await Mute.deleteOne({ userId: user.id, guildId: interaction.guild.id });

    const successEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🔈 Mute Kaldırıldı')
      .addFields(
        { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
        { name: 'Yetkili', value: interaction.user.tag }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    // Log kanalı embed gönderimi
    const logChannel = interaction.guild.channels.cache.get(config.channels.unmuteLog);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🔈 Mute Kaldırıldı')
        .addFields(
          { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
          { name: 'Yetkili', value: interaction.user.tag }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    }
  }
};
