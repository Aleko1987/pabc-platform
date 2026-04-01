-- Optional seed for local / staging. Run manually after migrations.
-- Does not create auth.users — use Supabase dashboard or Admin API for test accounts.

do $$
declare
  org_id uuid;
  branch_id uuid;
  client_id uuid;
begin
  insert into public.organizations (legal_name, timezone)
  values ('PABC Demo (HQ)', 'Africa/Johannesburg')
  returning id into org_id;

  insert into public.branches (organization_id, name, code)
  values (org_id, 'Johannesburg Central', 'JHB-C')
  returning id into branch_id;

  insert into public.client_accounts (organization_id, name, billing_reference)
  values (org_id, 'Demo Client Ltd', 'DEMO-001')
  returning id into client_id;

  insert into public.sites (organization_id, branch_id, client_account_id, name, code)
  values (org_id, branch_id, client_id, 'Demo Tower', 'SITE-01');

  insert into public.service_categories (organization_id, slug, name)
  values
    (org_id, 'security', 'Security'),
    (org_id, 'cleaning', 'Cleaning')
  on conflict (organization_id, slug) do nothing;

  insert into public.roles (organization_id, slug, name)
  values
    (org_id, 'org_admin', 'Organization admin'),
    (org_id, 'supervisor', 'Supervisor'),
    (org_id, 'employee', 'Employee')
  on conflict (organization_id, slug) do nothing;

  raise notice 'Seeded organization %', org_id;
end $$;
