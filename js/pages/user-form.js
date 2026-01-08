// User Form Page

let editingUserId = null;

/**
 * Go back to users page
 */
function goBack() {
  console.log('goBack called'); // Debug
  try {
    // Try navigateTo first (for SPA navigation)
    if (typeof window.navigateTo === 'function') {
      console.log('Using window.navigateTo'); // Debug
      window.navigateTo('users');
      return;
    }
    
    if (typeof navigateTo === 'function') {
      console.log('Using navigateTo'); // Debug
      navigateTo('users');
      return;
    }
    
    // Fallback to direct navigation
    console.log('Using window.location.href'); // Debug
    window.location.href = '/users';
  } catch (error) {
    console.error('Error in goBack:', error);
    // Final fallback
    window.location.href = '/users';
  }
}

/**
 * Load user data for editing
 */
async function loadUserForEdit(queryParams = '') {
  try {
    // Get userId from query params
    let userId = null;
    
    // First try to get from queryParams parameter (from pageLoaded event)
    if (queryParams) {
      const urlParams = new URLSearchParams(queryParams);
      userId = urlParams.get('id');
      console.log('Got userId from queryParams:', userId); // Debug
    }
    
    // Also try to get from window.location.search
    if (!userId && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      userId = urlParams.get('id');
      console.log('Got userId from window.location.search:', userId); // Debug
    }
    
    // Also try to get from window.location.href
    if (!userId) {
      const currentUrl = window.location.href;
      if (currentUrl.includes('?')) {
        const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
        userId = urlParams.get('id');
        console.log('Got userId from window.location.href:', userId); // Debug
      }
    }
    
    if (!userId) {
      // New user mode
      editingUserId = null;
      document.getElementById('pageTitle').textContent = '➕ إضافة مستخدم جديد';
      document.getElementById('formTitle').textContent = 'معلومات المستخدم الجديد';
      document.getElementById('userPassword').required = true;
      document.getElementById('passwordHint').textContent = 'أدخل كلمة مرور قوية';
      return;
    }
    
    // Edit mode
    editingUserId = userId;
    document.getElementById('pageTitle').textContent = '✏️ تعديل مستخدم';
    document.getElementById('formTitle').textContent = 'تعديل معلومات المستخدم';
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHint').textContent = '(اتركه فارغاً للحفاظ على كلمة المرور الحالية)';
    
    if (typeof getUserById !== 'function') {
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز');
      return;
    }
    
    const user = await getUserById(userId);
    if (!user) {
      showToast('error', 'خطأ', 'المستخدم غير موجود');
      setTimeout(() => goBack(), 2000);
      return;
    }
    
    // Fill form with user data
    document.getElementById('userId').value = userId;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userUsername').disabled = true; // Can't change username
    document.getElementById('userPassword').value = '';
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userRole').value = user.role || 'user';
    document.getElementById('userIsActive').checked = user.isActive !== false;
    
    // Load branches
    await loadBranchesIntoSelect('userBranch', false);
    setTimeout(() => {
      document.getElementById('userBranch').value = user.branchId || '';
    }, 100);
    
    // Load permissions
    const getDefaultPerms = typeof getDefaultPermissions === 'function' ? getDefaultPermissions : (role) => ({});
    const permissions = user.permissions || getDefaultPerms(user.role || 'user');
    document.getElementById('permAddSales').checked = permissions.canAddSales || false;
    document.getElementById('permEditSales').checked = permissions.canEditSales || false;
    document.getElementById('permDeleteSales').checked = permissions.canDeleteSales || false;
    document.getElementById('permViewReports').checked = permissions.canViewReports || false;
    document.getElementById('permExportReports').checked = permissions.canExportReports || false;
    document.getElementById('permManageBranches').checked = permissions.canManageBranches || false;
    document.getElementById('permManageUsers').checked = permissions.canManageUsers || false;
    document.getElementById('permViewAllBranches').checked = permissions.canViewAllBranches || false;
    
    // Update permissions UI based on role
    if (typeof updatePermissionsUI === 'function') {
      updatePermissionsUI();
    }
    
  } catch (error) {
    console.error('Error loading user for edit:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم');
  }
}

/**
 * Update permissions UI based on role
 */
function updatePermissionsUI() {
  const role = document.getElementById('userRole').value;
  const defaultPerms = getDefaultPermissions(role);
  
  document.getElementById('permAddSales').checked = defaultPerms.canAddSales;
  document.getElementById('permEditSales').checked = defaultPerms.canEditSales;
  document.getElementById('permDeleteSales').checked = defaultPerms.canDeleteSales;
  document.getElementById('permViewReports').checked = defaultPerms.canViewReports;
  document.getElementById('permExportReports').checked = defaultPerms.canExportReports;
  document.getElementById('permManageBranches').checked = defaultPerms.canManageBranches;
  document.getElementById('permManageUsers').checked = defaultPerms.canManageUsers;
  document.getElementById('permViewAllBranches').checked = defaultPerms.canViewAllBranches;
  
  // Disable permissions checkboxes if admin (admin has all permissions)
  const isAdmin = role === 'admin';
  const checkboxes = document.querySelectorAll('.permission-checkbox');
  checkboxes.forEach(cb => {
    cb.disabled = isAdmin;
    if (isAdmin) {
      cb.checked = true;
    }
  });
}

