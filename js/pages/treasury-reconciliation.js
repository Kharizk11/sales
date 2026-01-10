// Treasury Reconciliation Logic

let allTreasuryRecs = [];
let currentTreasuryRec = null;
let treasuryDefinitions = {};
let tableData = {
    expenses: [],
    payments: [],
    transfers: [],
    deposits: []
};

/**
 * Initialize Treasury Page
 */
async function initTreasuryPage() {
    console.log('Initializing Treasury Page');
    showLoading('جاري تحميل بيانات الخزينة...');

    try {
        allTreasuryRecs = await getTreasuryReconciliations();
        treasuryDefinitions = await getTreasuryDefinitions();

        // Populate Datalists
        populateDatalists();

        // Initialize with today's date
        const dateInput = document.getElementById('treasuryDate');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
            await loadTreasuryDataForDate(dateInput.value);
        }

        renderTreasuryHistory();

    } catch (error) {
        console.error('Error initializing treasury page:', error);
        showToast('error', 'خطأ', 'فشل تحميل بيانات الخزينة');
    } finally {
        hideLoading();
    }
}

function populateDatalists() {
    if (!treasuryDefinitions) return;
    updateDatalist('expensesList', treasuryDefinitions.expenses);
    updateDatalist('paymentsList', treasuryDefinitions.payments);
    updateDatalist('transfersList', treasuryDefinitions.transfers);
    updateDatalist('depositsList', treasuryDefinitions.deposits);
}

function updateDatalist(id, items) {
    const datalist = document.getElementById(id);
    if (!datalist || !items) return;
    datalist.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
}

// --- Definitions Management ---

let currentDefType = '';

function openDefinitionModal(type) {
    currentDefType = type;
    const modal = document.getElementById('definitionModal');
    const title = document.getElementById('defModalTitle');

    let titleText = '';
    let items = [];

    switch (type) {
        case 'expenses': titleText = 'إدارة بنود المصروفات'; items = treasuryDefinitions.expenses; break;
        case 'payments': titleText = 'إدارة بنود المدفوعات'; items = treasuryDefinitions.payments; break;
        case 'transfers': titleText = 'إدارة بنود التحويلات'; items = treasuryDefinitions.transfers; break;
        case 'deposits': titleText = 'إدارة بنود الإيداعات'; items = treasuryDefinitions.deposits; break;
    }

    if (title) title.textContent = titleText;
    renderDefinitionList(items);

    if (modal) modal.style.display = 'flex';
}

function closeDefinitionModal() {
    const modal = document.getElementById('definitionModal');
    if (modal) modal.style.display = 'none';
}

function renderDefinitionList(items) {
    const list = document.getElementById('defModalList');
    if (!list) return;
    list.innerHTML = '';

    if (!items) return;

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'def-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.padding = '8px';
        div.style.borderBottom = '1px solid #eee';

        div.innerHTML = `
            <span>${item}</span>
            <button class="btn-sap btn-transparent" onclick="deleteDefinition(${index})" style="color: var(--sap-error);">🗑️</button>
        `;
        list.appendChild(div);
    });
}

async function addDefinition() {
    const input = document.getElementById('defInput');
    const value = input.value.trim();
    if (!value) return;

    if (!treasuryDefinitions[currentDefType].includes(value)) {
        treasuryDefinitions[currentDefType].push(value);
        await saveTreasuryDefinitions(treasuryDefinitions);
        renderDefinitionList(treasuryDefinitions[currentDefType]);
        populateDatalists();
        input.value = '';
        showToast('success', 'تم', 'تم إضافة البند');
    } else {
        showToast('warning', 'تنبيه', 'البند موجود مسبقاً');
    }
}

async function deleteDefinition(index) {
    if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return;

    treasuryDefinitions[currentDefType].splice(index, 1);
    await saveTreasuryDefinitions(treasuryDefinitions);
    renderDefinitionList(treasuryDefinitions[currentDefType]);
    populateDatalists();
    showToast('success', 'تم', 'تم حذف البند');
}

/**
 * Load data for a specific date
 */
