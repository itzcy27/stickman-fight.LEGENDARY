const store = require('../data/store');
const GameRoom = require('../game/GameRoom');

// roomCode -> GameRoom
const rooms = {};

function generateCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRooms() { return rooms; }

function registerRoomHandlers(socket, io) {

  socket.on('room:create', ({ characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('room:error', { message: 'Not logged in.' });

    let code;
    do { code = generateCode(); } while (rooms[code]);

    const room = new GameRoom(code, io);
    room.onMatchEnd = (result, players) => handleMatchEnd(result, players, room);
    rooms[code] = room;

    const charId = characterId || store.getUser(username)?.settings?.selectedCharacter || 'ryoku';
    room.addPlayer(socket, username, charId);
    socket.emit('room:created', { roomCode: code });
  });

  socket.on('room:join', ({ roomCode, characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('room:error', { message: 'Not logged in.' });
    if (!roomCode) return socket.emit('room:error', { message: 'Room code required.' });

    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('room:error', { message: 'Room not found.' });
    if (room.players.length >= 2) return socket.emit('room:error', { message: 'Room is full.' });

    const charId = characterId || store.getUser(username)?.settings?.selectedCharacter || 'ryoku';
    room.addPlayer(socket, username, charId);
    socket.emit('room:joined', { roomCode: code });
  });

  socket.on('room:update_character', ({ roomCode, characterId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (room) room.updateCharacter(socket.id, characterId);
  });

  socket.on('room:start_game', ({ roomCode } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return;
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('room:error', { message: 'Room not found.' });
    if (room.players[0]?.socketId !== socket.id) return socket.emit('room:error', { message: 'Only the host can start.' });
    if (room.players.length < 2) return socket.emit('room:error', { message: 'Need 2 players to start.' });
    room.startGame();
  });

  socket.on('room:leave', ({ roomCode } = {}) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];
    if (room) {
      room.removePlayer(socket.id);
      if (room.isEmpty()) delete rooms[code];
    }
  });

  socket.on('disconnect', () => {
    // Find and clean up any rooms this socket was in
    for (const [code, room] of Object.entries(rooms)) {
      const wasIn = room.players.some(p => p.socketId === socket.id);
      if (wasIn) {
        room.removePlayer(socket.id);
        if (room.isEmpty()) delete rooms[code];
      }
    }
    store.removeSession(socket.id);
  });
};

// ─── Match end stats ──────────────────────────────────────────────────────────

function handleMatchEnd(result, roomPlayers, room) {
  if (room.phase !== 'match_end') return; // already handled

  const isRanked = room.isRanked || false;
  const [rp0, rp1] = roomPlayers;
  const [gs0, gs1] = result.players;

  const u0 = store.getUser(rp0?.username);
  const u1 = store.getUser(rp1?.username);
  if (!u0 || !u1) return;

  const w = result.winnerSlot;

  // Update wins/losses
  if (w === 0) {
    store.updateUser(u0.username, { stats: { wins: u0.stats.wins + 1 } });
    store.updateUser(u1.username, { stats: { losses: u1.stats.losses + 1 } });
  } else if (w === 1) {
    store.updateUser(u1.username, { stats: { wins: u1.stats.wins + 1 } });
    store.updateUser(u0.username, { stats: { losses: u0.stats.losses + 1 } });
  }

  // ELO update for ranked
  if (isRanked) {
    const { calculate } = require('../ranked/EloSystem');
    const elo0 = u0.stats.elo;
    const elo1 = u1.stats.elo;
    const resultVal = w === 0 ? 1 : w === 1 ? 0 : 0.5;
    const { newA, newB, deltaA, deltaB } = calculate(elo0, elo1, resultVal);
    store.updateUser(u0.username, { stats: { elo: newA } });
    store.updateUser(u1.username, { stats: { elo: newB } });

    // Attach ELO deltas to match end event
    room.broadcast('game:elo_update', {
      players: [
        { username: u0.username, elo: newA, delta: deltaA },
        { username: u1.username, elo: newB, delta: deltaB },
      ]
    });
  }

  // Match history
  const record0 = {
    opponent: u1.username,
    result: w === 0 ? 'win' : w === 1 ? 'loss' : 'draw',
    characterId: rp0.characterId,
    opponentCharacterId: rp1.characterId,
    timestamp: Date.now(),
    ranked: isRanked,
  };
  const record1 = {
    opponent: u0.username,
    result: w === 1 ? 'win' : w === 0 ? 'loss' : 'draw',
    characterId: rp1.characterId,
    opponentCharacterId: rp0.characterId,
    timestamp: Date.now(),
    ranked: isRanked,
  };
  store.addMatchHistory(u0.username, record0);
  store.addMatchHistory(u1.username, record1);
}

module.exports = registerRoomHandlers;
module.exports.getRooms = getRooms;
