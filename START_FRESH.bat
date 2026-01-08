@echo off
echo ============================================
echo   تشغيل الخادم المحلي وفتح التطبيق
echo ============================================
echo.

REM Kill any existing Python server on port 8000
echo جاري إيقاف أي خادم قديم...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo جاري تشغيل الخادم المحلي...
echo.
echo ⚠️ مهم: بعد فتح المتصفح، اضغط Ctrl+Shift+R لتحديث الصفحة
echo.

REM Start Python server
start "Sales Management Server" cmd /k "python -m http.server 8000 && pause"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo فتح المتصفح...
start http://localhost:8000

echo.
echo ============================================
echo   الخادم يعمل الآن!
echo ============================================
echo.
echo 📌 لمشاهدة التعديلات الجديدة:
echo    1. اضغط F12 في المتصفح
echo    2. اذهب إلى تبويب Network
echo    3. فعّل "Disable cache"
echo    4. اضغط Ctrl+Shift+R
echo.
echo لإيقاف الخادم: أغلق نافذة "Sales Management Server"
echo ============================================
pause
