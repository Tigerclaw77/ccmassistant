-- Atomic first-practice onboarding for an administrator-provisioned owner.

create or replace function public.bootstrap_first_practice(
  practice_name text,
  practice_slug text,
  cms_eligibility_attested boolean,
  medicare_enrollment_attested boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_practice public.practices%rowtype;
  created_membership public.practice_members%rowtype;
  event_time timestamptz := now();
begin
  if current_user_id is null or coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'AAL2 authentication required' using errcode = '42501';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'onboarding_role', '') <> 'owner' then
    raise exception 'Initial owner authorization required' using errcode = '42501';
  end if;

  if nullif(trim(practice_name), '') is null or length(trim(practice_name)) > 200 then
    raise exception 'Practice name must contain 1 to 200 characters' using errcode = '22023';
  end if;

  if practice_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(practice_slug) > 64 then
    raise exception 'Practice slug is invalid' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ccm-assistant:first-practice', 0));

  if exists (select 1 from public.practices) then
    raise exception 'Initial practice bootstrap is closed' using errcode = '42501';
  end if;

  insert into public.practices (
    billing_settings,
    created_by,
    name,
    slug,
    updated_by
  )
  values (
    jsonb_build_object(
      'cms_eligibility_attested', cms_eligibility_attested,
      'cms_eligibility_attested_at', case when cms_eligibility_attested then event_time else null end,
      'cms_eligibility_attested_by', case when cms_eligibility_attested then current_user_id else null end,
      'medicare_enrollment_attested', medicare_enrollment_attested,
      'medicare_enrollment_attested_at', case when medicare_enrollment_attested then event_time else null end,
      'medicare_enrollment_attested_by', case when medicare_enrollment_attested then current_user_id else null end
    ),
    current_user_id,
    trim(practice_name),
    practice_slug,
    current_user_id
  )
  returning * into created_practice;

  insert into public.practice_members (
    created_by,
    practice_id,
    role,
    status,
    updated_by,
    user_id
  )
  values (
    current_user_id,
    created_practice.id,
    'owner',
    'active',
    current_user_id,
    current_user_id
  )
  returning * into created_membership;

  insert into public.audit_events (
    action,
    actor_user_id,
    after_data,
    entity_id,
    entity_type,
    practice_id
  )
  values (
    'practice.bootstrapped',
    current_user_id,
    jsonb_build_object(
      'membership', to_jsonb(created_membership),
      'practice', to_jsonb(created_practice)
    ),
    created_practice.id,
    'practice',
    created_practice.id
  );

  return jsonb_build_object(
    'membership', to_jsonb(created_membership),
    'practice', to_jsonb(created_practice)
  );
end;
$$;

revoke all on function public.bootstrap_first_practice(text, text, boolean, boolean) from public, anon;
grant execute on function public.bootstrap_first_practice(text, text, boolean, boolean) to authenticated;
