const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { addHistory } = require('../../utils/history');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı yasaklar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yasaklanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Yönetici yetkisi kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için `Üyeleri Yasakla` yetkisine sahip olmalısın.', ephemeral: true });
        }

        const target = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

        // Kendini banlama kontrolü
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: '❌ Kendini banlayamazsın.', ephemeral: true });
        }

        // Botu banlama kontrolü
        if (target.id === interaction.client.user.id) {
            return interaction.reply({ content: '❌ Beni banlayamazsın 😄', ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        // Kullanıcı zaten banlı mı kontrolü
        const bans = await interaction.guild.bans.fetch();
        if (bans.has(target.id)) {
            return interaction.reply({ content: '❌ Bu kullanıcı zaten banlı.', ephemeral: true });
        }

        // Kullanıcı bulunamadı
        if (!member) {
            return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        }

        // Yetkiliyi banlama engeli
        if (member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ Bu kullanıcı bir yetkili, banlayamazsın.', ephemeral: true });
        }

        // Ban işlemi
        try {
            await member.ban({ reason });

            await addHistory(target.id, {
                type: 'ban',
                moderator: interaction.user.tag,
                reason,
                date: new Date().toISOString()
            });

            await interaction.reply({ content: `✅ ${target.tag} banlandı. Sebep: ${reason}`, ephemeral: true });

            // Log gönderme
            const logChannel = interaction.guild.channels.cache.get(config.banLog);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔨 Kullanıcı Yasaklandı')
                    .addFields(
                        { name: 'Yetkili', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
                        { name: 'Kullanıcı', value: `${target.tag} (\`${target.id}\`)`, inline: true },
                        { name: 'Sebep', value: reason, inline: true }
                    )
                    .setColor('Red')
                    .setTimestamp();

                logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Ban işlemi sırasında bir hata oluştu.', ephemeral: true });
        }
    }
};
