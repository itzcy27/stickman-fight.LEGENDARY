/**
 * Hit spark burst drawn directly onto the game canvas.
 * Drawn on top of everything else for a frame or two.
 */
class HitSparks {
  constructor() {
    this.sparks = [];
  }

  spawn(x, y, type = 'normal', blocked = false) {
    const configs = {
      normal:   { color: '#fff',    count: 6, radius: 24 },
      punch:    { color: '#ffcc00', count: 8, radius: 28 },
      kick:     { color: '#ff8800', count: 10, radius: 32 },
      air:      { color: '#88ddff', count: 8, radius: 28 },
      special:  { color: '#cc44ff', count: 14, radius: 40 },
      ultimate: { color: '#ffd700', count: 20, radius: 60 },
      block:    { color: '#aaaaaa', count: 4, radius: 18 },
    };

    const cfg = blocked ? configs.block : (configs[type] || configs.normal);
    this.sparks.push({
      x, y,
      color: cfg.color,
      radius: cfg.radius,
      count: cfg.count,
      life: 0.15,
      maxLife: 0.15,
    });
  }

  update(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].life -= dt;
      if (this.sparks[i].life <= 0) this.sparks.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const s of this.sparks) {
      const t = 1 - s.life / s.maxLife;
      const r = s.radius * (0.5 + t * 0.8);
      const alpha = 1 - t;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.y);

      // Burst lines
      for (let i = 0; i < s.count; i++) {
        const angle = (Math.PI * 2 * i) / s.count + t * 0.5;
        const len   = r * Utils.rand(0.5, 1.0);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r * 0.2, Math.sin(angle) * r * 0.2);
        ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.strokeStyle = s.color;
        ctx.lineWidth   = 2.5 * (1 - t);
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      // Central flash
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
      grad.addColorStop(0, s.color + 'cc');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }
  }

  clear() { this.sparks = []; }
}

window.HitSparks = HitSparks;
