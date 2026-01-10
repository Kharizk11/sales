// POS Reconciliation Page Logic

let allPOS = [];
let allCashiers = [];
let allReconciliations = [];

/**
 * Initialize the Reconciliation Page
 */
async function initRecPage() {
    console.log('Initializing Reconciliation Page');
    showLoading('جاري تحميل البيانات...');

    try {
        allPOS = await getPOS();
        allCashiers = await getCashiers();
        allReconciliations = await getReconciliations();

        renderPOSTable();
        renderCashierTable();
        renderRecTable();
        populateDropdowns();

        // Set default date to today
        const dateInput = document.getElementById('recDate');
        if (dateInput) dateInput.valueAsDate = new Date();

    } catch (error) {
        console.error('Error initializing reconciliation page:', error);
        showToast('error', 'خطأ', 'فشل تحميل بيانات التسوية');
    } finally {
        hideLoading();
    }
}

// --- POS Management ---

function openPOSModal(posId = null) {
    const modal = document.getElementById('posModalOverlay');
    const title = document.getElementById('posModalTitle');
    const form = document.getElementById('posForm');

    form.reset();
    document.getElementById('posId').value = '';

    if (posId) {
        const pos = allPOS.find(p => p.id === posId);
        if (pos) {
            title.textContent = 'تعديل نقطة بيع';
            document.getElementById('posId').value = pos.id;
            document.getElementById('posName').value = pos.name;
        }
    } else {
        title.textContent = 'إضافة نقطة بيع جديدة';
    }

    modal.style.display = 'flex';
}

function closePOSModal() {
    document.getElementById('posModalOverlay').style.display = 'none';
}

async function handlePOSSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('posId').value || Date.now().toString();
    const name = document.getElementById('posName').value;

    const posIndex = allPOS.findIndex(p => p.id === id);
    const posData = { id, name };

    if (posIndex > -1) {
        allPOS[posIndex] = posData;
    } else {
        allPOS.push(posData);
    }

    try {
        await savePOS(allPOS);
        showToast('success', 'تم الحفظ', 'تم حفظ بيانات نقطة البيع بنجاح');
        closePOSModal();
        renderPOSTable();
        populateDropdowns();
    } catch (error) {
        showToast('error', 'خطأ', 'فشل حفظ البيانات');
    }
}

function renderPOSTable() {
    const tbody = document.getElementById('posTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    allPOS.forEach(pos => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pos.name}</td>
            <td>---</td>
            <td>
                <button class="btn-sap btn-transparent" onclick="openPOSModal('${pos.id}')">✏️</button>
                <button class="btn-sap btn-transparent" onclick="deletePOS('${pos.id}')" style="color: var(--sap-error);">🗑️</button>
            </td>
        `;
        tbody.innerHTML += row.outerHTML;
    });
}

async function deletePOS(id) {
    if (!confirm('هل أنت متأكد من حذف نقطة البيع هذه؟')) return;

    allPOS = allPOS.filter(p => p.id !== id);
    try {
        await savePOS(allPOS);
        renderPOSTable();
        populateDropdowns();
        showToast('success', 'تم الحذف', 'تم حذف نقطة البيع');
    } catch (error) {
        showToast('error', 'خطأ', 'فشل الحذف');
    }
}

function openPOSManagement() {
    document.getElementById('posManagementSection').style.display = 'block';
    document.getElementById('cashierManagementSection').style.display = 'none';
    renderPOSTable();
}

function hidePOSManagement() {
    document.getElementById('posManagementSection').style.display = 'none';
}

// --- Cashier Management ---

function openCashierManagement() {
    document.getElementById('cashierManagementSection').style.display = 'block';
    document.getElementById('posManagementSection').style.display = 'none';
    renderCashierTable();
}

function hideCashierManagement() {
    document.getElementById('cashierManagementSection').style.display = 'none';
}

function openCashierModal(cashierId = null) {
    const modal = document.getElementById('cashierModalOverlay');
    const title = document.getElementById('cashierModalTitle');
    const form = document.getElementById('cashierForm');

    form.reset();
    document.getElementById('cashierId').value = '';

    if (cashierId) {
        const cashier = allCashiers.find(c => c.id === cashierId);
        if (cashier) {
            title.textContent = 'تعديل كاشير';
            document.getElementById('cashierId').value = cashier.id;
            document.getElementById('cashierName').value = cashier.name;
            document.getElementById('cashierPhone').value = cashier.phone || '';
            document.getElementById('cashierNotes').value = cashier.notes || '';
        }
    } else {
        title.textContent = 'إضافة كاشير جديد';
    }

    modal.style.display = 'flex';
}

function closeCashierModal() {
    document.getElementById('cashierModalOverlay').style.display = 'none';
}

async function handleCashierSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('cashierId').value || Date.now().toString();
    const name = document.getElementById('cashierName').value;
    const phone = document.getElementById('cashierPhone').value;
    const notes = document.getElementById('cashierNotes').value;

    const cashierIndex = allCashiers.findIndex(c => c.id === id);
    const cashierData = { id, name, phone, notes };

    if (cashierIndex > -1) {
        allCashiers[cashierIndex] = cashierData;
    } else {
        allCashiers.push(cashierData);
    }

    try {
        await saveCashiers(allCashiers);
        showToast('success', 'تم الحفظ', 'تم حفظ بيانات الكاشير بنجاح');
        closeCashierModal();
        renderCashierTable();
        populateDropdowns();
    } catch (error) {
        showToast('error', 'خطأ', 'فشل حفظ البيانات');
    }
}

function renderCashierTable() {
    const tbody = document.getElementById('cashierTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    allCashiers.forEach(cashier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cashier.name}</td>
            <td>${cashier.phone || '---'}</td>
            <td>
                <button class="btn-sap btn-transparent" onclick="openCashierModal('${cashier.id}')">✏️</button>
                <button class="btn-sap btn-transparent" onclick="deleteCashier('${cashier.id}')" style="color: var(--sap-error);">🗑️</button>
            </td>
        `;
        tbody.innerHTML += row.outerHTML;
    });
}

