-- Pilot Readiness Sprint 2: per-user onboarding, canonical roles, and clinical ownership.

create type public.ccm_access_role as enum (
  'organization_owner',
  'practice_administrator',
  'department_administrator',
  'compliance_administrator',
  'billing_administrator',
  'provider',
  'clinical_staff',
  'coordinator',
  'front_desk',
  'read_only',
  'patient'
);

create table public.access_role_definitions (
  role public.ccm_access_role primary key,
  display_name text not null,
  hierarchy_rank integer not null,
  administrative_scope text not null check (administrative_scope in ('organization', 'practice', 'department', 'clinical', 'patient')),
  is_administrative boolean not null default false,
  is_patient_role boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.access_role_definitions (role, display_name, hierarchy_rank, administrative_scope, is_administrative, is_patient_role)
values
  ('organization_owner', 'Organization Owner', 100, 'organization', true, false),
  ('practice_administrator', 'Practice Administrator', 90, 'practice', true, false),
  ('department_administrator', 'Department Administrator', 80, 'department', true, false),
  ('compliance_administrator', 'Compliance Administrator', 75, 'practice', true, false),
  ('billing_administrator', 'Billing Administrator', 70, 'practice', true, false),
  ('provider', 'Provider', 60, 'clinical', false, false),
  ('clinical_staff', 'Clinical Staff', 50, 'clinical', false, false),
  ('coordinator', 'Coordinator', 40, 'clinical', false, false),
  ('front_desk', 'Front Desk', 30, 'practice', false, false),
  ('read_only', 'Read Only', 20, 'practice', false, false),
  ('patient', 'Patient', 10, 'patient', false, true);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  organization_type text not null default 'independent_practice' check (
    organization_type in ('independent_practice', 'group_practice', 'health_system', 'fqhc', 'other')
  ),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.ccm_access_role not null default 'organization_owner' check (role = 'organization_owner'),
  status public.ccm_membership_status not null default 'active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.practices
  add column organization_id uuid references public.organizations(id),
  add column primary_address jsonb,
  add column phone text,
  add column logo_url text,
  add column coordinator_settings jsonb not null default '{"assignment_mode":"manual"}'::jsonb,
  add column notification_defaults jsonb not null default '{"staff_email":true,"patient_reminders":false}'::jsonb,
  add column setup_completed_at timestamptz;

do $$
declare
  practice_row record;
  created_organization_id uuid;
  owner_user_id uuid;
begin
  for practice_row in select * from public.practices loop
    select member.user_id
    into owner_user_id
    from public.practice_members member
    where member.practice_id = practice_row.id
      and member.role = 'owner'
      and member.status = 'active'
      and member.user_id is not null
    order by member.created_at, member.id
    limit 1;

    insert into public.organizations (name, slug, organization_type, created_by, updated_by, created_at, updated_at)
    values (
      practice_row.name,
      coalesce(nullif(practice_row.slug, ''), 'practice-' || substr(practice_row.id::text, 1, 8)) || '-org-' || substr(practice_row.id::text, 1, 8),
      'independent_practice',
      coalesce(owner_user_id, practice_row.created_by),
      coalesce(owner_user_id, practice_row.updated_by),
      practice_row.created_at,
      practice_row.updated_at
    )
    returning id into created_organization_id;

    update public.practices
    set organization_id = created_organization_id,
        setup_completed_at = coalesce(practice_row.updated_at, now()),
        primary_address = case
          when practice_row.billing_settings ? 'address' then jsonb_build_object('formatted', practice_row.billing_settings -> 'address')
          else null
        end,
        phone = nullif(practice_row.billing_settings ->> 'phone', '')
    where id = practice_row.id;

    if owner_user_id is not null then
      insert into public.organization_members (
        organization_id, user_id, role, status, created_by, updated_by, created_at, updated_at
      )
      values (
        created_organization_id, owner_user_id, 'organization_owner', 'active', owner_user_id, owner_user_id,
        practice_row.created_at, practice_row.updated_at
      )
      on conflict (organization_id, user_id) do nothing;
    end if;
  end loop;
end $$;

alter table public.practices alter column organization_id set not null;
create index practices_organization_id_idx on public.practices(organization_id);

create table public.practice_member_role_assignments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  member_id uuid not null references public.practice_members(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role public.ccm_access_role not null check (role <> 'patient' and role <> 'organization_owner'),
  department_id uuid,
  status public.ccm_membership_status not null default 'active',
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint role_assignment_department_scope check (
    (role = 'department_administrator' and department_id is not null)
    or (role <> 'department_administrator' and department_id is null)
  ),
  constraint role_assignment_validity check (valid_until is null or valid_until > valid_from)
);

create unique index practice_member_active_role_unique
  on public.practice_member_role_assignments(member_id, role, coalesce(department_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'active' and valid_until is null;
create index practice_member_roles_practice_user_idx
  on public.practice_member_role_assignments(practice_id, user_id, status);

insert into public.practice_member_role_assignments (
  practice_id, member_id, user_id, role, status, valid_from, assigned_by, created_at
)
select
  member.practice_id,
  member.id,
  member.user_id,
  case member.role
    when 'owner' then 'practice_administrator'::public.ccm_access_role
    when 'admin' then 'practice_administrator'::public.ccm_access_role
    when 'provider' then 'provider'::public.ccm_access_role
    when 'coordinator' then 'coordinator'::public.ccm_access_role
    when 'billing_staff' then 'billing_administrator'::public.ccm_access_role
  end,
  member.status,
  member.created_at,
  member.created_by,
  member.created_at
from public.practice_members member;

create table public.patient_access_memberships (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.ccm_access_role not null default 'patient' check (role = 'patient'),
  status public.ccm_membership_status not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, patient_id, user_id)
);

create table public.provider_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  staff_member_id uuid not null references public.practice_members(id) on delete cascade,
  responsibility text,
  active_from timestamptz not null default now(),
  active_until timestamptz,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint provider_staff_assignment_validity check (active_until is null or active_until > active_from)
);

create unique index provider_staff_assignment_active_unique
  on public.provider_staff_assignments(provider_id, staff_member_id)
  where active_until is null;
create index provider_staff_assignment_staff_idx
  on public.provider_staff_assignments(practice_id, staff_member_id, active_until);

create table public.patient_primary_provider_history (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  patient_id uuid not null references public.patients(id),
  previous_provider_id uuid references public.providers(id),
  provider_id uuid not null references public.providers(id),
  effective_at timestamptz not null default now(),
  changed_by uuid references auth.users(id),
  change_reason text,
  created_at timestamptz not null default now()
);

insert into public.patient_primary_provider_history (
  practice_id, patient_id, previous_provider_id, provider_id, effective_at, changed_by, change_reason, created_at
)
select practice_id, id, null, primary_provider_id, created_at, created_by, 'Initial ownership backfill', created_at
from public.patients
where primary_provider_id is not null;

alter table public.patients add constraint patients_primary_provider_required
  check (primary_provider_id is not null) not valid;
alter table public.patients validate constraint patients_primary_provider_required;
alter table public.patients alter column primary_provider_id set not null;
alter table public.patients drop constraint patients_primary_provider_required;

create or replace function public.record_patient_primary_provider_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.primary_provider_id is distinct from new.primary_provider_id then
    insert into public.patient_primary_provider_history (
      practice_id, patient_id, previous_provider_id, provider_id, effective_at, changed_by, change_reason
    )
    values (
      new.practice_id,
      new.id,
      case when tg_op = 'UPDATE' then old.primary_provider_id else null end,
      new.primary_provider_id,
      now(),
      coalesce(auth.uid(), new.updated_by, new.created_by),
      case when tg_op = 'INSERT' then 'Initial primary responsible provider' else 'Primary responsible provider reassigned' end
    );
  end if;
  return new;
end;
$$;

create trigger record_patient_primary_provider_history
after insert or update of primary_provider_id on public.patients
for each row execute function public.record_patient_primary_provider_history();

create trigger patient_primary_provider_history_immutable
before update or delete on public.patient_primary_provider_history
for each row execute function public.prevent_immutable_record_change();

create or replace function public.enforce_provider_staff_practice_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.providers provider
    where provider.id = new.provider_id and provider.practice_id = new.practice_id
  ) or not exists (
    select 1 from public.practice_members member
    where member.id = new.staff_member_id and member.practice_id = new.practice_id
  ) then
    raise exception 'Provider and staff member must belong to the selected practice' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger enforce_provider_staff_practice_match
