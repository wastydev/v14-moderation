const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const commandsPath = path.join(__dirname, "../commands");

    const getFiles = (dir) => {
        let files = [];
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                files = files.concat(getFiles(fullPath));
            } else if (file.endsWith(".js")) {
                files.push(fullPath);
            }
        });
        return files;
    };

    const commandFiles = getFiles(commandsPath);

    for (const filePath of commandFiles) {
        const command = require(filePath);
        if (!command.data || !command.data.name) {
            console.warn(`[UYARI] ${filePath} içinde 'data' veya 'data.name' bulunamadı.`);
            continue;
        }
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
    }
};
