// Inject the fetch hook into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/inject/fetch-hook.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Relay captured responses to background worker
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== '__INSIGHT_CAPTURE__') return;

  chrome.runtime.sendMessage({
    type: 'VOYAGER_CAPTURE',
    url: event.data.url,
    data: event.data.data,
    timestamp: event.data.timestamp,
  }).catch(() => {});
});
