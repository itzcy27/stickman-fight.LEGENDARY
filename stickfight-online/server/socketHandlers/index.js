const registerAuthHandlers        = require('./authHandler');
const registerRoomHandlers        = require('./roomHandler');
const registerMatchmakingHandlers = require('./matchmakingHandler');
const registerGameHandlers        = require('./gameHandler');

module.exports = function registerAllHandlers(socket, io) {
  registerAuthHandlers(socket, io);
  registerRoomHandlers(socket, io);
  registerMatchmakingHandlers(socket, io);
  registerGameHandlers(socket, io);
};
