@echo off
chcp 65001 >nul
title MY-NEW-APP Launcher
cd /d "%~dp0"

echo ============================================
echo    تشغيل مشروع MY-NEW-APP
echo ============================================
echo  - سيفتح نافذتان: واحدة للخادم وواحدة للواجهة
echo  - اتركيهما مفتوحتين طوال استخدام الموقع
echo ============================================
echo.

REM --- تشغيل الخادم الخلفي (Flask + الذكاء الاصطناعي) على المنفذ 5000 ---
start "MY-NEW-APP Backend (Flask)" cmd /k "chcp 65001>nul & set PYTHONUTF8=1 & cd /d src & py run.py"

REM --- تشغيل الواجهة الأمامية (React/Vite) على المنفذ 5173 ---
start "MY-NEW-APP Frontend (Vite)" cmd /k "npm run dev"

echo انتظري قليلا ريثما يبدأ الخادم ثم سيفتح المتصفح تلقائيا...
timeout /t 12 >nul
start "" http://localhost:5173/

echo.
echo تم فتح الموقع في المتصفح. اذا لم يفتح، افتحيه يدويا:  http://localhost:5173/
echo يمكنك اغلاق هذه النافذة الان (لكن لا تغلقي نافذتي الخادم والواجهة).
timeout /t 6 >nul
exit
