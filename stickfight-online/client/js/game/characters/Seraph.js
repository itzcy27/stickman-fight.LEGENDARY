class SeraphChar extends BaseCharacter {
  constructor() {
    super({
      id: 'seraph', name: 'Seraph',
      color: '#a0d8f1', accentColor: '#ffffff', glowColor: '#e0f7ff',
      maxHp: 85, speed: 410, jumpForce: -800, weight: 0.8,
      punchDamage: 6, kickDamage: 10, airDamage: 14,
      knockbackMul: 0.9, defenseRating: 1.15,
      specialDamage: 20, specialCooldown: 5500,
      ultimateDamage: 48, ultimateCost: 100,
      specialName: 'Feather Blade',
      ultimateName: 'Angel Descent',
      ultimateDesc: 'Ascends briefly then rains down energy blades in a wide arc.',
      headRadius: 13,
      statRatings: { speed: 0.65, power: 0.55, defense: 0.35, mobility: 0.85 },
    });
  }

  draw(ctx, cx, cy, state, preview = false) {
    // Draw wing suggestion behind body
    if (!state || state.state !== 'dead') {
      ctx.save();
      ctx.globalAlpha = 0.35;
      const facing = state?.facing ?? 1;
      const wx = cx;
      const wy = cy - 80;
      ctx.strokeStyle = '#e0f7ff';
      ctx.lineWidth = 2;
      // Simple wing arcs
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(wx, wy + i * 10);
        ctx.bezierCurveTo(wx - facing * (20 + i * 8), wy - 20 + i * 8, wx - facing * (40 + i * 12), wy + i * 5, wx - facing * (30 + i * 10), wy + 20 + i * 6);
        ctx.stroke();
      }
      ctx.restore();
    }
    super.draw(ctx, cx, cy, state, preview);
  }
}
window.SeraphChar = SeraphChar;
