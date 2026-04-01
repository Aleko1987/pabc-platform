# PABC platform (Phase 0 scaffold)

Enterprise workforce / operations foundation: **Flutter employee app** (Android sideload) + **Vite/React admin** + **Supabase** (Postgres, Auth, Storage, Realtime).

## View the UIs locally

**Step-by-step:** [docs/viewing-the-apps.md](docs/viewing-the-apps.md)

**Quick (Windows):** double-click **`scripts/run-admin-web.cmd`** or **`scripts/run-employee-web.cmd`** (needs [Node.js](https://nodejs.org) and [Flutter](https://docs.flutter.dev/get-started/install/windows) on PATH — use **.cmd** if PowerShell blocks `.ps1` scripts).

- **Admin (React):** `scripts\run-admin-web.cmd` → **http://localhost:5173**
- **Employee (Flutter web):** `scripts\run-employee-web.cmd` (first run creates `web/` + `android/`)

## Repository layout

```
pabc-platform/
  apps/
    employee_app/     # Flutter + Riverpod + go_router + supabase_flutter
    admin-web/        # Vite + React admin shell
  docs/               # Architecture & schema notes
  supabase/
    migrations/       # Core SQL migration
    seed.sql          # Optional demo data (no auth users)
```

## Prerequisites

- Flutter SDK (for `apps/employee_app`)
- Node 20+ and npm (for `apps/admin-web`)
- Supabase project (**after** scaffold: create project, run migrations)

## Employee app (Flutter)

```bash
cd apps/employee_app
flutter create . --platforms=android
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

Run without Supabase (UI shell):

```bash
flutter run
```

Run with Supabase (after you have URL + anon key):

```bash
cp dart_defines.example.json dart_defines.json
# Edit dart_defines.json — keys must be non-empty
flutter run --dart-define-from-file=dart_defines.json
```

### Android distribution

Target deployment is **Android APK/AAB via sideload or MDM**, not Apple App Store. Configure signing and `applicationId` under `android/app` before release.

## Admin web

```bash
cd apps/admin-web
cp .env.example .env
npm install
npm run dev
```

See [apps/admin-web/README.md](apps/admin-web/README.md).

## Vercel deployment (SPA / PWA-safe refresh)

`vercel.json` is configured so Vercel builds `apps/admin-web` and serves deep links
via SPA fallback:

- Static files are served normally (`handle: filesystem`)
- Any non-file route (for example `/staff/nomsa-khumalo`) is rewritten to
  `index.html` so browser refresh does not 404

This preserves React Router behavior on direct navigation and reload.

## Supabase

1. Create a project in the Supabase dashboard.
2. Run the SQL in [supabase/migrations/00001_core.sql](supabase/migrations/00001_core.sql) (CLI: `supabase db push` / linked project, or paste in SQL editor).
3. Optionally run [supabase/seed.sql](supabase/seed.sql).
4. Configure Auth (email, etc.) and add app redirect URLs.
5. Point Flutter `dart_defines.json` and admin `.env` at the project.

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/schema.md](docs/schema.md)
- [docs/pending-docx-requirements.md](docs/pending-docx-requirements.md)

## Open decisions (TODO)

- Merge requirements from **PABC AI Requirements.docx** once exported (see `docs/pending-docx-requirements.md`).
- Final FICA field set and `wage_rate` visibility rules.
- WhatsApp Meta: Edge Function design, webhook security, message retention.
- Employee ↔ auth onboarding (invite-only vs self-signup).
