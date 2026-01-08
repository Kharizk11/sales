// Branches Page JavaScript - SAP Fiori Style

let editingBranchId = null;
let allBranchesData = []; // Store all branches for filtering

/**
 * Load and render branches table
 */
async function renderBranchesTable() {
  try {
    const branches = await getBranches();
    const sales = await getSales();
    const tbody = document.getElementById('branchesBody');

    if (!tbody) return;

    if (branches.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div style="text-align: center; padding: 40px; color: var(--sap-text-secondary);">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
              <h3>لا توجد فروع</h3>
              <p>ابدأ بإضافة أول فرع جديد</p>
              <button class="btn-sap btn-emphasized" onclick="openBranchModal()">
                ➕ إضافة فرع الآن
              </button>
            </div>
          </td>
        </tr>
      `;
      // Update stats cards
      updateBranchStats([], 0);
      return;
    }

    // Calculate sales for each branch
    const branchStats = branches.map(branch => {
      const branchSales = sales.filter(s => s.branch === branch.name);
      const total = branchSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      return {
        ...branch,
        salesCount: branchSales.length,
        total: total
      };
    });

    // Deduplicate branches by name
    const uniqueBranchStats = [];
    const seenBranchNames = new Set();

    branchStats.forEach(branch => {
      if (!seenBranchNames.has(branch.name)) {
        seenBranchNames.add(branch.name);
        uniqueBranchStats.push(branch);
      }
    });

    // Calculate total sales and find max for progress bars
    const totalSales = uniqueBranchStats.reduce((sum, b) => sum + b.total, 0);
    const maxSales = Math.max(...uniqueBranchStats.map(b => b.total));

    // Update stats cards
    updateBranchStats(uniqueBranchStats, totalSales);

    // Store for filtering
    allBranchesData = uniqueBranchStats;

    // Render table
    renderBranchesTableRows(uniqueBranchStats);

  } catch (error) {
    console.error('Error rendering branches table:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل الفروع');
  }
}

/**
 * Render branches table rows
 */
function renderBranchesTableRows(branchStats) {
  const tbody = document.getElementById('branchesBody');
  const branchesCountEl = document.getElementById('branchesCount');

  if (!tbody) return;

  if (branchStats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div style="color: var(--sap-text-secondary);">
            <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
            <p style="font-size: 1.1rem; margin-bottom: 10px;">لا توجد نتائج</p>
            <p style="font-size: 0.9rem;">جرّب البحث بكلمات أخرى</p>
          </div>
        </td>
      </tr>
    `;
    if (branchesCountEl) branchesCountEl.textContent = '';
    return;
  }

  const maxSales = Math.max(...branchStats.map(b => b.total));

  tbody.innerHTML = branchStats.map((branch, index) => {
    const percentage = maxSales > 0 ? (branch.total / maxSales) * 100 : 0;
    const progressColor = percentage > 75 ? 'var(--sap-success)' : percentage > 50 ? 'var(--sap-primary)' : percentage > 25 ? 'var(--sap-warning)' : 'var(--sap-error)';

    return `
    <tr>
      <td style="text-align: center;">${index + 1}</td>
      <td><strong>${branch.name}</strong></td>
      <td style="text-align: center;"><span style="background: var(--sap-bg-hover); color: var(--sap-primary); padding: 4px 12px; border-radius: 20px; font-weight: 600;">${branch.salesCount}</span></td>
      <td><strong style="color: var(--sap-primary-active);">${formatMoney(branch.total)}</strong></td>
      <td style="text-align: center;">
        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">
          <div style="width: ${percentage}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease;"></div>
        </div>
        <small style="color: var(--sap-text-secondary);">${percentage.toFixed(1)}%</small>
      </td>
      <td style="text-align: center;">
        <div style="display: flex; gap: 5px; justify-content: center;">
          <button class="btn-sap btn-standard" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewBranchDetails('${branch.id}', '${branch.name.replace(/'/g, "\\'")}')">
            📊 تفاصيل
          </button>
          <button class="btn-sap btn-standard" style="padding: 6px 12px; font-size: 0.85rem;" onclick="editBranch('${branch.id}', '${branch.name.replace(/'/g, "\\'")}', '${(branch.description || '').replace(/'/g, "\\'")}')">
            ✏️
          </button>
          <button class="btn-sap btn-standard" style="padding: 6px 12px; font-size: 0.85rem; color: var(--sap-error); border-color: var(--sap-error);" onclick="deleteBranch('${branch.id}', '${branch.name.replace(/'/g, "\\'")}')">
            🗑️
          </button>
        </div>
      </td>
    </tr>
    `;
  }).join('');

  if (branchesCountEl) {
    branchesCountEl.textContent = `عرض ${branchStats.length} فرع`;
  }
}

/**
 * Open branch modal for adding/editing
 */
function openBranchModal(branchId = null) {
  const modal = document.getElementById('branchModalOverlay');
  const form = document.getElementById('branchForm');
  const title = document.getElementById('branchModalTitle');
  const nameInput = document.getElementById('branchName');
  const descInput = document.getElementById('branchDescription');
  const idInput = document.getElementById('branchId');

  if (!modal || !form) return;

  editingBranchId = branchId;

  if (branchId) {
    title.textContent = '✏️ تعديل الفرع';
    idInput.value = branchId;
  } else {
    title.textContent = '➕ إضافة فرع جديد';
    idInput.value = '';
    nameInput.value = '';
    descInput.value = '';
  }

  modal.style.display = 'flex';

  // Focus on name input
  setTimeout(() => {
    if (nameInput) nameInput.focus();
  }, 100);
}

/**
 * Close branch modal
 */
function closeBranchModal() {
  const modal = document.getElementById('branchModalOverlay');
  if (modal) {
    modal.style.display = 'none';
  }
  editingBranchId = null;
  const form = document.getElementById('branchForm');
  if (form) {
    form.reset();
  }
}

/**
 * Edit branch
 */
function editBranch(id, name, description) {
  openBranchModal(id);
  document.getElementById('branchName').value = name;
  document.getElementById('branchDescription').value = description || '';
  document.getElementById('branchId').value = id;
}

/**
 * Delete branch
 */
async function deleteBranch(id, name) {
  if (!confirm(`هل أنت متأكد من حذف الفرع "${name}"؟`)) {
    return;
  }

  try {
    const branches = await getBranches();
    const updatedBranches = branches.filter(b => b.id !== id);
    await saveBranches(updatedBranches);

    showToast('success', 'نجح', 'تم حذف الفرع بنجاح');
    await renderBranchesTable();
  } catch (error) {
    console.error('Error deleting branch:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حذف الفرع');
  }
}

/**
 * Handle branch form submit
 */
async function handleBranchSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('branchName');
  const descInput = document.getElementById('branchDescription');
  const idInput = document.getElementById('branchId');

  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  const id = idInput.value;

  if (!name) {
    showToast('warning', 'تحذير', 'يرجى إدخال اسم الفرع');
    return;
  }

  try {
    const branches = await getBranches();

    if (id) {
      // Update existing branch
      const index = branches.findIndex(b => b.id === id);
      if (index !== -1) {
        branches[index] = {
          ...branches[index],
          name: name,
          description: description
        };
        await saveBranches(branches);
        showToast('success', 'نجح', 'تم تحديث الفرع بنجاح');
      }
    } else {
      // Add new branch
      const newBranch = {
        id: generateId(),
        name: name,
        description: description
      };
      branches.push(newBranch);
      await saveBranches(branches);
      showToast('success', 'نجح', 'تم إضافة الفرع بنجاح');
    }

    closeBranchModal();
    await renderBranchesTable();

  } catch (error) {
    console.error('Error saving branch:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حفظ الفرع');
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('branchModalOverlay');
    if (modal && modal.classList.contains('active')) {
      closeBranchModal();
    }
  }
});

