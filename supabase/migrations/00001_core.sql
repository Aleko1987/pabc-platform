-- PABC platform core schema: multi-tenant org graph, RBAC, workforce, attendance, incidents, audit.
-- Apply via Supabase CLI or SQL editor after project creation.
-- TODO: Tighten RLS with branch-scoped roles; add wage_rate policy tests; confirm FICA field set with legal.

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select uor.organization_id
  from public.user_organization_roles uor
  where uor.user_id = auth.uid()
    and uor.revoked_at is null;
$$;

-- -----------------------------------------------------------------------------
-- Org graph & commercial (light)
-- -----------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  timezone text not null default 'Africa/Johannesburg',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  code text,
  address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index branches_organization_id_idx on public.branches (organization_id);

create trigger branches_set_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

create table public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  billing_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_accounts_organization_id_idx on public.client_accounts (organization_id);

create trigger client_accounts_set_updated_at
  before update on public.client_accounts
  for each row execute function public.set_updated_at();

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  client_account_id uuid references public.client_accounts (id) on delete set null,
  name text not null,
  code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sites_organization_id_idx on public.sites (organization_id);
create index sites_branch_id_idx on public.sites (branch_id);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index departments_organization_id_idx on public.departments (organization_id);

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  unique (organization_id, slug)
);

create index service_categories_organization_id_idx on public.service_categories (organization_id);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts (id) on delete cascade,
  reference text,
  starts_on date,
  ends_on date,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contracts_client_account_id_idx on public.contracts (client_account_id);

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Workforce
-- -----------------------------------------------------------------------------

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  employee_number text,
  national_id_hash text,
  first_name text not null,
  last_name text not null,
  known_as text,
  phone text,
  email text,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'suspended', 'terminated')),
  hired_on date,
  terminated_on date,
  wage_rate numeric(14, 2),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'expired')),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index employees_organization_id_idx on public.employees (organization_id);

create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- IAM (links to auth.users)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_organization_id uuid references public.organizations (id),
  employee_id uuid references public.employees (id),
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  unique (organization_id, slug)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_organization_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index user_organization_roles_user_id_idx on public.user_organization_roles (user_id);
create index user_organization_roles_org_id_idx on public.user_organization_roles (organization_id);

-- -----------------------------------------------------------------------------
-- Assignments & scheduling
-- -----------------------------------------------------------------------------

create table public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  branch_id uuid references public.branches (id) on delete set null,
  service_category_id uuid references public.service_categories (id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'active'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (site_id is not null or branch_id is not null)
);

create index employee_assignments_employee_id_idx on public.employee_assignments (employee_id);
create index employee_assignments_site_id_idx on public.employee_assignments (site_id);

create trigger employee_assignments_set_updated_at
  before update on public.employee_assignments
  for each row execute function public.set_updated_at();

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  shift_type text not null default 'standard',
  capacity integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shifts_site_id_idx on public.shifts (site_id);

create trigger shifts_set_updated_at
  before update on public.shifts
  for each row execute function public.set_updated_at();

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  status text not null default 'assigned'
    check (status in ('assigned', 'confirmed', 'declined', 'completed')),
  created_at timestamptz not null default now(),
  unique (shift_id, employee_id)
);

create index shift_assignments_shift_id_idx on public.shift_assignments (shift_id);

-- -----------------------------------------------------------------------------
-- Attendance & incidents
-- -----------------------------------------------------------------------------

create table public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  event_type text not null check (event_type in ('clock_in', 'clock_out', 'break_start', 'break_end')),
  occurred_at timestamptz not null default now(),
  source text not null default 'app' check (source in ('app', 'manual', 'import')),
  device_id text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index attendance_events_org_occurred_idx
  on public.attendance_events (organization_id, occurred_at desc);
create index attendance_events_employee_idx on public.attendance_events (employee_id);

create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  original_event_id uuid not null references public.attendance_events (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  new_occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger attendance_corrections_set_updated_at
  before update on public.attendance_corrections
  for each row execute function public.set_updated_at();

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  reported_by uuid references public.profiles (id),
  employee_reporter_id uuid references public.employees (id),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'investigating', 'closed')),
  title text not null,
  narrative text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidents_organization_id_idx on public.incidents (organization_id);

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Operations & compliance
-- -----------------------------------------------------------------------------

