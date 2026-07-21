-- Task-driven coordinator workflow and deterministic opportunity detector.
-- This forward hardening migration must be reviewed before it is applied.

-- Bring already-migrated development environments to the same tenant and provider
-- invariants as a fresh 024-027 application.
create unique index if not exists practice_members_id_user_unique on public.practice_members(id, user_id);

do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'practice_member_role_member_practice_fk') then
    alter table public.practice_member_role_assignments add constraint practice_member_role_member_practice_fk
      foreign key (practice_id, member_id) references public.practice_members(practice_id, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'practice_member_role_member_user_fk') then
    alter table public.practice_member_role_assignments add constraint practice_member_role_member_user_fk
      foreign key (member_id, user_id) references public.practice_members(id, user_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'patient_access_patient_practice_fk') then
    alter table public.patient_access_memberships add constraint patient_access_patient_practice_fk
      foreign key (practice_id, patient_id) references public.patients(practice_id, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'provider_staff_provider_practice_fk') then
    alter table public.provider_staff_assignments add constraint provider_staff_provider_practice_fk
      foreign key (practice_id, provider_id) references public.providers(practice_id, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'provider_staff_member_practice_fk') then
    alter table public.provider_staff_assignments add constraint provider_staff_member_practice_fk
      foreign key (practice_id, staff_member_id) references public.practice_members(practice_id, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'patient_prp_history_patient_practice_fk') then
    alter table public.patient_primary_provider_history add constraint patient_prp_history_patient_practice_fk
      foreign key (practice_id, patient_id) references public.patients(practice_id, id);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'patient_prp_history_previous_provider_practice_fk') then
    alter table public.patient_primary_provider_history add constraint patient_prp_history_previous_provider_practice_fk
      foreign key (practice_id, previous_provider_id) references public.providers(practice_id, id);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'patient_prp_history_provider_practice_fk') then
    alter table public.patient_primary_provider_history add constraint patient_prp_history_provider_practice_fk
      foreign key (practice_id, provider_id) references public.providers(practice_id, id);
  end if;
end $$;

alter table public.providers
  add column if not exists deactivated_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.providers
set deactivated_at = coalesce(updated_at, created_at, pg_catalog.now())
where not is_active and deactivated_at is null;

do $$
begin
  if exists (
    select 1
    from public.providers provider
    join public.patients patient on patient.primary_provider_id = provider.id
    where not provider.is_active
  ) then
    raise exception 'Transfer active patient ownership from inactive providers before applying migration 027';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'providers_lifecycle_valid') then
    alter table public.providers add constraint providers_lifecycle_valid check (
      (is_active and deactivated_at is null and archived_at is null)
      or (not is_active and deactivated_at is not null and (archived_at is null or archived_at >= deactivated_at))
    );
  end if;
end $$;

alter table public.patients drop constraint if exists patients_primary_provider_id_fkey;
alter table public.patients add constraint patients_primary_provider_id_fkey
  foreign key (primary_provider_id) references public.providers(id) on delete restrict;

create or replace function public.enforce_provider_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Providers cannot be deleted; transfer patient ownership, deactivate, then archive the provider'
      using errcode = '23503';
  end if;
  if new.is_active then
    new.deactivated_at := null;
    new.archived_at := null;
    return new;
  end if;
  if exists (select 1 from public.patients patient where patient.primary_provider_id = new.id) then
    raise exception 'Transfer all Primary Responsible Provider assignments before deactivating or archiving this provider'
      using errcode = '23503';
  end if;
  new.deactivated_at := coalesce(new.deactivated_at, pg_catalog.now());
  if new.archived_at is not null and old.is_active then
    raise exception 'Deactivate the provider before archiving' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_provider_lifecycle on public.providers;
create trigger enforce_provider_lifecycle before update or delete on public.providers
for each row execute function public.enforce_provider_lifecycle();

alter function public.is_organization_member(uuid) set search_path = '';
alter function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) set search_path = pg_catalog;
alter function public.resolve_practice_access(uuid) set search_path = '';
alter function public.record_patient_primary_provider_history() set search_path = '';
alter function public.enforce_provider_staff_practice_match() set search_path = '';

alter table public.practices
  add column ccm_month_end_awareness_day smallint not null default 25 check (ccm_month_end_awareness_day between 1 and 28),
  add column allow_coordinator_claiming boolean not null default false,
  add column opportunity_expiration_overrides jsonb not null default '{}'::jsonb check (jsonb_typeof(opportunity_expiration_overrides) = 'object');

