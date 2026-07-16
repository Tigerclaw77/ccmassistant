-- Resolve bootstrap/member/forbidden state without exposing global practice data.

create or replace function public.resolve_practice_access(
  requested_practice_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_membership public.practice_members%rowtype;
  resolved_practice public.practices%rowtype;
begin
  if current_user_id is null or coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'AAL2 authentication required' using errcode = '42501';
  end if;

  select member.*
  into resolved_membership
  from public.practice_members member
  where member.user_id = current_user_id
    and member.status = 'active'
    and (requested_practice_id is null or member.practice_id = requested_practice_id)
  order by member.created_at, member.id
  limit 1;

  if not found then
    if exists (select 1 from public.practices) then
      raise exception 'Active practice membership required' using errcode = '42501';
    end if;

    return jsonb_build_object('state', 'bootstrap');
  end if;

  select practice.*
  into resolved_practice
  from public.practices practice
  where practice.id = resolved_membership.practice_id;

  if not found then
    raise exception 'Active practice could not be loaded' using errcode = '55000';
  end if;

  return jsonb_build_object(
    'membership', to_jsonb(resolved_membership),
    'practice', to_jsonb(resolved_practice),
    'state', 'member'
  );
end;
$$;

revoke all on function public.resolve_practice_access(uuid) from public, anon;
grant execute on function public.resolve_practice_access(uuid) to authenticated;
