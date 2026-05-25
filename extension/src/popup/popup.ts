document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status-val')!;
  const urnEl = document.getElementById('urn-val')!;
  const syncEl = document.getElementById('sync-val')!;
  const queueEl = document.getElementById('queue-val')!;
  const pauseEl = document.getElementById('pause-val')!;
  const autoCaptureToggle = document.getElementById('auto-capture-toggle') as HTMLInputElement;
  const autoCaptureVal = document.getElementById('auto-capture-val')!;
  const intervalVal = document.getElementById('interval-val')!;
  const lastAutoVal = document.getElementById('last-auto-val')!;
  const nextAutoVal = document.getElementById('next-auto-val')!;

  function fmtTime(iso?: string): string {
    if (!iso) return 'NEVER';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Load status
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (status) => {
    if (!status) return;

    if (!status.configured) {
      statusEl.textContent = 'NOT CONFIGURED';
      statusEl.className = 'value err';
    } else if (status.paused_until && Date.now() < status.paused_until) {
      statusEl.textContent = 'PAUSED';
      statusEl.className = 'value warn';
    } else if (status.enabled) {
      statusEl.textContent = 'ACTIVE';
      statusEl.className = 'value ok';
    } else {
      statusEl.textContent = 'DISABLED';
      statusEl.className = 'value warn';
    }

    urnEl.textContent = status.profile_urn
      ? '...' + status.profile_urn.slice(-8)
      : 'NOT YET CAPTURED';

    syncEl.textContent = status.last_sync_at
      ? new Date(status.last_sync_at).toLocaleTimeString()
      : 'NEVER';

    queueEl.textContent = String(status.pending_queue ?? 0);
    queueEl.className = status.pending_queue > 0 ? 'value warn' : 'value ok';

    pauseEl.textContent = status.paused_until && Date.now() < status.paused_until
      ? new Date(status.paused_until).toLocaleTimeString()
      : 'NO';

    // Auto-capture status
    const acOn = status.auto_capture ?? false;
    autoCaptureToggle.checked = acOn;
    autoCaptureVal.textContent = acOn ? 'ON' : 'OFF';
    autoCaptureVal.className = acOn ? 'value ok' : 'value warn';

    const interval = status.interval_minutes ?? 720;
    intervalVal.textContent = `${interval}m (~${Math.round(interval / 60)}h)`;

    lastAutoVal.textContent = fmtTime(status.last_auto_run);
    nextAutoVal.textContent = fmtTime(status.next_auto_run);
  });

  // Load saved config into form
  chrome.storage.local.get('insight_config', (storage) => {
    const config = storage['insight_config'];
    if (config?.ingest_url) (document.getElementById('ingest-url') as HTMLInputElement).value = config.ingest_url;
    if (config?.ingest_token) (document.getElementById('ingest-token') as HTMLInputElement).value = config.ingest_token;
    const intervalInput = document.getElementById('interval-minutes') as HTMLInputElement;
    intervalInput.value = String(config?.interval_minutes ?? 720);
  });

  // Auto-capture toggle — save immediately without reopening the setup form
  autoCaptureToggle.addEventListener('change', () => {
    const enabled = autoCaptureToggle.checked;
    autoCaptureVal.textContent = enabled ? 'ON' : 'OFF';
    autoCaptureVal.className = enabled ? 'value ok' : 'value warn';

    chrome.storage.local.get('insight_config', (storage) => {
      const config = storage['insight_config'] ?? {};
      chrome.runtime.sendMessage({
        type: 'SAVE_CONFIG',
        config: { ...config, auto_capture: enabled },
      });
    });
  });

  // Sync now
  document.getElementById('sync-btn')!.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    statusEl.textContent = 'SYNCING...';
  });

  // Toggle setup
  const setupSection = document.getElementById('setup-section')!;
  document.getElementById('setup-toggle')!.addEventListener('click', () => {
    setupSection.classList.toggle('visible');
  });
  document.getElementById('setup-cancel')!.addEventListener('click', () => {
    setupSection.classList.remove('visible');
  });

  // Save config
  document.getElementById('save-btn')!.addEventListener('click', () => {
    const ingest_url = (document.getElementById('ingest-url') as HTMLInputElement).value.trim();
    const ingest_token = (document.getElementById('ingest-token') as HTMLInputElement).value.trim();
    const rawInterval = parseInt((document.getElementById('interval-minutes') as HTMLInputElement).value, 10);
    const interval_minutes = isNaN(rawInterval) || rawInterval < 180 ? 720 : rawInterval;

    chrome.runtime.sendMessage({
      type: 'SAVE_CONFIG',
      config: {
        ingest_url,
        ingest_token,
        enabled: true,
        // auto_capture defaults to true when a token is first configured;
        // worker.ts applies the default if the field is absent.
        interval_minutes,
      }
    }, () => {
      setupSection.classList.remove('visible');
      statusEl.textContent = 'CONFIGURED';
      statusEl.className = 'value ok';
    });
  });
});
