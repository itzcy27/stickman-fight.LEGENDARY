/**
 * In-memory data store with optional JSON file persistence.
 * Suitable for Render free tier (ephemeral disk).
 * Swap out save/load for a real DB in production.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'users.json');

// In-memory maps
let users = {};       // username -> UserRecord
let sessions = {};    // socketId -> username

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      users = JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Store] Failed to load data:', e.message);
    users = {};
  }
}

function saveToDisk() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('[Store] Failed to save data:', e.message);
  }
}

// Load on startup
loadFromDisk();

// ─── User operations ────────────────────────────────────────────────────────

function createUser(username) {
  if (users[username]) return null; // already exists
  users[username] = {
    username,
    createdAt: Date.now(),
    stats: {
      wins: 0,
      losses: 0,
      elo: 1000,
      matchHistory: [],
    },
    settings: {
      selectedCharacter: 'ryoku',
    },
  };
  saveToDisk();
  return users[username];
}

function getUser(username) {
  return users[username] || null;
}

function updateUser(username, patch) {
  if (!users[username]) return null;
  // Deep merge stats
  if (patch.stats) {
    Object.assign(users[username].stats, patch.stats);
  }
  if (patch.settings) {
    Object.assign(users[username].settings, patch.settings);
  }
  saveToDisk();
  return users[username];
}

function addMatchHistory(username, record) {
  if (!users[username]) return;
  const history = users[username].stats.matchHistory;
  history.unshift(record); // newest first
  if (history.length > 20) history.pop(); // keep last 20
  saveToDisk();
}

function getLeaderboard(limit = 20) {
  return Object.values(users)
    .sort((a, b) => b.stats.elo - a.stats.elo)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      username: u.username,
      elo: u.stats.elo,
      wins: u.stats.wins,
      losses: u.stats.losses,
    }));
}

// ─── Session operations ──────────────────────────────────────────────────────

function setSession(socketId, username) {
  sessions[socketId] = username;
}

function getSession(socketId) {
  return sessions[socketId] || null;
}

function removeSession(socketId) {
  delete sessions[socketId];
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  addMatchHistory,
  getLeaderboard,
  setSession,
  getSession,
  removeSession,
};
