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

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const identifier = document.getElementById('resetIdentifier').value.trim();
    if (!identifier) {
      showStatus('Please enter your email or username.', 'error');
      return;
    }

    resetButton.disabled = true;
    resetButtonText.textContent = 'Sending reset link...';

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

      showStatus(`Reset instructions have been sent to ${match.email || 'your email'}.`, 'success');
      resetButtonText.textContent = 'Check your inbox';
    }, 900);
  });
}

function showStatus(message, type) {
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
}
