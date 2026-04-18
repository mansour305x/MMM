(function initOwnerConsole() {
  const { MMMApi } = window;

  function getAuthHeaders() {
    const token = localStorage.getItem('accessToken') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function safeParseJson(raw) {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  async function loadFeatures() {
    const listEl = document.getElementById('featuresList');
    if (!listEl || !MMMApi) return;

    try {
      const rows = await MMMApi.apiFetch('/api/feature-registry?includeDisabled=true', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!Array.isArray(rows) || rows.length === 0) {
        listEl.innerHTML = '<p>لا توجد عناصر بعد.</p>';
        return;
      }

      listEl.innerHTML = rows.map((row) => {
        const stateText = row.state_name ? `ولاية: ${row.state_name}` : 'عام';
        return `
          <div style="border:1px solid var(--border-default);border-radius:10px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center;">
            <div>
              <div style="font-weight:600;">${row.name} <small style="opacity:.7">(${row.code})</small></div>
              <div style="font-size:13px;opacity:.8;">${row.kind} - ${stateText}</div>
            </div>
            <button data-id="${row.id}" data-enabled="${row.enabled}" class="btn btn-outline btn-sm toggle-btn">
              ${row.enabled ? 'تعطيل' : 'تفعيل'}
            </button>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.toggle-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const enabled = btn.getAttribute('data-enabled') === 'true';
          try {
            await MMMApi.apiFetch(`/api/feature-registry/${id}/toggle`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({ enabled: !enabled })
            });
            await loadFeatures();
          } catch (error) {
            alert(error.message || 'فشل التحديث');
          }
        });
      });
    } catch (error) {
      listEl.innerHTML = `<p style="color:#dc3545;">${error.message || 'فشل التحميل'}</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', function onReady() {
    const form = document.getElementById('featureForm');
    const message = document.getElementById('createMessage');
    if (!form || !message || !MMMApi) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const kind = document.getElementById('kind').value;
      const code = document.getElementById('code').value.trim();
      const name = document.getElementById('name').value.trim();
      const description = document.getElementById('description').value.trim();
      const stateName = document.getElementById('stateName').value.trim();
      const configJsonRaw = document.getElementById('configJson').value.trim();

      try {
        await MMMApi.apiFetch('/api/feature-registry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            kind,
            code,
            name,
            description: description || undefined,
            stateName: stateName || undefined,
            configJson: safeParseJson(configJsonRaw),
            enabled: true
          })
        });

        message.textContent = 'تمت الإضافة بنجاح';
        message.style.color = 'var(--success)';
        form.reset();
        await loadFeatures();
      } catch (error) {
        message.textContent = error.message || 'فشلت الإضافة';
        message.style.color = '#dc3545';
      }
    });

    loadFeatures();
  });
})();
