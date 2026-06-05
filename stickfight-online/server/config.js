module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Game constants
  TICK_RATE: 60,          // server ticks per second
  TICK_MS: 1000 / 60,

  // Stage
  STAGE_WIDTH: 1200,
  STAGE_HEIGHT: 600,
  FLOOR_Y: 520,
  GRAVITY: 1800,          // px/s²
  TERMINAL_VELOCITY: 1200,

  // Match
  ROUND_TIME: 99,         // seconds
  MAX_ROUNDS: 3,
  ROUND_WIN_HP: 0,

  // ELO
  ELO_K_FACTOR: 32,
  ELO_DEFAULT: 1000,

  // Room
  ROOM_CODE_LENGTH: 6,
  MAX_PLAYERS_PER_ROOM: 2,
};