// Listen for branches updates
window.addEventListener('branchesUpdated', function () {
  if (window.location.pathname === '/branches') {
    renderBranchesTable();
  }
});

/**
 * Update branch statistics cards
 */
function updateBranchStats(branchStats, totalSales) {
  const totalBranchesEl = document.getElementById('totalBranches');
  const totalSalesEl = document.getElementById('totalBranchesSales');
  const topBranchNameEl = document.getElementById('topBranchName');

  if (totalBranchesEl) {
    totalBranchesEl.innerHTML = branchStats.length;
  }

  if (totalSalesEl) {
    const formattedSales = formatMoney(totalSales);
    totalSalesEl.innerHTML = formattedSales;
    totalSalesEl.title = formattedSales; // Show full number on hover
  }

  if (topBranchNameEl) {
    if (branchStats.length > 0) {
      const topBranch = branchStats.reduce((max, b) => b.total > max.total ? b : max, branchStats[0]);
      topBranchNameEl.innerHTML = topBranch.name;
    } else {
      topBranchNameEl.innerHTML = '—';
    }
  }
}

/**
 * Filter branches based on search input
 */
function filterBranches() {
  const searchInput = document.getElementById('branchSearch');
  if (!searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    renderBranchesTableRows(allBranchesData);
    return;
  }

  const filtered = allBranchesData.filter(branch => {
    return branch.name.toLowerCase().includes(searchTerm) ||
      (branch.description && branch.description.toLowerCase().includes(searchTerm));
  });

  renderBranchesTableRows(filtered);
}

