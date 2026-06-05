const MainMenu = (() => {
  function init() {
    Utils.qsa('[data-screen]', Utils.qs('#screen-menu')).forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.screen;
        _navigate(target);
      });
    });

    Utils.qs('#menu-settings-btn')?.addEventListener('click', () => {
      Utils.setScreen('settings');
    });
  }

  function _navigate(target) {
    switch (target) {
      case 'casual':
      case 'ranked':
        // Go to character select first, then matchmaking
        CharacterSelect.open({ mode: target });
        break;
      case 'room':
        Utils.setScreen('room');
        RoomScreen.init();
        break;
      case 'training':
        CharacterSelect.open({ mode: 'training' });
        break;
      case 'profile':
        Utils.setScreen('profile');
        ProfileScreen.load();
        break;
    }
  }

  function refresh(user) {
    if (!user) return;
    const nameEl = Utils.qs('#menu-username');
    const eloEl  = Utils.qs('#menu-elo');
    if (nameEl) nameEl.textContent = user.username;
    if (eloEl)  eloEl.textContent  = `ELO ${user.stats?.elo || 1000}`;
  }

  return { init, refresh };
})();

window.MainMenu = MainMenu;
