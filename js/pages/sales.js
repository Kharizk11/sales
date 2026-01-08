// Sales Page JavaScript

let currentFilters = {
  fromDate: '',
  toDate: '',
  branch: '',
  search: ''
};

let salesTableVisible = false;

/**
 * Load branches into select elements
 */
async function loadBranchesIntoSelect(selectId, includeAll = false) {
  try {
    const branches = await getBranches();
    const select = document.getElementById(selectId);
    if (!select) return;

    // Clear existing options except first one
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption || includeAll) {
      select.innerHTML = '<option value="">الكل</option>';
    }

    // Add branch options
    branches.forEach(branch => {
      const option = document.createElement('option');
      option.value = branch.name;
      option.textContent = branch.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading branches into select:', error);
  }
}

/**
 * Toggle sales table visibility
 */
function toggleSalesTable() {
  const card = document.getElementById('salesTableCard');
  const btn = document.getElementById('toggleSalesBtn');
  const exportBtn = document.getElementById('exportBtn');

  if (!card) return;

  salesTableVisible = !salesTableVisible;

  if (salesTableVisible) {
    card.style.display = 'block';
    btn.textContent = '🙈 إخفاء المبيعات';
    exportBtn.style.display = 'inline-flex';
    // Load table if not already loaded
    loadSalesTable();
  } else {
    card.style.display = 'none';
    btn.textContent = '📋 عرض المبيعات المسجلة';
    exportBtn.style.display = 'none';
  }
}

/**
 * Load sales table
 */
async function loadSalesTable() {
  try {
    let sales = await getSales();
    const originalCount = sales.length;

    // Apply filters
    if (currentFilters.fromDate) {
      sales = sales.filter(s => s.date >= currentFilters.fromDate);
    }
    if (currentFilters.toDate) {
      sales = sales.filter(s => s.date <= currentFilters.toDate);
    }
    if (currentFilters.branch) {
      sales = sales.filter(s => s.branch === currentFilters.branch);
    }

    // Apply search filter
    if (currentFilters.search && currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.trim().toLowerCase();
      sales = sales.filter(s => {
        const date = (s.date || '').toLowerCase();
        const branch = (s.branch || '').toLowerCase();
        const description = (s.description || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        const amount = String(s.amount || '').toLowerCase();

        return date.includes(searchTerm) ||
          branch.includes(searchTerm) ||
          description.includes(searchTerm) ||
          notes.includes(searchTerm) ||
          amount.includes(searchTerm);
      });
    }

    // Sort by date descending
    sales.sort((a, b) => b.date.localeCompare(a.date));

    // Update results info
    updateResultsInfo(originalCount, sales.length);

    const tbody = document.getElementById('salesBody');
    if (!tbody) return;

    if (sales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">💰</div>
              <div class="empty-state-title">لا توجد سجلات مبيعات</div>
              <div class="empty-state-text">ابدأ بتسجيل أول عملية مبيعات</div>
            </div>
          </td>
        </tr>
      `;
      document.getElementById('salesTotal').textContent = '0.00';
      return;
    }

    // Group sales by month
    const monthlyData = {};
    sales.forEach(sale => {
      const [year, month] = sale.date.split('-');
      const monthKey = `${year}-${month}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          year: parseInt(year),
          month: parseInt(month),
          sales: [],
          total: 0,
          days: new Set()
        };
      }
      monthlyData[monthKey].sales.push(sale);
      monthlyData[monthKey].total += Number(sale.amount || 0);
      monthlyData[monthKey].days.add(sale.date);
    });

    // Convert to array and sort by date descending
    const monthlyArray = Object.entries(monthlyData)
      .map(([key, data]) => ({
        key,
        ...data,
        count: data.sales.length,
        daysCount: data.days.size,
        avgDaily: data.days.size > 0 ? data.total / data.days.size : 0
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    // Calculate total
    const total = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    document.getElementById('salesTotal').textContent = formatMoney(total);

    if (monthlyArray.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-state-icon">💰</div>
              <div class="empty-state-title">لا توجد سجلات مبيعات</div>
              <div class="empty-state-text">ابدأ بتسجيل أول عملية مبيعات</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Render monthly table
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    tbody.innerHTML = monthlyArray.map((monthData, index) => {
      const monthName = monthNames[monthData.month - 1];
      const monthLabel = `${monthName} ${monthData.year}`;

      return `
        <tr class="month-row" style="cursor: pointer;" onclick="showMonthlyDetails('${monthData.key}', ${index})">
          <td style="text-align: center;">
            <span style="font-size: 1.2em;">▶</span>
          </td>
          <td><strong>${monthLabel}</strong></td>
          <td>${monthData.count}</td>
          <td>${monthData.daysCount}</td>
          <td><strong style="color: var(--primary);">${formatMoney(monthData.total)}</strong></td>
          <td>${formatMoney(monthData.avgDaily)}</td>
        </tr>
      `;
    }).join('');

    // Store monthly data globally for details view
    window.monthlySalesData = {};
    monthlyArray.forEach(monthData => {
      window.monthlySalesData[monthData.key] = monthData;
    });

  } catch (error) {
    console.error('Error loading sales table:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل سجلات المبيعات');
  }
}

/**
 * Handle sales form submit
 */
/**
 * Handle sales form submit
 */
async function handleSalesSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('saleId').value;
  const date = document.getElementById('saleDate').value;
  const branch = document.getElementById('saleBranch').value;
  const amount = document.getElementById('saleAmount').value;
  const description = document.getElementById('saleDescription').value.trim();
  const notes = document.getElementById('saleNotes').value.trim();

  if (!date || !branch || !amount) {
    showToast('warning', 'تحذير', 'يرجى ملء جميع الحقول المطلوبة');
    return;
  }

  try {
    const sales = await getSales();

    if (id) {
      // Update existing sale
      const index = sales.findIndex(s => s.id === id);
      if (index !== -1) {
        // Check if another sale exists for the same branch and date (excluding current sale)
        const duplicateExists = sales.some(s =>
          s.id !== id &&
          s.date === date &&
          s.branch === branch
        );

        if (duplicateExists) {
          showToast('error', 'خطأ', `⚠️ يوجد سجل مبيعات آخر للفرع "${branch}" في تاريخ ${date}. لا يمكن تسجيل مبيعات لنفس الفرع في نفس اليوم أكثر من مرة.`);
          return;
        }

        sales[index] = {
          ...sales[index],
          date,
          branch,
          amount: Number(amount),
          description,
          notes
        };
        await saveSales(sales);
        showToast('success', 'نجح', 'تم تحديث السجل بنجاح');
        cancelEdit(); // Reset form
      } else {
        showToast('error', 'خطأ', 'السجل غير موجود');
      }
    } else {
      // Create new sale - Check for duplicate first
      const duplicateExists = sales.some(s =>
        s.date === date &&
        s.branch === branch
      );

      if (duplicateExists) {
        showToast('error', 'خطأ', `⚠️ تم تسجيل مبيعات الفرع "${branch}" لتاريخ ${date} مسبقاً. لا يمكن تسجيل المبيعات لنفس الفرع في نفس اليوم أكثر من مرة واحدة. يمكنك تعديل السجل الموجود بدلاً من ذلك.`);
        return;
      }

      const newSale = {
        id: generateId(),
        date: date,
        branch: branch,
        amount: Number(amount),
        description: description,
        notes: notes
      };

      sales.push(newSale);
      await saveSales(sales);
      showToast('success', 'نجح', 'تم حفظ السجل بنجاح');
      event.target.reset();
      setDefaultDate('saleDate');
    }

    await loadSalesTable();

  } catch (error) {
    console.error('Error saving sale:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حفظ السجل');
  }
}

/**
 * Edit sale
 */
async function editSale(id) {
  try {
    const sales = await getSales();
    const sale = sales.find(s => s.id === id);

    if (!sale) {
      showToast('error', 'خطأ', 'السجل غير موجود');
      return;
    }

    // Populate form
    document.getElementById('saleId').value = sale.id;
    document.getElementById('saleDate').value = sale.date;
    document.getElementById('saleBranch').value = sale.branch;
    document.getElementById('saleAmount').value = sale.amount;
    document.getElementById('saleDescription').value = sale.description || '';
    document.getElementById('saleNotes').value = sale.notes || '';

    // Update UI
    document.getElementById('submitBtn').innerHTML = '💾 تحديث السجل';
    document.getElementById('submitBtn').classList.remove('btn-success');
    document.getElementById('submitBtn').classList.add('btn-primary');
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    document.getElementById('resetBtn').style.display = 'none';

    // Scroll to form
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error editing sale:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات السجل');
  }
}

/**
 * Cancel edit
 */
function cancelEdit() {
  document.getElementById('salesForm').reset();
  document.getElementById('saleId').value = '';
  setDefaultDate('saleDate');

  document.getElementById('submitBtn').innerHTML = '💾 حفظ السجل';
  document.getElementById('submitBtn').classList.remove('btn-primary');
  document.getElementById('submitBtn').classList.add('btn-success');
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'inline-flex';
}

/**
 * Delete sale
 */
async function deleteSale(id) {
  if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) {
    return;
  }

  try {
    const sales = await getSales();
    const updatedSales = sales.filter(s => s.id !== id);
    await saveSales(updatedSales);

    showToast('success', 'نجح', 'تم حذف السجل بنجاح');
    await loadSalesTable();
  } catch (error) {
    console.error('Error deleting sale:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حذف السجل');
  }
}

/**
 * Update results info
 */
function updateResultsInfo(total, filtered) {
  const infoEl = document.getElementById('resultsInfo');
  if (!infoEl) return;

  if (filtered === total) {
    infoEl.innerHTML = `<div class="info-badge">📊 إجمالي السجلات: <strong>${total}</strong></div>`;
  } else {
    infoEl.innerHTML = `<div class="info-badge">📊 عرض <strong>${filtered}</strong> من <strong>${total}</strong> سجل</div>`;
  }
}

/**
 * Apply sales filters
 */
function applySalesFilters() {
  currentFilters.fromDate = document.getElementById('filterFromDate').value;
  currentFilters.toDate = document.getElementById('filterToDate').value;
  currentFilters.branch = document.getElementById('filterBranchSales').value;
  currentFilters.search = document.getElementById('searchSales').value;
  loadSalesTable();
}

/**
 * Clear sales filters
 */
function clearSalesFilters() {
  document.getElementById('filterFromDate').value = '';
  document.getElementById('filterToDate').value = '';
  document.getElementById('filterBranchSales').value = '';
  document.getElementById('searchSales').value = '';
  currentFilters = { fromDate: '', toDate: '', branch: '', search: '' };
  loadSalesTable();
}

/**
 * Export sales to CSV
 */
async function exportSales() {
  try {
    let sales = await getSales();

    // Apply current filters
    if (currentFilters.fromDate) {
      sales = sales.filter(s => s.date >= currentFilters.fromDate);
    }
    if (currentFilters.toDate) {
      sales = sales.filter(s => s.date <= currentFilters.toDate);
    }
    if (currentFilters.branch) {
      sales = sales.filter(s => s.branch === currentFilters.branch);
    }

    if (sales.length === 0) {
      showToast('warning', 'تحذير', 'لا توجد بيانات للتصدير');
      return;
    }

    // Create CSV content
    const headers = ['التاريخ', 'الفرع', 'الوصف', 'ملاحظات', 'المبلغ'];
    const rows = sales.map(s => [
      s.date,
      s.branch,
      s.description || '',
      s.notes || '',
      s.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_${await getTodayDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'نجح', 'تم تصدير البيانات بنجاح');
  } catch (error) {
    console.error('Error exporting sales:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تصدير البيانات');
  }
}

// Initialize page when loaded
window.addEventListener('pageLoaded', async function (e) {
  if (e.detail.page === 'sales') {
    setDefaultDate('saleDate');
    setDefaultDate('filterFromDate');
    setDefaultDate('filterToDate');
    await loadBranchesIntoSelect('saleBranch');
    await loadBranchesIntoSelect('filterBranchSales', true);
    // Don't load table automatically - user must click button
    salesTableVisible = false;
  }
});

// Listen for sales updates
window.addEventListener('salesUpdated', function () {
  if (window.location.pathname === '/sales') {
    loadSalesTable();
  }
});

/**
 * Show monthly details
 */
function showMonthlyDetails(monthKey, index) {
  if (!window.monthlySalesData || !window.monthlySalesData[monthKey]) return;

  const monthData = window.monthlySalesData[monthKey];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthName = monthNames[monthData.month - 1];
  const monthLabel = `${monthName} ${monthData.year}`;

  // Update title
  document.getElementById('monthlyDetailsTitle').textContent = `📋 تفاصيل ${monthLabel}`;

  // Sort sales by date descending
  const sortedSales = monthData.sales.sort((a, b) => b.date.localeCompare(a.date));

  // Render details
  const tbody = document.getElementById('monthlyDetailsBody');
  tbody.innerHTML = sortedSales.map((sale, idx) => {
    let date = sale.date;
    let branch = sale.branch;
    let description = sale.description || '—';
    let notes = sale.notes || '—';

    if (currentFilters.search && currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.trim();
      const highlight = (text) => {
        if (!text || text === '—') return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
      };
      date = highlight(date);
      branch = highlight(branch);
      description = highlight(description);
      notes = highlight(notes);
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${date}</td>
        <td>${branch}</td>
        <td>${description}</td>
        <td>${notes}</td>
        <td><strong>${formatMoney(sale.amount)}</strong></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editSale('${sale.id}')" style="margin-left: 5px;">
            ✏️ تعديل
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteSale('${sale.id}')">
            🗑️ حذف
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Show container
  document.getElementById('monthlyDetailsContainer').style.display = 'block';

  // Scroll to details
  document.getElementById('monthlyDetailsContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Close monthly details
 */
function closeMonthlyDetails() {
  document.getElementById('monthlyDetailsContainer').style.display = 'none';
}


/**
 * Open Daily Report Modal
 */
function openDailyReportModal() {
  const modal = document.getElementById('dailyReportModal');
  const dateInput = document.getElementById('reportDate');

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Reset result view
  document.getElementById('dailyReportResult').style.display = 'none';

  modal.style.display = 'flex';
}

/**
 * Close Daily Report Modal
 */
function closeDailyReportModal() {
  document.getElementById('dailyReportModal').style.display = 'none';
}

/**
 * Generate Daily Report
 */
async function generateDailyReport() {
  const dateStr = document.getElementById('reportDate').value;
  if (!dateStr) {
    showToast('warning', 'تنبيه', 'يرجى اختيار التاريخ');
    return;
  }

  try {
    const sales = await getSales();
    const selectedDate = new Date(dateStr);
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth() + 1; // 1-12
    const selectedDay = selectedDate.getDate();

    // 1. Daily Total
    const dailySales = sales.filter(s => s.date === dateStr);
    const dailyTotal = dailySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // 2. Monthly Average (Current Month Total / Days in Month)
    const daysInMonth = selectedDay; // عدد الأيام حتى التاريخ المحدد
    const monthlyAverage = daysInMonth > 0 ? monthTotal / daysInMonth : 0;

    // 3. Month Total (Selected Month)
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const monthSales = sales.filter(s => s.date.startsWith(monthPrefix));
    const monthTotal = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // 4. Comparison with Previous Month (Same Period)
    // Current Period: 1st of Month to Selected Date
    const currentPeriodSales = monthSales.filter(s => {
      const day = parseInt(s.date.split('-')[2]);
      return day <= selectedDay;
    });
    const currentPeriodTotal = currentPeriodSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Previous Period: 1st of Prev Month to Same Day in Prev Month
    // Calculate Previous Month Year and Month
    let prevMonthYear = selectedYear;
    let prevMonth = selectedMonth - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear -= 1;
    }
    const prevMonthPrefix = `${prevMonthYear}-${String(prevMonth).padStart(2, '0')}`;

    // Get sales for previous month up to the same day
    // Note: If selected day is 31 and prev month has 30, we take up to 30.
    const prevMonthSales = sales.filter(s => {
      if (!s.date.startsWith(prevMonthPrefix)) return false;
      const day = parseInt(s.date.split('-')[2]);
      return day <= selectedDay;
    });
    const prevPeriodTotal = prevMonthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Determine Trend
    let trendIcon = '➖';
    let trendColor = 'gray';
    let diffPercent = 0;

    if (prevPeriodTotal > 0) {
      const diff = currentPeriodTotal - prevPeriodTotal;
      diffPercent = (diff / prevPeriodTotal) * 100;

      if (diff > 0) {
        trendIcon = '⬆️'; // Ascending
        trendColor = 'green';
      } else if (diff < 0) {
        trendIcon = '⬇️'; // Descending
        trendColor = 'red';
      }
    } else if (currentPeriodTotal > 0) {
      trendIcon = '⬆️'; // Ascending (from 0)
      trendColor = 'green';
      diffPercent = 100;
    }

    // Update UI
    document.getElementById('reportDailyTotal').textContent = formatMoney(dailyTotal);
    document.getElementById('reportMonthlyAverage').textContent = formatMoney(monthlyAverage);
    document.getElementById('reportMonthTotal').textContent = formatMoney(monthTotal);

    const comparisonEl = document.getElementById('reportComparison');
    comparisonEl.innerHTML = `
      <span style="color: ${trendColor}; font-size: 1.2em;">${trendIcon}</span>
      <span>${formatMoney(currentPeriodTotal)}</span>
      <span style="font-size: 0.8em; color: #666;">(السابق: ${formatMoney(prevPeriodTotal)})</span>
      <span style="font-size: 0.8em; color: ${trendColor}; direction: ltr;">${diffPercent.toFixed(1)}%</span>
    `;

    // Show results
    document.getElementById('dailyReportResult').style.display = 'block';

  } catch (error) {
    console.error('Error generating report:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء توليد التقرير');
  }
}

// Export for global access
window.loadBranchesIntoSelect = loadBranchesIntoSelect;
window.loadSalesTable = loadSalesTable;
window.toggleSalesTable = toggleSalesTable;
window.handleSalesSubmit = handleSalesSubmit;
window.deleteSale = deleteSale;
window.applySalesFilters = applySalesFilters;
window.clearSalesFilters = clearSalesFilters;
window.exportSales = exportSales;
window.showMonthlyDetails = showMonthlyDetails;
window.closeMonthlyDetails = closeMonthlyDetails;
window.editSale = editSale;
window.cancelEdit = cancelEdit;
window.openDailyReportModal = openDailyReportModal;
window.closeDailyReportModal = closeDailyReportModal;
window.generateDailyReport = generateDailyReport;
