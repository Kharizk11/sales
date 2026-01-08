// Advanced Sales Form with Smart Features
// نموذج المبيعات المتقدم مع الميزات الذكية

class AdvancedSalesForm {
  constructor() {
    this.cart = [];
    this.products = this.loadProducts();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSuggestions();
    this.loadBranches();
  }

  async loadBranches() {
    const branchSelect = document.getElementById('saleBranch');
    if (!branchSelect) return;

    try {
      // Wait for getBranches to be available if needed
      if (typeof window.getBranches !== 'function') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (typeof window.getBranches === 'function') {
        const branches = await window.getBranches();

        // Keep the first option (placeholder)
        const placeholder = branchSelect.options[0];
        branchSelect.innerHTML = '';
        branchSelect.appendChild(placeholder);

        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.name;
          option.textContent = `🏢 ${branch.name}`;
          branchSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      this.showToast('error', 'خطأ', 'فشل تحميل الفروع');
    }
  }

  async loadBranches() {
    const branchSelect = document.getElementById('saleBranch');
    if (!branchSelect) return;

    try {
      // Wait for getBranches to be available if needed
      if (typeof window.getBranches !== 'function') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (typeof window.getBranches === 'function') {
        const branches = await window.getBranches();

        // Keep the first option (placeholder)
        const placeholder = branchSelect.options[0];
        branchSelect.innerHTML = '';
        branchSelect.appendChild(placeholder);

        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.name;
          option.textContent = `🏢 ${branch.name}`;
          branchSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      this.showToast('error', 'خطأ', 'فشل تحميل الفروع');
    }
  }

  // Load products (mock data - replace with real data)
  loadProducts() {
    return [
      { id: 1, name: 'منتج أ', price: 100, stock: 50, category: 'إلكترونيات' },
      { id: 2, name: 'منتج ب', price: 250, stock: 30, category: 'ملابس' },
      { id: 3, name: 'منتج ج', price: 75, stock: 100, category: 'أغذية' },
      { id: 4, name: 'منتج د', price: 500, stock: 15, category: 'إلكترونيات' },
      { id: 5, name: 'منتج هـ', price: 150, stock: 45, category: 'أدوات منزلية' }
    ];
  }

  setupEventListeners() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
      searchInput.addEventListener('focus', () => this.showSuggestions());
    }

    // Real-time validation
    const amountInput = document.getElementById('saleAmount');
    if (amountInput) {
      amountInput.addEventListener('input', (e) => this.validateAmount(e.target.value));
    }

    const dateInput = document.getElementById('saleDate');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => this.validateDate(e.target.value));
    }
  }

  // ... (searchProducts, displaySearchResults, hideSuggestions, showSuggestions, addToCart, removeFromCart, updateQuantity, updateCartDisplay, validateAmount, validateDate, loadSuggestions methods remain the same) ...
  // Note: Since replace_file_content replaces a block, I need to be careful not to cut off methods if I don't include them.
  // However, the user wants me to update specific parts.
  // I will use multi_replace_file_content to be safer or just replace the init and submit parts.
  // Let's use replace_file_content for the whole file or chunks.
  // Actually, I should use multi_replace_file_content to update init and submitForm separately.
  // But since I'm already in replace_file_content tool call, I will cancel this and use multi_replace_file_content.
  // Wait, I cannot cancel. I must complete the tool call.
  // I will replace the init method first.


  // Smart product search with autocomplete
  searchProducts(query) {
    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }

    const results = this.products.filter(p =>
      p.name.includes(query) ||
      p.category.includes(query)
    );

    this.displaySearchResults(results);
  }

  displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: var(--spacing-md); text-align: center;">
          <p style="color: var(--text-muted);">🔍 لم يتم العثور على منتجات</p>
        </div>
      `;
      container.style.display = 'block';
      return;
    }

    container.innerHTML = results.map(product => `
      <div class="glass-card animate-fadeIn" style="padding: var(--spacing-md); margin-bottom: var(--spacing-sm); cursor: pointer;" 
           onclick="advancedSalesForm.addToCart(${product.id})">
        <div class="flex justify-between items-center">
          <div>
            <h4 style="margin-bottom: var(--spacing-xs);">${product.name}</h4>
            <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
              ${product.category} • المخزون: ${product.stock}
            </p>
          </div>
          <div class="gradient-text" style="font-size: var(--font-size-lg); font-weight: 700;">
            ${product.price} ريال
          </div>
        </div>
      </div>
    `).join('');

    container.style.display = 'block';
  }

  hideSuggestions() {
    const container = document.getElementById('searchResults');
    if (container) {
      container.style.display = 'none';
    }
  }

  showSuggestions() {
    // Show popular products
    const popular = this.products.slice(0, 3);
    this.displaySearchResults(popular);
  }

  // Add product to cart
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Check if already in cart
    const existingItem = this.cart.find(item => item.id === productId);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        this.showToast('success', 'تم التحديث', `تم زيادة الكمية إلى ${existingItem.quantity}`);
      } else {
        this.showToast('warning', 'تحذير', 'المخزون غير كافٍ');
        return;
      }
    } else {
      this.cart.push({
        ...product,
        quantity: 1
      });
      this.showToast('success', 'تمت الإضافة', `تمت إضافة ${product.name} إلى السلة`);
    }

    this.updateCartDisplay();
    this.hideSuggestions();
    document.getElementById('productSearch').value = '';
  }

  // Remove from cart
  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.updateCartDisplay();
    this.showToast('info', 'تم الحذف', 'تم حذف المنتج من السلة');
  }

  // Update quantity
  updateQuantity(productId, change) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      this.showToast('warning', 'تحذير', 'المخزون غير كافٍ');
      return;
    }

    item.quantity = newQuantity;
    this.updateCartDisplay();
  }

  // Update cart display
  updateCartDisplay() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="padding: var(--spacing-lg); color: var(--text-muted);">
          🛒 السلة فارغة
        </div>
      `;
      if (totalElement) totalElement.textContent = '0.00';
      return;
    }

    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    container.innerHTML = this.cart.map(item => `
      <div class="glass-card animate-fadeIn" style="padding: var(--spacing-md); margin-bottom: var(--spacing-sm);">
        <div class="flex justify-between items-center">
          <div style="flex: 1;">
            <h4 style="margin-bottom: var(--spacing-xs);">${item.name}</h4>
            <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
              ${item.price} ريال × ${item.quantity}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <button class="btn-modern btn-glass" style="padding: 0.5rem; width: 36px; height: 36px;" 
                    onclick="advancedSalesForm.updateQuantity(${item.id}, -1)">
              −
            </button>
            <span style="min-width: 30px; text-align: center; font-weight: 700;">${item.quantity}</span>
            <button class="btn-modern btn-glass" style="padding: 0.5rem; width: 36px; height: 36px;" 
                    onclick="advancedSalesForm.updateQuantity(${item.id}, 1)">
              +
            </button>
            <button class="btn-modern" style="padding: 0.5rem; width: 36px; height: 36px; background: var(--secondary-gradient); color: white;" 
                    onclick="advancedSalesForm.removeFromCart(${item.id})">
              🗑️
            </button>
          </div>
        </div>
        
        <div style="margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px solid var(--glass-border);">
          <div class="flex justify-between">
            <span style="color: var(--text-muted);">الإجمالي:</span>
            <span class="gradient-text" style="font-weight: 700; font-size: var(--font-size-lg);">
              ${(item.price * item.quantity).toFixed(2)} ريال
            </span>
          </div>
        </div>
      </div>
    `).join('');

    if (totalElement) {
      totalElement.textContent = total.toFixed(2);
    }

    // Update hidden input for form submission
    const cartDataInput = document.getElementById('cartData');
    if (cartDataInput) {
      cartDataInput.value = JSON.stringify(this.cart);
    }
  }

  // Smart validation
  validateAmount(amount) {
    const value = parseFloat(amount);
    const feedback = document.getElementById('amountFeedback');

    if (!feedback) return;

    if (isNaN(value) || value <= 0) {
      feedback.innerHTML = `
        <div style="color: var(--warning-start); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
          ⚠️ يرجى إدخال مبلغ صحيح
        </div>
      `;
      return false;
    }

    // AI-powered anomaly detection
    const avgSale = 500; // This should come from historical data
    const threshold = avgSale * 3;

    if (value > threshold) {
      feedback.innerHTML = `
        <div style="color: var(--warning-start); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
          ⚠️ هذا المبلغ أعلى من المعتاد بـ ${((value / avgSale - 1) * 100).toFixed(0)}%. هل أنت متأكد؟
        </div>
      `;
    } else {
      feedback.innerHTML = `
        <div style="color: var(--success-start); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
          ✅ المبلغ صحيح
        </div>
      `;
    }

    return true;
  }

  validateDate(date) {
    const feedback = document.getElementById('dateFeedback');
    if (!feedback) return;

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      feedback.innerHTML = `
        <div style="color: var(--warning-start); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
          ⚠️ لا يمكن تسجيل مبيعات في المستقبل
        </div>
      `;
      return false;
    }

    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    feedback.innerHTML = `
      <div style="color: var(--text-muted); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
        📅 ${dayNames[dayOfWeek]} - يوم عمل عادي
      </div>
    `;

    return true;
  }

  // Load smart suggestions
  loadSuggestions() {
    // This would use AI to suggest products based on:
    // - Time of day
    // - Day of week
    // - Historical patterns
    // - Current trends

    const suggestions = this.products.slice(0, 3);
    const container = document.getElementById('smartSuggestions');

    if (!container) return;

    container.innerHTML = `
      <div class="glass-card" style="padding: var(--spacing-md);">
        <h4 style="margin-bottom: var(--spacing-md);">💡 اقتراحات ذكية</h4>
        <div style="display: grid; gap: var(--spacing-sm);">
          ${suggestions.map(product => `
            <div class="flex justify-between items-center" style="padding: var(--spacing-sm); background: var(--glass-bg); border-radius: var(--radius-sm); cursor: pointer;"
                 onclick="advancedSalesForm.addToCart(${product.id})">
              <span>${product.name}</span>
              <span class="gradient-text" style="font-weight: 700;">${product.price} ريال</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Submit form
  async submitForm(event) {
    event.preventDefault();

    if (this.cart.length === 0) {
      this.showToast('warning', 'تحذير', 'يرجى إضافة منتجات إلى السلة');
      return;
    }

    const date = document.getElementById('saleDate').value;
    const branch = document.getElementById('saleBranch').value;
    const notes = document.getElementById('saleNotes')?.value || '';
    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create description from items
    const itemNames = this.cart.map(item => `${item.name} (${item.quantity})`).join(', ');
    const description = `مبيعات: ${itemNames}`;

    // Store cart details in notes (JSON) for future reference
    const cartDetails = JSON.stringify(this.cart);
    const fullNotes = `${notes}\n\n[Cart Details]: ${cartDetails}`;

    // Show loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner-modern" style="width: 20px; height: 20px; border-width: 2px;"></div>';
    submitBtn.disabled = true;

    try {
      // Use the centralized saveSales function
      if (typeof window.saveSales === 'function') {
        let currentSales = [];
        if (typeof window.getSales === 'function') {
          currentSales = await window.getSales();
        }

        const newSale = {
          id: Date.now().toString(),
          date: date,
          branch: branch,
          amount: total,
          description: description,
          notes: fullNotes,
          createdAt: new Date().toISOString()
        };

        currentSales.push(newSale);
        await window.saveSales(currentSales);

        this.showToast('success', 'نجح', 'تم حفظ المبيعات بنجاح');
        this.resetForm();

        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('salesUpdated', { detail: currentSales }));
      } else {
        // Fallback if saveSales is not available
        console.warn('saveSales not found, using localStorage fallback');
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        sales.push({
          id: Date.now(),
          date: date,
          branch: branch,
          amount: total,
          description: description,
          notes: fullNotes,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('sales', JSON.stringify(sales));
        this.showToast('success', 'نجح', 'تم حفظ المبيعات بنجاح (محلي)');
        this.resetForm();
      }
    } catch (error) {
      console.error('Error saving sales:', error);
      this.showToast('error', 'خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  resetForm() {
    this.cart = [];
    this.updateCartDisplay();
    document.getElementById('advancedSalesForm')?.reset();
    document.getElementById('productSearch').value = '';
    this.hideSuggestions();
  }

  showToast(type, title, message) {
    if (typeof showToast === 'function') {
      showToast(type, title, message);
    } else {
      alert(`${title}\n${message}`);
    }
  }
}

// Initialize
let advancedSalesForm;
document.addEventListener('DOMContentLoaded', () => {
  advancedSalesForm = new AdvancedSalesForm();
});

// Export for global access
window.AdvancedSalesForm = AdvancedSalesForm;
