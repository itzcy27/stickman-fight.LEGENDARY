const store = require('../data/store');

function getLeaderboard(limit = 20) {
  return store.getLeaderboard(limit);
}

module.exports = { getLeaderboard };
