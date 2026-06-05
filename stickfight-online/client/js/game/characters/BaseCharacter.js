/**
 * Client-side base character — mirrors server BaseCharacter.
 * Also holds rendering helpers for drawing the stickman.
 */
class BaseCharacter {
  constructor(cfg) {
    this.id          = cfg.id;
    this.name        = cfg.name;
    this.color       = cfg.color;
    this.accentColor = cfg.accentColor;
    this.glowColor   = cfg.glowColor || cfg.color;

    // Stats
    this.maxHp         = cfg.maxHp        || 100;
    this.speed         = cfg.speed        || 380;
    this.jumpForce     = cfg.jumpForce    || -720;
    this.weight        = cfg.weight       || 1.0;
    this.punchDamage   = cfg.punchDamage  || 7;
    this.kickDamage    = cfg.kickDamage   || 12;
    this.airDamage     = cfg.airDamage    || 9;
    this.knockbackMul  = cfg.knockbackMul || 1.0;
    this.defenseRating = cfg.defenseRating|| 1.0;

    // Special
    this.specialDamage    = cfg.specialDamage    || 18;
    this.specialCooldown  = cfg.specialCooldown  || 6000;
    this.ultimateDamage   = cfg.ultimateDamage   || 45;
    this.ultimateCost     = cfg.ultimateCost     || 100;
    this.specialName      = cfg.specialName      || 'Special';
    this.ultimateName     = cfg.ultimateName     || 'Ultimate';
    this.ultimateDesc     = cfg.ultimateDesc     || '';

    // Visual
    this.bodyScale   = cfg.bodyScale   || 1.0;
    this.headRadius  = cfg.headRadius  || 14;
    this.limbWidth   = cfg.limbWidth   || 4;
    this.bodyLength  = cfg.bodyLength  || 42;
    this.legLength   = cfg.legLength   || 38;
    this.armLength   = cfg.armLength   || 32;

    // Stat ratings for UI bars (0-1)
    this.statRatings = cfg.statRatings || {
      speed:    0.5,
      power:    0.5,
      defense:  0.5,
      mobility: 0.5,
    };
  }

