const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const config = require("./config.json");

const checkMute = require("./utils/checkMute");
const checkJail = require("./utils/checkJail");
const checkVMute = require("./utils/checkVMute");

const commandHandler = require("./handlers/commandHandler");
const eventHandler = require("./handlers/eventHandler");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// MongoDB Bağlantısı
mongoose.connect(config.mongoURI)
    .then(() => console.log("✅ MongoDB bağlandı"))
    .catch(err => {
        console.error("MongoDB bağlantı hatası:", err);
        process.exit(1);
    });

// Handler'lar
commandHandler(client);
eventHandler(client);

client.once("ready", () => {
    console.log(`✅ ${client.user.tag} aktif!`);
    setInterval(async () => {
        try {
            await checkMute(client);
            await checkJail(client);
            await checkVMute(client);
        } catch (error) {
            console.error("[Interval Hatası]:", error);
        }
    }, 10000);
});

client.login(config.token);
