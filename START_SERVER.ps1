Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  تشغيل خادم ويب محلي للتطبيق" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "جاري تشغيل الخادم على المنفذ 8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "افتح المتصفح على: http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف الخادم" -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
try {
    python -m http.server 8000
} catch {
    Write-Host "خطأ: Python غير متاح" -ForegroundColor Red
    Write-Host "جرب استخدام Node.js: npx http-server" -ForegroundColor Yellow
    pause
}








