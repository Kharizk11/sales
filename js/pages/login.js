// Login Page

/**
 * Handle login form submit
 */
async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showToast('warning', 'تحذير', 'يرجى إدخال اسم المستخدم وكلمة المرور');
    return;
  }
  
  const loginBtn = document.getElementById('loginBtn');
  
  try {
    if (loginBtn && typeof setButtonLoading === 'function') {
      setButtonLoading(loginBtn, true);
    }
    
    // Wait a bit to ensure auth system is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await login(username, password);
    
    console.log('Login result:', result); // Debug log
    
    if (result && result.success) {
      showToast('success', 'نجح', 'تم تسجيل الدخول بنجاح');
      setTimeout(() => {
        // Use router instead of window.location.href for SPA navigation
        if (typeof navigateTo === 'function') {
          navigateTo('home');
        } else {
          // Fallback if router not available
          window.location.href = '/';
        }
      }, 500);
    } else {
      showToast('error', 'خطأ', result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }
    
  } catch (error) {
    console.error('Error during login:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تسجيل الدخول');
  } finally {
    if (loginBtn && typeof setButtonLoading === 'function') {
      setButtonLoading(loginBtn, false);
    }
  }
}

// Initialize page when loaded
window.addEventListener('pageLoaded', function(e) {
  if (e.detail.page === 'login') {
    // If already logged in, redirect to home
    if (isAuthenticated()) {
      // Use router instead of window.location.href for SPA navigation
      if (typeof navigateTo === 'function') {
        navigateTo('home');
      } else {
        // Fallback if router not available
        window.location.href = '/';
      }
      return;
    }
    
    // Focus on username field
    setTimeout(() => {
      const usernameField = document.getElementById('username');
      if (usernameField) {
        usernameField.focus();
      }
    }, 100);
  }
});

// Export for global access
window.handleLogin = handleLogin;

