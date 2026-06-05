const TrainingScreen = (() => {
  let _engine  = null;
  let _charId  = 'ryoku';
  let _pCanvas = null;

  function start(characterId) {
    _charId = characterId || 'ryoku';

    if (!_pCanvas) {
      _pCanvas = document.createElement('canvas');
      _pCanvas.id = 'tr-particle-canvas';
      _pCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;';
      Utils.qs('#screen-training').appendChild(_pCanvas);
    }

    if (_engine) _engine.stop();
    _engine = new GameEngine(Utils.qs('#training-canvas'), _pCanvas);

    const hud = { updateTraining: (players) => {
      const p1hp = Utils.qs('#tr-hp-bar-p1');
      const p2hp = Utils.qs('#tr-hp-bar-p2');
      const p1en = Utils.qs('#tr-energy-p1');
      const p1ult= Utils.qs('#tr-ult-p1');
      if (!players) return;
      const p0 = players[0], p1 = players[1];
      const ch0 = CharacterRegistry.get(p0.characterId);
      const ch1 = CharacterRegistry.get(p1.characterId);
      if (p1hp) p1hp.style.width = ((p0.hp / ch0.maxHp) * 100) + '%';
      if (p2hp) p2hp.style.width = ((p1.hp / ch1.maxHp) * 100) + '%';
      if (p1en)  p1en.style.width  = (p0.energy  || 0) + '%';
      if (p1ult) p1ult.style.setProperty('--pct', (p0.ultimateEnergy || 0) + '%');
    }};
    _engine.hud = hud;
    _engine.startTraining(_charId);

    _initControls();
  }

  function _initControls() {
    Utils.qs('#tr-reset')?.addEventListener('click', () => _engine?.resetTraining());
    Utils.qs('#tr-back')?.addEventListener('click', () => {
      _engine?.stop();
      Utils.setScreen('menu');
    });
    Utils.qs('#tr-char')?.addEventListener('click', () => {
      _engine?.stop();
      CharacterSelect.open({ mode: 'training' });
    });
  }

  return { start };
})();

window.TrainingScreen = TrainingScreen;
