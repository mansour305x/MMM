// Shared API helpers for MMM frontend pages.
(function initApiLayer(global) {
  function normalizeOrigin(value) {
    return String(value || '').trim().replace(/\/$/, '');
  }

  function detectApiBase() {
    const stored = normalizeOrigin(localStorage.getItem('apiBase'));
    if (stored) return stored;

    const { hostname, origin, protocol, port } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return normalizeOrigin(`${protocol}//${hostname}:4000`);
    }

    if (hostname.endsWith('.app.github.dev') || hostname.endsWith('.github.dev')) {
      return normalizeOrigin(origin.replace(/-\d+\./, '-4000.').replace(/:\d+$/, ':4000'));
    }

    if (hostname.endsWith('github.io')) {
      return 'https://mmm-api.onrender.com';
    }

    return normalizeOrigin(`${protocol}//${hostname}${port ? `:${port}` : ''}`);
  }

  async function parseResponseBody(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  async function apiFetch(path, options) {
    const apiBase = detectApiBase();
    const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
    const hasBody = options && typeof options === 'object' && 'body' in options && options.body !== undefined && options.body !== null;
    const baseHeaders = hasBody ? { 'Content-Type': 'application/json' } : {};
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...baseHeaders,
        ...(options && options.headers ? options.headers : {})
      }
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const message = (payload && payload.message) || `HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  global.MMMApi = {
    detectApiBase,
    apiFetch
  };
})(window);
