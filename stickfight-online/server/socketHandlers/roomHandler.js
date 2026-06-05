const store = require('../data/store');
const GameRoom = require('../game/GameRoom');

const rooms = {};

function generateCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRooms() { return rooms; }

module.exports = function registerRoomHandlers(socket, io) {

  socket.on('room:create', async ({ characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('room:error', { message: 'Not logged in.' });

    let code;
    do { code = generateCode(); } while (rooms[code]);

    const room = new GameRoom(code, io);
    room.onMatchEnd = (result, players) => handleMatchEnd(result, players, room);
    rooms[code] = room;

    const user  = await store.getUser(username);
    const charId = characterId || user?.settings?.selectedCharacter || 'ryoku';
    room.addPlayer(socket, username, charId);
    socket.emit('room:created', { roomCode: code });
  });

  socket.on('room:join', async ({ roomCode, characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('room:error', { message: 'Not logged in.' });
    if (!roomCode) return socket.emit('room:error', { message: 'Room code required.' });

    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('room:error', { message: 'Room not found.' });
    if (room.players.length >= 2) return socket.emit('room:error', { message: 'Room is full.' });

    const user   = await store.getUser(username);
    const charId = characterId || user?.settings?.selectedCharacter || 'ryoku';
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

async function handleMatchEnd(result, roomPlayers, room) {
  const isRanked = room.isRanked || false;
  const [rp0, rp1] = roomPlayers;

  const [u0, u1] = await Promise.all([
    store.getUser(rp0?.username),
    store.getUser(rp1?.username),
  ]);
  if (!u0 || !u1) return;

  const w = result.winnerSlot;

  // Update wins / losses
  if (w === 0) {
    await store.updateUser(u0.username, { stats: { wins:   u0.stats.wins   + 1 } });
    await store.updateUser(u1.username, { stats: { losses: u1.stats.losses + 1 } });
  } else if (w === 1) {
    await store.updateUser(u1.username, { stats: { wins:   u1.stats.wins   + 1 } });
    await store.updateUser(u0.username, { stats: { losses: u0.stats.losses + 1 } });
  }

  // ELO for ranked
  if (isRanked) {
    const { calculate } = require('../ranked/EloSystem');
    const resultVal = w === 0 ? 1 : w === 1 ? 0 : 0.5;
    const { newA, newB, deltaA, deltaB } = calculate(u0.stats.elo, u1.stats.elo, resultVal);
    await store.updateUser(u0.username, { stats: { elo: newA } });
    await store.updateUser(u1.username, { stats: { elo: newB } });
    room.broadcast('game:elo_update', {
      players: [
        { username: u0.username, elo: newA, delta: deltaA },
        { username: u1.username, elo: newB, delta: deltaB },
      ],
    });
  }

  // Match history
  const ts = Date.now();
  await store.addMatchHistory(u0.username, {
    opponent: u1.username,
    result: w === 0 ? 'win' : w === 1 ? 'loss' : 'draw',
    characterId: rp0.characterId,
    opponentCharacterId: rp1.characterId,
    timestamp: ts,
    ranked: isRanked,
  });
  await store.addMatchHistory(u1.username, {
    opponent: u0.username,
    result: w === 1 ? 'win' : w === 0 ? 'loss' : 'draw',
    characterId: rp1.characterId,
    opponentCharacterId: rp0.characterId,
    timestamp: ts,
    ranked: isRanked,
  });
}

module.exports.getRooms = getRooms;
