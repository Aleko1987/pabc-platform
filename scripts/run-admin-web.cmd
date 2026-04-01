@echo off
setlocal
cd /d "%~dp0..\apps\admin-web"
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] npm was not found. Install Node.js LTS from https://nodejs.org
  echo Then close this window, open a NEW terminal, and run this file again.
  echo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Starting admin app at http://localhost:5173
call npm run dev
