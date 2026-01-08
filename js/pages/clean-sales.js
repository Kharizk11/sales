// Clean Sales Logic - Direct Submission - SAP Fiori Style

async function handleCleanSubmit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Loading state
    submitBtn.innerHTML = '⏳ جاري الحفظ...';
    submitBtn.disabled = true;

    try {
        const date = document.getElementById('saleDate').value;
        const branch = document.getElementById('saleBranch').value;
        const amount = parseFloat(document.getElementById('saleAmount').value);
        const description = document.getElementById('saleDescription').value;
        const notes = document.getElementById('saleNotes').value;
        const id = document.getElementById('saleId').value;

        if (!date || !branch || isNaN(amount)) {
            showToast('warning', 'تنبيه', 'يرجى تعبئة الحقول الأساسية');
            return;
        }

        // Prepare data object
        const saleData = {
            id: id || Date.now().toString(),
            date,
            branch,
            amount,
            description,
            notes,
            updatedAt: new Date().toISOString()
        };

        if (!id) {
            saleData.createdAt = new Date().toISOString();
        }

        // Get current sales
        let currentSales = [];
        if (typeof window.getSales === 'function') {
            currentSales = await window.getSales();
        }

        if (id) {
            // Update existing
            const index = currentSales.findIndex(s => s.id === id);
            if (index !== -1) {
                currentSales[index] = { ...currentSales[index], ...saleData };
            }
        } else {
            // Add new
            currentSales.push(saleData);
        }

        // Save
        if (typeof window.saveSales === 'function') {
            await window.saveSales(currentSales);

            showToast('success', 'تم الحفظ', 'تم تسجيل العملية بنجاح');
            resetCleanForm();

            // Refresh list if visible
            if (document.getElementById('salesListSection').style.display !== 'none') {
                loadSalesTable();
            }

            // Update dashboard stats if needed
            window.dispatchEvent(new CustomEvent('salesUpdated', { detail: currentSales }));
        }

    } catch (error) {
        console.error('Error saving sale:', error);
        showToast('error', 'خطأ', 'حدثت مشكلة أثناء الحفظ');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function resetCleanForm() {
    document.getElementById('cleanSalesForm').reset();
    document.getElementById('saleId').value = '';
    document.getElementById('saleDate').valueAsDate = new Date();
}

async function loadBranches() {
    const select = document.getElementById('saleBranch');
    if (!select) return;

    try {
        if (typeof window.getBranches === 'function') {
            const branches = await window.getBranches();

            // Keep first option
            const placeholder = select.options[0];
            select.innerHTML = '';
            select.appendChild(placeholder);

            branches.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.textContent = b.name;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Error loading branches:', e);
    }
}

async function loadSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري التحميل...</td></tr>';

    try {
        let sales = [];
        if (typeof window.getSales === 'function') {
            sales = await window.getSales();
        }

        if (sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--sap-text-secondary);">لا توجد سجلات</td></tr>';
            return;
        }

        // Group sales by year and month
        const groupedData = {};
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const year = saleDate.getFullYear();
            const month = saleDate.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;

            if (!groupedData[year]) {
                groupedData[year] = {};
            }
            if (!groupedData[year][monthKey]) {
                groupedData[year][monthKey] = {
                    sales: [],
                    total: 0,
                    month: month,
                    year: year
                };
            }
            groupedData[year][monthKey].sales.push(sale);
            groupedData[year][monthKey].total += parseFloat(sale.amount);
        });

        // Sort years descending
        const years = Object.keys(groupedData).sort((a, b) => b - a);

        // Month names in Arabic
        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        let html = '';

        years.forEach(year => {
            const yearData = groupedData[year];
            const yearTotal = Object.values(yearData).reduce((sum, m) => sum + m.total, 0);
            const isCurrentYear = parseInt(year) === currentYear;
            const yearId = `year-${year}`;

            // Year header row
            html += `
                <tr class="year-header" onclick="toggleYear('${yearId}')" style="cursor:pointer; background-color: var(--sap-bg-hover); font-weight: bold;">
                    <td colspan="3">
                        <span id="${yearId}-icon" style="display:inline-block; transition: transform 0.3s;">${isCurrentYear ? '▼' : '◀'}</span>
                        📅 السنة ${year}
                    </td>
                    <td style="font-weight:bold; color:var(--sap-primary);">${yearTotal.toFixed(2)} ريال</td>
                    <td></td>
                </tr>
            `;

            // Sort months descending
            const months = Object.keys(yearData).sort((a, b) => b.localeCompare(a));

            months.forEach(monthKey => {
                const monthData = yearData[monthKey];
                const isCurrentMonth = parseInt(year) === currentYear && monthData.month === currentMonth;
                const monthId = `month-${monthKey}`;
                const monthName = monthNames[monthData.month - 1];

                // Month header row
                html += `
                    <tr class="month-header ${yearId}-content" style="display:${isCurrentYear ? 'table-row' : 'none'}; cursor:pointer; background-color: #F8F9FA;" onclick="toggleMonth('${monthId}')">
                        <td colspan="3" style="padding-right: 30px;">
                            <span id="${monthId}-icon" style="display:inline-block; transition: transform 0.3s;">${isCurrentMonth ? '▼' : '◀'}</span>
                            📊 ${monthName} ${year}
                        </td>
                        <td style="font-weight:bold; color:var(--sap-primary-active);">${monthData.total.toFixed(2)} ريال</td>
                        <td style="color:var(--sap-text-secondary); font-size:0.85rem;">${monthData.sales.length} عملية</td>
                    </tr>
                `;

                // Sort sales within month by date descending
                monthData.sales.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Sales rows
                monthData.sales.forEach(sale => {
                    html += `
                        <tr class="${monthId}-content ${yearId}-content" style="display:${isCurrentYear && isCurrentMonth ? 'table-row' : 'none'};">
                            <td style="padding-right: 50px;">${sale.date}</td>
                            <td>${sale.branch}</td>
                            <td>${sale.description || '-'}</td>
                            <td style="font-weight:bold; color:var(--sap-primary-active);">${parseFloat(sale.amount).toFixed(2)}</td>
                            <td>
                                <button class="btn-sap btn-standard" style="padding:5px 10px; font-size:0.8rem;" onclick="editSale('${sale.id}')">✏️</button>
                                <button class="btn-sap btn-standard" style="padding:5px 10px; font-size:0.8rem; color:var(--sap-error); border-color:var(--sap-error);" onclick="deleteSale('${sale.id}')">🗑️</button>
                            </td>
                        </tr>
                    `;
                });
            });
        });

        tbody.innerHTML = html;

    } catch (e) {
        console.error('Error loading table:', e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">خطأ في التحميل</td></tr>';
    }
}

