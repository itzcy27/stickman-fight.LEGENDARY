const LoginScreen = (() => {
  function init() {
    const input  = Utils.qs('#login-input');
    const btn    = Utils.qs('#login-btn');
    const errEl  = Utils.qs('#login-error');

    // Load saved username
    const saved = localStorage.getItem('sf_username');
    if (saved && input) input.value = saved;

    if (btn) btn.addEventListener('click', submit);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    function submit() {
      const name = input?.value?.trim() || '';
      if (name.length < 2) { errEl.textContent = 'Username must be at least 2 characters.'; return; }
      errEl.textContent = '';
      SocketClient.emit('auth:login', { username: name });
    }
  }

  SocketClient.on('auth:success', ({ user, isNew }) => {
    localStorage.setItem('sf_username', user.username);
    window.App.setUser(user);
    Utils.setScreen('menu');
    MainMenu.refresh(user);
  });

  SocketClient.on('auth:error', ({ message }) => {
    const errEl = Utils.qs('#login-error');
    if (errEl) errEl.textContent = message;
  });

  return { init };
})();

window.LoginScreen = LoginScreen;
