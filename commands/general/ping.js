const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikme süresini gösterir.'),
  
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = interaction.client.ws.ping;

    interaction.editReply(`🏓 Pong!\nMesaj gecikmesi: ${latency} ms\nAPI gecikmesi: ${apiLatency} ms`);
  }
};
