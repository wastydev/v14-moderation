const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const VMute = require(path.resolve(__dirname, '..', '..', 'models', 'vmute'));
const config = require('../../config.json');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('unvoicemute')
    .setDescription('Bir kullanıcının sesli susturmasını kaldırır ve vmute rolünü alır.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Susturması kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.vmutePermission)) {
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

    const vmuteRole = interaction.guild.roles.cache.get(config.roles.vmuted);
    if (!vmuteRole) {
      const noRoleEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ VMute rolü bulunamadı.');
      return interaction.reply({ embeds: [noRoleEmbed], ephemeral: true });
    }

    try {
      // Sesli mute kaldır
      if (member.voice.channel) {
        await member.voice.setMute(false, 'Voice mute kaldırıldı');
      }
      // VMute rolü kaldır
      if (member.roles.cache.has(vmuteRole.id)) {
        await member.roles.remove(vmuteRole, 'Voice mute kaldırıldı');
      }

      await VMute.deleteOne({ userId: user.id, guildId: interaction.guild.id });

      // Log kanalı
      const logChannel = interaction.guild.channels.cache.get(config.channels.unvmuteLog);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('Sesli Susturma Kaldırıldı')
          .addFields(
            { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
            { name: 'Yetkili', value: interaction.user.tag }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(`✅ ${user.tag} adlı kullanıcının sesli susturması ve VMute rolü kaldırıldı.`);

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('Bir hata oluştu.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
