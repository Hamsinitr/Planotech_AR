@echo off
echo ========================================================
echo Starting Planotech AR Platform (Backend & Frontend)
echo ========================================================

echo Starting Backend Server on http://localhost:8000 ...
start "Planotech Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on http://localhost:5173 ...
start "Planotech Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo Applications launched!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/api/docs
echo Admin Login: admin@planotech.com / admin123
echo ========================================================
