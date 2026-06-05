const MatchmakingScreen = (() => {
  let _mode      = 'casual';
  let _startTime = 0;
  let _timerInt  = null;

  function start(mode, characterId) {
    _mode      = mode;
    _startTime = Date.now();
    Utils.setScreen('matchmaking');

    const titleEl  = Utils.qs('#mm-title');
    const statusEl = Utils.qs('#mm-status');
    if (titleEl) titleEl.textContent = mode === 'ranked' ? '🏆 Finding Ranked Match…' : '⚔️ Finding Casual Match…';
    if (statusEl) statusEl.textContent = 'Searching for opponent…';

    // Start timer
    clearInterval(_timerInt);
    _timerInt = setInterval(() => {
      const elapsed = Math.floor((Date.now() - _startTime) / 1000);
      const timerEl = Utils.qs('#mm-timer');
      if (timerEl) timerEl.textContent = Utils.formatTime(elapsed);
    }, 1000);

    SocketClient.emit(mode === 'ranked' ? 'mm:join_ranked' : 'mm:join_casual', { characterId });

    Utils.qs('.cancel-mm')?.addEventListener('click', cancel);
  }

  function cancel() {
    clearInterval(_timerInt);
    SocketClient.emit('mm:cancel');
    Utils.setScreen('menu');
  }

  SocketClient.on('mm:matched', ({ roomCode, mode, opponent }) => {
    clearInterval(_timerInt);
    window._pendingRoomCode = roomCode;
    const statusEl = Utils.qs('#mm-status');
    if (statusEl) statusEl.textContent = `Opponent found: ${opponent}! Starting…`;
  });

  SocketClient.on('game:start', (data) => {
    // Only handle if we're on the matchmaking screen
    if (!document.getElementById('screen-matchmaking')?.classList.contains('active')) return;
    clearInterval(_timerInt);
    if (window._pendingRoomCode) {
      GameScreen.enter(window._pendingRoomCode, data);
      window._pendingRoomCode = null;
    }
  });

  SocketClient.on('mm:cancelled', () => {
    clearInterval(_timerInt);
  });

  return { start, cancel };
})();

window.MatchmakingScreen = MatchmakingScreen;
