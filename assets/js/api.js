// Shared API helpers for MMM frontend pages.
(function initApiLayer(global) {
  const REMOTE_API_FALLBACKS = [
    'https://mmmstate2026.loca.lt',
    'https://mmm-api.onrender.com'
  ];

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
      return REMOTE_API_FALLBACKS[0];
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
    const initialBase = detectApiBase();
    const candidates = [initialBase, ...REMOTE_API_FALLBACKS]
      .map((value) => normalizeOrigin(value))
      .filter((value, index, list) => value && list.indexOf(value) === index);

    const hasBody = options && typeof options === 'object' && 'body' in options && options.body !== undefined && options.body !== null;
    const baseHeaders = hasBody ? { 'Content-Type': 'application/json' } : {};

    let lastError = null;

    for (const apiBase of candidates) {
      const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

      try {
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

        localStorage.setItem('apiBase', apiBase);
        return payload;
      } catch (error) {
        lastError = error;
        const isNetworkError = !error || !('status' in error);

        if (!isNetworkError) {
          throw error;
        }
      }
    }

    throw new Error(
      `تعذر الاتصال بخدمة API. اضبط عنوان الخادم الصحيح ثم أعد المحاولة. آخر خطأ: ${lastError && lastError.message ? lastError.message : 'Failed to fetch'}`
    );
  }

  function setApiBase(value) {
    const normalized = normalizeOrigin(value);
    if (!normalized) {
      localStorage.removeItem('apiBase');
      return;
    }

    localStorage.setItem('apiBase', normalized);
  }

  global.MMMApi = {
    detectApiBase,
    apiFetch,
    setApiBase
  };
})(window);
