const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');
const { PORT, NODE_ENV } = require('./config');
const registerAllHandlers = require('./socketHandlers/index');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(cors());
app.use(express.json());

const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js'))   res.setHeader('Content-Type', 'application/javascript');
    if (filePath.endsWith('.css'))  res.setHeader('Content-Type', 'text/css');
    if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
  }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: NODE_ENV }));

app.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(clientDir, 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerAllHandlers(socket, io);
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Stickman Fight server running on port ${PORT} [${NODE_ENV}]`);
});
