// Analytics Page Logic - SAP Fiori Style

// HTML Templates for different reports
const REPORT_TEMPLATES = {
    daily: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">التقرير اليومي</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="date" id="reportDate" class="sap-input" style="width: auto;">
                    <button class="btn-sap btn-emphasized" onclick="generateReport()">🔄 تحديث</button>
                </div>
            </div>
            <div class="sap-card-content">
                <div id="reportPaper" style="background: white; padding: 20px; border: 1px solid #eee;">
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px;">
                        <h3 style="color: var(--sap-primary); margin-bottom: 5px;">تقرير المبيعات اليومي</h3>
                        <div style="color: #666; font-size: 0.9rem;">
                            <span id="displayDate">--/--/----</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
                            <div style="color: #666; font-size: 0.9rem;">إجمالي اليوم</div>
                            <div id="todayTotal" style="color: var(--sap-primary); font-size: 1.8rem; font-weight: bold;">0.00</div>
                            <div style="color: #888; font-size: 0.8rem;">ريال سعودي</div>
                        </div>
                        <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 4px; text-align: center;">
                            <div style="color: #666; font-size: 0.9rem;">المتوسط الشهري</div>
                            <div id="monthlyAverage" style="color: #333; font-size: 1.4rem; font-weight: bold;">0.00</div>
                        </div>
                        <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 4px; text-align: center;">
                            <div style="color: #666; font-size: 0.9rem;">إجمالي الشهر</div>
                            <div id="monthTotal" style="color: #333; font-size: 1.4rem; font-weight: bold;">0.00</div>
                        </div>
                    </div>

                    <div style="background: #fafafa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>عدد العمليات:</span>
                            <span id="transactionsCount" style="font-weight: bold;">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>أعلى عملية:</span>
                            <span id="maxTransaction" style="font-weight: bold;">0.00</span>
                        </div>
                    </div>

                    <div style="text-align: center; color: #999; font-size: 0.8rem;">
                        <p>تم الإنشاء: <span id="generationTime">--:--</span></p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                    <button class="btn-sap btn-standard" onclick="copyReportText()">📋 نسخ النص</button>
                    <button class="btn-sap btn-emphasized" onclick="printReport()">🖨️ طباعة</button>
                </div>
            </div>
        </div>
    `,
    monthly: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">التقرير الشهري</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <select id="mbrBranch" class="sap-input" style="width: auto;">
                        <option value="">كل الفروع</option>
                    </select>
                    <input type="month" id="mbrFromDate" class="sap-input" style="width: auto;">
                    <span>إلى</span>
                    <input type="month" id="mbrToDate" class="sap-input" style="width: auto;">
                    <select id="mbrReportType" class="sap-input" style="width: auto;">
                        <option value="summary">ملخص شهري</option>
                        <option value="detailed">تفصيلي (يومي)</option>
                    </select>
                    
                    <button class="btn-sap btn-emphasized" onclick="generateMonthlyBranchReport()">🔄 عرض</button>
                    <button class="btn-sap btn-standard" onclick="printMonthlyBranchReport()">🖨️ طباعة</button>
                </div>
            </div>
            <div class="sap-card-content" style="padding: 0;">
                <div id="summaryReportSection">
                    <div style="overflow-x: auto;">
                        <table class="sap-table" id="mbrTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الفرع</th>
                                    <th>الشهر / السنة</th>
                                    <th>عدد العمليات</th>
                                    <th>المتوسط</th>
                                    <th>النسبة</th>
                                    <th>إجمالي المبيعات</th>
                                </tr>
                            </thead>
                            <tbody id="mbrBody"></tbody>
                            <tfoot id="mbrFoot"></tfoot>
                        </table>
                    </div>
                </div>

                <div id="detailedReportSection" style="display: none;">
                    <div style="overflow-x: auto;">
                        <table class="sap-table" id="mbrDetailedTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>التاريخ</th>
                                    <th>الفرع</th>
                                    <th>عدد العمليات</th>
                                    <th>إجمالي المبيعات</th>
                                    <th>المتوسط</th>
                                </tr>
                            </thead>
                            <tbody id="mbrDetailedBody"></tbody>
                            <tfoot id="mbrDetailedFoot"></tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    custom: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">تقرير مخصص</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label>من:</label>
                    <input type="date" id="customFromDate" class="sap-input" style="width: auto;">
                    <label>إلى:</label>
                    <input type="date" id="customToDate" class="sap-input" style="width: auto;">
                    <button class="btn-sap btn-emphasized" onclick="generateCustomReport()">🔄 عرض التقرير</button>
                </div>
            </div>
            <div class="sap-card-content">
                <div id="customReportContent" style="display: none;">
                    <div style="background: white; padding: 25px; border: 1px solid #eee; max-width: 800px; margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid var(--sap-primary); padding-bottom: 15px;">
                            <h2 style="color: var(--sap-primary); margin: 0 0 10px 0;">تقرير المبيعات المخصص</h2>
                            <div style="color: #666;">
                                الفترة من <span id="displayFromDate" style="font-weight: bold;"></span> 
                                إلى <span id="displayToDate" style="font-weight: bold;"></span>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                            <div style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; text-align: center;">
                                <div style="color: #666; font-size: 0.9rem;">إجمالي المبيعات</div>
                                <div id="customTotalSales" style="color: var(--sap-primary); font-size: 1.6rem; font-weight: bold;">0.00</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center;">
                                <div style="color: #666; font-size: 0.9rem;">عدد العمليات</div>
                                <div id="customTxCount" style="color: #333; font-size: 1.6rem; font-weight: bold;">0</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center;">
                                <div style="color: #666; font-size: 0.9rem;">المتوسط اليومي</div>
                                <div id="customDailyAvg" style="color: #333; font-size: 1.6rem; font-weight: bold;">0.00</div>
                            </div>
                        </div>

                        <div id="customBranchesSection">
                            <h3 style="font-size: 1.1rem; border-right: 4px solid var(--sap-text-secondary); padding-right: 10px; margin-bottom: 15px;">تفاصيل الفروع</h3>
                            <table class="sap-table">
                                <thead>
                                    <tr>
                                        <th>الفرع</th>
                                        <th>عدد العمليات</th>
                                        <th>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody id="customBranchesBody"></tbody>
                            </table>
                        </div>

                        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 0.8rem;">
                            تم استخراج التقرير بتاريخ <span id="customPrintDate"></span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button class="btn-sap btn-standard" onclick="printCustomReport()">🖨️ طباعة التقرير</button>
                    </div>
                </div>
                
                <div id="customEmptyState" style="padding: 40px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                    <h3>اختر الفترة الزمنية</h3>
                    <p>حدد تاريخ البداية والنهاية لعرض التقرير</p>
                </div>
            </div>
        </div>
    `,
    branches: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">أداء الفروع</h3>
                <button class="btn-sap btn-emphasized" onclick="generateBranchesReport()">🔄 تحديث البيانات</button>
            </div>
            <div class="sap-card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <!-- Top Performing Branch -->
                    <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; color: #666; font-size: 1rem;">🏆 الفرع الأفضل أداءً</h3>
                        <div id="topBranchName" style="font-size: 1.8rem; font-weight: bold; color: var(--sap-primary); margin-bottom: 5px;">-</div>
                        <div id="topBranchValue" style="font-size: 1.2rem; color: var(--sap-success);">-</div>
                    </div>

                    <!-- Branch Comparison Chart -->
                    <div style="grid-column: 1 / -1; background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.1rem;">مقارنة المبيعات</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="branchesComparisonChart"></canvas>
                        </div>
                    </div>

                    <!-- Detailed List -->
                    <div style="grid-column: 1 / -1; background: white; padding: 0; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1); overflow: hidden;">
                        <h3 style="margin: 15px; font-size: 1.1rem;">قائمة الفروع</h3>
                        <table class="sap-table">
                            <thead>
                                <tr>
                                    <th>الترتيب</th>
                                    <th>الفرع</th>
                                    <th>عدد العمليات</th>
                                    <th>متوسط العملية</th>
                                    <th>الإجمالي</th>
                                    <th>الأداء</th>
                                </tr>
                            </thead>
                            <tbody id="branchesPerformanceBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    matrix: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">مصفوفة المبيعات الشهرية</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
                    <div>
                        <label class="sap-label">الفرع</label>
                        <select id="matrixBranch" class="sap-input" style="width: 160px;">
                            <option value="">كل الفروع</option>
                        </select>
                    </div>
                    <div>
                        <label class="sap-label">من شهر</label>
                        <input type="month" id="matrixFromMonth" class="sap-input" style="width: 150px;">
                    </div>
                    <div>
                        <label class="sap-label">إلى شهر</label>
                        <input type="month" id="matrixToMonth" class="sap-input" style="width: 150px;">
                    </div>
                    
                    <button class="btn-sap btn-emphasized" onclick="generateMatrixReport()">🔄 عرض</button>
                    <button class="btn-sap btn-standard" onclick="printMatrixReport(false)">🖨️ طباعة</button>
                    <button class="btn-sap btn-standard" onclick="exportMatrixToExcel()">📊 Excel</button>
                </div>
            </div>
            <div class="sap-card-content" style="padding: 0;">
                <div id="matrixReportContent" style="padding: 1rem;">
                    <!-- Content will be injected by matrix-report.js -->
                </div>
            </div>
        </div>
    `,
    ai: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">🤖 التحليل الذكي</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-sap btn-standard" onclick="printAIReport()">🖨️ طباعة</button>
                    <button class="btn-sap btn-emphasized" onclick="initAIAnalytics()">🔄 تحديث التحليل</button>
                </div>
            </div>
            <div class="sap-card-content">
                <div id="aiReportContent">
                    <div style="padding: 60px 20px; text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🤖</div>
                        <h3>مرحباً بك في التحليل الذكي</h3>
                        <p>انقر على زر "تحديث التحليل" لبدء تحليل البيانات بالذكاء الاصطناعي</p>
                        <button class="btn-sap btn-emphasized" onclick="initAIAnalytics()" style="margin-top: 20px;">🚀 ابدأ التحليل</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    products: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">📦 أداء المنتجات</h3>
                <button class="btn-sap btn-emphasized" onclick="generateProductsReport()">🔄 تحديث البيانات</button>
            </div>
            <div class="sap-card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 15px 0; color: #666; font-size: 1rem;">🔝 المنتج الأكثر طلباً</h3>
                        <div id="topProductName" style="font-size: 1.8rem; font-weight: bold; color: var(--sap-primary); margin-bottom: 5px;">-</div>
                        <div id="topProductValue" style="font-size: 1.2rem; color: var(--sap-success);">-</div>
                    </div>
                    <div style="grid-column: 1 / -1; background: white; padding: 0; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1); overflow: hidden;">
                        <h3 style="margin: 15px; font-size: 1.1rem;">تحليل المنتجات في القوائم</h3>
                        <table class="sap-table">
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>الكود</th>
                                    <th>عدد القوائم</th>
                                    <th>إجمالي الكمية</th>
                                    <th>توزيع الفئات</th>
                                </tr>
                            </thead>
                            <tbody id="productsPerformanceBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    yearly: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">🗓️ المقارنة السنوية</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="yearlyYear" class="sap-input" style="width: auto;"></select>
                    <button class="btn-sap btn-emphasized" onclick="generateYearlyReport()">🔄 عرض</button>
                </div>
            </div>
            <div class="sap-card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="grid-column: 1 / -1; background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.1rem;">مقارنة المبيعات الشهرية (السنة الحالية vs السابقة)</h3>
                        <div style="height: 350px; position: relative;">
                            <canvas id="yearlyComparisonChart"></canvas>
                        </div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1); text-align: center;">
                        <h3 style="margin: 0 0 10px 0; color: #666; font-size: 1rem;">نمو المبيعات</h3>
                        <div id="yearlyGrowth" style="font-size: 2rem; font-weight: bold;">0%</div>
                        <div style="color: #888;">مقارنة بالسنة السابقة</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    peak: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">📊 تحليل ذروة المبيعات</h3>
                <button class="btn-sap btn-emphasized" onclick="generatePeakReport()">🔄 تحديث البيانات</button>
            </div>
            <div class="sap-card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="grid-column: 1 / -1; background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.1rem;">المبيعات حسب أيام الأسبوع</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="peakDaysChart"></canvas>
                        </div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1); text-align: center;">
                        <h3 style="margin: 0 0 10px 0; color: #666; font-size: 1rem;">أفضل يوم للمبيعات</h3>
                        <div id="bestDayName" style="font-size: 1.8rem; font-weight: bold; color: var(--sap-primary);">-</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    branchTrends: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">📈 اتجاهات أداء الفروع</h3>
                <button class="btn-sap btn-emphasized" onclick="generateBranchTrendsReport()">🔄 تحديث البيانات</button>
            </div>
            <div class="sap-card-content">
                <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; font-size: 1.1rem;">تطور المبيعات الشهرية لكل فرع</h3>
                    <div style="height: 400px; position: relative;">
                        <canvas id="branchTrendsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `,
    categoryAnalysis: `
        <div class="sap-card">
            <div class="sap-card-header">
                <h3 class="sap-card-title">📁 تحليل فئات القوائم</h3>
                <button class="btn-sap btn-emphasized" onclick="generateCategoryAnalysisReport()">🔄 تحديث البيانات</button>
            </div>
            <div class="sap-card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.1rem;">توزيع القوائم حسب الفئة</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="categoryPieChart"></canvas>
                        </div>
                    </div>
                    <div style="background: white; padding: 0; border-radius: 4px; box-shadow: 0 0 2px rgba(0,0,0,0.1); overflow: hidden;">
                        <h3 style="margin: 15px; font-size: 1.1rem;">إحصائيات الفئات</h3>
                        <table class="sap-table">
                            <thead>
                                <tr>
                                    <th>الفئة</th>
                                    <th>عدد القوائم</th>
                                    <th>إجمالي المنتجات</th>
                                </tr>
                            </thead>
                            <tbody id="categoryStatsBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Initialize Analytics Page
async function initAnalytics() {
    console.log('Initializing Analytics Page');

    // Check URL params for report type
    const urlParams = new URLSearchParams(window.location.search);
    const reportType = urlParams.get('type') || 'daily';

    switchReport(reportType);
}

// Switch Report Type
async function switchReport(type) {
    // Update Sidebar UI
    document.querySelectorAll('.report-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Load Content
    const displayArea = document.getElementById('reportDisplayArea');
    if (!displayArea) return;

    displayArea.innerHTML = REPORT_TEMPLATES[type] || REPORT_TEMPLATES.daily;

    // Initialize specific report logic
    if (type === 'daily') {
        await loadScript('js/pages/daily-report.js');
        if (typeof initDailyReport === 'function') {
            initDailyReport();
        }
    } else if (type === 'monthly') {
        await loadScript(`js/pages/monthly-report.js?v=${Date.now()}`);
        // Initialize monthly report defaults
        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

        // Set default dates (Jan to Current Month of current year)
        const fromDateInput = document.getElementById('mbrFromDate');
        const toDateInput = document.getElementById('mbrToDate');

        if (fromDateInput && toDateInput) {
            fromDateInput.value = `${today.getFullYear()}-01`;
            toDateInput.value = currentMonth;
        }

        // Load branches for dropdown
        if (typeof loadBranchesDropdown === 'function') {
            loadBranchesDropdown();
        } else {
            // Manual load if function not available
            const branchSelect = document.getElementById('mbrBranch');
            if (branchSelect && typeof getBranches === 'function') {
                const branches = await getBranches();
                branches.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch.name;
                    option.textContent = branch.name;
                    branchSelect.appendChild(option);
                });
            }
        }

        // Generate initial report
        if (typeof generateMonthlyBranchReport === 'function') {
            generateMonthlyBranchReport();
        }
    } else if (type === 'custom') {
        // Set default dates (First day of month to Today)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        const fromInput = document.getElementById('customFromDate');
        const toInput = document.getElementById('customToDate');

        if (fromInput && toInput) {
            fromInput.value = firstDay.toISOString().split('T')[0];
            toInput.value = today.toISOString().split('T')[0];
        }
    } else if (type === 'branches') {
        generateBranchesReport();
    } else if (type === 'matrix') {
        await loadScript('js/pages/matrix-report.js');
        if (typeof initMatrixReport === 'function') {
            initMatrixReport();
        }
    } else if (type === 'products') {
        generateProductsReport();
    } else if (type === 'yearly') {
        // Populate years dropdown
        const yearSelect = document.getElementById('yearlyYear');
        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let i = 0; i < 5; i++) {
                const year = currentYear - i;
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
        }
        generateYearlyReport();
    } else if (type === 'peak') {
        generatePeakReport();
    } else if (type === 'ai') {
        await loadScript('js/pages/ai-analytics.js');
        // AI report will be initialized manually by user clicking button
    } else if (type === 'branchTrends') {
        generateBranchTrendsReport();
    } else if (type === 'categoryAnalysis') {
        generateCategoryAnalysisReport();
    }
}

// Helper to load scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// --- Custom Report Functions ---

async function generateCustomReport() {
    const fromDate = document.getElementById('customFromDate').value;
    const toDate = document.getElementById('customToDate').value;

    if (!fromDate || !toDate) {
        showToast('warning', 'تنبيه', 'يرجى تحديد الفترة الزمنية');
        return;
    }

    if (fromDate > toDate) {
        showToast('error', 'خطأ', 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
    }

    showLoading('جاري إعداد التقرير...');

    try {
        const sales = await getSales();

        // Filter sales
        const filteredSales = sales.filter(s => s.date >= fromDate && s.date <= toDate);

        // Calculate Stats
        const totalSales = filteredSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const txCount = filteredSales.length;

        // Calculate days difference
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const dailyAvg = daysDiff > 0 ? totalSales / daysDiff : 0;

        // Update UI
        document.getElementById('customTotalSales').textContent = formatMoney(totalSales) + ' ريال';
        document.getElementById('customTxCount').textContent = txCount;
        document.getElementById('customDailyAvg').textContent = formatMoney(dailyAvg) + ' ريال';

        document.getElementById('displayFromDate').textContent = fromDate;
        document.getElementById('displayToDate').textContent = toDate;
        document.getElementById('customPrintDate').textContent = new Date().toLocaleString('ar-SA');

        // Branches Breakdown
        const branchesBody = document.getElementById('customBranchesBody');
        branchesBody.innerHTML = '';

        const branchGroups = {};
        filteredSales.forEach(s => {
            if (!branchGroups[s.branch]) branchGroups[s.branch] = { count: 0, total: 0 };
            branchGroups[s.branch].count++;
            branchGroups[s.branch].total += Number(s.amount || 0);
        });

        Object.entries(branchGroups)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([branch, data]) => {
                const row = `
                    <tr>
                        <td>${branch}</td>
                        <td>${data.count}</td>
                        <td style="font-weight: bold;">${formatMoney(data.total)}</td>
                    </tr>
                `;
                branchesBody.innerHTML += row;
            });

        // Show Content
        document.getElementById('customEmptyState').style.display = 'none';
        document.getElementById('customReportContent').style.display = 'block';

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
        hideLoading();
    }
}

function printCustomReport() {
    const content = document.getElementById('customReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>تقرير مخصص</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; }
                .report-paper { border: none !important; }
                .btn-sap { display: none; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${content}
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// --- Branch Performance Functions ---

async function generateBranchesReport() {
    showLoading('جاري تحليل البيانات...');

    try {
        const sales = await getSales();
        const branches = await getBranches(); // Ensure we have branch names even if no sales

        const branchStats = {};

        // Initialize with 0
        branches.forEach(b => {
            branchStats[b.name] = { name: b.name, count: 0, total: 0 };
        });

        // Aggregate Sales
        sales.forEach(s => {
            if (!branchStats[s.branch]) branchStats[s.branch] = { name: s.branch, count: 0, total: 0 };
            branchStats[s.branch].count++;
            branchStats[s.branch].total += Number(s.amount || 0);
        });

        const sortedBranches = Object.values(branchStats).sort((a, b) => b.total - a.total);

        // Top Branch
        if (sortedBranches.length > 0) {
            document.getElementById('topBranchName').textContent = sortedBranches[0].name;
            document.getElementById('topBranchValue').textContent = formatMoney(sortedBranches[0].total) + ' ريال';
        }

        // Table
        const tbody = document.getElementById('branchesPerformanceBody');
        tbody.innerHTML = '';

        const maxTotal = sortedBranches.length > 0 ? sortedBranches[0].total : 1;

        sortedBranches.forEach((b, index) => {
            const avg = b.count > 0 ? b.total / b.count : 0;
            const percentage = (b.total / maxTotal) * 100;

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${b.name}</strong></td>
                    <td>${b.count}</td>
                    <td>${formatMoney(avg)}</td>
                    <td><strong>${formatMoney(b.total)}</strong></td>
                    <td style="width: 150px;">
                        <div style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; width: ${percentage}%; background: var(--sap-primary);"></div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Chart
        renderBranchesChart(sortedBranches);

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل بيانات الفروع');
    } finally {
        hideLoading();
    }
}

function renderBranchesChart(data) {
    const ctx = document.getElementById('branchesComparisonChart');
    if (!ctx) return;

    // Destroy existing if any (simple check, ideally track instance)
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'إجمالي المبيعات',
                data: data.map(d => d.total),
                backgroundColor: '#0A6ED1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// --- Product Performance Functions ---

async function generateProductsReport() {
    showLoading('جاري تحليل المنتجات...');

    try {
        const lists = JSON.parse(localStorage.getItem('lists') || '[]');
        const products = JSON.parse(localStorage.getItem('products_advanced') || localStorage.getItem('products') || '[]');

        const productStats = {};

        // Aggregate from lists
        lists.forEach(list => {
            list.items.forEach(item => {
                if (!productStats[item.productId]) {
                    const product = products.find(p => p.id === item.productId);
                    productStats[item.productId] = {
                        name: product ? product.name : 'منتج غير معروف',
                        code: product ? product.code : '-',
                        listCount: 0,
                        totalQty: 0,
                        categories: {}
                    };
                }
                productStats[item.productId].listCount++;
                productStats[item.productId].totalQty += Number(item.quantity || 0);

                const cat = list.category || 'other';
                productStats[item.productId].categories[cat] = (productStats[item.productId].categories[cat] || 0) + 1;
            });
        });

        const sortedProducts = Object.values(productStats).sort((a, b) => b.totalQty - a.totalQty);

        // Top Product
        if (sortedProducts.length > 0) {
            document.getElementById('topProductName').textContent = sortedProducts[0].name;
            document.getElementById('topProductValue').textContent = sortedProducts[0].totalQty + ' وحدة';
        }

        // Table
        const tbody = document.getElementById('productsPerformanceBody');
        if (tbody) {
            tbody.innerHTML = '';
            sortedProducts.forEach(p => {
                const catBadges = Object.entries(p.categories)
                    .map(([cat, count]) => `<span style="font-size: 0.7rem; padding: 2px 6px; background: #eee; border-radius: 10px; margin-left: 4px;">${cat}: ${count}</span>`)
                    .join('');

                const row = `
                    <tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.code}</td>
                        <td>${p.listCount}</td>
                        <td style="font-weight: bold;">${p.totalQty}</td>
                        <td>${catBadges}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل المنتجات');
    } finally {
        hideLoading();
    }
}

