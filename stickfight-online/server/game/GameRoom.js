const { TICK_MS, MAX_ROUNDS, ROUND_TIME } = require('../config');
const { createGameState, resetRound } = require('./GameState');
const { integrate, applyInput, tickCooldowns } = require('./PhysicsEngine');
const { processAttack, processSpecial, processUltimate, applyHit } = require('./CombatEngine');
const { getCharacter } = require('./characters/index');
const AntiCheat = require('./AntiCheat');

const ATTACK_COOLDOWN = 350; // ms between attacks
const ATTACK_ACTIVE   = 200; // ms hitbox is live
const COMBO_WINDOW    = 600; // ms to continue combo
const COUNTDOWN_TICKS = 180; // 3 seconds at 60fps

class GameRoom {
  constructor(roomCode, io) {
    this.roomCode  = roomCode;
    this.io        = io;
    this.players   = [];    // [{ socketId, username, characterId, slot }]
    this.spectators= [];
    this.gameState = null;
    this.ticker    = null;
    this.phase     = 'lobby'; // lobby|countdown|fighting|round_end|match_end
    this.antiCheat = new AntiCheat();
    this.inputQueues = {};   // socketId -> latest input
    this.countdownTicks = 0;
  }

  // ─── Lobby ────────────────────────────────────────────────────────────────

  addPlayer(socket, username, characterId) {
    if (this.players.length >= 2) return false;
    const slot = this.players.length;
    this.players.push({ socketId: socket.id, username, characterId, slot });
    socket.join(this.roomCode);
    this.inputQueues[socket.id] = {};
    this.broadcast('room:update', this.getLobbyInfo());
    return true;
  }

  removePlayer(socketId) {
    const idx = this.players.findIndex(p => p.socketId === socketId);
    if (idx === -1) return;
    this.players.splice(idx, 1);
    this.antiCheat.reset(socketId);
    delete this.inputQueues[socketId];
    if (this.ticker) this.stopGame('disconnect');
    this.broadcast('room:update', this.getLobbyInfo());
    this.broadcast('room:player_left', { socketId });
  }

  updateCharacter(socketId, characterId) {
    const p = this.players.find(p => p.socketId === socketId);
    if (p) {
      p.characterId = characterId;
      this.broadcast('room:update', this.getLobbyInfo());
    }
  }

  getLobbyInfo() {
    return {
      roomCode: this.roomCode,
      players: this.players.map(p => ({
        slot: p.slot,
        username: p.username,
        characterId: p.characterId,
      })),
      phase: this.phase,
    };
  }

  // ─── Game start ──────────────────────────────────────────────────────────

  startGame() {
    if (this.players.length < 2) return false;
    this.gameState = createGameState(this.players);
    this.phase = 'countdown';
    this.countdownTicks = COUNTDOWN_TICKS;
    this.broadcast('game:start', {
      players: this.gameState.players.map(p => ({
        slot: p.slot,
        username: p.username,
        characterId: p.characterId,
        maxHp: p.maxHp,
      })),
      roundScores: this.gameState.roundScores,
    });
    this.ticker = setInterval(() => this.tick(), TICK_MS);
    return true;
  }

  stopGame(reason = 'ended') {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.phase = 'lobby';
    this.broadcast('game:stopped', { reason });
  }

  // ─── Main tick ───────────────────────────────────────────────────────────

