create table if not exists public.question_sessions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  checkin_instance_id uuid references public.checkin_instances(id) on delete cascade,
  care_plan_id uuid references public.care_plans(id) on delete set null,
  workflow text not null check (workflow in ('intake', 'monthly_checkin', 'annual_review', 'care_plan_review')),
  status text not null default 'draft' check (status in ('draft', 'paused', 'completed', 'cancelled')),
  state_version integer not null default 1 check (state_version > 0),
  session_state jsonb not null,
  started_at timestamptz not null,
  paused_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checkin_responses
  add column if not exists question_session_id uuid references public.question_sessions(id) on delete set null,
  add column if not exists canonical_question_id text,
  add column if not exists question_version integer;

create unique index if not exists question_sessions_checkin_unique
  on public.question_sessions(checkin_instance_id)
  where checkin_instance_id is not null;

create unique index if not exists question_sessions_one_open_workflow
  on public.question_sessions(practice_id, patient_id, workflow)
  where status in ('draft', 'paused') and checkin_instance_id is null;

create unique index if not exists checkin_responses_session_question_unique
  on public.checkin_responses(question_session_id, canonical_question_id)
  where question_session_id is not null and canonical_question_id is not null;

create index if not exists question_sessions_patient_workflow_idx
  on public.question_sessions(practice_id, patient_id, workflow, updated_at desc);

drop trigger if exists set_question_sessions_updated_at on public.question_sessions;
create trigger set_question_sessions_updated_at
before update on public.question_sessions
for each row execute function public.set_updated_at();

alter table public.question_sessions enable row level security;

create policy question_sessions_member_select on public.question_sessions
for select using (public.is_practice_member(practice_id));

create policy question_sessions_care_team_insert on public.question_sessions
for insert with check (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']));

create policy question_sessions_care_team_update on public.question_sessions
for update using (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']))
with check (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']));
