import { normalize } from './normalizer/index.js';
import { enqueue, dequeue, markSuccess, markFailure, queueSize } from './queue.js';
import { v4 as uuidv4 } from 'uuid';

const CONFIG_KEY = 'insight_config';

// VERIFY against current LinkedIn UI — these page URLs change; update if capture is empty.
const ANALYTICS_PAGES = [
  'https://www.linkedin.com/analytics/creator/content/',
  'https://www.linkedin.com/analytics/creator/audience/',
  'https://www.linkedin.com/dashboard/',  // profile/followers surface
];

const AUTO_CAPTURE_ALARM = 'auto_capture';
const AUTO_CAPTURE_DEFAULT_INTERVAL = 720; // minutes (12h)
const AUTO_CAPTURE_MIN_INTERVAL = 180;     // minutes (3h)
const AUTO_CAPTURE_TAB_DWELL_MS = 20_000;  // how long to let each tab load before closing
const AUTO_CAPTURE_TAB_SPACING_MS = 5_000; // gap between opening successive tabs

interface Config {
  ingest_url: string;
  ingest_token: string;
  profile_urn?: string;
  enabled: boolean;
  last_sync_at?: string;
  paused_until?: number;
  // Auto-capture fields
  auto_capture: boolean;
  interval_minutes: number;
  last_auto_run?: string;
  next_auto_run?: string;
}

async function getConfig(): Promise<Config | null> {
  const storage = await chrome.storage.local.get(CONFIG_KEY);
  return storage[CONFIG_KEY] ?? null;
}

// ── Auto-capture helpers ──────────────────────────────────────────────────────

/** Clamp interval to minimum, apply ±25% jitter, return delayInMinutes. */
function jitteredDelay(intervalMinutes: number): number {
  const clamped = Math.max(intervalMinutes, AUTO_CAPTURE_MIN_INTERVAL);
  const jitter = clamped * 0.25 * (Math.random() * 2 - 1); // ±25%
  return Math.max(AUTO_CAPTURE_MIN_INTERVAL, Math.round(clamped + jitter));
}

/** Register (or refresh) the auto_capture alarm. Clears first so it's idempotent. */
async function scheduleAutoCapture(config: Config): Promise<void> {
  await chrome.alarms.clear(AUTO_CAPTURE_ALARM);
  if (!config.auto_capture || !config.ingest_url || !config.ingest_token) return;

  const delay = jitteredDelay(config.interval_minutes ?? AUTO_CAPTURE_DEFAULT_INTERVAL);
  const nextRunAt = new Date(Date.now() + delay * 60 * 1000).toISOString();

  await chrome.alarms.create(AUTO_CAPTURE_ALARM, { delayInMinutes: delay });

  // Persist projected next_auto_run so the popup can display it
  const current = await getConfig();
  if (current) {
    await chrome.storage.local.set({
      [CONFIG_KEY]: { ...current, next_auto_run: nextRunAt },
    });
  }
}

/** Open each analytics page in an inactive background tab, wait for it to load
 *  (so the existing fetch hook captures Voyager responses), then close it. */
async function runAutoCapture(): Promise<void> {
  const config = await getConfig();
  if (!config?.auto_capture || !config.ingest_url || !config.ingest_token) return;

  for (const url of ANALYTICS_PAGES) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      // Let the page load and trigger LinkedIn's own JS (which the fetch hook intercepts)
      await new Promise(resolve => setTimeout(resolve, AUTO_CAPTURE_TAB_DWELL_MS));
      if (tab.id != null) await chrome.tabs.remove(tab.id).catch(() => {});
    } catch {
      // One page failing must not abort the rest
    }
    // Space pages out so we're not slamming LinkedIn simultaneously
    await new Promise(resolve => setTimeout(resolve, AUTO_CAPTURE_TAB_SPACING_MS));
  }

  // Record completion and schedule next run with fresh jitter
  const updated = await getConfig();
  if (updated) {
    const delay = jitteredDelay(updated.interval_minutes ?? AUTO_CAPTURE_DEFAULT_INTERVAL);
    const nextRunAt = new Date(Date.now() + delay * 60 * 1000).toISOString();
    await chrome.storage.local.set({
      [CONFIG_KEY]: {
        ...updated,
        last_auto_run: new Date().toISOString(),
        next_auto_run: nextRunAt,
      },
    });
    // Recreate alarm with fresh jitter (using delayInMinutes, not periodInMinutes)
    await chrome.alarms.clear(AUTO_CAPTURE_ALARM);
    await chrome.alarms.create(AUTO_CAPTURE_ALARM, { delayInMinutes: delay });
  }
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
    const newConfig: Config = message.config;
    // Apply safe defaults for auto-capture fields if not supplied
    if (newConfig.auto_capture === undefined) {
      newConfig.auto_capture = !!(newConfig.ingest_url && newConfig.ingest_token);
    }
    if (!newConfig.interval_minutes || newConfig.interval_minutes < AUTO_CAPTURE_MIN_INTERVAL) {
      newConfig.interval_minutes = AUTO_CAPTURE_DEFAULT_INTERVAL;
    }
    chrome.storage.local.set({ [CONFIG_KEY]: newConfig }).then(() => {
      scheduleAutoCapture(newConfig);
      sendResponse({ ok: true });
    });
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
    // Auto-capture status
    auto_capture: config?.auto_capture ?? false,
    interval_minutes: config?.interval_minutes ?? AUTO_CAPTURE_DEFAULT_INTERVAL,
    last_auto_run: config?.last_auto_run,
    next_auto_run: config?.next_auto_run,
  };
}

// ── Alarms ───────────────────────────────────────────────────────────────────

// Periodic queue flush (unchanged)
chrome.alarms.create('flush_queue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush_queue') flushQueue();
  if (alarm.name === AUTO_CAPTURE_ALARM) runAutoCapture();
});

// ── Startup: re-register auto_capture alarm ──────────────────────────────────

async function initAlarms(): Promise<void> {
  const config = await getConfig();
  if (config) await scheduleAutoCapture(config);
}

chrome.runtime.onInstalled.addListener(() => initAlarms());
chrome.runtime.onStartup.addListener(() => initAlarms());