/**
 * Clear branch search
 */
function clearBranchSearch() {
  const searchInput = document.getElementById('branchSearch');
  if (searchInput) {
    searchInput.value = '';
    renderBranchesTableRows(allBranchesData);
  }
}

/**
 * View branch details
 */
async function viewBranchDetails(branchId, branchName) {
  try {
    const sales = await getSales();
    const branchSales = sales.filter(s => s.branch === branchName);

    if (branchSales.length === 0) {
      showToast('info', 'معلومات', `لا توجد مبيعات مسجلة للفرع "${branchName}"`);
      return;
    }

    const total = branchSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const count = branchSales.length;
    const average = total / count;

    // Find best month
    const monthlyTotals = {};
    branchSales.forEach(s => {
      const month = s.date.substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(s.amount || 0);
    });

    let bestMonth = '-';
    let bestMonthTotal = 0;
    Object.entries(monthlyTotals).forEach(([month, val]) => {
      if (val > bestMonthTotal) {
        bestMonthTotal = val;
        bestMonth = month;
      }
    });

    // Create and show modal dynamically
    const modalId = 'branchDetailsModal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container sap-card" style="max-width: 500px; width: 90%;">
        <div class="sap-card-header">
          <h3 class="sap-card-title">📊 تفاصيل الفرع: ${branchName}</h3>
          <button class="btn-sap btn-transparent" onclick="document.getElementById('${modalId}').style.display='none'">✕</button>
        </div>
        <div class="sap-card-content">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
              <div style="color: var(--sap-text-secondary); font-size: 0.9rem;">إجمالي المبيعات</div>
              <div style="color: var(--sap-primary); font-size: 1.5rem; font-weight: bold;">${formatMoney(total)}</div>
            </div>
            <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
              <div style="color: var(--sap-text-secondary); font-size: 0.9rem;">عدد العمليات</div>
              <div style="color: var(--sap-text-primary); font-size: 1.5rem; font-weight: bold;">${count}</div>
            </div>
            <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
              <div style="color: var(--sap-text-secondary); font-size: 0.9rem;">متوسط العملية</div>
              <div style="color: var(--sap-text-primary); font-size: 1.5rem; font-weight: bold;">${formatMoney(average)}</div>
            </div>
            <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
              <div style="color: var(--sap-text-secondary); font-size: 0.9rem;">أفضل شهر</div>
              <div style="color: var(--sap-success); font-size: 1.2rem; font-weight: bold;">${bestMonth}</div>
              <div style="font-size: 0.8rem;">${formatMoney(bestMonthTotal)}</div>
            </div>
          </div>
          <div style="text-align: center;">
            <button class="btn-sap btn-emphasized" onclick="document.getElementById('${modalId}').style.display='none'">إغلاق</button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

  } catch (error) {
    console.error('Error viewing details:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء عرض التفاصيل');
  }
}

// Export for global access
window.renderBranchesTable = renderBranchesTable;
window.openBranchModal = openBranchModal;
window.closeBranchModal = closeBranchModal;
window.editBranch = editBranch;
window.deleteBranch = deleteBranch;
window.handleBranchSubmit = handleBranchSubmit;
window.filterBranches = filterBranches;
window.clearBranchSearch = clearBranchSearch;
window.viewBranchDetails = viewBranchDetails;
