// Firebase Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDebEmKG50PMWyr4yAcdmEUgogbPQTILaA",
  authDomain: "serb-a64db.firebaseapp.com",
  projectId: "serb-a64db",
  storageBucket: "serb-a64db.firebasestorage.app",
  messagingSenderId: "512820564329",
  appId: "1:512820564329:web:73bbf6e64645891f24edf8",
  measurementId: "G-E98SV1ZKRT"
};

// Storage Keys
const STORAGE_KEYS = {
  SALES: 'sales_data_v2',
  BRANCHES: 'branches_data_v2',
  INVENTORY_ITEMS: 'inventory_items_data',
  INVENTORY_LISTS: 'inventory_lists_data'
};

// Firebase Collections
const COLLECTIONS = {
  SALES: 'sales',
  BRANCHES: 'branches',
  INVENTORY_ITEMS: 'inventory_items',
  INVENTORY_LISTS: 'inventory_lists'
};

// Export configuration to window for global access
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;
window.COLLECTIONS = COLLECTIONS;

// Also export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIREBASE_CONFIG, STORAGE_KEYS, COLLECTIONS };
}

