const ProfileScreen = (() => {
  function init() {
    Utils.qs('#screen-profile .btn-back')?.addEventListener('click', () => Utils.setScreen('menu'));
  }

  function load() {
    SocketClient.emit('auth:get_profile');
    SocketClient.emit('auth:leaderboard');
  }

  SocketClient.on('auth:profile', ({ user }) => {
    if (!user) return;
    window.App?.setUser(user);

    const wins   = user.stats?.wins   || 0;
    const losses = user.stats?.losses || 0;
    const total  = wins + losses;
    const wr     = total > 0 ? Math.round(wins / total * 100) : 0;

    Utils.qs('#profile-username').textContent = user.username;
    Utils.qs('#profile-elo').textContent      = user.stats?.elo || 1000;
    Utils.qs('#profile-avatar').textContent   = user.username.charAt(0).toUpperCase();
    Utils.qs('#stat-wins').textContent    = wins;
    Utils.qs('#stat-losses').textContent  = losses;
    Utils.qs('#stat-winrate').textContent = wr + '%';

    // Match history
    const histEl = Utils.qs('#match-history-list');
    if (histEl) {
      const history = user.stats?.matchHistory || [];
      if (history.length === 0) {
        histEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:12px 0;">No matches yet.</div>';
      } else {
        histEl.innerHTML = history.map(h => `
          <div class="history-item ${h.result}">
            <div>
              <span class="history-result">${h.result.toUpperCase()}</span>
              vs <strong>${h.opponent}</strong>
              <span style="color:var(--accent);font-size:0.78rem;"> (${CharacterRegistry.get(h.characterId)?.name || h.characterId})</span>
              ${h.ranked ? '<span style="color:var(--gold);font-size:0.72rem;"> RANKED</span>' : ''}
            </div>
            <div class="history-date">${Utils.formatDate(h.timestamp)}</div>
          </div>
        `).join('');
      }
    }
  });

  SocketClient.on('auth:leaderboard_data', ({ leaderboard }) => {
    const lbEl = Utils.qs('#leaderboard-list');
    if (!lbEl) return;

    const myUsername = window.App?.user?.username;

    lbEl.innerHTML = leaderboard.map(entry => `
      <div class="lb-item ${entry.username === myUsername ? 'lb-self' : ''}">
        <div class="lb-rank ${entry.rank <= 3 ? 'top3' : ''}">#${entry.rank}</div>
        <div class="lb-name">${entry.username}</div>
        <div class="lb-elo">${entry.elo}</div>
        <div class="lb-record">${entry.wins}W ${entry.losses}L</div>
      </div>
    `).join('') || '<div style="color:var(--text-dim);padding:12px;">No ranked data yet.</div>';

    // Rank
    const myRank = leaderboard.find(e => e.username === myUsername);
    const rankEl = Utils.qs('#stat-rank');
    if (rankEl) rankEl.textContent = myRank ? `#${myRank.rank}` : '#-';
  });

  return { init, load };
})();

window.ProfileScreen = ProfileScreen;
