# EV Charge — one-click start (PowerShell)
# Right-click → Run with PowerShell
# Or:  powershell -ExecutionPolicy Bypass -File "C:\ev-charge\START.ps1"

$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
if (-not $Root) {
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
Set-Location $Root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EV Charge - Starting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "ERROR: Python not found." -ForegroundColor Red
    Write-Host "Install Python 3.10+ from https://www.python.org"
    Write-Host "Check 'Add Python to PATH' during setup."
    Read-Host "Press Enter to exit"
    exit 1
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Host "ERROR: npm / Node.js not found." -ForegroundColor Red
    Write-Host "Install Node.js 18+ from https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}

$Backend = Join-Path $Root "backend"
$VenvPython = Join-Path $Backend ".venv\Scripts\python.exe"
$ReqFile = Join-Path $Backend "requirements.txt"

if (-not (Test-Path $Backend)) {
    Write-Host "ERROR: backend folder not found at $Backend" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $Backend

if (-not (Test-Path $VenvPython)) {
    Write-Host "[1/4] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not create .venv" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "[2/4] Installing backend packages..." -ForegroundColor Yellow
& $VenvPython -m pip install -q -r $ReqFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip install failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[3/4] Starting API on http://localhost:8000 ..." -ForegroundColor Green
$apiCmd = "Set-Location -LiteralPath '$Backend'; & '$VenvPython' -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $apiCmd)

$Frontend = Join-Path $Root "frontend"
if (-not (Test-Path $Frontend)) {
    Write-Host "ERROR: frontend folder not found at $Frontend" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $Frontend

$NodeModules = Join-Path $Frontend "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[4/4] Installing frontend packages (first run may take a few minutes)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[4/4] Frontend packages ready." -ForegroundColor Green
}

Write-Host "Starting website on http://localhost:5173 ..." -ForegroundColor Green
$webCmd = "Set-Location -LiteralPath '$Frontend'; npm run dev"
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $webCmd)

Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Website:  http://localhost:5173"
Write-Host "  API:      http://localhost:8000"
Write-Host "  API docs: http://localhost:8000/docs"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two PowerShell windows are open (API + Website)."
Write-Host "Keep them open while you use the app."
Write-Host "Close those windows to stop the servers."
Write-Host ""
Read-Host "Press Enter to close this window"