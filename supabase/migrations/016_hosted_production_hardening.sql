-- Hosted production hardening: enforce MFA, expire public bearer links, and
-- prevent cross-practice foreign references without rewriting prior migrations.

alter table public.checkin_instances
  add column if not exists token_expires_at timestamptz;

update public.checkin_instances
set token_expires_at = coalesce(sent_at, created_at) + interval '14 days'
where token is not null and token_expires_at is null;

do $$
begin
  alter table public.checkin_instances
    add constraint checkin_instances_token_expiry_check
    check (token is null or token_expires_at is not null) not valid;
exception when duplicate_object then null;
end $$;

create index if not exists checkin_instances_public_token_active_idx
  on public.checkin_instances(token, token_expires_at)
  where token is not null;

create unique index if not exists checkin_responses_legacy_question_unique
  on public.checkin_responses(checkin_instance_id, question_id)
  where question_session_id is null and question_id is not null;

-- Composite references need a unique practice/id target. These indexes are
-- intentionally redundant with primary keys so PostgreSQL can enforce tenancy.
create unique index if not exists practice_members_practice_id_unique
  on public.practice_members(practice_id, id);
create unique index if not exists providers_practice_id_unique
  on public.providers(practice_id, id);
create unique index if not exists patients_practice_id_unique
  on public.patients(practice_id, id);
create unique index if not exists patient_conditions_practice_id_unique
  on public.patient_conditions(practice_id, id);
create unique index if not exists ccm_enrollments_practice_id_unique
  on public.ccm_enrollments(practice_id, id);
create unique index if not exists checkin_templates_practice_id_unique
  on public.checkin_templates(practice_id, id);
create unique index if not exists checkin_instances_practice_id_unique
  on public.checkin_instances(practice_id, id);
create unique index if not exists care_plans_practice_id_unique
  on public.care_plans(practice_id, id);
create unique index if not exists monthly_billability_practice_id_unique
  on public.monthly_billability(practice_id, id);
create unique index if not exists question_sessions_practice_id_unique
  on public.question_sessions(practice_id, id);

do $$
declare
  statement text;
begin
  foreach statement in array array[
    'alter table public.providers add constraint providers_member_practice_fk foreign key (practice_id, member_id) references public.practice_members(practice_id, id) not valid',
    'alter table public.provider_preferences add constraint provider_preferences_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.patients add constraint patients_provider_practice_fk foreign key (practice_id, primary_provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.patients add constraint patients_coordinator_practice_fk foreign key (practice_id, care_coordinator_member_id) references public.practice_members(practice_id, id) not valid',
    'alter table public.patient_conditions add constraint patient_conditions_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.ccm_enrollments add constraint ccm_enrollments_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.ccm_enrollments add constraint ccm_enrollments_provider_practice_fk foreign key (practice_id, assigned_provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.ccm_enrollments add constraint ccm_enrollments_coordinator_practice_fk foreign key (practice_id, care_coordinator_member_id) references public.practice_members(practice_id, id) not valid',
    'alter table public.provider_question_preferences add constraint provider_question_preferences_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.patient_question_preferences add constraint patient_question_preferences_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.patient_question_preferences add constraint patient_question_preferences_condition_practice_fk foreign key (practice_id, patient_condition_id) references public.patient_conditions(practice_id, id) not valid',
    'alter table public.checkin_templates add constraint checkin_templates_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.checkin_instances add constraint checkin_instances_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.checkin_instances add constraint checkin_instances_enrollment_practice_fk foreign key (practice_id, enrollment_id) references public.ccm_enrollments(practice_id, id) not valid',
    'alter table public.checkin_instances add constraint checkin_instances_template_practice_fk foreign key (practice_id, template_id) references public.checkin_templates(practice_id, id) not valid',
    'alter table public.checkin_instances add constraint checkin_instances_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.checkin_responses add constraint checkin_responses_instance_practice_fk foreign key (practice_id, checkin_instance_id) references public.checkin_instances(practice_id, id) not valid',
    'alter table public.checkin_responses add constraint checkin_responses_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.checkin_responses add constraint checkin_responses_session_practice_fk foreign key (practice_id, question_session_id) references public.question_sessions(practice_id, id) not valid',
    'alter table public.interaction_logs add constraint interaction_logs_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.interaction_logs add constraint interaction_logs_enrollment_practice_fk foreign key (practice_id, enrollment_id) references public.ccm_enrollments(practice_id, id) not valid',
    'alter table public.interaction_logs add constraint interaction_logs_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.interaction_logs add constraint interaction_logs_staff_practice_fk foreign key (practice_id, staff_member_id) references public.practice_members(practice_id, id) not valid',
    'alter table public.interaction_logs add constraint interaction_logs_checkin_practice_fk foreign key (practice_id, checkin_instance_id) references public.checkin_instances(practice_id, id) not valid',
    'alter table public.care_plans add constraint care_plans_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.care_plans add constraint care_plans_condition_practice_fk foreign key (practice_id, patient_condition_id) references public.patient_conditions(practice_id, id) not valid',
    'alter table public.care_plans add constraint care_plans_enrollment_practice_fk foreign key (practice_id, enrollment_id) references public.ccm_enrollments(practice_id, id) not valid',
    'alter table public.care_plans add constraint care_plans_provider_practice_fk foreign key (practice_id, provider_id) references public.providers(practice_id, id) not valid',
    'alter table public.monthly_billability add constraint monthly_billability_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.monthly_billability add constraint monthly_billability_enrollment_practice_fk foreign key (practice_id, enrollment_id) references public.ccm_enrollments(practice_id, id) not valid',
    'alter table public.monthly_billability add constraint monthly_billability_checkin_practice_fk foreign key (practice_id, checkin_instance_id) references public.checkin_instances(practice_id, id) not valid',
    'alter table public.billing_evidence_snapshots add constraint billing_evidence_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.billing_evidence_snapshots add constraint billing_evidence_monthly_practice_fk foreign key (practice_id, monthly_billability_id) references public.monthly_billability(practice_id, id) not valid',
    'alter table public.patient_intake_summaries add constraint patient_intake_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.patient_intake_summaries add constraint patient_intake_enrollment_practice_fk foreign key (practice_id, enrollment_id) references public.ccm_enrollments(practice_id, id) not valid',
    'alter table public.question_sessions add constraint question_sessions_patient_practice_fk foreign key (practice_id, patient_id) references public.patients(practice_id, id) not valid',
    'alter table public.question_sessions add constraint question_sessions_checkin_practice_fk foreign key (practice_id, checkin_instance_id) references public.checkin_instances(practice_id, id) not valid',
    'alter table public.question_sessions add constraint question_sessions_care_plan_practice_fk foreign key (practice_id, care_plan_id) references public.care_plans(practice_id, id) not valid'
  ]
  loop
    begin
      execute statement;
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

create or replace function public.is_practice_member(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1
    from public.practice_members member
    where member.practice_id = target_practice_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.has_practice_role(target_practice_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1
    from public.practice_members member
    where member.practice_id = target_practice_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role::text = any(allowed_roles)
  );
$$;

revoke all on function public.is_practice_member(uuid) from public;
grant execute on function public.is_practice_member(uuid) to authenticated;
revoke all on function public.has_practice_role(uuid, text[]) from public;
grant execute on function public.has_practice_role(uuid, text[]) to authenticated;
