/**
 * Base character definition shared by server and client logic.
 * All stat values are authoritative — client characters extend these.
 */
class BaseCharacter {
  constructor(cfg) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.color = cfg.color;
    this.accentColor = cfg.accentColor;

    // ── Stats ──────────────────────────────────────────────────────────────
    this.maxHp        = cfg.maxHp        || 100;
    this.speed        = cfg.speed        || 380;    // px/s
    this.jumpForce    = cfg.jumpForce    || -720;   // px/s (negative = up)
    this.weight       = cfg.weight       || 1.0;    // gravity multiplier
    this.punchDamage  = cfg.punchDamage  || 7;
    this.kickDamage   = cfg.kickDamage   || 12;
    this.airDamage    = cfg.airDamage    || 9;
    this.knockbackMul = cfg.knockbackMul || 1.0;
    this.defenseRating= cfg.defenseRating|| 1.0;    // damage received multiplier

    // ── Special ────────────────────────────────────────────────────────────
    this.specialDamage   = cfg.specialDamage   || 18;
    this.specialCooldown = cfg.specialCooldown || 6000;  // ms
    this.ultimateDamage  = cfg.ultimateDamage  || 45;
    this.ultimateCost    = cfg.ultimateCost    || 100;   // energy required

    // ── Hitboxes (relative to center) ─────────────────────────────────────
    this.hitboxes = cfg.hitboxes || {
      stand: { w: 40, h: 90 },
      crouch: { w: 40, h: 55 },
      punch:  { w: 80, h: 30, ox: 40, oy: -30 },
      kick:   { w: 90, h: 35, ox: 45, oy: 10  },
      air:    { w: 85, h: 35, ox: 42, oy: -15 },
    };

    // ── Ultimate description (for UI) ──────────────────────────────────────
    this.ultimateName = cfg.ultimateName || 'Ultimate';
    this.ultimateDesc = cfg.ultimateDesc || 'Unleashes a powerful attack.';
    this.specialName  = cfg.specialName  || 'Special';
  }
}

module.exports = BaseCharacter;
