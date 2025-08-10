const path = require('path');
const VMute = require(path.resolve(__dirname, '..', 'models', 'vmute'));
const config = require('../config.json');

module.exports = async (oldState, newState) => {
  if (!newState.guild) return;

  const userId = newState.id;
  const guildId = newState.guild.id;

  const vmuteData = await VMute.findOne({ userId, guildId });
  if (!vmuteData) return;

  // Süresi dolmuşsa temizle
  if (vmuteData.endTime <= new Date()) {
    try {
      const member = await newState.guild.members.fetch(userId);
      const vmuteRole = newState.guild.roles.cache.get(config.roles.vmuted);

      if (vmuteRole && member.roles.cache.has(vmuteRole.id)) {
        await member.roles.remove(vmuteRole, 'VMute süresi bitti');
      }

      if (member.voice.channel && member.voice.serverMute) {
        await member.voice.setMute(false, 'VMute süresi bitti');
      }

      await VMute.deleteOne({ userId, guildId });
    } catch (err) {
      console.error('VMute voiceStateUpdate unmute error:', err);
    }
    return;
  }

  // Süresi bitmemiş, kullanıcı ses kanalına girerse mute uygula
  try {
    const member = await newState.guild.members.fetch(userId);

    if (member.voice.channel && !member.voice.serverMute) {
      await member.voice.setMute(true, 'VMute rolü var, otomatik sesli mute');
    }
  } catch (err) {
    console.error('VMute voiceStateUpdate mute error:', err);
  }
};