async function loadTreasuryDataForDate(date) {
    showLoading('جاري جلب البيانات...');

    try {
        // 1. Check if we have a saved record for this date
        currentTreasuryRec = allTreasuryRecs.find(r => r.date === date);

        // 2. Fetch POS Reconciliations for this date to get totals
        const allPosRecs = await getReconciliations();
        const daysPosRecs = allPosRecs.filter(r => r.date === date);

        const totalPosSales = daysPosRecs.reduce((sum, r) => sum + (parseFloat(r.totalSales) || 0), 0);
        const totalPosMada = daysPosRecs.reduce((sum, r) => sum + (parseFloat(r.madaSales) || 0), 0);
        const totalPosVisa = daysPosRecs.reduce((sum, r) => sum + (parseFloat(r.visaSales) || 0), 0);
        const totalPosNetwork = totalPosMada + totalPosVisa;

        // 3. Render POS Sales Table
        const salesTableHtml = `
            <table class="sap-table" style="margin: 0; border: 1px solid #eee;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th>نقطة البيع</th>
                        <th style="text-align: left;">المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${daysPosRecs.map(r => `
                        <tr>
                            <td>${r.posName}</td>
                            <td style="text-align: left;">${formatMoney(r.totalSales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background: #f0f7ff;">
                        <td>الإجمالي</td>
                        <td style="text-align: left;" id="trPosSales">${formatMoney(totalPosSales)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        document.getElementById('trPosSalesTableContainer').innerHTML = salesTableHtml;

        // 4. Render POS Network Table
        const networkTableHtml = `
            <table class="sap-table" style="margin: 0; border: 1px solid #eee;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th>نقطة البيع</th>
                        <th style="text-align: left;">مدى</th>
                        <th style="text-align: left;">فيزا</th>
                        <th style="text-align: left;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${daysPosRecs.map(r => `
                        <tr>
                            <td>${r.posName}</td>
                            <td style="text-align: left;">${formatMoney(r.madaSales || 0)}</td>
                            <td style="text-align: left;">${formatMoney(r.visaSales || 0)}</td>
                            <td style="text-align: left;">${formatMoney(r.networkSales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background: #fff3e0;">
                        <td>الإجمالي</td>
                        <td style="text-align: left;" id="trPosMada">${formatMoney(totalPosMada)}</td>
                        <td style="text-align: left;" id="trPosVisa">${formatMoney(totalPosVisa)}</td>
                        <td style="text-align: left;" id="trPosNetwork">${formatMoney(totalPosNetwork)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        document.getElementById('trPosNetworkTableContainer').innerHTML = networkTableHtml;

        if (currentTreasuryRec) {
            // Load existing data
            document.getElementById('trOpeningBalance').value = currentTreasuryRec.openingBalance || 0;
            document.getElementById('trReturns').value = currentTreasuryRec.returns || 0;
            document.getElementById('trActualCash').value = currentTreasuryRec.actualCash || 0;
            document.getElementById('trNotes').value = currentTreasuryRec.notes || '';

            // Load tables
            renderDynamicTable('expenses', currentTreasuryRec.expenses || []);
            renderDynamicTable('payments', currentTreasuryRec.payments || []);
            renderDynamicTable('transfers', currentTreasuryRec.transfers || []);
            renderDynamicTable('deposits', currentTreasuryRec.deposits || []);
        } else {
            // New record - Try to get opening balance from previous day
            const previousDate = new Date(date);
            previousDate.setDate(previousDate.getDate() - 1);
            const prevDateStr = previousDate.toISOString().split('T')[0];
            const prevRec = allTreasuryRecs.find(r => r.date === prevDateStr);

            document.getElementById('trOpeningBalance').value = prevRec ? prevRec.actualCash : 0;
            document.getElementById('trReturns').value = 0;
            document.getElementById('trActualCash').value = 0;
            document.getElementById('trNotes').value = '';

            // Clear tables
            renderDynamicTable('expenses', []);
            renderDynamicTable('payments', []);
            renderDynamicTable('transfers', []);
            renderDynamicTable('deposits', []);
        }

        calculateTreasury();

    } catch (error) {
        console.error('Error loading daily data:', error);
    } finally {
        hideLoading();
    }
}

/**
 * Dynamic Table Management
 */


function renderDynamicTable(type, data) {
    tableData[type] = data || [];
    const tbody = document.getElementById(`tr${capitalize(type)}Body`);
    if (!tbody) return;

    tbody.innerHTML = '';
    tableData[type].forEach((item, index) => {
        const row = document.createElement('tr');
        if (type === 'expenses') {
            row.innerHTML = `
                <td><input type="text" class="sap-input" value="${item.description || ''}" list="${type}List" onchange="updateTableItem('${type}', ${index}, 'description', this.value)"></td>
                <td><input type="text" class="sap-input" value="${item.statement || ''}" placeholder="بيان البند..." onchange="updateTableItem('${type}', ${index}, 'statement', this.value)"></td>
                <td><input type="number" class="sap-input" value="${item.amount || 0}" step="0.01" onchange="updateTableItem('${type}', ${index}, 'amount', this.value)"></td>
                <td><button class="btn-sap btn-transparent" onclick="removeTableItem('${type}', ${index})" style="color: var(--sap-error);">🗑️</button></td>
            `;
        } else {
            row.innerHTML = `
                <td><input type="text" class="sap-input" value="${item.description || ''}" list="${type}List" onchange="updateTableItem('${type}', ${index}, 'description', this.value)"></td>
                <td><input type="number" class="sap-input" value="${item.amount || 0}" step="0.01" onchange="updateTableItem('${type}', ${index}, 'amount', this.value)"></td>
                <td><button class="btn-sap btn-transparent" onclick="removeTableItem('${type}', ${index})" style="color: var(--sap-error);">🗑️</button></td>
            `;
        }
        tbody.appendChild(row);
    });

    // Add Subtotal row
    const subtotal = tableData[type].reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const subtotalRow = document.createElement('tr');
    subtotalRow.style.fontWeight = 'bold';
    subtotalRow.style.background = 'var(--sap-bg-secondary)';

    if (type === 'expenses') {
        subtotalRow.innerHTML = `
            <td colspan="2" style="text-align: left; padding-left: 20px;">إجمالي القسم:</td>
            <td style="color: var(--sap-text-primary);">${formatMoney(subtotal)}</td>
            <td></td>
        `;
    } else {
        subtotalRow.innerHTML = `
            <td style="text-align: left; padding-left: 20px;">إجمالي القسم:</td>
            <td style="color: var(--sap-text-primary);">${formatMoney(subtotal)}</td>
            <td></td>
        `;
    }
    tbody.appendChild(subtotalRow);

    // Add "Add New" row
    const addRow = document.createElement('tr');
    const colSpan = type === 'expenses' ? 4 : 3;
    addRow.innerHTML = `
        <td colspan="${colSpan}" style="text-align: center;">
            <button class="btn-sap btn-standard" onclick="addTableItem('${type}')" style="width: 100%;">+ إضافة بند</button>
        </td>
    `;
    tbody.appendChild(addRow);

    calculateTreasury();
}

function addTableItem(type) {
    const newItem = { description: '', amount: 0 };
    if (type === 'expenses') newItem.statement = '';
    tableData[type].push(newItem);
    renderDynamicTable(type, tableData[type]);
}

function removeTableItem(type, index) {
    tableData[type].splice(index, 1);
    renderDynamicTable(type, tableData[type]);
}

function updateTableItem(type, index, field, value) {
    if (field === 'amount') value = parseFloat(value) || 0;
    tableData[type][index][field] = value;
    calculateTreasury();
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Calculations
 */
function calculateTreasury() {
    // Inputs
    const openingBalance = parseFloat(document.getElementById('trOpeningBalance').value) || 0;
    const posSales = parseFloat(document.getElementById('trPosSales').textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const returns = parseFloat(document.getElementById('trReturns').value) || 0;

    // Tables Sums
    const sumExpenses = tableData.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumPayments = tableData.payments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumTransfers = tableData.transfers.reduce((sum, item) => sum + (item.amount || 0), 0); // Outflow (Bank Transfer)
    const sumDeposits = tableData.deposits.reduce((sum, item) => sum + (item.amount || 0), 0); // Inflow (Cash Deposit)

    const posNetwork = parseFloat(document.getElementById('trPosNetwork').textContent.replace(/[^0-9.-]+/g, "")) || 0;

    // Logic:
    // Net Daily Cash = (POS Sales - Returns + Cash Deposits) - (Network Sales + Expenses + Payments + Bank Transfers)
    // Note: POS Sales includes Network, so we subtract Network to get Cash Sales.

    const totalReceipts = openingBalance + posSales + returns;
    const totalNonCash = posNetwork + sumTransfers;
    const totalOutflows = sumExpenses + sumPayments + sumDeposits;

    const netDailyCash = totalReceipts - totalNonCash - totalOutflows;
    const bookBalance = openingBalance + (posSales + sumDeposits) - (returns + posNetwork + sumExpenses + sumPayments + sumTransfers);
    // Note: The above bookBalance calculation is more explicit to match the logic:
    // Net Daily Cash = (POS Sales + Cash Deposits) - (Returns + Network + Expenses + Payments + Transfers)
    // But the user wants specific section totals displayed.

    const actualCash = parseFloat(document.getElementById('trActualCash').value) || 0;
    const difference = actualCash - bookBalance;

    // Update UI
    document.getElementById('trTotalReceipts').textContent = formatMoney(totalReceipts);
    document.getElementById('trTotalNonCash').textContent = formatMoney(totalNonCash);
    document.getElementById('trTotalOutflows').textContent = formatMoney(totalOutflows);

    document.getElementById('trNetCash').textContent = formatMoney(netDailyCash);
    document.getElementById('trBookBalance').textContent = formatMoney(bookBalance);
    document.getElementById('trDifference').textContent = formatMoney(difference);

    const diffEl = document.getElementById('trDifference');
    if (difference > 0) diffEl.style.color = 'var(--sap-success)';
    else if (difference < 0) diffEl.style.color = 'var(--sap-error)';
    else diffEl.style.color = 'inherit';
}

/**
 * Submit Handler
 */
async function handleTreasurySubmit(event) {
    event.preventDefault();
    showLoading('جاري الحفظ...');

    const date = document.getElementById('treasuryDate').value;
    const id = currentTreasuryRec ? currentTreasuryRec.id : Date.now().toString();

    const recData = {
        id,
        date,
        openingBalance: parseFloat(document.getElementById('trOpeningBalance').value) || 0,
        posSales: parseFloat(document.getElementById('trPosSales').textContent.replace(/[^0-9.-]+/g, "")) || 0,
        posNetwork: parseFloat(document.getElementById('trPosNetwork').textContent.replace(/[^0-9.-]+/g, "")) || 0,
        returns: parseFloat(document.getElementById('trReturns').value) || 0,
        actualCash: parseFloat(document.getElementById('trActualCash').value) || 0,
        notes: document.getElementById('trNotes').value,
        expenses: tableData.expenses,
        payments: tableData.payments,
        transfers: tableData.transfers,
        deposits: tableData.deposits,
        netCash: parseFloat(document.getElementById('trNetCash').textContent.replace(/[^0-9.-]+/g, "")) || 0,
        bookBalance: parseFloat(document.getElementById('trBookBalance').textContent.replace(/[^0-9.-]+/g, "")) || 0,
        difference: parseFloat(document.getElementById('trDifference').textContent.replace(/[^0-9.-]+/g, "")) || 0
    };

    // Update Local Array
    const index = allTreasuryRecs.findIndex(r => r.id === id);
    if (index > -1) allTreasuryRecs[index] = recData;
    else allTreasuryRecs.push(recData);

    try {
        await saveTreasuryReconciliations(allTreasuryRecs);
        showToast('success', 'تم الحفظ', 'تم حفظ تسوية الخزينة بنجاح');
        renderTreasuryHistory();
    } catch (error) {
        showToast('error', 'خطأ', 'فشل الحفظ');
    } finally {
        hideLoading();
    }
}

/**
 * History Table
 */
function renderTreasuryHistory() {
    const tbody = document.getElementById('treasuryHistoryBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sorted = [...allTreasuryRecs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(rec => {
        const row = document.createElement('tr');
        let diffColor = 'inherit';
        if (rec.difference > 0) diffColor = 'var(--sap-success)';
        else if (rec.difference < 0) diffColor = 'var(--sap-error)';

        row.innerHTML = `
            <td>${rec.date}</td>
            <td>${formatMoney(rec.bookBalance)}</td>
            <td>${formatMoney(rec.actualCash)}</td>
            <td style="font-weight: bold; color: ${diffColor}">${formatMoney(rec.difference)}</td>
            <td>
                <button class="btn-sap btn-transparent" onclick="loadTreasuryRecord('${rec.date}')">👁️ عرض</button>
            </td>
        `;
        tbody.innerHTML += row.outerHTML;
    });
}

function loadTreasuryRecord(date) {
    document.getElementById('treasuryDate').value = date;
    loadTreasuryDataForDate(date);
    document.getElementById('treasuryFormSection').scrollIntoView({ behavior: 'smooth' });
}

// --- Reports Logic ---

function toggleTreasuryView(view) {
    const formSection = document.getElementById('treasuryFormSection');
    const reportsSection = document.getElementById('treasuryReportsView');

    if (view === 'form') {
        if (formSection) formSection.style.display = 'block';
        if (reportsSection) reportsSection.style.display = 'none';
    } else {
        if (formSection) formSection.style.display = 'none';
        if (reportsSection) reportsSection.style.display = 'block';
        initTreasuryReports();
    }
}

function initTreasuryReports() {
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const startInput = document.getElementById('repStartDate');
    const endInput = document.getElementById('repEndDate');

    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = today;

    filterTreasuryReports();
}

let currentReportData = [];

function filterTreasuryReports() {
    const startDate = document.getElementById('repStartDate').value;
    const endDate = document.getElementById('repEndDate').value;
    const type = document.getElementById('repType').value;
    const search = document.getElementById('repSearch').value.toLowerCase();

    let results = [];

    allTreasuryRecs.forEach(rec => {
        if (rec.date < startDate || rec.date > endDate) return;

        // Helper to process list
        const processList = (list, typeLabel, typeKey) => {
            if (!list) return;
            list.forEach(item => {
                if (type !== 'all' && type !== typeKey) return;
                if (search && !item.description.toLowerCase().includes(search)) return;

                results.push({
                    date: rec.date,
                    type: typeLabel,
                    description: item.description + (item.statement ? ` - ${item.statement}` : ''),
                    amount: item.amount,
                    notes: rec.notes || ''
                });
            });
        };

        processList(rec.expenses, 'مصروفات', 'expenses');
        processList(rec.payments, 'مدفوعات', 'payments');
        processList(rec.transfers, 'تحويلات', 'transfers');
        processList(rec.deposits, 'إيداعات', 'deposits');
    });

    // Sort by date desc
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    currentReportData = results;
    renderTreasuryReportTable(results);
}

function renderTreasuryReportTable(data) {
    const tbody = document.getElementById('treasuryReportsBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    let total = 0;

    data.forEach(row => {
        total += row.amount;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.type}</td>
            <td>${row.description}</td>
            <td>${formatMoney(row.amount)}</td>
            <td>${row.notes}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('repTotalAmount').textContent = formatMoney(total);
}

function exportTreasuryReport() {
    if (currentReportData.length === 0) {
        showToast('warning', 'تنبيه', 'لا توجد بيانات للتصدير');
        return;
    }

    const data = currentReportData.map(row => ({
        'التاريخ': row.date,
        'النوع': row.type,
        'البند / الجهة': row.description,
        'المبلغ': row.amount,
        'ملاحظات': row.notes
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Treasury Report");
    XLSX.writeFile(wb, `Treasury_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// --- Print Logic ---

function printTreasuryReconciliation() {
    const date = document.getElementById('treasuryDate').value;
    const openingBalance = parseFloat(document.getElementById('trOpeningBalance').value) || 0;
    const posSales = parseFloat(document.getElementById('trPosSales').textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const posNetwork = parseFloat(document.getElementById('trPosNetwork').textContent.replace(/[^0-9.-]+/g, "")) || 0;

    // Calculate totals for sections
    const sumTransfers = tableData.transfers.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumExpenses = tableData.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumPayments = tableData.payments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumDeposits = tableData.deposits.reduce((sum, item) => sum + (item.amount || 0), 0);

    const totalReceipts = openingBalance + posSales;
    const totalNonCash = posNetwork + sumTransfers;
    const netCashInflow = totalReceipts - totalNonCash;

    const bookBalance = parseFloat(document.getElementById('trBookBalance').textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const actualCash = parseFloat(document.getElementById('trActualCash').value) || 0;
    const difference = parseFloat(document.getElementById('trDifference').textContent.replace(/[^0-9.-]+/g, "")) || 0;

    // Helper for rows
    const row = (label, amount, isBold = false, isNegative = false) => `
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; ${isBold ? 'font-weight: bold;' : ''}">
            <span style="direction: ltr;">${formatMoney(amount)} ${isNegative ? '-' : ''}</span>
            <span>${label}</span>
        </div>
    `;

    const sectionHeader = (title) => `
        <div style="background: #f0f0f0; padding: 8px; font-weight: bold; margin: 15px 0 10px 0; text-align: right; border-radius: 4px;">
            ${title}
        </div>
    `;

    const printContent = `
        <div style="direction: rtl; font-family: 'Tajawal', sans-serif; color: #000; max-width: 800px; margin: 0 auto;">
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
                <div style="text-align: right;">
                    <h1 style="margin: 0; font-size: 24px;">محضر تسوية الخزينة اليومي</h1>
                    <p style="margin: 5px 0;">بتاريخ: ${date}</p>
                </div>
                <div style="text-align: left;">
                    <h2 style="margin: 0; color: #2c3e50;">شركة ركن العمارية</h2>
                    <p style="margin: 0; font-size: 12px;">قسم الحسابات والمراجعة المالية</p>
                </div>
            </div>

            <!-- 1. Receipts (Opening + Sales) -->
            ${row('(+) الرصيد الافتتاحي للخزينة', openingBalance)}
            ${row('(+) إجمالي المبيعات (Z-Report)', posSales)}
            <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
            ${row('إجمالي المقبوضات الدفترية', totalReceipts, true)}

            <!-- 2. Non-Cash Deductions -->
            ${sectionHeader('2. تسويات العمليات غير النقدية (خصم)')}
            ${row('(-) مبيعات مدى', parseFloat(document.getElementById('trPosMada').textContent.replace(/[^0-9.-]+/g, "")) || 0, false, true)}
            ${row('(-) مبيعات فيزا', parseFloat(document.getElementById('trPosVisa').textContent.replace(/[^0-9.-]+/g, "")) || 0, false, true)}
            <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
            ${row('إجمالي الخصومات غير النقدية', totalNonCash, true, true)}

            <!-- Net Cash Inflow -->
            <div style="background: #e8f5e9; padding: 10px; margin: 20px 0; border-radius: 4px; border: 1px solid #c8e6c9;">
                ${row('صافي النقد اليومي الفعلي الوارد للخزينة (Cash Inflow)', netCashInflow, true)}
            </div>

            <!-- 3. Outflows (Expenses, Payments, Deposits) -->
            ${sectionHeader('المصروفات والمدفوعات النقدية')}
            
            <!-- Expenses List -->
            ${tableData.expenses.map(item => row(`- مصروفات: ${item.description}${item.statement ? ' (' + item.statement + ')' : ''}`, item.amount)).join('')}
            
            <!-- Payments List -->
            ${tableData.payments.map(item => row(`- سداد مورد: ${item.description}`, item.amount)).join('')}
            
            <!-- Deposits List -->
            ${tableData.deposits.map(item => row(`- إيداع بنكي: ${item.description}`, item.amount)).join('')}
            
            <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
            ${row('إجمالي المصروفات والمدفوعات', sumExpenses + sumPayments + sumDeposits, true)}

            <!-- Final Balances -->
            <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
                ${row('الرصيد الدفتري الختامي (نظام)', bookBalance, true)}
                
                <div style="font-size: 20px; color: #1565c0; margin: 15px 0;">
                    ${row('الرصيد الفعلي الموجود بالخزينة (جرد فعلي)', actualCash, true)}
                </div>

                <div style="font-size: 24px; margin-top: 20px;">
                    ${row('صافي نتيجة التسوية (عجز / زيادة)', difference, true)}
                </div>
            </div>

            <!-- Signatures -->
            <div style="display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid;">
                <div style="text-align: center; width: 40%;">
                    <p style="font-weight: bold; margin-bottom: 40px;">أمين الصندوق</p>
                    <p>....................</p>
                </div>
                <div style="text-align: center; width: 40%;">
                    <p style="font-weight: bold; margin-bottom: 40px;">المحاسب / المدير المالي</p>
                    <p>....................</p>
                </div>
            </div>

        </div>
    `;

    const printArea = document.getElementById('treasuryPrintArea');
    if (printArea) {
        printArea.innerHTML = printContent;
        window.print();
    }
}

// Export
window.initTreasuryPage = initTreasuryPage;
window.loadTreasuryDataForDate = loadTreasuryDataForDate;
window.handleTreasurySubmit = handleTreasurySubmit;
window.addTableItem = addTableItem;
window.removeTableItem = removeTableItem;
window.updateTableItem = updateTableItem;
window.openDefinitionModal = openDefinitionModal;
window.closeDefinitionModal = closeDefinitionModal;
window.addDefinition = addDefinition;
window.deleteDefinition = deleteDefinition;
window.toggleTreasuryView = toggleTreasuryView;
window.initTreasuryReports = initTreasuryReports;
window.filterTreasuryReports = filterTreasuryReports;
window.exportTreasuryReport = exportTreasuryReport;
window.printTreasuryReconciliation = printTreasuryReconciliation;
