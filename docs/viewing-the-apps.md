# View the apps in a browser (fastest path)

You have **two** frontends:

| App | Stack | Default URL (dev) |
|-----|--------|----------------------|
| **Admin dashboard** | Vite + React | http://localhost:5173 |
| **Employee app** | Flutter | http://localhost:* (Flutter picks a port) |

---

## Prerequisites (one-time)

1. **Node.js 20+ LTS** (installs `node` and `npm`) — [https://nodejs.org](https://nodejs.org)  
   - Use the **Windows Installer (.msi)** and leave “Add to PATH” enabled.  
   - **Close and reopen** PowerShell or Cursor’s terminal after installing (PATH only refreshes in new sessions).  
   - Confirm in a **new** terminal: `node --version` and `npm --version`

2. **Flutter SDK** — [https://docs.flutter.dev/get-started/install/windows](https://docs.flutter.dev/get-started/install/windows)  
   Confirm: `flutter doctor`  
   Enable **Chrome** for web: `flutter config --enable-web`

---

## Easiest on Windows: double-click or CMD (no PowerShell script policy)

From File Explorer, open `pabc-platform\scripts\` and:

- **Admin:** double-click **`run-admin-web.cmd`**  
  (Or in **Command Prompt** `cmd.exe`: `cd` to `pabc-platform\scripts` and run `run-admin-web.cmd`)

- **Employee (Flutter web):** double-click **`run-employee-web.cmd`**

These `.cmd` files avoid PowerShell’s “running scripts is disabled” error. You still need Node and Flutter installed and on PATH.

---

## 1) Admin web (usually quickest)

**Option A — Command Prompt (recommended if `npm` works):**

```bat
cd /d C:\Users\Game On\Documents\GitHub\pabc-platform\apps\admin-web
npm install
npm run dev
```

**Option B — PowerShell:**

```powershell
cd "C:\Users\Game On\Documents\GitHub\pabc-platform\apps\admin-web"
npm install
npm run dev
```

Open **http://localhost:5173** — you should see the sidebar (Dashboard, Operations, Settings) and the navy/gold shell.

---

## 2) Employee app (Flutter) — Web in Chrome

The repo only contains `lib/` and `pubspec.yaml`. Generate platform folders once:

```powershell
cd "C:\Users\Game On\Documents\GitHub\pabc-platform\apps\employee_app"
flutter create . --platforms=web,android
flutter pub get
flutter run -d chrome
```

A Chrome window opens with the employee UI (bottom nav: Home, Attendance, Incidents, Profile).  
No Supabase keys are required for this — you’ll see the “Development shell” card on Home.

To use **email/password sign-in**, copy `dart_defines.example.json` to `dart_defines.json`, add your Supabase URL and anon key, then:

```powershell
flutter run -d chrome --dart-define-from-file=dart_defines.json
```

---

## 3) Run both at once (two terminals)

- **Terminal A:** `admin-web` → `npm run dev`
- **Terminal B:** `employee_app` → `flutter run -d chrome`

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| **`npm` / `node` not recognized** | Node.js is missing or not on PATH. Install the **LTS .msi** from [nodejs.org](https://nodejs.org), finish the wizard, then **open a brand-new** terminal and run `where.exe npm`. If empty, sign out of Windows or reboot, then try again. |
| **Wrong folder / Set-Location failed** | The path must include `pabc-platform`. Full admin path: `...\GitHub\pabc-platform\apps\admin-web` (not only `...\GitHub`). |
| **PowerShell: scripts disabled** | Use **`run-admin-web.cmd`** / **`run-employee-web.cmd`** instead of `.ps1`, or run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or bypass one script: `powershell -ExecutionPolicy Bypass -File .\scripts\run-admin-web.ps1` |
| **`flutter` not recognized** | Install Flutter, add `bin` to PATH, new terminal, `flutter doctor`. |
| Flutter: no `web` device | `flutter config --enable-web` then `flutter devices`. |
| Port 5173 in use | In `apps/admin-web/vite.config.ts`, change `server.port`. |
| Android device instead of Chrome | `flutter devices` then `flutter run -d <deviceId>`. |
