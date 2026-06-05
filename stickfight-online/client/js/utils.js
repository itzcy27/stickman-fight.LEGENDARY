/**
 * Shared utility functions for the client.
 */

// ─── Math helpers ──────────────────────────────────────────────────────────
const Utils = {
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  lerp(a, b, t)    { return a + (b - a) * t; },
  rand(lo, hi)     { return lo + Math.random() * (hi - lo); },
  randInt(lo, hi)  { return Math.floor(Utils.rand(lo, hi + 1)); },
  randEl(arr)      { return arr[Utils.randInt(0, arr.length - 1)]; },

  // HSL color string
  hsl(h, s, l, a = 1) {
    return a < 1 ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
  },

  // Time formatting
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  // Date formatting for match history
  formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // DOM helpers
  qs(sel, ctx = document)  { return ctx.querySelector(sel); },
  qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  setScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    else console.warn('[Utils] Screen not found:', id);
  },

  // Trigger CSS screen shake on #app or a specific element
  shake(el = document.getElementById('app'), intensity = 'md') {
    const cls = 'shake-' + intensity;
    el.classList.remove('shake-sm', 'shake-md', 'shake-lg');
    void el.offsetWidth; // reflow
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 600);
  },

  // Flash overlay
  flash(type = 'white') {
    let overlay = document.getElementById('flash-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'flash-overlay';
      overlay.className = 'flash-overlay';
      document.body.appendChild(overlay);
    }
    overlay.className = `flash-overlay flash-${type}`;
    void overlay.offsetWidth;
    overlay.classList.add('flash-' + type);
  },
};

window.Utils = Utils;
