/**
 * Canvas-based particle system for hit effects, energy trails, etc.
 */
class ParticleSystem {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.particles = [];
  }

  // ─── Spawn presets ────────────────────────────────────────────────────────

  spawnHitSpark(x, y, color = '#fff', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = Utils.rand(80, 220);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size:  Utils.rand(3, 7),
        life:  Utils.rand(0.25, 0.5),
        maxLife: 0,
        color,
        type: 'spark',
      });
    }
    // Fix maxLife
    this.particles.slice(-count).forEach(p => p.maxLife = p.life);
  }

  spawnBlood(x, y, count = 6) {
    this.spawnHitSpark(x, y, '#e84040', count);
  }

  spawnKO(x, y) {
    this.spawnHitSpark(x, y, '#ffd700', 20);
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + Utils.rand(-30, 30),
        y: y + Utils.rand(-30, 0),
        vx: Utils.rand(-60, 60),
        vy: Utils.rand(-200, -80),
        size: Utils.rand(4, 10),
        life: Utils.rand(0.5, 1.0),
        maxLife: 0,
        color: Utils.randEl(['#ffd700', '#ff6b35', '#fff']),
        type: 'spark',
      });
    }
    this.particles.slice(-8).forEach(p => p.maxLife = p.life);
  }

  spawnUltimate(x, y, color = '#ffd700', count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(100, 500);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        size:  Utils.rand(4, 12),
        life:  Utils.rand(0.4, 1.2),
        maxLife: 0,
        color,
        type: 'spark',
      });
    }
    this.particles.slice(-count).forEach(p => p.maxLife = p.life);
  }

  spawnDash(x, y, dir, color) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x - dir * Utils.rand(0, 20),
        y: y - Utils.rand(20, 60),
        vx: -dir * Utils.rand(40, 100),
        vy: Utils.rand(-40, 40),
        size: Utils.rand(2, 6),
        life: 0.3,
        maxLife: 0.3,
        color,
        type: 'spark',
      });
    }
  }

  spawnLanding(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI + Utils.rand(-0.5, 0.5);
      const speed = Utils.rand(30, 120);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: Utils.rand(2, 5),
        life: 0.35,
        maxLife: 0.35,
        color: 'rgba(200,200,200,0.8)',
        type: 'dust',
      });
    }
  }

  spawnEnergyOrb(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(30, 80);
      this.particles.push({
        x: x + Utils.rand(-10, 10),
        y: y + Utils.rand(-20, 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: Utils.rand(3, 7),
        life: 0.6,
        maxLife: 0.6,
        color,
        type: 'orb',
      });
    }
  }

  // ─── Update & draw ────────────────────────────────────────────────────────

  update(dt) {
    const GRAVITY = 600;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.vy += GRAVITY * dt;
    }
  }

  draw() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'orb') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 10;
        ctx.fill();
      } else {
        // spark / dust
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = p.size * 0.6;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  clear() { this.particles = []; }
}

window.ParticleSystem = ParticleSystem;
