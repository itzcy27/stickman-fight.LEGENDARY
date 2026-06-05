const RoomScreen = (() => {
  let _roomCode  = null;
  let _isHost    = false;

  function init() {
    _roomCode = null;
    _isHost   = false;

    // Tabs
    Utils.qsa('.tab-btn', Utils.qs('#screen-room')).forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.qsa('.tab-btn').forEach(b => b.classList.remove('active'));
        Utils.qsa('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        Utils.qs(`#tab-${btn.dataset.tab}`)?.classList.add('active');
      });
    });

    Utils.qs('#create-room-btn')?.addEventListener('click', _createRoom);
    Utils.qs('#join-room-btn')?.  addEventListener('click', _joinRoom);
    Utils.qs('#start-game-btn')?.addEventListener('click', _startGame);
    Utils.qs('#screen-room .btn-back')?.addEventListener('click', _leave);
  }

  function _createRoom() {
    const charId = window.App?.user?.settings?.selectedCharacter || 'ryoku';
    SocketClient.emit('room:create', { characterId: charId });
    _isHost = true;
  }

  function _joinRoom() {
    const code   = Utils.qs('#join-code-input')?.value?.trim().toUpperCase();
    const charId = window.App?.user?.settings?.selectedCharacter || 'ryoku';
    if (!code || code.length !== 6) {
      _setError('Enter a 6-character room code.');
      return;
    }
    SocketClient.emit('room:join', { roomCode: code, characterId: charId });
    _isHost = false;
  }

  function _startGame() {
    if (!_roomCode) return;
    SocketClient.emit('room:start_game', { roomCode: _roomCode });
  }

  function _leave() {
    if (_roomCode) SocketClient.emit('room:leave', { roomCode: _roomCode });
    _roomCode = null;
    Utils.setScreen('menu');
  }

  function _setError(msg) {
    const el = Utils.qs('#room-error');
    if (el) el.textContent = msg;
    setTimeout(() => { if (el) el.textContent = ''; }, 3000);
  }

  function _updateLobby(info) {
    const lobby   = Utils.qs('#room-lobby');
    const codeEl  = Utils.qs('#room-code-display');
    const playersEl = Utils.qs('#room-players');
    const startBtn  = Utils.qs('#start-game-btn');

    if (lobby)   lobby.classList.remove('hidden');
    if (codeEl)  { codeEl.textContent = info.roomCode; codeEl.classList.remove('hidden'); }

    if (playersEl) {
      playersEl.innerHTML = [0, 1].map(slot => {
        const p = info.players.find(pl => pl.slot === slot);
        const char = p ? CharacterRegistry.get(p.characterId) : null;
        return `
          <div class="room-player-slot ${p ? 'filled' : 'waiting'}">
            <div class="slot-label">Player ${slot + 1}</div>
            <div class="slot-name">${p ? p.username : 'Waiting…'}</div>
            ${char ? `<div class="slot-char">${char.name}</div>` : ''}
          </div>`;
      }).join('');
    }

    if (startBtn) {
      const ready = info.players.length === 2;
      startBtn.disabled = !ready || !_isHost;
      startBtn.textContent = _isHost
        ? (ready ? 'Start Game' : 'Waiting for opponent…')
        : (ready ? 'Waiting for host…' : 'Waiting for opponent…');
    }
  }

  // ─── Socket events ────────────────────────────────────────────────────────

  SocketClient.on('room:created', ({ roomCode }) => {
    _roomCode = roomCode;
    Utils.qs('#room-code-display')?.classList.remove('hidden');
    _setError('');
  });

  SocketClient.on('room:joined', ({ roomCode }) => {
    _roomCode = roomCode;
    _setError('');
  });

  SocketClient.on('room:update', (info) => {
    if (info.roomCode === _roomCode) _updateLobby(info);
  });

  SocketClient.on('room:error', ({ message }) => _setError(message));

  SocketClient.on('room:player_left', () => {
    _setError('Opponent left the room.');
  });

  SocketClient.on('game:start', (data) => {
    if (!_roomCode) return;
    GameScreen.enter(_roomCode, data);
  });

  return { init };
})();

window.RoomScreen = RoomScreen;
