# Architecture

## Overview

Monorepo with two first-party clients on one Supabase project:

| Client | Stack | Role |
|--------|--------|------|
| Employee app | Flutter (Android distribution) | Field operations: attendance, incidents, instructions |
| Admin web | Vite + React | Rosters, org setup, integrations, monitoring |

## Principles

- **RLS is the source of truth** for authorization; clients are untrusted.
- **Multi-tenant** via `organization_id` on operational rows; membership in `user_organization_roles`.
- **Auditability**: append-style `attendance_events`, `audit_logs`, and operational instructions with actor metadata.
- **Realtime** on high-signal tables (`attendance_events`, `incidents`, `operational_instructions`) for live dashboards.
- **Secrets** (WhatsApp Meta, etc.) only in Supabase Edge Functions or backend workers — not in Flutter defines or Vite `VITE_*` beyond the public anon key.

## Phase map

- **Phase 0**: Repository scaffold, schema migration baseline, UI shells.
- **Phase 1**: Auth flows, profiles ↔ employees, CRUD for org graph, mobile clock + incident create.
- **Phase 2**: Patrols, tasks, notifications, WhatsApp pipeline.
- **Phase 3**: Commercial: contracts, SLAs, client-facing surfaces, analytics.

## Related docs

- [schema.md](./schema.md) — table inventory and notes.
- [pending-docx-requirements.md](./pending-docx-requirements.md) — Word doc gap.
