-- Launch hardening: explicit role policies, immutable audit/evidence records, and billing data guards.

create or replace function public.has_practice_role(target_practice_id uuid, allowed_roles text[])
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
      and member.role::text = any(allowed_roles)
  );
$$;

revoke all on function public.has_practice_role(uuid, text[]) from public;
grant execute on function public.has_practice_role(uuid, text[]) to authenticated;

create or replace function public.prevent_immutable_record_change()
returns trigger
language plpgsql
as $$
begin
  raise exception '% records are immutable', tg_table_name using errcode = '42501';
end;
$$;

drop trigger if exists audit_events_immutable on public.audit_events;
create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function public.prevent_immutable_record_change();

drop trigger if exists billing_evidence_snapshots_immutable on public.billing_evidence_snapshots;
create trigger billing_evidence_snapshots_immutable
before update or delete on public.billing_evidence_snapshots
for each row execute function public.prevent_immutable_record_change();

create or replace function public.enforce_patient_practice_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.patients patient
    where patient.id = new.patient_id and patient.practice_id = new.practice_id
  ) then
    raise exception 'Patient does not belong to the selected practice' using errcode = '23503';
  end if;
  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'patient_conditions',
    'ccm_enrollments',
    'patient_question_preferences',
    'checkin_instances',
    'checkin_responses',
    'interaction_logs',
    'care_plans',
    'patient_intake_summaries',
    'monthly_billability',
    'billing_evidence_snapshots'
  ]
  loop
    execute format('drop trigger if exists enforce_patient_practice_match on public.%I', target_table);
    execute format(
      'create trigger enforce_patient_practice_match before insert or update on public.%I for each row execute function public.enforce_patient_practice_match()',
      target_table
    );
  end loop;
end $$;

drop policy if exists practice_members_member_insert on public.practice_members;
drop policy if exists practice_members_member_update on public.practice_members;
create policy practice_members_admin_insert on public.practice_members for insert
with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy practice_members_admin_update on public.practice_members for update
using (public.has_practice_role(practice_id, array['owner','admin']))
with check (public.has_practice_role(practice_id, array['owner','admin']));

create policy practices_admin_update on public.practices for update
using (public.has_practice_role(id, array['owner','admin']))
with check (public.has_practice_role(id, array['owner','admin']));

