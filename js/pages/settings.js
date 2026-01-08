// Settings Page - Backup & Restore

/**
 * Export Data (Backup)
 */
function exportData() {
    try {
        const data = {
            sales: JSON.parse(localStorage.getItem('sales') || '[]'),
            branches: JSON.parse(localStorage.getItem('branches') || '[]'),
            users: JSON.parse(localStorage.getItem('users') || '[]'),
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `sales_system_backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('success', 'تم التصدير', 'تم تحميل ملف النسخة الاحتياطية بنجاح');
    } catch (error) {
        console.error('Export error:', error);
        showToast('error', 'خطأ', 'فشل تصدير البيانات');
    }
}

/**
 * Trigger File Input
 */
function triggerImport() {
    document.getElementById('importFile').click();
}

/**
 * Import Data (Restore)
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Basic validation
            if (!data.sales || !data.branches) {
                throw new Error('ملف غير صالح');
            }

            if (confirm('تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد؟')) {
                localStorage.setItem('sales', JSON.stringify(data.sales));
                localStorage.setItem('branches', JSON.stringify(data.branches));
                if (data.users) localStorage.setItem('users', JSON.stringify(data.users));
                if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));

                showToast('success', 'تم الاستعادة', 'تم استعادة البيانات بنجاح. سيتم تحديث الصفحة.');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('error', 'خطأ', 'ملف غير صالح أو تالف');
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
}

// Export functions
window.exportData = exportData;
window.triggerImport = triggerImport;
window.importData = importData;
