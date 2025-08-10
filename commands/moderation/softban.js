const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { addHistory } = require('../../utils/history');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Belirtilen kullanıcıyı softbanlar (mesajları siler ve sunucudan atar).')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Softbanlanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Softban sebebi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Yetki kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri Yasakla** yetkisine sahip olmalısın.', ephemeral: true });
        }

        // config kontrolü
        if (!config.softbanLog) {
            return interaction.reply({ content: '❌ `config.json` içinde **softbanLog** kanalı ayarlanmamış.', ephemeral: true });
        }

        const target = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: '❌ Kullanıcı bulunamadı veya sunucuda değil.', ephemeral: true });
        }

        // Bot yetkisi kontrolü
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ Bu komutu çalıştırmak için botun **Üyeleri Yasakla** yetkisi olmalı.', ephemeral: true });
        }

        // Rol sıralaması kontrolü
        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: '❌ Bu kullanıcıyı softbanlamak için rol sıram yeterli değil.', ephemeral: true });
        }

        try {
            // Banla ve mesajları sil
            await interaction.guild.members.ban(target.id, { reason, deleteMessageDays: 7 });
            // Banı kaldır
            await interaction.guild.members.unban(target.id);

            // Geçmişe ekle
            addHistory(target.id, {
                type: 'softban',
                moderator: interaction.user.tag,
                reason,
                date: new Date().toISOString()
            });

            await interaction.reply({ content: `✅ ${target.tag} softbanlandı. Sebep: ${reason}`, ephemeral: true });

            // Log
            const logChannel = interaction.guild.channels.cache.get(config.softbanLog);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔨 Kullanıcı Softbanlandı')
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
            return interaction.reply({ content: '❌ Softban işlemi sırasında hata oluştu.', ephemeral: true });
        }
    }
};
