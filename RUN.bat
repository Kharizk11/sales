@echo off
chcp 65001 >nul
title نظام إدارة المبيعات - تشغيل التطبيق
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     نظام إدارة المبيعات - فروع الشركة                   ║
echo ║     Sales Management System - Company Branches           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📡 جاري تشغيل الخادم على المنفذ 8000...
echo.
echo ✅ التطبيق سيفتح تلقائياً في المتصفح
echo    على العنوان: http://localhost:8000
echo.
echo ⚠️  اضغط Ctrl+C لإيقاف الخادم
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ خطأ: Python غير مثبت أو غير متاح في PATH
    echo.
    echo يرجى تثبيت Python من: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Start the server
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







