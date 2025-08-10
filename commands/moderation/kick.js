const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { addHistory } = require('../../utils/history');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı sunucudan atar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Atılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Atma sebebi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri At** yetkisine sahip olmalısın.', ephemeral: true });
        }

        // config kontrolü
        if (!config.kickLog) {
            return interaction.reply({ content: '❌ `config.json` içinde **kickLog** kanalı ayarlanmamış.', ephemeral: true });
        }

        const target = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: '❌ Kullanıcı bu sunucuda bulunmuyor.', ephemeral: true });
        }

        // Bot yetkisi kontrolü
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: '❌ Bu komutu çalıştırmak için botun **Üyeleri At** yetkisi olmalı.', ephemeral: true });
        }

        // Rol sıralaması kontrolü
        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: '❌ Bu kullanıcıyı atmak için rol sıram yeterli değil.', ephemeral: true });
        }

        try {
            await member.kick(reason);

            // Geçmişe ekle
            addHistory(target.id, {
                type: 'kick',
                moderator: interaction.user.tag,
                reason,
                date: new Date().toISOString()
            });

            await interaction.reply({ content: `✅ ${target.tag} sunucudan atıldı. Sebep: ${reason}`, ephemeral: true });

            // Log
            const logChannel = interaction.guild.channels.cache.get(config.kickLog);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('👢 Kullanıcı Atıldı')
                    .addFields(
                        { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Kullanıcı', value: `${target.tag}`, inline: true },
                        { name: 'Sebep', value: reason, inline: true }
                    )
                    .setColor('Orange')
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Kick işlemi sırasında hata oluştu.', ephemeral: true });
        }
    }
};
