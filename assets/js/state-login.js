(function initStateLoginPage() {
  const { MMMApi } = window;

  document.addEventListener('DOMContentLoaded', function onReady() {
    const form = document.getElementById('stateLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMessage');

    if (!form || !loginBtn || !errorMsg || !MMMApi) return;

    function showError(message) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = message;
    }

    form.addEventListener('submit', async function onSubmit(event) {
      event.preventDefault();
      errorMsg.style.display = 'none';

      const stateNameInput = document.getElementById('stateName');
      const passwordInput = document.getElementById('password');
      if (!stateNameInput || !passwordInput) return;

      const stateName = stateNameInput.value.trim();
      const password = passwordInput.value;
      if (!stateName || !password) {
        showError('اسم الولاية وكلمة المرور مطلوبان');
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = 'جاري الدخول...';

      try {
        const data = await MMMApi.apiFetch('/api/auth/login-state', {
          method: 'POST',
          body: JSON.stringify({ stateName, password })
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('apiBase', MMMApi.detectApiBase());
        window.location.href = 'dashboard.html';
      } catch (error) {
        showError(error && error.message ? error.message : 'فشل تسجيل الدخول');
        loginBtn.disabled = false;
        loginBtn.textContent = 'دخول الولاية';
      }
    });
  });
})();
