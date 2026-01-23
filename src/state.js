const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

class StateManager extends EventEmitter {
  constructor() {
    super();
    this.isOnline = null;
    this.stateChangedAt = null;
    this.lastOfflineAt = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        this.lastOfflineAt = data.lastOfflineAt || null;
        console.log(`[STATE] Loaded persisted state: lastOfflineAt=${this.lastOfflineAt ? new Date(this.lastOfflineAt).toISOString() : 'never'}`);
      }
    } catch (err) {
      console.error('[STATE] Failed to load state:', err.message);
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        lastOfflineAt: this.lastOfflineAt
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[STATE] Failed to save state:', err.message);
    }
  }

  update(isOnline) {
    const now = Date.now();

    // Initialize state on first update
    if (this.isOnline === null) {
      this.isOnline = isOnline;
      this.stateChangedAt = now;
      if (!isOnline) {
        this.lastOfflineAt = now;
        this.save();
      }
      console.log(`[STATE] Initial state: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      this.emit('change', this.getState());
      return;
    }

    // State changed
    if (this.isOnline !== isOnline) {
      const prevState = this.isOnline ? 'ONLINE' : 'OFFLINE';
      const newState = isOnline ? 'ONLINE' : 'OFFLINE';

      this.isOnline = isOnline;
      this.stateChangedAt = now;
      if (!isOnline) {
        this.lastOfflineAt = now;
        this.save();
      }

      console.log(`[STATE] Status changed: ${prevState} -> ${newState} at ${new Date(now).toISOString()}`);
      this.emit('change', this.getState());
    }
  }

  getState() {
    return {
      isOnline: this.isOnline,
      stateChangedAt: this.stateChangedAt,
      lastOfflineAt: this.lastOfflineAt
    };
  }
}

module.exports = { StateManager };
