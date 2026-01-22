const EventEmitter = require('events');

class StateManager extends EventEmitter {
  constructor() {
    super();
    this.isOnline = null;
    this.stateChangedAt = null;
    this.lastOfflineAt = null;
  }

  update(isOnline) {
    const now = Date.now();

    // Initialize state on first update
    if (this.isOnline === null) {
      this.isOnline = isOnline;
      this.stateChangedAt = now;
      if (!isOnline) {
        this.lastOfflineAt = now;
      }
      this.emit('change', this.getState());
      return;
    }

    // State changed
    if (this.isOnline !== isOnline) {
      this.isOnline = isOnline;
      this.stateChangedAt = now;
      if (!isOnline) {
        this.lastOfflineAt = now;
      }
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
