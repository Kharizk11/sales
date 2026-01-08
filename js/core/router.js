// Router - Navigation between pages

const ROUTES = {
  '/': 'pages/home.html',
  '/home': 'pages/home.html',
  '/branches': 'pages/branches.html',
  '/branch-details': 'pages/branch-details.html',
  '/sales': 'pages/sales.html',
  '/analytics': 'pages/analytics.html',
  '/reports': 'pages/analytics.html', // Redirect reports to analytics
  '/login': 'pages/login.html',
  '/users': 'pages/users.html',
  '/user-form': 'pages/user-form.html',
  '/daily-report': 'pages/daily-report.html',
  '/products': 'pages/products.html',
  '/lists': 'pages/lists.html'
};

// Public routes (don't require authentication)
const PUBLIC_ROUTES = ['/login'];

let currentPage = null;

/**
 * Navigate to a page
 */
async function navigateTo(path) {
  // Extract path and query parameters first
  let pageName = path;
  let queryParams = '';

  if (path.includes('?')) {
    const parts = path.split('?');
    pageName = parts[0];
    queryParams = '?' + parts[1];
  }

  // Normalize path
  if (pageName.startsWith('/')) {
    pageName = pageName.substring(1);
  }
  if (!pageName || pageName === '') {
    pageName = 'home';
  }

  // Normalize path for route checking
  const normalizedPath = '/' + pageName;

  // Check authentication for protected routes
  if (!PUBLIC_ROUTES.includes(normalizedPath)) {
    // Wait a bit for auth to initialize
    let authChecked = false;
    if (typeof isAuthenticated === 'function') {
      authChecked = true;
      if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        // Use navigateTo recursively to avoid page reload
        await navigateTo('login');
        return;
      }
    } else {
      // Auth not loaded yet, wait and check again
      await new Promise(resolve => setTimeout(resolve, 150));
      if (typeof isAuthenticated === 'function') {
        authChecked = true;
        if (!isAuthenticated()) {
          await navigateTo('login');
          return;
        }
      }
    }

    // If auth still not available after waiting, redirect to login for safety
    if (!authChecked && typeof isAuthenticated !== 'function') {
      console.log('Auth system not available, redirecting to login');
      await navigateTo('login');
      return;
    }
  }

  // If already on login page and authenticated, redirect to home
  if (normalizedPath === '/login') {
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
      console.log('User already authenticated, redirecting to home');
      await navigateTo('home');
      return;
    }
  }

  const route = ROUTES[normalizedPath] || ROUTES['/'];
  const pagePath = route || ROUTES['/'];

  console.log('Navigation debug:', {
    originalPath: path,
    pageName: pageName,
    normalizedPath: normalizedPath,
    route: route,
    pagePath: pagePath,
    queryParams: queryParams
  });

  try {
    // Show loading
    if (typeof showLoading === 'function') {
      showLoading('جاري تحميل الصفحة...');
    }

    console.log('Loading page:', pagePath);

    // Load page content
    let response;
    try {
      // Add timestamp to prevent caching of HTML files
      response = await fetch(`${pagePath}?v=${new Date().getTime()}`);
      if (!response.ok) {
        // If 404, try to redirect to login if not authenticated
        if (response.status === 404) {
          console.error(`Page not found: ${pagePath}`);
          if (typeof isAuthenticated === 'function' && !isAuthenticated() && normalizedPath !== '/login') {
            console.log('404 error, redirecting to login');
            await navigateTo('login');
            return;
          }
          // If authenticated but page not found, show error
          throw new Error(`الصفحة غير موجودة: ${pagePath}`);
        }
        throw new Error(`HTTP ${response.status}: Failed to load page: ${pagePath}`);
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);

      // Check if it's a file:// protocol issue
      if (window.location.protocol === 'file:') {
        const errorMsg = `
          ⚠️ التطبيق لا يعمل مع file:// protocol
          
          يجب تشغيل التطبيق على خادم ويب محلي:
          
          الطريقة الأسهل:
          1. افتح VS Code
          2. ثبت "Live Server" extension
          3. انقر بزر الماوس الأيمن على index.html
          4. اختر "Open with Live Server"
          
          أو استخدم Python:
          python -m http.server 8000
          
          ثم افتح: http://localhost:8000
        `;
        console.error(errorMsg);
        throw new Error('يجب تشغيل التطبيق على خادم ويب محلي. راجع server.html للتعليمات');
      }

      // If fetch fails and user not authenticated, redirect to login
      if (typeof isAuthenticated === 'function' && !isAuthenticated() && normalizedPath !== '/login') {
        console.log('Redirecting to login due to fetch error');
        await navigateTo('login');
        return;
      }

      // Other fetch errors
      throw new Error(`فشل تحميل الصفحة: ${pagePath}. تحقق من أن الملف موجود والمسار صحيح.`);
    }

    const html = await response.text();
    if (!html || html.trim() === '') {
      throw new Error('Page content is empty');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse HTML: ' + parserError.textContent);
    }

    // Get main content
    const mainContent = doc.querySelector('.main-content');
    if (!mainContent) {
      console.error('Page HTML:', html.substring(0, 500));
      throw new Error('Page content (.main-content) not found in: ' + pagePath);
    }

    // Update main container
    const mainContainer = document.querySelector('.main-container');
    if (!mainContainer) {
      throw new Error('Main container not found in DOM');
    }

    mainContainer.innerHTML = mainContent.innerHTML;

    // Update active nav link
    updateActiveNavLink(pageName);

    // Load page-specific JavaScript
    await loadPageScript(pageName);

    // Update current page
    currentPage = pageName;

    // Update URL without reload
    try {
      const urlPath = '/' + pageName + queryParams;
      window.history.pushState({ page: pageName, query: queryParams }, '', urlPath);
    } catch (historyError) {
      console.warn('History API error:', historyError);
    }

    // Hide loading
    if (typeof hideLoading === 'function') {
      hideLoading();
    }

    // Trigger page loaded event
    window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page: pageName, query: queryParams } }));

    console.log('Page loaded successfully:', pageName);

  } catch (error) {
    console.error('Navigation error:', error);
    console.error('Error details:', {
      path: path,
      pagePath: pagePath,
      message: error.message,
      stack: error.stack
    });

    if (typeof hideLoading === 'function') {
      hideLoading();
    }

    // Show detailed error message
    let errorMessage = error.message || 'حدث خطأ أثناء تحميل الصفحة';

    // Add help link if file:// protocol
    if (window.location.protocol === 'file:' && errorMessage.includes('خادم ويب')) {
      const helpLink = '<a href="server.html" style="color: white; text-decoration: underline;">اضغط هنا للتعليمات</a>';
      errorMessage += '<br><br>' + helpLink;
    }

    if (typeof showToast === 'function') {
      // Create a toast with HTML content if needed
      const container = document.getElementById('toastContainer');
      if (container) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
          <div class="toast-icon">❌</div>
          <div class="toast-content">
            <div class="toast-title">خطأ</div>
            <div class="toast-message">${errorMessage}</div>
          </div>
          <button class="toast-close" onclick="removeToast(this)">&times;</button>
        `;
        container.appendChild(toast);

        // Auto remove after 10 seconds for file:// errors
        if (window.location.protocol === 'file:') {
          setTimeout(() => {
            if (toast.parentNode) {
              removeToast(toast.querySelector('.toast-close'));
            }
          }, 10000);
        }
      }
    } else {
      alert('خطأ: ' + errorMessage.replace(/<[^>]*>/g, ''));
    }

    // Show error in console for debugging
    console.error('Full error:', error);
    console.error('Error details:', {
      path: path,
      pagePath: pagePath,
      protocol: window.location.protocol,
      message: error.message
    });
  }
}

/**
 * Load page-specific JavaScript
 */
async function loadPageScript(page) {
  const scriptMap = {
    'home': 'js/pages/home.js',
    'branches': 'js/pages/branches.js',
    'branch-details': 'js/pages/branch-details.js',
    'sales': 'js/pages/sales.js',
    'reports': 'js/pages/analytics.js', // Use analytics.js for reports
    'analytics': 'js/pages/analytics.js',
    'login': 'js/pages/login.js',
    'users': 'js/pages/users.js',
    'user-form': 'js/pages/user-form.js',
    'daily-report': 'js/pages/daily-report.js',
    'products': 'js/pages/products.js',
    'lists': 'js/pages/lists.js'
  };

  const scriptPath = scriptMap[page];
  if (!scriptPath) return;

  // Remove old script if exists
  const oldScript = document.querySelector(`script[data-page="${page}"]`);
  if (oldScript) {
    oldScript.remove();
  }

  // Check if script already loaded in global scope
  const scriptFunctions = {
    'home': ['updateDashboard'],
    'branches': ['renderBranchesTable'],
    'branch-details': ['loadBranchDetails'],
    'sales': ['loadSalesTable'],
    'reports': ['initAnalytics'],
    'analytics': ['initAnalytics'],
    'products': ['initProductsPage'],
    'lists': ['initListsPage']
  };

  const requiredFunctions = scriptFunctions[page] || [];
  const allFunctionsAvailable = requiredFunctions.every(fn => typeof window[fn] === 'function');

  if (allFunctionsAvailable && oldScript) {
    console.log(`Page functions already available for: ${page}`);
    return Promise.resolve();
  }

  // Load new script
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Add timestamp to prevent caching
    script.src = `${scriptPath}?v=${new Date().getTime()}`;
    script.setAttribute('data-page', page);

    let resolved = false;

    script.onload = () => {
      if (resolved) return;
      resolved = true;
      console.log(`Page script loaded: ${page}`);
      // Wait a bit for script to execute
      setTimeout(() => {
        resolve();
      }, 100);
    };

    script.onerror = (error) => {
      if (resolved) return;
      console.error(`Failed to load page script: ${page}`, error);
      console.error(`Script path: ${scriptPath}`);
      // Don't reject, just warn - functions might already be available
      console.warn('Continuing without script - functions might already be loaded');
      resolved = true;
      resolve(); // Resolve anyway to not block navigation
    };

    document.body.appendChild(script);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!resolved) {
        console.warn(`Script load timeout for: ${page}`);
        resolved = true;
        resolve(); // Resolve anyway to not block navigation
      }
    }, 5000);
  });
}

/**
 * Update active navigation link
 */
function updateActiveNavLink(page) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === `/${page}` || (page === 'home' && (href === '/' || href === '/home'))) {
      link.classList.add('active');
    }
  });
}

/**
 * Initialize router
 */
function initRouter() {
  // Handle navigation clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-navigate]');
    if (link) {
      e.preventDefault();
      const path = link.getAttribute('href');
      if (path) {
        navigateTo(path);
      }
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    const path = window.location.pathname.substring(1) || 'home';
    const query = window.location.search;
    navigateTo(path + query);
  });

  // Initial navigation - wait a bit for DOM and auth to be ready
  setTimeout(async () => {
    try {
      let initialPath = window.location.pathname;

      // Remove leading slash
      if (initialPath.startsWith('/')) {
        initialPath = initialPath.substring(1);
      }

      // Default to home if empty
      if (!initialPath || initialPath === '') {
        initialPath = 'home';
      }

      console.log('Initial path:', initialPath);

      // Wait a bit more for auth to be ready
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check authentication before navigating
      if (typeof isAuthenticated === 'function') {
        if (!isAuthenticated() && initialPath !== 'login') {
          console.log('User not authenticated, redirecting to login');
          await navigateTo('login');
          return;
        } else if (initialPath === 'login' && isAuthenticated()) {
          console.log('User already authenticated, redirecting to home');
          await navigateTo('home');
          return;
        }
      } else {
        // Auth not loaded yet, default to login for safety
        if (initialPath !== 'login') {
          console.log('Auth not ready, redirecting to login');
          await navigateTo('login');
          return;
        }
      }

      // Navigate to requested page
      await navigateTo(initialPath);
    } catch (error) {
      console.error('Error in initial navigation:', error);
      // Fallback: try to load login page directly
      try {
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
          const response = await fetch('pages/login.html');
          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('.main-content');
            if (mainContent) {
              mainContainer.innerHTML = mainContent.innerHTML;
              // Load login script
              await loadPageScript('login');
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
          mainContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-2xl);">
              <h1>⚠️ خطأ في التحميل</h1>
              <p>حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة.</p>
              <button class="btn btn-primary" onclick="window.location.reload()">🔄 تحديث الصفحة</button>
            </div>
          `;
        }
      }
    }
  }, 400);
}

// Export to window
window.navigateTo = navigateTo;
window.initRouter = initRouter;

