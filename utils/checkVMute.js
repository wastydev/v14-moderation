const path = require('path');
const VMute = require(path.resolve(__dirname, '..', 'models', 'vmute'));
const config = require('../config.json');

module.exports = async (client) => {
  setInterval(async () => {
    const now = new Date();
    const vmutes = await VMute.find({ endTime: { $lte: now } });

    for (const vmute of vmutes) {
      try {
        const guild = client.guilds.cache.get(vmute.guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(vmute.userId).catch(() => null);
        if (member && member.voice.serverMute) {
          await member.voice.setMute(false, 'Voice mute süresi bitti');
        }

        await VMute.deleteOne({ _id: vmute._id });
      } catch (err) {
        console.error(`[VMUTE CHECK] Hata: ${err}`);
      }
    }
  }, 5000);
};
