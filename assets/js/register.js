(function initRegisterPage() {
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

  function checkStrength(val) {
    const bars = [
      document.getElementById('sb1'),
      document.getElementById('sb2'),
      document.getElementById('sb3'),
      document.getElementById('sb4')
    ];
    const label = document.getElementById('strengthLabel');
    bars.forEach((b) => {
      if (b) b.className = 'strength-bar';
    });

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const cls = score <= 1 ? 'w' : score <= 2 ? 'm' : 's';
    const texts = ['', 'ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'قوية جدًا'];
    for (let i = 0; i < score; i += 1) {
      if (bars[i]) bars[i].classList.add(cls);
    }

    if (label) {
      label.textContent = texts[score] || 'أدخل كلمة المرور';
      label.style.color = cls === 'w' ? 'var(--danger)' : cls === 'm' ? 'var(--warning)' : 'var(--success)';
    }
  }

  window.togglePassword = togglePassword;
  window.checkStrength = checkStrength;

  document.addEventListener('DOMContentLoaded', function onReady() {
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMessage');

    if (!form || !submitBtn || !errorMsg || !MMMApi) {
      return;
    }

    function showMessage(message, success) {
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
      errorMsg.style.color = success ? '#28a745' : '#dc3545';
      errorMsg.style.background = success ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    }

    form.addEventListener('submit', async function onSubmit(event) {
      event.preventDefault();

      const firstName = document.getElementById('firstName');
      const lastName = document.getElementById('lastName');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const pw1 = document.getElementById('pw1');
      const pw2 = document.getElementById('pw2');
      const terms = document.getElementById('terms');

      if (!firstName || !lastName || !email || !phone || !pw1 || !pw2 || !terms) return;

      if (!firstName.value.trim() || !email.value.trim() || !pw1.value) {
        showMessage('الاسم والبريد الإلكتروني وكلمة المرور مطلوبة', false);
        return;
      }

      if (pw1.value.length < 8) {
        showMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', false);
        return;
      }

      if (pw1.value !== pw2.value) {
        showMessage('كلمات المرور غير متطابقة', false);
        return;
      }

      if (!terms.checked) {
        showMessage('يجب الموافقة على الشروط والأحكام', false);
        return;
      }

      const payload = {
        fullName: `${firstName.value} ${lastName.value || ''}`.trim(),
        email: email.value.trim(),
        password: pw1.value
      };

      if (phone.value.trim()) {
        payload.phone = phone.value.trim();
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
      errorMsg.style.display = 'none';

      try {
        await MMMApi.apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        showMessage('تم إنشاء الحساب بنجاح! جاري إعادة التوجيه...', true);
        setTimeout(function redirect() {
          window.location.href = 'login.html';
        }, 1200);
      } catch (error) {
        showMessage(error && error.message ? error.message : 'فشل إنشاء الحساب', false);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء الحساب';
      }
    });
  });
})();
