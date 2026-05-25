import { normalize } from './normalizer/index.js';
import { enqueue, dequeue, markSuccess, markFailure, queueSize } from './queue.js';
import { v4 as uuidv4 } from 'uuid';

const CONFIG_KEY = 'insight_config';

interface Config {
  ingest_url: string;
  ingest_token: string;
  profile_urn?: string;
  enabled: boolean;
  last_sync_at?: string;
  paused_until?: number;
}

async function getConfig(): Promise<Config | null> {
  const storage = await chrome.storage.local.get(CONFIG_KEY);
  return storage[CONFIG_KEY] ?? null;
}

// Listen for captured Voyager responses from content script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type !== 'VOYAGER_CAPTURE') return;
  handleCapture(message.url, message.data, message.timestamp);
});

// Listen for popup requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    getStatus().then(sendResponse);
    return true;
  }
  if (message.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({ [CONFIG_KEY]: message.config }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'SYNC_NOW') {
    flushQueue().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function handleCapture(url: string, data: unknown, timestamp: string): Promise<void> {
  const config = await getConfig();
  if (!config?.enabled) return;

  // Check for pause
  if (config.paused_until && Date.now() < config.paused_until) return;

  const normalized = normalize(url, data);
  if (!normalized) return;

  // If we captured a profile URN from this response, store it
  if (normalized.profile_urn && !config.profile_urn) {
    await chrome.storage.local.set({
      [CONFIG_KEY]: { ...config, profile_urn: normalized.profile_urn }
    });
  }

  const profileUrn = normalized.profile_urn ?? config.profile_urn;
  if (!profileUrn && normalized.payload_type !== 'profile_identity') return;

  const capture_id = uuidv4();
  const payload = {
    capture_id,
    endpoint: url,
    captured_at: timestamp,
    profile_urn: profileUrn ?? '',
    payload_type: normalized.payload_type,
    data: normalized.data,
  };

  // Try to ship immediately; queue on failure
  const shipped = await ship(payload, config);
  if (!shipped) {
    await enqueue({ id: capture_id, payload });
  }
}

async function ship(payload: unknown, config: Config): Promise<boolean> {
  try {
    const response = await fetch(config.ingest_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ingest_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429 || response.status >= 500) {
      // Pause capture for 30 minutes on rate limit / server error
      if (response.status === 429) {
        const currentConfig = await getConfig();
        if (currentConfig) {
          await chrome.storage.local.set({
            [CONFIG_KEY]: { ...currentConfig, paused_until: Date.now() + 30 * 60 * 1000 }
          });
        }
      }
      return false;
    }

    await chrome.storage.local.set({ [CONFIG_KEY]: { ...config, last_sync_at: new Date().toISOString() } });
    return true;
  } catch {
    return false;
  }
}

async function flushQueue(): Promise<void> {
  const config = await getConfig();
  if (!config) return;

  const items = await dequeue();
  for (const item of items) {
    const shipped = await ship(item.payload, config);
    if (shipped) {
      await markSuccess(item.id);
    } else {
      await markFailure(item.id);
    }
    // Throttle
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }
}

async function getStatus() {
  const config = await getConfig();
  const pending = await queueSize();
  return {
    enabled: config?.enabled ?? false,
    configured: !!(config?.ingest_url && config?.ingest_token),
    profile_urn: config?.profile_urn,
    last_sync_at: config?.last_sync_at,
    paused_until: config?.paused_until,
    pending_queue: pending,
  };
}

// Alarm for periodic queue flush
chrome.alarms.create('flush_queue', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush_queue') flushQueue();
});
