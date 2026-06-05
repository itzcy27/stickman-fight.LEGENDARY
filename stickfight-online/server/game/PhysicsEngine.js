const { STAGE_WIDTH, FLOOR_Y, GRAVITY, TERMINAL_VELOCITY } = require('../config');

const WALL_LEFT  = 50;
const WALL_RIGHT = STAGE_WIDTH - 50;

/**
 * Integrate one player's physics for `dt` seconds.
 * Mutates the player state object in place.
 */
function integrate(player, dt) {
  // Apply gravity
  if (!player.onGround) {
    player.vy += GRAVITY * player.weight * dt;
    if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
  }

  // Apply velocity
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Floor collision
  if (player.y >= FLOOR_Y) {
    player.y      = FLOOR_Y;
    player.vy     = 0;
    player.onGround = true;
    player.jumps  = 0; // reset double-jump counter
    if (player.state === 'jump' || player.state === 'air_attack') {
      player.state = 'idle';
    }
  } else {
    player.onGround = false;
  }

  // Wall collision
  if (player.x < WALL_LEFT)  player.x = WALL_LEFT;
  if (player.x > WALL_RIGHT) player.x = WALL_RIGHT;

  // Friction (horizontal)
  if (player.onGround) {
    player.vx *= 0.75; // ground friction
    if (Math.abs(player.vx) < 5) player.vx = 0;
  } else {
    player.vx *= 0.96; // air friction
  }
}

/**
 * Process a validated input command for a player.
 * Returns list of events produced (e.g. { type: 'jumped' }).
 */
function applyInput(player, input, charDef) {
  const events = [];
  if (!player || player.stunTime > 0) return events;

  const speed = charDef.speed;

  // Movement
  if (input.left && !player.blocking) {
    player.vx = -speed;
    player.facing = -1;
    if (player.onGround && player.state === 'idle') player.state = 'run';
  } else if (input.right && !player.blocking) {
    player.vx = speed;
    player.facing = 1;
    if (player.onGround && player.state === 'idle') player.state = 'run';
  } else {
    if (player.state === 'run') player.state = 'idle';
  }

  // Jump / double-jump
  if (input.jump && input.jumpJustPressed) {
    if (player.onGround) {
      player.vy = charDef.jumpForce;
      player.onGround = false;
      player.jumps = 1;
      player.state = 'jump';
      events.push({ type: 'jumped', x: player.x, y: player.y });
    } else if (player.jumps === 1) {
      player.vy = charDef.jumpForce * 0.85;
      player.jumps = 2;
      player.state = 'jump';
      events.push({ type: 'double_jumped', x: player.x, y: player.y });
    }
  }

  // Block
  player.blocking = !!(input.block && player.onGround);
  if (player.blocking) player.state = 'block';
  else if (player.state === 'block') player.state = 'idle';

  // Dash
  if (input.dashJustPressed) {
    const dir = player.facing;
    player.vx = dir * speed * 2.5;
    player.dashCooldown = 800;
    events.push({ type: 'dash', dir, x: player.x, y: player.y });
  }

  return events;
}

/**
 * Tick down cooldowns on the player state.
 */
function tickCooldowns(player, dtMs) {
  if (player.stunTime > 0)       player.stunTime       = Math.max(0, player.stunTime - dtMs);
  if (player.iFrames > 0)        player.iFrames        = Math.max(0, player.iFrames - dtMs);
  if (player.attackCooldown > 0) player.attackCooldown = Math.max(0, player.attackCooldown - dtMs);
  if (player.specialCooldown > 0)player.specialCooldown= Math.max(0, player.specialCooldown - dtMs);
  if (player.dashCooldown > 0)   player.dashCooldown   = Math.max(0, player.dashCooldown - dtMs);
  if (player.attackActive > 0)   player.attackActive   = Math.max(0, player.attackActive - dtMs);
  if (player.ultimateCooldown > 0)player.ultimateCooldown = Math.max(0, player.ultimateCooldown - dtMs);

  // Clear attack state
  if (player.attackActive === 0 && player.state === 'attack') {
    player.state = player.onGround ? 'idle' : 'jump';
    player.currentAttack = null;
  }
}

module.exports = { integrate, applyInput, tickCooldowns };
