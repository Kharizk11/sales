// Data Management - Firebase & LocalStorage

// Initialize Firebase
let db = null;
let salesData = [];
let branchesData = [];

// Initialize Firebase connection
function initFirebase() {
  try {
    // Get config from window or use default
    const config = window.FIREBASE_CONFIG || FIREBASE_CONFIG;
    if (!config) {
      console.warn('Firebase config not found');
      return;
    }

    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
      firebase.initializeApp(config);
      db = firebase.firestore();
    } else if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      db = firebase.firestore();
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Wait for config to load, then initialize
function tryInitFirebase() {
  const config = window.FIREBASE_CONFIG || (typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null);
  if (config) {
    initFirebase();
  } else {
    setTimeout(tryInitFirebase, 100);
  }
}

tryInitFirebase();

/**
 * Get all sales
 */
async function getSales() {
  // Return cached data if available
  if (salesData.length > 0) {
    return salesData;
  }

  // Try Firebase first if available
  if (db) {
    try {
      const salesCollection = (window.COLLECTIONS && window.COLLECTIONS.SALES) || COLLECTIONS?.SALES || 'sales';
      const snapshot = await db.collection(salesCollection).get();
      const sales = [];
      snapshot.forEach(doc => {
        sales.push({ id: doc.id, ...doc.data() });
      });
      salesData = sales;
      return sales;
    } catch (error) {
      console.error('Error fetching sales from Firebase:', error);
    }
  }

  // Fallback to localStorage
  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.SALES) || STORAGE_KEYS?.SALES || 'sales_data_v2';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    salesData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching sales from localStorage:', error);
    return [];
  }
}

/**
 * Save sales
 */