async function deleteCashier(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الكاشير؟')) return;

    allCashiers = allCashiers.filter(c => c.id !== id);
    try {
        await saveCashiers(allCashiers);
        renderCashierTable();
        populateDropdowns();
        showToast('success', 'تم الحذف', 'تم حذف الكاشير');
    } catch (error) {
        showToast('error', 'خطأ', 'فشل الحذف');
    }
}

// --- Reconciliation Form ---

function showReconciliationForm(recId = null) {
    const section = document.getElementById('reconciliationFormSection');
    const title = document.getElementById('recFormTitle');
    const form = document.getElementById('reconciliationForm');

    form.reset();
    document.getElementById('recId').value = '';
    document.getElementById('resTotalSales').textContent = '0.00';
    document.getElementById('resTotalNetwork').textContent = '0.00';
    document.getElementById('resNetSales').textContent = '0.00';
    document.getElementById('resDifference').textContent = '0.00';
    document.getElementById('resDifference').style.color = 'inherit';

    if (recId) {
        const rec = allReconciliations.find(r => r.id === recId);
        if (rec) {
            title.textContent = 'تعديل تسوية';
            document.getElementById('recId').value = rec.id;
            document.getElementById('recDate').value = rec.date;
            document.getElementById('recPos').value = rec.posId;
            document.getElementById('recCashier').value = rec.cashierId || '';
            document.getElementById('recSales').value = rec.sales;
            document.getElementById('recReturns').value = rec.returns;
            document.getElementById('recMada').value = rec.madaSales || 0;
            document.getElementById('recVisa').value = rec.visaSales || 0;
            document.getElementById('recCashHanded').value = rec.cashHandedOver;
            document.getElementById('recNotes').value = rec.notes || '';
            calculateRec();
        }
    } else {
        title.textContent = 'تسوية جديدة';
        document.getElementById('recDate').valueAsDate = new Date();
    }

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
}

function hideReconciliationForm() {
    document.getElementById('reconciliationFormSection').style.display = 'none';
}

function populateDropdowns() {
    const posSelect = document.getElementById('recPos');
    const cashierSelect = document.getElementById('recCashier');

    if (posSelect) {
        const currentPos = posSelect.value;
        posSelect.innerHTML = '<option value="">اختر نقطة البيع...</option>';
        allPOS.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.id;
            option.textContent = pos.name;
            posSelect.appendChild(option);
        });
        posSelect.value = currentPos;
    }

    if (cashierSelect) {
        const currentCashier = cashierSelect.value;
        cashierSelect.innerHTML = '<option value="">اختر الكاشير...</option>';
        allCashiers.forEach(cashier => {
            const option = document.createElement('option');
            option.value = cashier.id;
            option.textContent = cashier.name;
            cashierSelect.appendChild(option);
        });
        cashierSelect.value = currentCashier;
    }
}

