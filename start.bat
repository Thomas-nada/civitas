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

set "SERVER_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do (
  set "SERVER_PID=%%P"
  goto :found_pid
)
:found_pid
if defined SERVER_PID (
  echo [INFO] Port 8080 is already in use by PID %SERVER_PID%. Stopping it...
  taskkill /PID %SERVER_PID% /F >nul 2>nul
  timeout /t 1 /nobreak >nul
)

echo [INFO] Starting Civitas server in a new window...
start "Civitas Server" cmd /k "cd /d ""%~dp0"" && npm start"

echo [INFO] Waiting for server startup (health check)...
set "HEALTH_OK="
for /L %%I in (1,1,45) do (
  curl -s -f http://127.0.0.1:8080/api/health >nul 2>nul
  if not errorlevel 1 (
    set "HEALTH_OK=1"
    goto :health_ready
  )
  timeout /t 1 /nobreak >nul
)
:health_ready
if not defined HEALTH_OK (
  echo [WARN] Server did not report healthy within timeout. Opening browser anyway.
)

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
