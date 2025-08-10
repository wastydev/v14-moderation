const { Schema, model } = require("mongoose");

const muteSchema = new Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    endTime: { type: Date, required: true },
    reason: { type: String, default: "Belirtilmedi" }
});

module.exports = model("Mute", muteSchema);
