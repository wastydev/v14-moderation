const path = require('path');
const Jail = require(path.resolve(__dirname, '..', 'models', 'jail'));
const config = require('../config.json');

module.exports = async (client) => {
  setInterval(async () => {
    const now = new Date();
    const jails = await Jail.find({ endTime: { $lte: now } });

    for (const jail of jails) {
      try {
        const guild = client.guilds.cache.get(jail.guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(jail.userId).catch(() => null);
        if (member) {
          const jailRole = guild.roles.cache.get(config.roles.jailed);
          if (jailRole) await member.roles.remove(jailRole, 'Jail süresi bitti');
        }

        await Jail.deleteOne({ _id: jail._id });
      } catch (err) {
        console.error(`[JAIL CHECK] Hata: ${err}`);
      }
    }
  }, 5000);
};
