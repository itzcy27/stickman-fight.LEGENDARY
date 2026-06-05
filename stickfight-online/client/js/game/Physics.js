/**
 * Client-side physics prediction (mirrors server PhysicsEngine).
 * Used for local character only — reduces perceived latency.
 */
const ClientPhysics = (() => {
  const GRAVITY          = 1800;
  const TERMINAL_VELOCITY= 1200;
  const FLOOR_Y          = 520;
  const WALL_LEFT        = 50;
  const WALL_RIGHT       = 1150;

  function integrate(player, dt) {
    if (!player.onGround) {
      player.vy += GRAVITY * (player.weight || 1) * dt;
      if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if (player.y >= FLOOR_Y) {
      player.y       = FLOOR_Y;
      player.vy      = 0;
      player.onGround= true;
      player.jumps   = 0;
    } else {
      player.onGround = false;
    }

    if (player.x < WALL_LEFT)  player.x = WALL_LEFT;
    if (player.x > WALL_RIGHT) player.x = WALL_RIGHT;

    if (player.onGround) {
      player.vx *= 0.75;
      if (Math.abs(player.vx) < 5) player.vx = 0;
    } else {
      player.vx *= 0.96;
    }
  }

  return { integrate };
})();

window.ClientPhysics = ClientPhysics;
