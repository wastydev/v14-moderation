module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} aktif!`);

        const checkMute = require("../utils/checkMute");
        const checkJail = require("../utils/checkJail");
        const checkVMute = require("../utils/checkVMute");

        setInterval(async () => {
            try {
                await checkMute(client);
                await checkJail(client);
                await checkVMute(client);
            } catch (error) {
                console.error("[Interval Hatası]:", error);
            }
        }, 10000);
    }
};
