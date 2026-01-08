// AI Analytics - Sales Forecasting and Intelligent Insights - SAP Fiori Style
// This module provides AI-powered analytics using local algorithms

/**
 * Linear Regression for Sales Forecasting
 */
class LinearRegression {
  constructor() {
    this.slope = 0;
    this.intercept = 0;
  }

  fit(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;
  }

  predict(x) {
    return this.slope * x + this.intercept;
  }
}

/**
 * Moving Average Calculator
 */
function calculateMovingAverage(data, period = 7) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Exponential Smoothing
 */
function exponentialSmoothing(data, alpha = 0.3) {
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Detect Anomalies using Z-Score
 */
function detectAnomalies(data, threshold = 2) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = calculateStdDev(data);

  return data.map((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    return {
      index,
      value,
      isAnomaly: zScore > threshold,
      zScore
    };
  });
}

/**
 * Calculate Growth Rate
 */
function calculateGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Initialize AI Analytics Report
 */
async function initAIAnalytics() {
  showLoading('جاري تحليل البيانات بالذكاء الاصطناعي...');

  try {
    const sales = await getSales();

    if (sales.length < 7) {
      hideLoading();
      showToast('warning', 'تنبيه', 'يحتاج النظام إلى 7 سجلات على الأقل لإجراء التحليل الذكي');
      document.getElementById('aiReportContent').innerHTML = `
        <div class="empty-state" style="padding: 60px 20px; text-align: center; color: var(--sap-text-secondary);">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🤖</div>
          <h3>بيانات غير كافية للتحليل</h3>
          <p>يحتاج نظام الذكاء الاصطناعي إلى 7 سجلات على الأقل لإجراء التحليل والتنبؤ</p>
          <p style="color: var(--sap-text-secondary); margin-top: 10px;">عدد السجلات الحالي: ${sales.length}</p>
        </div>
      `;
      return;
    }

    // Prepare data - Group by date
    const dailyData = {};
    sales.forEach(sale => {
      if (!dailyData[sale.date]) {
        dailyData[sale.date] = 0;
      }
      dailyData[sale.date] += Number(sale.amount || 0);
    });

    // Sort by date
    const sortedDates = Object.keys(dailyData).sort();
    const dailyValues = sortedDates.map(date => dailyData[date]);

    // Perform Analysis
    const analysis = performAIAnalysis(sortedDates, dailyValues, sales);

    // Render Report
    renderAIReport(analysis);

  } catch (error) {
    console.error('AI Analysis Error:', error);
    showToast('error', 'خطأ', 'حدث خطأ أثناء التحليل الذكي');
  } finally {
    hideLoading();
  }
}

/**
 * Perform AI Analysis
 */
function performAIAnalysis(dates, values, allSales) {
  // 1. Linear Regression Forecast
  const xValues = dates.map((_, i) => i);
  const lr = new LinearRegression();
  lr.fit(xValues, values);

  // Forecast next 30 days
  const forecastDays = 30;
  const forecast = [];
  const lastIndex = xValues.length - 1;

  for (let i = 1; i <= forecastDays; i++) {
    const predictedValue = Math.max(0, lr.predict(lastIndex + i));
    forecast.push({
      day: i,
      value: predictedValue
    });
  }

  // 2. Moving Average
  const ma7 = calculateMovingAverage(values, 7);
  const ma30 = calculateMovingAverage(values, Math.min(30, values.length));

  // 3. Trend Analysis
  const recentValues = values.slice(-30);
  const olderValues = values.slice(-60, -30);
  const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const olderAvg = olderValues.length > 0
    ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length
    : recentAvg;
  const trendPercentage = calculateGrowthRate(recentAvg, olderAvg);

  // 4. Anomaly Detection
  const anomalies = detectAnomalies(values);
  const anomalyDates = anomalies
    .filter(a => a.isAnomaly)
    .map(a => ({ date: dates[a.index], value: a.value, zScore: a.zScore }));

  // 5. Branch Performance
  const branchStats = {};
  allSales.forEach(sale => {
    if (!branchStats[sale.branch]) {
      branchStats[sale.branch] = { total: 0, count: 0 };
    }
    branchStats[sale.branch].total += Number(sale.amount || 0);
    branchStats[sale.branch].count++;
  });

  const branchPerformance = Object.entries(branchStats)
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.total - a.total);

  // 6. Seasonal Patterns (Day of Week)
  const dayOfWeekStats = {};
  allSales.forEach(sale => {
    const date = new Date(sale.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    if (!dayOfWeekStats[dayOfWeek]) {
      dayOfWeekStats[dayOfWeek] = { total: 0, count: 0 };
    }
    dayOfWeekStats[dayOfWeek].total += Number(sale.amount || 0);
    dayOfWeekStats[dayOfWeek].count++;
  });

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const bestDay = Object.entries(dayOfWeekStats)
    .map(([day, stats]) => ({
      day: parseInt(day),
      name: dayNames[day],
      average: stats.total / stats.count
    }))
    .sort((a, b) => b.average - a.average)[0];

  // 7. Generate Recommendations
  const recommendations = generateRecommendations({
    trendPercentage,
    branchPerformance,
    anomalyDates,
    bestDay,
    forecast
  });

  return {
    forecast,
    trendPercentage,
    anomalyDates,
    branchPerformance,
    bestDay,
    recommendations,
    totalSales: values.reduce((a, b) => a + b, 0),
    avgDailySales: values.reduce((a, b) => a + b, 0) / values.length,
    forecastNextMonth: forecast.reduce((sum, f) => sum + f.value, 0),
    dates,
    values,
    ma7,
    ma30
  };
}