before insert or update on public.provider_staff_assignments
for each row execute function public.enforce_provider_staff_practice_match();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.bootstrap_user_practice(
  practice_name text,
  practice_slug text,
  organization_type text,
  default_timezone text,
  primary_address jsonb,
  phone text,
  logo_url text,
  coordinator_settings jsonb,
  notification_defaults jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_organization public.organizations%rowtype;
  created_practice public.practices%rowtype;
  created_membership public.practice_members%rowtype;
  existing_membership public.practice_members%rowtype;
  existing_practice public.practices%rowtype;
begin
  if current_user_id is null or coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'AAL2 authentication required' using errcode = '42501';
  end if;
  if nullif(trim(practice_name), '') is null or length(trim(practice_name)) > 200 then
    raise exception 'Practice name must contain 1 to 200 characters' using errcode = '22023';
  end if;
  if practice_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(practice_slug) > 64 then
    raise exception 'Practice slug is invalid' using errcode = '22023';
  end if;
  if organization_type not in ('independent_practice', 'group_practice', 'health_system', 'fqhc', 'other') then
    raise exception 'Organization type is invalid' using errcode = '22023';
  end if;
  if not exists (select 1 from pg_timezone_names where name = default_timezone) then
    raise exception 'Time zone is invalid' using errcode = '22023';
  end if;
  if nullif(trim(phone), '') is null or length(trim(phone)) > 40 then
    raise exception 'Phone must contain 1 to 40 characters' using errcode = '22023';
  end if;
  if logo_url is not null and logo_url !~ '^https?://' then
    raise exception 'Logo URL must use http or https' using errcode = '22023';
  end if;
  if jsonb_typeof(coordinator_settings) <> 'object' or jsonb_typeof(notification_defaults) <> 'object' then
    raise exception 'Practice defaults must be JSON objects' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ccm-assistant:user-practice:' || current_user_id::text, 0));

  select member.* into existing_membership
  from public.practice_members member
  where member.user_id = current_user_id and member.status = 'active'
  order by member.created_at, member.id
  limit 1;

  if found then
    select * into existing_practice from public.practices where id = existing_membership.practice_id;
    return jsonb_build_object(
      'created', false,
      'membership', to_jsonb(existing_membership),
      'practice', to_jsonb(existing_practice)
    );
  end if;

  insert into public.organizations (name, slug, organization_type, created_by, updated_by)
  values (trim(practice_name), practice_slug || '-org', organization_type, current_user_id, current_user_id)
  returning * into created_organization;

  insert into public.organization_members (organization_id, user_id, role, status, created_by, updated_by)
  values (created_organization.id, current_user_id, 'organization_owner', 'active', current_user_id, current_user_id);

  insert into public.practices (
    organization_id, name, slug, default_timezone, primary_address, phone, logo_url,
    coordinator_settings, notification_defaults, setup_completed_at, billing_settings,
    created_by, updated_by
  ) values (
    created_organization.id, trim(practice_name), practice_slug, default_timezone, primary_address,
    trim(phone), nullif(trim(logo_url), ''), coordinator_settings, notification_defaults, now(),
    '{}'::jsonb, current_user_id, current_user_id
  ) returning * into created_practice;

  insert into public.practice_members (practice_id, user_id, role, status, created_by, updated_by)
  values (created_practice.id, current_user_id, 'owner', 'active', current_user_id, current_user_id)
  returning * into created_membership;

  insert into public.practice_member_role_assignments (
    practice_id, member_id, user_id, role, status, assigned_by
  ) values (
    created_practice.id, created_membership.id, current_user_id, 'practice_administrator', 'active', current_user_id
  );

  insert into public.audit_events (action, actor_user_id, after_data, entity_id, entity_type, practice_id)
  values (
    'practice.onboarding_completed', current_user_id,
    jsonb_build_object(
      'organization_id', created_organization.id,
      'organization_role', 'organization_owner',
      'membership', to_jsonb(created_membership),
      'practice', to_jsonb(created_practice),
      'practice_role', 'practice_administrator'
    ),
    created_practice.id, 'practice', created_practice.id
  );

  return jsonb_build_object(
    'created', true,
    'membership', to_jsonb(created_membership),
    'organization', to_jsonb(created_organization),
    'practice', to_jsonb(created_practice)
  );
end;
$$;

create or replace function public.resolve_practice_access(requested_practice_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_membership public.practice_members%rowtype;
  resolved_practice public.practices%rowtype;
begin
  if current_user_id is null or coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'AAL2 authentication required' using errcode = '42501';
  end if;

  select member.* into resolved_membership
  from public.practice_members member
  where member.user_id = current_user_id
    and member.status = 'active'
    and (requested_practice_id is null or member.practice_id = requested_practice_id)
  order by member.created_at, member.id
  limit 1;

  if not found and requested_practice_id is not null then
    select member.* into resolved_membership
    from public.practice_members member
    where member.user_id = current_user_id
      and member.status = 'active'
    order by member.created_at, member.id
    limit 1;
  end if;

  if not found then
    return jsonb_build_object('state', 'bootstrap');
  end if;

  select practice.* into resolved_practice
  from public.practices practice
  where practice.id = resolved_membership.practice_id;

  if not found then
    raise exception 'Active practice could not be loaded' using errcode = '55000';
  end if;

  return jsonb_build_object(
    'membership', to_jsonb(resolved_membership),
    'practice', to_jsonb(resolved_practice),
    'state', 'member'
  );
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function public.set_updated_at();

alter table public.access_role_definitions enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.practice_member_role_assignments enable row level security;
alter table public.patient_access_memberships enable row level security;
alter table public.provider_staff_assignments enable row level security;
alter table public.patient_primary_provider_history enable row level security;

create policy access_role_definitions_authenticated_select on public.access_role_definitions
for select to authenticated using (true);
create policy organizations_member_select on public.organizations
for select to authenticated using (public.is_organization_member(id));
create policy organization_members_member_select on public.organization_members
for select to authenticated using (public.is_organization_member(organization_id));
create policy practice_member_roles_member_select on public.practice_member_role_assignments
for select to authenticated using (public.is_practice_member(practice_id));
create policy practice_member_roles_admin_insert on public.practice_member_role_assignments
for insert to authenticated with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy practice_member_roles_admin_update on public.practice_member_role_assignments
for update to authenticated using (public.has_practice_role(practice_id, array['owner','admin']))
with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy patient_access_memberships_admin_select on public.patient_access_memberships
for select to authenticated using (public.has_practice_role(practice_id, array['owner','admin']));
create policy provider_staff_assignments_member_select on public.provider_staff_assignments
for select to authenticated using (public.is_practice_member(practice_id));
create policy provider_staff_assignments_admin_insert on public.provider_staff_assignments
for insert to authenticated with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy provider_staff_assignments_admin_update on public.provider_staff_assignments
for update to authenticated using (public.has_practice_role(practice_id, array['owner','admin']))
with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy patient_primary_provider_history_member_select on public.patient_primary_provider_history
for select to authenticated using (public.is_practice_member(practice_id));

revoke all on table public.access_role_definitions from anon;
revoke all on table public.organizations from anon;
revoke all on table public.organization_members from anon;
revoke all on table public.practice_member_role_assignments from anon;
revoke all on table public.patient_access_memberships from anon;
revoke all on table public.provider_staff_assignments from anon;
revoke all on table public.patient_primary_provider_history from anon;

grant select on table public.access_role_definitions to authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;
grant select, insert, update on table public.practice_member_role_assignments to authenticated;
grant select on table public.patient_access_memberships to authenticated;
grant select, insert, update on table public.provider_staff_assignments to authenticated;
grant select on table public.patient_primary_provider_history to authenticated;

revoke all on function public.is_organization_member(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated;
revoke all on function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) to authenticated;
revoke all on function public.resolve_practice_access(uuid) from public, anon;
grant execute on function public.resolve_practice_access(uuid) to authenticated;

comment on column public.practice_member_role_assignments.department_id is
  'Reserved scope identifier for future department administration; no department management is implemented in Sprint 2.';
comment on table public.patient_primary_provider_history is
  'Immutable event history for Primary Responsible Provider ownership; authorization remains independent.';