async function saveSales(sales) {
  salesData = sales;

  // Try Firebase first if available
  if (db) {
    try {
      const salesCollection = (window.COLLECTIONS && window.COLLECTIONS.SALES) || COLLECTIONS?.SALES || 'sales';
      const batch = db.batch();
      const snapshot = await db.collection(salesCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      sales.forEach(sale => {
        const saleRef = db.collection(salesCollection).doc();
        batch.set(saleRef, {
          date: sale.date,
          branch: sale.branch,
          amount: sale.amount,
          description: sale.description || '',
          notes: sale.notes || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving sales to Firebase:', error);
    }
  }

  // Fallback to localStorage
  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.SALES) || STORAGE_KEYS?.SALES || 'sales_data_v2';
    localStorage.setItem(storageKey, JSON.stringify(sales));
  } catch (error) {
    console.error('Error saving sales to localStorage:', error);
  }
}

/**
 * Get all branches
 */
async function getBranches() {
  // Return cached data if available
  if (branchesData.length > 0) {
    return branchesData;
  }

  // Try Firebase first if available
  if (db) {
    try {
      const branchesCollection = (window.COLLECTIONS && window.COLLECTIONS.BRANCHES) || COLLECTIONS?.BRANCHES || 'branches';
      const snapshot = await db.collection(branchesCollection).get();
      const branches = [];
      snapshot.forEach(doc => {
        branches.push({ id: doc.id, ...doc.data() });
      });
      branchesData = branches;
      return branches;
    } catch (error) {
      console.error('Error fetching branches from Firebase:', error);
    }
  }

  // Fallback to localStorage
  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.BRANCHES) || STORAGE_KEYS?.BRANCHES || 'branches_data_v2';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    branchesData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching branches from localStorage:', error);
    return [];
  }
}

/**
 * Save branches
 */
async function saveBranches(branches) {
  branchesData = branches;

  // Try Firebase first if available
  if (db) {
    try {
      const branchesCollection = (window.COLLECTIONS && window.COLLECTIONS.BRANCHES) || COLLECTIONS?.BRANCHES || 'branches';
      const batch = db.batch();
      const snapshot = await db.collection(branchesCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      branches.forEach(branch => {
        const branchRef = db.collection(branchesCollection).doc();
        batch.set(branchRef, {
          name: branch.name,
          description: branch.description || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving branches to Firebase:', error);
    }
  }

  // Fallback to localStorage
  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.BRANCHES) || STORAGE_KEYS?.BRANCHES || 'branches_data_v2';
    localStorage.setItem(storageKey, JSON.stringify(branches));
  } catch (error) {
    console.error('Error saving branches to localStorage:', error);
  }
}

/**
 * Setup Firebase real-time listeners
 */
function setupFirebaseListeners() {
  if (!db) {
    console.warn('Firebase not initialized, skipping listeners setup');
    return;
  }

  const salesCollection = (window.COLLECTIONS && window.COLLECTIONS.SALES) || COLLECTIONS?.SALES || 'sales';
  const branchesCollection = (window.COLLECTIONS && window.COLLECTIONS.BRANCHES) || COLLECTIONS?.BRANCHES || 'branches';

  // Sales listener
  db.collection(salesCollection).onSnapshot((snapshot) => {
    const sales = [];
    snapshot.forEach(doc => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    salesData = sales;

    // Trigger custom event for pages to update
    window.dispatchEvent(new CustomEvent('salesUpdated', { detail: sales }));
  });

  // Branches listener
  db.collection(branchesCollection).onSnapshot((snapshot) => {
    const branches = [];
    snapshot.forEach(doc => {
      branches.push({ id: doc.id, ...doc.data() });
    });
    branchesData = branches;

    // Trigger custom event for pages to update
    window.dispatchEvent(new CustomEvent('branchesUpdated', { detail: branches }));
  });
}

/**
 * Get all products
 */
let productsData = [];
async function getProducts() {
  if (productsData.length > 0) {
    return productsData;
  }

  if (db) {
    try {
      const productsCollection = 'products';
      const snapshot = await db.collection(productsCollection).get();
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      productsData = products;
      return products;
    } catch (error) {
      console.error('Error fetching products from Firebase:', error);
    }
  }

  try {
    const storageKey = 'products_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    productsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching products from localStorage:', error);
    return [];
  }
}

/**
 * Save products
 */
/**
 * Save products
 */
async function saveProducts(products) {
  productsData = products;

  if (db) {
    try {
      const productsCollection = 'products';
      const batch = db.batch();
      const snapshot = await db.collection(productsCollection).get();

      // Delete all existing documents to ensure sync
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add all products with their existing IDs
      products.forEach(product => {
        const productRef = db.collection(productsCollection).doc(product.id);
        batch.set(productRef, {
          code: product.code,
          name: product.name,
          unitId: product.unitId || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving products to Firebase:', error);
    }
  }

  try {
    const storageKey = 'products_data';
    localStorage.setItem(storageKey, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving products to localStorage:', error);
  }
}

/**
 * Get all units
 */
let unitsData = [];
async function getUnits() {
  if (unitsData.length > 0) {
    return unitsData;
  }

  if (db) {
    try {
      const unitsCollection = 'units';
      const snapshot = await db.collection(unitsCollection).get();
      const units = [];
      snapshot.forEach(doc => {
        units.push({ id: doc.id, ...doc.data() });
      });
      unitsData = units;
      return units;
    } catch (error) {
      console.error('Error fetching units from Firebase:', error);
    }
  }

  try {
    const storageKey = 'units_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    unitsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching units from localStorage:', error);
    return [];
  }
}

/**
 * Save units
 */
async function saveUnits(units) {
  unitsData = units;

  if (db) {
    try {
      const unitsCollection = 'units';
      const batch = db.batch();
      const snapshot = await db.collection(unitsCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      units.forEach(unit => {
        const unitRef = db.collection(unitsCollection).doc(unit.id);
        batch.set(unitRef, {
          number: unit.number,
          name: unit.name
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving units to Firebase:', error);
    }
  }

  try {
    const storageKey = 'units_data';
    localStorage.setItem(storageKey, JSON.stringify(units));
  } catch (error) {
    console.error('Error saving units to localStorage:', error);
  }
}

/**
 * Get all lists
 */
let listsData = [];
async function getLists() {
  if (listsData.length > 0) {
    return listsData;
  }

  if (db) {
    try {
      const listsCollection = 'product_lists';
      const snapshot = await db.collection(listsCollection).get();
      const lists = [];
      snapshot.forEach(doc => {
        lists.push({ id: doc.id, ...doc.data() });
      });
      listsData = lists;
      return lists;
    } catch (error) {
      console.error('Error fetching lists from Firebase:', error);
    }
  }

  try {
    const storageKey = 'product_lists_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    listsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching lists from localStorage:', error);
    return [];
  }
}

/**
 * Save lists
 */
async function saveLists(lists) {
  listsData = lists;

  if (db) {
    try {
      const listsCollection = 'product_lists';
      const batch = db.batch();
      const snapshot = await db.collection(listsCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      lists.forEach(list => {
        const listRef = db.collection(listsCollection).doc(list.id);
        batch.set(listRef, {
          name: list.name,
          date: list.date,
          items: list.items || []
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving lists to Firebase:', error);
    }
  }

  try {
    const storageKey = 'product_lists_data';
    localStorage.setItem(storageKey, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving lists to localStorage:', error);
  }
}

/**
 * Get all inventory items
 */
let inventoryItemsData = [];
async function getInventoryItems() {
  if (inventoryItemsData.length > 0) {
    return inventoryItemsData;
  }

  if (db) {
    try {
      const itemsCollection = (window.COLLECTIONS && window.COLLECTIONS.INVENTORY_ITEMS) || 'inventory_items';
      const snapshot = await db.collection(itemsCollection).get();
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      inventoryItemsData = items;
      return items;
    } catch (error) {
      console.error('Error fetching inventory items from Firebase:', error);
    }
  }

  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.INVENTORY_ITEMS) || 'inventory_items_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    inventoryItemsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching inventory items from localStorage:', error);
    return [];
  }
}

/**
 * Save inventory items
 */
async function saveInventoryItems(items) {
  inventoryItemsData = items;

  if (db) {
    try {
      const itemsCollection = (window.COLLECTIONS && window.COLLECTIONS.INVENTORY_ITEMS) || 'inventory_items';
      const batch = db.batch();
      const snapshot = await db.collection(itemsCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      items.forEach(item => {
        const itemRef = db.collection(itemsCollection).doc(item.id);
        batch.set(itemRef, {
          code: item.code,
          name: item.name,
          unit: item.unit,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving inventory items to Firebase:', error);
    }
  }

  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.INVENTORY_ITEMS) || 'inventory_items_data';
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving inventory items to localStorage:', error);
  }
}

/**
 * Get all inventory lists
 */
let inventoryListsData = [];
async function getInventoryLists() {
  if (inventoryListsData.length > 0) {
    return inventoryListsData;
  }

  if (db) {
    try {
      const listsCollection = (window.COLLECTIONS && window.COLLECTIONS.INVENTORY_LISTS) || 'inventory_lists';
      const snapshot = await db.collection(listsCollection).get();
      const lists = [];
      snapshot.forEach(doc => {
        lists.push({ id: doc.id, ...doc.data() });
      });
      inventoryListsData = lists;
      return lists;
    } catch (error) {
      console.error('Error fetching inventory lists from Firebase:', error);
    }
  }

  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.INVENTORY_LISTS) || 'inventory_lists_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    inventoryListsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching inventory lists from localStorage:', error);
    return [];
  }
}

/**
 * Save inventory lists
 */
async function saveInventoryLists(lists) {
  inventoryListsData = lists;

  if (db) {
    try {
      const listsCollection = (window.COLLECTIONS && window.COLLECTIONS.INVENTORY_LISTS) || 'inventory_lists';
      const batch = db.batch();
      const snapshot = await db.collection(listsCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      lists.forEach(list => {
        const listRef = db.collection(listsCollection).doc(list.id);
        batch.set(listRef, {
          name: list.name,
          created: list.created,
          entries: list.entries || []
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving inventory lists to Firebase:', error);
    }
  }

  try {
    const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.INVENTORY_LISTS) || 'inventory_lists_data';
    localStorage.setItem(storageKey, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving inventory lists to localStorage:', error);
  }
}

// Export to window
window.getSales = getSales;
window.saveSales = saveSales;
window.getBranches = getBranches;
window.saveBranches = saveBranches;
window.setupFirebaseListeners = setupFirebaseListeners;
window.getProducts = getProducts;
window.saveProducts = saveProducts;
window.getUnits = getUnits;
window.saveUnits = saveUnits;
window.getLists = getLists;
window.saveLists = saveLists;
window.getInventoryItems = getInventoryItems;
window.saveInventoryItems = saveInventoryItems;
window.getInventoryLists = getInventoryLists;
window.saveInventoryLists = saveInventoryLists;

/**
 * Get all POS
 */
let posData = [];
async function getPOS() {
  if (posData.length > 0) {
    return posData;
  }

  if (db) {
    try {
      const posCollection = 'pos_terminals';
      const snapshot = await db.collection(posCollection).get();
      const pos = [];
      snapshot.forEach(doc => {
        pos.push({ id: doc.id, ...doc.data() });
      });
      posData = pos;
      return pos;
    } catch (error) {
      console.error('Error fetching POS from Firebase:', error);
    }
  }

  try {
    const storageKey = 'pos_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    posData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching POS from localStorage:', error);
    return [];
  }
}

/**
 * Save POS
 */
async function savePOS(pos) {
  posData = pos;

  if (db) {
    try {
      const posCollection = 'pos_terminals';
      const batch = db.batch();
      const snapshot = await db.collection(posCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      pos.forEach(p => {
        const posRef = db.collection(posCollection).doc(p.id);
        batch.set(posRef, {
          name: p.name,
          cashier: p.cashier || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving POS to Firebase:', error);
    }
  }

  try {
    const storageKey = 'pos_data';
    localStorage.setItem(storageKey, JSON.stringify(pos));
  } catch (error) {
    console.error('Error saving POS to localStorage:', error);
  }
}

/**
 * Get all Reconciliations
 */
let reconciliationsData = [];
async function getReconciliations() {
  if (reconciliationsData.length > 0) {
    return reconciliationsData;
  }

  if (db) {
    try {
      const recCollection = 'reconciliations';
      const snapshot = await db.collection(recCollection).get();
      const recs = [];
      snapshot.forEach(doc => {
        recs.push({ id: doc.id, ...doc.data() });
      });
      reconciliationsData = recs;
      return recs;
    } catch (error) {
      console.error('Error fetching reconciliations from Firebase:', error);
    }
  }

  try {
    const storageKey = 'reconciliations_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    reconciliationsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching reconciliations from localStorage:', error);
    return [];
  }
}

/**
 * Save Reconciliations
 */
async function saveReconciliations(recs) {
  reconciliationsData = recs;

  if (db) {
    try {
      const recCollection = 'reconciliations';
      const batch = db.batch();
      const snapshot = await db.collection(recCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      recs.forEach(r => {
        const recRef = db.collection(recCollection).doc(r.id);
        batch.set(recRef, {
          date: r.date,
          posId: r.posId,
          posName: r.posName,
          cashier: r.cashier,
          sales: r.sales,
          returns: r.returns,
          networkSales: r.networkSales,
          cashHandedOver: r.cashHandedOver,
          totalSales: r.totalSales,
          netSales: r.netSales,
          difference: r.difference,
          type: r.type, // 'surplus', 'deficit', 'balanced'
          notes: r.notes || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving reconciliations to Firebase:', error);
    }
  }

  try {
    const storageKey = 'reconciliations_data';
    localStorage.setItem(storageKey, JSON.stringify(recs));
  } catch (error) {
    console.error('Error saving reconciliations to localStorage:', error);
  }
}

/**
 * Get all Treasury Reconciliations
 */
let treasuryReconciliationsData = [];
async function getTreasuryReconciliations() {
  if (treasuryReconciliationsData.length > 0) {
    return treasuryReconciliationsData;
  }

  if (db) {
    try {
      const recCollection = 'treasury_reconciliations';
      const snapshot = await db.collection(recCollection).get();
      const recs = [];
      snapshot.forEach(doc => {
        recs.push({ id: doc.id, ...doc.data() });
      });
      treasuryReconciliationsData = recs;
      return recs;
    } catch (error) {
      console.error('Error fetching treasury reconciliations from Firebase:', error);
    }
  }

  try {
    const storageKey = 'treasury_reconciliations_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    treasuryReconciliationsData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching treasury reconciliations from localStorage:', error);
    return [];
  }
}

/**
 * Save Treasury Reconciliations
 */
async function saveTreasuryReconciliations(recs) {
  treasuryReconciliationsData = recs;

  if (db) {
    try {
      const recCollection = 'treasury_reconciliations';
      const batch = db.batch();
      const snapshot = await db.collection(recCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      recs.forEach(r => {
        const recRef = db.collection(recCollection).doc(r.id);
        batch.set(recRef, r); // Save the whole object
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving treasury reconciliations to Firebase:', error);
    }
  }

  try {
    const storageKey = 'treasury_reconciliations_data';
    localStorage.setItem(storageKey, JSON.stringify(recs));
  } catch (error) {
    console.error('Error saving treasury reconciliations to localStorage:', error);
  }
}

/**
 * Get Treasury Definitions
 */
let treasuryDefinitionsData = null;
async function getTreasuryDefinitions() {
  if (treasuryDefinitionsData) {
    return treasuryDefinitionsData;
  }

  const defaultDefs = {
    expenses: ['كهرباء', 'ماء', 'إيجار', 'رواتب', 'نثريات', 'صيانة'],
    payments: ['مورد 1', 'مورد 2', 'شركة المراعي', 'شركة الصافي'],
    transfers: ['تحويل للمالك', 'إيداع بنكي'],
    deposits: ['مبيعات نقدية', 'إيراد آخر']
  };

  if (db) {
    try {
      const doc = await db.collection('settings').doc('treasury_definitions').get();
      if (doc.exists) {
        treasuryDefinitionsData = doc.data();
        return treasuryDefinitionsData;
      }
    } catch (error) {
      console.error('Error fetching treasury definitions from Firebase:', error);
    }
  }

  try {
    const storageKey = 'treasury_definitions_data';
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      treasuryDefinitionsData = JSON.parse(localData);
    } else {
      treasuryDefinitionsData = defaultDefs;
    }
    return treasuryDefinitionsData;
  } catch (error) {
    console.error('Error fetching treasury definitions from localStorage:', error);
    return defaultDefs;
  }
}

/**
 * Save Treasury Definitions
 */
async function saveTreasuryDefinitions(defs) {
  treasuryDefinitionsData = defs;

  if (db) {
    try {
      await db.collection('settings').doc('treasury_definitions').set(defs);
    } catch (error) {
      console.error('Error saving treasury definitions to Firebase:', error);
    }
  }

  try {
    const storageKey = 'treasury_definitions_data';
    localStorage.setItem(storageKey, JSON.stringify(defs));
  } catch (error) {
    console.error('Error saving treasury definitions to localStorage:', error);
  }
}

window.getPOS = getPOS;
window.savePOS = savePOS;
window.getReconciliations = getReconciliations;
window.saveReconciliations = saveReconciliations;
window.getTreasuryReconciliations = getTreasuryReconciliations;
window.saveTreasuryReconciliations = saveTreasuryReconciliations;
window.getTreasuryDefinitions = getTreasuryDefinitions;
window.saveTreasuryDefinitions = saveTreasuryDefinitions;

/**
 * Get all Cashiers
 */
let cashiersData = [];
async function getCashiers() {
  if (cashiersData.length > 0) {
    return cashiersData;
  }

  if (db) {
    try {
      const cashiersCollection = 'cashiers';
      const snapshot = await db.collection(cashiersCollection).get();
      const cashiers = [];
      snapshot.forEach(doc => {
        cashiers.push({ id: doc.id, ...doc.data() });
      });
      cashiersData = cashiers;
      return cashiers;
    } catch (error) {
      console.error('Error fetching cashiers from Firebase:', error);
    }
  }

  try {
    const storageKey = 'cashiers_data';
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    cashiersData = localData;
    return localData;
  } catch (error) {
    console.error('Error fetching cashiers from localStorage:', error);
    return [];
  }
}

/**
 * Save Cashiers
 */
async function saveCashiers(cashiers) {
  cashiersData = cashiers;

  if (db) {
    try {
      const cashiersCollection = 'cashiers';
      const batch = db.batch();
      const snapshot = await db.collection(cashiersCollection).get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      cashiers.forEach(c => {
        const cashierRef = db.collection(cashiersCollection).doc(c.id);
        batch.set(cashierRef, {
          name: c.name,
          phone: c.phone || '',
          notes: c.notes || ''
        });
      });

      await batch.commit();
      return;
    } catch (error) {
      console.error('Error saving cashiers to Firebase:', error);
    }
  }

  try {
    const storageKey = 'cashiers_data';
    localStorage.setItem(storageKey, JSON.stringify(cashiers));
  } catch (error) {
    console.error('Error saving cashiers to localStorage:', error);
  }
}

window.getCashiers = getCashiers;
window.saveCashiers = saveCashiers;

// Export db for use in other modules
Object.defineProperty(window, 'db', {
  get: function () { return db; },
  configurable: true
});

