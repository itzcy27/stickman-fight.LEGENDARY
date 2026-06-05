/**
 * App bootstrap — initializes everything once the DOM is ready.
 */
const App = (() => {
  let user = null;

  function setUser(u) {
    user = u;
    window.App.user = u;
  }

  function init() {
    // Register characters
    CharacterRegistry.init();

    // Connect socket
    SocketClient.connect();

    // Init screens
    LoginScreen.init();
    MainMenu.init();
    ProfileScreen.init();

    // Settings bindings
    _initSettings();

    // Socket lifecycle
    SocketClient.on('__connected', () => {
      // Auto-login if username is stored
      const saved = localStorage.getItem('sf_username');
      if (saved) {
        SocketClient.emit('auth:login', { username: saved });
      } else {
        Utils.setScreen('login');
      }
    });

    SocketClient.on('__disconnected', (reason) => {
      console.warn('Disconnected:', reason);
      // If in-game, try reconnect silently
      if (window._pendingRoomCode) {
        SocketClient.emit('game:resync', { roomCode: window._pendingRoomCode });
      }
    });

    SocketClient.on('auth:success', ({ user: u }) => {
      setUser(u);
      Utils.setScreen('menu');
      MainMenu.refresh(u);
    });
  }

  function _initSettings() {
    Utils.qs('#close-settings')?.addEventListener('click', () => {
      // Return to previous screen (just go to menu)
      Utils.setScreen('menu');
    });

    // Persist settings in localStorage
    const shake = Utils.qs('#setting-shake');
    if (shake) {
      shake.checked = localStorage.getItem('sf_shake') !== '0';
      shake.addEventListener('change', () => {
        localStorage.setItem('sf_shake', shake.checked ? '1' : '0');
        Camera.setEnabled(shake.checked);
      });
    }

    const hitboxes = Utils.qs('#setting-hitboxes');
    if (hitboxes) {
      hitboxes.checked = localStorage.getItem('sf_hitboxes') === '1';
      hitboxes.addEventListener('change', () => {
        localStorage.setItem('sf_hitboxes', hitboxes.checked ? '1' : '0');
      });
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { setUser, get user() { return user; } };
})();

window.App = App;
