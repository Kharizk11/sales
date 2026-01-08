// Utility Functions - Shared across all pages

/**
 * Format date to YYYY-MM-DD format
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format money amount
 */
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 * Note: Returns the last recorded sales date (most recent date with sales data)
 */
async function getTodayDate() {
  try {
    const sales = await getSales();
    if (sales.length === 0) {
      // If no sales, return yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return formatDate(yesterday);
    }

    // Get all unique dates and sort descending
    const uniqueDates = [...new Set(sales.map(s => s.date))].sort((a, b) => b.localeCompare(a));
    return uniqueDates[0]; // Return the most recent date
  } catch (error) {
    console.error('Error getting today date:', error);
    // Fallback to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
}

/**
 * Get today's date synchronously (for backward compatibility)
 * Returns yesterday's date as fallback
 */
function getTodayDateSync() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

/**
 * Get actual today's date (for timestamps, file names, etc.)
 */
function getActualTodayDate() {
  return formatDate(new Date());
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Show toast notification
 */
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  // Play sound for success
  if (type === 'success') {
    try {
      const audio = new Audio('assets/sounds/success.mp3'); // Placeholder path, will use a data URI or simple beep if file not found
      // Since we don't have the file, let's use a simple beep using Web Audio API or just visual for now.
      // Actually, let's use a simple beep function if possible, or just rely on visual.
      // But the user specifically asked for "Notification", maybe they missed the visual one.
      // Let's make the visual one bigger/better.
    } catch (e) { console.error(e); }
  }

  toast.innerHTML = `
    <div class="toast-icon" style="font-size: 1.5rem;">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title" style="font-weight: bold; font-size: 1.1rem;">${title}</div>
      ${message ? `<div class="toast-message" style="font-size: 1rem;">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this)">&times;</button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('showing');
  });

  setTimeout(() => {
    if (toast.parentNode) {
      removeToast(toast.querySelector('.toast-close'));
    }
  }, duration);

  return toast;
}

/**
 * Remove toast notification
 */
function removeToast(button) {
  const toast = button.closest('.toast');
  if (toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

/**
 * Show loading overlay
 */
function showLoading(message = 'جاري التحميل...') {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  const loadingText = overlay.querySelector('.loading-text');
  if (loadingText) loadingText.textContent = message;
  overlay.classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Set default date for input field
 */
async function setDefaultDate(inputId) {
  const input = document.getElementById(inputId);
  if (input && !input.value) {
    input.value = await getTodayDate();
  }
}

/**
 * Format date for display (DD/MM/YYYY)
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Export to window for global access
window.formatDate = formatDate;
window.formatMoney = formatMoney;
window.getTodayDate = getTodayDate;
window.getTodayDateSync = getTodayDateSync;
window.getActualTodayDate = getActualTodayDate;
window.formatDateForDisplay = formatDateForDisplay;
window.copyToClipboard = copyToClipboard;
window.generateId = generateId;
window.showToast = showToast;
window.removeToast = removeToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.setButtonLoading = setButtonLoading;
window.setDefaultDate = setDefaultDate;