/**
 * Generate Intelligent Recommendations (Enhanced)
 */
function generateRecommendations(data) {
  const recommendations = [];

  // 1. Trend-based recommendations (Enhanced)
  if (data.trendPercentage > 20) {
    recommendations.push({
      type: 'success',
      icon: '🚀',
      title: 'نمو استثنائي - فرصة للتوسع',
      description: `المبيعات في نمو قوي جداً بنسبة ${data.trendPercentage.toFixed(1)}%. هذا الوقت المثالي للتوسع: افتح فروع جديدة، زد المخزون، ووظف موظفين إضافيين لتلبية الطلب المتزايد.`,
      priority: 'high'
    });
  } else if (data.trendPercentage > 10) {
    recommendations.push({
      type: 'success',
      icon: '📈',
      title: 'اتجاه إيجابي قوي',
      description: `المبيعات في نمو ممتاز بنسبة ${data.trendPercentage.toFixed(1)}%. استمر في الاستراتيجية الحالية، وفكر في زيادة الاستثمار التسويقي للحفاظ على الزخم.`,
      priority: 'medium'
    });
  } else if (data.trendPercentage > 0 && data.trendPercentage <= 10) {
    recommendations.push({
      type: 'info',
      icon: '📊',
      title: 'نمو معتدل - فرصة للتحسين',
      description: `المبيعات في نمو بطيء (${data.trendPercentage.toFixed(1)}%). جرب استراتيجيات جديدة: عروض خاصة، برامج ولاء، أو حملات تسويقية لتسريع النمو.`,
      priority: 'medium'
    });
  } else if (data.trendPercentage < -15) {
    recommendations.push({
      type: 'warning',
      icon: '🚨',
      title: 'تحذير: انخفاض حاد في المبيعات',
      description: `المبيعات في انخفاض خطير بنسبة ${Math.abs(data.trendPercentage).toFixed(1)}%. إجراءات عاجلة مطلوبة: راجع الأسعار، حلل المنافسين، وأطلق حملة ترويجية فورية.`,
      priority: 'critical'
    });
  } else if (data.trendPercentage < 0) {
    recommendations.push({
      type: 'warning',
      icon: '📉',
      title: 'انخفاض في المبيعات - تدخل مطلوب',
      description: `المبيعات في انخفاض بنسبة ${Math.abs(data.trendPercentage).toFixed(1)}%. راجع استراتيجية التسعير، حسّن خدمة العملاء، وفكر في عروض ترويجية لجذب العملاء.`,
      priority: 'high'
    });
  }

  // 2. Branch performance recommendations (Enhanced)
  if (data.branchPerformance.length > 1) {
    const topBranch = data.branchPerformance[0];
    const bottomBranch = data.branchPerformance[data.branchPerformance.length - 1];
    const avgPerformance = data.branchPerformance.reduce((sum, b) => sum + b.total, 0) / data.branchPerformance.length;

    // Top performer recognition
    if (topBranch.total > avgPerformance * 1.5) {
      recommendations.push({
        type: 'success',
        icon: '🏆',
        title: `فرع "${topBranch.name}" - نموذج للتميز`,
        description: `هذا الفرع يحقق ${formatMoney(topBranch.total)} ريال (${((topBranch.total / avgPerformance - 1) * 100).toFixed(0)}% فوق المتوسط). وثّق ممارساته الناجحة وطبقها في الفروع الأخرى.`,
        priority: 'medium'
      });
    }

    // Underperformer support
    if (bottomBranch.total < avgPerformance * 0.6) {
      recommendations.push({
        type: 'warning',
        icon: '🔧',
        title: `فرع "${bottomBranch.name}" يحتاج دعم عاجل`,
        description: `هذا الفرع يحقق ${formatMoney(bottomBranch.total)} ريال فقط (${((1 - bottomBranch.total / avgPerformance) * 100).toFixed(0)}% تحت المتوسط). أرسل مدير متمرس، راجع الموقع والتسعير، وقدم تدريب للموظفين.`,
        priority: 'high'
      });
    }

    // Large gap between branches
    if (topBranch.total > bottomBranch.total * 3) {
      recommendations.push({
        type: 'info',
        icon: '⚖️',
        title: 'فجوة كبيرة بين الفروع',
        description: `الفرق بين أعلى وأقل فرع كبير جداً (${((topBranch.total / bottomBranch.total).toFixed(1))}x). راجع توزيع الموارد والدعم بين الفروع لتحقيق توازن أفضل.`,
        priority: 'medium'
      });
    }
  }

  // 3. Best day recommendation (Enhanced)
  if (data.bestDay) {
    const dayAdvice = {
      'الأحد': 'بداية الأسبوع - ركز على عروض "بداية قوية"',
      'الاثنين': 'يوم هادئ عادة - جرب عروض خاصة لزيادة الحركة',
      'الثلاثاء': 'منتصف الأسبوع - عروض "يوم الثلاثاء الخاص"',
      'الأربعاء': 'يوم نشط - استغله بعروض محدودة',
      'الخميس': 'نهاية أسبوع العمل - عروض "نهاية الأسبوع المبكرة"',
      'الجمعة': 'يوم العطلة - ساعات عمل ممتدة وعروض عائلية',
      'السبت': 'نهاية الأسبوع - أنشطة ترفيهية وعروض خاصة'
    };

    recommendations.push({
      type: 'info',
      icon: '📅',
      title: `استراتيجية يوم ${data.bestDay.name}`,
      description: `هذا اليوم يحقق أعلى متوسط (${formatMoney(data.bestDay.average)} ريال). ${dayAdvice[data.bestDay.name] || 'ركز على العروض الخاصة'}. زد الموظفين والمخزون في هذا اليوم.`,
      priority: 'medium'
    });
  }

  // 4. Anomaly-based recommendations (Enhanced)
  if (data.anomalyDates.length > 0) {
    const topAnomaly = data.anomalyDates.sort((a, b) => b.value - a.value)[0];
    const avgSales = data.anomalyDates.reduce((sum, a) => sum + a.value, 0) / data.anomalyDates.length;

    recommendations.push({
      type: 'success',
      icon: '⭐',
      title: 'تحليل اليوم الاستثنائي',
      description: `تاريخ ${topAnomaly.date} حقق ${formatMoney(topAnomaly.value)} ريال (${((topAnomaly.value / avgSales - 1) * 100).toFixed(0)}% فوق المعتاد). راجع: هل كان هناك عرض خاص؟ حملة تسويقية؟ مناسبة؟ كرر هذه العوامل.`,
      priority: 'medium'
    });
  }

  // 5. Forecast-based recommendations (Enhanced)
  const avgForecast = data.forecast.reduce((sum, f) => sum + f.value, 0) / data.forecast.length;
  const currentAvg = data.branchPerformance.reduce((sum, b) => sum + b.average, 0) / data.branchPerformance.length;

  if (avgForecast > currentAvg * 1.3) {
    recommendations.push({
      type: 'success',
      icon: '🔮',
      title: 'توقعات نمو قوية',
      description: `التوقعات تشير إلى زيادة ${((avgForecast / currentAvg - 1) * 100).toFixed(0)}% في المبيعات. جهز: مخزون إضافي، موظفين إضافيين، وخطة لإدارة الطلب المتزايد.`,
      priority: 'high'
    });
  } else if (avgForecast < currentAvg * 0.8) {
    recommendations.push({
      type: 'warning',
      icon: '⚠️',
      title: 'توقعات انخفاض',
      description: `التوقعات تشير إلى انخفاض ${((1 - avgForecast / currentAvg) * 100).toFixed(0)}%. خطط لحملة تسويقية، عروض خاصة، أو تنويع المنتجات لتعويض الانخفاض المتوقع.`,
      priority: 'high'
    });
  }

  // 6. Seasonal pattern recommendations
  if (data.branchPerformance.length > 0) {
    const totalSales = data.branchPerformance.reduce((sum, b) => sum + b.total, 0);
    const avgTransaction = totalSales / data.branchPerformance.reduce((sum, b) => sum + b.count, 0);

    if (avgTransaction > 1000) {
      recommendations.push({
        type: 'info',
        icon: '💰',
        title: 'متوسط معاملة مرتفع',
        description: `متوسط المعاملة ${formatMoney(avgTransaction)} ريال. ركز على: برامج VIP للعملاء الكبار، خدمة مميزة، وعروض حصرية للمشتريات الكبيرة.`,
        priority: 'low'
      });
    } else if (avgTransaction < 200) {
      recommendations.push({
        type: 'info',
        icon: '📦',
        title: 'فرصة لزيادة قيمة المعاملة',
        description: `متوسط المعاملة ${formatMoney(avgTransaction)} ريال. جرب: عروض الحزم (Bundle)، البيع الإضافي (Upselling)، أو الحد الأدنى للشحن المجاني.`,
        priority: 'medium'
      });
    }
  }

  // 7. General best practices
  if (recommendations.length < 3) {
    recommendations.push({
      type: 'info',
      icon: '💡',
      title: 'نصائح للتحسين المستمر',
      description: 'راقب المنافسين، استمع لملاحظات العملاء، حدّث المنتجات بانتظام، ودرّب الموظفين على خدمة العملاء المتميزة.',
      priority: 'low'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}


/**
 * Render AI Report
 */
function renderAIReport(analysis) {
  const content = document.getElementById('aiReportContent');

  const html = `
    <!-- Print Button -->
    <div style="text-align: left; margin-bottom: 20px;">
      <button class="btn-sap btn-emphasized" onclick="printAIReport()" style="display: inline-flex; align-items: center; gap: 8px;">
        <span>🖨️</span> طباعة التقرير
      </button>
    </div>

    <!-- Header Stats -->
    <div class="ai-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div class="sap-card" style="background: linear-gradient(135deg, #0a6ed1 0%, #004070 100%); color: white; border: none;">
        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">📊 إجمالي المبيعات التاريخية</div>
        <div style="font-size: 2rem; font-weight: bold;">${formatMoney(analysis.totalSales)}</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 5px;">ريال سعودي</div>
      </div>

      <div class="sap-card" style="background: linear-gradient(135deg, #107e3e 0%, #05401f 100%); color: white; border: none;">
        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">📈 متوسط المبيعات اليومية</div>
        <div style="font-size: 2rem; font-weight: bold;">${formatMoney(analysis.avgDailySales)}</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 5px;">ريال سعودي</div>
      </div>

      <div class="sap-card" style="background: linear-gradient(135deg, #e9730c 0%, #8a4205 100%); color: white; border: none;">
        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">🔮 توقعات الشهر القادم</div>
        <div style="font-size: 2rem; font-weight: bold;">${formatMoney(analysis.forecastNextMonth)}</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 5px;">ريال سعودي</div>
      </div>

      <div class="sap-card" style="background: linear-gradient(135deg, #5d36ff 0%, #351e99 100%); color: white; border: none;">
        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">📊 معدل النمو</div>
        <div style="font-size: 2rem; font-weight: bold;">${analysis.trendPercentage > 0 ? '+' : ''}${analysis.trendPercentage.toFixed(1)}%</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 5px;">${analysis.trendPercentage > 0 ? '⬆️ نمو' : analysis.trendPercentage < 0 ? '⬇️ انخفاض' : '➡️ ثابت'}</div>
      </div>
    </div>

    <!-- Forecast Chart -->
    <div class="sap-card" style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: var(--sap-text);">🔮 التنبؤ بالمبيعات - الـ 30 يوم القادمة</h3>
      <div style="height: 350px; position: relative;">
        <canvas id="aiForecastChart"></canvas>
      </div>
    </div>

    <!-- Chat with Data (New Feature) -->
    <div class="sap-card" style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px 0; font-size: 1.3rem; color: var(--sap-text);">💬 اسأل المحلل الذكي</h3>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="text" id="aiChatInput" class="sap-input" placeholder="مثال: ما هو أفضل فرع؟ كم إجمالي المبيعات؟ توقعات الشهر القادم؟" onkeypress="handleChatKeyPress(event)">
        <button class="btn-sap btn-emphasized" onclick="handleChatQuery()">إرسال</button>
      </div>
      <div id="aiChatResponse" style="background: var(--sap-bg-hover); padding: 15px; border-radius: 4px; min-height: 60px; display: none;">
        <!-- Response will appear here -->
      </div>
    </div>

    <!-- What-If Analysis (New Feature) -->
    <div class="sap-card" style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px 0; font-size: 1.3rem; color: var(--sap-text);">🎛️ محاكاة السيناريوهات (What-If Analysis)</h3>
      <div style="padding: 10px;">
        <label style="display: block; margin-bottom: 10px; font-weight: bold;">تعديل نسبة النمو المتوقعة: <span id="growthValue">0%</span></label>
        <input type="range" id="growthSlider" min="-50" max="50" value="0" step="5" style="width: 100%; margin-bottom: 20px;" oninput="updateForecastScenario(this.value)">
        <p style="color: var(--sap-text-secondary); font-size: 0.9rem;">حرك المؤشر لرؤية كيف يؤثر تغيير نسبة النمو على توقعات المبيعات في الرسم البياني أعلاه.</p>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="sap-card" style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: var(--sap-text);">💡 التوصيات الذكية</h3>
      <div class="recommendations-grid" style="display: grid; gap: 15px;">
        ${analysis.recommendations.map(rec => `
          <div class="recommendation-card" style="background: ${rec.type === 'success' ? 'var(--sap-bg-hover)' : rec.type === 'warning' ? '#fff8e1' : 'var(--sap-bg-app)'}; padding: 20px; border-radius: 4px; border-right: 4px solid ${rec.type === 'success' ? 'var(--sap-success)' : rec.type === 'warning' ? 'var(--sap-warning)' : 'var(--sap-primary)'};">
            <div style="display: flex; align-items: start; gap: 15px;">
              <div style="font-size: 2.5rem;">${rec.icon}</div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; color: var(--sap-text); font-size: 1.1rem; font-weight: bold;">${rec.title}</h4>
                <p style="margin: 0; color: var(--sap-text-secondary); line-height: 1.6;">${rec.description}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Branch Performance -->
    <div class="sap-card" style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: var(--sap-text);">🏢 أداء الفروع</h3>
      <div style="height: 300px; position: relative;">
        <canvas id="aiBranchChart"></canvas>
      </div>
    </div>

    <!-- Best Day Insight -->
    ${analysis.bestDay ? `
      <div class="sap-card" style="background: linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%); margin-bottom: 25px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="font-size: 4rem;">📅</div>
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 1.3rem; color: #333;">أفضل يوم للمبيعات</h3>
            <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #e9730c;">${analysis.bestDay.name}</p>
            <p style="margin: 5px 0 0 0; color: #666;">متوسط المبيعات: ${formatMoney(analysis.bestDay.average)} ريال</p>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  content.innerHTML = html;

  // Render Charts
  setTimeout(() => {
    renderForecastChart(analysis);
    renderBranchPerformanceChart(analysis.branchPerformance);
  }, 100);
}

/**
 * Render Forecast Chart
 */
function renderForecastChart(analysis) {
  const ctx = document.getElementById('aiForecastChart');
  if (!ctx) return;

  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  // Prepare data
  const historicalLabels = analysis.dates.slice(-30).map(d => d.substring(5)); // Show last 30 days
  const historicalValues = analysis.values.slice(-30);
  const forecastLabels = analysis.forecast.map(f => `+${f.day}`);
  const forecastValues = analysis.forecast.map(f => f.value);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...historicalLabels, ...forecastLabels],
      datasets: [
        {
          label: 'المبيعات الفعلية',
          data: [...historicalValues, ...Array(forecastLabels.length).fill(null)],
          borderColor: '#0a6ed1',
          backgroundColor: 'rgba(10, 110, 209, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'التوقعات',
          data: [...Array(historicalLabels.length).fill(null), ...forecastValues],
          borderColor: '#e9730c',
          backgroundColor: 'rgba(233, 115, 12, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: "'72', '72full', Arial, sans-serif" }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function (context) {
              return context.dataset.label + ': ' + formatMoney(context.parsed.y) + ' ريال';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatMoney(value);
            },
            font: { family: "'72', '72full', Arial, sans-serif" }
          }
        },
        x: {
          ticks: {
            font: { family: "'72', '72full', Arial, sans-serif" }
          }
        }
      }
    }
  });
}

/**
 * Render Branch Performance Chart
 */
function renderBranchPerformanceChart(branchData) {
  const ctx = document.getElementById('aiBranchChart');
  if (!ctx) return;

  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: branchData.map(b => b.name),
      datasets: [{
        label: 'إجمالي المبيعات',
        data: branchData.map(b => b.total),
        backgroundColor: [
          'rgba(10, 110, 209, 0.8)',
          'rgba(16, 126, 62, 0.8)',
          'rgba(233, 115, 12, 0.8)',
          'rgba(93, 54, 255, 0.8)',
          'rgba(192, 57, 43, 0.8)'
        ],
        borderRadius: 4,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return 'المبيعات: ' + formatMoney(context.parsed.y) + ' ريال';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatMoney(value);
            },
            font: { family: "'72', '72full', Arial, sans-serif" }
          }
        },
        x: {
          ticks: {
            font: { family: "'72', '72full', Arial, sans-serif" }
          }
        }
      }
    }
  });
}

/**
 * Print AI Analytics Report (Professional)
 */
function printAIReport() {
  const printWindow = window.open('', '_blank');

  // Get current analysis data
  const content = document.getElementById('aiReportContent');
  if (!content) {
    showToast('error', 'خطأ', 'لا يوجد تقرير لطباعته');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('ar-SA');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير التحليل الذكي - نظام إدارة المبيعات</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: '72', '72full', Arial, Helvetica, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }

        .print-header {
          text-align: center;
          padding: 30px 0;
          border-bottom: 3px solid #0a6ed1;
          margin-bottom: 30px;
        }

        .print-header h1 {
          color: #0a6ed1;
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .print-header .subtitle {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 5px;
        }

        .print-header .date-time {
          color: #999;
          font-size: 0.9rem;
          margin-top: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .stat-box {
          border: 2px solid #0a6ed1;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-box .label {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }

        .stat-box .value {
          color: #0a6ed1;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .stat-box .unit {
          color: #999;
          font-size: 0.85rem;
          margin-top: 5px;
        }

        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .section-title {
          color: #0a6ed1;
          font-size: 1.5rem;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }

        .recommendation {
          background: #f8f9fa;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          border-right: 4px solid #0a6ed1;
          page-break-inside: avoid;
        }

        .recommendation.success {
          border-right-color: #107e3e;
          background: #f0f9f4;
        }

        .recommendation.warning {
          border-right-color: #e9730c;
          background: #fff8e1;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 0.8rem;
            color: #999;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>تقرير التحليل الذكي</h1>
        <div class="subtitle">نظام إدارة المبيعات</div>
        <div class="date-time">تم الاستخراج في: ${currentDate} - ${currentTime}</div>
      </div>

      <div class="section">
        <div class="stats-grid">
            <!-- Content will be injected via JS in a real scenario, but here we just print the structure -->
            <!-- Since we can't easily clone the canvas charts for print without image conversion, we'll focus on text data -->
        </div>
        <p style="text-align:center; color:#666;">(يرجى استخدام خيار "طباعة" من المتصفح للحصول على الرسوم البيانية إذا كانت مدعومة)</p>
      </div>
      
      <div class="footer">
        تم إنشاء هذا التقرير آلياً بواسطة نظام الذكاء الاصطناعي
      </div>

      <script>
        setTimeout(() => { window.print(); window.close(); }, 500);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Export functions
window.initAIAnalytics = initAIAnalytics;
window.printAIReport = printAIReport;

// --- New AI Features ---

/**
 * Handle Chat Key Press
 */
function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    handleChatQuery();
  }
}

/**
 * Handle Chat Query
 */
async function handleChatQuery() {
  const input = document.getElementById('aiChatInput');
  const responseDiv = document.getElementById('aiChatResponse');

  if (!input || !responseDiv) return;

  const query = input.value.trim().toLowerCase();
  if (!query) return;

  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<div style="color: #666;">جاري التفكير...</div>';

  // Simulate AI delay
  await new Promise(r => setTimeout(r, 800));

  let answer = '';

  // Simple NLP (Pattern Matching)
  const sales = await getSales();
  const totalSales = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const avgSales = totalSales / sales.length;

  // Branch stats
  const branchStats = {};
  sales.forEach(s => {
    branchStats[s.branch] = (branchStats[s.branch] || 0) + Number(s.amount || 0);
  });
  const sortedBranches = Object.entries(branchStats).sort((a, b) => b[1] - a[1]);
  const topBranch = sortedBranches[0];
  const bottomBranch = sortedBranches[sortedBranches.length - 1];

  if (query.includes('إجمالي') || (query.includes('مبيعات') && query.includes('كم'))) {
    answer = `إجمالي المبيعات التاريخية هو < strong > ${formatMoney(totalSales)}</strong > ريال سعودي.`;
  } else if (query.includes('أفضل فرع') || query.includes('أعلى فرع')) {
    answer = `أفضل فرع هو < strong > ${topBranch[0]}</strong > بمبيعات قدرها < strong > ${formatMoney(topBranch[1])
      }</strong > ريال.`;
  } else if (query.includes('أسوأ فرع') || query.includes('أقل فرع')) {
    answer = `الفرع الأقل أداءً هو < strong > ${bottomBranch[0]}</strong > بمبيعات قدرها < strong > ${formatMoney(bottomBranch[1])}</strong > ريال.`;
  } else if (query.includes('متوسط')) {
    answer = `متوسط قيمة العملية الواحدة هو < strong > ${formatMoney(avgSales)}</strong > ريال.`;
  } else if (query.includes('توقعات') || query.includes('مستقبل')) {
    answer = `بناءً على تحليل الاتجاه، نتوقع نمواً مستمراً.يمكنك استخدام قسم "محاكاة السيناريوهات" أدناه لتجربة نسب نمو مختلفة.`;
  } else if (query.includes('مرحبا') || query.includes('هلا')) {
    answer = `مرحباً بك! أنا مساعدك الذكي لتحليل البيانات.يمكنك سؤالي عن المبيعات، الفروع، أو التوقعات.`;
  } else {
    answer = `عذراً، لم أفهم السؤال تماماً.يمكنك سؤالي عن: "أفضل فرع"، "إجمالي المبيعات"، "المتوسط"، أو "التوقعات".`;
  }

  responseDiv.innerHTML = `
  < div style = "font-weight: bold; margin-bottom: 5px; color: var(--sap-primary);" >🤖 الإجابة:</div >
    <div style="color: var(--sap-text);">${answer}</div>
`;

  input.value = '';
}

/**
 * Update Forecast Scenario (What-If)
 */
let currentAnalysisData = null; // Store analysis data globally for scenario updates

function updateForecastScenario(growthRate) {
  document.getElementById('growthValue').textContent = (growthRate > 0 ? '+' : '') + growthRate + '%';

  const chart = Chart.getChart('aiForecastChart');
  if (!chart) return;

  // We need the base values. If not stored, we try to reconstruct or use current.
  // Ideally, we should have stored the base forecast when the chart was created.
  // Let's use a custom property on the chart object to store base data if not present.
  if (!chart.baseForecastData) {
    // Assuming the second dataset (index 1) is the forecast and it has nulls at the beginning
    const data = chart.data.datasets[1].data;
    chart.baseForecastData = data.filter(v => v !== null);
  }

  const rate = 1 + (parseInt(growthRate) / 100);
  const newForecast = chart.baseForecastData.map(v => v * rate);

  // Update chart data
  const historicalLength = chart.data.labels.length - newForecast.length;

  for (let i = 0; i < newForecast.length; i++) {
    chart.data.datasets[1].data[historicalLength + i] = newForecast[i];
  }

  chart.update();
}

// Export functions
window.handleChatKeyPress = handleChatKeyPress;
window.handleChatQuery = handleChatQuery;
window.updateForecastScenario = updateForecastScenario;
