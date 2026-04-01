# PABC Admin (Vite + React)

Internal dashboard shell: operations, future WhatsApp Meta tooling, org configuration.

## Setup

```bash
cd apps/admin-web
cp .env.example .env
npm install
npm run dev
```

## Supabase

After the Supabase project exists, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

Add `@supabase/supabase-js`, create a singleton client module, and enforce the same RLS assumptions as the Flutter app. **Never** embed Meta or other integration secrets in this SPA — use Edge Functions.

### UI flags

- `VITE_ADMIN_HIDE_SIDEBAR=true` hides the left sidebar shell (full-width content layout).

## Build

```bash
npm run build
npm run preview
```
