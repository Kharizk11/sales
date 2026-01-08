// Users Management Page

let editingUserId = null;

/**
 * Load users table
 */
async function loadUsers() {
  try {
    const users = await getUsers();
    const branches = await getBranches();
    
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    
    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">لا توجد مستخدمين</div>
              <div class="empty-state-text">ابدأ بإضافة مستخدم جديد</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = users.map((user, index) => {
      const branch = user.branchId ? branches.find(b => b.id === user.branchId) : null;
      const branchName = branch ? branch.name : (user.role === 'admin' ? 'جميع الفروع' : '—');
      const roleText = user.role === 'admin' ? 'مدير' : 'مستخدم';
      const roleBadge = user.role === 'admin' ? '🔑' : '👤';
      const statusText = user.isActive !== false ? 'نشط' : 'معطل';
      const statusBadge = user.isActive !== false ? '✅' : '❌';
      const statusClass = user.isActive !== false ? 'success' : 'danger';
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '—';
      
      // Get permissions summary
      const permissions = user.permissions || getDefaultPermissions(user.role || 'user');
      const permissionsCount = Object.values(permissions).filter(p => p === true).length;
      const totalPermissions = Object.keys(permissions).length;
      const permissionsText = user.role === 'admin' ? 'جميع الصلاحيات' : `${permissionsCount}/${totalPermissions}`;
      
      // Show edit/delete buttons based on permissions
      const currentUser = getCurrentUser();
      // Admin can edit:
      // 1. All non-admin users
      // 2. Themselves (if they are admin)
      // Cannot edit other admins (except themselves)
      const canEdit = isAdmin() && (
        user.role !== 'admin' || 
        (currentUser && currentUser.id && user.id && currentUser.id === user.id)
      );
      // Admin can delete non-admin users (but not themselves)
      const canDelete = isAdmin() && user.role !== 'admin' && user.id !== currentUser?.id;
      
      console.log('User edit permissions:', {
        userId: user.id,
        userRole: user.role,
        currentUserId: currentUser?.id,
        currentUserRole: currentUser?.role,
        isAdmin: isAdmin(),
        canEdit: canEdit,
        canDelete: canDelete
      }); // Debug
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${user.username}</strong></td>
          <td>${user.name || '—'}</td>
          <td>${user.email || '—'}</td>
          <td>${branchName}</td>
          <td>
            <span class="badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}" title="الصلاحيات: ${permissionsText}">
              ${roleBadge} ${roleText}
            </span>
            ${user.role !== 'admin' ? `<br><small style="color: var(--text-muted); font-size: 0.85em;">${permissionsText} صلاحيات</small>` : ''}
          </td>
          <td>
            <span class="badge badge-${statusClass}">
              ${statusBadge} ${statusText}
            </span>
          </td>
          <td>${createdAt}</td>
          <td>
            <div style="display: flex; gap: var(--spacing-xs);">
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" onclick="navigateToUserForm('${user.id}')" title="تعديل">
                  ✏️ تعديل
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}')" title="حذف">
                  🗑️ حذف
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء تحميل المستخدمين');
  }
}

/**
 * Open add user modal
 */
async function openAddUserModal() {
  try {
    console.log('openAddUserModal called'); // Debug
    
    if (typeof isAdmin !== 'function') {
      console.error('isAdmin function not available');
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.');
      return;
    }
    
    if (!isAdmin()) {
      showToast('error', 'خطأ', 'ليس لديك صلاحية لإضافة مستخدمين');
      return;
    }
    
    // Wait a bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let modalOverlay = document.getElementById('userModalOverlay');
    if (!modalOverlay) {
      // Try to find it in the document body
      modalOverlay = document.querySelector('#userModalOverlay');
      if (!modalOverlay) {
        console.error('Modal overlay not found in DOM');
        console.log('Available modals:', document.querySelectorAll('.modal-overlay').length);
        showToast('error', 'خطأ', 'عنصر النافذة غير موجود. يرجى تحديث الصفحة.');
        return;
      }
    }
    
    editingUserId = null;
    
    // Check if all required elements exist
    const requiredElements = {
      userModalTitle: document.getElementById('userModalTitle'),
      userForm: document.getElementById('userForm'),
      userId: document.getElementById('userId'),
      userPassword: document.getElementById('userPassword'),
      userPasswordLabel: document.getElementById('userPasswordLabel'),
      userIsActive: document.getElementById('userIsActive'),
      userRole: document.getElementById('userRole')
    };
    
    const missingElements = Object.entries(requiredElements)
      .filter(([name, el]) => !el)
      .map(([name]) => name);
    
    if (missingElements.length > 0) {
      console.error('Missing elements:', missingElements);
      showToast('error', 'خطأ', 'بعض عناصر النافذة غير موجودة. يرجى تحديث الصفحة.');
      return;
    }
    
    requiredElements.userModalTitle.textContent = '➕ إضافة مستخدم جديد';
    requiredElements.userForm.reset();
    requiredElements.userId.value = '';
    requiredElements.userPassword.required = true;
    requiredElements.userPasswordLabel.innerHTML = 'كلمة المرور *';
    requiredElements.userIsActive.checked = true;
    requiredElements.userRole.value = 'user';
    
    if (typeof loadBranchesIntoSelect === 'function') {
      loadBranchesIntoSelect('userBranch');
    }
    if (typeof updatePermissionsUI === 'function') {
      updatePermissionsUI();
    }
    
    modalOverlay.classList.add('active');
    console.log('Modal opened successfully'); // Debug
  } catch (error) {
    console.error('Error in openAddUserModal:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء فتح النافذة: ' + error.message);
  }
}

/**
 * Edit user
 */
async function editUser(userId) {
  try {
    console.log('editUser called with ID:', userId); // Debug
    
    if (typeof isAdmin !== 'function') {
      console.error('isAdmin function not available');
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.');
      return;
    }
    
    if (!isAdmin()) {
      showToast('error', 'خطأ', 'ليس لديك صلاحية لتعديل المستخدمين');
      return;
    }
    
    if (typeof getUserById !== 'function') {
      console.error('getUserById function not available');
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.');
      return;
    }
    
  const user = await getUserById(userId);
  if (!user) {
    showToast('error', 'خطأ', 'المستخدم غير موجود');
    return;
  }
    
    // Wait a bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let modalOverlay = document.getElementById('userModalOverlay');
    if (!modalOverlay) {
      modalOverlay = document.querySelector('#userModalOverlay');
      if (!modalOverlay) {
        console.error('Modal overlay not found in DOM');
        showToast('error', 'خطأ', 'عنصر النافذة غير موجود. يرجى تحديث الصفحة.');
        return;
      }
    }
    
    editingUserId = userId;
    
    // Check if all required elements exist
    const userModalTitle = document.getElementById('userModalTitle');
    const userIdInput = document.getElementById('userId');
    const userUsername = document.getElementById('userUsername');
    const userPassword = document.getElementById('userPassword');
    const userPasswordLabel = document.getElementById('userPasswordLabel');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    const userIsActive = document.getElementById('userIsActive');
    
    if (!userModalTitle || !userIdInput || !userUsername || !userPassword || !userPasswordLabel || !userName || !userEmail || !userRole || !userIsActive) {
      console.error('Some modal elements are missing');
      showToast('error', 'خطأ', 'بعض عناصر النافذة غير موجودة. يرجى تحديث الصفحة.');
      return;
    }
    
    userModalTitle.textContent = '✏️ تعديل مستخدم';
    userIdInput.value = userId;
    userUsername.value = user.username;
    userUsername.disabled = true; // Can't change username
    userPassword.value = '';
    userPassword.required = false;
    userPasswordLabel.innerHTML = 'كلمة المرور <small style="color: var(--text-muted);">(اتركه فارغاً للحفاظ على كلمة المرور الحالية)</small>';
    userName.value = user.name || '';
    userEmail.value = user.email || '';
    userRole.value = user.role || 'user';
    userIsActive.checked = user.isActive !== false;
    
    if (typeof loadBranchesIntoSelect === 'function') {
      loadBranchesIntoSelect('userBranch', false);
    }
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
    
    modalOverlay.classList.add('active');
    console.log('Edit modal opened successfully'); // Debug
  } catch (error) {
    console.error('Error in editUser:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء فتح النافذة: ' + error.message);
  }
}

/**
 * Close user modal
 */
function closeUserModal() {
  const modalOverlay = document.getElementById('userModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userUsername').disabled = false;
  editingUserId = null;
  // Reset permissions UI
  if (typeof updatePermissionsUI === 'function') {
    updatePermissionsUI();
  }
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
  
  const userId = document.getElementById('userId').value;
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
    const submitBtn = document.querySelector('#userForm button[type="submit"]');
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
      closeUserModal();
      await loadUsers();
    } else {
      showToast('error', 'خطأ', result.message || 'حدث خطأ');
    }
    
  } catch (error) {
    console.error('Error saving user:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء حفظ المستخدم');
  } finally {
    const submitBtn = document.querySelector('#userForm button[type="submit"]');
    if (submitBtn && typeof setButtonLoading === 'function') {
      setButtonLoading(submitBtn, false);
    }
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
 * Delete user confirmation
 */
async function deleteUserConfirm(userId) {
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
    return;
  }
  
  const result = await deleteUser(userId);
  if (result.success) {
    showToast('success', 'نجح', 'تم حذف المستخدم بنجاح');
    loadUsers();
  } else {
    showToast('error', 'خطأ', result.message || 'حدث خطأ أثناء حذف المستخدم');
  }
}

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