// --- Yearly Comparison Functions ---

async function generateYearlyReport() {
    const selectedYear = parseInt(document.getElementById('yearlyYear')?.value || new Date().getFullYear());
    showLoading('جاري تحليل البيانات السنوية...');

    try {
        const sales = await getSales();

        const currentYearSales = new Array(12).fill(0);
        const prevYearSales = new Array(12).fill(0);

        sales.forEach(s => {
            const date = new Date(s.date);
            const year = date.getFullYear();
            const month = date.getMonth();

            if (year === selectedYear) {
                currentYearSales[month] += Number(s.amount || 0);
            } else if (year === selectedYear - 1) {
                prevYearSales[month] += Number(s.amount || 0);
            }
        });

        const currentTotal = currentYearSales.reduce((a, b) => a + b, 0);
        const prevTotal = prevYearSales.reduce((a, b) => a + b, 0);

        // Growth
        const growthEl = document.getElementById('yearlyGrowth');
        if (growthEl) {
            if (prevTotal > 0) {
                const growth = ((currentTotal - prevTotal) / prevTotal) * 100;
                growthEl.textContent = (growth > 0 ? '+' : '') + growth.toFixed(1) + '%';
                growthEl.style.color = growth >= 0 ? 'var(--sap-success)' : 'var(--sap-error)';
            } else {
                growthEl.textContent = 'جديد';
                growthEl.style.color = 'var(--sap-primary)';
            }
        }

        // Chart
        renderYearlyChart(currentYearSales, prevYearSales, selectedYear);

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل البيانات السنوية');
    } finally {
        hideLoading();
    }
}

