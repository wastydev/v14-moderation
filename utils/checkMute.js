const path = require('path');
const Mute = require(path.resolve(__dirname, '..', 'models', 'mute'));
const config = require('../config.json');

module.exports = async (client) => {
    setInterval(async () => {
        const now = new Date();  // burada number değil Date kullanıyoruz
        const mutes = await Mute.find({ endTime: { $lte: now } });

        for (const mute of mutes) {
            try {
                const guild = client.guilds.cache.get(mute.guildId);
                if (!guild) continue;

                const member = await guild.members.fetch(mute.userId).catch(() => null);
                if (member) {
                    const mutedRole = guild.roles.cache.get(config.roles.muted);
                    if (mutedRole) {
                        await member.roles.remove(mutedRole, 'Mute süresi bitti');
                    }
                }

                await Mute.deleteOne({ _id: mute._id });
            } catch (err) {
                console.error(`[MUTE CHECK] Hata: ${err}`);
            }
        }
    }, 5000);
};
