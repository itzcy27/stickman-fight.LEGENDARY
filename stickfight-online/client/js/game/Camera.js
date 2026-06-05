/**
 * Camera system: handles screen shake and canvas viewport transforms.
 */
const Camera = (() => {
  let shakeX = 0;
  let shakeY = 0;
  let shakeMag = 0;
  let shakeDecay = 0;
  let enabled = true;

  function shake(magnitude = 8, decay = 0.85) {
    if (!enabled) return;
    shakeMag  = Math.max(shakeMag, magnitude);
    shakeDecay = decay;
  }

  function update() {
    if (shakeMag < 0.5) {
      shakeMag = 0;
      shakeX = 0;
      shakeY = 0;
      return;
    }
    shakeX = (Math.random() * 2 - 1) * shakeMag;
    shakeY = (Math.random() * 2 - 1) * shakeMag;
    shakeMag *= shakeDecay;
  }

  function applyToCanvas(canvas) {
    if (shakeMag < 0.5) return;
    canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
  }

  function resetCanvas(canvas) {
    canvas.style.transform = '';
  }

  function setEnabled(val) { enabled = val; }

  return { shake, update, applyToCanvas, resetCanvas, setEnabled };
})();

window.Camera = Camera;