drop policy if exists provider_rows_member_access on public.providers;
create policy providers_member_select on public.providers for select using (public.is_practice_member(practice_id));
create policy providers_admin_insert on public.providers for insert
with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy providers_admin_update on public.providers for update
using (public.has_practice_role(practice_id, array['owner','admin']))
with check (public.has_practice_role(practice_id, array['owner','admin']));
create policy providers_admin_delete on public.providers for delete
using (public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists provider_preference_rows_member_access on public.provider_preferences;
create policy provider_preferences_member_select on public.provider_preferences for select using (public.is_practice_member(practice_id));
create policy provider_preferences_clinical_insert on public.provider_preferences for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy provider_preferences_clinical_update on public.provider_preferences for update
using (public.has_practice_role(practice_id, array['owner','admin','provider']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy provider_preferences_admin_delete on public.provider_preferences for delete
using (public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists patient_rows_member_access on public.patients;
create policy patients_member_select on public.patients for select using (public.is_practice_member(practice_id));
create policy patients_care_team_insert on public.patients for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy patients_care_team_update on public.patients for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists patient_condition_rows_member_access on public.patient_conditions;
create policy patient_conditions_member_select on public.patient_conditions for select using (public.is_practice_member(practice_id));
create policy patient_conditions_care_team_insert on public.patient_conditions for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy patient_conditions_care_team_update on public.patient_conditions for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists ccm_enrollment_rows_member_access on public.ccm_enrollments;
create policy ccm_enrollments_member_select on public.ccm_enrollments for select using (public.is_practice_member(practice_id));
create policy ccm_enrollments_care_team_insert on public.ccm_enrollments for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy ccm_enrollments_care_team_update on public.ccm_enrollments for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists checkin_instance_rows_member_access on public.checkin_instances;
create policy checkin_instances_member_select on public.checkin_instances for select using (public.is_practice_member(practice_id));
create policy checkin_instances_care_team_insert on public.checkin_instances for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy checkin_instances_care_team_update on public.checkin_instances for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists checkin_response_rows_member_access on public.checkin_responses;
create policy checkin_responses_member_select on public.checkin_responses for select using (public.is_practice_member(practice_id));
create policy checkin_responses_care_team_insert on public.checkin_responses for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists interaction_log_rows_member_access on public.interaction_logs;
create policy interaction_logs_member_select on public.interaction_logs for select using (public.is_practice_member(practice_id));
create policy interaction_logs_care_team_insert on public.interaction_logs for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy interaction_logs_care_team_update on public.interaction_logs for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists care_plan_rows_member_access on public.care_plans;
create policy care_plans_member_select on public.care_plans for select using (public.is_practice_member(practice_id));
create policy care_plans_care_team_insert on public.care_plans for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy care_plans_care_team_update on public.care_plans for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists patient_intake_summary_rows_member_access on public.patient_intake_summaries;
create policy patient_intake_summaries_member_select on public.patient_intake_summaries for select using (public.is_practice_member(practice_id));
create policy patient_intake_summaries_care_team_insert on public.patient_intake_summaries for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy patient_intake_summaries_care_team_update on public.patient_intake_summaries for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));

drop policy if exists monthly_billability_rows_member_access on public.monthly_billability;
create policy monthly_billability_member_select on public.monthly_billability for select using (public.is_practice_member(practice_id));
create policy monthly_billability_billing_insert on public.monthly_billability for insert
with check (public.has_practice_role(practice_id, array['owner','admin','billing_staff']));
create policy monthly_billability_billing_update on public.monthly_billability for update
using (public.has_practice_role(practice_id, array['owner','admin','billing_staff']))
with check (public.has_practice_role(practice_id, array['owner','admin','billing_staff']));

drop policy if exists audit_event_rows_member_access on public.audit_events;
create policy audit_events_member_select on public.audit_events for select using (public.is_practice_member(practice_id));
create policy audit_events_member_insert on public.audit_events for insert
with check (public.is_practice_member(practice_id) and (actor_user_id is null or actor_user_id = auth.uid()));

drop policy if exists billing_evidence_snapshots_member_insert on public.billing_evidence_snapshots;
drop policy if exists billing_evidence_snapshots_member_update on public.billing_evidence_snapshots;
create policy billing_evidence_snapshots_billing_insert on public.billing_evidence_snapshots for insert
with check (public.has_practice_role(practice_id, array['owner','admin','billing_staff']));

drop policy if exists questions_member_write on public.questions;
create policy questions_clinical_insert on public.questions for insert
with check (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy questions_clinical_update on public.questions for update
using (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']))
with check (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy questions_admin_delete on public.questions for delete
using (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists question_tags_member_write on public.question_tags;
create policy question_tags_clinical_insert on public.question_tags for insert
with check (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy question_tags_clinical_update on public.question_tags for update
using (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']))
with check (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy question_tags_admin_delete on public.question_tags for delete
using (practice_id is not null and public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists provider_question_preference_rows_member_access on public.provider_question_preferences;
create policy provider_question_preferences_member_select on public.provider_question_preferences for select
using (public.is_practice_member(practice_id));
create policy provider_question_preferences_clinical_insert on public.provider_question_preferences for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy provider_question_preferences_clinical_update on public.provider_question_preferences for update
using (public.has_practice_role(practice_id, array['owner','admin','provider']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy provider_question_preferences_admin_delete on public.provider_question_preferences for delete
using (public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists patient_question_preference_rows_member_access on public.patient_question_preferences;
create policy patient_question_preferences_member_select on public.patient_question_preferences for select
using (public.is_practice_member(practice_id));
create policy patient_question_preferences_care_team_insert on public.patient_question_preferences for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy patient_question_preferences_care_team_update on public.patient_question_preferences for update
using (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider','coordinator']));
create policy patient_question_preferences_admin_delete on public.patient_question_preferences for delete
using (public.has_practice_role(practice_id, array['owner','admin']));

drop policy if exists checkin_template_rows_member_access on public.checkin_templates;
create policy checkin_templates_member_select on public.checkin_templates for select
using (public.is_practice_member(practice_id));
create policy checkin_templates_clinical_insert on public.checkin_templates for insert
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy checkin_templates_clinical_update on public.checkin_templates for update
using (public.has_practice_role(practice_id, array['owner','admin','provider']))
with check (public.has_practice_role(practice_id, array['owner','admin','provider']));
create policy checkin_templates_admin_delete on public.checkin_templates for delete
using (public.has_practice_role(practice_id, array['owner','admin']));

alter table public.providers add constraint providers_npi_format_check
check (npi is null or npi ~ '^[0-9]{10}$') not valid;
alter table public.patients add constraint patients_dob_not_future_check
check (dob is null or dob <= current_date) not valid;
alter table public.ccm_enrollments add constraint ccm_enrollments_dates_check
check (
  (consent_date is null or consent_date <= current_date)
  and (initiating_visit_date is null or initiating_visit_date <= current_date)
  and (ended_at is null or enrolled_at is null or ended_at >= enrolled_at)
) not valid;
alter table public.interaction_logs add constraint interaction_logs_launch_validation_check
check (
  minutes > 0 and minutes <= 480
  and notes is not null and length(btrim(notes)) >= 8
  and billing_month = date_trunc('month', occurred_at)::date
) not valid;
