const mongoose = require('mongoose');

const jailSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    reason: { type: String, default: 'Sebep belirtilmedi' },
    moderatorId: { type: String, required: true },
    endTime: { type: Date, required: true },  // sadece bitiş zamanı tut
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Jail', jailSchema);
