const fs = require('fs');
const path = require('path');

const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json');

function readHistoryFile() {
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, '{}', 'utf8');
  }
  const data = fs.readFileSync(HISTORY_PATH, 'utf8');
  return JSON.parse(data);
}

function writeHistoryFile(data) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function getHistory() {
  return readHistoryFile();
}

async function saveHistory(history) {
  writeHistoryFile(history);
}

async function getUserHistory(userId) {
  const history = readHistoryFile();
  return history[userId] || [];
}

async function addHistory(userId, entry) {
  const history = readHistoryFile();
  if (!history[userId]) history[userId] = [];
  history[userId].push(entry);
  writeHistoryFile(history);
}

module.exports = {
  getHistory,
  saveHistory,
  getUserHistory,
  addHistory,
};
