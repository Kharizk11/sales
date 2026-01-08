// Enhanced Error Messages and Tooltips System
// Provides better error messages and tooltip functionality

/**
 * Enhanced Error Messages
 */
class ErrorMessageHandler {
    constructor() {
        this.errorMessages = {
            // Network errors
            'network_error': {
                title: 'خطأ في الاتصال',
                message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
                icon: '🌐',
                type: 'error'
            },
            'timeout': {
                title: 'انتهت المهلة',
                message: 'استغرق الطلب وقتاً طويلاً. يرجى المحاولة مرة أخرى.',
                icon: '⏱️',
                type: 'warning'
            },

            // Validation errors
            'required_field': {
                title: 'حقل مطلوب',
                message: 'يرجى ملء جميع الحقول المطلوبة المميزة بعلامة *',
                icon: '⚠️',
                type: 'warning'
            },
            'invalid_email': {
                title: 'بريد إلكتروني غير صحيح',
                message: 'يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: user@example.com)',
                icon: '📧',
                type: 'warning'
            },
            'invalid_phone': {
                title: 'رقم هاتف غير صحيح',
                message: 'يرجى إدخال رقم هاتف صحيح (مثال: 0501234567)',
                icon: '📱',
                type: 'warning'
            },
            'invalid_date': {
                title: 'تاريخ غير صحيح',
                message: 'يرجى اختيار تاريخ صحيح. التاريخ يجب أن يكون بصيغة صحيحة.',
                icon: '📅',
                type: 'warning'
            },
            'invalid_number': {
                title: 'رقم غير صحيح',
                message: 'يرجى إدخال رقم صحيح. الأرقام فقط مسموحة.',
                icon: '🔢',
                type: 'warning'
            },
            'min_value': {
                title: 'قيمة أقل من المسموح',
                message: 'القيمة المدخلة أقل من الحد الأدنى المسموح به.',
                icon: '⬇️',
                type: 'warning'
            },
            'max_value': {
                title: 'قيمة أكبر من المسموح',
                message: 'القيمة المدخلة أكبر من الحد الأقصى المسموح به.',
                icon: '⬆️',
                type: 'warning'
            },

            // Data errors
            'duplicate_entry': {
                title: 'سجل مكرر',
                message: 'هذا السجل موجود بالفعل. لا يمكن إضافة سجلات مكررة.',
                icon: '🔄',
                type: 'error'
            },
            'not_found': {
                title: 'غير موجود',
                message: 'السجل المطلوب غير موجود. ربما تم حذفه.',
                icon: '🔍',
                type: 'error'
            },
            'no_data': {
                title: 'لا توجد بيانات',
                message: 'لا توجد بيانات لعرضها. ابدأ بإضافة سجلات جديدة.',
                icon: '📭',
                type: 'info'
            },

            // Permission errors
            'permission_denied': {
                title: 'غير مصرح',
                message: 'ليس لديك صلاحية للقيام بهذا الإجراء. يرجى الاتصال بالمسؤول.',
                icon: '🔒',
                type: 'error'
            },

            // Storage errors
            'storage_full': {
                title: 'مساحة التخزين ممتلئة',
                message: 'مساحة التخزين المحلية ممتلئة. يرجى حذف بعض البيانات القديمة.',
                icon: '💾',
                type: 'error'
            },
            'storage_error': {
                title: 'خطأ في التخزين',
                message: 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.',
                icon: '💾',
                type: 'error'
            },

            // Success messages
            'save_success': {
                title: 'تم الحفظ بنجاح',
                message: 'تم حفظ التغييرات بنجاح.',
                icon: '✅',
                type: 'success'
            },
            'delete_success': {
                title: 'تم الحذف بنجاح',
                message: 'تم حذف السجل بنجاح.',
                icon: '🗑️',
                type: 'success'
            },
            'update_success': {
                title: 'تم التحديث بنجاح',
                message: 'تم تحديث البيانات بنجاح.',
                icon: '🔄',
                type: 'success'
            }
        };
    }

    show(errorCode, customMessage = null, duration = 5000) {
        const error = this.errorMessages[errorCode] || {
            title: 'خطأ',
            message: customMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
            icon: '❌',
            type: 'error'
        };

        const message = customMessage || error.message;

        if (typeof showToast === 'function') {
            showToast(error.type, error.title, `${error.icon} ${message}`, duration);
        } else {
            alert(`${error.title}\n\n${message}`);
        }
    }

    showValidationError(fieldName, errorType = 'required_field') {
        const error = this.errorMessages[errorType];
        if (error) {
            this.show(errorType, `${fieldName}: ${error.message}`);
        }
    }

    showCustom(title, message, type = 'info', icon = 'ℹ️') {
        if (typeof showToast === 'function') {
            showToast(type, title, `${icon} ${message}`);
        } else {
            alert(`${title}\n\n${message}`);
        }
    }
}

/**
 * Tooltip System
 */
class TooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.currentTooltip = null;
        this.init();
    }

    init() {
        // Add CSS for tooltips
        this.injectStyles();

        // Initialize tooltips on page load
        this.initializeTooltips();

        // Re-initialize when DOM changes
        const observer = new MutationObserver(() => {
            this.initializeTooltips();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    injectStyles() {
        if (document.getElementById('tooltip-styles')) return;

        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
      .tooltip-wrapper {
        position: relative;
        display: inline-block;
      }

      .tooltip {
        position: absolute;
        background: #2C2C36;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .tooltip.show {
        opacity: 1;
      }

      .tooltip::before {
        content: '';
        position: absolute;
        border: 6px solid transparent;
      }

      /* Top tooltip */
      .tooltip.top {
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
      }

      .tooltip.top::before {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #2C2C36;
      }

      /* Bottom tooltip */
      .tooltip.bottom {
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
      }

      .tooltip.bottom::before {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #2C2C36;
      }

      /* Left tooltip */
      .tooltip.left {
        right: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
      }

      .tooltip.left::before {
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #2C2C36;
      }

      /* Right tooltip */
      .tooltip.right {
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
      }

      .tooltip.right::before {
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #2C2C36;
      }

      /* Keyboard shortcut badge in tooltip */
      .tooltip .shortcut {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 3px;
        margin-right: 6px;
        font-family: monospace;
        font-size: 11px;
      }
    `;
        document.head.appendChild(style);
    }

    initializeTooltips() {
        // Find all elements with data-tooltip attribute
        const elements = document.querySelectorAll('[data-tooltip]');

        elements.forEach(element => {
            if (this.tooltips.has(element)) return;

            const text = element.getAttribute('data-tooltip');
            const position = element.getAttribute('data-tooltip-position') || 'top';
            const shortcut = element.getAttribute('data-shortcut');

            this.addTooltip(element, text, position, shortcut);
        });
    }

    addTooltip(element, text, position = 'top', shortcut = null) {
        if (this.tooltips.has(element)) return;

        const showTooltip = () => {
            this.hideAll();

            const tooltip = document.createElement('div');
            tooltip.className = `tooltip ${position}`;

            if (shortcut) {
                tooltip.innerHTML = `<span class="shortcut">${shortcut}</span>${text}`;
            } else {
                tooltip.textContent = text;
            }

            element.style.position = 'relative';
            element.appendChild(tooltip);

            // Force reflow
            tooltip.offsetHeight;

            tooltip.classList.add('show');
            this.currentTooltip = tooltip;
        };

        const hideTooltip = () => {
            if (this.currentTooltip && this.currentTooltip.parentElement === element) {
                this.currentTooltip.classList.remove('show');
                setTimeout(() => {
                    if (this.currentTooltip && this.currentTooltip.parentElement) {
                        this.currentTooltip.remove();
                    }
                    this.currentTooltip = null;
                }, 200);
            }
        };

        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('click', hideTooltip);

        this.tooltips.set(element, { showTooltip, hideTooltip });
    }

    hideAll() {
        if (this.currentTooltip) {
            this.currentTooltip.classList.remove('show');
            setTimeout(() => {
                if (this.currentTooltip && this.currentTooltip.parentElement) {
                    this.currentTooltip.remove();
                }
                this.currentTooltip = null;
            }, 200);
        }
    }

    remove(element) {
        const tooltip = this.tooltips.get(element);
        if (tooltip) {
            element.removeEventListener('mouseenter', tooltip.showTooltip);
            element.removeEventListener('mouseleave', tooltip.hideTooltip);
            element.removeEventListener('click', tooltip.hideTooltip);
            this.tooltips.delete(element);
        }
    }
}

// Initialize systems
const errorHandler = new ErrorMessageHandler();
const tooltipManager = new TooltipManager();

// Export for global access
window.errorHandler = errorHandler;
window.tooltipManager = tooltipManager;

// Helper function for easy error display
window.showError = (code, customMessage, duration) => {
    errorHandler.show(code, customMessage, duration);
};


// Helper function for adding tooltips programmatically
window.addTooltip = (element, text, position, shortcut) => {
    tooltipManager.addTooltip(element, text, position, shortcut);
};

/**
 * Toast Notification Helper Class
 * Provides static methods for showing toasts, compatible with inventory.js
 */
class Toast {
    static success(message) {
        if (typeof showToast === 'function') showToast('success', 'نجاح', message);
    }
    static error(message) {
        if (typeof showToast === 'function') showToast('error', 'خطأ', message);
    }
    static warning(message) {
        if (typeof showToast === 'function') showToast('warning', 'تنبيه', message);
    }
    static info(message) {
        if (typeof showToast === 'function') showToast('info', 'معلومة', message);
    }
}

// Export Toast
window.Toast = Toast;

// Sidebar Toggle Function
window.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.main-content');

    // Check if mobile (screen width < 992px)
    if (window.innerWidth < 992) {
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    } else {
        // Desktop: Toggle Collapsed Mode
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }
};
