const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// MQTT Configuration
const MQTT_HOST = process.env.MQTT_HOST || '172.16.30.20';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'webclient';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'webclient';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'monitoring/online';

class StateManager extends EventEmitter {
  constructor() {
    super();
    this.isOnline = null;
    this.stateChangedAt = null;
    this.lastOfflineAt = null;
    this.mqttClient = null;
    this.mqttConnected = false;
    this.load();
    this.initMqtt();
    this.startPeriodicPublish();
  }

  startPeriodicPublish() {
    const ONE_HOUR = 60 * 60 * 1000;
    setInterval(() => {
      console.log('[MQTT] Periodic hourly publish');
      this.publishMqtt();
    }, ONE_HOUR);
  }

  initMqtt() {
    const url = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
    console.log(`[MQTT] Connecting to ${url}`);

    this.mqttClient = mqtt.connect(url, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 5000
    });

    this.mqttClient.on('connect', () => {
      console.log('[MQTT] Connected');
      this.mqttConnected = true;
      this.publishMqtt();
    });

    this.mqttClient.on('error', (err) => {
      console.error('[MQTT] Error:', err.message);
    });

    this.mqttClient.on('offline', () => {
      console.log('[MQTT] Disconnected');
      this.mqttConnected = false;
    });
  }

  publishMqtt() {
    if (!this.mqttConnected || this.isOnline === null) return;

    const message = JSON.stringify({ internet_online: this.isOnline });
    this.mqttClient.publish(MQTT_TOPIC, message, { retain: true }, (err) => {
      if (err) {
        console.error('[MQTT] Publish error:', err.message);
      } else {
        console.log(`[MQTT] Published to ${MQTT_TOPIC}: ${message}`);
      }
    });
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
      this.publishMqtt();
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
      this.publishMqtt();
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
