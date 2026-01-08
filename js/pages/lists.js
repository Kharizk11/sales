// Lists Page JavaScript

let currentLists = [];
let currentProducts = [];
let selectedListItems = new Map(); // productId -> quantity
let viewingListId = null;
let editingListId = null; // NEW: for editing lists
let listTemplates = []; // NEW: for list templates
let filteredLists = []; // NEW: for filtered lists

// NEW: List categories with icons and colors
const LIST_CATEGORIES = {
    purchases: { name: 'مشتريات', icon: '🛒', color: '#3b82f6' },
    sales: { name: 'مبيعات', icon: '💰', color: '#10b981' },
    inventory: { name: 'جرد', icon: '📊', color: '#f59e0b' },
    production: { name: 'إنتاج', icon: '🏭', color: '#8b5cf6' },
    other: { name: 'أخرى', icon: '📋', color: '#6b7280' }
};

// NEW: List status
const LIST_STATUS = {
    active: { name: 'نشط', color: '#10b981' },
    archived: { name: 'مؤرشف', color: '#6b7280' }
};

/**
 * Initialize lists page
 */
async function initListsPage() {
    console.log('Initializing Lists Page');
    await loadListsData();
    await loadProductsForLists();
    renderListsGrid();
    updateListsStats();
}

/**
 * Load lists data
 */
async function loadListsData() {
    try {
        const lists = localStorage.getItem('lists');
        currentLists = lists ? JSON.parse(lists) : [];

        // NEW: Migrate old data structure
        currentLists = currentLists.map(migrateListData);

        // NEW: Load templates
        const templates = localStorage.getItem('list_templates');
        listTemplates = templates ? JSON.parse(templates) : [];

        // Initialize filtered lists
        filteredLists = [...currentLists];
    } catch (error) {
        console.error('Error loading lists:', error);
        currentLists = [];
        filteredLists = [];
        listTemplates = [];
    }
}

/**
 * NEW: Migrate old list data to new structure
 */
function migrateListData(list) {
    // If already migrated, return as is
    if (list.category && list.status && list.createdAt) {
        return list;
    }

    // Migrate old structure to new
    return {
        id: list.id,
        name: list.name,
        category: list.category || 'other', // NEW
        status: list.status || 'active', // NEW
        notes: list.notes || '', // NEW
        date: list.date,
        createdAt: list.createdAt || list.date || new Date().toISOString(), // NEW
        updatedAt: list.updatedAt || new Date().toISOString(), // NEW
        items: list.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes || '' // NEW
        }))
    };
}

/**
 * Save lists data
 */
function saveListsData() {
    try {
        localStorage.setItem('lists', JSON.stringify(currentLists));
    } catch (error) {
        console.error('Error saving lists:', error);
        showToast('error', 'خطأ', 'فشل حفظ البيانات');
    }
}

/**
 * NEW: Save templates data
 */
function saveTemplatesData() {
    try {
        localStorage.setItem('list_templates', JSON.stringify(listTemplates));
    } catch (error) {
        console.error('Error saving templates:', error);
        showToast('error', 'خطأ', 'فشل حفظ القوالب');
    }
}

/**
 * Load products for lists
 */
async function loadProductsForLists() {
    try {
        // Try both storage keys for compatibility
        let products = localStorage.getItem('products_advanced');
        if (!products) {
            products = localStorage.getItem('products');
        }
        currentProducts = products ? JSON.parse(products) : [];
    } catch (error) {
        console.error('Error loading products:', error);
        currentProducts = [];
    }
}

/**
 * Update lists statistics
 */