// Toggle year visibility
function toggleYear(yearId) {
    const icon = document.getElementById(`${yearId}-icon`);
    const rows = document.querySelectorAll(`.${yearId}-content`);

    const isVisible = rows[0]?.style.display !== 'none';

    rows.forEach(row => {
        if (row.classList.contains('month-header')) {
            row.style.display = isVisible ? 'none' : 'table-row';
        } else {
            // Keep sales rows hidden if their month is collapsed
            const monthId = Array.from(row.classList).find(c => c.endsWith('-content') && c !== `${yearId}-content`);
            if (monthId) {
                const monthIcon = document.getElementById(monthId.replace('-content', '-icon'));
                if (monthIcon && monthIcon.textContent === '▼') {
                    row.style.display = isVisible ? 'none' : 'table-row';
                }
            }
        }
    });

    icon.textContent = isVisible ? '◀' : '▼';
}

// Toggle month visibility
function toggleMonth(monthId) {
    event.stopPropagation(); // Prevent year toggle
    const icon = document.getElementById(`${monthId}-icon`);
    const rows = document.querySelectorAll(`.${monthId}-content`);

    const isVisible = rows[0]?.style.display !== 'none';

    rows.forEach(row => {
        if (!row.classList.contains('month-header')) {
            row.style.display = isVisible ? 'none' : 'table-row';
        }
    });

    icon.textContent = isVisible ? '◀' : '▼';
}

async function deleteSale(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
        let sales = await window.getSales();
        sales = sales.filter(s => s.id !== id);
        await window.saveSales(sales);
        showToast('info', 'تم الحذف', 'تم حذف السجل');
        loadSalesTable();
        window.dispatchEvent(new CustomEvent('salesUpdated', { detail: sales }));
    } catch (e) {
        console.error(e);
        showToast('error', 'خطأ', 'فشل الحذف');
    }
}

async function editSale(id) {
    try {
        const sales = await window.getSales();
        const sale = sales.find(s => s.id == id); // Loose equality for string/number ids
        if (sale) {
            document.getElementById('saleId').value = sale.id;
            document.getElementById('saleDate').value = sale.date;
            document.getElementById('saleBranch').value = sale.branch;
            document.getElementById('saleAmount').value = sale.amount;
            document.getElementById('saleDescription').value = sale.description || '';
            document.getElementById('saleNotes').value = sale.notes || '';

            // Scroll to top
            document.querySelector('.sap-card').scrollIntoView({ behavior: 'smooth' });
            showToast('info', 'تعديل', 'جاري تعديل السجل...');
        }
    } catch (e) {
        console.error(e);
    }
}

function toggleSalesTable() {
    const section = document.getElementById('salesListSection');
    const btn = document.getElementById('toggleSalesBtn');

    if (section.style.display === 'none') {
        section.style.display = 'block';
        btn.style.backgroundColor = '#EBF5FE'; // Active state simulation
        loadSalesTable();
    } else {
        section.style.display = 'none';
        btn.style.backgroundColor = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBranches();
});
