const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Sadece komutları işleyelim
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Komut bulunamadı: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Komut çalıştırılırken hata oluştu: ${interaction.commandName}`, error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            }
        }
    },
};
