begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select ok(
  to_regprocedure('public.bootstrap_first_practice(text,text,boolean,boolean)') is not null
  and not has_function_privilege(
    'authenticated',
    'public.bootstrap_first_practice(text,text,boolean,boolean)',
    'EXECUTE'
  ),
  'the obsolete bootstrap signature is retained for history but not exposed as an authenticated RPC'
);

select * from finish();
rollback;
