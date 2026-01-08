// Home Page JavaScript - Dashboard with Charts - SAP Fiori Style

let dailyChart = null;
let branchesChart = null;
let monthlyChart = null;

// Update date and time display
function updateDateTime() {
  const now = new Date();
  const dateEl = document.getElementById('currentDate');
  const timeEl = document.getElementById('currentTime');
  const footerDateEl = document.getElementById('footerDate');
  const footerTimeEl = document.getElementById('footerTime');

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  const dateString = now.toLocaleDateString('ar-SA', dateOptions);
  const timeString = now.toLocaleTimeString('ar-SA', timeOptions);

  if (dateEl) dateEl.textContent = dateString;
  if (timeEl) timeEl.textContent = timeString;
  if (footerDateEl) footerDateEl.textContent = dateString;
  if (footerTimeEl) footerTimeEl.textContent = timeString;
}

// Start clock
setInterval(updateDateTime, 1000);
updateDateTime();

/**
 * Update dashboard with latest data and charts
 */
async function updateDashboard() {
  try {
    const sales = await getSales();
    const branches = await getBranches();

    // Deduplicate branches by name
    const seenBranchNames = new Set();
    const uniqueBranches = [];
    branches.forEach(branch => {
      if (!seenBranchNames.has(branch.name)) {
        seenBranchNames.add(branch.name);
        uniqueBranches.push(branch);
      }
    });

    // Get last recorded date (today = last date with sales)
    const today = await getTodayDate();
    const todaySales = sales.filter(s => s.date === today);
    const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Calculate previous day's sales for comparison
    const uniqueDates = [...new Set(sales.map(s => s.date))].sort((a, b) => b.localeCompare(a));
    const yesterdayDate = uniqueDates.length > 1 ? uniqueDates[1] : null;
    const yesterdaySales = yesterdayDate ? sales.filter(s => s.date === yesterdayDate) : [];
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Calculate monthly sales
    const todayDateObj = new Date(today);
    const monthStart = formatDate(new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 1));
    const monthSales = sales.filter(s => s.date >= monthStart && s.date <= today);
    const monthTotal = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Calculate last month for comparison
    const lastMonthStart = formatDate(new Date(todayDateObj.getFullYear(), todayDateObj.getMonth() - 1, 1));
    const lastMonthEnd = formatDate(new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 0));
    const lastMonthSales = sales.filter(s => s.date >= lastMonthStart && s.date <= lastMonthEnd);
    const lastMonthTotal = lastMonthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Calculate top branch
    const branchTotals = {};
    sales.forEach(s => {
      branchTotals[s.branch] = (branchTotals[s.branch] || 0) + Number(s.amount || 0);
    });
    const topBranch = Object.keys(branchTotals).reduce((a, b) =>
      branchTotals[a] > branchTotals[b] ? a : b, Object.keys(branchTotals)[0] || '—'
    );

    // Update stats
    const statTodayEl = document.getElementById('statToday');
    const statMonthEl = document.getElementById('statMonth');
    const statBranchesEl = document.getElementById('statBranches');
    const statTopBranchEl = document.getElementById('statTopBranch');

    if (statTodayEl) {
      statTodayEl.innerHTML = formatMoney(todayTotal);
      statTodayEl.setAttribute('data-value', todayTotal.toString());
    }

    if (statMonthEl) {
      statMonthEl.innerHTML = formatMoney(monthTotal);
      statMonthEl.setAttribute('data-value', monthTotal.toString());
    }

    if (statBranchesEl) {
      statBranchesEl.innerHTML = uniqueBranches.length; // Use unique count
      statBranchesEl.setAttribute('data-value', uniqueBranches.length.toString());
    }

    if (statTopBranchEl) {
      statTopBranchEl.innerHTML = topBranch;
    }

    // Update trend indicators
    updateTrendIndicator('statTodayTrend', todayTotal, yesterdayTotal, 'vs أمس');
    updateTrendIndicator('statMonthTrend', monthTotal, lastMonthTotal, 'vs الشهر الماضي');

    // Update recent sales table
    const sortedSales = [...sales].sort((a, b) => b.date.localeCompare(a.date));
    updateRecentSalesTable(sortedSales.slice(0, 10));

    // Update charts
    updateDailySalesChart(sales);
    updateBranchesChart(branchTotals);

  } catch (error) {
    console.error('Error updating dashboard:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحديث البيانات');
  }
}

