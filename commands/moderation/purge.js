const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { addHistory, getHistory, getUserHistory, saveHistory } = require('../../utils/history');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Belirtilen sayıda mesajı siler.')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '❌ 1 ile 100 arasında bir sayı girmelisin.', ephemeral: true });
        }

        await interaction.channel.bulkDelete(amount, true);

        await interaction.reply({ content: `✅ ${amount} mesaj silindi.`, ephemeral: true });

        // Log gönder
        const logChannel = interaction.guild.channels.cache.get(config.purgeLog);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🧹 Mesajlar Silindi')
                .addFields(
                    { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Kanal', value: `${interaction.channel}`, inline: true },
                    { name: 'Miktar', value: `${amount}`, inline: true }
                )
                .setColor('Orange')
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    }
};
