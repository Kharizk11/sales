
// Daily Report Page Logic

async function initDailyReport() {
    // Set default date to YESTERDAY
    const dateInput = document.getElementById('reportDate');
    if (dateInput) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Format as YYYY-MM-DD
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        dateInput.value = yesterdayStr;

        // Add event listener for date change
        dateInput.addEventListener('change', generateReport);
    }

    // Initial generation
    await generateReport();
}

async function generateReport() {
    const dateInput = document.getElementById('reportDate');
    if (!dateInput || !dateInput.value) return;

    const selectedDate = dateInput.value;
    showLoading('جاري تحديث التقرير...');

    try {
        const sales = await getSales();

        // 1. Today's Stats (Selected Date)
        const daySales = sales.filter(s => s.date === selectedDate);
        const dayTotal = daySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const transactionsCount = daySales.length;
        const maxTransaction = daySales.length > 0
            ? Math.max(...daySales.map(s => Number(s.amount || 0)))
            : 0;

        // 2. Month Stats (up to selected date)
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();

        // Filter for current month up to selected date
        const monthSales = sales.filter(s => {
            const sDate = new Date(s.date);
            return sDate.getFullYear() === year &&
                sDate.getMonth() === month &&
                s.date <= selectedDate;
        });
        const monthTotal = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

        // 3. Monthly Average
        const daysPassed = dateObj.getDate();
        const monthlyAverage = daysPassed > 0 ? monthTotal / daysPassed : 0;

        // Update UI
        updateElement('todayTotal', formatMoney(dayTotal));
        updateElement('monthTotal', formatMoney(monthTotal));
        updateElement('monthlyAverage', formatMoney(monthlyAverage));
        updateElement('transactionsCount', transactionsCount);
        updateElement('maxTransaction', formatMoney(maxTransaction) + ' ريال');

        // Update Meta
        const dateDisplay = new Date(selectedDate).toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        updateElement('displayDate', dateDisplay);

        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        updateElement('generationTime', timeStr);

    } catch (error) {
        console.error('Error generating report:', error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء توليد التقرير');
    } finally {
        hideLoading();
    }
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function copyReportText() {
    const dateInput = document.getElementById('reportDate');
    const todayTotal = document.getElementById('todayTotal')?.textContent;
    const monthTotal = document.getElementById('monthTotal')?.textContent;
    const monthlyAverage = document.getElementById('monthlyAverage')?.textContent;

    if (!dateInput || !todayTotal) return;

    const dateStr = new Date(dateInput.value).toLocaleDateString('en-GB');
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const text = `═══════════════════════════════════════
           📊 تقرير مبيعات اليوم
═══════════════════════════════════════

📅 التاريخ: ${dateStr}

💰 إجمالي مبيعات اليوم
   ${todayTotal} ريال

📈 المتوسط الشهري (حتى اليوم)
   ${monthlyAverage} ريال

📊 إجمالي مبيعات الشهر (تراكمي)
   ${monthTotal} ريال

═══════════════════════════════════════
   تم إنشاء التقرير في: ${timeStr}
═══════════════════════════════════════`;

    const success = await copyToClipboard(text);
    if (success) {
        showToast('success', 'نجح', 'تم نسخ التقرير النصي');
    }
}

function printReport() {
    window.print();
}

async function shareReportImage() {
    // For now, share text as image generation is complex without external libs like html2canvas
    // We can fallback to sharing text which is supported
    if (navigator.share) {
        const dateInput = document.getElementById('reportDate');
        const todayTotal = document.getElementById('todayTotal')?.textContent;
        const text = `تقرير مبيعات ${dateInput.value}: ${todayTotal} ريال`;

        try {
            await navigator.share({
                title: 'تقرير المبيعات اليومي',
                text: text,
                url: window.location.href
            });
        } catch (err) {
            console.log('Share cancelled');
        }
    } else {
        copyReportText();
        showToast('info', 'ملاحظة', 'المشاركة غير مدعومة، تم نسخ النص');
    }
}

// Initialize when page loads
// Since this is loaded dynamically by router, DOMContentLoaded might have already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('reportPaper')) {
            initDailyReport();
        }
    });
} else {
    // DOM already loaded, run immediately
    if (document.getElementById('reportPaper')) {
        initDailyReport();
    }
}

// Export for global access if needed
window.generateReport = generateReport;
window.copyReportText = copyReportText;
window.printReport = printReport;
window.shareReportImage = shareReportImage;
