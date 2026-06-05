/**
 * Data store — MongoDB via Mongoose.
 * Falls back to in-memory if MONGODB_URI is not set (local dev without DB).
 *
 * Public API is identical to the old JSON-file version so no other
 * files need to change.
 */
const mongoose = require('mongoose');

// ─── Schema ───────────────────────────────────────────────────────────────────

const matchRecordSchema = new mongoose.Schema({
  opponent:            String,
  result:              String,   // 'win' | 'loss' | 'draw'
  characterId:         String,
  opponentCharacterId: String,
  timestamp:           Number,
  ranked:              Boolean,
}, { _id: false });

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  createdAt: { type: Number, default: () => Date.now() },
  stats: {
    wins:         { type: Number, default: 0 },
    losses:       { type: Number, default: 0 },
    elo:          { type: Number, default: 1000 },
    matchHistory: { type: [matchRecordSchema], default: [] },
  },
  settings: {
    selectedCharacter: { type: String, default: 'ryoku' },
  },
});

const User = mongoose.model('User', userSchema);

// ─── Connection ───────────────────────────────────────────────────────────────

let connected = false;
let fallback   = {};   // in-memory fallback when no MONGODB_URI

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[Store] MONGODB_URI not set — using in-memory store (data will not persist).');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log('[Store] MongoDB connected.');
  } catch (err) {
    console.error('[Store] MongoDB connection failed:', err.message);
    console.warn('[Store] Falling back to in-memory store.');
  }
}

connect();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}

// ─── In-memory fallback implementations ──────────────────────────────────────

function _fbCreateUser(username) {
  if (fallback[username]) return null;
  fallback[username] = {
    username,
    createdAt: Date.now(),
    stats: { wins: 0, losses: 0, elo: 1000, matchHistory: [] },
    settings: { selectedCharacter: 'ryoku' },
  };
  return fallback[username];
}

function _fbGetUser(username) { return fallback[username] || null; }

function _fbUpdateUser(username, patch) {
  if (!fallback[username]) return null;
  if (patch.stats)     Object.assign(fallback[username].stats,    patch.stats);
  if (patch.settings)  Object.assign(fallback[username].settings, patch.settings);
  return fallback[username];
}

function _fbAddHistory(username, record) {
  if (!fallback[username]) return;
  fallback[username].stats.matchHistory.unshift(record);
  if (fallback[username].stats.matchHistory.length > 20)
    fallback[username].stats.matchHistory.pop();
}

function _fbLeaderboard(limit) {
  return Object.values(fallback)
    .sort((a, b) => b.stats.elo - a.stats.elo)
    .slice(0, limit)
    .map((u, i) => ({ rank: i + 1, username: u.username, elo: u.stats.elo, wins: u.stats.wins, losses: u.stats.losses }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function createUser(username) {
  if (!connected) return _fbCreateUser(username);
  try {
    const existing = await User.findOne({ username });
    if (existing) return null;
    const user = new User({ username });
    await user.save();
    return toPlain(user);
  } catch (err) {
    console.error('[Store] createUser error:', err.message);
    return null;
  }
}

async function getUser(username) {
  if (!connected) return _fbGetUser(username);
  try {
    const user = await User.findOne({ username });
    return toPlain(user);
  } catch (err) {
    console.error('[Store] getUser error:', err.message);
    return null;
  }
}

async function updateUser(username, patch) {
  if (!connected) return _fbUpdateUser(username, patch);
  try {
    const update = {};
    if (patch.stats) {
      for (const [k, v] of Object.entries(patch.stats)) {
        update[`stats.${k}`] = v;
      }
    }
    if (patch.settings) {
      for (const [k, v] of Object.entries(patch.settings)) {
        update[`settings.${k}`] = v;
      }
    }
    const user = await User.findOneAndUpdate(
      { username },
      { $set: update },
      { new: true }
    );
    return toPlain(user);
  } catch (err) {
    console.error('[Store] updateUser error:', err.message);
    return null;
  }
}

async function addMatchHistory(username, record) {
  if (!connected) return _fbAddHistory(username, record);
  try {
    await User.findOneAndUpdate(
      { username },
      {
        $push: {
          'stats.matchHistory': {
            $each:     [record],
            $position: 0,
            $slice:    20,
          },
        },
      }
    );
  } catch (err) {
    console.error('[Store] addMatchHistory error:', err.message);
  }
}

async function getLeaderboard(limit = 20) {
  if (!connected) return _fbLeaderboard(limit);
  try {
    const users = await User.find()
      .sort({ 'stats.elo': -1 })
      .limit(limit)
      .lean();
    return users.map((u, i) => ({
      rank:     i + 1,
      username: u.username,
      elo:      u.stats.elo,
      wins:     u.stats.wins,
      losses:   u.stats.losses,
    }));
  } catch (err) {
    console.error('[Store] getLeaderboard error:', err.message);
    return [];
  }
}

// ─── Session store (in-memory only — sessions are per-process) ────────────────

const sessions = {};

function setSession(socketId, username)  { sessions[socketId] = username; }
function getSession(socketId)            { return sessions[socketId] || null; }
function removeSession(socketId)         { delete sessions[socketId]; }

// ─── Exports ──────────────────────────────────────────────────────────────────

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
