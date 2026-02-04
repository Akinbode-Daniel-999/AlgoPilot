// Enhanced Responsive JavaScript with Perfect Theme Contrast
document.addEventListener('DOMContentLoaded', function() {
  // Initialize responsive elements
  initResponsiveDesign();
  initThemeSystem();
  initFormAnimations();
  initTouchOptimizations();
  
  // Auto-detect system theme preference
  detectSystemTheme();
});

function initResponsiveDesign() {
  // Update layout on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateResponsiveClasses();
    }, 250);
  });
  
  // Initial update
  updateResponsiveClasses();
}

function updateResponsiveClasses() {
  const width = window.innerWidth;
  const authCard = document.querySelector('.auth-card');
  
  // Remove existing responsive classes
  authCard.classList.remove('mobile-view', 'tablet-view', 'desktop-view');
  
  // Add appropriate class based on viewport
  if (width <= 480) {
    authCard.classList.add('mobile-view');
  } else if (width <= 768) {
    authCard.classList.add('tablet-view');
  } else {
    authCard.classList.add('desktop-view');
  }
  
  // Update floating elements size based on viewport
  updateFloatingElements();
}

function updateFloatingElements() {
  const floatingElements = document.querySelectorAll('.floating-element');
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  floatingElements.forEach((el, index) => {
    if (width <= 480) {
      el.style.width = `${Math.min(200, width * 0.4)}px`;
      el.style.height = `${Math.min(200, width * 0.4)}px`;
    } else if (width <= 768) {
      el.style.width = `${Math.min(250, width * 0.3)}px`;
      el.style.height = `${Math.min(250, width * 0.3)}px`;
    }
  });
}

function initThemeSystem() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);
  
  // Theme toggle click handler
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Animate toggle
    animateThemeToggle();
  });
  
  // Listen for system theme changes
  prefersDark.addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

function applyTheme(theme) {
  const themeToggleIcon = document.querySelector('#themeToggle i');
  
  switch (theme) {
    case 'light':
      document.body.classList.add('light-theme');
      themeToggleIcon.className = 'fas fa-sun';
      break;
    case 'dark':
      document.body.classList.remove('light-theme');
      themeToggleIcon.className = 'fas fa-moon';
      break;
    case 'auto':
    default:
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDark.matches) {
        document.body.classList.remove('light-theme');
        themeToggleIcon.className = 'fas fa-moon';
      } else {
        document.body.classList.add('light-theme');
        themeToggleIcon.className = 'fas fa-sun';
      }
      break;
  }
  
  // Update contrast for accessibility
  updateContrast();
}

function updateContrast() {
  // Check if we need to adjust contrast
  const isLightTheme = document.body.classList.contains('light-theme');
  const root = document.documentElement;
  
  // Adjust contrast based on theme
  if (isLightTheme) {
    // Ensure good contrast in light mode
    root.style.setProperty('--text-color', '#1a1a1a');
    root.style.setProperty('--text-secondary', 'rgba(0, 0, 0, 0.75)');
    root.style.setProperty('--input-border', 'rgba(0, 0, 0, 0.2)');
  } else {
    // Ensure good contrast in dark mode
    root.style.setProperty('--text-color', '#ffffff');
    root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.8)');
    root.style.setProperty('--input-border', 'rgba(255, 255, 255, 0.25)');
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
  
  if (!savedTheme) {
    // Apply system theme if no saved preference
    if (prefersDark.matches) {
      applyTheme('auto');
    }
  }
}

function initFormAnimations() {
  // Staggered animation for form elements
  const formElements = document.querySelectorAll('.form-group, .form-options, .login-btn');
  
  formElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
  });
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

function initTouchOptimizations() {
  // Check if device has touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    // Add touch-specific optimizations
    document.body.classList.add('touch-device');
    
    // Increase tap target sizes
    const tapTargets = document.querySelectorAll('button, a, input[type="checkbox"]');
    tapTargets.forEach(el => {
      el.style.minHeight = '44px';
      el.style.minWidth = '44px';
    });
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          document.body.style.zoom = '1';
        }, 100);
      });
    });
  }
}

// Password visibility toggle with enhanced touch support
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.password-toggle i');
  const isTouchDevice = 'ontouchstart' in window;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.className = 'fas fa-eye-slash';
    
    // On touch devices, show temporary tooltip
    if (isTouchDevice) {
      showTouchTooltip('Password is visible');
    }
  } else {
    passwordInput.type = 'password';
    toggleBtn.className = 'fas fa-eye';
  }
  
  // Haptic feedback for touch devices
  if (isTouchDevice && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function showTouchTooltip(message) {
  const tooltip = document.createElement('div');
  tooltip.className = 'touch-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--card-bg);
    color: var(--text-color);
    padding: 10px 20px;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 12px var(--shadow-color);
    z-index: 1000;
    font-size: var(--font-size-sm);
    border: 1px solid var(--card-border);
    backdrop-filter: blur(10px);
    animation: fadeInOut 2s ease;
  `;
  
  document.body.appendChild(tooltip);
  
  setTimeout(() => {
    tooltip.remove();
  }, 2000);
}

// Enhanced error handling with responsive messages
function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  
  // Clear any existing timeout
  if (window.errorTimeout) {
    clearTimeout(window.errorTimeout);
  }
  
  // Set message and show
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // Auto-hide after delay (longer on mobile)
  const isMobile = window.innerWidth <= 480;
  const delay = isMobile ? 7000 : 5000;
  
  window.errorTimeout = setTimeout(() => {
    errorMsg.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      errorMsg.style.display = 'none';
      errorMsg.style.animation = '';
    }, 300);
  }, delay);
}

// Listen for orientation changes on mobile
window.addEventListener('orientationchange', () => {
  // Update layout after orientation change
  setTimeout(updateResponsiveClasses, 100);
});

// Listen for keyboard visibility on mobile
if ('visualViewport' in window) {
  const viewport = window.visualViewport;
  viewport.addEventListener('resize', () => {
    const keyboardHeight = window.innerHeight - viewport.height;
    if (keyboardHeight > 100) {
      // Keyboard is visible on mobile
      document.body.style.height = `${viewport.height}px`;
    } else {
      document.body.style.height = '100vh';
    }
  });
}

// Network status indicator
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const statusIndicator = document.getElementById('networkStatus') || createNetworkStatusIndicator();
  
  if (isOnline) {
    statusIndicator.textContent = '🟢 Online';
    statusIndicator.style.color = 'var(--success-color)';
  } else {
    statusIndicator.textContent = '🔴 Offline - Using cached data';
    statusIndicator.style.color = 'var(--error-color)';
  }
}

function createNetworkStatusIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'networkStatus';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 15px;
    border-radius: 20px;
    background: var(--card-bg);
    font-size: var(--font-size-xs);
    backdrop-filter: blur(10px);
    border: 1px solid var(--card-border);
    z-index: 1000;
    display: none;
  `;
  document.body.appendChild(indicator);
  return indicator;
}