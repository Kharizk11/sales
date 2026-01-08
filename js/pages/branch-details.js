// Branch Details Page JavaScript

let currentBranchName = null;
let currentBranchData = null;
let branchDailyChartInstance = null;
let branchMonthlyChartInstance = null;

/**
 * Load branch details from URL parameter
 */
async function loadBranchDetails() {
  try {
    // Get branch name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const branchName = urlParams.get('branch');
    
    if (!branchName) {
      showToast('error', 'خطأ', 'لم يتم تحديد الفرع');
      setTimeout(() => {
        navigateTo('/branches');
      }, 2000);
      return;
    }
    
    currentBranchName = decodeURIComponent(branchName);
    
    // Get filters
    const fromDate = document.getElementById('branchFromDate')?.value;
    const toDate = document.getElementById('branchToDate')?.value;
    
    // Load data
    const sales = await getSales();
    const branches = await getBranches();
    
    // Filter sales by branch
    let branchSales = sales.filter(s => s.branch === currentBranchName);
    
    // Apply date filters
    if (fromDate) {
      branchSales = branchSales.filter(s => s.date >= fromDate);
    }
    if (toDate) {
      branchSales = branchSales.filter(s => s.date <= toDate);
    }
    
    // Get branch info
    const branch = branches.find(b => b.name === currentBranchName);
    
    // Calculate statistics
    const total = branchSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const count = branchSales.length;
    const dates = [...new Set(branchSales.map(s => s.date))].sort((a, b) => b.localeCompare(a));
    const avg = dates.length > 0 ? total / dates.length : 0;
    
    // Calculate best day
    const dailyTotals = {};
    branchSales.forEach(s => {
      dailyTotals[s.date] = (dailyTotals[s.date] || 0) + Number(s.amount || 0);
    });
    const bestDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
    const bestDayDate = bestDay ? bestDay[0] : null;
    const bestDayTotal = bestDay ? bestDay[1] : 0;
    
    // Get last day
    const lastDay = dates.length > 0 ? dates[0] : null;
    
    // Get date range
    const firstDate = dates.length > 0 ? dates[dates.length - 1] : null;
    const lastDate = dates.length > 0 ? dates[0] : null;
    
    // Store data
    currentBranchData = {
      branch,
      sales: branchSales,
      total,
      count,
      avg,
      days: dates.length,
      fromDate: fromDate || firstDate,
      toDate: toDate || lastDate,
      bestDayDate,
      bestDayTotal,
      lastDay,
      dailyTotals
    };
    
    // Update UI
    updateBranchInfoUI();
    updateBranchSalesTable();
    updateBranchDailyChart();
    updateBranchMonthlyChart();
    
  } catch (error) {
    console.error('Error loading branch details:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الفرع');
  }
}

/**
 * Update branch info UI
 */
function updateBranchInfoUI() {
  if (!currentBranchData) return;
  
  const data = currentBranchData;
  
  // Update title
  const title = document.getElementById('branchNameTitle');
  if (title) title.textContent = `🏢 ${currentBranchName}`;
  
  const nameDisplay = document.getElementById('branchNameDisplay');
  if (nameDisplay) nameDisplay.textContent = currentBranchName;
  
  const descEl = document.getElementById('branchDescription');
  if (descEl) descEl.textContent = data.branch?.description || 'لا يوجد وصف';
  
  // Update stats with dates
  const totalEl = document.getElementById('branchTotal');
  const countEl = document.getElementById('branchCount');
  const avgEl = document.getElementById('branchAverage');
  const daysEl = document.getElementById('branchDays');
  const bestDayEl = document.getElementById('branchBestDay');
  const lastDayEl = document.getElementById('branchLastDay');
  
  if (totalEl) {
    totalEl.textContent = formatMoney(data.total);
    totalEl.setAttribute('data-value', data.total.toString());
  }
  
  const totalDateEl = document.getElementById('branchTotalDate');
  if (totalDateEl && data.fromDate && data.toDate) {
    if (data.fromDate === data.toDate) {
      totalDateEl.textContent = `📅 ${formatDateForDisplay(data.fromDate)}`;
    } else {
      totalDateEl.textContent = `📅 من ${formatDateForDisplay(data.fromDate)} إلى ${formatDateForDisplay(data.toDate)}`;
    }
  }
  
  if (countEl) {
    countEl.textContent = data.count;
    countEl.setAttribute('data-value', data.count.toString());
  }
  
  if (avgEl) {
    avgEl.textContent = formatMoney(data.avg);
    avgEl.setAttribute('data-value', data.avg.toString());
  }
  
  const avgDateEl = document.getElementById('branchAvgDate');
  if (avgDateEl && data.fromDate && data.toDate) {
    if (data.fromDate === data.toDate) {
      avgDateEl.textContent = `📅 ${formatDateForDisplay(data.fromDate)}`;
    } else {
      avgDateEl.textContent = `📅 من ${formatDateForDisplay(data.fromDate)} إلى ${formatDateForDisplay(data.toDate)}`;
    }
  }
  
  if (daysEl) {
    daysEl.textContent = data.days;
    daysEl.setAttribute('data-value', data.days.toString());
  }
  
  if (bestDayEl && data.bestDayTotal > 0) {
    bestDayEl.textContent = formatMoney(data.bestDayTotal);
    bestDayEl.setAttribute('data-value', data.bestDayTotal.toString());
  }
  
  const bestDayDateEl = document.getElementById('branchBestDayDate');
  if (bestDayDateEl && data.bestDayDate) {
    bestDayDateEl.textContent = `📅 ${formatDateForDisplay(data.bestDayDate)}`;
  }
  
  if (lastDayEl && data.lastDay) {
    lastDayEl.textContent = formatDateForDisplay(data.lastDay);
  }
  
  const lastDayDateEl = document.getElementById('branchLastDayDate');
  if (lastDayDateEl && data.lastDay) {
    lastDayDateEl.textContent = `📅 آخر يوم مسجل`;
  }
}

