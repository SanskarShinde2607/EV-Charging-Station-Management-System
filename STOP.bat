@echo off
echo Stopping EV Charge servers...
taskkill /FI "WINDOWTITLE eq EV Charge API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EV Charge Website*" /T /F >nul 2>&1
REM Also stop common ports if still running
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do taskkill /PID %%a /F >nul 2>&1
echo Done.
pause
