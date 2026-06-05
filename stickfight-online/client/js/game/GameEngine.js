/**
 * Client game engine — manages the game loop, receives server state,
 * applies client-side prediction, and drives the renderer.
 */
class GameEngine {
  constructor(canvas, particleCanvas) {
    this.renderer     = new Renderer(canvas, particleCanvas);
    this.hud          = null; // set by GameScreen
    this.dmgNumbers   = null;
    this.announcer    = null;
    this.ultimateEffect = new UltimateEffect();

    this.running      = false;
    this.rafId        = null;
    this.lastTime     = 0;

    this.gameState    = null;
    this.mySlot       = 0;
    this.roomCode     = '';
    this.mode         = 'online'; // online | training

    this.showHitboxes = false;

    // Input send rate (every N ms)
    this._inputInterval = null;
    this._INPUT_RATE    = 16; // ~60/s
  }

  init(roomCode, mySlot, mode = 'online') {
    this.roomCode = roomCode;
    this.mySlot   = mySlot;
    this.mode     = mode;
    this.running  = true;
    this.renderer.init();
    this._startInputLoop();
    this._loop(0);
  }

  stop() {
    this.running = false;
    if (this.rafId)       cancelAnimationFrame(this.rafId);
    if (this._inputInterval) clearInterval(this._inputInterval);
    this.ultimateEffect._cleanup();
  }

  // Receive authoritative state from server
  applyServerState(snapshot) {
    this.gameState = snapshot;
    // Process events for effects
    this.renderer.processEvents(snapshot.events, snapshot);
    // Update HUD
    if (this.hud && snapshot.players) {
      this.hud.update(snapshot.players, snapshot.roundTimer, snapshot.round, snapshot.roundScores);
    }
  }

  onUltimate(data) {
    const char = CharacterRegistry.get(data.charId);
    if (!char) return;
    this.ultimateEffect.play(char.ultimateName, char.glowColor);
    Camera.shake(18, 0.8);
    Utils.flash('gold');
  }

  // ─── Game loop ────────────────────────────────────────────────────────────

  _loop(ts) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this._loop(t));

    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    this.renderer.render(dt, this.gameState, this.mySlot, this.showHitboxes);
  }

  // ─── Input loop ───────────────────────────────────────────────────────────

  _startInputLoop() {
    this._inputInterval = setInterval(() => {
      if (!this.running || this.mode !== 'online') return;
      const snap = InputHandler.getSnapshot();
      SocketClient.emit('game:input', { roomCode: this.roomCode, input: snap });
    }, this._INPUT_RATE);
  }

  // ─── Training mode ────────────────────────────────────────────────────────

  startTraining(playerCharId, dummyCharId = 'ryoku') {
    this.mode      = 'training';
    this.mySlot    = 0;
    this.roomCode  = '';
    this.running   = true;
    this.renderer.init();

    const FLOOR_Y = 520;
    const char0   = CharacterRegistry.get(playerCharId);
    const char1   = CharacterRegistry.get(dummyCharId);

    // Build local state
    this.gameState = {
      phase: 'fighting',
      roundTimer: 999,
      players: [
        { slot: 0, characterId: playerCharId, x: 300, y: FLOOR_Y, vx: 0, vy: 0, facing: 1, hp: char0.maxHp, maxHp: char0.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', blocking: false, onGround: true, stunTime: 0, iFrames: 0, currentAttack: null, weight: char0.weight, comboCount: 0, specialCooldown: 0, ultimateCooldown: 0, ultimateActive: false },
        { slot: 1, characterId: dummyCharId,  x: 900, y: FLOOR_Y, vx: 0, vy: 0, facing: -1, hp: char1.maxHp, maxHp: char1.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', blocking: false, onGround: true, stunTime: 0, iFrames: 0, currentAttack: null, weight: char1.weight, comboCount: 0, specialCooldown: 0, ultimateCooldown: 0, ultimateActive: false },
      ],
      events: [],
    };

    this._trainingLoop(0);
  }

  _trainingLoop(ts) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this._trainingLoop(t));

    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    // Simulate local player
    const pState  = this.gameState.players[0];
    const char    = CharacterRegistry.get(pState.characterId);
    const input   = InputHandler.getSnapshot();
    const FLOOR_Y = 520;
    const GRAVITY = 1800;

    if (pState.stunTime > 0) pState.stunTime = Math.max(0, pState.stunTime - dt * 1000);

    if (pState.stunTime <= 0) {
      const speed = char.speed;
      if (input.left)  { pState.vx = -speed; pState.facing = -1; pState.state = 'run'; }
      else if (input.right) { pState.vx = speed; pState.facing = 1; pState.state = 'run'; }
      else { pState.vx *= 0.75; if (Math.abs(pState.vx) < 5) pState.vx = 0; if (pState.state === 'run') pState.state = 'idle'; }

      if (input.jumpJustPressed) {
        if (pState.onGround) { pState.vy = char.jumpForce; pState.onGround = false; pState.jumps = 1; pState.state = 'jump'; }
        else if (pState.jumps === 1) { pState.vy = char.jumpForce * 0.85; pState.jumps = 2; }
      }

      pState.blocking = !!(input.block && pState.onGround);
      if (pState.blocking) pState.state = 'block';
      else if (pState.state === 'block') pState.state = 'idle';

      if (input.dashJustPressed) {
        pState.vx = pState.facing * speed * 2.5;
        this.renderer.particles.spawnDash(pState.x, pState.y - 40, pState.facing, char.accentColor);
      }

      if (input.punch && !pState.blocking) { pState.state = 'attack'; pState.currentAttack = pState.onGround ? 'punch' : 'air'; }
      else if (input.kick && !pState.blocking) { pState.state = 'attack'; pState.currentAttack = 'kick'; }
    }

    // Physics
    if (!pState.onGround) pState.vy = Math.min(pState.vy + GRAVITY * (pState.weight || 1) * dt, 1200);
    pState.x += pState.vx * dt;
    pState.y += pState.vy * dt;
    if (pState.y >= FLOOR_Y) { pState.y = FLOOR_Y; pState.vy = 0; pState.onGround = true; pState.jumps = 0; if (pState.state === 'jump') pState.state = 'idle'; }
    else pState.onGround = false;
    if (pState.x < 50) pState.x = 50;
    if (pState.x > 1150) pState.x = 1150;

    // HP reset if dummy dies
    const dummy = this.gameState.players[1];
    if (dummy.hp <= 0) {
      const dc = CharacterRegistry.get(dummy.characterId);
      dummy.hp = dc.maxHp;
      dummy.x  = 900;
      dummy.y  = FLOOR_Y;
      dummy.state = 'idle';
      dummy.stunTime = 0;
    }

    // Update training HUD
    if (this.hud) {
      this.hud.updateTraining(this.gameState.players);
    }

    this.renderer.render(dt, this.gameState, 0, this.showHitboxes);
  }

  resetTraining() {
    if (!this.gameState) return;
    const FLOOR_Y = 520;
    this.gameState.players.forEach((p, i) => {
      const ch = CharacterRegistry.get(p.characterId);
      p.x = i === 0 ? 300 : 900;
      p.y = FLOOR_Y;
      p.vx = 0; p.vy = 0;
      p.hp = ch.maxHp;
      p.state = 'idle';
      p.onGround = true;
      p.stunTime = 0;
      p.energy = 0;
    });
  }
}

window.GameEngine = GameEngine;
