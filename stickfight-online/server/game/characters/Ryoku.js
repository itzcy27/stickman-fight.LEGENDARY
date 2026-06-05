const BaseCharacter = require('./BaseCharacter');

class Ryoku extends BaseCharacter {
  constructor() {
    super({
      id: 'ryoku',
      name: 'Ryoku',
      color: '#e84040',
      accentColor: '#ff8c00',
      maxHp: 100,
      speed: 390,
      jumpForce: -710,
      weight: 1.0,
      punchDamage: 8,
      kickDamage: 13,
      airDamage: 9,
      knockbackMul: 1.0,
      defenseRating: 1.0,
      specialDamage: 22,
      specialCooldown: 5000,
      ultimateDamage: 50,
      ultimateCost: 100,
      specialName: 'Spirit Strike',
      ultimateName: 'Dragon Fist',
      ultimateDesc: 'Charges forward with a devastating dragon-powered punch that creates a shockwave.',
    });
  }
}

module.exports = Ryoku;
