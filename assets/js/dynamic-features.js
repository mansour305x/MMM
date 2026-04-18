(function initDynamicFeatures() {
  const { MMMApi } = window;

  function getAuthHeaders() {
    const token = localStorage.getItem('accessToken') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function createFeatureArea() {
    let root = document.getElementById('dynamicFeaturesArea');
    if (root) return root;

    root = document.createElement('section');
    root.id = 'dynamicFeaturesArea';
    root.style.marginTop = '16px';
    root.style.marginBottom = '16px';
    root.innerHTML = `
      <div class="card" style="padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <strong>مزايا ديناميكية</strong>
          <a href="owner-console.html" style="font-size:12px;">لوحة المالك</a>
        </div>
        <div id="dynamicFeatureItems" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
      </div>
    `;

    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.prepend(root);
    return root;
  }

  async function loadDynamicFeatures() {
    if (!MMMApi) return;
    const area = createFeatureArea();
    const list = area.querySelector('#dynamicFeatureItems');
    if (!list) return;

    try {
      const rows = await MMMApi.apiFetch('/api/feature-registry?includeDisabled=false', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!Array.isArray(rows) || rows.length === 0) {
        list.innerHTML = '<span style="opacity:.7;font-size:13px;">لا توجد مزايا ديناميكية مفعلة</span>';
        return;
      }

      list.innerHTML = rows.map((row) => {
        const cfg = typeof row.config_json === 'string' ? JSON.parse(row.config_json || '{}') : (row.config_json || {});
        if (row.kind === 'page' && cfg.path) {
          return `<a class="btn btn-outline btn-sm" href="${cfg.path}">${cfg.label || row.name}</a>`;
        }
        if (row.kind === 'button') {
          return `<button class="btn btn-outline btn-sm" type="button">${cfg.label || row.name}</button>`;
        }
        return `<span class="badge badge-gold">${row.name}</span>`;
      }).join('');
    } catch {
      list.innerHTML = '<span style="color:#dc3545;font-size:13px;">تعذر تحميل المزايا الديناميكية</span>';
    }
  }

  document.addEventListener('DOMContentLoaded', loadDynamicFeatures);
})();
