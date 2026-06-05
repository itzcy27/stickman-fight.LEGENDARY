const store = require('../data/store');
const GameRoom = require('../game/GameRoom');
const { getRooms } = require('./roomHandler');

// Queues: { socketId, username, characterId, elo, joinedAt }
const casualQueue  = [];
const rankedQueue  = [];

function generateCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

module.exports = function registerMatchmakingHandlers(socket, io) {

  socket.on('mm:join_casual', ({ characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('mm:error', { message: 'Not logged in.' });
    removeFromQueues(socket.id);

    const charId = characterId || 'ryoku';
    casualQueue.push({ socketId: socket.id, username, characterId: charId, joinedAt: Date.now() });
    socket.emit('mm:queued', { mode: 'casual', position: casualQueue.length });

    tryMatch(casualQueue, false, io);
  });

  socket.on('mm:join_ranked', ({ characterId } = {}) => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('mm:error', { message: 'Not logged in.' });
    removeFromQueues(socket.id);

    const user   = store.getUser(username);
    const elo    = user?.stats?.elo || 1000;
    const charId = characterId || 'ryoku';
    rankedQueue.push({ socketId: socket.id, username, characterId: charId, elo, joinedAt: Date.now() });
    socket.emit('mm:queued', { mode: 'ranked', position: rankedQueue.length });

    tryMatch(rankedQueue, true, io);
  });

  socket.on('mm:cancel', () => {
    removeFromQueues(socket.id);
    socket.emit('mm:cancelled');
  });

  socket.on('disconnect', () => {
    removeFromQueues(socket.id);
  });
};

function removeFromQueues(socketId) {
  const ci = casualQueue.findIndex(p => p.socketId === socketId);
  if (ci !== -1) casualQueue.splice(ci, 1);
  const ri = rankedQueue.findIndex(p => p.socketId === socketId);
  if (ri !== -1) rankedQueue.splice(ri, 1);
}

function tryMatch(queue, isRanked, io) {
  if (queue.length < 2) return;

  // For ranked: find closest ELO pair
  let i0 = 0, i1 = 1;
  if (isRanked && queue.length >= 2) {
    let minDiff = Infinity;
    for (let a = 0; a < queue.length - 1; a++) {
      for (let b = a + 1; b < queue.length; b++) {
        const diff = Math.abs(queue[a].elo - queue[b].elo);
        if (diff < minDiff) { minDiff = diff; i0 = a; i1 = b; }
      }
    }
  }

  const p0 = queue.splice(i0, 1)[0];
  // After splice, i1 may have shifted
  const newI1 = i1 > i0 ? i1 - 1 : i1;
  const p1 = queue.splice(newI1, 1)[0];
  if (!p0 || !p1) return;

  const rooms = getRooms();
  let code;
  do { code = generateCode(); } while (rooms[code]);

  const room = new GameRoom(code, io);
  room.isRanked = isRanked;

  // Get sockets
  const sock0 = io.sockets.sockets.get(p0.socketId);
  const sock1 = io.sockets.sockets.get(p1.socketId);
  if (!sock0 || !sock1) return; // one disconnected

  room.addPlayer(sock0, p0.username, p0.characterId);
  room.addPlayer(sock1, p1.username, p1.characterId);
  rooms[code] = room;

  // Notify both players
  io.to(p0.socketId).emit('mm:matched', { roomCode: code, mode: isRanked ? 'ranked' : 'casual', opponent: p1.username });
  io.to(p1.socketId).emit('mm:matched', { roomCode: code, mode: isRanked ? 'ranked' : 'casual', opponent: p0.username });

  // Auto-start after brief delay
  setTimeout(() => {
    room.startGame();
  }, 3000);
}
