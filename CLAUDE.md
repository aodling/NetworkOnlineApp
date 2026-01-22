# Network Online App

## Overview
A Node.js application that monitors internet connectivity and displays status via a web interface with real-time WebSocket updates.

## Quick Start
```bash
npm install
npm start
```
Then open http://localhost:3000

## Architecture
- **Connectivity Checker** (`src/connectivity.js`): Pings 1.1.1.1 and 8.8.8.8 every second
- **State Manager** (`src/state.js`): Tracks online/offline state and timestamps
- **Server** (`server.js`): HTTP + WebSocket server
- **Web Interface** (`public/index.html`): Real-time status display

## Key Files
- `server.js` - Main entry point, HTTP server, WebSocket broadcasting
- `src/connectivity.js` - ICMP ping logic using `ping` package
- `src/state.js` - EventEmitter-based state management
- `public/index.html` - Single-file web interface with embedded CSS/JS

## Environment Variables
- `PORT` - Server port (default: 3000)

## Dependencies
- `ws` - WebSocket server
- `ping` - ICMP ping utility
