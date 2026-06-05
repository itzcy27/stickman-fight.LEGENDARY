const BaseCharacter = require('./BaseCharacter');

class Nyx extends BaseCharacter {
  constructor() {
    super({
      id: 'nyx',
      name: 'Nyx',
      color: '#9b59b6',
      accentColor: '#e056fd',
      maxHp: 88,
      speed: 430,
      jumpForce: -750,
      weight: 0.85,
      punchDamage: 7,
      kickDamage: 11,
      airDamage: 10,
      knockbackMul: 0.95,
      defenseRating: 1.1,
      specialDamage: 19,
      specialCooldown: 4500,
      ultimateDamage: 46,
      ultimateCost: 100,
      specialName: 'Shadow Step',
      ultimateName: 'Shadow Clone',
      ultimateDesc: 'Summons a mirror clone that simultaneously mirrors all attacks for 3 seconds.',
    });
  }
}

module.exports = Nyx;
