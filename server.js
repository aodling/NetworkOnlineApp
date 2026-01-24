const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { checkConnectivity } = require('./src/connectivity');
const { StateManager } = require('./src/state');

const PORT = process.env.PORT || 3000;
const CHECK_INTERVAL = 1000;

const stateManager = new StateManager();

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// HTTP server for static files
const server = http.createServer((req, res) => {
  let filePath;
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else {
    filePath = path.join(__dirname, 'public', req.url);
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Error loading file');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // Send current state to new client
  const state = stateManager.getState();
  if (state.isOnline !== null) {
    ws.send(JSON.stringify(state));
  }
});

// Broadcast state changes to all clients
stateManager.on('change', (state) => {
  const message = JSON.stringify(state);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
});

// Connectivity check loop
async function runCheck() {
  try {
    const isOnline = await checkConnectivity();
    stateManager.update(isOnline);
  } catch (err) {
    console.error('Connectivity check error:', err.message);
    stateManager.update(false);
  }
}

// Start checking
setInterval(runCheck, CHECK_INTERVAL);
runCheck();

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
