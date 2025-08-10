const path = require('path');
const VMute = require(path.resolve(__dirname, '..', 'models', 'vmute'));
const config = require('../config.json');

module.exports = (client) => {
  setInterval(async () => {
    const now = new Date();
    const expired = await VMute.find({ endTime: { $lte: now } });

    for (const vmute of expired) {
      try {
        const guild = client.guilds.cache.get(vmute.guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(vmute.userId).catch(() => null);
        if (!member) continue;

        const vmuteRole = guild.roles.cache.get(config.roles.vmuted);

        if (vmuteRole && member.roles.cache.has(vmuteRole.id)) {
          await member.roles.remove(vmuteRole, 'VMute süresi bitti');
        }

        if (member.voice.channel && member.voice.serverMute) {
          await member.voice.setMute(false, 'VMute süresi bitti');
        }

        await VMute.deleteOne({ _id: vmute._id });
      } catch (e) {
        console.error('VMute süre bitiş kontrol hatası:', e);
      }
    }
  }, 10000);
};
