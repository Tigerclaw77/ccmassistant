begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'gate3-workflow@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

insert into public.organizations (id, name, slug, created_by)
values ('21000000-0000-0000-0000-000000000001', 'Gate 3 Workflow Org', 'gate3-workflow-org', '11000000-0000-0000-0000-000000000001');

insert into public.practices (id, organization_id, name, slug, created_by)
values ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'Gate 3 Workflow Practice', 'gate3-workflow-practice', '11000000-0000-0000-0000-000000000001');

insert into public.practice_members (id, practice_id, user_id, role, status, created_by)
values ('41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'owner', 'active', '11000000-0000-0000-0000-000000000001');

insert into public.providers (id, practice_id, member_id, full_name, created_by)
values ('51000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 'Gate 3 Workflow Provider', '11000000-0000-0000-0000-000000000001');

insert into public.patients (id, practice_id, display_name, primary_provider_id, created_by)
values ('61000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'Gate 3 Workflow Patient', '51000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"service_role","aal":"aal2"}', true);
set local role service_role;

select is(
  (public.store_ccm_opportunity(
    '{"practice_id":"31000000-0000-0000-0000-000000000001","patient_id":"61000000-0000-0000-0000-000000000001","detector_version":"detector-v1","rule_version":"rule-v1","rule_identifier":"CCM-GATE3-001","opportunity_type":"provider_review","trigger_code":"gate3-trigger","trigger_summary":"Gate 3 trigger","benefit_rationale":"Gate 3 rationale","condition_or_workflow_item":"Gate 3 item","suggested_activity":"Review patient","eligible_performers":["provider"],"provider_involvement":"required","input_facts":{"gate3":true},"evidence_fingerprint":"fingerprint-v1","generated_at":"2026-07-20T12:00:00Z","expires_at":"2026-07-27T12:00:00Z"}'::jsonb,
    '[{"source_type":"patient_record","source_id":null,"observed_at":"2026-07-20T11:00:00Z","summary":"Gate 3 evidence","facts":{"value":"abnormal"}}]'::jsonb
  ) ->> 'created')::boolean,
  true,
  'first detector persistence creates an immutable opportunity'
);

reset role;
select is((select count(*) from public.ccm_opportunities), 1::bigint, 'first detector persistence creates one opportunity row');
select is((select count(*) from public.ccm_opportunity_evidence), 1::bigint, 'evidence is stored atomically with the opportunity');

set local role service_role;
select is(
  (public.store_ccm_opportunity(
    '{"practice_id":"31000000-0000-0000-0000-000000000001","patient_id":"61000000-0000-0000-0000-000000000001","detector_version":"detector-v1","rule_version":"rule-v1","rule_identifier":"CCM-GATE3-001","opportunity_type":"provider_review","trigger_code":"gate3-trigger","trigger_summary":"Gate 3 trigger","benefit_rationale":"Gate 3 rationale","condition_or_workflow_item":"Gate 3 item","suggested_activity":"Review patient","eligible_performers":["provider"],"provider_involvement":"required","input_facts":{"gate3":true},"evidence_fingerprint":"fingerprint-v1","generated_at":"2026-07-20T12:00:00Z","expires_at":"2026-07-27T12:00:00Z"}'::jsonb,
    '[{"source_type":"patient_record","source_id":null,"observed_at":"2026-07-20T11:00:00Z","summary":"Gate 3 evidence","facts":{"value":"abnormal"}}]'::jsonb
  ) ->> 'created')::boolean,
  false,
  'exact detector replay returns the existing immutable opportunity'
);
reset role;
select is((select count(*) from public.ccm_opportunities), 1::bigint, 'exact replay does not duplicate an opportunity');

set local role service_role;
select is(
  (public.store_ccm_opportunity(
    '{"practice_id":"31000000-0000-0000-0000-000000000001","patient_id":"61000000-0000-0000-0000-000000000001","detector_version":"detector-v2","rule_version":"rule-v1","rule_identifier":"CCM-GATE3-001","opportunity_type":"provider_review","trigger_code":"gate3-trigger","trigger_summary":"Gate 3 trigger","benefit_rationale":"Gate 3 rationale","condition_or_workflow_item":"Gate 3 item","suggested_activity":"Review patient","eligible_performers":["provider"],"provider_involvement":"required","input_facts":{"gate3":true},"evidence_fingerprint":"fingerprint-v2","generated_at":"2026-07-20T12:05:00Z","expires_at":"2026-07-27T12:05:00Z"}'::jsonb,
    '[{"source_type":"patient_record","source_id":null,"observed_at":"2026-07-20T11:05:00Z","summary":"Gate 3 evidence v2","facts":{"value":"abnormal"}}]'::jsonb
  ) ->> 'created')::boolean,
  true,
  'a changed detector version creates a new immutable version'
);
reset role;

select is((select count(*) from public.ccm_opportunities), 2::bigint, 'opportunity versioning retains both detector outputs');
select throws_ok($test$update public.ccm_opportunities set trigger_summary = 'rewritten'$test$, 'P0001');
select throws_ok($test$update public.ccm_opportunity_evidence set summary = 'rewritten'$test$, 'P0001');
select throws_ok($test$delete from public.ccm_opportunity_evidence$test$, 'P0001');

select lives_ok($test$
  insert into public.ccm_work_items (
    id, practice_id, patient_id, opportunity_id, primary_provider_id,
    queue_group, priority, priority_score, title, reason, created_by, updated_by
  )
  select
    '81000000-0000-0000-0000-000000000001', practice_id, patient_id, id,
    '51000000-0000-0000-0000-000000000001', 'needs_attention', 'high', 550,
    'Gate 3 work item', 'Provider review required',
    '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001'
  from public.ccm_opportunities where detector_version = 'detector-v1'
$test$, 'a valid opportunity can be represented by a work item');

select lives_ok($test$
  update public.ccm_work_items
  set status = 'in_progress', updated_by = '11000000-0000-0000-0000-000000000001'
  where id = '81000000-0000-0000-0000-000000000001'
$test$, 'work-item lifecycle updates remain mutable');

select is((select count(*) from public.ccm_work_item_events where work_item_id = '81000000-0000-0000-0000-000000000001'), 1::bigint, 'work-item updates append an immutable audit event');
select throws_ok($test$update public.ccm_work_item_events set event_type = 'rewritten'$test$, 'P0001');
select throws_ok($test$delete from public.ccm_work_item_events$test$, 'P0001');
select throws_ok($test$update public.ccm_work_items set status = 'completed' where id = '81000000-0000-0000-0000-000000000001'$test$, '23514');
select throws_ok($test$update public.ccm_work_items set manual_priority = 'urgent' where id = '81000000-0000-0000-0000-000000000001'$test$, '23514');
select lives_ok($test$
  update public.ccm_work_items
  set status = 'completed', outcome = 'Coordinator completed the documented care activity.',
      completed_at = now(), queue_group = 'completed_today', updated_by = '11000000-0000-0000-0000-000000000001'
  where id = '81000000-0000-0000-0000-000000000001'
$test$, 'a documented outcome and completion timestamp close the work item');
select is((select count(*) from public.ccm_work_item_events where work_item_id = '81000000-0000-0000-0000-000000000001'), 2::bigint, 'task completion appends a second immutable audit event');

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select throws_ok($test$
  select public.dispose_ccm_opportunity(
    (select id from public.ccm_opportunities where detector_version = 'detector-v1'),
    'no_intervention', 'Not clinically indicated', null, false, null, null
  )
$test$, 'P0001');

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select lives_ok($test$
  select public.dispose_ccm_opportunity(
    (select id from public.ccm_opportunities where detector_version = 'detector-v1'),
    'no_intervention', 'Not clinically indicated', null, false, null, null
  )
$test$, 'an AAL2 in-scope owner can disposition an opportunity');

reset role;
select is((select count(*) from public.ccm_opportunity_dispositions), 1::bigint, 'one disposition is retained');

set local role authenticated;
select throws_ok($test$
  select public.dispose_ccm_opportunity(
    (select id from public.ccm_opportunities where detector_version = 'detector-v1'),
    'no_intervention', 'Duplicate disposition', null, false, null, null
  )
$test$, 'P0001');

select throws_ok($test$
  insert into public.ccm_opportunities (
    practice_id, patient_id, detector_version, rule_version, rule_identifier,
    opportunity_type, trigger_code, trigger_summary, benefit_rationale,
    condition_or_workflow_item, suggested_activity, provider_involvement,
    evidence_fingerprint, generated_at, expires_at
  ) values (
    '31000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001',
    'direct', 'direct', 'direct', 'provider_review', 'direct', 'direct', 'direct',
    'direct', 'direct', 'required', 'direct', now(), now() + interval '1 day'
  )
$test$, '42501');

reset role;
select is((select count(*) from public.ccm_opportunities), 2::bigint, 'authenticated callers cannot bypass the service-only opportunity store');

select * from finish();
rollback;
