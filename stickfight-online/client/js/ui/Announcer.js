/**
 * Big text announcer (FIGHT!, ROUND 2, K.O., etc.)
 */
class Announcer {
  constructor(el) {
    this.el = el || Utils.qs('#announcer');
    this._timeout = null;
  }

  show(text, duration = 1500, color = '#fff') {
    if (!this.el) return;
    clearTimeout(this._timeout);
    this.el.textContent  = text;
    this.el.style.color  = color;
    this.el.classList.remove('hidden');
    // Restart animation
    this.el.style.animation = 'none';
    void this.el.offsetWidth;
    this.el.style.animation = '';

    this._timeout = setTimeout(() => {
      this.el.classList.add('hidden');
    }, duration);
  }

  hide() {
    if (!this.el) return;
    clearTimeout(this._timeout);
    this.el.classList.add('hidden');
  }
}

window.Announcer = Announcer;
