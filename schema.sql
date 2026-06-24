-- CCM Assistant initial schema draft.
-- Ledger-first goal: support one clean CCM billing month per patient.

create extension if not exists pgcrypto;

do $$ begin
  create type public.ccm_member_role as enum (
    'owner',
    'provider',
    'coordinator',
    'billing_staff',
    'admin'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_membership_status as enum (
    'invited',
    'active',
    'inactive'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_contact_method as enum (
    'phone',
    'sms',
    'email',
    'portal',
    'none'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_eligibility_status as enum (
    'needs_review',
    'eligible',
    'ineligible'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_consent_status as enum (
    'not_collected',
    'obtained',
    'declined',
    'revoked'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_consent_method as enum (
    'verbal',
    'written',
    'electronic',
    'unknown'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_enrollment_status as enum (
    'pending',
    'active',
    'paused',
    'inactive',
    'declined'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_question_source as enum (
    'global',
    'practice',
    'provider',
    'ai_candidate'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_question_status as enum (
    'draft',
    'active',
    'archived',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_answer_type as enum (
    'yes_no',
    'text',
    'number',
    'scale',
    'multi_choice',
    'date'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_question_preference as enum (
    'favorite',
    'preferred',
    'avoid'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_checkin_status as enum (
    'draft',
    'ready',
    'sent',
    'responded',
    'no_response',
    'follow_up_needed',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_activity_type as enum (
    'call',
    'voicemail',
    'failed_attempt',
    'care_review',
    'care_coordination',
    'checkin_review',
    'portal_message',
    'documentation',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_interaction_source as enum (
    'manual',
    'check_in',
    'call',
    'portal',
    'care_coordination',
    'import'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_care_plan_status as enum (
    'draft',
    'active',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ccm_billability_status as enum (
    'not_ready',
    'ready_to_bill',
    'billed',
    'hold',
    'ineligible'
  );
exception when duplicate_object then null;
end $$;

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  npi text,
  tax_id text,
  default_timezone text not null default 'America/Chicago',
  ccm_monthly_min_minutes integer not null default 20 check (ccm_monthly_min_minutes > 0),
  billing_settings jsonb not null default '{}'::jsonb,
  account_status text not null default 'setup',
  subscription_provider text,
  subscription_external_id text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practice_members (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role public.ccm_member_role not null,
  status public.ccm_membership_status not null default 'invited',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_members_user_or_invite check (user_id is not null or invited_email is not null),
  constraint practice_members_unique_user unique (practice_id, user_id)
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  member_id uuid references public.practice_members(id) on delete set null,
  full_name text not null,
  credentials text,
  npi text,
  phone text,
  email text,
  is_billing_provider boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_preferences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  monthly_question_soft_cap integer not null default 8 check (monthly_question_soft_cap > 0),
  condition_question_soft_cap integer not null default 2 check (condition_question_soft_cap > 0),
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_preferences_unique_provider unique (practice_id, provider_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  external_id text,
  first_name text,
  last_name text,
  display_name text not null,
  dob date,
  phone text,
  email text,
  preferred_contact_method public.ccm_contact_method not null default 'phone',
  status text not null default 'active',
  primary_provider_id uuid references public.providers(id) on delete set null,
  care_coordinator_member_id uuid references public.practice_members(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_unique_external_id unique (practice_id, external_id)
);

create table public.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  condition_name text not null,
  code_system text,
  code text,
  is_active boolean not null default true,
  diagnosed_on date,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ccm_enrollments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  status public.ccm_enrollment_status not null default 'pending',
  eligibility_status public.ccm_eligibility_status not null default 'needs_review',
  eligibility_notes text,
  eligibility_metadata jsonb not null default '{}'::jsonb,
  consent_status public.ccm_consent_status not null default 'not_collected',
  consent_date date,
  consent_method public.ccm_consent_method not null default 'unknown',
  consent_document_url text,
  initiating_visit_date date,
  assigned_provider_id uuid references public.providers(id) on delete set null,
  care_coordinator_member_id uuid references public.practice_members(id) on delete set null,
  enrolled_at timestamptz,
  ended_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  source public.ccm_question_source not null default 'practice',
  status public.ccm_question_status not null default 'draft',
  prompt text not null,
  answer_type public.ccm_answer_type not null default 'text',
  options jsonb not null default '[]'::jsonb,
  monthly_soft_cap integer not null default 2 check (monthly_soft_cap > 0),
  ai_candidate_metadata jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_global_practice_consistency check (
    (source = 'global' and practice_id is null)
    or (source <> 'global' and practice_id is not null)
  )
);

create table public.question_tags (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'condition',
  condition_code text,
  created_at timestamptz not null default now(),
  constraint question_tags_unique unique (question_id, tag, tag_type)
);

create table public.provider_question_preferences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  preference public.ccm_question_preference not null default 'favorite',
  condition_tag text,
  sort_order integer not null default 0,
  monthly_soft_cap integer check (monthly_soft_cap is null or monthly_soft_cap > 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_question_preferences_unique unique (practice_id, provider_id, question_id, condition_tag)
);

create table public.patient_question_preferences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  patient_condition_id uuid references public.patient_conditions(id) on delete set null,
  preference public.ccm_question_preference not null default 'preferred',
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_question_preferences_unique unique (practice_id, patient_id, question_id)
);

create table public.checkin_templates (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  name text not null,
  description text,
  cadence text not null default 'monthly',
  status text not null default 'draft',
  default_question_ids uuid[] not null default '{}'::uuid[],
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkin_instances (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  enrollment_id uuid references public.ccm_enrollments(id) on delete set null,
  template_id uuid references public.checkin_templates(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  billing_month date not null,
  status public.ccm_checkin_status not null default 'ready',
  token text unique,
  sent_at timestamptz,
  responded_at timestamptz,
  followup_due_at timestamptz,
  no_response_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkin_instances_billing_month_first_day check (date_trunc('month', billing_month)::date = billing_month),
  constraint checkin_instances_unique_month unique (practice_id, patient_id, billing_month)
);

create table public.checkin_responses (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  checkin_instance_id uuid not null references public.checkin_instances(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  response_value jsonb,
  response_text text,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.interaction_logs (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  enrollment_id uuid references public.ccm_enrollments(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  staff_member_id uuid references public.practice_members(id) on delete set null,
  checkin_instance_id uuid references public.checkin_instances(id) on delete set null,
  activity_type public.ccm_activity_type not null,
  source public.ccm_interaction_source not null default 'manual',
  minutes numeric(6,2) not null check (minutes > 0),
  occurred_at timestamptz not null default now(),
  billing_month date not null,
  notes text,
  correction_of_id uuid references public.interaction_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interaction_logs_billing_month_first_day check (date_trunc('month', billing_month)::date = billing_month)
);

create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  patient_condition_id uuid references public.patient_conditions(id) on delete set null,
  enrollment_id uuid references public.ccm_enrollments(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  status public.ccm_care_plan_status not null default 'draft',
  goals jsonb not null default '[]'::jsonb,
  interventions jsonb not null default '[]'::jsonb,
  barriers jsonb not null default '[]'::jsonb,
  notes text,
  last_reviewed_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_billability (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  enrollment_id uuid references public.ccm_enrollments(id) on delete set null,
  billing_month date not null,
  total_minutes numeric(7,2) not null default 0,
  qualifying_interaction_count integer not null default 0,
  checkin_instance_id uuid references public.checkin_instances(id) on delete set null,
  consent_valid boolean not null default false,
  care_plan_current boolean not null default false,
  eligibility_valid boolean not null default false,
  status public.ccm_billability_status not null default 'not_ready',
  reason_codes text[] not null default '{}',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  billed_at timestamptz,
  exported_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_billability_billing_month_first_day check (date_trunc('month', billing_month)::date = billing_month),
  constraint monthly_billability_unique_patient_month unique (practice_id, patient_id, billing_month)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'practices',
    'practice_members',
    'providers',
    'provider_preferences',
    'patients',
    'patient_conditions',
    'ccm_enrollments',
    'questions',
    'provider_question_preferences',
    'patient_question_preferences',
    'checkin_templates',
    'checkin_instances',
    'interaction_logs',
    'care_plans',
    'monthly_billability'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      target_table
    );
  end loop;
end $$;

create or replace function public.is_practice_member(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_members member
    where member.practice_id = target_practice_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

revoke all on function public.is_practice_member(uuid) from public;
grant execute on function public.is_practice_member(uuid) to authenticated;

alter table public.practices enable row level security;
alter table public.practice_members enable row level security;
alter table public.providers enable row level security;
alter table public.provider_preferences enable row level security;
alter table public.patients enable row level security;
alter table public.patient_conditions enable row level security;
alter table public.ccm_enrollments enable row level security;
alter table public.questions enable row level security;
alter table public.question_tags enable row level security;
alter table public.provider_question_preferences enable row level security;
alter table public.patient_question_preferences enable row level security;
alter table public.checkin_templates enable row level security;
alter table public.checkin_instances enable row level security;
alter table public.checkin_responses enable row level security;
alter table public.interaction_logs enable row level security;
alter table public.care_plans enable row level security;
alter table public.monthly_billability enable row level security;
alter table public.audit_events enable row level security;

create policy practices_member_select
on public.practices for select
using (public.is_practice_member(id));

create policy practice_members_member_select
on public.practice_members for select
using (public.is_practice_member(practice_id) or user_id = auth.uid());

create policy practice_members_member_insert
on public.practice_members for insert
with check (public.is_practice_member(practice_id));

create policy practice_members_member_update
on public.practice_members for update
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy provider_rows_member_access
on public.providers for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy provider_preference_rows_member_access
on public.provider_preferences for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patient_rows_member_access
on public.patients for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patient_condition_rows_member_access
on public.patient_conditions for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy ccm_enrollment_rows_member_access
on public.ccm_enrollments for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy questions_select_global_or_member
on public.questions for select
using (practice_id is null or public.is_practice_member(practice_id));

create policy questions_member_write
on public.questions for all
using (practice_id is not null and public.is_practice_member(practice_id))
with check (practice_id is not null and public.is_practice_member(practice_id));

create policy question_tags_select_global_or_member
on public.question_tags for select
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and (q.practice_id is null or public.is_practice_member(q.practice_id))
  )
);

create policy question_tags_member_write
on public.question_tags for all
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and q.practice_id is not null
      and q.practice_id = practice_id
      and public.is_practice_member(q.practice_id)
  )
)
with check (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and q.practice_id is not null
      and q.practice_id = practice_id
      and public.is_practice_member(q.practice_id)
  )
);

create policy provider_question_preference_rows_member_access
on public.provider_question_preferences for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patient_question_preference_rows_member_access
on public.patient_question_preferences for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy checkin_template_rows_member_access
on public.checkin_templates for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy checkin_instance_rows_member_access
on public.checkin_instances for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy checkin_response_rows_member_access
on public.checkin_responses for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy interaction_log_rows_member_access
on public.interaction_logs for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy care_plan_rows_member_access
on public.care_plans for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy monthly_billability_rows_member_access
on public.monthly_billability for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy audit_event_rows_member_access
on public.audit_events for all
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create index if not exists practice_members_practice_id_idx on public.practice_members(practice_id);
create index if not exists practice_members_user_id_idx on public.practice_members(user_id);
create index if not exists providers_practice_id_idx on public.providers(practice_id);
create index if not exists patients_practice_id_idx on public.patients(practice_id);
create index if not exists patients_provider_id_idx on public.patients(primary_provider_id);
create index if not exists patient_conditions_patient_id_idx on public.patient_conditions(patient_id);
create index if not exists ccm_enrollments_patient_id_idx on public.ccm_enrollments(patient_id);
create unique index if not exists ccm_enrollments_one_active_idx on public.ccm_enrollments(practice_id, patient_id) where status = 'active';
create index if not exists questions_practice_id_idx on public.questions(practice_id);
create index if not exists question_tags_question_id_idx on public.question_tags(question_id);
create index if not exists provider_question_preferences_provider_id_idx on public.provider_question_preferences(provider_id);
create index if not exists patient_question_preferences_patient_id_idx on public.patient_question_preferences(patient_id);
create index if not exists checkin_instances_patient_month_idx on public.checkin_instances(patient_id, billing_month);
create index if not exists checkin_instances_status_idx on public.checkin_instances(practice_id, status, followup_due_at);
create index if not exists checkin_responses_instance_id_idx on public.checkin_responses(checkin_instance_id);
create index if not exists interaction_logs_patient_month_idx on public.interaction_logs(patient_id, billing_month);
create index if not exists care_plans_patient_id_idx on public.care_plans(patient_id);
create index if not exists monthly_billability_practice_month_idx on public.monthly_billability(practice_id, billing_month, status);
create index if not exists audit_events_entity_idx on public.audit_events(practice_id, entity_type, entity_id);