/**
 * Update trend indicator with percentage change
 */
function updateTrendIndicator(elementId, current, previous, label = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (previous === 0 && current === 0) {
    element.innerHTML = `<span style="color: var(--sap-text-secondary);">—</span>`;
    return;
  }

  if (previous === 0) {
    element.innerHTML = `<span style="color: var(--sap-success);">↑ جديد ${label}</span>`;
    return;
  }

  const change = ((current - previous) / previous) * 100;
  const changeValue = Math.abs(change).toFixed(1);

  if (change > 5) {
    element.innerHTML = `<span style="color: var(--sap-success);">↑ +${changeValue}% ${label}</span>`;
  } else if (change < -5) {
    element.innerHTML = `<span style="color: var(--sap-error);">↓ -${changeValue}% ${label}</span>`;
  } else if (change !== 0) {
    element.innerHTML = `<span style="color: var(--sap-warning);">≈ ${changeValue > 0 ? '+' : ''}${changeValue}% ${label}</span>`;
  } else {
    element.innerHTML = `<span style="color: var(--sap-text-secondary);">— مستقر ${label}</span>`;
  }
}

/**
 * Update recent sales table
 */
function updateRecentSalesTable(sales) {
  const tbody = document.getElementById('recentSalesBody');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--sap-text-secondary);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
          <div>لا توجد مبيعات حديثة</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sales.map((sale, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${sale.date}</td>
      <td>${sale.branch}</td>
      <td>${sale.description || '—'}</td>
      <td><strong>${formatMoney(sale.amount)}</strong></td>
    </tr>
  `).join('');
}

/**
 * Update daily sales chart (last 7 days)
 */
function updateDailySalesChart(sales) {
  const ctx = document.getElementById('dailySalesChart');
  if (!ctx) return;

  // Get last 7 days
  const dates = [];
  const amounts = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    dates.push(dateStr);

    const daySales = sales.filter(s => s.date === dateStr);
    const total = daySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    amounts.push(total);
  }

  if (dailyChart) {
    dailyChart.destroy();
  }

  dailyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'المبيعات',
        data: amounts,
        borderColor: '#0A6ED1', // SAP Primary
        backgroundColor: 'rgba(10, 110, 209, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0A6ED1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatMoney(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Update branches chart (pie chart)
 */
function updateBranchesChart(branchTotals) {
  const ctx = document.getElementById('branchesChart');
  if (!ctx) return;

  const branches = Object.entries(branchTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  if (branches.length === 0) {
    if (branchesChart) {
      branchesChart.destroy();
    }
    return;
  }

  const colors = [
    '#0A6ED1', '#107E3E', '#E9730C', '#BB0000', '#582586',
    '#006363', '#89919A', '#354A5F', '#0854A0', '#063B70'
  ];

  if (branchesChart) {
    branchesChart.destroy();
  }

  branchesChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: branches.map(b => b.name),
      datasets: [{
        data: branches.map(b => b.total),
        backgroundColor: colors.slice(0, branches.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        }
      }
    }
  });
}

// Initialize page when loaded
window.addEventListener('pageLoaded', async function (e) {
  if (e.detail.page === 'home') {
    await updateDashboard();
  }
});

// Listen for sales updates
window.addEventListener('salesUpdated', function () {
  if (window.location.pathname === '/' || window.location.pathname === '/home') {
    updateDashboard();
  }
});

// Export for global access
window.updateDashboard = updateDashboard;