function updateListsStats() {
    const totalListsEl = document.getElementById('totalLists');
    const activeListsEl = document.getElementById('activeLists');
    const totalProductsEl = document.getElementById('totalProductsInLists');
    const mostUsedEl = document.getElementById('mostUsedProduct');

    // Total lists
    if (totalListsEl) {
        totalListsEl.textContent = currentLists.length;
    }

    // NEW: Active lists
    if (activeListsEl) {
        const activeLists = currentLists.filter(l => l.status === 'active').length;
        activeListsEl.textContent = activeLists;
    }

    // NEW: Total unique products in all lists
    if (totalProductsEl) {
        const uniqueProducts = new Set();
        currentLists.forEach(list => {
            list.items.forEach(item => uniqueProducts.add(item.productId));
        });
        totalProductsEl.textContent = uniqueProducts.size;
    }

    // NEW: Most used product
    if (mostUsedEl) {
        const productCounts = {};
        currentLists.forEach(list => {
            list.items.forEach(item => {
                productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
            });
        });

        let mostUsedId = null;
        let maxCount = 0;
        for (const [productId, count] of Object.entries(productCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostUsedId = productId;
            }
        }

        if (mostUsedId) {
            const product = currentProducts.find(p => p.id === mostUsedId);
            mostUsedEl.textContent = product ? product.name : '-';
        } else {
            mostUsedEl.textContent = '-';
        }
    }
}

/**
 * Render lists grid
 */
