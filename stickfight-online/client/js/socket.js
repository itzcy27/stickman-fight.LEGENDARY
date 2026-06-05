/**
 * Socket.IO client wrapper.
 * Centralises connection, reconnection, and event routing.
 */
const SocketClient = (() => {
  let socket = null;
  const handlers = {}; // event -> [fn]

  function connect() {
    socket = io({ reconnectionAttempts: 10, reconnectionDelay: 1500 });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      _emit('__connected');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      _emit('__disconnected', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Error:', err.message);
      _emit('__error', err);
    });

    // Wildcard relay — forward all server events to our handlers
    socket.onAny((event, data) => {
      _emit(event, data);
    });
  }

  function on(event, fn) {
    if (!handlers[event]) handlers[event] = [];
    handlers[event].push(fn);
  }

  function off(event, fn) {
    if (!handlers[event]) return;
    handlers[event] = handlers[event].filter(h => h !== fn);
  }

  function emit(event, data) {
    if (!socket) return;
    socket.emit(event, data);
  }

  function _emit(event, data) {
    (handlers[event] || []).forEach(fn => fn(data));
  }

  function getId() { return socket?.id; }

  return { connect, on, off, emit, getId };
})();

window.SocketClient = SocketClient;
