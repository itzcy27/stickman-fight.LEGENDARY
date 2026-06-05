const CharacterSelect = (() => {
  let _context   = null; // { mode, roomCode }
  let _selected  = 'ryoku';

  function open(context) {
    _context  = context;
    _selected = window.App?.user?.settings?.selectedCharacter || 'ryoku';
    Utils.setScreen('charselect');
    _render();
  }

  function _render() {
    const grid      = Utils.qs('#char-grid');
    const titleEl   = Utils.qs('#charselect-title');
    const confirmBtn= Utils.qs('#char-select-confirm');

    if (titleEl) titleEl.textContent = _context?.mode === 'training' ? 'Select Fighter — Training' : 'Select Fighter';

    // Build cards
    grid.innerHTML = '';
    CharacterRegistry.getAll().forEach(char => {
      const card   = document.createElement('div');
      card.className = 'char-card' + (char.id === _selected ? ' active' : '');
      card.dataset.id = char.id;

      const cv = document.createElement('canvas');
      cv.width  = 100;
      cv.height = 130;
      const ctxCard = cv.getContext('2d');
      char.draw(ctxCard, 50, 120, null, true);

      const name = document.createElement('div');
      name.className = 'char-card-name';
      name.textContent = char.name;

      card.appendChild(cv);
      card.appendChild(name);
      card.addEventListener('click', () => _selectChar(char.id));
      grid.appendChild(card);
    });

    _updatePreview(_selected);

    confirmBtn?.addEventListener('click', _confirm);

    // Back button
    Utils.qs('#screen-charselect .btn-back')?.addEventListener('click', () => Utils.setScreen('menu'));
  }

  function _selectChar(id) {
    _selected = id;
    Utils.qsa('.char-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
    _updatePreview(id);
    // Persist setting
    SocketClient.emit('auth:update_character', { characterId: id });
    if (window.App?.user) window.App.user.settings.selectedCharacter = id;
  }

  function _updatePreview(id) {
    const char  = CharacterRegistry.get(id);
    const cv    = Utils.qs('#char-preview-canvas');
    const nameEl= Utils.qs('#preview-name');
    const statsEl = Utils.qs('#preview-stats');
    const ultEl = Utils.qs('#preview-ultimate');

    // Draw preview
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    char.draw(ctx, cv.width / 2, cv.height - 20, null, true);

    if (nameEl) nameEl.textContent = char.name;
    if (ultEl)  ultEl.innerHTML = `<strong>⚡ ${char.ultimateName}</strong>${char.ultimateDesc}`;

    // Stat bars
    if (statsEl) {
      const ratings = char.statRatings || {};
      statsEl.innerHTML = ['speed','power','defense','mobility'].map(stat => `
        <div class="stat-row">
          <div class="stat-row-label">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
          <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${((ratings[stat] || 0.5) * 100).toFixed(0)}%"></div></div>
        </div>
      `).join('');
    }
  }

  function _confirm() {
    if (!_context) return;
    const mode = _context.mode;

    if (mode === 'training') {
      Utils.setScreen('training');
      TrainingScreen.start(_selected);
      return;
    }

    if (mode === 'casual' || mode === 'ranked') {
      MatchmakingScreen.start(mode, _selected);
      return;
    }

    if (mode === 'room') {
      // Handled by RoomScreen after calling open()
      _context.onConfirm?.(_selected);
    }
  }

  return { open, getSelected: () => _selected };
})();

window.CharacterSelect = CharacterSelect;
