/**
 * Main game renderer — draws everything onto the game canvas each frame.
 */
class Renderer {
  constructor(canvas, particleCanvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.pCanvas = particleCanvas;
    this.pCtx    = particleCanvas.getContext('2d');

    this.background = null;
    this.particles  = new ParticleSystem(particleCanvas);
    this.hitSparks  = new HitSparks();

    this.W = 1200;
    this.H = 600;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  init() {
    this.background = new Background(this.W, this.H);
  }

  _resize() {
    const ratio = window.innerWidth / window.innerHeight;
    const gameRatio = this.W / this.H;
    let w, h;
    if (ratio > gameRatio) {
      h = window.innerHeight;
      w = h * gameRatio;
    } else {
      w = window.innerWidth;
      h = w / gameRatio;
    }
    this.canvas.width  = this.W;
    this.canvas.height = this.H;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = ((window.innerWidth  - w) / 2) + 'px';
    this.canvas.style.top  = ((window.innerHeight - h) / 2) + 'px';

    if (this.pCanvas) {
      this.pCanvas.width  = this.W;
      this.pCanvas.height = this.H;
      Object.assign(this.pCanvas.style, {
        width:    w + 'px',
        height:   h + 'px',
        position: 'absolute',
        left:     this.canvas.style.left,
        top:      this.canvas.style.top,
      });
    }
  }

  // Called by GameEngine each tick
  render(dt, gameState, mySlot, showHitboxes = false) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // Background
    if (this.background) this.background.draw(ctx, dt);

    // Particles (behind characters)
    this.pCtx.clearRect(0, 0, this.W, this.H);
    this.particles.update(dt);
    this.particles.draw();

    if (!gameState) return;

    // Characters
    for (const pState of gameState.players) {
      this._drawCharacter(ctx, pState, showHitboxes);
    }

    // Hit sparks (on top)
    this.hitSparks.update(dt);
    this.hitSparks.draw(ctx);

    // Camera shake
    Camera.update();
    Camera.applyToCanvas(this.canvas);
    Camera.applyToCanvas(this.pCanvas);
  }

  _drawCharacter(ctx, pState, showHitboxes) {
    const char = CharacterRegistry.get(pState.characterId);
    if (!char) return;

    const x = pState.x;
    const y = pState.y;

    // Draw character
    char.draw(ctx, x, y, pState, false);

    // Hitbox debug overlay
    if (showHitboxes) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      const hb = char.hitboxes?.stand || { w: 40, h: 90 };
      ctx.strokeRect(x - hb.w / 2, y - hb.h, hb.w, hb.h);
      ctx.restore();
    }

    // Block shield visual
    if (pState.blocking) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(x + pState.facing * 20, y - 40, 35, 0, Math.PI * 2);
      const shieldGrad = ctx.createRadialGradient(x + pState.facing * 20, y - 40, 5, x + pState.facing * 20, y - 40, 35);
      shieldGrad.addColorStop(0, '#aaccff');
      shieldGrad.addColorStop(1, 'rgba(100,150,255,0)');
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      ctx.restore();
    }
  }

  // Process game events from the server snapshot
  processEvents(events, gameState) {
    if (!events) return;
    for (const ev of events) {
      switch (ev.type) {
        case 'hit':
          this.hitSparks.spawn(ev.x, ev.y - 40, ev.attackType, ev.blocked);
          this.particles.spawnHitSpark(ev.x, ev.y - 40, ev.blocked ? '#888' : '#fff', ev.blocked ? 4 : 8);
          Camera.shake(ev.blocked ? 2 : 5);
          break;

        case 'special_hit':
          this.hitSparks.spawn(ev.x, ev.y - 40, 'special', ev.blocked);
          this.particles.spawnUltimate(ev.x, ev.y - 40, '#cc44ff', 12);
          Camera.shake(8);
          Utils.flash('red');
          break;

        case 'ultimate':
          this.particles.spawnUltimate(ev.x, ev.y - 50, CharacterRegistry.get(ev.charId)?.glowColor || '#ffd700', 30);
          Camera.shake(16, 0.8);
          break;

        case 'jumped':
        case 'double_jumped':
          this.particles.spawnLanding(ev.x, ev.y);
          break;

        case 'dash':
          this.particles.spawnDash(ev.x, ev.y - 40, ev.dir, '#00ffcc');
          break;
      }
    }
  }

  drawCharPreview(canvas, characterId) {
    const char = CharacterRegistry.get(characterId);
    if (!char) return;
    const ctx  = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    char.draw(ctx, canvas.width / 2, canvas.height - 20, null, true);
  }
}

window.Renderer = Renderer;
