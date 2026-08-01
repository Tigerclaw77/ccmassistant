-- A suggestion-level deferral must remain visible as scheduled work. RC-003
-- intentionally made work-item deferral durable, but its opportunity
-- disposition function allowed a defer decision without a follow-up task.

alter table public.ccm_opportunity_dispositions
  drop constraint ccm_disposition_task_semantics;

alter table public.ccm_opportunity_dispositions
  add constraint ccm_disposition_task_semantics check (
    (disposition in ('accepted','different_action','provider_review','deferred') and resulting_work_item_id is not null)
    or (disposition = 'no_intervention' and resulting_work_item_id is null)
  ) not valid;

-- Fresh databases can validate the stronger invariant immediately. A shared
-- RC-003 database may contain immutable legacy deferrals without tasks; those
-- rows remain intact while PostgreSQL still enforces this check for new rows.
do $$
begin
  if not exists (
    select 1
    from public.ccm_opportunity_dispositions
    where disposition = 'deferred' and resulting_work_item_id is null
  ) then
    alter table public.ccm_opportunity_dispositions
      validate constraint ccm_disposition_task_semantics;
  end if;
end $$;

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
  if disposition_value = 'deferred' and (task_due_at is null or task_due_at::date < current_date) then
    raise exception 'Deferral requires a current or future follow-up date';
  end if;

  select * into opportunity_row from public.ccm_opportunities where id = target_opportunity_id;
  if opportunity_row.id is null or opportunity_row.expires_at <= pg_catalog.now() then raise exception 'Opportunity is missing or stale'; end if;
  if not public.ccm_user_in_patient_scope(opportunity_row.practice_id, opportunity_row.patient_id) then raise exception 'Clinical work scope required'; end if;
  if exists (select 1 from public.ccm_opportunity_dispositions where opportunity_id = target_opportunity_id) then raise exception 'Opportunity was already dispositioned'; end if;
  select * into patient_row from public.patients where id = opportunity_row.patient_id and practice_id = opportunity_row.practice_id;
  if patient_row.primary_provider_id is null then raise exception 'Primary Responsible Provider is required'; end if;
  select * into membership_row from public.practice_members where practice_id = opportunity_row.practice_id and user_id = auth.uid() and status = 'active';
  if membership_row.role = 'billing_staff' then raise exception 'Billing users cannot execute clinical work'; end if;

  if disposition_value in ('accepted','different_action','provider_review','deferred') then
    insert into public.ccm_work_items (
      practice_id, patient_id, opportunity_id, primary_provider_id, assigned_member_id, queue_group,
      status, priority, priority_score, title, reason, due_at, created_by, updated_by
    ) values (
      opportunity_row.practice_id, opportunity_row.patient_id, opportunity_row.id, patient_row.primary_provider_id,
      case when disposition_value = 'provider_review' then null else membership_row.id end,
      case when disposition_value = 'provider_review' then 'awaiting_provider' else 'needs_attention' end,
      case when disposition_value = 'provider_review' then 'awaiting_provider' when disposition_value = 'deferred' then 'deferred' else 'open' end,
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
      'actual_review_minutes', review_minutes, 'time_affirmed', time_affirmed,
      'interaction_log_id', interaction_id, 'follow_up_due_at', task_due_at), auth.uid()
  );
  return pg_catalog.jsonb_build_object('disposition_id', disposition_id, 'work_item_id', work_item_id, 'interaction_log_id', interaction_id);
end;
$$;

revoke all on function public.dispose_ccm_opportunity(uuid, text, text, integer, boolean, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.dispose_ccm_opportunity(uuid, text, text, integer, boolean, text, timestamptz) to authenticated;