create table public.ccm_opportunities (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  detector_version text not null,
  rule_version text not null,
  rule_identifier text not null,
  opportunity_type text not null check (opportunity_type in ('medication_follow_up','hospital_discharge','educational_reminder','month_end_operational_reminder','abnormal_questionnaire','home_monitoring','provider_review','care_plan_revision')),
  trigger_code text not null,
  trigger_summary text not null,
  benefit_rationale text not null,
  condition_or_workflow_item text not null,
  suggested_activity text not null,
  eligible_performers text[] not null default '{}',
  provider_involvement text not null check (provider_involvement in ('not_required','review_if_escalated','required')),
  input_facts jsonb not null default '{}'::jsonb,
  evidence_fingerprint text not null,
  generated_at timestamptz not null,
  expires_at timestamptz not null,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, patient_id, detector_version, rule_version, rule_identifier, evidence_fingerprint)
);

create table public.ccm_opportunity_evidence (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  opportunity_id uuid not null references public.ccm_opportunities(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  observed_at timestamptz not null,
  summary text not null,
  facts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ccm_work_items (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  opportunity_id uuid references public.ccm_opportunities(id) on delete set null,
  primary_provider_id uuid not null references public.providers(id),
  assigned_member_id uuid references public.practice_members(id) on delete set null,
  related_condition_id uuid references public.patient_conditions(id) on delete set null,
  queue_group text not null check (queue_group in ('needs_attention','ready_to_contact','awaiting_patient','awaiting_provider','documentation_needed','completed_today')),
  status text not null default 'open' check (status in ('open','in_progress','deferred','awaiting_patient','awaiting_provider','completed','cancelled')),
  priority text not null check (priority in ('urgent','high','normal','low','none')),
  priority_score integer not null default 0 check (priority_score >= 0),
  title text not null,
  reason text not null,
  due_at timestamptz,
  outcome text,
  escalation_status text not null default 'none' check (escalation_status in ('none','requested','acknowledged','resolved')),
  manual_priority text check (manual_priority is null or manual_priority in ('urgent','high','normal','low')),
  manual_priority_reason text,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ccm_work_items_manual_priority_reason check (
    (manual_priority is null and manual_priority_reason is null)
    or (
      manual_priority is not null
      and manual_priority_reason is not null
      and length(trim(manual_priority_reason)) between 3 and 500
    )
  ),
  constraint ccm_work_items_completion check (
    (status = 'completed' and completed_at is not null and length(trim(outcome)) > 0)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.ccm_work_item_priority_factors (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  work_item_id uuid not null references public.ccm_work_items(id) on delete cascade,
  factor_code text not null,
  weight integer not null,
  explanation text not null,
  input_fact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ccm_opportunity_dispositions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  opportunity_id uuid not null references public.ccm_opportunities(id),
  disposition text not null check (disposition in ('accepted','different_action','provider_review','deferred','no_intervention')),
  note text,
  actual_review_minutes integer check (actual_review_minutes between 1 and 1440),
  actual_time_affirmed boolean not null default false,
  resulting_work_item_id uuid references public.ccm_work_items(id) on delete set null,
  provider_escalation_required boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint ccm_disposition_time_attestation check (actual_review_minutes is null or actual_time_affirmed),
  constraint ccm_disposition_task_semantics check (
    (disposition in ('accepted','different_action','provider_review') and resulting_work_item_id is not null)
    or (disposition in ('deferred','no_intervention') and resulting_work_item_id is null)
  ),
  constraint ccm_disposition_note check (disposition <> 'no_intervention' or length(trim(note)) between 3 and 1000)
);

create table public.ccm_work_item_deviations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  work_item_id uuid not null references public.ccm_work_items(id) on delete cascade,
  complexity_note text not null check (length(trim(complexity_note)) between 3 and 2000),
  actual_impact text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.ccm_clinical_reports (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  work_item_id uuid references public.ccm_work_items(id) on delete set null,
  primary_provider_id uuid not null references public.providers(id),
  recipient_type text not null check (recipient_type in ('primary_responsible_provider','supervising_provider','specialist','compliance','billing','coordinator')),
  recipient_provider_id uuid references public.providers(id) on delete set null,
  recipient_member_id uuid references public.practice_members(id) on delete set null,
  purpose text not null,
  condition_or_workflow_item text not null,
  delivery_method text not null check (delivery_method in ('secure_workspace','secure_link','approved_secure_message','export')),
  contains_phi boolean not null default true,
  delivery_status text not null default 'draft' check (delivery_status in ('draft','queued','sent','acknowledged','failed')),
  follow_up_due_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint ccm_report_recipient check (recipient_provider_id is not null or recipient_member_id is not null),
  constraint ccm_report_no_ordinary_email check (delivery_method <> 'ordinary_email')
);

create table public.ccm_work_item_events (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  work_item_id uuid references public.ccm_work_items(id) on delete set null,
  opportunity_id uuid references public.ccm_opportunities(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.interaction_logs
  add column work_item_id uuid references public.ccm_work_items(id) on delete set null,
  add column opportunity_disposition_id uuid references public.ccm_opportunity_dispositions(id) on delete set null,
  add column actual_time_affirmed boolean not null default false;

create index ccm_opportunities_patient_active_idx on public.ccm_opportunities(practice_id, patient_id, expires_at desc);
create unique index ccm_opportunities_practice_id_unique on public.ccm_opportunities(practice_id, id);
create unique index ccm_work_items_practice_id_unique on public.ccm_work_items(practice_id, id);
create unique index ccm_opportunity_evidence_source_unique on public.ccm_opportunity_evidence(
  opportunity_id, source_type, coalesce(source_id, '00000000-0000-0000-0000-000000000000'::uuid), observed_at
);
create index ccm_work_items_queue_idx on public.ccm_work_items(practice_id, queue_group, status, priority_score desc, due_at);
create index ccm_work_items_assignee_idx on public.ccm_work_items(practice_id, assigned_member_id, status);
create unique index ccm_opportunity_one_disposition_idx on public.ccm_opportunity_dispositions(opportunity_id);
create index ccm_reports_patient_idx on public.ccm_clinical_reports(practice_id, patient_id, created_at desc);
create index interaction_logs_work_item_idx on public.interaction_logs(work_item_id) where work_item_id is not null;

alter table public.ccm_opportunities add constraint ccm_opportunities_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id);
alter table public.ccm_opportunity_evidence add constraint ccm_opportunity_evidence_opportunity_practice_fk foreign key (practice_id, opportunity_id) references public.ccm_opportunities(practice_id, id);
alter table public.ccm_work_items add constraint ccm_work_items_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id);
alter table public.ccm_work_items add constraint ccm_work_items_opportunity_practice_fk foreign key (practice_id, opportunity_id) references public.ccm_opportunities(practice_id, id);
alter table public.ccm_work_items add constraint ccm_work_items_provider_practice_fk foreign key (practice_id, primary_provider_id) references public.providers(practice_id, id);
alter table public.ccm_work_items add constraint ccm_work_items_assignee_practice_fk foreign key (practice_id, assigned_member_id) references public.practice_members(practice_id, id);
alter table public.ccm_work_items add constraint ccm_work_items_condition_practice_fk foreign key (practice_id, related_condition_id) references public.patient_conditions(practice_id, id);
alter table public.ccm_work_item_priority_factors add constraint ccm_priority_factors_work_item_practice_fk foreign key (practice_id, work_item_id) references public.ccm_work_items(practice_id, id);
alter table public.ccm_opportunity_dispositions add constraint ccm_dispositions_opportunity_practice_fk foreign key (practice_id, opportunity_id) references public.ccm_opportunities(practice_id, id);
alter table public.ccm_opportunity_dispositions add constraint ccm_dispositions_work_item_practice_fk foreign key (practice_id, resulting_work_item_id) references public.ccm_work_items(practice_id, id);
alter table public.ccm_work_item_deviations add constraint ccm_deviations_work_item_practice_fk foreign key (practice_id, work_item_id) references public.ccm_work_items(practice_id, id);
alter table public.ccm_clinical_reports add constraint ccm_reports_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id);
alter table public.ccm_clinical_reports add constraint ccm_reports_work_item_practice_fk foreign key (practice_id, work_item_id) references public.ccm_work_items(practice_id, id);
alter table public.ccm_clinical_reports add constraint ccm_reports_prp_practice_fk foreign key (practice_id, primary_provider_id) references public.providers(practice_id, id);
alter table public.ccm_clinical_reports add constraint ccm_reports_recipient_provider_practice_fk foreign key (practice_id, recipient_provider_id) references public.providers(practice_id, id);
alter table public.ccm_clinical_reports add constraint ccm_reports_recipient_member_practice_fk foreign key (practice_id, recipient_member_id) references public.practice_members(practice_id, id);
alter table public.ccm_work_item_events add constraint ccm_events_work_item_practice_fk foreign key (practice_id, work_item_id) references public.ccm_work_items(practice_id, id);
alter table public.ccm_work_item_events add constraint ccm_events_opportunity_practice_fk foreign key (practice_id, opportunity_id) references public.ccm_opportunities(practice_id, id);

create or replace function public.ccm_user_in_patient_scope(target_practice_id uuid, target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1
    from public.practice_members member
    left join public.patients patient on patient.practice_id = member.practice_id and patient.id = target_patient_id
    left join public.ccm_enrollments enrollment on enrollment.practice_id = member.practice_id and enrollment.patient_id = patient.id
    where member.practice_id = target_practice_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and (
        member.role in ('owner','admin','provider')
        or (member.role = 'coordinator' and member.id in (patient.care_coordinator_member_id, enrollment.care_coordinator_member_id))
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
  if (auth.jwt() ->> 'aal') <> 'aal2' or auth.uid() is null then raise exception 'AAL2 authentication required'; end if;
  select * into membership_row
  from public.practice_members
  where practice_id = target_practice_id and user_id = auth.uid() and role = 'coordinator' and status = 'active';
  if membership_row.id is null then raise exception 'Active coordinator membership required'; end if;
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
  where practice_id = target_practice_id and patient_id = target_patient_id
    and status = 'active' and care_coordinator_member_id is null;

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

create or replace function public.reject_ccm_immutable_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'CCM evidence and audit records are immutable';
end;
$$;
revoke all on function public.reject_ccm_immutable_change() from public, anon, authenticated, service_role;

create trigger ccm_opportunities_immutable before update or delete on public.ccm_opportunities for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_opportunity_evidence_immutable before update or delete on public.ccm_opportunity_evidence for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_opportunity_dispositions_immutable before update or delete on public.ccm_opportunity_dispositions for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_work_item_priority_factors_immutable before update or delete on public.ccm_work_item_priority_factors for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_work_item_deviations_immutable before update or delete on public.ccm_work_item_deviations for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_work_item_events_immutable before update or delete on public.ccm_work_item_events for each row execute function public.reject_ccm_immutable_change();
create trigger ccm_work_items_updated_at before update on public.ccm_work_items for each row execute function public.set_updated_at();

create or replace function public.record_ccm_work_item_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ccm_work_item_events (practice_id, work_item_id, opportunity_id, event_type, event_data, actor_user_id)
  values (new.practice_id, new.id, new.opportunity_id, 'work_item.updated', pg_catalog.jsonb_build_object('before', pg_catalog.to_jsonb(old), 'after', pg_catalog.to_jsonb(new)), auth.uid());
  return new;
end;
$$;
revoke all on function public.record_ccm_work_item_change() from public, anon, authenticated, service_role;
create trigger ccm_work_items_audit after update on public.ccm_work_items for each row execute function public.record_ccm_work_item_change();

alter table public.ccm_opportunities enable row level security;
alter table public.ccm_opportunity_evidence enable row level security;
alter table public.ccm_work_items enable row level security;
alter table public.ccm_work_item_priority_factors enable row level security;
alter table public.ccm_opportunity_dispositions enable row level security;
alter table public.ccm_work_item_deviations enable row level security;
alter table public.ccm_clinical_reports enable row level security;
alter table public.ccm_work_item_events enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'ccm_opportunities','ccm_opportunity_evidence','ccm_work_items','ccm_work_item_priority_factors',
    'ccm_opportunity_dispositions','ccm_work_item_deviations','ccm_clinical_reports','ccm_work_item_events'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_practice_member(practice_id))', table_name || '_member_select', table_name);
  end loop;
end $$;

create policy ccm_clinical_reports_scoped_insert on public.ccm_clinical_reports for insert to authenticated with check (public.ccm_user_in_patient_scope(practice_id, patient_id));

create policy ccm_work_items_scoped_update on public.ccm_work_items for update to authenticated
using (public.ccm_user_in_patient_scope(practice_id, patient_id))
with check (public.ccm_user_in_patient_scope(practice_id, patient_id));
create policy ccm_clinical_reports_scoped_update on public.ccm_clinical_reports for update to authenticated
using (public.ccm_user_in_patient_scope(practice_id, patient_id))
with check (public.ccm_user_in_patient_scope(practice_id, patient_id));

revoke all on table public.ccm_opportunities, public.ccm_opportunity_evidence, public.ccm_work_items,
  public.ccm_work_item_priority_factors, public.ccm_opportunity_dispositions, public.ccm_work_item_deviations,
  public.ccm_clinical_reports, public.ccm_work_item_events from anon, authenticated, service_role;
grant select on table public.ccm_opportunities, public.ccm_opportunity_evidence, public.ccm_work_items,
  public.ccm_work_item_priority_factors, public.ccm_opportunity_dispositions, public.ccm_work_item_deviations,
  public.ccm_clinical_reports, public.ccm_work_item_events to authenticated;
grant update on table public.ccm_work_items, public.ccm_clinical_reports to authenticated;
grant insert on table public.ccm_clinical_reports to authenticated;
grant select, insert on table public.ccm_opportunities, public.ccm_opportunity_evidence to service_role;

create or replace function public.store_ccm_opportunity(
  opportunity_record jsonb,
  evidence_records jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  stored_opportunity public.ccm_opportunities%rowtype;
  evidence_record jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Trusted server role required' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(opportunity_record) <> 'object'
    or pg_catalog.jsonb_typeof(evidence_records) <> 'array'
    or pg_catalog.jsonb_array_length(evidence_records) = 0 then
    raise exception 'Opportunity and at least one evidence record are required' using errcode = '22023';
  end if;

  insert into public.ccm_opportunities (
    practice_id, patient_id, detector_version, rule_version, rule_identifier, opportunity_type,
    trigger_code, trigger_summary, benefit_rationale, condition_or_workflow_item, suggested_activity,
    eligible_performers, provider_involvement, input_facts, evidence_fingerprint, generated_at,
    expires_at, generated_by
  ) values (
    (opportunity_record ->> 'practice_id')::uuid,
    (opportunity_record ->> 'patient_id')::uuid,
    opportunity_record ->> 'detector_version',
    opportunity_record ->> 'rule_version',
    opportunity_record ->> 'rule_identifier',
    opportunity_record ->> 'opportunity_type',
    opportunity_record ->> 'trigger_code',
    opportunity_record ->> 'trigger_summary',
    opportunity_record ->> 'benefit_rationale',
    opportunity_record ->> 'condition_or_workflow_item',
    opportunity_record ->> 'suggested_activity',
    array(select pg_catalog.jsonb_array_elements_text(opportunity_record -> 'eligible_performers')),
    opportunity_record ->> 'provider_involvement',
    opportunity_record -> 'input_facts',
    opportunity_record ->> 'evidence_fingerprint',
    (opportunity_record ->> 'generated_at')::timestamptz,
    (opportunity_record ->> 'expires_at')::timestamptz,
    nullif(opportunity_record ->> 'generated_by', '')::uuid
  )
  on conflict (practice_id, patient_id, detector_version, rule_version, rule_identifier, evidence_fingerprint)
  do nothing
  returning * into stored_opportunity;

  if stored_opportunity.id is null then
    select * into stored_opportunity
    from public.ccm_opportunities opportunity
    where opportunity.practice_id = (opportunity_record ->> 'practice_id')::uuid
      and opportunity.patient_id = (opportunity_record ->> 'patient_id')::uuid
      and opportunity.detector_version = opportunity_record ->> 'detector_version'
      and opportunity.rule_version = opportunity_record ->> 'rule_version'
      and opportunity.rule_identifier = opportunity_record ->> 'rule_identifier'
      and opportunity.evidence_fingerprint = opportunity_record ->> 'evidence_fingerprint';
    return pg_catalog.jsonb_build_object('created', false, 'opportunity', pg_catalog.to_jsonb(stored_opportunity));
  end if;

  for evidence_record in select value from pg_catalog.jsonb_array_elements(evidence_records)
  loop
    insert into public.ccm_opportunity_evidence (
      practice_id, opportunity_id, source_type, source_id, observed_at, summary, facts
    ) values (
      stored_opportunity.practice_id,
      stored_opportunity.id,
      evidence_record ->> 'source_type',
      nullif(evidence_record ->> 'source_id', '')::uuid,
      (evidence_record ->> 'observed_at')::timestamptz,
      evidence_record ->> 'summary',
      coalesce(evidence_record -> 'facts', '{}'::jsonb)
    );
  end loop;

  return pg_catalog.jsonb_build_object('created', true, 'opportunity', pg_catalog.to_jsonb(stored_opportunity));
end;
$$;
revoke all on function public.store_ccm_opportunity(jsonb, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.store_ccm_opportunity(jsonb, jsonb) to service_role;

create or replace function public.dispose_ccm_opportunity(
  target_opportunity_id uuid,
  disposition_value text,
  disposition_note text default null,
  review_minutes integer default null,
  time_affirmed boolean default false,
  task_title text default null,
  task_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  opportunity_row public.ccm_opportunities;
  patient_row public.patients;
  membership_row public.practice_members;
  work_item_id uuid;
  disposition_id uuid;
  interaction_id uuid;
begin
  if disposition_value not in ('accepted','different_action','provider_review','deferred','no_intervention') then
    raise exception 'Unsupported opportunity disposition';
  end if;
  if review_minutes is not null and (review_minutes < 1 or review_minutes > 1440 or not time_affirmed) then
    raise exception 'Actual review time requires a valid duration and affirmative attestation';
  end if;
  if disposition_value = 'no_intervention' and length(trim(coalesce(disposition_note, ''))) < 3 then
    raise exception 'No intervention requires a concise note';
  end if;

  select * into opportunity_row from public.ccm_opportunities where id = target_opportunity_id;
  if opportunity_row.id is null or opportunity_row.expires_at <= pg_catalog.now() then raise exception 'Opportunity is missing or stale'; end if;
  if not public.ccm_user_in_patient_scope(opportunity_row.practice_id, opportunity_row.patient_id) then raise exception 'Clinical work scope required'; end if;
  if exists (select 1 from public.ccm_opportunity_dispositions where opportunity_id = target_opportunity_id) then raise exception 'Opportunity was already dispositioned'; end if;
  select * into patient_row from public.patients where id = opportunity_row.patient_id and practice_id = opportunity_row.practice_id;
  if patient_row.primary_provider_id is null then raise exception 'Primary Responsible Provider is required'; end if;
  select * into membership_row from public.practice_members where practice_id = opportunity_row.practice_id and user_id = auth.uid() and status = 'active';
  if membership_row.role = 'billing_staff' then raise exception 'Billing users cannot execute clinical work'; end if;

  if disposition_value in ('accepted','different_action','provider_review') then
    insert into public.ccm_work_items (
      practice_id, patient_id, opportunity_id, primary_provider_id, assigned_member_id, queue_group,
      status, priority, priority_score, title, reason, due_at, created_by, updated_by
    ) values (
      opportunity_row.practice_id, opportunity_row.patient_id, opportunity_row.id, patient_row.primary_provider_id,
      case when disposition_value = 'provider_review' then null else membership_row.id end,
      case when disposition_value = 'provider_review' then 'awaiting_provider' else 'needs_attention' end,
      case when disposition_value = 'provider_review' then 'awaiting_provider' else 'open' end,
      case when opportunity_row.provider_involvement = 'required' then 'high' else 'normal' end,
      case when opportunity_row.provider_involvement = 'required' then 550 else 300 end,
      coalesce(nullif(pg_catalog.btrim(task_title), ''), opportunity_row.suggested_activity),
      coalesce(nullif(pg_catalog.btrim(disposition_note), ''), opportunity_row.benefit_rationale), task_due_at, auth.uid(), auth.uid()
    ) returning id into work_item_id;
  end if;

  insert into public.ccm_opportunity_dispositions (
    practice_id, opportunity_id, disposition, note, actual_review_minutes, actual_time_affirmed,
    resulting_work_item_id, provider_escalation_required, created_by
  ) values (
    opportunity_row.practice_id, opportunity_row.id, disposition_value, nullif(pg_catalog.btrim(disposition_note), ''),
    review_minutes, time_affirmed, work_item_id, disposition_value = 'provider_review', auth.uid()
  ) returning id into disposition_id;

  if review_minutes is not null then
    insert into public.interaction_logs (
      practice_id, patient_id, provider_id, staff_member_id, activity_type, source, minutes,
      occurred_at, occurrence_date, billing_month, notes, request_id, created_by, updated_by,
      work_item_id, opportunity_disposition_id, actual_time_affirmed
    ) values (
      opportunity_row.practice_id, opportunity_row.patient_id, patient_row.primary_provider_id, membership_row.id,
      'care_review', 'manual', review_minutes, pg_catalog.now(), current_date, pg_catalog.date_trunc('month', current_date)::date,
      'Actual opportunity review time entered and affirmed by the user.', pg_catalog.gen_random_uuid(), auth.uid(), auth.uid(),
      work_item_id, disposition_id, true
    ) returning id into interaction_id;
  end if;

  insert into public.ccm_work_item_events (practice_id, work_item_id, opportunity_id, event_type, event_data, actor_user_id)
  values (
    opportunity_row.practice_id, work_item_id, opportunity_row.id, 'opportunity.dispositioned',
    pg_catalog.jsonb_build_object('detector_version', opportunity_row.detector_version, 'disposition', disposition_value,
      'rule_version', opportunity_row.rule_version, 'rule_identifier', opportunity_row.rule_identifier,
      'actual_review_minutes', review_minutes, 'time_affirmed', time_affirmed, 'interaction_log_id', interaction_id), auth.uid()
  );
  return pg_catalog.jsonb_build_object('disposition_id', disposition_id, 'work_item_id', work_item_id, 'interaction_log_id', interaction_id);
end;
$$;
revoke all on function public.dispose_ccm_opportunity(uuid, text, text, integer, boolean, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.dispose_ccm_opportunity(uuid, text, text, integer, boolean, text, timestamptz) to authenticated;

revoke all on function public.enforce_provider_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.record_patient_primary_provider_history() from public, anon, authenticated, service_role;
revoke all on function public.enforce_provider_staff_practice_match() from public, anon, authenticated, service_role;

-- Normalize residual broad grants left by older default-privilege behavior.
revoke all on table public.providers from anon, authenticated, service_role;
grant select, insert, update on table public.providers to authenticated;
grant select, insert, update on table public.providers to service_role;

revoke all on table public.access_role_definitions, public.organizations, public.organization_members,
  public.practice_member_role_assignments, public.patient_access_memberships,
  public.provider_staff_assignments, public.patient_primary_provider_history
  from anon, authenticated, service_role;
grant select on table public.access_role_definitions, public.organizations, public.organization_members,
  public.patient_access_memberships, public.patient_primary_provider_history to authenticated;
grant select, insert, update on table public.practice_member_role_assignments,
  public.provider_staff_assignments to authenticated;

revoke all on table public.practice_staff_invitations, public.care_plan_versions,
  public.care_plan_reviews, public.checkin_deliveries from anon, authenticated, service_role;
grant select on table public.practice_staff_invitations, public.care_plan_versions,
  public.care_plan_reviews, public.checkin_deliveries to authenticated;
grant select, insert, update on table public.practice_staff_invitations to service_role;
grant select, insert on table public.care_plan_versions, public.care_plan_reviews to service_role;
grant select, insert, update on table public.checkin_deliveries to service_role;

revoke all on function public.version_care_plan_content() from public, anon, authenticated, service_role;
revoke all on function public.snapshot_care_plan_version() from public, anon, authenticated, service_role;
revoke all on function public.prevent_immutable_pilot_history_change() from public, anon, authenticated, service_role;
revoke all on function public.transition_care_plan_review(uuid, text, text, text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.transition_care_plan_review(uuid, text, text, text, text, uuid) to service_role;

revoke all on function public.is_organization_member(uuid) from public, anon, authenticated, service_role;
grant execute on function public.is_organization_member(uuid) to authenticated;
revoke all on function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) to authenticated;
revoke all on function public.resolve_practice_access(uuid) from public, anon, authenticated, service_role;
grant execute on function public.resolve_practice_access(uuid) to authenticated;

-- RC-003 hardening: remove legacy default table capabilities that are not
-- required by the Data API or server runtime. Preserve only explicit DML grants.
revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated, service_role;

-- Provider review is performed by server code through the service-role client.
-- The transition function is SECURITY INVOKER and therefore requires these
-- table privileges in addition to its EXECUTE grant.
grant select, update on table public.care_plans to service_role;

-- Retain the old signature for migration-history compatibility, but do not
-- expose an RPC that cannot populate the organization required since 025.
revoke all on function public.bootstrap_first_practice(text, text, boolean, boolean)
  from public, anon, authenticated, service_role;
comment on function public.bootstrap_first_practice(text, text, boolean, boolean) is
  'Legacy bootstrap retained for migration-history compatibility only; replaced by bootstrap_user_practice and intentionally not executable.';

-- Migrations 012, 016, and 022 installed these constraints as NOT VALID so
-- existing deployments could be checked before enforcement. RC-003 completes
-- that staged rollout. Any inconsistent shared data must fail migration replay.
alter table public.billing_evidence_snapshots validate constraint billing_evidence_monthly_practice_fk;
alter table public.billing_evidence_snapshots validate constraint billing_evidence_patient_practice_fk;
alter table public.care_plans validate constraint care_plans_condition_practice_fk;
alter table public.care_plans validate constraint care_plans_enrollment_practice_fk;
alter table public.care_plans validate constraint care_plans_patient_practice_fk;
alter table public.care_plans validate constraint care_plans_provider_practice_fk;
alter table public.ccm_enrollments validate constraint ccm_enrollments_coordinator_practice_fk;
alter table public.ccm_enrollments validate constraint ccm_enrollments_dates_check;
alter table public.ccm_enrollments validate constraint ccm_enrollments_patient_practice_fk;
alter table public.ccm_enrollments validate constraint ccm_enrollments_provider_practice_fk;
alter table public.checkin_instances validate constraint checkin_instances_enrollment_practice_fk;
alter table public.checkin_instances validate constraint checkin_instances_patient_practice_fk;
alter table public.checkin_instances validate constraint checkin_instances_provider_practice_fk;
alter table public.checkin_instances validate constraint checkin_instances_template_practice_fk;
alter table public.checkin_instances validate constraint checkin_instances_token_expiry_check;
alter table public.checkin_responses validate constraint checkin_responses_instance_practice_fk;
alter table public.checkin_responses validate constraint checkin_responses_patient_practice_fk;
alter table public.checkin_responses validate constraint checkin_responses_session_practice_fk;
alter table public.checkin_templates validate constraint checkin_templates_provider_practice_fk;
alter table public.interaction_logs validate constraint interaction_logs_checkin_practice_fk;
alter table public.interaction_logs validate constraint interaction_logs_enrollment_practice_fk;
alter table public.interaction_logs validate constraint interaction_logs_patient_practice_fk;
alter table public.interaction_logs validate constraint interaction_logs_provider_practice_fk;
alter table public.interaction_logs validate constraint interaction_logs_staff_practice_fk;
alter table public.monthly_billability validate constraint monthly_billability_checkin_practice_fk;
alter table public.monthly_billability validate constraint monthly_billability_enrollment_practice_fk;
alter table public.monthly_billability validate constraint monthly_billability_patient_practice_fk;
alter table public.patient_conditions validate constraint patient_conditions_patient_practice_fk;
alter table public.patient_intake_summaries validate constraint patient_intake_enrollment_practice_fk;
alter table public.patient_intake_summaries validate constraint patient_intake_patient_practice_fk;
alter table public.patient_question_preferences validate constraint patient_question_preferences_condition_practice_fk;
alter table public.patient_question_preferences validate constraint patient_question_preferences_patient_practice_fk;
alter table public.patients validate constraint patients_coordinator_practice_fk;
alter table public.patients validate constraint patients_dob_not_future_check;
alter table public.patients validate constraint patients_provider_practice_fk;
alter table public.provider_preferences validate constraint provider_preferences_provider_practice_fk;
alter table public.provider_question_preferences validate constraint provider_question_preferences_provider_practice_fk;
alter table public.providers validate constraint providers_member_practice_fk;
alter table public.providers validate constraint providers_npi_format_check;
alter table public.question_sessions validate constraint question_sessions_care_plan_practice_fk;
alter table public.question_sessions validate constraint question_sessions_checkin_practice_fk;
alter table public.question_sessions validate constraint question_sessions_patient_practice_fk;

comment on function public.ccm_user_in_patient_scope(uuid, uuid) is
  'SECURITY DEFINER: authenticated-only AAL2 scope helper; reads membership and assignment state without granting table writes.';
comment on function public.claim_unassigned_ccm_patient(uuid, uuid) is
  'SECURITY DEFINER: authenticated AAL2 coordinator action; atomically claims only an unassigned patient when practice policy allows it.';
comment on function public.record_ccm_work_item_change() is
  'SECURITY DEFINER trigger only: writes immutable audit events for authenticated work-item updates without granting event inserts.';
comment on function public.dispose_ccm_opportunity(uuid, text, text, integer, boolean, text, timestamptz) is
  'SECURITY DEFINER: authenticated AAL2 clinical transaction; validates patient scope before creating disposition, work, time, and audit records.';
comment on function public.store_ccm_opportunity(jsonb, jsonb) is
  'SECURITY INVOKER: service-role-only atomic immutable opportunity/evidence insert; exact duplicates return the existing row without mutation.';
comment on function public.enforce_provider_lifecycle() is
  'SECURITY DEFINER trigger only: enforces transfer then deactivate then archive and prohibits provider deletion.';
comment on function public.is_organization_member(uuid) is
  'SECURITY DEFINER: authenticated-only RLS helper; reads organization membership with caller identity from auth.uid().';
comment on function public.bootstrap_user_practice(text, text, text, text, jsonb, text, text, jsonb, jsonb) is
  'SECURITY DEFINER: authenticated AAL2-only atomic organization/practice/owner bootstrap; no direct table write grants are required.';
comment on function public.resolve_practice_access(uuid) is
  'SECURITY DEFINER: authenticated AAL2-only membership resolver used before a practice context exists.';
comment on function public.record_patient_primary_provider_history() is
  'SECURITY DEFINER trigger only: records immutable PRP ownership history despite caller table privileges.';
comment on function public.enforce_provider_staff_practice_match() is
  'SECURITY DEFINER trigger only: defense-in-depth validation for provider/staff tenant consistency.';

comment on table public.ccm_opportunities is 'Immutable, deterministic clinical/operational suggestions. Changed detector inputs or versions create a new row; a suggestion is not completed work.';
comment on column public.ccm_opportunities.input_facts is 'Patient-specific facts evaluated by detector_version; never inferred billing work.';
comment on column public.interaction_logs.actual_time_affirmed is 'True only after a user affirmatively attests that entered minutes are actual time.';
