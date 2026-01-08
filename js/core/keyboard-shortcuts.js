// Keyboard Shortcuts Manager
// Global keyboard shortcuts for the application

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.registerDefaultShortcuts();
    }

    register(key, callback, description) {
        const shortcutKey = this.normalizeKey(key);
        this.shortcuts.set(shortcutKey, { callback, description });
    }

    normalizeKey(key) {
        const parts = key.toLowerCase().split('+');
        const modifiers = [];
        let mainKey = '';

        parts.forEach(part => {
            if (part === 'ctrl' || part === 'control') modifiers.push('ctrl');
            else if (part === 'alt') modifiers.push('alt');
            else if (part === 'shift') modifiers.push('shift');
            else mainKey = part;
        });

        return [...modifiers.sort(), mainKey].join('+');
    }

    handleKeyPress(e) {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            // Allow Ctrl+S even in input fields
            if (!(e.ctrlKey && e.key.toLowerCase() === 's')) {
                return;
            }
        }

        const modifiers = [];
        if (e.ctrlKey) modifiers.push('ctrl');
        if (e.altKey) modifiers.push('alt');
        if (e.shiftKey) modifiers.push('shift');

        const key = e.key.toLowerCase();
        const shortcutKey = [...modifiers, key].join('+');

        const shortcut = this.shortcuts.get(shortcutKey);
        if (shortcut) {
            e.preventDefault();
            shortcut.callback(e);
        }
    }

    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('ctrl+h', () => {
            window.router.navigateTo('/');
        }, 'الانتقال إلى الصفحة الرئيسية');

        this.register('ctrl+s', (e) => {
            e.preventDefault();
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
            }
        }, 'حفظ النموذج الحالي');

        this.register('ctrl+p', (e) => {
            e.preventDefault();
            const printBtn = document.querySelector('[onclick*="print"]');
            if (printBtn) {
                printBtn.click();
            } else {
                window.print();
            }
        }, 'طباعة الصفحة الحالية');

        this.register('ctrl+n', () => {
            const newBtn = document.querySelector('[onclick*="new"], [onclick*="add"]');
            if (newBtn) {
                newBtn.click();
            }
        }, 'إضافة سجل جديد');

        this.register('ctrl+f', (e) => {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="بحث"], input[id*="search"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 'البحث في الصفحة');

        this.register('ctrl+r', (e) => {
            e.preventDefault();
            const refreshBtn = document.querySelector('[onclick*="load"], [onclick*="refresh"]');
            if (refreshBtn) {
                refreshBtn.click();
            } else {
                location.reload();
            }
        }, 'تحديث البيانات');

        this.register('escape', () => {
            // Close modals
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
                const closeBtn = activeModal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            }

            // Cancel edit mode
            const cancelBtn = document.querySelector('[onclick*="cancel"]');
            if (cancelBtn && cancelBtn.style.display !== 'none') {
                cancelBtn.click();
            }
        }, 'إلغاء / إغلاق');

        this.register('f1', (e) => {
            e.preventDefault();
            this.showShortcutsHelp();
        }, 'عرض قائمة الاختصارات');

        // Page-specific shortcuts
        this.register('alt+1', () => window.router.navigateTo('/'), 'الصفحة الرئيسية');
        this.register('alt+2', () => window.router.navigateTo('/sales'), 'المبيعات');
        this.register('alt+3', () => window.router.navigateTo('/branches'), 'الفروع');
        this.register('alt+4', () => window.router.navigateTo('/analytics'), 'التقارير');
        this.register('alt+5', () => window.router.navigateTo('/users'), 'المستخدمين');
    }

    showShortcutsHelp() {
        const shortcuts = Array.from(this.shortcuts.entries())
            .map(([key, data]) => ({
                key: key.split('+').map(k => {
                    const keyMap = {
                        'ctrl': 'Ctrl',
                        'alt': 'Alt',
                        'shift': 'Shift',
                        'escape': 'Esc',
                        'f1': 'F1'
                    };
                    return keyMap[k] || k.toUpperCase();
                }).join(' + '),
                description: data.description
            }))
            .sort((a, b) => a.key.localeCompare(b.key));

        const html = `
      <div class="modal-overlay active" id="shortcutsModal" style="z-index: 10000;">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">⌨️ اختصارات لوحة المفاتيح</h2>
            <button class="modal-close" onclick="document.getElementById('shortcutsModal').remove()">×</button>
          </div>
          <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                  <th style="padding: 12px; text-align: right; font-weight: 600;">الاختصار</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">الوصف</th>
                </tr>
              </thead>
              <tbody>
                ${shortcuts.map(s => `
                  <tr style="border-bottom: 1px solid #e9ecef;">
                    <td style="padding: 10px; font-family: monospace; background: #f8f9fa; font-weight: bold; white-space: nowrap;">
                      ${s.key}
                    </td>
                    <td style="padding: 10px;">${s.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="document.getElementById('shortcutsModal').remove()">
              فهمت
            </button>
          </div>
        </div>
      </div>
    `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv.firstElementChild);
    }

    getShortcuts() {
        return Array.from(this.shortcuts.entries());
    }
}

// Initialize keyboard shortcuts
const keyboardShortcuts = new KeyboardShortcuts();

// Export for global access
window.keyboardShortcuts = keyboardShortcuts;

// Show shortcuts hint on first load
if (!localStorage.getItem('shortcutsHintShown')) {
    setTimeout(() => {
        showToast('info', 'نصيحة', 'اضغط F1 لعرض اختصارات لوحة المفاتيح', 6000);
        localStorage.setItem('shortcutsHintShown', 'true');
    }, 2000);
}
