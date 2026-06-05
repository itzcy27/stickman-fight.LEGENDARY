/**
 * Keyboard input handler with combo/dash detection.
 * Exposes a snapshot each frame for the game loop.
 */
const InputHandler = (() => {
  const keys = {};
  const justPressed   = new Set();
  const justReleased  = new Set();

  // Dash detection
  const DASH_WINDOW = 250; // ms
  let lastLeftTime  = 0;
  let lastRightTime = 0;
  let dashDir       = 0;   // -1=left, 1=right, 0=none

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.code;
    keys[k] = true;
    justPressed.add(k);

    // Dash detection
    const now = Date.now();
    if (k === 'KeyA' || k === 'ArrowLeft') {
      if (now - lastLeftTime < DASH_WINDOW) dashDir = -1;
      lastLeftTime = now;
    }
    if (k === 'KeyD' || k === 'ArrowRight') {
      if (now - lastRightTime < DASH_WINDOW) dashDir = 1;
      lastRightTime = now;
    }

    // Prevent default for game keys
    const gameCodes = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    if (gameCodes.includes(k)) e.preventDefault();
  });

  window.addEventListener('keyup', e => {
    const k = e.code;
    keys[k] = false;
    justReleased.add(k);
  });

  // Build the input snapshot consumed each server tick
  function getSnapshot() {
    const left  = keys['KeyA']     || keys['ArrowLeft'];
    const right = keys['KeyD']     || keys['ArrowRight'];
    const jump  = keys['KeyW']     || keys['ArrowUp']   || keys['Space'];
    const block = keys['KeyS']     || keys['ArrowDown'];
    const punch = keys['KeyJ'];
    const kick  = keys['KeyK'];
    const spec  = keys['KeyQ'];
    const ult   = keys['KeyE'];

    const snap = {
      left,
      right,
      jump,
      block,
      punch,
      kick,
      special: spec,
      ultimate: ult,
      jumpJustPressed:  justPressed.has('KeyW')  || justPressed.has('ArrowUp') || justPressed.has('Space'),
      dashJustPressed: dashDir !== 0,
      dashDir,
    };

    // Clear per-frame state
    justPressed.clear();
    justReleased.clear();
    dashDir = 0;

    return snap;
  }

  function isDown(code) { return !!keys[code]; }
  function wasJustPressed(code) { return justPressed.has(code); }

  return { getSnapshot, isDown, wasJustPressed };
})();

window.InputHandler = InputHandler;
