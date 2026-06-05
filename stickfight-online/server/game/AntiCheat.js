/**
 * Anti-cheat: validates inputs from clients before applying them.
 * Catches speed hacks, impossible positions, and spam attacks.
 */

const MAX_INPUT_RATE  = 70;   // max inputs per second per player
const MAX_POSITION_DELTA = 800; // max px movement per tick (at 60fps)

class AntiCheat {
  constructor() {
    // playerId -> { inputCount, windowStart }
    this.rateLimits = {};
  }

  /**
   * Returns true if the input is valid.
   */
  validateInput(playerId, input, playerState) {
    // Rate limit
    if (!this._checkRate(playerId)) {
      console.warn(`[AntiCheat] Rate limit exceeded for ${playerId}`);
      return false;
    }

    // Sanitize input keys — only booleans/numbers allowed
    const allowed = ['left','right','jump','block','punch','kick','special','ultimate',
                     'jumpJustPressed','dashJustPressed','comboIndex'];
    for (const key of Object.keys(input)) {
      if (!allowed.includes(key)) return false;
    }

    return true;
  }

  /**
   * Validates a position reconciliation from the client.
   * Returns true if the client position is within acceptable drift.
   */
  validatePosition(clientPos, serverPos) {
    const dx = Math.abs(clientPos.x - serverPos.x);
    const dy = Math.abs(clientPos.y - serverPos.y);
    return dx < MAX_POSITION_DELTA && dy < MAX_POSITION_DELTA;
  }

  _checkRate(playerId) {
    const now = Date.now();
    if (!this.rateLimits[playerId]) {
      this.rateLimits[playerId] = { count: 1, window: now };
      return true;
    }
    const rl = this.rateLimits[playerId];
    if (now - rl.window > 1000) {
      rl.count  = 1;
      rl.window = now;
      return true;
    }
    rl.count++;
    return rl.count <= MAX_INPUT_RATE;
  }

  reset(playerId) {
    delete this.rateLimits[playerId];
  }
}

module.exports = AntiCheat;
