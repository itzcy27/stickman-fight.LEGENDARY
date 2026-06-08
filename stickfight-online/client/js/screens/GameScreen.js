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

    this._inputInterval = null;
    this._INPUT_RATE    = 16;
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
    if (this.rafId)          cancelAnimationFrame(this.rafId);
    if (this._inputInterval) clearInterval(this._inputInterval);
    this.ultimateEffect._cleanup();
  }

  applyServerState(snapshot) {
    this.gameState = snapshot;
    this.renderer.processEvents(snapshot.events, snapshot);
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
    this.mode     = 'training';
    this.mySlot   = 0;
    this.roomCode = '';
    this.running  = true;
    this.renderer.init();

    const FLOOR_Y = 520;
    const char0   = CharacterRegistry.get(playerCharId);
    const char1   = CharacterRegistry.get(dummyCharId);

    this.gameState = {
      phase: 'fighting',
      roundTimer: 999,
      players: [
        { slot: 0, characterId: playerCharId, x: 300, y: FLOOR_Y, vx: 0, vy: 0, facing: 1,  hp: char0.maxHp, maxHp: char0.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', blocking: false, onGround: true, stunTime: 0, iFrames: 0, currentAttack: null, weight: char0.weight, comboCount: 0, specialCooldown: 0, ultimateCooldown: 0, ultimateActive: false },
        { slot: 1, characterId: dummyCharId,  x: 900, y: FLOOR_Y, vx: 0, vy: 0, facing: -1, hp: char1.maxHp, maxHp: char1.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', blocking: false, onGround: true, stunTime: 0, iFrames: 0, currentAttack: null, weight: char1.weight, comboCount: 0, specialCooldown: 0, ultimateCooldown: 0, ultimateActive: false },
      ],
      events: [],
    };

    this._trainingLoop(0);
  }

  resetTraining() {
    if (!this.gameState) return;
    const FLOOR_Y = 520;
    const [p0, p1] = this.gameState.players;
    const char0 = CharacterRegistry.get(p0.characterId);
    const char1 = CharacterRegistry.get(p1.characterId);
    Object.assign(p0, { x: 300, y: FLOOR_Y, vx: 0, vy: 0, hp: char0.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', stunTime: 0, iFrames: 0, attackCooldown: 0, onGround: true });
    Object.assign(p1, { x: 900, y: FLOOR_Y, vx: 0, vy: 0, hp: char1.maxHp, energy: 0, ultimateEnergy: 0, state: 'idle', stunTime: 0, iFrames: 0, attackCooldown: 0, onGround: true });
  }

  _trainingLoop(ts) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this._trainingLoop(t));

    const dt  = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    const pState    = this.gameState.players[0];
    const dummy     = this.gameState.players[1];
    const char      = CharacterRegistry.get(pState.characterId);
    const dummyChar = CharacterRegistry.get(dummy.characterId);
    const input     = InputHandler.getSnapshot();
    const FLOOR_Y   = 520;
    const GRAVITY   = 1800;
    const dtMs      = dt * 1000;

    // ── Tick cooldowns ───────────────────────────────────────────────────
    if (pState.stunTime      > 0) pState.stunTime      = Math.max(0, pState.stunTime      - dtMs);
    if (pState.attackCooldown> 0) pState.attackCooldown= Math.max(0, pState.attackCooldown- dtMs);
    if (pState.iFrames       > 0) pState.iFrames       = Math.max(0, pState.iFrames       - dtMs);
    if (dummy.stunTime       > 0) dummy.stunTime       = Math.max(0, dummy.stunTime       - dtMs);
    if (dummy.iFrames        > 0) dummy.iFrames        = Math.max(0, dummy.iFrames        - dtMs);

    // ── Input → movement ────────────────────────────────────────────────
    if (pState.stunTime <= 0) {
      const speed = char.speed;

      if (input.left)       { pState.vx = -speed; pState.facing = -1; if (pState.onGround) pState.state = 'run'; }
      else if (input.right) { pState.vx =  speed; pState.facing =  1; if (pState.onGround) pState.state = 'run'; }
      else { pState.vx *= 0.75; if (Math.abs(pState.vx) < 5) pState.vx = 0; if (pState.state === 'run') pState.state = 'idle'; }

      if (input.jumpJustPressed) {
        if (pState.onGround)       { pState.vy = char.jumpForce; pState.onGround = false; pState.jumps = 1; pState.state = 'jump'; }
        else if (pState.jumps === 1) { pState.vy = char.jumpForce * 0.85; pState.jumps = 2; }
      }

      pState.blocking = !!(input.block && pState.onGround);
      if (pState.blocking)              pState.state = 'block';
      else if (pState.state === 'block') pState.state = 'idle';

      if (input.dashJustPressed) {
        pState.vx = pState.facing * speed * 2.5;
        this.renderer.particles.spawnDash(pState.x, pState.y - 40, pState.facing, char.accentColor);
      }

      // ── Attack input ─────────────────────────────────────────────────
      if (!pState.blocking && pState.attackCooldown <= 0 && dummy.iFrames <= 0) {
        let attackType = null;
        if (input.punch)                               attackType = pState.onGround ? 'punch' : 'air';
        else if (input.kick)                           attackType = 'kick';
        else if (input.special)                        attackType = 'special';
        else if (input.ultimate && pState.ultimateEnergy >= 100) attackType = 'ultimate';

        if (attackType) {
          const dist    = Math.abs(pState.x - dummy.x);
          const range   = (attackType === 'special' || attackType === 'ultimate') ? 200 : 120;
          const inRange = dist < range;

          if (inRange) {
            const dmgMap = {
              punch:    char.punchDamage,
              kick:     char.kickDamage,
              air:      char.airDamage,
              special:  char.specialDamage,
              ultimate: char.ultimateDamage,
            };
            const dmg  = dmgMap[attackType] || char.punchDamage;
            const kbDir = pState.x < dummy.x ? 1 : -1;

            dummy.hp       = Math.max(0, dummy.hp - dmg);
            dummy.state    = 'hit';
            dummy.stunTime = attackType === 'ultimate' ? 900 : attackType === 'special' ? 500 : 300;
            dummy.iFrames  = 500;
            dummy.vx       = kbDir * (attackType === 'ultimate' ? 700 : attackType === 'special' ? 550 : 280);
            dummy.vy       = attackType === 'ultimate' ? -500 : -180;
            dummy.onGround = false;

            pState.energy         = Math.min(100, (pState.energy         || 0) + dmg * 0.8);
            pState.ultimateEnergy = Math.min(100, (pState.ultimateEnergy || 0) + dmg * 0.6);

            if (attackType === 'ultimate') {
              pState.ultimateEnergy = 0;
              this.ultimateEffect.play(char.ultimateName, char.glowColor);
              Camera.shake(16, 0.8);
              Utils.flash('gold');
              this.renderer.particles.spawnUltimate(dummy.x, dummy.y - 50, char.glowColor, 30);
            } else if (attackType === 'special') {
              Camera.shake(8);
              Utils.flash('red');
              this.renderer.particles.spawnUltimate(dummy.x, dummy.y - 40, char.accentColor, 12);
            } else {
              this.renderer.hitSparks.spawn(dummy.x, dummy.y - 40, attackType, false);
              this.renderer.particles.spawnHitSpark(dummy.x, dummy.y - 40, char.color, 8);
              Camera.shake(5);
            }
          }

          pState.state         = attackType === 'ultimate' ? 'ultimate' : attackType === 'special' ? 'special' : 'attack';
          pState.currentAttack  = attackType;
          pState.attackCooldown = attackType === 'ultimate' ? 800 : attackType === 'special' ? 500 : 350;
        }
      }

      // Clear attack state when cooldown expires
      if (pState.attackCooldown <= 0 && (pState.state === 'attack' || pState.state === 'special' || pState.state === 'ultimate')) {
        pState.state         = pState.onGround ? 'idle' : 'jump';
        pState.currentAttack = null;
      }
    }

    // ── Physics — player ────────────────────────────────────────────────
    if (!pState.onGround) pState.vy = Math.min(pState.vy + GRAVITY * (char.weight || 1) * dt, 1200);
    pState.x += pState.vx * dt;
    pState.y += pState.vy * dt;
    if (pState.y >= FLOOR_Y) { pState.y = FLOOR_Y; pState.vy = 0; pState.onGround = true; pState.jumps = 0; if (pState.state === 'jump') pState.state = 'idle'; }
    else pState.onGround = false;
    if (pState.x < 50)   pState.x = 50;
    if (pState.x > 1150) pState.x = 1150;
    if (pState.onGround) { pState.vx *= 0.75; if (Math.abs(pState.vx) < 5) pState.vx = 0; }

    // ── Physics — dummy ──────────────────────────────────────────────────
    if (dummy.stunTime <= 0 && dummy.state === 'hit') dummy.state = 'idle';
    if (!dummy.onGround) dummy.vy = Math.min(dummy.vy + GRAVITY * (dummyChar.weight || 1) * dt, 1200);
    dummy.x += dummy.vx * dt;
    dummy.y += dummy.vy * dt;
    if (dummy.y >= FLOOR_Y) { dummy.y = FLOOR_Y; dummy.vy = 0; dummy.onGround = true; }
    else dummy.onGround = false;
    if (dummy.x < 50)   dummy.x = 50;
    if (dummy.x > 1150) dummy.x = 1150;
    if (dummy.onGround) { dummy.vx *= 0.75; if (Math.abs(dummy.vx) < 5) dummy.vx = 0; }
    dummy.facing = dummy.x > pState.x ? -1 : 1;

    // HP reset if dummy KO'd
    if (dummy.hp <= 0) {
      dummy.hp      = dummyChar.maxHp;
      dummy.x       = 900;
      dummy.y       = FLOOR_Y;
      dummy.vx      = 0;
      dummy.vy      = 0;
      dummy.state   = 'idle';
      dummy.stunTime = 0;
      dummy.iFrames  = 0;
      this.renderer.particles.spawnKO(dummy.x, dummy.y - 60);
    }

    if (this.hud) this.hud.updateTraining(this.gameState.players);

    this.gameState.events = [];
    this.renderer.render(dt, this.gameState, 0, this.showHitboxes);
  }
}

window.GameEngine = GameEngine;
