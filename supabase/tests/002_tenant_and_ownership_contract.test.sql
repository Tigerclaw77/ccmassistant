begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gate3-owner-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gate3-owner-b@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organizations (id, name, slug, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'Gate 3 Org A', 'gate3-org-a', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Gate 3 Org B', 'gate3-org-b', '10000000-0000-0000-0000-000000000002');

insert into public.practices (id, organization_id, name, slug, created_by) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Gate 3 Practice A', 'gate3-practice-a', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Gate 3 Practice B', 'gate3-practice-b', '10000000-0000-0000-0000-000000000002');

insert into public.practice_members (id, practice_id, user_id, role, status, created_by) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', 'active', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'owner', 'active', '10000000-0000-0000-0000-000000000002');

insert into public.practice_member_role_assignments (
  practice_id, member_id, user_id, role, status, assigned_by
) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'practice_administrator', 'active', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'practice_administrator', 'active', '10000000-0000-0000-0000-000000000002');

insert into public.providers (id, practice_id, member_id, full_name, created_by) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Gate 3 Provider A1', '10000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', null, 'Gate 3 Provider A2', '10000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Gate 3 Provider B', '10000000-0000-0000-0000-000000000002');

insert into public.patients (id, practice_id, display_name, primary_provider_id, created_by) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Gate 3 Patient A', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Gate 3 Patient B', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002');

select is(
  (select count(*) from public.practice_member_role_assignments where role = 'practice_administrator'),
  2::bigint,
  'legacy owner memberships are accompanied by long-term practice administrator assignments'
);

select is(
  (select count(*) from public.patient_primary_provider_history where patient_id = '60000000-0000-0000-0000-000000000001'),
  1::bigint,
  'patient creation records the initial primary responsible provider'
);

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;

select ok(public.has_practice_role('30000000-0000-0000-0000-000000000001', array['owner','admin']), 'legacy policy role helper recognizes the owner');
select ok(public.is_practice_member('30000000-0000-0000-0000-000000000001'), 'AAL2 owner is an active member of the own practice');
select ok(not public.is_practice_member('30000000-0000-0000-0000-000000000002'), 'membership helper rejects the other tenant');
select is((select count(*) from public.patients), 1::bigint, 'patient RLS returns only the current tenant');
select is((select id from public.patients), '60000000-0000-0000-0000-000000000001'::uuid, 'patient RLS hides the other tenant row');

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select is((select count(*) from public.patients), 1::bigint, 'the second tenant sees exactly its own patient');
select is((select id from public.patients), '60000000-0000-0000-0000-000000000002'::uuid, 'the second tenant cannot read the first tenant patient');

reset role;
set local role anon;
select throws_ok('select count(*) from public.patients', '42501');
reset role;

select throws_ok($test$
  insert into public.patients (id, practice_id, display_name, primary_provider_id)
  values ('60000000-0000-0000-0000-000000000099', '30000000-0000-0000-0000-000000000001', 'Cross Tenant Patient', '50000000-0000-0000-0000-000000000002')
$test$, '23503');

select is((select count(*) from public.patients where id = '60000000-0000-0000-0000-000000000099'), 0::bigint, 'composite foreign keys reject cross-practice provider ownership');

select throws_ok($test$
  update public.providers
  set is_active = false, deactivated_at = now()
  where id = '50000000-0000-0000-0000-000000000001'
$test$, '23503');

select lives_ok($test$
  update public.patients
  set primary_provider_id = '50000000-0000-0000-0000-000000000003',
      updated_by = '10000000-0000-0000-0000-000000000001'
  where id = '60000000-0000-0000-0000-000000000001'
$test$, 'a patient can be transferred to another provider in the same practice');

select is(
  (select count(*) from public.patient_primary_provider_history where patient_id = '60000000-0000-0000-0000-000000000001'),
  2::bigint,
  'provider transfer appends immutable ownership history'
);

select lives_ok($test$
  update public.providers
  set is_active = false, deactivated_at = now()
  where id = '50000000-0000-0000-0000-000000000001'
$test$, 'a transferred provider can be deactivated without changing patient ownership');

select throws_ok($test$
  update public.patient_primary_provider_history set change_reason = 'rewritten'
  where patient_id = '60000000-0000-0000-0000-000000000001'
$test$, '42501');

select throws_ok($test$
  delete from public.patient_primary_provider_history
  where patient_id = '60000000-0000-0000-0000-000000000001'
$test$, '42501');

insert into public.audit_events (id, practice_id, entity_type, action)
values ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'gate3', 'created');

select throws_ok($test$update public.audit_events set action = 'rewritten' where id = '70000000-0000-0000-0000-000000000001'$test$, '42501');
select throws_ok($test$delete from public.audit_events where id = '70000000-0000-0000-0000-000000000001'$test$, '42501');

select * from finish();
rollback;
