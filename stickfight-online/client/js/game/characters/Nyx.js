class NyxChar extends BaseCharacter {
  constructor() {
    super({
      id: 'nyx', name: 'Nyx',
      color: '#9b59b6', accentColor: '#e056fd', glowColor: '#cc44ff',
      maxHp: 88, speed: 430, jumpForce: -750, weight: 0.85,
      punchDamage: 7, kickDamage: 11, airDamage: 10,
      knockbackMul: 0.95, defenseRating: 1.1,
      specialDamage: 19, specialCooldown: 4500,
      ultimateDamage: 46, ultimateCost: 100,
      specialName: 'Shadow Step',
      ultimateName: 'Shadow Clone',
      ultimateDesc: 'Summons a mirror clone that simultaneously mirrors all attacks for 3 seconds.',
      statRatings: { speed: 0.75, power: 0.6, defense: 0.4, mobility: 0.8 },
    });
    this._cloneOffset = 0;
  }

  draw(ctx, cx, cy, state, preview = false) {
    // Shadow / clone hint
    if (state?.ultimateActive) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      // Draw mirror clone slightly behind
      const facing = state?.facing ?? 1;
      const cloneX = cx - facing * 40;
      super.draw(ctx, cloneX, cy, { ...state, facing: -facing }, preview);
      ctx.restore();
    }
    super.draw(ctx, cx, cy, state, preview);
  }
}
window.NyxChar = NyxChar;
