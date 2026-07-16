alter table public.patient_conditions
  add column if not exists display_name text,
  add column if not exists canonical_name text,
  add column if not exists user_entered_text text,
  add column if not exists ccm_qualifying boolean not null default true,
  add column if not exists normalization_status text not null default 'manual';

update public.patient_conditions
set
  display_name = coalesce(display_name, condition_name),
  canonical_name = coalesce(canonical_name, condition_name),
  user_entered_text = coalesce(user_entered_text, condition_name),
  ccm_qualifying = coalesce(ccm_qualifying, true),
  normalization_status = coalesce(normalization_status, case when code is null then 'manual' else 'normalized' end);

alter table public.patient_conditions
  alter column display_name set not null,
  alter column canonical_name set not null,
  alter column user_entered_text set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'patient_conditions_normalization_status_check'
      and conrelid = 'public.patient_conditions'::regclass
  ) then
    alter table public.patient_conditions
      add constraint patient_conditions_normalization_status_check
      check (normalization_status in ('normalized', 'manual', 'unverified'));
  end if;
end $$;

create index if not exists patient_conditions_practice_code_idx
  on public.patient_conditions(practice_id, code)
  where code is not null;

create index if not exists patient_conditions_patient_active_qualifying_idx
  on public.patient_conditions(patient_id, is_active, ccm_qualifying);
