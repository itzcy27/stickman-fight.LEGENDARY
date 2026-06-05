const BaseCharacter = require('./BaseCharacter');

class Titan extends BaseCharacter {
  constructor() {
    super({
      id: 'titan',
      name: 'Titan',
      color: '#e67e22',
      accentColor: '#c0392b',
      maxHp: 130,        // most HP
      speed: 310,        // slowest
      jumpForce: -640,   // lowest jump
      weight: 1.4,       // heaviest
      punchDamage: 11,
      kickDamage: 17,
      airDamage: 13,
      knockbackMul: 1.3,
      defenseRating: 0.8, // takes less damage
      specialDamage: 26,
      specialCooldown: 7000,
      ultimateDamage: 58, // most damage
      ultimateCost: 100,
      specialName: 'Tremor',
      ultimateName: 'Earthquake Slam',
      ultimateDesc: 'Leaps high and slams down, sending a full-screen shockwave that stuns the opponent.',
    });
  }
}

module.exports = Titan;
