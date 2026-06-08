const GameScreen = (() => {
  let _engine    = null;
  let _hud       = null;
  let _dmgNums   = null;
  let _announcer = null;
  let _roomCode  = null;
  let _mySlot    = 0;

  // Particle canvas injection
  let _pCanvas   = null;
  // Named listener references so they can be removed on leave
  let _listeners = {};

  function enter(roomCode, startData) {
    _roomCode = roomCode;
    Utils.setScreen('game');

    // Remove any leftover listeners from a previous match
    _removeListeners();

    // Inject particle canvas into game screen (create once, always ensure it's in DOM)
    const gameScreen = Utils.qs('#screen-game');
    if (!_pCanvas) {
      _pCanvas = document.createElement('canvas');
      _pCanvas.id = 'particle-canvas';
      _pCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;';
    }
    if (!gameScreen.contains(_pCanvas)) {
      gameScreen.appendChild(_pCanvas);
    }

    // Determine my slot
    const myUser = window.App?.user?.username;
    _mySlot = startData.players.findIndex(p => p.username === myUser);
    if (_mySlot < 0) _mySlot = 0;

    // Set up UI
    _hud       = new HUD();
    _dmgNums   = new DamageNumbers(Utils.qs('#dmg-numbers'));
    _announcer = new Announcer(Utils.qs('#announcer'));

    _hud.setPlayers(startData.players);

    // Create engine
    if (_engine) _engine.stop();
    _engine = new GameEngine(Utils.qs('#game-canvas'), _pCanvas);
    _engine.hud        = _hud;
    _engine.dmgNumbers = _dmgNums;
    _engine.announcer  = _announcer;
    _engine.showHitboxes = localStorage.getItem('sf_hitboxes') === '1';
    _engine.init(roomCode, _mySlot, 'online');

    // VS splash
    _showVsSplash(startData.players);

    _registerListeners();
  }

  function _showVsSplash(players) {
    const existing = Utils.qs('.vs-splash');
    if (existing) existing.remove();

    const splash = document.createElement('div');
    splash.className = 'vs-splash';
    const [p0, p1] = players;
    const c0 = CharacterRegistry.get(p0.characterId);
    const c1 = CharacterRegistry.get(p1.characterId);

    splash.innerHTML = `
      <div class="vs-fighter">
        <div class="vs-fighter-name" style="color:${c0?.color || '#fff'}">${p0.username}</div>
        <div style="font-size:0.9rem;color:var(--text-dim)">${c0?.name || ''}</div>
      </div>
      <div class="vs-text">VS</div>
      <div class="vs-fighter">
        <div class="vs-fighter-name" style="color:${c1?.color || '#fff'}">${p1.username}</div>
        <div style="font-size:0.9rem;color:var(--text-dim)">${c1?.name || ''}</div>
      </div>
    `;
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 3000);
  }

  function _registerListeners() {
    _listeners['game:state'] = (snapshot) => {
      if (!_engine) return;
      _engine.applyServerState(snapshot);

      // Damage numbers from events
      if (_dmgNums && snapshot.events) {
        for (const ev of snapshot.events) {
          if (ev.type === 'hit' || ev.type === 'special_hit') {
            _dmgNums.spawn(ev.damage, ev.x, ev.y - 60, ev.attackType || 'normal', ev.blocked);
          }
        }
      }
    };

    _listeners['game:countdown'] = ({ value }) => {
      if (_announcer) _announcer.show(value.toString(), 900, '#fff');
    };

    _listeners['game:fight_start'] = ({ round }) => {
      if (_announcer) _announcer.show('FIGHT!', 1200, '#e84040');
    };

    _listeners['game:round_end'] = ({ winnerSlot, roundScores, round }) => {
      const isWin = winnerSlot === _mySlot;
      if (_announcer) _announcer.show(
        winnerSlot < 0 ? 'DRAW' : (isWin ? 'ROUND WIN' : 'K.O.!'),
        2500,
        winnerSlot < 0 ? '#aaa' : (isWin ? '#ffd700' : '#e84040')
      );
      Camera.shake(winnerSlot < 0 ? 4 : 12, 0.8);
      Utils.flash(isWin ? 'gold' : 'red');
    };

    _listeners['game:ultimate'] = (data) => {
      if (_engine) _engine.onUltimate(data);
      if (_dmgNums) _dmgNums.spawn(data.damage, 600, 200, 'ultimate', false);
    };

    _listeners['game:match_end'] = (result) => {
      setTimeout(() => {
        if (_engine) _engine.stop();
        ResultsScreen.show(result, _mySlot);
      }, 1500);
    };

    _listeners['room:player_left'] = () => {
      if (_announcer) _announcer.show('OPPONENT LEFT', 3000, '#e84040');
    };

    _listeners['game:stopped'] = ({ reason }) => {
      if (_engine) _engine.stop();
      if (reason === 'disconnect') {
        setTimeout(() => Utils.setScreen('menu'), 2000);
      }
    };

    _listeners['game:elo_update'] = (data) => {
      window._pendingEloUpdate = data;
    };

    for (const [event, fn] of Object.entries(_listeners)) {
      SocketClient.on(event, fn);
    }
  }

  function _removeListeners() {
    for (const [event, fn] of Object.entries(_listeners)) {
      SocketClient.off(event, fn);
    }
    _listeners = {};
  }

  function leave() {
    _removeListeners();
    if (_engine) { _engine.stop(); _engine = null; }
    if (_roomCode) { SocketClient.emit('room:leave', { roomCode: _roomCode }); _roomCode = null; }
  }

  return { enter, leave };
})();

window.GameScreen = GameScreen;
