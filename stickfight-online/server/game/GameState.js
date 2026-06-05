const { FLOOR_Y, STAGE_WIDTH, ROUND_TIME } = require('../config');
const { getCharacter } = require('./characters/index');

/**
 * Creates a fresh player state for a match.
 */
function createPlayerState(slot, characterId, username) {
  const char = getCharacter(characterId);
  return {
    slot,
    username,
    characterId,
    // Position
    x: slot === 0 ? 250 : STAGE_WIDTH - 250,
    y: FLOOR_Y,
    vx: 0,
    vy: 0,
    facing: slot === 0 ? 1 : -1,
    onGround: true,
    jumps: 0,
    // Health / energy
    hp: char.maxHp,
    maxHp: char.maxHp,
    energy: 0,
    ultimateEnergy: 0,
    // State
    state: 'idle',  // idle|run|jump|attack|hit|block|special|ultimate|dead
    currentAttack: null,
    blocking: false,
    crouching: false,
    // Timers (ms)
    stunTime: 0,
    iFrames: 0,
    attackCooldown: 0,
    attackActive: 0,
    specialCooldown: 0,
    ultimateCooldown: 0,
    dashCooldown: 0,
    // Combo
    comboCount: 0,
    lastComboTime: 0,
    // Weight (from char def)
    weight: char.weight,
    // Round stats
    damageDealt: 0,
    damageReceived: 0,
    // Flags
    ultimateActive: false,
    ultimateDuration: 0,
  };
}

/**
 * Creates the full game state for a room.
 */
function createGameState(players) {
  return {
    phase: 'countdown',  // countdown|fighting|round_end|match_end
    roundTimer: ROUND_TIME,
    round: 1,
    roundScores: [0, 0],
    frameCount: 0,
    lastUpdate: Date.now(),
    players: players.map((p, i) => createPlayerState(i, p.characterId, p.username)),
    events: [],          // transient events flushed each tick
  };
}

/**
 * Reset player positions for a new round.
 */
function resetRound(gameState) {
  gameState.phase = 'countdown';
  gameState.roundTimer = ROUND_TIME;
  gameState.events = [];
  gameState.players.forEach((p, i) => {
    const char = getCharacter(p.characterId);
    p.x = i === 0 ? 250 : STAGE_WIDTH - 250;
    p.y = FLOOR_Y;
    p.vx = 0;
    p.vy = 0;
    p.facing = i === 0 ? 1 : -1;
    p.onGround = true;
    p.jumps = 0;
    p.hp = char.maxHp;
    p.energy = 0;
    p.ultimateEnergy = 0;
    p.state = 'idle';
    p.blocking = false;
    p.stunTime = 0;
    p.iFrames = 0;
    p.attackCooldown = 0;
    p.specialCooldown = 0;
    p.ultimateCooldown = 0;
    p.ultimateActive = false;
    p.comboCount = 0;
    p.damageDealt = 0;
    p.damageReceived = 0;
  });
}

module.exports = { createGameState, createPlayerState, resetRound };
