# نظام التصميم - Design System

## 🎨 نظام الألوان

### الألوان الأساسية
- **Primary**: `#017e84` - اللون الأساسي للتطبيق
- **Primary Dark**: `#005f64` - للعناصر الداكنة
- **Primary Light**: `#4a9fa5` - للعناصر الفاتحة
- **Primary Gradient**: `linear-gradient(135deg, #017e84 0%, #00a09d 100%)`

### ألوان الحالة
- **Success**: `#00a09d` - للنجاح
- **Danger**: `#d32f2f` - للأخطاء
- **Warning**: `#f57c00` - للتحذيرات
- **Info**: `#1976d2` - للمعلومات

### الألوان المحايدة
- **Background**: `#f5f7fa` - خلفية الصفحة
- **Card Background**: `#ffffff` - خلفية البطاقات
- **Text**: `#1a1a1a` - النص الأساسي
- **Text Muted**: `#718096` - النص الثانوي
- **Border**: `#e2e8f0` - الحدود

## 📏 نظام المسافات (Spacing)

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

## 🔲 Border Radius

```css
--radius-sm: 4px
--radius: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-full: 9999px
```

## 📐 Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow: 0 2px 8px rgba(0,0,0,0.08)
--shadow-md: 0 4px 12px rgba(0,0,0,0.1)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12)
--shadow-xl: 0 12px 32px rgba(0,0,0,0.15)
```

## ⏱️ Transitions

```css
--transition-fast: 0.15s ease
--transition: 0.3s ease
--transition-slow: 0.5s ease
```

## 📝 Typography

### Font Family
```css
--font-family: 'Segoe UI', 'Cairo', 'Tahoma', 'Arial', sans-serif
```

### Font Sizes
```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 30px
--font-size-4xl: 36px
```

## 🧩 Components

### Buttons
- `.btn` - Button base class
- `.btn-primary` - Primary button with gradient
- `.btn-success` - Success button
- `.btn-danger` - Danger button
- `.btn-outline` - Outline button
- `.btn-sm` - Small button

### Cards
- `.card` - Card container
- `.card-header` - Card header
- `.card-body` - Card body
- `.card-title` - Card title

### Forms
- `.form-group` - Form group container
- `.form-grid` - Grid layout for forms
- `.form-actions` - Form action buttons

### Tables
- `.table-wrapper` - Table container with scroll
- `table` - Table element
- `.table-footer` - Table footer row

### Modals
- `.modal-overlay` - Modal overlay
- `.modal` - Modal container
- `.modal-header` - Modal header
- `.modal-body` - Modal body
- `.modal-footer` - Modal footer

### Stats Cards
- `.stats-grid` - Grid container for stats
- `.stat-card` - Stat card
- `.stat-label` - Stat label
- `.stat-value` - Stat value

## 🎭 Animations

### Fade In
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

### Slide In Right
```css
@keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
```

### Spin
```css
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

### Float
```css
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
```

## 📱 Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Small Mobile */
@media (max-width: 480px) { }
```

## 🎯 Best Practices

1. **استخدم المتغيرات CSS** - لا تستخدم قيم ثابتة
2. **استخدم Utility Classes** - للأنماط الشائعة
3. **احترم نظام المسافات** - استخدم spacing variables
4. **استخدم Transitions** - للتفاعلات السلسة
5. **اختبر Responsive** - على جميع الأحجام







