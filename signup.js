// Enhanced Signup JavaScript with Multi-step Form
document.addEventListener('DOMContentLoaded', function() {
  // Initialize everything
  initThemeSystem();
  initFormSteps();
  initPasswordValidation();
  initFormValidation();
  initTouchOptimizations();
  detectSystemTheme();
  
  // Set maximum birth date (must be 18+)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  document.getElementById('birthDate').max = minDate.toISOString().split('T')[0];
});

// Theme System
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
    if (prefersDark.matches) {
      applyTheme('auto');
    }
  }
}

// Form Steps Management
function initFormSteps() {
  let currentStep = 1;
  const totalSteps = 3;
  const formSteps = document.querySelectorAll('.form-step');
  const steps = document.querySelectorAll('.step');
  const stepLines = document.querySelectorAll('.step-line');
  
  // Initialize steps
  updateStepDisplay();
  
  // Set up keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentStep < totalSteps) {
        nextStep();
      } else {
        document.getElementById('signupForm').dispatchEvent(new Event('submit'));
      }
    }
    
    if (e.key === 'Escape') {
      if (currentStep > 1) {
        prevStep();
      }
    }
  });
  
  window.nextStep = function() {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (validateStep(currentStep)) {
        currentStep++;
        updateStepDisplay();
        updateStepProgress();
      }
    }
  };
  
  window.prevStep = function() {
    if (currentStep > 1) {
      currentStep--;
      updateStepDisplay();
      updateStepProgress();
    }
  };
  
  function updateStepDisplay() {
    formSteps.forEach(step => {
      step.classList.remove('active');
      if (parseInt(step.dataset.step) === currentStep) {
        step.classList.add('active');
      }
    });
    
    // Scroll to top of form
    document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth' });
  }
  
  function updateStepProgress() {
    steps.forEach((step, index) => {
      const stepNum = parseInt(step.dataset.step);
      step.classList.remove('active', 'completed');
      
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else if (stepNum < currentStep) {
        step.classList.add('completed');
      }
    });
    
    stepLines.forEach((line, index) => {
      if (index < currentStep - 1) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });
  }
  
  function validateStep(step) {
    switch (step) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      default:
        return true;
    }
  }
  
  function validateStep1() {
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let isValid = true;
    const errorMsg = document.getElementById('errorMsg');
    
    // Reset error
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
    
    // Validate username
    if (!username || username.length < 3) {
      showError('Username must be at least 3 characters');
      isValid = false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      isValid = false;
    }
    
    // Validate password
    if (password.length < 8) {
      showError('Password must be at least 8 characters');
      isValid = false;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      isValid = false;
    }
    
    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength.score < 3) {
      showError('Password is too weak. Please use a stronger password.');
      isValid = false;
    }
    
    if (isValid) {
      errorMsg.style.display = 'none';
    }
    
    return isValid;
  }
  
  function validateStep2() {
    // Step 2 is mostly optional, so just return true
    return true;
  }
  
  function validateStep3() {
    const terms = document.getElementById('terms');
    
    if (!terms.checked) {
      showError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  }
}

// Password Validation
function initPasswordValidation() {
  const passwordInput = document.getElementById('newPassword');
  const confirmInput = document.getElementById('confirmPassword');
  
  if (passwordInput) {
    passwordInput.addEventListener('input', validatePassword);
    confirmInput.addEventListener('input', validatePasswordConfirmation);
  }
}

function validatePassword() {
  const password = this.value;
  const strength = checkPasswordStrength(password);
  const strengthFill = document.getElementById('passwordStrength');
  const strengthLabel = document.getElementById('strengthLabel');
  
  // Update strength bar
  strengthFill.className = 'strength-fill ' + strength.label;
  strengthFill.style.width = strength.score * 20 + '%';
  strengthLabel.textContent = strength.message;
  strengthLabel.className = 'strength-label ' + strength.label;
  
  // Update requirements
  updatePasswordRequirements(password);
}

function checkPasswordStrength(password) {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score++; // Uppercase
  if (/[a-z]/.test(password)) score++; // Lowercase
  if (/[0-9]/.test(password)) score++; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters
  
  // Determine label and message
  let label, message;
  if (score === 0) {
    label = 'weak';
    message = 'Too weak';
  } else if (score <= 2) {
    label = 'weak';
    message = 'Weak';
  } else if (score === 3) {
    label = 'fair';
    message = 'Fair';
  } else if (score === 4) {
    label = 'good';
    message = 'Good';
  } else if (score === 5) {
    label = 'strong';
    message = 'Strong';
  } else {
    label = 'excellent';
    message = 'Excellent';
  }
  
  return { score, label, message };
}

function updatePasswordRequirements(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  
  Object.keys(requirements).forEach(req => {
    const element = document.getElementById('req-' + req);
    if (element) {
      if (requirements[req]) {
        element.classList.add('valid');
        element.querySelector('i').className = 'fas fa-check-circle';
      } else {
        element.classList.remove('valid');
        element.querySelector('i').className = 'fas fa-circle';
      }
    }
  });
}

function validatePasswordConfirmation() {
  const password = document.getElementById('newPassword').value;
  const confirm = this.value;
  const confirmInput = this;
  
  if (confirm && password !== confirm) {
    confirmInput.style.borderColor = 'var(--error-color)';
    confirmInput.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.15)';
  } else {
    confirmInput.style.borderColor = '';
    confirmInput.style.boxShadow = '';
  }
}

