const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const Jail = require(path.resolve(__dirname, '..', "..", 'models', 'jail'));
const config = require('../../config.json');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('unjail')
    .setDescription('Bir kullanıcıyı jailden çıkarır.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Jailden çıkarılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
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

    const jailData = await Jail.findOneAndDelete({ userId: user.id, guildId: interaction.guild.id });

    if (!jailData) {
      const notJailedEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bu kullanıcı jailde değil.');
      return interaction.reply({ embeds: [notJailedEmbed], ephemeral: true });
    }

    try {
      await member.roles.remove(jailRole, 'Jailden çıkarıldı');

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🚓 Jail Kaldırıldı')
        .addFields(
          { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
          { name: 'Yetkili', value: interaction.user.tag }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

      // Log kanalı
      const logChannel = interaction.guild.channels.cache.get(config.channels.unjailLog);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle('🚓 Jail Kaldırıldı')
          .addFields(
            { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
            { name: 'Yetkili', value: interaction.user.tag }
          )
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Unjail komutu hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bir hata oluştu.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
