const BaseCharacter = require('./BaseCharacter');

class Vortex extends BaseCharacter {
  constructor() {
    super({
      id: 'vortex',
      name: 'Vortex',
      color: '#7fff00',
      accentColor: '#00ffcc',
      maxHp: 90,
      speed: 460,        // fastest
      jumpForce: -730,
      weight: 0.9,
      punchDamage: 6,
      kickDamage: 10,
      airDamage: 8,
      knockbackMul: 0.85,
      defenseRating: 1.1,
      specialDamage: 16,
      specialCooldown: 4000, // fastest cooldown
      ultimateDamage: 44,
      ultimateCost: 100,
      specialName: 'Afterburn',
      ultimateName: 'Cyclone Rush',
      ultimateDesc: 'Spins into a rapid multi-hit tornado that carries the opponent across the stage.',
    });
  }
}

module.exports = Vortex;