/**
 * Reset permissions to default for current role
 */
function resetPermissionsToDefault() {
  updatePermissionsUI();
  showToast('info', 'تم', 'تم إعادة تعيين الصلاحيات للافتراضي');
}

/**
 * Handle user form submit
 */
async function handleUserSubmit(event) {
  event.preventDefault();
  
  if (!isAdmin()) {
    showToast('error', 'خطأ', 'ليس لديك صلاحية');
    return;
  }
  
  const username = document.getElementById('userUsername').value.trim();
  const password = document.getElementById('userPassword').value;
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const role = document.getElementById('userRole').value;
  const branchId = document.getElementById('userBranch').value || null;
  const isActive = document.getElementById('userIsActive').checked;
  
  // Get permissions
  const permissions = {
    canAddSales: document.getElementById('permAddSales').checked,
    canEditSales: document.getElementById('permEditSales').checked,
    canDeleteSales: document.getElementById('permDeleteSales').checked,
    canViewReports: document.getElementById('permViewReports').checked,
    canExportReports: document.getElementById('permExportReports').checked,
    canManageBranches: document.getElementById('permManageBranches').checked,
    canManageUsers: document.getElementById('permManageUsers').checked,
    canViewAllBranches: document.getElementById('permViewAllBranches').checked
  };
  
  if (!username || !name) {
    showToast('warning', 'تحذير', 'يرجى ملء جميع الحقول المطلوبة');
    return;
  }
  
  if (!editingUserId && !password) {
    showToast('warning', 'تحذير', 'يرجى إدخال كلمة المرور');
    return;
  }
  
  try {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn && typeof setButtonLoading === 'function') {
      setButtonLoading(submitBtn, true);
    }
    
    let result;
    if (editingUserId) {
      // Update user
      result = await updateUser(editingUserId, {
        password: password || undefined,
        name: name,
        email: email,
        role: role,
        branchId: branchId,
        isActive: isActive,
        permissions: permissions
      });
    } else {
      // Create user
      result = await createUser({
        username: username,
        password: password,
        name: name,
        email: email,
        role: role,
        branchId: branchId,
        permissions: permissions
      });
    }
    
    if (result.success) {
      showToast('success', 'نجح', editingUserId ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
      setTimeout(() => {
        goBack();
      }, 1000);
    } else {
      showToast('error', 'خطأ', result.message || 'حدث خطأ');
    }
    
  } catch (error) {
    console.error('Error saving user:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حفظ المستخدم');
  } finally {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn && typeof setButtonLoading === 'function') {
      setButtonLoading(submitBtn, false);
    }
  }
}

// Initialize page when loaded
window.addEventListener('pageLoaded', async function(e) {
  if (e.detail.page === 'user-form') {
    console.log('User form page loaded', e.detail); // Debug
    
    // Wait a bit for auth to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (typeof isAdmin !== 'function') {
      console.error('isAdmin function not available on page load');
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.');
      return;
    }
    
    if (!isAdmin()) {
      showToast('error', 'خطأ', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
      setTimeout(() => {
        goBack();
      }, 2000);
      return;
    }
    
    // Load branches
    await loadBranchesIntoSelect('userBranch');
    
    // Get query params from event detail
    const queryParams = e.detail.query || '';
    console.log('Query params from event:', queryParams); // Debug
    
    // Load user data or initialize for new user
    await loadUserForEdit(queryParams);
    
    // Update permissions UI
    if (typeof updatePermissionsUI === 'function') {
      updatePermissionsUI();
    }
  }
});

/**
 * Load branches into select
 */
async function loadBranchesIntoSelect(selectId, includeAll = true) {
  try {
    const branches = await getBranches();
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '';
    
    if (includeAll) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'بدون فرع (جميع الفروع)';
      select.appendChild(option);
    }
    
    branches.forEach(branch => {
      const option = document.createElement('option');
      option.value = branch.id;
      option.textContent = branch.name;
      select.appendChild(option);
    });
    
    if (currentValue) {
      select.value = currentValue;
    }
  } catch (error) {
    console.error('Error loading branches into select:', error);
  }
}

// Export for global access immediately
window.goBack = goBack;
window.handleUserSubmit = handleUserSubmit;
window.updatePermissionsUI = updatePermissionsUI;
window.resetPermissionsToDefault = resetPermissionsToDefault;
window.loadBranchesIntoSelect = loadBranchesIntoSelect;

// Also ensure it's available after page load
window.addEventListener('pageLoaded', function(e) {
  if (e.detail.page === 'user-form') {
    // Ensure goBack is available
    window.goBack = goBack;
    console.log('goBack function ensured on window'); // Debug
  }
});

