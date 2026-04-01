# Starts the Vite admin dev server (http://localhost:5173).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "apps\admin-web")

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm not found. Install Node.js from https://nodejs.org and reopen the terminal." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "node_modules")) {
  npm install
}

npm run dev
