/**
 * Floating damage number display.
 * Appends ephemeral DOM elements over the game canvas.
 */
class DamageNumbers {
  constructor(container) {
    this.container = container || Utils.qs('#dmg-numbers');
  }

  spawn(damage, x, y, type = 'normal', blocked = false) {
    if (!this.container) return;

    // Convert game coords to screen coords
    const canvas = Utils.qs('#game-canvas');
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / 1200;
    const scaleY = rect.height / 600;

    const sx = rect.left + x * scaleX;
    const sy = rect.top  + y * scaleY;

    const el = document.createElement('div');
    el.className = 'dmg-num' + (blocked ? ' blocked' : '') + (type === 'ultimate' ? ' ultimate' : '') + (type === 'special' ? ' special' : '');
    el.textContent = blocked ? `${damage} [BLK]` : `-${damage}`;
    el.style.left = sx + 'px';
    el.style.top  = sy + 'px';

    this.container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

window.DamageNumbers = DamageNumbers;
