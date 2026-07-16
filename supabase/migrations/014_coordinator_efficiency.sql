-- Coordinator efficiency: deterministic intake provenance and bounded page-query indexes.

alter table public.patient_intake_summaries
  drop constraint if exists patient_intake_summaries_generated_by_check;

alter table public.patient_intake_summaries
  add constraint patient_intake_summaries_generated_by_check
  check (generated_by in ('openai', 'fallback', 'session_engine'));

create extension if not exists pg_trgm with schema extensions;

create index if not exists patients_practice_display_name_id_idx
  on public.patients(practice_id, display_name, id);
create index if not exists patients_practice_status_name_idx
  on public.patients(practice_id, status, display_name, id);
create index if not exists patients_practice_coordinator_name_idx
  on public.patients(practice_id, care_coordinator_member_id, display_name, id);
create index if not exists patients_display_name_trgm_idx
  on public.patients using gin (display_name extensions.gin_trgm_ops);
create index if not exists patients_external_id_trgm_idx
  on public.patients using gin (external_id extensions.gin_trgm_ops);
create index if not exists patients_phone_trgm_idx
  on public.patients using gin (phone extensions.gin_trgm_ops);

create index if not exists ccm_enrollments_practice_patient_updated_idx
  on public.ccm_enrollments(practice_id, patient_id, updated_at desc);
create index if not exists interaction_logs_practice_month_patient_idx
  on public.interaction_logs(practice_id, billing_month, patient_id)
  where deleted_at is null;
create index if not exists care_plans_practice_patient_active_idx
  on public.care_plans(practice_id, patient_id, updated_at desc)
  where status = 'active';
create index if not exists patient_intake_practice_patient_accepted_idx
  on public.patient_intake_summaries(practice_id, patient_id, updated_at desc)
  where status = 'accepted';
create index if not exists checkins_practice_month_patient_idx
  on public.checkin_instances(practice_id, billing_month, patient_id);
create index if not exists question_sessions_worklist_idx
  on public.question_sessions(practice_id, patient_id, status, updated_at desc);

-- Existing row-level policies remain authoritative; these indexes contain no new data surface.
