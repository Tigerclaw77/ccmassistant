begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_column('public', 'practice_staff_invitations', 'access_role', 'staff invitations persist the canonical operational role');
select col_not_null('public', 'practice_staff_invitations', 'access_role', 'invitation operational roles cannot be omitted');
select has_function('public', 'has_access_role', array['uuid','ccm_access_role[]'], 'canonical role authorization helper exists');
select function_privs_are('public', 'has_access_role', array['uuid','ccm_access_role[]'], 'authenticated', array['EXECUTE'], 'authenticated users may invoke the protected role helper');
select function_privs_are('public', 'has_access_role', array['uuid','ccm_access_role[]'], 'anon', array[]::text[], 'anonymous users cannot invoke the role helper');
select matches(pg_get_functiondef('public.has_access_role(uuid,public.ccm_access_role[])'::regprocedure), 'SET search_path TO ''''', 'role helper has an empty search_path');
select has_function('public', 'update_practice_member_access', array['uuid','uuid','text','ccm_access_role','uuid'], 'atomic member access lifecycle function exists');
select function_privs_are('public', 'update_practice_member_access', array['uuid','uuid','text','ccm_access_role','uuid'], 'service_role', array['EXECUTE'], 'only service orchestration receives the lifecycle function grant');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','founder@example.test','',now(),'{}','{}',now(),now()),
  ('11000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','billing@example.test','',now(),'{}','{}',now(),now()),
  ('11000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','front@example.test','',now(),'{}','{}',now(),now()),
  ('11000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','compliance@example.test','',now(),'{}','{}',now(),now());
insert into public.organizations (id,name,slug,created_by) values ('21000000-0000-0000-0000-000000000001','RC005 Org','rc005-org','11000000-0000-0000-0000-000000000001');
insert into public.practices (id,organization_id,name,slug,created_by) values ('31000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','RC005 Practice','rc005-practice','11000000-0000-0000-0000-000000000001');
insert into public.organization_members (organization_id,user_id,role,status,created_by) values ('21000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','organization_owner','active','11000000-0000-0000-0000-000000000001');
insert into public.practice_members (id,practice_id,user_id,role,status,created_by) values
  ('41000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','owner','active','11000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000002','31000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000002','billing_staff','active','11000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000003','31000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003','billing_staff','active','11000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000004','31000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000004','billing_staff','active','11000000-0000-0000-0000-000000000001');
insert into public.practice_member_role_assignments (practice_id,member_id,user_id,role,status,assigned_by) values
  ('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','practice_administrator','active','11000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000002','billing_administrator','active','11000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','11000000-0000-0000-0000-000000000003','front_desk','active','11000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000004','11000000-0000-0000-0000-000000000004','compliance_administrator','active','11000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims','{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true); set local role authenticated;
select ok(public.has_access_role('31000000-0000-0000-0000-000000000001',array['organization_owner']::public.ccm_access_role[]),'founder override is recognized');
select ok(public.has_practice_role('31000000-0000-0000-0000-000000000001',array['owner','admin']),'founder preserves legacy administrator compatibility');
reset role;
select set_config('request.jwt.claims','{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',true); set local role authenticated;
select ok(public.has_access_role('31000000-0000-0000-0000-000000000001',array['billing_administrator']::public.ccm_access_role[]),'billing administrator receives billing role');
select ok(public.has_practice_role('31000000-0000-0000-0000-000000000001',array['billing_staff']),'billing compatibility resolves through canonical role');
reset role;
select set_config('request.jwt.claims','{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',true); set local role authenticated;
select ok(public.has_access_role('31000000-0000-0000-0000-000000000001',array['front_desk']::public.ccm_access_role[]),'front desk role is assignable');
select ok(not public.has_practice_role('31000000-0000-0000-0000-000000000001',array['billing_staff']),'front desk compatibility storage does not grant billing access');
reset role;
select set_config('request.jwt.claims','{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',true); set local role authenticated;
select ok(public.has_access_role('31000000-0000-0000-0000-000000000001',array['compliance_administrator']::public.ccm_access_role[]),'compliance administrator is first class');
select ok(not public.has_practice_role('31000000-0000-0000-0000-000000000001',array['owner','admin','billing_staff']),'compliance role does not inherit administration or billing writes');

reset role;
select lives_ok($test$select public.update_practice_member_access('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','change_role','read_only','11000000-0000-0000-0000-000000000001')$test$,'role changes execute atomically');
select is((select role::text from public.practice_members where id='41000000-0000-0000-0000-000000000003'),'billing_staff','the legacy role remains a compatibility projection');
select is((select role::text from public.practice_member_role_assignments where member_id='41000000-0000-0000-0000-000000000003' and status='active'),'read_only','the canonical assignment changes');
select lives_ok($test$select public.update_practice_member_access('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','disable',null,'11000000-0000-0000-0000-000000000001')$test$,'role removal can disable access atomically');
select is((select count(*) from public.practice_member_role_assignments where member_id='41000000-0000-0000-0000-000000000003' and status='active'),0::bigint,'disable leaves no active assignment');
select lives_ok($test$select public.update_practice_member_access('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','enable',null,'11000000-0000-0000-0000-000000000001')$test$,'re-enable restores the latest canonical role');
select is((select role::text from public.practice_member_role_assignments where member_id='41000000-0000-0000-0000-000000000003' and status='active'),'read_only','re-enable restores read-only rather than deriving privilege from legacy storage');
select lives_ok($test$select public.update_practice_member_access('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','remove',null,'11000000-0000-0000-0000-000000000001')$test$,'removal closes the canonical assignment');

select * from finish();
rollback;
