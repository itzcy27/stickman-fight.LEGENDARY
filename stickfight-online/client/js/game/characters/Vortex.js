class VortexChar extends BaseCharacter {
  constructor() {
    super({
      id: 'vortex', name: 'Vortex',
      color: '#7fff00', accentColor: '#00ffcc', glowColor: '#00ff88',
      maxHp: 90, speed: 460, jumpForce: -730, weight: 0.9,
      punchDamage: 6, kickDamage: 10, airDamage: 8,
      knockbackMul: 0.85, defenseRating: 1.1,
      specialDamage: 16, specialCooldown: 4000,
      ultimateDamage: 44, ultimateCost: 100,
      specialName: 'Afterburn',
      ultimateName: 'Cyclone Rush',
      ultimateDesc: 'Spins into a rapid multi-hit tornado that carries the opponent across the stage.',
      limbWidth: 3,
      statRatings: { speed: 1.0, power: 0.5, defense: 0.4, mobility: 0.9 },
    });
  }

  draw(ctx, cx, cy, state, preview = false) {
    super.draw(ctx, cx, cy, state, preview);
    // Speed lines when running or dashing
    if (state?.state === 'run' || state?.vx && Math.abs(state.vx) > 300) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = this.accentColor;
      ctx.lineWidth   = 2;
      const dir = (state?.facing ?? 1) * -1;
      for (let i = 0; i < 3; i++) {
        const oy = -30 + i * 30;
        ctx.beginPath();
        ctx.moveTo(cx, cy + oy);
        ctx.lineTo(cx + dir * (20 + i * 8), cy + oy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
window.VortexChar = VortexChar;
