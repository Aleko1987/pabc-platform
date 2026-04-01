# Generates web (and android) platform folders if missing, then runs Flutter in Chrome.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root "apps\employee_app"
Set-Location $app

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host "flutter not found. Install Flutter and add it to PATH: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "web")) {
  Write-Host "Creating web + android platform folders..." -ForegroundColor Cyan
  flutter create . --platforms=web,android
}

flutter pub get
Write-Host "Starting Flutter web in Chrome..." -ForegroundColor Cyan
flutter run -d chrome
