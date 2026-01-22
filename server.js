const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { checkConnectivity } = require('./src/connectivity');
const { StateManager } = require('./src/state');

const PORT = process.env.PORT || 3000;
const CHECK_INTERVAL = 1000;

const stateManager = new StateManager();

// HTTP server for static files
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
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
