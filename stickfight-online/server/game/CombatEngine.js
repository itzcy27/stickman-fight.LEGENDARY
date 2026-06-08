const { getCharacter } = require('./characters/index');

const BLOCK_REDUCTION = 0.15;
const HITSTUN_BASE    = 300;
const IFRAME_DURATION = 500;

function processAttack(attackerState, defenderState, attackType, attackerCharId, defenderCharId) {
  const atkChar = getCharacter(attackerCharId);
  const defChar = getCharacter(defenderCharId);

  if (!canAttack(attackerState)) return null;
  if (defenderState.iFrames > 0) return null;

  const hitbox  = getAttackHitbox(attackerState, atkChar, attackType);
  if (!hitbox) return null;

  const hurtbox = getHurtbox(defenderState, defChar);
  if (!overlaps(hitbox, hurtbox)) return null;

  let baseDmg = getBaseDamage(attackType, atkChar);
  let damage  = Math.round(baseDmg * defChar.defenseRating);

  const blocked = defenderState.blocking && defenderState.onGround;
  if (blocked) damage = Math.max(1, Math.round(damage * BLOCK_REDUCTION));

  const kbDir   = attackerState.x < defenderState.x ? 1 : -1;
  const kbForce = getKnockback(attackType, atkChar) * (blocked ? 0.3 : 1);
  const stunDuration = blocked ? 100 : HITSTUN_BASE + damage * 4;

  return {
    damage,
    blocked,
    knockbackX: kbDir * kbForce,
    knockbackY: -200,
    stunDuration,
    attackType,
    iFrames: IFRAME_DURATION,
  };
}

function processSpecial(attackerState, defenderState, attackerCharId, defenderCharId) {
  const atkChar = getCharacter(attackerCharId);
  const defChar = getCharacter(defenderCharId);

  if (attackerState.specialCooldown > 0) return null;
  if (defenderState.iFrames > 0) return null;

  const hitbox  = getSpecialHitbox(attackerState, atkChar);
  const hurtbox = getHurtbox(defenderState, defChar);
  if (!overlaps(hitbox, hurtbox)) return null;

  const blocked = defenderState.blocking && defenderState.onGround;
  let damage = Math.round(atkChar.specialDamage * defChar.defenseRating);
  if (blocked) damage = Math.max(1, Math.round(damage * BLOCK_REDUCTION));

  const kbDir = attackerState.x < defenderState.x ? 1 : -1;
  return {
    damage,
    blocked,
    knockbackX: kbDir * 550,
    knockbackY: -350,
    stunDuration: blocked ? 150 : 500,
    attackType: 'special',
    iFrames: IFRAME_DURATION,
    cooldownReset: true,
  };
}

function processUltimate(attackerState, defenderState, attackerCharId, defenderCharId) {
  const atkChar = getCharacter(attackerCharId);
  const defChar = getCharacter(defenderCharId);

  if (attackerState.energy < atkChar.ultimateCost) return null;
  if (attackerState.ultimateCooldown > 0) return null;

  const damage = Math.round(atkChar.ultimateDamage * defChar.defenseRating);
  const kbDir  = attackerState.x < defenderState.x ? 1 : -1;

  return {
    damage,
    blocked: false,
    knockbackX: kbDir * 700,
    knockbackY: -500,
    stunDuration: 900,
    attackType: 'ultimate',
    iFrames: IFRAME_DURATION,
    energyCost: atkChar.ultimateCost,
    ultimateCooldown: 15000,
  };
}

function applyHit(defenderState, attackerState, hit) {
  defenderState.hp        = Math.max(0, defenderState.hp - hit.damage);
  defenderState.vx        = hit.knockbackX;
  defenderState.vy        = hit.knockbackY;
  defenderState.stunTime  = hit.stunDuration;
  defenderState.iFrames   = hit.iFrames;
  defenderState.onGround  = false;
  defenderState.state     = 'hit';

  if (!hit.blocked) {
    attackerState.energy         = Math.min(100, attackerState.energy + hit.damage * 0.8);
    attackerState.ultimateEnergy = Math.min(100, attackerState.ultimateEnergy + hit.damage * 0.6);
  }

  if (hit.cooldownReset) {
    attackerState.specialCooldown = getCharacter(attackerState.characterId)?.specialCooldown || 5000;
  }

  if (hit.ultimateCooldown) {
    attackerState.energy = 0;
    attackerState.ultimateCooldown = hit.ultimateCooldown;
  }
}

function canAttack(state) {
  // attackCooldown is the sole gate — attackActive check removed
  // because it prevented hits from registering on the same tick
  return state.attackCooldown <= 0 &&
         state.stunTime <= 0 &&
         !state.blocking;
}

function getBaseDamage(type, char) {
  switch (type) {
    case 'punch': return char.punchDamage;
    case 'kick':  return char.kickDamage;
    case 'air':   return char.airDamage;
    default:      return char.punchDamage;
  }
}

function getKnockback(type, char) {
  const base = { punch: 280, kick: 360, air: 300 };
  return (base[type] || 280) * char.knockbackMul;
}

function getAttackHitbox(state, char, type) {
  const hb = char.hitboxes[type] || char.hitboxes.punch;
  const ox = hb.ox * state.facing;
  return {
    x: state.x + ox - hb.w / 2,
    y: state.y + hb.oy - hb.h / 2,
    w: hb.w,
    h: hb.h,
  };
}

function getSpecialHitbox(state, char) {
  return {
    x: state.x + 50 * state.facing - 60,
    y: state.y - 80,
    w: 120,
    h: 100,
  };
}

function getHurtbox(state, char) {
  const hb = state.crouching ? char.hitboxes.crouch : char.hitboxes.stand;
  return {
    x: state.x - hb.w / 2,
    y: state.y - hb.h,
    w: hb.w,
    h: hb.h,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

module.exports = { processAttack, processSpecial, processUltimate, applyHit };
