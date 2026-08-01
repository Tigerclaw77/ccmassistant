-- RC-005: make the canonical access-role assignments operational while
-- retaining practice_members.role as a temporary compatibility projection.

alter table public.practice_staff_invitations
  add column access_role public.ccm_access_role;

update public.practice_staff_invitations
set access_role = case role::text
  when 'owner' then 'practice_administrator'::public.ccm_access_role
  when 'admin' then 'practice_administrator'::public.ccm_access_role
  when 'provider' then 'provider'::public.ccm_access_role
  when 'coordinator' then 'coordinator'::public.ccm_access_role
  when 'billing_staff' then 'billing_administrator'::public.ccm_access_role
end;

alter table public.practice_staff_invitations
  alter column access_role set not null,
  add constraint practice_staff_invitation_operational_role check (
    access_role not in ('organization_owner', 'department_administrator', 'patient')
  );

create or replace function public.has_access_role(
  target_practice_id uuid,
  allowed_roles public.ccm_access_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and (
    exists (
      select 1
      from public.practice_members member
      join public.practice_member_role_assignments assignment
        on assignment.practice_id = member.practice_id
       and assignment.member_id = member.id
      where member.practice_id = target_practice_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and assignment.status = 'active'
        and assignment.valid_from <= pg_catalog.now()
        and (assignment.valid_until is null or assignment.valid_until > pg_catalog.now())
        and assignment.role = any(allowed_roles)
    )
    or (
      'organization_owner'::public.ccm_access_role = any(allowed_roles)
      and exists (
        select 1
        from public.practices practice
        join public.organization_members organization_member
          on organization_member.organization_id = practice.organization_id
        join public.practice_members member
          on member.practice_id = practice.id
         and member.user_id = organization_member.user_id
        where practice.id = target_practice_id
          and organization_member.user_id = auth.uid()
          and organization_member.role = 'organization_owner'
          and organization_member.status = 'active'
          and member.status = 'active'
      )
    )
  );
$$;

revoke all on function public.has_access_role(uuid, public.ccm_access_role[]) from public, anon, authenticated, service_role;
grant execute on function public.has_access_role(uuid, public.ccm_access_role[]) to authenticated;

create or replace function public.has_practice_role(target_practice_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_access_role(
    target_practice_id,
    array_remove(array[
      case when allowed_roles && array['owner','admin'] then 'organization_owner'::public.ccm_access_role end,
      case when allowed_roles && array['owner','admin'] then 'practice_administrator'::public.ccm_access_role end,
      case when 'provider' = any(allowed_roles) then 'provider'::public.ccm_access_role end,
      case when 'coordinator' = any(allowed_roles) then 'coordinator'::public.ccm_access_role end,
      case when 'coordinator' = any(allowed_roles) then 'clinical_staff'::public.ccm_access_role end,
      case when 'billing_staff' = any(allowed_roles) then 'billing_administrator'::public.ccm_access_role end
    ], null)
  );
$$;

revoke all on function public.has_practice_role(uuid, text[]) from public, anon, authenticated, service_role;
grant execute on function public.has_practice_role(uuid, text[]) to authenticated;

create or replace function public.ccm_user_in_patient_scope(target_practice_id uuid, target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_access_role(target_practice_id, array[
      'organization_owner', 'practice_administrator', 'provider'
    ]::public.ccm_access_role[])
    or (
      public.has_access_role(target_practice_id, array['coordinator','clinical_staff']::public.ccm_access_role[])
      and exists (
        select 1
        from public.practice_members member
        left join public.patients patient
          on patient.practice_id = member.practice_id and patient.id = target_patient_id
        left join public.ccm_enrollments enrollment
          on enrollment.practice_id = member.practice_id and enrollment.patient_id = patient.id
        where member.practice_id = target_practice_id
          and member.user_id = auth.uid()
          and member.status = 'active'
          and member.id in (patient.care_coordinator_member_id, enrollment.care_coordinator_member_id)
      )
    );
$$;

revoke all on function public.ccm_user_in_patient_scope(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.ccm_user_in_patient_scope(uuid, uuid) to authenticated;

create or replace function public.claim_unassigned_ccm_patient(target_practice_id uuid, target_patient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_row public.practice_members;
  claimed_patient_id uuid;
begin
  if not public.has_access_role(target_practice_id, array['coordinator']::public.ccm_access_role[]) then
    raise exception 'Active coordinator role required';
  end if;
  select * into membership_row from public.practice_members
  where practice_id = target_practice_id and user_id = auth.uid() and status = 'active';
  if membership_row.id is null then raise exception 'Active practice membership required'; end if;
  if not exists (select 1 from public.practices where id = target_practice_id and allow_coordinator_claiming = true) then
    raise exception 'Coordinator claiming is disabled for this practice';
  end if;
  update public.patients
  set care_coordinator_member_id = membership_row.id, updated_by = auth.uid(), updated_at = pg_catalog.now()
  where id = target_patient_id and practice_id = target_practice_id and care_coordinator_member_id is null
  returning id into claimed_patient_id;
  if claimed_patient_id is null then raise exception 'Patient is already assigned or unavailable'; end if;
  update public.ccm_enrollments
  set care_coordinator_member_id = membership_row.id, updated_by = auth.uid(), updated_at = pg_catalog.now()
  where practice_id = target_practice_id and patient_id = target_patient_id and status = 'active' and care_coordinator_member_id is null;
  update public.ccm_work_items
  set assigned_member_id = membership_row.id, updated_by = auth.uid(), updated_at = pg_catalog.now()
  where practice_id = target_practice_id and patient_id = target_patient_id and assigned_member_id is null
    and status in ('open','in_progress','deferred','awaiting_patient');
  insert into public.audit_events (practice_id, actor_user_id, entity_type, entity_id, action, after_data, metadata)
  values (target_practice_id, auth.uid(), 'patient', target_patient_id, 'patient.coordinator_claimed',
    pg_catalog.jsonb_build_object('care_coordinator_member_id', membership_row.id), pg_catalog.jsonb_build_object('source', 'my_work_today'));
  return pg_catalog.jsonb_build_object('patient_id', target_patient_id, 'member_id', membership_row.id);
end;
$$;

revoke all on function public.claim_unassigned_ccm_patient(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.claim_unassigned_ccm_patient(uuid, uuid) to authenticated;

create or replace function public.update_practice_member_access(
  target_practice_id uuid,
  target_member_id uuid,
  action_value text,
  access_role_value public.ccm_access_role,
  actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_row public.practice_members;
  restored_role public.ccm_access_role;
  changed_at timestamptz := pg_catalog.clock_timestamp();
  legacy_role public.ccm_member_role;
begin
  select * into member_row from public.practice_members
  where id = target_member_id and practice_id = target_practice_id for update;
  if member_row.id is null then raise exception 'Practice member not found'; end if;
  if action_value = 'change_role' then
    if access_role_value is null or access_role_value in ('organization_owner','department_administrator','patient') then raise exception 'Unsupported operational role'; end if;
    legacy_role := case access_role_value
      when 'practice_administrator' then 'admin'::public.ccm_member_role
      when 'provider' then 'provider'::public.ccm_member_role
      when 'coordinator' then 'coordinator'::public.ccm_member_role
      when 'clinical_staff' then 'coordinator'::public.ccm_member_role
      else 'billing_staff'::public.ccm_member_role
    end;
    update public.practice_members set role = legacy_role, last_role_changed_at = changed_at, updated_by = actor_user_id, updated_at = changed_at
    where id = target_member_id and practice_id = target_practice_id returning * into member_row;
    update public.practice_member_role_assignments set status = 'inactive', valid_until = changed_at
    where practice_id = target_practice_id and member_id = target_member_id and status = 'active';
    insert into public.practice_member_role_assignments (practice_id,member_id,user_id,role,status,valid_from,assigned_by,created_at)
    values (target_practice_id,target_member_id,member_row.user_id,access_role_value,member_row.status,changed_at,actor_user_id,changed_at);
  elsif action_value in ('disable','remove') then
    update public.practice_members set status = 'inactive', disabled_at = changed_at,
      removed_at = case when action_value = 'remove' then changed_at else removed_at end,
      updated_by = actor_user_id, updated_at = changed_at
    where id = target_member_id and practice_id = target_practice_id returning * into member_row;
    update public.practice_member_role_assignments set status = 'inactive', valid_until = changed_at
    where practice_id = target_practice_id and member_id = target_member_id and status = 'active';
  elsif action_value = 'enable' then
    if member_row.removed_at is not null then raise exception 'Removed members cannot be re-enabled'; end if;
    select role into restored_role from public.practice_member_role_assignments
    where practice_id = target_practice_id and member_id = target_member_id
    order by created_at desc limit 1;
    if restored_role is null then raise exception 'Operational role history is missing'; end if;
    update public.practice_members set status = 'active', disabled_at = null, updated_by = actor_user_id, updated_at = changed_at
    where id = target_member_id and practice_id = target_practice_id returning * into member_row;
    insert into public.practice_member_role_assignments (practice_id,member_id,user_id,role,status,valid_from,assigned_by,created_at)
    values (target_practice_id,target_member_id,member_row.user_id,restored_role,'active',changed_at,actor_user_id,changed_at);
  else
    raise exception 'Unsupported staff action';
  end if;
  return pg_catalog.to_jsonb(member_row);
end;
$$;

revoke all on function public.update_practice_member_access(uuid,uuid,text,public.ccm_access_role,uuid) from public, anon, authenticated, service_role;
grant execute on function public.update_practice_member_access(uuid,uuid,text,public.ccm_access_role,uuid) to service_role;

comment on column public.practice_staff_invitations.access_role is
  'Canonical operational role granted when the invitation is accepted; role remains a legacy compatibility projection.';
comment on function public.has_access_role(uuid, public.ccm_access_role[]) is
  'AAL2, active-membership access check backed by canonical assignments with an explicit organization-owner override.';
comment on function public.update_practice_member_access(uuid,uuid,text,public.ccm_access_role,uuid) is
  'Service-only atomic lifecycle update for the legacy membership projection and canonical operational role assignment.';