function calculateRec() {
    const sales = parseFloat(document.getElementById('recSales').value) || 0;
    const returns = parseFloat(document.getElementById('recReturns').value) || 0;
    const mada = parseFloat(document.getElementById('recMada').value) || 0;
    const visa = parseFloat(document.getElementById('recVisa').value) || 0;
    const cashHanded = parseFloat(document.getElementById('recCashHanded').value) || 0;

    const totalSales = sales - returns;
    const totalNetwork = mada + visa;
    const netSales = totalSales - totalNetwork;
    const difference = cashHanded - netSales;

    document.getElementById('resTotalSales').textContent = formatMoney(totalSales);
    document.getElementById('resTotalNetwork').textContent = formatMoney(totalNetwork);
    document.getElementById('resNetSales').textContent = formatMoney(netSales);
    document.getElementById('resDifference').textContent = formatMoney(difference);

    const diffCard = document.getElementById('diffCard');
    const diffEl = document.getElementById('resDifference');

    if (difference > 0) {
        diffEl.style.color = 'var(--sap-success)';
        if (diffCard) {
            diffCard.style.background = '#e8f5e9';
            diffCard.style.borderColor = '#c8e6c9';
        }
    } else if (difference < 0) {
        diffEl.style.color = 'var(--sap-error)';
        if (diffCard) {
            diffCard.style.background = '#ffebee';
            diffCard.style.borderColor = '#ffcdd2';
        }
    } else {
        diffEl.style.color = 'inherit';
        if (diffCard) {
            diffCard.style.background = '#f8f9fa';
            diffCard.style.borderColor = '#eee';
        }
    }
}

async function handleRecSubmit(event) {
    event.preventDefault();

    const posId = document.getElementById('recPos').value;
    const pos = allPOS.find(p => p.id === posId);

    const cashierId = document.getElementById('recCashier').value;
    const cashier = allCashiers.find(c => c.id === cashierId);

    const id = document.getElementById('recId').value || Date.now().toString();
    const sales = parseFloat(document.getElementById('recSales').value) || 0;
    const returns = parseFloat(document.getElementById('recReturns').value) || 0;
    const mada = parseFloat(document.getElementById('recMada').value) || 0;
    const visa = parseFloat(document.getElementById('recVisa').value) || 0;
    const cashHanded = parseFloat(document.getElementById('recCashHanded').value) || 0;

    const totalSales = sales - returns;
    const totalNetwork = mada + visa;
    const netSales = totalSales - totalNetwork;
    const difference = cashHanded - netSales;

    let type = 'balanced';
    if (difference > 0) type = 'surplus';
    else if (difference < 0) type = 'deficit';

    const recData = {
        id,
        date: document.getElementById('recDate').value,
        posId,
        posName: pos ? pos.name : 'Unknown',
        cashierId,
        cashier: cashier ? cashier.name : 'Unknown',
        sales,
        returns,
        madaSales: mada,
        visaSales: visa,
        networkSales: totalNetwork,
        cashHandedOver: cashHanded,
        totalSales,
        netSales,
        difference,
        type,
        notes: document.getElementById('recNotes').value
    };

    const recIndex = allReconciliations.findIndex(r => r.id === id);
    if (recIndex > -1) {
        allReconciliations[recIndex] = recData;
    } else {
        allReconciliations.push(recData);
    }

    try {
        await saveReconciliations(allReconciliations);
        showToast('success', 'تم الحفظ', 'تم حفظ التسوية بنجاح');
        hideReconciliationForm();
        renderRecTable();
    } catch (error) {
        showToast('error', 'خطأ', 'فشل حفظ التسوية');
    }
}

