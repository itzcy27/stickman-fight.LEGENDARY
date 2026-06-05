const BaseCharacter = require('./BaseCharacter');

class Seraph extends BaseCharacter {
  constructor() {
    super({
      id: 'seraph',
      name: 'Seraph',
      color: '#a0d8f1',
      accentColor: '#ffffff',
      maxHp: 85,
      speed: 410,
      jumpForce: -800,   // highest jump
      weight: 0.8,       // floaty
      punchDamage: 6,
      kickDamage: 10,
      airDamage: 14,     // strong in the air
      knockbackMul: 0.9,
      defenseRating: 1.15, // fragile
      specialDamage: 20,
      specialCooldown: 5500,
      ultimateDamage: 48,
      ultimateCost: 100,
      specialName: 'Feather Blade',
      ultimateName: 'Angel Descent',
      ultimateDesc: 'Ascends briefly then rains down energy blades in a wide arc.',
    });
  }
}

module.exports = Seraph;
