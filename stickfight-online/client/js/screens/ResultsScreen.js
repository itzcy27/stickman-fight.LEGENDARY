const ResultsScreen = (() => {
  function show(result, mySlot) {
    Utils.setScreen('results');

    const titleEl   = Utils.qs('#results-title');
    const fightersEl= Utils.qs('#results-fighters');
    const statsEl   = Utils.qs('#results-stats');
    const eloEl     = Utils.qs('#elo-change');

    const isWin  = result.winnerSlot === mySlot;
    const isDraw = result.winnerSlot < 0;

    if (titleEl) {
      titleEl.textContent = isDraw ? 'DRAW' : (isWin ? 'VICTORY!' : 'DEFEAT');
      titleEl.className   = 'results-title ' + (isDraw ? 'draw' : (isWin ? '' : 'loss'));
    }

    // Fighters
    if (fightersEl && result.players) {
      const [p0, p1] = result.players;
      const c0 = CharacterRegistry.get(p0?.characterId);
      const c1 = CharacterRegistry.get(p1?.characterId);
      const score0 = result.roundScores?.[0] || 0;
      const score1 = result.roundScores?.[1] || 0;

      const makeCanvas = (char) => {
        const cv = document.createElement('canvas');
        cv.width = 120; cv.height = 160;
        char?.draw(cv.getContext('2d'), 60, 150, null, true);
        return cv.outerHTML;
      };

      fightersEl.innerHTML = `
        <div class="result-fighter">
          ${makeCanvas(c0)}
          <div class="result-fighter-name">${p0?.username || 'P1'}</div>
          <div class="result-fighter-score">${score0}</div>
        </div>
        <div class="result-vs">-</div>
        <div class="result-fighter">
          ${makeCanvas(c1)}
          <div class="result-fighter-name">${p1?.username || 'P2'}</div>
          <div class="result-fighter-score">${score1}</div>
        </div>
      `;

      // Fix canvases — innerHTML doesn't run scripts, redraw
      const canvases = fightersEl.querySelectorAll('canvas');
      if (canvases[0]) c0?.draw(canvases[0].getContext('2d'), 60, 150, null, true);
      if (canvases[1]) c1?.draw(canvases[1].getContext('2d'), 60, 150, null, true);
    }

    // Stats
    if (statsEl && result.players) {
      const [p0, p1] = result.players;
      statsEl.innerHTML = `
        <div class="result-stat-box">
          <div class="result-stat-val">${p0?.damageDealt || 0}</div>
          <div>DMG Dealt (P1)</div>
        </div>
        <div class="result-stat-box">
          <div class="result-stat-val">${p1?.damageDealt || 0}</div>
          <div>DMG Dealt (P2)</div>
        </div>
      `;
    }

    // ELO change
    const eloData = window._pendingEloUpdate;
    if (eloEl) {
      if (eloData) {
        const myName  = window.App?.user?.username;
        const myEntry = eloData.players?.find(p => p.username === myName);
        if (myEntry) {
          const delta = myEntry.delta;
          eloEl.textContent  = `ELO: ${myEntry.elo} (${delta >= 0 ? '+' : ''}${delta})`;
          eloEl.className    = 'elo-change ' + (delta >= 0 ? 'positive' : 'negative');
        }
        window._pendingEloUpdate = null;
      } else {
        eloEl.textContent = '';
      }
    }

    // Buttons
    Utils.qs('#results-menu')?.addEventListener('click', () => {
      GameScreen.leave();
      Utils.setScreen('menu');
    });

    Utils.qs('#results-rematch')?.addEventListener('click', () => {
      GameScreen.leave();
      Utils.setScreen('menu');
      // Could add rematch logic here
    });
  }

  return { show };
})();

window.ResultsScreen = ResultsScreen;
