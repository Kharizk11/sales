@echo off
chcp 65001 >nul
title خادم نظام إدارة المبيعات
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     خادم نظام إدارة المبيعات - فروع الشركة            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📡 جاري تشغيل الخادم على المنفذ 8000...
echo.
echo ✅ افتح المتصفح على: http://localhost:8000
echo.
echo ⚠️  اضغط Ctrl+C لإيقاف الخادم
echo.
echo ═══════════════════════════════════════════════════════════
echo.

python -m http.server 8000

if errorlevel 1 (
    echo.
    echo ❌ خطأ: فشل تشغيل الخادم
    echo.
    echo جرب:
    echo   1. python -m http.server 8080
    echo   2. أو npx http-server
    echo.
    pause
)








