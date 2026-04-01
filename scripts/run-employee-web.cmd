@echo off
setlocal
cd /d "%~dp0..\apps\employee_app"
where flutter >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] flutter was not found. Install Flutter from https://docs.flutter.dev/get-started/install/windows
  echo Add Flutter to PATH, then open a NEW terminal and run: flutter doctor
  echo.
  pause
  exit /b 1
)
if not exist web (
  echo Creating web and android platform folders (first run only^)...
  call flutter create . --platforms=web,android
  if errorlevel 1 exit /b 1
)
call flutter pub get
if errorlevel 1 exit /b 1
echo Starting Flutter in Chrome...
call flutter run -d chrome
