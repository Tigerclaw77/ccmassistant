-- Version 1.0 acceptance: the server-side staff invitation lifecycle reads,
-- creates, activates, and conditionally rolls back practice membership rows.
-- Keep browser roles behind RLS; grant only the required DML to service_role.

grant select, insert, update, delete on table public.practice_members to service_role;
grant select, insert, update on table public.practice_member_role_assignments to service_role;

-- The immutable version row is written only by the care_plans trigger. Run the
-- trigger as its owner so authenticated users never receive direct INSERT on
-- care_plan_versions (which intentionally has SELECT-only RLS policies).
alter function public.snapshot_care_plan_version() security definer;
revoke all on function public.snapshot_care_plan_version() from public, anon, authenticated, service_role;

comment on function public.snapshot_care_plan_version() is
  'SECURITY DEFINER trigger only: snapshots immutable care-plan versions without granting direct history-table inserts.';