  tick() {
    const gs  = this.gameState;
    const now = Date.now();
    const dt  = Math.min((now - gs.lastUpdate) / 1000, 0.05); // cap at 50ms
    gs.lastUpdate = now;
    gs.frameCount++;
    gs.events = [];

    if (this.phase === 'countdown') {
      this.countdownTicks--;
      if (this.countdownTicks <= 0) {
        this.phase = 'fighting';
        gs.phase = 'fighting';
        this.broadcast('game:fight_start', { round: gs.round });
      } else {
        const secs = Math.ceil(this.countdownTicks / 60);
        this.broadcast('game:countdown', { value: secs });
      }
      return;
    }

    if (this.phase !== 'fighting') return;

    // ── Process inputs ───────────────────────────────────────────────────
    for (const player of this.players) {
      const input    = this.inputQueues[player.socketId] || {};
      const pState   = gs.players[player.slot];
      const charDef  = getCharacter(player.characterId);
      if (!pState || pState.hp <= 0) continue;

      if (!this.antiCheat.validateInput(player.socketId, input, pState)) continue;

      const physEvents = applyInput(pState, input, charDef);
      gs.events.push(...physEvents);

      this._processAttackInput(pState, input, player, gs);
    }

    // ── Physics ──────────────────────────────────────────────────────────
    for (const pState of gs.players) {
      tickCooldowns(pState, TICK_MS);
      if (pState.hp > 0) integrate(pState, dt);
    }

    // ── Round timer ──────────────────────────────────────────────────────
    gs.roundTimer -= dt;
    if (gs.roundTimer <= 0) {
      gs.roundTimer = 0;
      this._handleTimeOut(gs);
      return;
    }

    // ── Death check ──────────────────────────────────────────────────────
    for (const pState of gs.players) {
      if (pState.hp <= 0 && pState.state !== 'dead') {
        pState.state = 'dead';
        this._endRound(gs, 1 - pState.slot);
        return;
      }
    }

    // ── Broadcast state ──────────────────────────────────────────────────
    this.broadcast('game:state', this._buildSnapshot(gs));
  }

  _processAttackInput(pState, input, player, gs) {
    const otherSlot  = 1 - player.slot;
    const defState   = gs.players[otherSlot];
    const defCharId  = this.players[otherSlot]?.characterId;
    const atkCharId  = player.characterId;

    if (!defState || defState.hp <= 0) return;

    // Ultimate
    if (input.ultimate && pState.ultimateEnergy >= 100 && pState.ultimateCooldown <= 0 && !pState.ultimateActive) {
      const hit = processUltimate(pState, defState, atkCharId, defCharId);
      if (hit) {
        applyHit(defState, pState, hit);
        pState.ultimateActive = true;
        pState.ultimateDuration = 2000;
        pState.state = 'ultimate';
        pState.damageDealt += hit.damage;
        defState.damageReceived += hit.damage;
        gs.events.push({ type: 'ultimate', slot: player.slot, x: defState.x, y: defState.y, charId: atkCharId });
        this.broadcast('game:ultimate', { slot: player.slot, charId: atkCharId, damage: hit.damage });
        return;
      }
    }

    // Ultimate active timer
    if (pState.ultimateActive) {
      pState.ultimateDuration -= TICK_MS;
      if (pState.ultimateDuration <= 0) {
        pState.ultimateActive = false;
        pState.state = 'idle';
      }
      return;
    }

    // Special
    if (input.special && pState.specialCooldown <= 0 && pState.attackCooldown <= 0) {
      const hit = processSpecial(pState, defState, atkCharId, defCharId);
      if (hit) {
        applyHit(defState, pState, hit);
        pState.state = 'special';
        pState.attackCooldown = 500;
        pState.specialCooldown = getCharacter(atkCharId).specialCooldown;
        pState.damageDealt += hit.damage;
        defState.damageReceived += hit.damage;
        gs.events.push({ type: 'special_hit', slot: player.slot, x: defState.x, y: defState.y, damage: hit.damage, blocked: hit.blocked });
      }
      return;
    }

    // Normal attacks
    const attackType = input.punch ? 'punch' : input.kick ? 'kick' : (input.punch && !pState.onGround) ? 'air' : null;
    if (!attackType) return;
    const resolvedType = !pState.onGround ? 'air' : attackType;

    if (pState.attackCooldown <= 0) {
      // Combo system
      const now = Date.now();
      if (now - pState.lastComboTime < COMBO_WINDOW && resolvedType === 'punch') {
        pState.comboCount = (pState.comboCount % 3) + 1;
      } else {
        pState.comboCount = 1;
      }
      pState.lastComboTime = now;

      const hit = processAttack(pState, defState, resolvedType, atkCharId, defCharId);
      if (hit) {
        applyHit(defState, pState, hit);
        pState.damageDealt += hit.damage;
        defState.damageReceived += hit.damage;
        gs.events.push({ type: 'hit', slot: player.slot, attackType: resolvedType, x: defState.x, y: defState.y, damage: hit.damage, blocked: hit.blocked, combo: pState.comboCount });
      }

      pState.state = 'attack';
      pState.currentAttack = resolvedType;
      pState.attackCooldown = ATTACK_COOLDOWN;
      pState.attackActive   = ATTACK_ACTIVE;
    }
  }

