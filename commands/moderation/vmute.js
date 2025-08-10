const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const VMute = require(path.resolve(__dirname, '..', '..', 'models', 'vmute'));
const config = require('../../config.json');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicemute')
    .setDescription('Bir kullanıcıyı süreli olarak sesli kanallarda susturur ve vmute rolü verir.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Susturulacak kullanıcı')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('süre')
        .setDescription('Süre (dakika)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Sebep')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.vmutePermission)) {
      const noPermEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Bu komutu kullanamazsın.');
      return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('kullanıcı');
    const minutes = interaction.options.getInteger('süre');
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

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

    if (!member.voice.channel) {
      const noVoiceEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Kullanıcı ses kanalında değil.');
      return interaction.reply({ embeds: [noVoiceEmbed], ephemeral: true });
    }

    const endTime = new Date(Date.now() + minutes * 60000);

    try {
      // Sesli mute
      await member.voice.setMute(true, `Voice mute sebep: ${reason}`);

      // VMute rolü ver
      if (!member.roles.cache.has(vmuteRole.id)) {
        await member.roles.add(vmuteRole, `Voice mute sebep: ${reason}`);
      }

      // Veritabanına kaydet
      await VMute.create({
        userId: user.id,
        guildId: interaction.guild.id,
        endTime,
        reason
      });

      // Log kanalı
      const logChannel = interaction.guild.channels.cache.get(config.channels.vmuteLog);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('Orange')
          .setTitle('Sesli Susturma Uygulandı')
          .addFields(
            { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
            { name: 'Süre', value: `${minutes} dakika`, inline: true },
            { name: 'Sebep', value: reason },
            { name: 'Yetkili', value: interaction.user.tag }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(`✅ ${user.tag} ${minutes} dakika boyunca sesli olarak susturuldu ve VMute rolü verildi. Sebep: ${reason}`);

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