// Form Validation
function initFormValidation() {
  const signupForm = document.getElementById('signupForm');
  const submitButton = document.getElementById('submitButton');
  
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all steps
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      showError('Please fix the errors in the form');
      return;
    }
    
    // Collect form data
    const formData = {
      username: document.getElementById('newUsername').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('newPassword').value,
      firstName: document.getElementById('firstName')?.value.trim(),
      lastName: document.getElementById('lastName')?.value.trim(),
      country: document.getElementById('country')?.value,
      phone: document.getElementById('phone')?.value.trim(),
      birthDate: document.getElementById('birthDate')?.value,
      markets: Array.from(document.querySelectorAll('input[name="markets"]:checked')).map(cb => cb.value),
      experience: document.querySelector('input[name="experience"]:checked')?.value,
      riskTolerance: document.getElementById('riskTolerance')?.value,
      newsletter: document.getElementById('newsletter')?.checked
    };
    
    // Show loading state
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitButton.disabled = true;
    
    try {
      // Simulate API call
      await simulateSignup(formData);
      
      // Success
      const successMsg = document.getElementById('signupMsg');
      successMsg.textContent = '🎉 Account created successfully! Redirecting to dashboard...';
      successMsg.style.display = 'block';
      
      submitButton.innerHTML = '<i class="fas fa-check"></i> Account Created!';
      submitButton.style.background = 'linear-gradient(135deg, var(--success-color) 0%, #219653 100%)';
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      
    } catch (error) {
      showError(error.message);
      submitButton.innerHTML = '<i class="fas fa-rocket"></i> Create Account';
      submitButton.disabled = false;
    }
  });
}

async function simulateSignup(formData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate server validation
      const existingUsers = ['admin', 'trader', 'demo'];
      
      if (existingUsers.includes(formData.username.toLowerCase())) {
        reject(new Error('Username already exists'));
      } else if (!formData.email.includes('@')) {
        reject(new Error('Invalid email address'));
      } else if (formData.password.length < 8) {
        reject(new Error('Password must be at least 8 characters'));
      } else {
        // Simulate successful signup
        const user = {
          id: Math.random().toString(36).substr(2, 9),
          ...formData,
          createdAt: new Date().toISOString(),
          verified: false,
          balance: 10000 // Demo starting balance
        };
        
        // Save to localStorage (simulating backend)
        localStorage.setItem('user_' + user.id, JSON.stringify(user));
        localStorage.setItem('currentUser', user.id);
        
        resolve({ success: true, user });
      }
    }, 1500);
  });
}

// Social Signup Functions
window.signupWithGoogle = function() {
  const button = document.querySelector('.social-btn.google');
  const originalText = button.innerHTML;
  
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
  button.disabled = true;
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    showError('Google signup is currently unavailable. Please use email signup.');
  }, 1000);
};

window.signupWithGithub = function() {
  const button = document.querySelector('.social-btn.github');
  const originalText = button.innerHTML;
  
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
  button.disabled = true;
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    showError('GitHub signup is currently unavailable. Please use email signup.');
  }, 1000);
};

// Touch Optimizations
function initTouchOptimizations() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    
    // Increase tap target sizes
    const tapTargets = document.querySelectorAll('button, input, select, .checkbox-label, .radio-label');
    tapTargets.forEach(el => {
      el.style.minHeight = '44px';
    });
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          document.body.style.zoom = '1';
        }, 100);
      });
    });
  }
}

// Error Display
function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  const signupMsg = document.getElementById('signupMsg');
  
  // Hide success message if showing
  signupMsg.style.display = 'none';
  
  // Show error
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // Add animation
  errorMsg.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    errorMsg.style.animation = '';
  }, 500);
  
  // Auto-hide after delay
  if (window.errorTimeout) {
    clearTimeout(window.errorTimeout);
  }
  
  window.errorTimeout = setTimeout(() => {
    errorMsg.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      errorMsg.style.display = 'none';
    }, 300);
  }, 5000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Handle viewport changes
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Reinitialize touch optimizations on resize
    initTouchOptimizations();
  }, 250);
});

// Network status indicator
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const statusIndicator = document.getElementById('networkStatus') || createNetworkStatusIndicator();
  
  if (isOnline) {
    statusIndicator.textContent = '🟢 Online';
    statusIndicator.style.color = 'var(--success-color)';
    statusIndicator.style.display = 'block';
    setTimeout(() => {
      statusIndicator.style.display = 'none';
    }, 3000);
  } else {
    statusIndicator.textContent = '🔴 Offline - Signup unavailable';
    statusIndicator.style.color = 'var(--error-color)';
    statusIndicator.style.display = 'block';
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
    padding: 8px 20px;
    border-radius: 20px;
    background: var(--card-bg);
    font-size: var(--font-size-xs);
    backdrop-filter: blur(10px);
    border: 1px solid var(--card-border);
    z-index: 1000;
    display: none;
    box-shadow: 0 4px 12px var(--shadow-color);
  `;
  document.body.appendChild(indicator);
  return indicator;
}

// Initialize network status
updateNetworkStatus();