// Initialize page when loaded
window.addEventListener('pageLoaded', async function(e) {
  if (e.detail.page === 'users') {
    console.log('Users page loaded'); // Debug
    
    // Wait a bit for auth to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if modal overlay exists
    const modalOverlay = document.getElementById('userModalOverlay');
    if (!modalOverlay) {
      console.error('⚠️ User modal overlay not found in DOM!');
      console.log('Searching for modal in document.body...');
      const allModals = document.querySelectorAll('.modal-overlay');
      console.log('Found modals:', allModals.length, Array.from(allModals).map(m => m.id));
      
      // Try to find it after a delay
      await new Promise(resolve => setTimeout(resolve, 200));
      const modalAfterDelay = document.getElementById('userModalOverlay');
      if (!modalAfterDelay) {
        console.error('❌ User modal overlay still not found after delay');
        showToast('warning', 'تحذير', 'نافذة إدارة المستخدمين غير موجودة. قد تحتاج إلى تحديث الصفحة.');
      } else {
        console.log('✅ User modal overlay found after delay');
      }
    } else {
      console.log('✅ User modal overlay found');
    }
    
    if (typeof isAdmin !== 'function') {
      console.error('isAdmin function not available on page load');
      showToast('error', 'خطأ', 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.');
      return;
    }
    
    if (!isAdmin()) {
      showToast('error', 'خطأ', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
      setTimeout(() => {
        // Use router instead of window.location.href for SPA navigation
        if (typeof navigateTo === 'function') {
          navigateTo('home');
        } else {
          // Fallback if router not available
          window.location.href = '/';
        }
      }, 2000);
      return;
    }
    await loadUsers();
    
    // Ensure functions are available on window
    console.log('Functions available:', {
      openAddUserModal: typeof window.openAddUserModal,
      editUser: typeof window.editUser,
      closeUserModal: typeof window.closeUserModal
    }); // Debug
  }
});

/**
 * Navigate to user form page
 */
async function navigateToUserForm(userId = null) {
  console.log('navigateToUserForm called with userId:', userId); // Debug
  try {
    // Wait a bit to ensure router is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Try window.navigateTo first, then global navigateTo
    const navFunc = window.navigateTo || (typeof navigateTo !== 'undefined' ? navigateTo : null);
    
    if (navFunc && typeof navFunc === 'function') {
      const url = userId ? `/user-form?id=${userId}` : '/user-form';
      console.log('Navigating to:', url); // Debug
      await navFunc(url);
    } else {
      console.log('navigateTo not available, using window.location.href'); // Debug
      const url = userId ? `/user-form?id=${userId}` : '/user-form';
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error navigating to user form:', error);
    // Fallback to window.location
    const url = userId ? `/user-form?id=${userId}` : '/user-form';
    window.location.href = url;
  }
}

// Export for global access
window.loadUsers = loadUsers;
window.openAddUserModal = openAddUserModal;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.handleUserSubmit = handleUserSubmit;
window.deleteUserConfirm = deleteUserConfirm;
window.loadBranchesIntoSelect = loadBranchesIntoSelect;
window.updatePermissionsUI = updatePermissionsUI;
window.resetPermissionsToDefault = resetPermissionsToDefault;
window.navigateToUserForm = navigateToUserForm;