function renderYearlyChart(current, prev, year) {
    const ctx = document.getElementById('yearlyComparisonChart');
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: `سنة ${year}`,
                    data: current,
                    borderColor: '#0A6ED1',
                    backgroundColor: 'rgba(10, 110, 209, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: `سنة ${year - 1}`,
                    data: prev,
                    borderColor: '#888',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// --- Peak Sales Analysis Functions ---

async function generatePeakReport() {
    showLoading('جاري تحليل أوقات الذروة...');

    try {
        const sales = await getSales();

        const dayStats = new Array(7).fill(0);
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        sales.forEach(s => {
            const date = new Date(s.date);
            const day = date.getDay(); // 0 = Sunday
            dayStats[day] += Number(s.amount || 0);
        });

        // Find best day
        let maxVal = -1;
        let bestDayIdx = -1;
        dayStats.forEach((val, idx) => {
            if (val > maxVal) {
                maxVal = val;
                bestDayIdx = idx;
            }
        });

        const bestDayNameEl = document.getElementById('bestDayName');
        if (bestDayNameEl && bestDayIdx !== -1) {
            bestDayNameEl.textContent = dayNames[bestDayIdx];
        }

        // Chart
        renderPeakChart(dayStats, dayNames);

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل أوقات الذروة');
    } finally {
        hideLoading();
    }
}

// --- Branch Trends Functions ---

async function generateBranchTrendsReport() {
    showLoading('جاري تحليل اتجاهات الفروع...');

    try {
        const sales = await getSales();
        const branches = await getBranches();

        // Get last 12 months
        const months = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(d.toISOString().slice(0, 7)); // YYYY-MM
        }

        const datasets = branches.map((branch, idx) => {
            const data = months.map(month => {
                return sales
                    .filter(s => s.branch === branch.name && s.date.startsWith(month))
                    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
            });

            const colors = [
                '#0A6ED1', '#E74C3C', '#2ECC71', '#F1C40F', '#9B59B6',
                '#1ABC9C', '#E67E22', '#34495E', '#95A5A6', '#D35400'
            ];

            return {
                label: branch.name,
                data: data,
                borderColor: colors[idx % colors.length],
                backgroundColor: 'transparent',
                tension: 0.3
            };
        });

        const ctx = document.getElementById('branchTrendsChart');
        if (ctx) {
            const existingChart = Chart.getChart(ctx);
            if (existingChart) existingChart.destroy();

            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const labels = months.map(m => {
                const [y, mm] = m.split('-');
                return monthNames[parseInt(mm) - 1] + ' ' + y;
            });

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل اتجاهات الفروع');
    } finally {
        hideLoading();
    }
}

// --- Category Analysis Functions ---

async function generateCategoryAnalysisReport() {
    showLoading('جاري تحليل الفئات...');

    try {
        const lists = JSON.parse(localStorage.getItem('lists') || '[]');

        const categoryStats = {};
        // Initialize with known categories
        const LIST_CATEGORIES = {
            purchases: 'مشتريات',
            sales: 'مبيعات',
            inventory: 'جرد',
            production: 'إنتاج',
            other: 'أخرى'
        };

        Object.keys(LIST_CATEGORIES).forEach(cat => {
            categoryStats[cat] = { name: LIST_CATEGORIES[cat], count: 0, items: 0 };
        });

        lists.forEach(list => {
            const cat = list.category || 'other';
            if (!categoryStats[cat]) {
                categoryStats[cat] = { name: cat, count: 0, items: 0 };
            }
            categoryStats[cat].count++;
            categoryStats[cat].items += (list.items || []).length;
        });

        const data = Object.values(categoryStats).filter(s => s.count > 0);

        // Render Table
        const tbody = document.getElementById('categoryStatsBody');
        if (tbody) {
            tbody.innerHTML = data.map(s => `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.count}</td>
                    <td>${s.items}</td>
                </tr>
            `).join('');
        }

        // Render Chart
        const ctx = document.getElementById('categoryPieChart');
        if (ctx) {
            const existingChart = Chart.getChart(ctx);
            if (existingChart) existingChart.destroy();

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(s => s.name),
                    datasets: [{
                        data: data.map(s => s.count),
                        backgroundColor: [
                            '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

    } catch (error) {
        console.error(error);
        showToast('error', 'خطأ', 'حدث خطأ أثناء تحليل الفئات');
    } finally {
        hideLoading();
    }
}

function renderPeakChart(data, labels) {
    const ctx = document.getElementById('peakDaysChart');
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'إجمالي المبيعات',
                data: data,
                backgroundColor: 'rgba(10, 110, 209, 0.6)',
                borderColor: '#0A6ED1',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Export functions
window.initAnalytics = initAnalytics;
window.switchReport = switchReport;
window.generateCustomReport = generateCustomReport;
window.printCustomReport = printCustomReport;
window.generateBranchesReport = generateBranchesReport;
window.generateProductsReport = generateProductsReport;
window.generateYearlyReport = generateYearlyReport;
window.generatePeakReport = generatePeakReport;
window.generateBranchTrendsReport = generateBranchTrendsReport;
window.generateCategoryAnalysisReport = generateCategoryAnalysisReport;
window.generateMatrixReport = function () { }; // Placeholder until loaded
window.printMatrixReport = function () { }; // Placeholder until loaded
window.exportMatrixToExcel = function () { }; // Placeholder
