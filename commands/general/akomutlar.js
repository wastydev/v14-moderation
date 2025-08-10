const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json'); // İçinde owner ID olacak

module.exports = {
  data: new SlashCommandBuilder()
    .setName('akomutlar')
    .setDescription('Yetkili komutlarının detaylı listesini gösterir (Owner only).'),

  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({ content: '❌ Bu komutu sadece owner kullanabilir.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔧 Yetkili Komutları Listesi')
      .setColor('#0099ff')
      .setDescription('Aşağıda yetkili komutlarının nasıl kullanıldığı ve ne işe yaradıkları detaylı şekilde listelenmiştir.\n\n**Kullanım:** `/komut [parametre] (opsiyonel)`\n\n')
      .addFields(
        {
          name: '/mute',
          value: `Belirtilen kullanıcıyı belirtilen süre boyunca susturur.\n**Kullanım:** \`/mute kullanıcı süre: dakika sebep: opsiyonel\`\nÖrnek: \`/mute @Erçağ 5 spam\``
        },
        {
          name: '/unmute',
          value: `Belirtilen kullanıcının susturmasını kaldırır.\n**Kullanım:** \`/unmute kullanıcı\`\nÖrnek: \`/unmute @Erçağ\``
        },
        {
          name: '/jail',
          value: `Belirtilen kullanıcıyı belirtilen süre boyunca jail'e atar.\n**Kullanım:** \`/jail kullanıcı süre: dakika sebep: opsiyonel\`\nÖrnek: \`/jail @Erçağ 10 kural ihlali\``
        },
        {
          name: '/unjail',
          value: `Belirtilen kullanıcının jailini kaldırır.\n**Kullanım:** \`/unjail kullanıcı\`\nÖrnek: \`/unjail @Erçağ\``
        },
        {
          name: '/voicemute',
          value: `Belirtilen kullanıcıyı belirtilen süre boyunca sesli kanallarda susturur ve VMute rolü verir.\n**Kullanım:** \`/voicemute kullanıcı süre: dakika sebep: opsiyonel\`\nÖrnek: \`/voicemute @Erçağ 3 rahatsızlık\``
        },
        {
          name: '/unvoicemute',
          value: `Belirtilen kullanıcının sesli susturmasını kaldırır ve VMute rolünü alır.\n**Kullanım:** \`/unvoicemute kullanıcı\`\nÖrnek: \`/unvoicemute @Erçağ\``
        }
      )
      .setFooter({ text: 'Yetkili komutlarını kullanırken dikkatli olun.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
