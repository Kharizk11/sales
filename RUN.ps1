# نظام إدارة المبيعات - تشغيل التطبيق
# Sales Management System - Run Application

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     نظام إدارة المبيعات - فروع الشركة                   ║" -ForegroundColor Cyan
Write-Host "║     Sales Management System - Company Branches           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 جاري تشغيل الخادم على المنفذ 8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ التطبيق سيفتح تلقائياً في المتصفح" -ForegroundColor Green
Write-Host "   على العنوان: http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  اضغط Ctrl+C لإيقاف الخادم" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python متاح: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ: Python غير مثبت أو غير متاح" -ForegroundColor Red
    Write-Host ""
    Write-Host "يرجى تثبيت Python من: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Wait a bit then open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000"

# Start the server
try {
    python -m http.server 8000
} catch {
    Write-Host ""
    Write-Host "❌ خطأ: فشل تشغيل الخادم" -ForegroundColor Red
    Write-Host ""
    Write-Host "جرب:" -ForegroundColor Yellow
    Write-Host "  1. python -m http.server 8080" -ForegroundColor Yellow
    Write-Host "  2. أو npx http-server" -ForegroundColor Yellow
    Write-Host ""
    pause
}







