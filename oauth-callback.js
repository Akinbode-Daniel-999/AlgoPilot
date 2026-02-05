document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem();
  detectSystemTheme();
  handleOAuthCallback();
});

const AUTH_STORAGE_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

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

function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('provider');
  const returnTo = params.get('returnTo') || 'login.html';

  if (!provider || !['google', 'facebook'].includes(provider)) {
    showStatus('Invalid OAuth provider. Please return to login.', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
  const providerUser = {
    id: `social_${provider}_${Date.now()}`,
    username: `${provider}_trader`,
    email: `${provider}_trader@${provider}.example`,
    password: 'oauth',
    provider,
    createdAt: new Date().toISOString(),
    verified: true,
    balance: 10000
  };

  const existing = users.find((user) => user.provider === provider);
  const activeUser = existing || providerUser;

  if (!existing) {
    users.push(activeUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(activeUser));
  showStatus(`Connected with ${provider}. Redirecting to your dashboard...`, 'success');

  setTimeout(() => {
    window.location.href = 'main.html';
  }, 1000);
}

function showStatus(message, type) {
  const statusMsg = document.getElementById('statusMsg');
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
}
