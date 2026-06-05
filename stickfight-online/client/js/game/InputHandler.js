/**
 * Keyboard input handler with combo/dash detection.
 * Exposes a snapshot each frame for the game loop.
 */
const InputHandler = (() => {
  const keys        = {};
  const justPressed = new Set();
  const justReleased= new Set();

  // Dash detection
  const DASH_WINDOW = 250;
  let lastLeftTime  = 0;
  let lastRightTime = 0;
  let dashDir       = 0;

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.code;
    keys[k] = true;
    justPressed.add(k);

    const now = Date.now();
    if (k === 'KeyA' || k === 'ArrowLeft') {
      if (now - lastLeftTime < DASH_WINDOW) dashDir = -1;
      lastLeftTime = now;
    }
    if (k === 'KeyD' || k === 'ArrowRight') {
      if (now - lastRightTime < DASH_WINDOW) dashDir = 1;
      lastRightTime = now;
    }

    const gameCodes = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    if (gameCodes.includes(k)) e.preventDefault();
  });

  window.addEventListener('keyup', e => {
    const k = e.code;
    keys[k] = false;
    justReleased.add(k);
  });

  function getSnapshot() {
    const snap = {
      left:  keys['KeyA']  || keys['ArrowLeft'],
      right: keys['KeyD']  || keys['ArrowRight'],
      jump:  keys['KeyW']  || keys['ArrowUp'] || keys['Space'],
      block: keys['KeyS']  || keys['ArrowDown'],

      // Attacks fire on key-down (justPressed) so they trigger once per press
      punch:   justPressed.has('KeyJ'),
      kick:    justPressed.has('KeyK'),
      special: justPressed.has('KeyQ'),
      ultimate:justPressed.has('KeyE'),

      // Also expose held state for server (server uses its own held tracking)
      punchHeld:   keys['KeyJ'],
      kickHeld:    keys['KeyK'],
      specialHeld: keys['KeyQ'],
      ultimateHeld:keys['KeyE'],

      jumpJustPressed: justPressed.has('KeyW') || justPressed.has('ArrowUp') || justPressed.has('Space'),
      dashJustPressed: dashDir !== 0,
      dashDir,
    };

    // Clear per-frame state
    justPressed.clear();
    justReleased.clear();
    dashDir = 0;

    return snap;
  }

  function isDown(code)       { return !!keys[code]; }
  function wasJustPressed(code){ return justPressed.has(code); }

  return { getSnapshot, isDown, wasJustPressed };
})();

window.InputHandler = InputHandler;
