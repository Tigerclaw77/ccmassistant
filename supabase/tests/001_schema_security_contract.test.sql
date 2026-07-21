begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select is(
  (select count(*) from supabase_migrations.schema_migrations),
  27::bigint,
  'all 27 migration versions are recorded exactly once'
);

select is(
  (select count(*)
   from pg_index index_definition
   join pg_class index_relation on index_relation.oid = index_definition.indexrelid
   join pg_namespace index_schema on index_schema.oid = index_relation.relnamespace
   where index_schema.nspname = 'public' and not index_definition.indisvalid),
  0::bigint,
  'the public schema has no invalid indexes'
);

select is(
  (select count(*)
   from pg_class table_definition
   join pg_namespace table_schema on table_schema.oid = table_definition.relnamespace
   where table_schema.nspname = 'public'
     and table_definition.relkind = 'r'
     and not table_definition.relrowsecurity),
  0::bigint,
  'every application table has row-level security enabled'
);

select is(
  (select count(*)
   from pg_constraint constraint_definition
   join pg_namespace constraint_schema on constraint_schema.oid = constraint_definition.connamespace
   where constraint_schema.nspname = 'public'
     and not constraint_definition.convalidated),
  0::bigint,
  'a fresh database has no constraints left NOT VALID'
);

select is(
  (select count(*)
   from (values
     ('ccm_opportunities_patient_practice_fk'),
     ('ccm_opportunity_evidence_opportunity_practice_fk'),
     ('ccm_work_items_patient_practice_fk'),
     ('ccm_work_items_opportunity_practice_fk'),
     ('ccm_work_items_provider_practice_fk'),
     ('ccm_work_items_assignee_practice_fk'),
     ('ccm_work_items_condition_practice_fk'),
     ('ccm_priority_factors_work_item_practice_fk'),
     ('ccm_dispositions_opportunity_practice_fk'),
     ('ccm_dispositions_work_item_practice_fk'),
     ('ccm_deviations_work_item_practice_fk'),
     ('ccm_reports_work_item_practice_fk'),
     ('ccm_events_work_item_practice_fk'),
     ('ccm_events_opportunity_practice_fk')
   ) expected(name)
   where not exists (
     select 1 from pg_constraint actual
     where actual.conname = expected.name and actual.contype = 'f'
   )),
  0::bigint,
  'migration 027 installs every tenant-composite foreign key'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patients'
      and column_name = 'primary_provider_id' and is_nullable = 'NO'
  ),
  'every patient must have one current primary responsible provider'
);

select ok(
  exists (select 1 from pg_trigger where tgname = 'record_patient_primary_provider_history' and not tgisinternal),
  'primary responsible provider changes are captured by a trigger'
);

select ok(
  exists (select 1 from pg_trigger where tgname = 'patient_primary_provider_history_immutable' and not tgisinternal),
  'primary responsible provider history is immutable'
);

select ok(
  exists (select 1 from pg_trigger where tgname = 'audit_events_immutable' and not tgisinternal),
  'audit records are immutable'
);

select is(
  (select count(*) from pg_trigger
   where tgname in (
     'ccm_opportunities_immutable',
     'ccm_opportunity_evidence_immutable',
     'ccm_opportunity_dispositions_immutable',
     'ccm_work_item_priority_factors_immutable',
     'ccm_work_item_deviations_immutable',
     'ccm_work_item_events_immutable'
   ) and not tgisinternal),
  6::bigint,
  'migration 027 protects every immutable opportunity/evidence/audit relation'
);

select ok(
  not has_function_privilege('anon', 'public.store_ccm_opportunity(jsonb,jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.store_ccm_opportunity(jsonb,jsonb)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.store_ccm_opportunity(jsonb,jsonb)', 'EXECUTE'),
  'opportunity persistence is callable only by service_role'
);

select ok(
  not has_function_privilege('anon', 'public.dispose_ccm_opportunity(uuid,text,text,integer,boolean,text,timestamptz)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.dispose_ccm_opportunity(uuid,text,text,integer,boolean,text,timestamptz)', 'EXECUTE')
  and not has_function_privilege('service_role', 'public.dispose_ccm_opportunity(uuid,text,text,integer,boolean,text,timestamptz)', 'EXECUTE'),
  'opportunity disposition is an authenticated-only clinical transaction'
);

select is(
  (select count(*)
   from pg_proc function_definition
   join pg_namespace function_schema on function_schema.oid = function_definition.pronamespace
   where function_schema.nspname = 'public'
     and function_definition.prosecdef
     and (
       has_function_privilege('public', function_definition.oid, 'EXECUTE')
       or has_function_privilege('anon', function_definition.oid, 'EXECUTE')
     )),
  0::bigint,
  'no SECURITY DEFINER function is executable by PUBLIC or anon'
);

select is(
  (select count(*)
   from pg_proc function_definition
   join pg_namespace function_schema on function_schema.oid = function_definition.pronamespace
   where function_schema.nspname = 'public'
     and function_definition.proname in (
       'enforce_patient_practice_match',
       'enforce_question_bank_scope_owner',
       'enforce_provider_lifecycle',
       'record_patient_primary_provider_history',
       'enforce_provider_staff_practice_match',
       'record_ccm_work_item_change'
     )
     and has_function_privilege('authenticated', function_definition.oid, 'EXECUTE')),
  0::bigint,
  'trigger-only SECURITY DEFINER functions cannot be invoked as authenticated RPCs'
);

select is(
  (select count(*)
   from pg_proc function_definition
   join pg_namespace function_schema on function_schema.oid = function_definition.pronamespace
   where function_schema.nspname = 'public'
     and function_definition.prosecdef
     and not exists (
       select 1 from unnest(coalesce(function_definition.proconfig, array[]::text[])) setting
       where setting like 'search_path=%'
     )),
  0::bigint,
  'every SECURITY DEFINER function fixes its search_path'
);

select is(
  (select count(*)
   from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee = 'anon'
     and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')),
  0::bigint,
  'anon has no application-table data, reference, or trigger privileges'
);

select is(
  (select count(*)
   from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee = 'authenticated'
     and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')),
  0::bigint,
  'authenticated users have no TRUNCATE, REFERENCES, or TRIGGER privileges'
);

select is(
  (select count(*)
   from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee = 'service_role'
     and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')),
  0::bigint,
  'service_role receives only the explicitly required application privileges'
);

select is(
  (select count(*)
   from information_schema.role_usage_grants
   where object_schema = 'public' and grantee = 'anon'),
  0::bigint,
  'anon has no usage grants on public application objects'
);

select ok(
  has_table_privilege('service_role', 'public.care_plans', 'SELECT')
  and has_table_privilege('service_role', 'public.care_plans', 'UPDATE')
  and has_function_privilege('service_role', 'public.transition_care_plan_review(uuid,text,text,text,text,uuid)', 'EXECUTE'),
  'the server-side provider-review transaction can read and transition care plans'
);

select * from finish();
rollback;
