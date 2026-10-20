@echo off
title EV Charge - Starting...
cd /d "%~dp0"

echo ========================================
echo   EV Charge - One-Click Start
echo ========================================
echo.

REM Backend setup
cd backend
if not exist ".venv\Scripts\python.exe" (
  echo [1/4] Creating Python virtual environment...
  python -m venv .venv
  if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
  )
)

echo [2/4] Installing backend packages (first run may take a minute)...
".venv\Scripts\python.exe" -m pip install -q -r requirements.txt
if errorlevel 1 (
  echo ERROR: pip install failed
  pause
  exit /b 1
)

echo [3/4] Starting API server on http://localhost:8000 ...
start "EV Charge API" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

cd /d "%~dp0frontend"
if not exist "node_modules" (
  echo [4/4] Installing frontend packages (first run may take a few minutes)...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed. Install Node.js from nodejs.org
    pause
    exit /b 1
  )
) else (
  echo [4/4] Frontend packages already installed.
)

echo Starting website on http://localhost:5173 ...
start "EV Charge Website" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo   Backend:  http://localhost:8000
echo   Website:  http://localhost:5173
echo   API docs: http://localhost:8000/docs
echo ========================================
echo.
echo Two terminal windows are open (API + Website).
echo Keep them open while you use the app.
echo Close those windows to stop the project.
echo.
pause
