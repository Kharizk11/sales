// Authentication System

const AUTH_STORAGE_KEY = 'sales_auth_data';
const USERS_STORAGE_KEY = 'sales_users_data';

let currentUser = null;

// Get Firebase db reference (from data.js)
function getDb() {
  // Try to get db from window (exported from data.js)
  if (typeof window !== 'undefined' && window.db) {
    return window.db;
  }
  return null;
}

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role) {
  if (role === 'admin') {
    return {
      canAddSales: true,
      canEditSales: true,
      canDeleteSales: true,
      canViewReports: true,
      canExportReports: true,
      canManageBranches: true,
      canManageUsers: true,
      canViewAllBranches: true
    };
  } else {
    return {
      canAddSales: true,
      canEditSales: true,
      canDeleteSales: false,
      canViewReports: true,
      canExportReports: false,
      canManageBranches: false,
      canManageUsers: false,
      canViewAllBranches: false
    };
  }
}

/**
 * Initialize authentication system
 */
async function initAuth() {
  try {
    // Check if admin user exists, if not create it
    const users = await getUsers();
    
    // Update existing users to have permissions if they don't
    let usersUpdated = false;
    users.forEach(user => {
      if (!user.permissions) {
        user.permissions = getDefaultPermissions(user.role || 'user');
        usersUpdated = true;
      }
    });
    if (usersUpdated) {
      await saveUsers(users);
      console.log('✅ Updated existing users with default permissions');
    }
    
    const adminExists = users.some(u => u.username === 'admin');
    
    if (!adminExists) {
      // Create default admin user
      const generateIdFunc = window.generateId || (() => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
      const adminPasswordHash = hashPassword('admin123');
      console.log('Creating admin user with password hash:', adminPasswordHash); // Debug
      
      const adminUser = {
        id: generateIdFunc(),
        username: 'admin',
        password: adminPasswordHash, // Default password
        role: 'admin',
        name: 'مدير النظام',
        email: 'admin@example.com',
        branchId: null, // Admin has access to all branches
        permissions: getDefaultPermissions('admin'),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      users.push(adminUser);
      await saveUsers(users);
      console.log('✅ Default admin user created: username=admin, password=admin123');
      console.log('Admin password hash:', adminPasswordHash); // Debug
    } else {
      // Verify admin user exists and fix hash if needed
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser) {
        console.log('Admin user exists, password hash:', adminUser.password); // Debug
        // Test hash to verify it matches
        const testHash = hashPassword('admin123');
        console.log('Test hash for "admin123":', testHash); // Debug
        console.log('Hash match:', adminUser.password === testHash); // Debug
        
        // Fix hash if it doesn't match (e.g., if it was saved as negative)
        if (adminUser.password !== testHash) {
          console.log('⚠️ Hash mismatch detected. Fixing admin password hash...');
          adminUser.password = testHash;
          await saveUsers(users);
          console.log('✅ Admin password hash fixed:', testHash);
        }
      }
    }
    
    // Check if user is already logged in
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.user && parsed.token) {
          currentUser = parsed.user;
          return currentUser;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in initAuth:', error);
    return null;
  }
}

/**
 * Hash password (simple hash for demo - use bcrypt in production)
 */
function hashPassword(password) {
  if (!password) return '';
  // Simple hash function (for demo purposes only)
  // This ensures consistent hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive number and consistent format
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(36);
}

/**
 * Get all users
 */
async function getUsers() {
  try {
    // Try Firebase first if available
    const db = getDb();
    if (db) {
      try {
        const usersCollection = (window.COLLECTIONS && window.COLLECTIONS.USERS) || 'users';
        const snapshot = await db.collection(usersCollection).get();
        const users = [];
        snapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() });
        });
        return users;
      } catch (error) {
        console.error('Error fetching users from Firebase:', error);
        // Fallback to localStorage
      }
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

/**
 * Save users
 */
