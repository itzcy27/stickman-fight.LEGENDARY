const store = require('../data/store');

module.exports = function registerAuthHandlers(socket, io) {

  // Register / Login combined — if username doesn't exist, create it
  socket.on('auth:login', ({ username }) => {
    if (!username || typeof username !== 'string') {
      return socket.emit('auth:error', { message: 'Invalid username.' });
    }
    const clean = username.trim().slice(0, 20);
    if (clean.length < 2) {
      return socket.emit('auth:error', { message: 'Username must be at least 2 characters.' });
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(clean)) {
      return socket.emit('auth:error', { message: 'Username can only contain letters, numbers, _ and -.' });
    }

    let user = store.getUser(clean);
    const isNew = !user;
    if (!user) user = store.createUser(clean);

    store.setSession(socket.id, clean);
    socket.emit('auth:success', { user, isNew });
  });

  socket.on('auth:get_profile', () => {
    const username = store.getSession(socket.id);
    if (!username) return socket.emit('auth:error', { message: 'Not logged in.' });
    const user = store.getUser(username);
    if (!user) return socket.emit('auth:error', { message: 'User not found.' });
    socket.emit('auth:profile', { user });
  });

  socket.on('auth:update_character', ({ characterId }) => {
    const username = store.getSession(socket.id);
    if (!username) return;
    store.updateUser(username, { settings: { selectedCharacter: characterId } });
  });

  socket.on('auth:leaderboard', () => {
    const { getLeaderboard } = require('../ranked/Leaderboard');
    socket.emit('auth:leaderboard_data', { leaderboard: getLeaderboard(20) });
  });
};
