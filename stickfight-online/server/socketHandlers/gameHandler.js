const { getRooms } = require('./roomHandler');

module.exports = function registerGameHandlers(socket, io) {

  // Client sends input every frame
  socket.on('game:input', ({ roomCode, input }) => {
    if (!roomCode || !input) return;
    const rooms = getRooms();
    const room  = rooms[roomCode.toUpperCase()];
    if (!room) return;
    room.setInput(socket.id, input);
  });

  // Client requests full state resync (reconnection)
  socket.on('game:resync', ({ roomCode }) => {
    if (!roomCode) return;
    const rooms = getRooms();
    const room  = rooms[roomCode.toUpperCase()];
    if (!room || !room.gameState) return;
    socket.emit('game:state', room._buildSnapshot(room.gameState));
    socket.emit('room:update', room.getLobbyInfo());
  });
};
