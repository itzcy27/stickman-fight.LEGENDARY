class TitanChar extends BaseCharacter {
  constructor() {
    super({
      id: 'titan', name: 'Titan',
      color: '#e67e22', accentColor: '#c0392b', glowColor: '#ff6600',
      maxHp: 130, speed: 310, jumpForce: -640, weight: 1.4,
      punchDamage: 11, kickDamage: 17, airDamage: 13,
      knockbackMul: 1.3, defenseRating: 0.8,
      specialDamage: 26, specialCooldown: 7000,
      ultimateDamage: 58, ultimateCost: 100,
      specialName: 'Tremor',
      ultimateName: 'Earthquake Slam',
      ultimateDesc: 'Leaps high and slams down, sending a full-screen shockwave that stuns the opponent.',
      headRadius: 17,
      limbWidth: 6,
      bodyLength: 48,
      bodyScale: 1.2,
      statRatings: { speed: 0.25, power: 1.0, defense: 0.9, mobility: 0.3 },
    });
  }

  draw(ctx, cx, cy, state, preview = false) {
    // Ground crack during ultimate
    if (state?.ultimateActive) {
      ctx.save();
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth   = 3;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 80, cy + Math.sin(angle) * 10);
        ctx.stroke();
      }
      ctx.restore();
    }
    super.draw(ctx, cx, cy, state, preview);
  }
}
window.TitanChar = TitanChar;
