const MAX_INPUT_RATE     = 120; // max inputs per second per player
const MAX_POSITION_DELTA = 800;

class AntiCheat {
  constructor() {
    this.rateLimits = {};
  }

  validateInput(playerId, input, playerState) {
    if (!this._checkRate(playerId)) {
      console.warn(`[AntiCheat] Rate limit exceeded for ${playerId}`);
      return false;
    }

    const allowed = ['left','right','jump','block','punch','kick','special','ultimate',
                     'punchHeld','kickHeld','specialHeld','ultimateHeld',
                     'jumpJustPressed','dashJustPressed','dashDir','comboIndex'];
    for (const key of Object.keys(input)) {
      if (!allowed.includes(key)) return false;
    }

    return true;
  }

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
