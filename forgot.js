document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem();
  detectSystemTheme();
  initForgotForm();
});

const AUTH_STORAGE_KEY = 'users';

function initThemeSystem() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme') || 'auto';

  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    animateThemeToggle();
  });

  prefersDark.addEventListener('change', () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'auto') {
      applyTheme('auto');
    }
  });
}

function applyTheme(theme) {
  const themeToggleIcon = document.querySelector('#themeToggle i');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  if (theme === 'light' || (theme === 'auto' && !prefersDark.matches)) {
    document.body.classList.add('light-theme');
    themeToggleIcon.className = 'fas fa-sun';
  } else {
    document.body.classList.remove('light-theme');
    themeToggleIcon.className = 'fas fa-moon';
  }
}

function animateThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
  setTimeout(() => {
    themeToggle.style.transform = 'rotate(0) scale(1)';
  }, 300);
}

function detectSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme');

  if (!savedTheme && prefersDark.matches) {
    applyTheme('auto');
  }
}

function initForgotForm() {
  const form = document.getElementById('forgotForm');
  const resetButton = document.getElementById('resetButton');
  const resetButtonText = document.getElementById('resetButtonText');
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  const verificationStep = document.getElementById('verificationStep');
  const subtitle = document.getElementById('flowSubtitle');

  let pendingUserId = null;
  let pendingCode = null;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!verificationStep.hidden) {
      handlePasswordReset(pendingUserId, pendingCode);
      return;
    }

    const identifier = document.getElementById('resetIdentifier').value.trim();
    if (!identifier) {
      showStatus('Please enter your email or username.', 'error');
      return;
    }

    resetButton.disabled = true;
    resetButtonText.textContent = 'Verifying account...';

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
      const match = users.find((user) => {
        return [user.username, user.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase() === identifier.toLowerCase());
      });

      if (!match) {
        showStatus('We could not find that account. Please sign up or try another email.', 'error');
        resetButton.disabled = false;
        resetButtonText.textContent = 'Send reset instructions';
        return;
      }

      if (match.provider) {
        const providerName = match.provider.charAt(0).toUpperCase() + match.provider.slice(1);
        showStatus(`This account uses ${providerName} login. Please continue with ${providerName} on the login page.`, 'info');
        resetButton.disabled = false;
        resetButtonText.textContent = 'Send reset instructions';
        return;
      }

      pendingUserId = match.id;
      pendingCode = String(Math.floor(100000 + Math.random() * 900000));

      verificationStep.hidden = false;
      resendCodeBtn.hidden = false;
      subtitle.textContent = 'Enter the verification code and your new password.';
      resetButton.disabled = false;
      resetButtonText.textContent = 'Reset password';

      showStatus(`Verification code: ${pendingCode} (demo mode).`, 'info');
    }, 700);
  });

  resendCodeBtn.addEventListener('click', () => {
    if (!pendingUserId) return;
    pendingCode = String(Math.floor(100000 + Math.random() * 900000));
    showStatus(`New verification code: ${pendingCode} (demo mode).`, 'info');
  });
}

function handlePasswordReset(pendingUserId, pendingCode) {
  const inputCode = document.getElementById('resetCode').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!pendingUserId || !pendingCode) {
    showStatus('Reset session expired. Please request a new code.', 'error');
    return;
  }

  if (!/^\d{6}$/.test(inputCode)) {
    showStatus('Please enter a valid 6-digit verification code.', 'error');
    return;
  }

  if (inputCode !== pendingCode) {
    showStatus('Invalid verification code. Please try again.', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showStatus('New password must be at least 8 characters.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showStatus('Password confirmation does not match.', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
  const userIndex = users.findIndex((user) => user.id === pendingUserId);

  if (userIndex === -1) {
    showStatus('Account not found. Please restart reset flow.', 'error');
    return;
  }

  users[userIndex].password = newPassword;
  users[userIndex].updatedAt = new Date().toISOString();
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));

  showStatus('Password reset successful. Redirecting to login...', 'success');

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1200);
}

function showStatus(message, type) {
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
}