/**
 * Update branch sales table
 */
function updateBranchSalesTable() {
  if (!currentBranchData) return;
  
  const tbody = document.getElementById('branchSalesBody');
  if (!tbody) return;
  
  const sales = currentBranchData.sales;
  
  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">لا توجد مبيعات</div>
            <div class="empty-state-text">لا توجد سجلات مبيعات لهذا الفرع في الفترة المحددة</div>
          </div>
        </td>
      </tr>
    `;
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
  
  // Render monthly table
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  tbody.innerHTML = monthlyArray.map((monthData, index) => {
    const monthName = monthNames[monthData.month - 1];
    const monthLabel = `${monthName} ${monthData.year}`;
    
    return `
      <tr class="month-row" style="cursor: pointer;" onclick="showBranchMonthlyDetails('${monthData.key}', ${index})">
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
  window.branchMonthlySalesData = {};
  monthlyArray.forEach(monthData => {
    window.branchMonthlySalesData[monthData.key] = monthData;
  });
}

/**
 * Show branch monthly details
 */
function showBranchMonthlyDetails(monthKey, index) {
  if (!window.branchMonthlySalesData || !window.branchMonthlySalesData[monthKey]) return;
  
  const monthData = window.branchMonthlySalesData[monthKey];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthName = monthNames[monthData.month - 1];
  const monthLabel = `${monthName} ${monthData.year}`;
  
  // Update title
  document.getElementById('branchMonthlyDetailsTitle').textContent = `📋 تفاصيل ${monthLabel}`;
  
  // Sort sales by date descending
  const sortedSales = monthData.sales.sort((a, b) => b.date.localeCompare(a.date));
  
  // Render details
  const tbody = document.getElementById('branchMonthlyDetailsBody');
  tbody.innerHTML = sortedSales.map((sale, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${formatDateForDisplay(sale.date)}</strong></td>
      <td>${sale.description || '—'}</td>
      <td style="color: var(--text-muted); font-size: 0.9em;">${sale.notes || '—'}</td>
      <td><strong style="color: var(--primary);">${formatMoney(sale.amount)}</strong></td>
    </tr>
  `).join('');
  
  // Show container
  document.getElementById('branchMonthlyDetailsContainer').style.display = 'block';
  
  // Scroll to details
  document.getElementById('branchMonthlyDetailsContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Close branch monthly details
 */
function closeBranchMonthlyDetails() {
  document.getElementById('branchMonthlyDetailsContainer').style.display = 'none';
}

/**
 * Update branch daily chart
 */
function updateBranchDailyChart() {
  if (!currentBranchData) return;
  
  const canvas = document.getElementById('branchDailyChart');
  if (!canvas) return;
  
  const sales = currentBranchData.sales;
  
  // Get last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDate(d);
  }).reverse();
  
  const dailyTotals = {};
  sales.forEach(sale => {
    if (last30Days.includes(sale.date)) {
      dailyTotals[sale.date] = (dailyTotals[sale.date] || 0) + Number(sale.amount || 0);
    }
  });
  
  const data = last30Days.map(day => dailyTotals[day] || 0);
  const labels = last30Days.map(day => formatDateForDisplay(day));
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'المبيعات اليومية',
      data: data,
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(1, 126, 132, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'var(--primary)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'var(--primary)',
    }]
  };
  
  const config = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${formatMoney(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatMoney(value);
            }
          }
        }
      }
    }
  };
  
  if (branchDailyChartInstance) {
    branchDailyChartInstance.destroy();
  }
  branchDailyChartInstance = new Chart(canvas, config);
}

/**
 * Update branch monthly chart
 */
function updateBranchMonthlyChart() {
  if (!currentBranchData) return;
  
  const canvas = document.getElementById('branchMonthlyChart');
  if (!canvas) return;
  
  const sales = currentBranchData.sales;
  
  // Get last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      year: d.getFullYear(),
      month: d.getMonth()
    };
  }).reverse();
  
  const monthlyTotals = {};
  last6Months.forEach(({ year, month }) => {
    const monthStart = formatDate(new Date(year, month, 1));
    const monthEnd = formatDate(new Date(year, month + 1, 0));
    const monthSales = sales.filter(s => s.date >= monthStart && s.date <= monthEnd);
    monthlyTotals[`${year}-${month + 1}`] = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  });
  
  const labels = last6Months.map(({ year, month }) => {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${monthNames[month]} ${year}`;
  });
  
  const data = last6Months.map(({ year, month }) => monthlyTotals[`${year}-${month + 1}`] || 0);
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'المبيعات الشهرية',
      data: data,
      backgroundColor: 'rgba(1, 126, 132, 0.6)',
      borderColor: 'var(--primary)',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };
  
  const config = {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${formatMoney(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatMoney(value);
            }
          }
        }
      }
    }
  };
  
  if (branchMonthlyChartInstance) {
    branchMonthlyChartInstance.destroy();
  }
  branchMonthlyChartInstance = new Chart(canvas, config);
}