  // ─── Draw stickman ──────────────────────────────────────────────────────
  /**
   * Draw the character on ctx at (cx, cy) = center base (feet).
   * state: player state object from server snapshot
   * preview: if true, draw in neutral pose regardless of state
   */
  draw(ctx, cx, cy, state, preview = false) {
    ctx.save();
    const facing = state?.facing ?? 1;
    // Flip the canvas around the character's center x
    ctx.translate(cx, 0);
    ctx.scale(facing, 1);
    ctx.translate(-cx, 0);
    const x = cx; // x is now in local (pre-flip) space

    const t = Date.now() / 1000;
    const pose = preview ? 'idle' : (state?.state || 'idle');

    // Limb angles
    let bodyLean = 0;
    let lArmAngle = -0.4, rArmAngle = 0.4;
    let lLegAngle = 0.15, rLegAngle = -0.15;
    let headBob = 0;
    let legSpread = 0;

    if (pose === 'run') {
      const cycle = Math.sin(t * 14) * 0.5;
      lLegAngle  =  0.5 + cycle;
      rLegAngle  = -0.5 - cycle;
      lArmAngle  =  0.3 - cycle * 0.6;
      rArmAngle  = -0.3 + cycle * 0.6;
      bodyLean   =  0.12;
      headBob    = Math.abs(Math.sin(t * 14)) * 2;
    } else if (pose === 'jump') {
      lLegAngle  = -0.3;
      rLegAngle  =  0.3;
      lArmAngle  = -0.8;
      rArmAngle  =  0.8;
      bodyLean   = -0.1;
    } else if (pose === 'attack') {
      const attack = state?.currentAttack || 'punch';
      if (attack === 'punch') {
        rArmAngle = -1.2;
        lArmAngle =  0.3;
        bodyLean  =  0.25;
      } else if (attack === 'kick') {
        rLegAngle = -1.1;
        lLegAngle =  0.1;
        bodyLean  =  0.2;
        rArmAngle =  0.5;
        lArmAngle = -0.3;
      } else {
        // air
        lArmAngle = -1.0;
        rArmAngle = -0.8;
        lLegAngle =  0.6;
        rLegAngle = -0.4;
      }
    } else if (pose === 'block') {
      lArmAngle =  0.1;
      rArmAngle = -0.1;
      lLegAngle =  0.3;
      rLegAngle = -0.3;
      legSpread =  4;
      bodyLean  = -0.1;
    } else if (pose === 'hit') {
      bodyLean  = -0.4;
      lArmAngle =  0.9;
      rArmAngle = -0.9;
      lLegAngle = -0.2;
      rLegAngle =  0.4;
    } else if (pose === 'dead') {
      bodyLean  =  1.5;
      lArmAngle =  0.8;
      rArmAngle =  0.5;
      lLegAngle =  0.3;
      rLegAngle =  0.6;
    } else if (pose === 'special' || pose === 'ultimate') {
      bodyLean  = -0.3;
      lArmAngle = -1.4;
      rArmAngle = -1.2;
      lLegAngle =  0.4;
      rLegAngle = -0.4;
    } else {
      // idle breathe
      headBob = Math.sin(t * 1.5) * 1.5;
    }

    const hr = this.headRadius;
    const bl = this.bodyLength;
    const ll = this.legLength;
    const al = this.armLength;
    const lw = this.limbWidth;

    // IFrame flicker
    if (state?.iFrames > 0 && Math.sin(t * 40) > 0) {
      ctx.restore();
      return;
    }

    // Glow when ultimate active
    if (state?.ultimateActive) {
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur  = 30;
    }

    const headY  = cy - ll - bl - hr + headBob;
    const torsoY = cy - ll;
    const neckY  = torsoY - bl;

    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(x, cy, 22, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.restore();

    // ── Legs ────────────────────────────────────────────────────────────
    this._drawLimb(ctx, x - legSpread, torsoY, lLegAngle, ll, lw, this.color);
    this._drawLimb(ctx, x + legSpread, torsoY, rLegAngle, ll, lw, this._darken(this.color));

    // ── Body ────────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(x, torsoY);
    ctx.rotate(bodyLean);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -bl);
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = lw + 1;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.restore();

    // ── Arms ────────────────────────────────────────────────────────────
    const shoulderY = neckY + bodyLean * 8;
    this._drawLimb(ctx, x - 2, shoulderY, lArmAngle + bodyLean, al, lw, this.color);
    this._drawLimb(ctx, x + 2, shoulderY, rArmAngle + bodyLean, al, lw, this._darken(this.color));

    // ── Head ────────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(x, headY);
    ctx.rotate(bodyLean * 0.5);

    // Head circle
    ctx.beginPath();
    ctx.arc(0, 0, hr, 0, Math.PI * 2);
    ctx.fillStyle   = this.color;
    ctx.fill();
    ctx.strokeStyle = this._darken(this.color);
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(6, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Energy aura when charging
    if (state?.energy > 60) {
      ctx.globalAlpha = (state.energy - 60) / 40 * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, hr + 6, 0, Math.PI * 2);
      ctx.strokeStyle = this.accentColor;
      ctx.lineWidth   = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawLimb(ctx, sx, sy, angle, length, lw, color) {
    const ex = sx + Math.sin(angle) * length;
    const ey = sy + Math.cos(angle) * length;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth   = lw;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  _darken(hex) {
    // Simple darken — returns a slightly darker colour
    try {
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.max(0, (n >> 16) - 30);
      const g = Math.max(0, ((n >> 8) & 0xff) - 30);
      const b = Math.max(0, (n & 0xff) - 30);
      return '#' + [r, g, b].map(c => c.toString(16).padStart(2,'0')).join('');
    } catch { return hex; }
  }

  // Draw small preview (for character select card thumbnails)
  drawPreview(ctx, cx, cy, scale = 0.7) {
    ctx.save();
    ctx.scale(scale, scale);
    this.draw(ctx, cx / scale, cy / scale, null, true);
    ctx.restore();
  }
}

window.BaseCharacter = BaseCharacter;
