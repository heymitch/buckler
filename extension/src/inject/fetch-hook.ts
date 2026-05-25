// Runs in PAGE context via chrome.scripting.executeScript
// Can see all fetch/XHR calls LinkedIn's own frontend makes

(function() {
  if ((window as unknown as Record<string, unknown>).__insightHooked) return;
  (window as unknown as Record<string, unknown>).__insightHooked = true;

  const VOYAGER_RE = /\/voyager\/api\//;

  // Hook fetch
  const origFetch = window.fetch.bind(window);
  window.fetch = async function(...args: Parameters<typeof fetch>) {
    const response = await origFetch(...args);

    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    if (VOYAGER_RE.test(url)) {
      const clone = response.clone();
      clone.json().then((data: unknown) => {
        window.postMessage({
          type: '__INSIGHT_CAPTURE__',
          url,
          data,
          timestamp: new Date().toISOString(),
        }, '*');
      }).catch(() => {});
    }
    return response;
  };

  // Hook XHR
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: unknown[]) {
    (this as XMLHttpRequest & { _insightUrl?: string })._insightUrl = url.toString();
    return origOpen.apply(this, [method, url, ...(rest as [boolean?, string?, string?])]);
  };

  XMLHttpRequest.prototype.send = function(...args: unknown[]) {
    const url = (this as XMLHttpRequest & { _insightUrl?: string })._insightUrl ?? '';
    if (VOYAGER_RE.test(url)) {
      this.addEventListener('load', function() {
        try {
          const data = JSON.parse(this.responseText);
          window.postMessage({
            type: '__INSIGHT_CAPTURE__',
            url,
            data,
            timestamp: new Date().toISOString(),
          }, '*');
        } catch {}
      });
    }
    return origSend.apply(this, args as [Document | XMLHttpRequestBodyInit | null | undefined]);
  };
})();
