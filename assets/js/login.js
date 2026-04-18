(function initLoginPage() {
  const { MMMApi } = window;

  function togglePassword(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  }

  window.togglePassword = togglePassword;

  document.addEventListener('DOMContentLoaded', function onReady() {
    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMessage');
    const rememberMe = document.getElementById('rememberMe');
    const checkBox = document.getElementById('checkBox');

    if (!form || !loginBtn || !errorMsg || !rememberMe || !checkBox || !MMMApi) {
      return;
    }

    rememberMe.addEventListener('change', function onRememberChange() {
      const icon = checkBox.querySelector('i');
      if (!icon) return;

      if (rememberMe.checked) {
        checkBox.style.background = 'var(--accent-muted)';
        checkBox.style.borderColor = 'var(--gold-500)';
        icon.style.display = 'flex';
      } else {
        checkBox.style.background = 'var(--bg-card)';
        checkBox.style.borderColor = 'var(--border-default)';
        icon.style.display = 'none';
      }
    });

    function showError(message) {
      errorMsg.style.display = 'block';
      errorMsg.style.color = '#dc3545';
      errorMsg.style.background = 'rgba(220, 53, 69, 0.1)';
      errorMsg.textContent = message;
    }

    form.addEventListener('submit', async function onSubmit(event) {
      event.preventDefault();

      const email = document.getElementById('email');
      const password = document.getElementById('password');
      if (!email || !password) return;

      const identifier = email.value.trim();
      const pass = password.value;

      if (!identifier || !pass) {
        showError('البريد الإلكتروني وكلمة المرور مطلوبة');
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
      errorMsg.style.display = 'none';

      try {
        const data = await MMMApi.apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password: pass })
        });

        if (!data.accessToken || !data.user) {
          throw new Error('بيانات تسجيل الدخول غير مكتملة من الخادم');
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('apiBase', MMMApi.detectApiBase());

        window.location.href = 'dashboard.html';
      } catch (error) {
        showError(error && error.message ? error.message : 'فشل تسجيل الدخول');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> تسجيل الدخول';
      }
    });
  });
})();
