@echo off
setlocal enableextensions

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not on PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not on PATH.
  exit /b 1
)

if not exist node_modules (
  echo [INFO] Installing root dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Failed to install root dependencies.
    exit /b 1
  )
)

if not exist frontend\node_modules (
  echo [INFO] Installing frontend dependencies...
  call npm --prefix frontend install
  if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies.
    exit /b 1
  )
)

echo [INFO] Building frontend...
call npm run build
if errorlevel 1 (
  echo [ERROR] Frontend build failed.
  exit /b 1
)

echo [INFO] Starting Civitas server in a new window...
start "Civitas Server" cmd /k "cd /d ""%~dp0"" && npm start"

echo [INFO] Waiting for server startup...
timeout /t 6 /nobreak >nul

set "URL=http://127.0.0.1:8080"
set "CHROME="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
  echo [INFO] Opening Civitas in Chrome...
  start "" "%CHROME%" "%URL%"
) else (
  echo [WARN] Chrome executable not found. Opening URL with default browser instead.
  start "" "%URL%"
)

echo [INFO] Startup sequence complete.
exit /b 0