function renderRecTable() {
    const tbody = document.getElementById('recTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by date descending
    const sorted = [...allReconciliations].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(rec => {
        const row = document.createElement('tr');
        let statusBadge = '';
        let diffColor = 'inherit';

        if (rec.type === 'surplus') {
            statusBadge = `<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">زيادة (${formatMoney(rec.difference)})</span>`;
            diffColor = 'var(--sap-success)';
        } else if (rec.type === 'deficit') {
            statusBadge = `<span style="background: #ffebee; color: #c62828; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">عجز (${formatMoney(rec.difference)})</span>`;
            diffColor = 'var(--sap-error)';
        } else {
            statusBadge = `<span style="background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">مطابق</span>`;
        }

        row.innerHTML = `
            <td>${rec.date}</td>
            <td style="font-weight: 500;">${rec.posName}</td>
            <td>${rec.cashier}</td>
            <td>${formatMoney(rec.madaSales || 0)}</td>
            <td>${formatMoney(rec.visaSales || 0)}</td>
            <td style="font-weight: bold; color: var(--sap-primary);">${formatMoney(rec.netSales)}</td>
            <td>${formatMoney(rec.cashHandedOver)}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-sap btn-transparent" onclick="showReconciliationForm('${rec.id}')" title="تعديل">✏️</button>
                    <button class="btn-sap btn-transparent" onclick="printSingleRec('${rec.id}')" title="طباعة">🖨️</button>
                    <button class="btn-sap btn-transparent" onclick="deleteRec('${rec.id}')" style="color: var(--sap-error);" title="حذف">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteRec(id) {
    if (!confirm('هل أنت متأكد من حذف هذه التسوية؟')) return;

    allReconciliations = allReconciliations.filter(r => r.id !== id);
    try {
        await saveReconciliations(allReconciliations);
        renderRecTable();
        showToast('success', 'تم الحذف', 'تم حذف التسوية');
    } catch (error) {
        showToast('error', 'خطأ', 'فشل الحذف');
    }
}

// --- Printing ---

function printSingleRec(id) {
    const rec = allReconciliations.find(r => r.id === id);
    if (!rec) return;

    const printWindow = window.open('', '_blank');
    const diffLabel = rec.difference > 0 ? 'زيادة' : (rec.difference < 0 ? 'عجز' : 'مطابق');
    const diffColor = rec.difference > 0 ? 'green' : (rec.difference < 0 ? 'red' : 'black');

    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>تسوية صندوق - ${rec.posName}</title>
            <style>
                body { font-family: 'Tajawal', Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #0A6ED1; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: bold; color: #0A6ED1; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .info-item { border-bottom: 1px solid #eee; padding: 10px 0; }
                .label { font-weight: bold; color: #666; }
                .value { float: left; font-weight: bold; }
                .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .calc-table td { padding: 12px; border-bottom: 1px solid #eee; }
                .calc-table .total-row { background: #f8f9fa; font-weight: bold; font-size: 1.1rem; }
                .calc-table .sub-row { color: #666; font-size: 0.9rem; }
                .difference-box { text-align: center; padding: 20px; border: 2px dashed ${diffColor}; border-radius: 8px; margin-top: 20px; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">تقرير تسوية الصندوق اليومية</div>
                <div>${rec.date}</div>
            </div>
            
            <div class="info-grid">
                <div class="info-item"><span class="label">نقطة البيع:</span> <span class="value">${rec.posName}</span></div>
                <div class="info-item"><span class="label">الكاشير:</span> <span class="value">${rec.cashier}</span></div>
            </div>
            
            <table class="calc-table">
                <tr><td>المبيعات (النظام)</td><td class="value">${formatMoney(rec.sales)}</td></tr>
                <tr><td>مرتجع المبيعات</td><td class="value">(${formatMoney(rec.returns)})</td></tr>
                <tr class="total-row"><td>إجمالي المبيعات</td><td class="value">${formatMoney(rec.totalSales)}</td></tr>
                <tr class="sub-row"><td>- مبيعات مدى</td><td class="value">${formatMoney(rec.madaSales || 0)}</td></tr>
                <tr class="sub-row"><td>- مبيعات فيزا</td><td class="value">${formatMoney(rec.visaSales || 0)}</td></tr>
                <tr class="total-row"><td>إجمالي الشبكة</td><td class="value">(${formatMoney(rec.networkSales)})</td></tr>
                <tr class="total-row"><td>صافي المبيعات (النقدية المتوقعة)</td><td class="value">${formatMoney(rec.netSales)}</td></tr>
                <tr><td>النقدية المسلمة من الكاشير</td><td class="value">${formatMoney(rec.cashHandedOver)}</td></tr>
            </table>
            
            <div class="difference-box">
                <div style="font-size: 1.2rem; margin-bottom: 5px;">النتيجة النهائية: <span style="color: ${diffColor}">${diffLabel}</span></div>
                <div style="font-size: 2rem; font-weight: bold; color: ${diffColor}">${formatMoney(Math.abs(rec.difference))} ريال</div>
            </div>
            
            <div style="margin-top: 30px;">
                <span class="label">ملاحظات:</span>
                <p>${rec.notes || 'لا يوجد'}</p>
            </div>
            
            <div class="footer">
                <div class="signature">توقيع الكاشير</div>
                <div class="signature">توقيع المحاسب</div>
            </div>
            
            <div class="no-print" style="margin-top: 40px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #0A6ED1; color: white; border: none; border-radius: 4px; cursor: pointer;">طباعة التقرير</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Export functions to window
window.initRecPage = initRecPage;
window.openPOSModal = openPOSModal;
window.closePOSModal = closePOSModal;
window.handlePOSSubmit = handlePOSSubmit;
window.deletePOS = deletePOS;
window.openPOSManagement = openPOSManagement;
window.hidePOSManagement = hidePOSManagement;
window.openCashierManagement = openCashierManagement;
window.hideCashierManagement = hideCashierManagement;
window.openCashierModal = openCashierModal;
window.closeCashierModal = closeCashierModal;
window.handleCashierSubmit = handleCashierSubmit;
window.deleteCashier = deleteCashier;
window.showReconciliationForm = showReconciliationForm;
window.hideReconciliationForm = hideReconciliationForm;
window.calculateRec = calculateRec;
window.handleRecSubmit = handleRecSubmit;
window.printSingleRec = printSingleRec;
window.deleteRec = deleteRec;
