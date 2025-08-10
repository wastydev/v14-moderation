const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    commands.push(command.data.toJSON());
  }
}

console.log('Yüklenecek komutlar:', commands.map(cmd => cmd.name));

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Komutlar deploy ediliyor...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log('Komutlar başarıyla deploy edildi.');
  } catch (error) {
    console.error('Deploy hatası:', error);
  }
})();