function renderListsGrid() {
    const grid = document.getElementById('listsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    // Use filtered lists instead of all lists
    const listsToRender = filteredLists.filter(l => l.status === 'active');

    if (listsToRender.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = listsToRender.map(list => {
        const itemsCount = list.items.length;
        const totalQuantity = list.items.reduce((sum, item) => sum + item.quantity, 0);
        const category = LIST_CATEGORIES[list.category] || LIST_CATEGORIES.other;

        return `
            <div class="list-card">
                <div class="list-card-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">${category.icon}</span>
                            <span style="padding: 0.25rem 0.75rem; background: ${category.color}20; color: ${category.color}; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                ${category.name}
                            </span>
                        </div>
                        <h3 class="list-card-title">${list.name}</h3>
                        <div class="list-card-date">${formatDateForDisplay(list.date)}</div>
                        ${list.notes ? `<div style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">📝 ${list.notes.substring(0, 50)}${list.notes.length > 50 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
                <div class="list-card-items">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #666;">عدد المنتجات:</span>
                        <strong>${itemsCount}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">إجمالي الكميات:</span>
                        <strong>${totalQuantity}</strong>
                    </div>
                </div>
                <div class="list-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewList('${list.id}')" style="flex: 1;">
                        👁️ عرض
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editList('${list.id}')" title="تعديل">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="duplicateList('${list.id}')" title="نسخ">
                        📋
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="printList('${list.id}')" title="طباعة">
                        🖨️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteList('${list.id}')" title="حذف">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * NEW: Filter lists by category
 */
function filterListsByCategory(category) {
    if (!category) {
        filteredLists = [...currentLists];
    } else {
        filteredLists = currentLists.filter(l => l.category === category);
    }
    renderListsGrid();
}

/**
 * NEW: Filter lists by status
 */
function filterListsByStatus(status) {
    if (!status) {
        filteredLists = [...currentLists];
    } else {
        filteredLists = currentLists.filter(l => l.status === status);
    }
    renderListsGrid();
}

/**
 * NEW: Search lists
 */
function searchLists(query) {
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
        filteredLists = [...currentLists];
        renderListsGrid();
        return;
    }

    filteredLists = currentLists.filter(list => {
        // Search in list name
        if (list.name.toLowerCase().includes(searchQuery)) return true;

        // Search in notes
        if (list.notes && list.notes.toLowerCase().includes(searchQuery)) return true;

        // Search in products
        const hasProduct = list.items.some(item => {
            const product = currentProducts.find(p => p.id === item.productId);
            return product && (
                product.name.toLowerCase().includes(searchQuery) ||
                product.code.toLowerCase().includes(searchQuery)
            );
        });

        return hasProduct;
    });

    renderListsGrid();
}

/**
 * NEW: Sort lists
 */
function sortLists(sortBy) {
    switch (sortBy) {
        case 'name-asc':
            filteredLists.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            break;
        case 'name-desc':
            filteredLists.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
            break;
        case 'date-new':
            filteredLists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'date-old':
            filteredLists.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'items-most':
            filteredLists.sort((a, b) => b.items.length - a.items.length);
            break;
        case 'items-least':
            filteredLists.sort((a, b) => a.items.length - b.items.length);
            break;
    }
    renderListsGrid();
}

/**
 * Open new list modal
 */
function openNewListModal(listId = null) {
    if (currentProducts.length === 0) {
        showToast('warning', 'تحذير', 'يجب إضافة منتجات أولاً من صفحة المنتجات');
        return;
    }

    const modal = document.getElementById('newListModal');
    if (!modal) return;

    editingListId = listId;

    if (listId) {
        // Edit mode
        const list = currentLists.find(l => l.id === listId);
        if (!list) return;

        document.getElementById('listName').value = list.name;
        document.getElementById('listCategory').value = list.category || 'other';
        document.getElementById('listNotes').value = list.notes || '';
        document.getElementById('modalTitle').textContent = 'تعديل القائمة';

        // Load existing items
        selectedListItems.clear();
        list.items.forEach(item => {
            selectedListItems.set(item.productId, item.quantity);
        });
    } else {
        // Create mode
        document.getElementById('listName').value = '';
        document.getElementById('listCategory').value = 'other';
        document.getElementById('listNotes').value = '';
        document.getElementById('modalTitle').textContent = 'قائمة جديدة';
        selectedListItems.clear();
    }

    renderProductsList();
    updateLivePreview();
    modal.style.display = 'flex';
}

/**
 * Close new list modal
 */
function closeNewListModal() {
    const modal = document.getElementById('newListModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Render products list for selection
 */
function renderProductsList(productsToRender = null) {
    const container = document.getElementById('productsListContainer');
    if (!container) return;

    const products = productsToRender || currentProducts;

    if (products.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">لا توجد منتجات</div>';
        return;
    }

    container.innerHTML = products.map(product => {
        const quantity = selectedListItems.get(product.id) || 0;

        return `
            <div class="product-list-item">
                <input type="checkbox" 
                    ${quantity > 0 ? 'checked' : ''}
                    onchange="toggleProductInList('${product.id}', this.checked)">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${product.name}</div>
                    <div style="font-size: 0.875rem; color: #666;">${product.code} - ${product.unit}</div>
                </div>
                <input type="number" 
                    min="1" 
                    value="${quantity || 1}"
                    ${quantity === 0 ? 'disabled' : ''}
                    onchange="updateProductQuantity('${product.id}', this.value)"
                    placeholder="الكمية">
            </div>
        `;
    }).join('');
}

/**
 * Toggle product in list
 */
function toggleProductInList(productId, checked) {
    if (checked) {
        selectedListItems.set(productId, 1);
    } else {
        selectedListItems.delete(productId);
    }
    renderProductsList();
    updateLivePreview(); // NEW: Update preview
}

/**
 * Update product quantity
 */
function updateProductQuantity(productId, value) {
    const quantity = parseInt(value) || 1;
    if (quantity > 0) {
        selectedListItems.set(productId, quantity);
        updateLivePreview(); // NEW: Update preview
    }
}

/**
 * Filter list products
 */
function filterListProducts(query) {
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
        renderProductsList();
        return;
    }

    const filtered = currentProducts.filter(p =>
        p.code.toLowerCase().includes(searchQuery) ||
        p.name.toLowerCase().includes(searchQuery)
    );

    renderProductsList(filtered);
}

/**
 * Save new list
 */
function saveNewList() {
    const name = document.getElementById('listName').value.trim();
    const category = document.getElementById('listCategory').value;
    const notes = document.getElementById('listNotes').value.trim();

    if (!name) {
        showToast('warning', 'تحذير', 'يرجى إدخال اسم القائمة');
        return;
    }

    if (selectedListItems.size === 0) {
        showToast('warning', 'تحذير', 'يرجى اختيار منتج واحد على الأقل');
        return;
    }

    const listData = {
        name: name,
        category: category || 'other',
        status: 'active',
        notes: notes,
        date: new Date().toISOString().split('T')[0],
        items: Array.from(selectedListItems.entries()).map(([productId, quantity]) => ({
            productId,
            quantity,
            notes: ''
        }))
    };

    if (editingListId) {
        // Update existing list
        const index = currentLists.findIndex(l => l.id === editingListId);
        if (index !== -1) {
            currentLists[index] = {
                ...currentLists[index],
                ...listData,
                updatedAt: new Date().toISOString()
            };
            showToast('success', 'نجح', 'تم تحديث القائمة بنجاح');
        }
    } else {
        // Create new list
        const newList = {
            id: Date.now().toString(),
            ...listData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        currentLists.unshift(newList);
        showToast('success', 'نجح', 'تم حفظ القائمة بنجاح');
    }

    saveListsData();
    filteredLists = [...currentLists];
    renderListsGrid();
    updateListsStats();
    closeNewListModal();
}

/**
 * NEW: Edit list
 */
function editList(listId) {
    openNewListModal(listId);
}

/**
 * NEW: Duplicate list
 */
function duplicateList(listId) {
    const list = currentLists.find(l => l.id === listId);
    if (!list) return;

    const newList = {
        ...list,
        id: Date.now().toString(),
        name: `${list.name} (نسخة)`,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    currentLists.unshift(newList);
    saveListsData();
    filteredLists = [...currentLists];
    renderListsGrid();
    updateListsStats();

    showToast('success', 'نجح', 'تم نسخ القائمة بنجاح');
}

/**
 * NEW: Archive list
 */
function archiveList(listId) {
    const list = currentLists.find(l => l.id === listId);
    if (!list) return;

    list.status = 'archived';
    list.updatedAt = new Date().toISOString();

    saveListsData();
    filteredLists = [...currentLists];
    renderListsGrid();
    updateListsStats();

    showToast('success', 'نجح', 'تم أرشفة القائمة');
}

/**
 * NEW: Update live preview
 */
function updateLivePreview() {
    const preview = document.getElementById('livePreview');
    if (!preview) return;

    if (selectedListItems.size === 0) {
        preview.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">لم يتم اختيار أي منتجات</div>';
        return;
    }

    let totalQuantity = 0;
    let html = '<div style="padding: 1rem;"><h4 style="margin: 0 0 1rem 0;">المنتجات المحددة:</h4><div style="display: flex; flex-direction: column; gap: 0.5rem;">';

    selectedListItems.forEach((quantity, productId) => {
        const product = currentProducts.find(p => p.id === productId);
        if (product) {
            totalQuantity += quantity;
            html += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                    <span>${product.name}</span>
                    <strong>${quantity} ${product.unit}</strong>
                </div>
            `;
        }
    });

    html += `</div><div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #ddd; display: flex; justify-content: space-between; font-weight: bold;">
        <span>الإجمالي:</span>
        <span>${selectedListItems.size} منتج - ${totalQuantity} قطعة</span>
    </div></div>`;

    preview.innerHTML = html;
}

/**
 * View list details
 */
function viewList(listId) {
    const list = currentLists.find(l => l.id === listId);
    if (!list) return;

    viewingListId = listId;
    const modal = document.getElementById('viewListModal');
    const title = document.getElementById('viewListTitle');
    const content = document.getElementById('viewListContent');

    if (!modal || !title || !content) return;

    title.textContent = list.name;

    let html = `
        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: #666;">التاريخ:</span>
                <strong>${formatDateForDisplay(list.date)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #666;">عدد المنتجات:</span>
                <strong>${list.items.length}</strong>
            </div>
        </div>
        <table class="table" style="width: 100%;">
            <thead>
                <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الوحدة</th>
                    <th>الكمية</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.items.forEach((item, index) => {
        const product = currentProducts.find(p => p.id === item.productId);
        if (product) {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td>${product.unit}</td>
                    <td><strong>${item.quantity}</strong></td>
                </tr>
            `;
        }
    });

    html += '</tbody></table>';
    content.innerHTML = html;
    modal.style.display = 'flex';
}

/**
 * Close view list modal
 */
function closeViewListModal() {
    const modal = document.getElementById('viewListModal');
    if (modal) {
        modal.style.display = 'none';
    }
    viewingListId = null;
}

/**
 * Print current list
 */
function printCurrentList() {
    if (viewingListId) {
        printList(viewingListId);
    }
}

/**
 * Print list
 */
function printList(listId) {
    const list = currentLists.find(l => l.id === listId);
    if (!list) return;

    const printWindow = window.open('', '_blank');

    let itemsHtml = '';
    let totalQuantity = 0;

    list.items.forEach((item, index) => {
        const product = currentProducts.find(p => p.id === item.productId);
        if (product) {
            totalQuantity += item.quantity;
            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.code}</td>
                    <td>${product.name}</td>
                    <td>${product.unit}</td>
                    <td style="text-align: center;"><strong>${item.quantity}</strong></td>
                </tr>
            `;
        }
    });

    const printHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${list.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 20mm; }
                .print-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0078D4; padding-bottom: 20px; }
                .print-header h1 { color: #0078D4; margin-bottom: 10px; }
                .print-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #0078D4; color: white; padding: 12px 8px; text-align: right; border: 1px solid #005a9e; }
                td { padding: 10px 8px; border: 1px solid #ddd; }
                tbody tr:nth-child(even) { background: #f8f9fa; }
                tfoot td { background: #e3f2fd; font-weight: bold; border-top: 2px solid #0078D4; }
                .print-footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; text-align: center; font-size: 12px; color: #666; }
                @media print { body { padding: 10mm; } }
                @page { size: A4; margin: 15mm; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>📋 ${list.name}</h1>
                <p>قائمة المنتجات</p>
            </div>
            
            <div class="print-info">
                <div><strong>التاريخ:</strong> ${formatDateForDisplay(list.date)}</div>
                <div><strong>عدد المنتجات:</strong> ${list.items.length}</div>
                <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-SA')}</div>
                <div><strong>إجمالي الكميات:</strong> ${totalQuantity}</div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>الكود</th>
                        <th>اسم المنتج</th>
                        <th>الوحدة</th>
                        <th style="width: 100px; text-align: center;">الكمية</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="text-align: right;">الإجمالي</td>
                        <td style="text-align: center;">${totalQuantity}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="print-footer">
                <div>تم استخراج هذه القائمة من النظام الآلي</div>
                <div style="margin-top: 5px;">تصميم وتطوير: م. خالد</div>
            </div>
            
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
}

/**
 * Delete list
 */
function deleteList(listId) {
    const list = currentLists.find(l => l.id === listId);
    if (!list) return;

    const confirmed = confirm(`هل أنت متأكد من حذف القائمة "${list.name}"؟`);
    if (!confirmed) return;

    currentLists = currentLists.filter(l => l.id !== listId);
    saveListsData();
    renderListsGrid();
    updateListsStats();

    showToast('success', 'نجح', 'تم حذف القائمة');
}

// Initialize when page loads
window.addEventListener('pageLoaded', function (e) {
    if (e.detail.page === 'lists') {
        initListsPage();
    }
});

// Export functions
window.initListsPage = initListsPage;
window.openNewListModal = openNewListModal;
window.closeNewListModal = closeNewListModal;
window.saveNewList = saveNewList;
window.editList = editList; // NEW
window.duplicateList = duplicateList; // NEW
window.archiveList = archiveList; // NEW
window.viewList = viewList;
window.closeViewListModal = closeViewListModal;
window.printList = printList;
window.printCurrentList = printCurrentList;
window.deleteList = deleteList;
window.toggleProductInList = toggleProductInList;
window.updateProductQuantity = updateProductQuantity;
window.filterListProducts = filterListProducts;
window.searchLists = searchLists; // NEW
window.filterListsByCategory = filterListsByCategory; // NEW
window.filterListsByStatus = filterListsByStatus; // NEW
window.sortLists = sortLists; // NEW
window.updateLivePreview = updateLivePreview; // NEW