async function saveUsers(users) {
  try {
    // Try Firebase first if available
    const db = getDb();
    if (db) {
      try {
        const usersCollection = (window.COLLECTIONS && window.COLLECTIONS.USERS) || 'users';
        const batch = db.batch();
        const snapshot = await db.collection(usersCollection).get();
        
        // Delete all existing users
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Add all users
        users.forEach(user => {
          const userRef = db.collection(usersCollection).doc(user.id);
          const { id, ...userData } = user; // Remove id from data, use it as document ID
          batch.set(userRef, userData);
        });
        
        await batch.commit();
        console.log('Users saved to Firebase successfully');
        return;
      } catch (error) {
        console.error('Error saving users to Firebase:', error);
        // Fallback to localStorage
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

/**
 * Login user
 */
async function login(username, password) {
  try {
    const users = await getUsers();
    console.log('All users:', users.map(u => ({ username: u.username, hasPassword: !!u.password }))); // Debug
    
    if (!username || !password) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }
    
    const hashedPassword = hashPassword(password);
    console.log('Hashed password for input:', hashedPassword); // Debug
    
    const user = users.find(u => {
      const usernameMatch = u.username === username;
      const passwordMatch = u.password === hashedPassword;
      const isActive = u.isActive !== false;
      
      console.log(`User ${u.username}: usernameMatch=${usernameMatch}, passwordMatch=${passwordMatch}, isActive=${isActive}`); // Debug
      
      return usernameMatch && passwordMatch && isActive;
    });
    
    if (!user) {
      console.log('User not found or password incorrect'); // Debug
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
    
    // Create session token
    const generateIdFunc = window.generateId || (() => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const token = generateIdFunc() + Date.now();
    currentUser = { ...user };
    delete currentUser.password; // Don't store password in session
    
    // Save auth data
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      user: currentUser,
      token: token,
      loginTime: new Date().toISOString()
    }));
    
    console.log('Login successful for user:', currentUser.username); // Debug
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Error in login function:', error);
    return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول: ' + error.message };
  }
}

/**
 * Logout user
 */
function logout() {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // Use router for SPA navigation, or fallback to full page reload
  if (typeof navigateTo === 'function') {
    navigateTo('login');
  } else {
    window.location.href = '/login';
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }
  
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.user) {
        currentUser = parsed.user;
        return currentUser;
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }
  
  return null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Check if user is admin
 */
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

/**
 * Check if user has access to branch
 */
function hasBranchAccess(branchId) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin has access to all branches
  return user.branchId === branchId;
}

/**
 * Check if user has specific permission
 */
function hasPermission(permission) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin has all permissions
  if (!user.permissions) {
    // If permissions not set, use default based on role
    user.permissions = getDefaultPermissions(user.role);
  }
  return user.permissions[permission] === true;
}

/**
 * Create new user
 */
async function createUser(userData) {
  if (!isAdmin()) {
    return { success: false, message: 'ليس لديك صلاحية لإنشاء مستخدمين' };
  }
  
  const users = await getUsers();
  
  // Check if username already exists
  if (users.some(u => u.username === userData.username)) {
    return { success: false, message: 'اسم المستخدم موجود بالفعل' };
  }
  
  const generateIdFunc = window.generateId || (() => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const newUser = {
    id: generateIdFunc(),
    username: userData.username,
    password: hashPassword(userData.password),
    role: userData.role || 'user',
    name: userData.name,
    email: userData.email || '',
    branchId: userData.branchId || null,
    permissions: userData.permissions || getDefaultPermissions(userData.role || 'user'),
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  return { success: true, user: { ...newUser, password: undefined } };
}

/**
 * Update user
 */
async function updateUser(userId, userData) {
  if (!isAdmin()) {
    return { success: false, message: 'ليس لديك صلاحية لتعديل المستخدمين' };
  }
  
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'المستخدم غير موجود' };
  }
  
  // Don't allow changing admin role
  if (users[userIndex].role === 'admin' && userData.role !== 'admin') {
    return { success: false, message: 'لا يمكن تغيير صلاحيات المدير' };
  }
  
  // Update user
  if (userData.password) {
    users[userIndex].password = hashPassword(userData.password);
  }
  if (userData.name) users[userIndex].name = userData.name;
  if (userData.email) users[userIndex].email = userData.email;
  if (userData.role) {
    users[userIndex].role = userData.role;
    // Update permissions if role changed
    if (!userData.permissions) {
      users[userIndex].permissions = getDefaultPermissions(userData.role);
    }
  }
  if (userData.branchId !== undefined) users[userIndex].branchId = userData.branchId;
  if (userData.isActive !== undefined) users[userIndex].isActive = userData.isActive;
  if (userData.permissions !== undefined) users[userIndex].permissions = userData.permissions;
  
  await saveUsers(users);
  
  return { success: true, user: { ...users[userIndex], password: undefined } };
}

/**
 * Delete user
 */
async function deleteUser(userId) {
  if (!isAdmin()) {
    return { success: false, message: 'ليس لديك صلاحية لحذف المستخدمين' };
  }
  
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, message: 'المستخدم غير موجود' };
  }
  
  // Don't allow deleting admin
  if (user.role === 'admin') {
    return { success: false, message: 'لا يمكن حذف حساب المدير' };
  }
  
  // Don't allow deleting current user
  const current = getCurrentUser();
  if (current && current.id === userId) {
    return { success: false, message: 'لا يمكن حذف حسابك الخاص' };
  }
  
  const filtered = users.filter(u => u.id !== userId);
  await saveUsers(filtered);
  
  return { success: true };
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// Initialize auth on load (with delay to ensure utils.js is loaded)
setTimeout(async () => {
  await initAuth();
}, 50);

// Export to window
window.initAuth = initAuth;
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.isAdmin = isAdmin;
window.hasBranchAccess = hasBranchAccess;
window.createUser = createUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.getUserById = getUserById;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.hasPermission = hasPermission;
window.getDefaultPermissions = getDefaultPermissions;

