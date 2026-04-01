# Database schema notes

Source of truth for DDL: [supabase/migrations/00001_core.sql](../supabase/migrations/00001_core.sql).

## Tenancy & structure

- **organizations** — Tenant root; timezone and `settings` JSONB for feature flags.
- **branches** — Regional / business units under an org.
- **sites** — Operational locations (guarding/cleaning posts); optional `client_account_id`.
- **departments** — Internal structure (HR, ops, etc.).
- **client_accounts** / **contracts** — Light commercial shell for Phase 3.

## Workforce

- **employees** — HR record; `national_id_hash` only (no plain IDs in DB); `wage_rate` is highly sensitive (RLS TODO).
- **profiles** — 1:1 with `auth.users`; optional `employee_id` and `default_organization_id`.
- **service_categories** — Security, cleaning, etc.; `organization_id` null = template row (optional pattern).

## IAM

- **roles** / **permissions** / **role_permissions** — RBAC catalog.
- **user_organization_roles** — User ↔ org ↔ role; optional `branch_id` for scoped managers; `revoked_at` for soft revoke.

## Scheduling & attendance

- **employee_assignments** — Employee to site/branch over time.
- **shifts** / **shift_assignments** — Planned coverage.
- **attendance_events** — Insert-only clock events; geo + device metadata for traceability.
- **attendance_corrections** — Workflow for amendments (no silent updates to events).

## Operations & compliance

- **incidents** — Site-linked reports; links to reporter profile or employee.
- **operational_instructions** — Delegated tasks / voice-ops trail (`channel` includes whatsapp/voice).
- **documents** — Storage path + retention class; FK to employee or incident.
- **audit_logs** — Cross-entity actions with JSON `payload`.

## RLS status (Phase 0)

- Baseline **SELECT** for org members on most tables; **profiles** self-service; **attendance_events** / **incidents** / **operational_instructions** have broader DML stubs.
- **TODO**: Split policies by permission slug; lock down `employees.wage_rate`; add INSERT policies for admin-only tables; branch-scoped supervisor rules.

## Seeds

[supabase/seed.sql](../supabase/seed.sql) creates a demo org, branch, client, site, categories, and roles. Does not create users.

## FICA / compliance

Exact mandatory fields and retention periods are **not** finalized in schema (legal input required). `verification_status` / `documents` / `audit_logs` are the extension points.
