/**
 * Animated game stage background renderer.
 * Draws floor, parallax layers, atmospheric effects.
 */
class Background {
  constructor(width, height) {
    this.W = width;
    this.H = height;
    this.t = 0;

    // Static star/dust particles in background
    this.particles = [];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7),
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 20 + 5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
  }

  draw(ctx, dt) {
    this.t += dt;
    const W = this.W, H = this.H;
    const FLOOR_Y = 520;

    // ── Sky gradient ──────────────────────────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050510');
    sky.addColorStop(0.6, '#0a0a1a');
    sky.addColorStop(1, '#1a0a0a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Background pillars / city silhouette ──────────────────────────────
    ctx.fillStyle = 'rgba(20,10,30,0.6)';
    const buildings = [
      [0, 120, 80, 400], [90, 180, 60, 400], [160, 140, 100, 400],
      [270, 200, 70, 400], [350, 160, 90, 400], [450, 220, 60, 400],
      [520, 150, 80, 400], [610, 190, 100, 400],
      [720, 130, 70, 400], [800, 170, 90, 400], [900, 140, 80, 400],
      [990, 200, 70, 400], [1070, 160, 80, 400], [1160, 120, 80, 400],
    ];
    for (const [x, y, w, h] of buildings) {
      ctx.fillRect(x, y, w, h);
      // Window dots
      ctx.fillStyle = 'rgba(255,220,100,0.15)';
      for (let r = y + 15; r < y + h - 10; r += 20) {
        for (let c = x + 8; c < x + w - 8; c += 14) {
          if (Math.sin(r * 7.3 + c * 3.1 + this.t * 0.3) > 0.3) {
            ctx.fillRect(c, r, 6, 8);
          }
        }
      }
      ctx.fillStyle = 'rgba(20,10,30,0.6)';
    }

    // ── Background glow circles ───────────────────────────────────────────
    const glow1 = ctx.createRadialGradient(300, 400, 0, 300, 400, 300);
    glow1.addColorStop(0, 'rgba(232,64,64,0.04)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(900, 450, 0, 900, 450, 250);
    glow2.addColorStop(0, 'rgba(0,100,255,0.05)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // ── Floating particles ────────────────────────────────────────────────
    for (const p of this.particles) {
      p.x -= p.speed * dt * 0.3;
      if (p.x < 0) p.x = W;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,255,${p.alpha})`;
      ctx.fill();
    }

    // ── Floor ─────────────────────────────────────────────────────────────
    // Floor gradient
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    floorGrad.addColorStop(0, '#1a1a2a');
    floorGrad.addColorStop(0.3, '#0f0f1a');
    floorGrad.addColorStop(1, '#050508');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    // Floor line glow
    const floorLine = ctx.createLinearGradient(0, 0, W, 0);
    floorLine.addColorStop(0,   'transparent');
    floorLine.addColorStop(0.1, 'rgba(232,64,64,0.3)');
    floorLine.addColorStop(0.5, 'rgba(100,100,255,0.3)');
    floorLine.addColorStop(0.9, 'rgba(232,64,64,0.3)');
    floorLine.addColorStop(1,   'transparent');
    ctx.fillStyle = floorLine;
    ctx.fillRect(0, FLOOR_Y - 2, W, 3);

    // Floor grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x + 30, H);
      ctx.stroke();
    }

    // Stage edge walls
    ctx.fillStyle = 'rgba(100,100,150,0.15)';
    ctx.fillRect(0, FLOOR_Y - 300, 50, 300);
    ctx.fillRect(W - 50, FLOOR_Y - 300, 50, 300);
  }
}

window.Background = Background;
