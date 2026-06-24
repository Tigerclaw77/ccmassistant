-- Preserve the MVP billing evidence used when a patient-month is reviewed or billed.

create table if not exists public.billing_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  monthly_billability_id uuid references public.monthly_billability(id) on delete set null,
  billing_month date not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint billing_evidence_snapshots_billing_month_first_day check (date_trunc('month', billing_month)::date = billing_month),
  constraint billing_evidence_snapshots_unique_patient_month unique (practice_id, patient_id, billing_month)
);

alter table public.billing_evidence_snapshots enable row level security;

create policy billing_evidence_snapshots_member_select
on public.billing_evidence_snapshots for select
using (public.is_practice_member(practice_id));

create policy billing_evidence_snapshots_member_insert
on public.billing_evidence_snapshots for insert
with check (public.is_practice_member(practice_id));

create policy billing_evidence_snapshots_member_update
on public.billing_evidence_snapshots for update
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create index if not exists billing_evidence_snapshots_patient_month_idx
on public.billing_evidence_snapshots(practice_id, patient_id, billing_month);
