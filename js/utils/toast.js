/**
 * Toast Notification System
 * Simple, elegant notifications for user feedback
 */

const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.style.cssText = `
      background: white;
      color: #1f2937;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 300px;
      max-width: 500px;
      pointer-events: auto;
      animation: slideDown 0.3s ease-out;
      border-left: 4px solid ${colors[type]};
      font-family: 'Tajawal', sans-serif;
    `;

        toast.innerHTML = `
      <span style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${colors[type]};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
      ">${icons[type]}</span>
      <span style="flex: 1; font-size: 14px;">${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      ">×</button>
    `;

        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// Add animations to document
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
    
    .toast:hover {
      box-shadow: 0 15px 30px rgba(0,0,0,0.2);
    }
  `;
    document.head.appendChild(style);
}

// Export to window
window.Toast = Toast;