create table public.operational_instructions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  employee_id uuid references public.employees (id) on delete set null,
  issued_by uuid references public.profiles (id),
  channel text not null default 'manual' check (channel in ('manual', 'whatsapp', 'voice', 'system')),
  body text not null,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index operational_instructions_organization_id_idx
  on public.operational_instructions (organization_id);

create trigger operational_instructions_set_updated_at
  before update on public.operational_instructions
  for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  storage_path text not null,
  document_type text not null,
  retention_class text not null default 'standard',
  employee_id uuid references public.employees (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create index documents_organization_id_idx on public.documents (organization_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_id_idx on public.audit_logs (organization_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.client_accounts enable row level security;
alter table public.sites enable row level security;
alter table public.departments enable row level security;
alter table public.service_categories enable row level security;
alter table public.contracts enable row level security;
alter table public.employees enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_organization_roles enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.attendance_events enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.incidents enable row level security;
alter table public.operational_instructions enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: self-service
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id or public.is_platform_admin());

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id or public.is_platform_admin());

-- Org-scoped read for members (baseline; refine per table in Phase 1)
create policy organizations_select_member on public.organizations
  for select using (
    public.is_platform_admin()
    or id in (select public.user_organization_ids())
  );

create policy branches_select_member on public.branches
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy sites_select_member on public.sites
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy employees_select_member on public.employees
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy attendance_select_member on public.attendance_events
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy attendance_insert_authenticated on public.attendance_events
  for insert with check (
    auth.uid() is not null
    and (
      public.is_platform_admin()
      or organization_id in (select public.user_organization_ids())
    )
  );

create policy incidents_select_member on public.incidents
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy incidents_write_member on public.incidents
  for all using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  )
  with check (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy instructions_select_member on public.operational_instructions
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy instructions_write_member on public.operational_instructions
  for all using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  )
  with check (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

-- TODO: Add insert/update policies for remaining tables when admin CRUD roles are defined.
-- Baseline SELECT for org members so clients can list reference data; tighten per role in Phase 1.

create policy client_accounts_select_member on public.client_accounts
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy departments_select_member on public.departments
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy service_categories_select_member on public.service_categories
  for select using (
    public.is_platform_admin()
    or organization_id is null
    or organization_id in (select public.user_organization_ids())
  );

create policy contracts_select_member on public.contracts
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.client_accounts c
      where c.id = client_account_id
        and c.organization_id in (select public.user_organization_ids())
    )
  );

create policy roles_select_member on public.roles
  for select using (
    public.is_platform_admin()
    or organization_id is null
    or organization_id in (select public.user_organization_ids())
  );

create policy permissions_select_all on public.permissions
  for select using (auth.uid() is not null);

create policy role_permissions_select_member on public.role_permissions
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.roles r
      where r.id = role_id
        and (r.organization_id is null or r.organization_id in (select public.user_organization_ids()))
    )
  );

create policy user_org_roles_select_self on public.user_organization_roles
  for select using (
    public.is_platform_admin()
    or user_id = auth.uid()
    or organization_id in (select public.user_organization_ids())
  );

create policy employee_assignments_select_member on public.employee_assignments
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.employees e
      where e.id = employee_id
        and e.organization_id in (select public.user_organization_ids())
    )
  );

create policy shifts_select_member on public.shifts
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.sites s
      where s.id = site_id
        and s.organization_id in (select public.user_organization_ids())
    )
  );

create policy shift_assignments_select_member on public.shift_assignments
  for select using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.shifts sh
      join public.sites s on s.id = sh.site_id
      where sh.id = shift_id
        and s.organization_id in (select public.user_organization_ids())
    )
  );

create policy attendance_corrections_select_member on public.attendance_corrections
  for select using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.attendance_events ae
      where ae.id = original_event_id
        and ae.organization_id in (select public.user_organization_ids())
    )
  );

create policy documents_select_member on public.documents
  for select using (
    public.is_platform_admin()
    or organization_id in (select public.user_organization_ids())
  );

create policy audit_logs_select_member on public.audit_logs
  for select using (
    public.is_platform_admin()
    or organization_id is null
    or organization_id in (select public.user_organization_ids())
  );

-- -----------------------------------------------------------------------------
-- Realtime (operational feeds)
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.attendance_events;
alter publication supabase_realtime add table public.incidents;
alter publication supabase_realtime add table public.operational_instructions;