  _handleTimeOut(gs) {
    const [p0, p1] = gs.players;
    let winnerSlot;
    if (p0.hp > p1.hp) winnerSlot = 0;
    else if (p1.hp > p0.hp) winnerSlot = 1;
    else winnerSlot = -1; // draw
    this._endRound(gs, winnerSlot);
  }

  _endRound(gs, winnerSlot) {
    this.phase = 'round_end';
    gs.phase   = 'round_end';
    if (winnerSlot >= 0) gs.roundScores[winnerSlot]++;

    this.broadcast('game:round_end', {
      winnerSlot,
      roundScores: gs.roundScores,
      round: gs.round,
    });

    // Check match winner
    const maxScore = Math.max(...gs.roundScores);
    if (maxScore >= Math.ceil(MAX_ROUNDS / 2) || gs.round >= MAX_ROUNDS) {
      setTimeout(() => this._endMatch(gs), 3000);
    } else {
      gs.round++;
      setTimeout(() => {
        resetRound(gs);
        this.phase = 'countdown';
        this.countdownTicks = COUNTDOWN_TICKS;
        this.broadcast('game:round_start', { round: gs.round, roundScores: gs.roundScores });
      }, 3000);
    }
  }

  _endMatch(gs) {
    clearInterval(this.ticker);
    this.ticker = null;

    const [p0, p1] = gs.players;
    let winnerSlot = -1;
    if (gs.roundScores[0] > gs.roundScores[1]) winnerSlot = 0;
    else if (gs.roundScores[1] > gs.roundScores[0]) winnerSlot = 1;

    const result = {
      winnerSlot,
      roundScores: gs.roundScores,
      players: gs.players.map(p => ({
        slot: p.slot,
        username: p.username,
        characterId: p.characterId,
        damageDealt: p.damageDealt,
        damageReceived: p.damageReceived,
      })),
    };

    this.broadcast('game:match_end', result);
    this.phase = 'match_end';

    // Emit for stats update
    this.onMatchEnd?.(result, this.players);
  }

  _buildSnapshot(gs) {
    return {
      t: gs.frameCount,
      phase: gs.phase,
      roundTimer: Math.ceil(gs.roundTimer),
      players: gs.players.map(p => ({
        slot: p.slot,
        x: Math.round(p.x),
        y: Math.round(p.y),
        vx: Math.round(p.vx),
        vy: Math.round(p.vy),
        facing: p.facing,
        hp: p.hp,
        energy: Math.round(p.energy),
        ultimateEnergy: Math.round(p.ultimateEnergy),
        state: p.state,
        currentAttack: p.currentAttack,
        blocking: p.blocking,
        onGround: p.onGround,
        stunTime: p.stunTime,
        iFrames: p.iFrames,
        comboCount: p.comboCount,
        specialCooldown: p.specialCooldown,
        ultimateCooldown: p.ultimateCooldown,
        ultimateActive: p.ultimateActive,
      })),
      events: gs.events,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  setInput(socketId, input) {
    if (this.inputQueues[socketId] !== undefined) {
      this.inputQueues[socketId] = input;
    }
  }

  broadcast(event, data) {
    this.io.to(this.roomCode).emit(event, data);
  }

  isEmpty() {
    return this.players.length === 0;
  }
}

module.exports = GameRoom;
