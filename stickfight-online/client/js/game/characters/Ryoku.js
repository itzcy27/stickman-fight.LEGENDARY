class RyokuChar extends BaseCharacter {
  constructor() {
    super({
      id: 'ryoku', name: 'Ryoku',
      color: '#e84040', accentColor: '#ff8c00', glowColor: '#ff4500',
      maxHp: 100, speed: 390, jumpForce: -710, weight: 1.0,
      punchDamage: 8, kickDamage: 13, airDamage: 9,
      knockbackMul: 1.0, defenseRating: 1.0,
      specialDamage: 22, specialCooldown: 5000,
      ultimateDamage: 50, ultimateCost: 100,
      specialName: 'Spirit Strike',
      ultimateName: 'Dragon Fist',
      ultimateDesc: 'Charges forward with a devastating dragon-powered punch that creates a shockwave.',
      statRatings: { speed: 0.6, power: 0.7, defense: 0.5, mobility: 0.6 },
    });
  }

  // Override draw to add fire effect during ultimate
  draw(ctx, cx, cy, state, preview = false) {
    if (state?.ultimateActive) {
      // Dragon aura — orange/red particles drawn in renderer
      ctx.save();
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur  = 40;
    }
    super.draw(ctx, cx, cy, state, preview);
    if (state?.ultimateActive) ctx.restore();
  }
}
window.RyokuChar = RyokuChar;
