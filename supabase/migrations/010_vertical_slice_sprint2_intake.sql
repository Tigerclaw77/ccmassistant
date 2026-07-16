-- Vertical Slice MVP Sprint 2: structured eligibility metadata support and AI-reviewed intake artifacts.

create table if not exists public.patient_intake_summaries (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  enrollment_id uuid references public.ccm_enrollments(id) on delete set null,
  status text not null default 'draft',
  input_snapshot jsonb not null default '{}'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  follow_up_questions jsonb not null default '[]'::jsonb,
  draft_summary jsonb not null default '{}'::jsonb,
  reviewed_summary jsonb,
  confidence_score numeric(4,3),
  quality_flags text[] not null default '{}',
  generated_by text not null default 'fallback',
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.patient_intake_summaries
    add constraint patient_intake_summaries_status_check
    check (status in ('draft', 'accepted', 'archived'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.patient_intake_summaries
    add constraint patient_intake_summaries_confidence_score_check
    check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.patient_intake_summaries
    add constraint patient_intake_summaries_generated_by_check
    check (generated_by in ('openai', 'fallback'));
exception when duplicate_object then null;
end $$;

create index if not exists patient_intake_summaries_patient_idx
  on public.patient_intake_summaries(practice_id, patient_id, created_at desc);

create unique index if not exists patient_intake_summaries_one_accepted_idx
  on public.patient_intake_summaries(practice_id, patient_id)
  where status = 'accepted';

drop trigger if exists set_updated_at on public.patient_intake_summaries;
create trigger set_updated_at
before update on public.patient_intake_summaries
for each row
execute function public.set_updated_at();

alter table public.patient_intake_summaries enable row level security;

do $$
begin
  create policy patient_intake_summary_rows_member_access
  on public.patient_intake_summaries for all
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));
exception when duplicate_object then null;
end $$;
