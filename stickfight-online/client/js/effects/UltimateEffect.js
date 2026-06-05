/**
 * Cinematic ultimate effect controller.
 * Creates letterbox bars, flash, and displays the ultimate name.
 */
class UltimateEffect {
  constructor() {
    this._bars    = null;
    this._banner  = null;
    this._active  = false;
    this._timeout = null;
  }

  play(ultimateName, color = '#ffd700') {
    this._cleanup();
    this._active = true;

    // Letterbox bars
    const bars = document.createElement('div');
    bars.className = 'ult-cinematic-bars';
    bars.innerHTML = '<div class="ult-bar-top"></div><div class="ult-bar-bottom"></div>';
    document.body.appendChild(bars);
    this._bars = bars;
    void bars.offsetWidth;
    bars.classList.add('active');

    // Flash
    Utils.flash('white');

    // Name banner
    const banner = document.createElement('div');
    banner.className = 'ult-name-banner';
    banner.textContent = ultimateName;
    banner.style.color = color;
    banner.style.textShadow = `0 0 40px ${color}, 0 0 80px ${color}`;
    document.body.appendChild(banner);
    this._banner = banner;

    // Camera shake
    Camera.shake(16, 0.8);

    // Auto cleanup
    this._timeout = setTimeout(() => this._cleanup(), 2200);
  }

  _cleanup() {
    if (this._bars)   { this._bars.remove();   this._bars   = null; }
    if (this._banner) { this._banner.remove();  this._banner = null; }
    if (this._timeout){ clearTimeout(this._timeout); this._timeout = null; }
    this._active = false;
  }

  isActive() { return this._active; }
}

window.UltimateEffect = UltimateEffect;