/**
 * Format date for display
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Copy stat value to clipboard
 */
async function copyStatValue(element) {
  const value = element.getAttribute('data-value') || element.textContent.trim();
  if (!value || value === '—') return;
  
  // Remove formatting (commas) for copying
  const cleanValue = value.replace(/,/g, '');
  
  const success = await copyToClipboard(cleanValue);
  if (success) {
    // Visual feedback
    const originalText = element.textContent;
    element.textContent = 'تم النسخ! ✓';
    element.style.color = 'var(--success)';
    
    setTimeout(() => {
      element.textContent = originalText;
      element.style.color = '';
    }, 1500);
    
    showToast('success', 'نجح', 'تم نسخ الرقم: ' + value);
  } else {
    showToast('error', 'خطأ', 'فشل نسخ الرقم');
  }
}

/**
 * Export branch report to Excel
 */
async function exportBranchReport() {
  if (!currentBranchData || !currentBranchData.sales.length) {
    showToast('warning', 'تحذير', 'لا توجد بيانات للتصدير');
    return;
  }
  
  try {
    const sales = currentBranchData.sales;
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Sales data sheet
    const salesData = sales.map(s => ({
      'التاريخ': s.date,
      'الوصف': s.description || '',
      'ملاحظات': s.notes || '',
      'المبلغ': s.amount
    }));
    const ws = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, ws, 'المبيعات');
    
    // Write file
    const fileName = `branch_${currentBranchName}_${await getTodayDate()}.xlsx`.replace(/[^a-z0-9_\-.]/gi, '_');
    XLSX.writeFile(wb, fileName);
    
    showToast('success', 'نجح', 'تم تصدير التقرير بنجاح');
  } catch (error) {
    console.error('Error exporting branch report:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تصدير التقرير');
  }
}

/**
 * Filter branch data
 */
function filterBranchData() {
  loadBranchDetails();
}

/**
 * Clear branch filters
 */
function clearBranchFilters() {
  const fromDate = document.getElementById('branchFromDate');
  const toDate = document.getElementById('branchToDate');
  
  if (fromDate) fromDate.value = '';
  if (toDate) toDate.value = '';
  
  loadBranchDetails();
}

// Initialize page when loaded
window.addEventListener('pageLoaded', async function(e) {
  if (e.detail.page === 'branch-details') {
    await loadBranchDetails();
  }
});

// Listen for sales updates
window.addEventListener('salesUpdated', function() {
  if (window.location.pathname === '/branch-details') {
    loadBranchDetails();
  }
});

// Export for global access
window.loadBranchDetails = loadBranchDetails;
window.exportBranchReport = exportBranchReport;
window.filterBranchData = filterBranchData;
window.clearBranchFilters = clearBranchFilters;
window.copyStatValue = copyStatValue;
window.showBranchMonthlyDetails = showBranchMonthlyDetails;
window.closeBranchMonthlyDetails = closeBranchMonthlyDetails;
