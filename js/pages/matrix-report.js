// Matrix Report Logic - SAP Fiori Style

/**
 * Initialize Matrix Report
 */
async function initMatrixReport() {
    console.log('Initializing Matrix Report');

    // Inject SAP Styles
    injectMatrixStyles();

    // Set default dates
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
    const lastMonthDate = new Date(today);
    lastMonthDate.setMonth(today.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    const fromMonthInput = document.getElementById('matrixFromMonth');
    const toMonthInput = document.getElementById('matrixToMonth');

    if (fromMonthInput && toMonthInput) {
        fromMonthInput.value = lastMonth;
        toMonthInput.value = currentMonth;
        // Add SAP classes
        fromMonthInput.classList.add('sap-input');
        toMonthInput.classList.add('sap-input');
    }

    // Load branches
    const branchSelect = document.getElementById('matrixBranch');
    if (branchSelect) {
        branchSelect.classList.add('sap-input');
        try {
            const branches = await getBranches();
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.name;
                option.textContent = branch.name;
                branchSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    }

    // Style the generate button if found
    const generateBtn = document.querySelector('button[onclick="generateMatrixReport()"]');
    if (generateBtn) {
        generateBtn.classList.add('btn-sap');
        generateBtn.classList.add('btn-emphasized');
    }

    // Generate initial report
    generateMatrixReport();
}

/**
 * Inject SAP-Style CSS Styles
 */
function injectMatrixStyles() {
    if (document.getElementById('matrix-sap-styles')) return;

    const style = document.createElement('style');
    style.id = 'matrix-sap-styles';
    style.textContent = `
        /* --- SAP Container & Layout --- */
        .matrix-container {
            font-family: '72', '72full', Arial, Helvetica, sans-serif;
            padding: 20px;
            background-color: var(--sap-bg-app);
        }

        .matrix-card {
            background: var(--sap-bg-card);
            border: 1px solid var(--sap-border-color);
            border-radius: 4px;
            box-shadow: var(--sap-shadow);
            padding: 1rem;
            margin-bottom: 20px;
        }

        /* --- SAP Table (Dense & Striped) --- */
        .matrix-table-wrapper {
            border-radius: 4px;
            overflow: hidden; /* For screen only */
            border: 1px solid var(--sap-border-color);
        }

        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }

        .matrix-table th {
            background: var(--sap-bg-hover);
            color: var(--sap-text);
            font-weight: normal;
            padding: 0.75rem 0.5rem;
            text-align: center;
            border-bottom: 1px solid var(--sap-border-color);
            white-space: nowrap;
        }

        .matrix-table td {
            padding: 0.5rem;
            border-bottom: 1px solid var(--sap-border-color);
            color: var(--sap-text);
            text-align: center;
            border-right: 1px solid var(--sap-border-color);
        }

        .matrix-table tbody tr:nth-of-type(even) {
            background-color: var(--sap-bg-hover);
        }

        .matrix-table tbody tr:hover {
            background-color: var(--sap-bg-active);
        }

        /* Sticky Columns/Rows */
        .matrix-sticky-header th {
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .matrix-sticky-col {
            position: sticky;
            left: 0;
            background-color: var(--sap-bg-card);
            z-index: 5;
            border-right: 2px solid var(--sap-border-color);
            font-weight: bold;
        }

        .matrix-table th:first-child {
            z-index: 20;
            left: 0;
            background-color: var(--sap-bg-card);
        }

        /* Trend Icons */
        .trend-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            gap: 4px;
        }
        .trend-up { color: var(--sap-success); background-color: transparent; }
        .trend-down { color: var(--sap-error); background-color: transparent; }
        .trend-neutral { color: var(--sap-text-secondary); }

        /* Footer Totals */
        .matrix-footer-avg td { background-color: var(--sap-bg-hover) !important; color: var(--sap-primary); font-weight: bold; border-top: 2px solid var(--sap-primary); }
        .matrix-footer-total td { background-color: var(--sap-primary) !important; color: #ffffff; font-weight: bold; font-size: 14px; border-top: 3px solid var(--sap-primary-active); }

        /* --- Summary Cards --- */
        .matrix-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        .matrix-stat-card {
            background: var(--sap-bg-card);
            padding: 15px;
            border-radius: 4px;
            border: 1px solid var(--sap-border-color);
            box-shadow: var(--sap-shadow);
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .matrix-stat-icon {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .matrix-stat-info h4 { margin: 0 0 5px 0; font-size: 12px; color: var(--sap-text-secondary); font-weight: normal; text-transform: uppercase; }
        .matrix-stat-info h3 { margin: 0; font-size: 18px; color: var(--sap-text); font-weight: bold; }

        /* --- Heatmap Colors --- */
        .heatmap-cell { transition: background-color 0.2s; color: var(--sap-text); font-weight: normal; }
        .heatmap-low { background-color: rgba(232, 245, 233, 0.3); }
        .heatmap-med { background-color: rgba(165, 214, 167, 0.4); }
        .heatmap-high { background-color: rgba(102, 187, 106, 0.5); }
        .heatmap-max { background-color: rgba(67, 160, 71, 0.6); color: white; font-weight: bold; }

        /* --- PRINT STYLES --- */
        @media print {
            @page { size: portrait; margin: 10mm; }
            
            body { 
                background: white; 
                padding: 0; 
                margin: 0; 
                overflow: visible !important;
            }

            .matrix-container, .matrix-card, .matrix-table-wrapper, .weekday-chart-container {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                max-height: none !important;
                width: 100% !important;
            }

            /* Ensure background colors print for heatmap */
            .heatmap-cell, .heatmap-max { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .weekday-bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            /* Hide UI elements */
            .no-print, button, input, select, .sap-input, .btn-sap {
                display: none !important;
            }

            /* Table Print Optimization */
            .matrix-table {
                font-size: 11px;
                width: 100%;
            }
            
            .matrix-table th, .matrix-table td {
                border: 1px solid #ccc !important;
                padding: 4px !important;
                -webkit-print-color-adjust: exact;
            }

            .matrix-sticky-header th, .matrix-sticky-col {
                position: static !important;
                box-shadow: none !important;
            }

            /* Ensure colors print */
            .matrix-footer-avg td { background-color: #e6f2f3 !important; -webkit-print-color-adjust: exact; }
            .matrix-footer-total td { background-color: #2b3d51 !important; color: white !important; -webkit-print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Generate Matrix Report
 */
async function generateMatrixReport() {
    showLoading('جاري إنشاء مصفوفة المبيعات...');

    try {
        const branchFilter = document.getElementById('matrixBranch')?.value || '';
        const fromMonth = document.getElementById('matrixFromMonth')?.value;
        const toMonth = document.getElementById('matrixToMonth')?.value;
        const fromDay = parseInt(document.getElementById('matrixFromDay')?.value || '1');
        const toDay = parseInt(document.getElementById('matrixToDay')?.value || '31');

        if (!fromMonth || !toMonth) {
            showToast('warning', 'تنبيه', 'يرجى تحديد فترة الشهور');
            return;
        }

        if (fromDay > toDay) {
            showToast('error', 'خطأ', 'بداية الأيام يجب أن تكون قبل نهايتها');
            return;
        }

        const sales = await getSales();
        const months = getMonthsInRange(fromMonth, toMonth);

        // Filter Sales
        const filteredSales = sales.filter(s => {
            const sDate = new Date(s.date);
            const sMonth = s.date.substring(0, 7);
            const sDay = sDate.getDate();
            return months.includes(sMonth) && sDay >= fromDay && sDay <= toDay && (!branchFilter || s.branch === branchFilter);
        });

        // Structure Data
        const matrixData = {};
        for (let d = fromDay; d <= toDay; d++) {
            matrixData[d] = {};
            months.forEach(m => matrixData[d][m] = 0);
        }

        filteredSales.forEach(s => {
            const day = new Date(s.date).getDate();
            const month = s.date.substring(0, 7);
            if (matrixData[day] && matrixData[day][month] !== undefined) {
                matrixData[day][month] += Number(s.amount || 0);
            }
        });

        renderMatrixTable(months, matrixData, fromDay, toDay);

    } catch (error) {
        console.error('Error generating matrix report:', error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
        hideLoading();
    }
}

/**
 * Render Matrix Table with Advanced Analytics
 */
function renderMatrixTable(months, matrixData, fromDay, toDay) {
    const container = document.getElementById('matrixReportContent');
    if (!container) return;

    // --- 1. Calculate Statistics ---
    let grandTotal = 0;
    let maxDailyValue = 0;
    let activeDaysCount = 0;
    let bestDay = { date: '', value: 0 };
    let bestMonth = { name: '', value: 0 };

    const monthTotals = {};
    months.forEach(m => monthTotals[m] = 0);

    const weekdayStats = {
        0: { name: 'الأحد', total: 0, count: 0 },
        1: { name: 'الإثنين', total: 0, count: 0 },
        2: { name: 'الثلاثاء', total: 0, count: 0 },
        3: { name: 'الأربعاء', total: 0, count: 0 },
        4: { name: 'الخميس', total: 0, count: 0 },
        5: { name: 'الجمعة', total: 0, count: 0 },
        6: { name: 'السبت', total: 0, count: 0 }
    };

    for (let d = fromDay; d <= toDay; d++) {
        months.forEach(m => {
            const val = matrixData[d][m];
            if (val > 0) {
                grandTotal += val;
                monthTotals[m] += val;
                activeDaysCount++;

                if (val > maxDailyValue) maxDailyValue = val;

                // Best Day Logic
                if (val > bestDay.value) {
                    bestDay.value = val;
                    bestDay.date = `${d} ${getMonthName(parseInt(m.split('-')[1]))}`;
                }

                // Weekday Logic
                const dateObj = new Date(`${m}-${String(d).padStart(2, '0')}`);
                const dayIndex = dateObj.getDay();
                weekdayStats[dayIndex].total += val;
                weekdayStats[dayIndex].count++;
            }
        });
    }

    // Find Best Month
    let maxMonthVal = 0;
    months.forEach(m => {
        if (monthTotals[m] > maxMonthVal) {
            maxMonthVal = monthTotals[m];
            bestMonth.value = maxMonthVal;
            bestMonth.name = getMonthName(parseInt(m.split('-')[1]));
        }
    });

    // --- 2. Render Summary Cards ---
    let html = `
        <div class="matrix-summary-grid">
            <div class="matrix-stat-card">
                <div class="matrix-stat-icon" style="background:#e3f2fd; color:#1976d2">💰</div>
                <div class="matrix-stat-info">
                    <h4>إجمالي الإيرادات</h4>
                    <h3>${formatMoney(grandTotal)}</h3>
                </div>
            </div>
            <div class="matrix-stat-card">
                <div class="matrix-stat-icon" style="background:#e8f5e9; color:#2e7d32">📅</div>
                <div class="matrix-stat-info">
                    <h4>أفضل شهر (${bestMonth.name})</h4>
                    <h3>${formatMoney(bestMonth.value)}</h3>
                </div>
            </div>
            <div class="matrix-stat-card">
                <div class="matrix-stat-icon" style="background:#fff3e0; color:#f57c00">⭐</div>
                <div class="matrix-stat-info">
                    <h4>أفضل يوم (${bestDay.date})</h4>
                    <h3>${formatMoney(bestDay.value)}</h3>
                </div>
            </div>
            <div class="matrix-stat-card">
                <div class="matrix-stat-icon" style="background:#f3e5f5; color:#7b1fa2">📊</div>
                <div class="matrix-stat-info">
                    <h4>أيام النشاط</h4>
                    <h3>${activeDaysCount} يوم</h3>
                </div>
            </div>
        </div>
    `;

    // --- 3. Render Heatmap Table ---
    // Wrap in premium card if not already
    if (!container.classList.contains('matrix-card')) {
        container.classList.add('matrix-card');
        container.classList.add('matrix-table-wrapper');
    }

    html += `
        <div class="matrix-table-wrapper">
        <table class="matrix-table" id="matrixTable">
            <thead class="matrix-sticky-header">
                <tr>
                    <th class="matrix-sticky-col">اليوم</th>
    `;

    months.forEach(m => {
        const [year, month] = m.split('-');
        const monthName = getMonthName(parseInt(month));
        html += `<th>${monthName} ${year}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Icons
    const iconUp = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    const iconDown = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    for (let d = fromDay; d <= toDay; d++) {
        html += `<tr>`;
        html += `<td class="matrix-sticky-col">${d}</td>`;

        months.forEach((m, index) => {
            const value = matrixData[d][m];

            // Heatmap Class
            let heatmapClass = 'heatmap-cell';
            if (value > 0) {
                const ratio = value / maxDailyValue;
                if (value === maxDailyValue) heatmapClass += ' heatmap-max';
                else if (ratio > 0.7) heatmapClass += ' heatmap-high';
                else if (ratio > 0.4) heatmapClass += ' heatmap-med';
                else heatmapClass += ' heatmap-low';
            }

            let trendHtml = '';
            if (index > 0) {
                const prevVal = matrixData[d][months[index - 1]];
                if (value > prevVal) trendHtml = `<span class="trend-badge trend-up">${iconUp}</span>`;
                else if (value < prevVal) trendHtml = `<span class="trend-badge trend-down">${iconDown}</span>`;
            }

            html += `
                <td class="${heatmapClass}">
                    <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                        <span>${formatMoney(value)}</span>
                        ${trendHtml}
                    </div>
                </td>
            `;
        });
        html += `</tr>`;
    }

    // Average Row Calculation
    html += `<tr class="matrix-footer-avg"><td class="matrix-sticky-col">المتوسط (للأيام النشطة)</td>`;

    let prevAvg = null;

    months.forEach(m => {
        let activeDays = 0;
        for (let d = fromDay; d <= toDay; d++) {
            if (matrixData[d][m] > 0) activeDays++;
        }
        const avg = activeDays > 0 ? monthTotals[m] / activeDays : 0;

        let avgTrendHtml = '';
        if (prevAvg !== null) {
            if (avg > prevAvg) avgTrendHtml = `<span class="trend-badge trend-up">${iconUp}</span>`;
            else if (avg < prevAvg) avgTrendHtml = `<span class="trend-badge trend-down">${iconDown}</span>`;
        }
        prevAvg = avg;

        html += `
            <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:15px;">
                    <span>${formatMoney(avg)}</span>
                    ${avgTrendHtml}
                </div>
                <div style="font-size:10px; color:#666; margin-top:2px">
                    (${activeDays} يوم نشط)
                </div>
            </td>
        `;
    });
    html += `</tr>`;

    // Total Row
    html += `<tr class="matrix-footer-total"><td class="matrix-sticky-col">الإجمالي</td>`;
    months.forEach(m => {
        html += `<td>${formatMoney(monthTotals[m])}</td>`;
    });
    html += `</tr>`;

    html += `</tbody></table></div>`;

    container.innerHTML = html;
}

/**
 * Helper: Get Effective Days Count
 */
function getEffectiveDaysCount(monthStr, fromDay, toDay) {
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);

    // If it's the current month
    if (monthStr === currentMonthStr) {
        const currentDay = today.getDate();
        // The effective end day is the minimum of (selected toDay) and (today's date)
        const effectiveEnd = Math.min(toDay, currentDay);
        // Ensure we don't return negative if fromDay is in the future relative to today (though unlikely in valid usage)
        return Math.max(0, effectiveEnd - fromDay + 1);
    }

    // If it's a past month (or future month fully selected)
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate(); // Get last day of month

    const effectiveEnd = Math.min(toDay, daysInMonth);
    return Math.max(0, effectiveEnd - fromDay + 1);
}

/**
 * Helper: Get all months between two dates
 */
function getMonthsInRange(startMonth, endMonth) {
    const months = [];
    let current = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    while (current <= end) {
        months.push(current.toISOString().slice(0, 7));
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

/**
 * Print Matrix Report
 */
function printMatrixReport(tableOnly = false) {
    const branch = document.getElementById('matrixBranch');
    const branchName = branch ? branch.options[branch.selectedIndex].text : 'الكل';
    const fromMonth = document.getElementById('matrixFromMonth').value;
    const toMonth = document.getElementById('matrixToMonth').value;

    // Get content based on mode
    let contentToPrint = '';
    if (tableOnly) {
        const tableWrapper = document.querySelector('.matrix-table-wrapper');
        if (tableWrapper) {
            contentToPrint = tableWrapper.outerHTML;
        } else {
            // Fallback if wrapper not found, though it should be there
            contentToPrint = document.getElementById('matrixReportContent').innerHTML;
        }
    } else {
        contentToPrint = document.getElementById('matrixReportContent').innerHTML;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>مصفوفة المبيعات الشهرية</title>
            <style>
                ${document.getElementById('matrix-sap-styles')?.textContent || ''}
                
                /* Overwrite/Add specific print styles */
                @media print {
                    @page { 
                        size: portrait; 
                        margin: 5mm; 
                    }
                    
                    html, body {
                        height: 100%;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }

                    body { 
                        padding: 5px; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        display: flex;
                        flex-direction: column;
                        font-family: '72', '72full', Arial, Helvetica, sans-serif;
                    }

                    .print-header {
                        text-align: center;
                        margin-bottom: 5px;
                        border-bottom: 2px solid var(--sap-primary);
                        padding-bottom: 5px;
                        flex-shrink: 0;
                    }

                    .print-header h1 { margin: 0; color: var(--sap-primary); font-size: 18px; }
                    
                    .print-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                        background: #f8fafc;
                        padding: 5px;
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                        font-size: 11px;
                        flex-shrink: 0;
                    }

                    /* Table Layout Optimization */
                    .matrix-table-wrapper {
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;
                    }

                    .matrix-table {
                        width: 100%;
                        height: 100%; /* Fill available height */
                        table-layout: fixed;
                    }

                    .matrix-table th, .matrix-table td {
                        padding: 2px 1px !important;
                        font-size: 11px !important;
                        border: 1px solid #ccc !important;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    /* Specific Column Widths */
                    /* 1. Days Column (First) - Very Narrow */
                    .matrix-table th:first-child, 
                    .matrix-table td:first-child {
                        width: 30px !important;
                        min-width: 30px !important;
                        max-width: 30px !important;
                        font-weight: bold;
                        background-color: #f0f0f0 !important;
                    }

                    /* 2. Data Columns - Auto width */
                    .matrix-table th:not(:first-child), 
                    .matrix-table td:not(:first-child) {
                        width: auto !important;
                    }
                    
                    .print-footer {
                        margin-top: auto; /* Push to bottom */
                        padding-top: 5px;
                        flex-shrink: 0;
                    }

                    /* Hide summary grid if table only */
                    ${tableOnly ? '.matrix-summary-grid { display: none !important; }' : ''}
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>تقرير مصفوفة المبيعات الشهرية</h1>
            </div>
            
            <div class="print-meta">
                <div><strong>الفرع:</strong> ${branchName}</div>
                <div><strong>الفترة:</strong> ${fromMonth} إلى ${toMonth}</div>
                <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-SA')}</div>
            </div>

            ${contentToPrint}

            <div class="print-footer" style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
                تم استخراج هذا التقرير من النظام الآلي | ${new Date().toLocaleString('ar-SA')}
            </div>
            
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Export Matrix to Excel
 */
function exportMatrixToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('error', 'خطأ', 'مكتبة Excel غير محملة. يرجى تحديث الصفحة.');
        return;
    }

    const table = document.getElementById('matrixTable');
    if (!table) {
        showToast('warning', 'تنبيه', 'لا يوجد جدول لتصديره');
        return;
    }

    const wb = XLSX.utils.table_to_book(table, { sheet: "Matrix Report" });
    const fileName = `Matrix_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Export functions
window.initMatrixReport = initMatrixReport;
window.generateMatrixReport = generateMatrixReport;
window.printMatrixReport = printMatrixReport;
window.exportMatrixToExcel = exportMatrixToExcel;
