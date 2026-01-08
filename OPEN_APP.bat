@echo off
chcp 65001 >nul
echo.
echo ✅ فتح التطبيق في المتصفح...
echo.
start http://localhost:8000
timeout /t 2 >nul
echo.
echo إذا لم يفتح المتصفح تلقائياً، افتحه يدوياً على:
echo http://localhost:8000
echo.
pause








