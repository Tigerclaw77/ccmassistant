-- Pilot Readiness Sprint 1: staff lifecycle, provider review, and check-in delivery.

alter table public.practice_members
  add column if not exists disabled_at timestamptz,
  add column if not exists removed_at timestamptz,
  add column if not exists last_role_changed_at timestamptz;

create table if not exists public.practice_staff_invitations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  member_id uuid not null references public.practice_members(id) on delete cascade,
  email text not null,
  role public.ccm_member_role not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired', 'delivery_failed')),
  expires_at timestamptz not null,
  sent_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  resend_count integer not null default 0 check (resend_count >= 0),
  auth_user_id uuid references auth.users(id) on delete set null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists practice_staff_invitations_one_pending_email_idx
  on public.practice_staff_invitations(practice_id, lower(email))
  where status = 'pending';

create index if not exists practice_staff_invitations_practice_status_idx
  on public.practice_staff_invitations(practice_id, status, created_at desc);

alter table public.care_plans
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft', 'coordinator_ready', 'provider_review_required', 'approved', 'revision_requested')),
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists coordinator_ready_by uuid references auth.users(id),
  add column if not exists coordinator_ready_at timestamptz,
  add column if not exists provider_review_requested_by uuid references auth.users(id),
  add column if not exists provider_review_requested_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists revision_requested_at timestamptz,
  add column if not exists review_comments text;

update public.care_plans
set
  approved_by = case
    when status = 'active' and last_reviewed_at is not null then coalesce(approved_by, updated_by, created_by)
    else approved_by
  end,
  approved_at = case
    when status = 'active' and last_reviewed_at is not null then coalesce(approved_at, last_reviewed_at)
    else approved_at
  end,
  review_status = case
    when status = 'active' and last_reviewed_at is not null then 'approved'
    else 'draft'
  end
where review_status = 'draft';

create table if not exists public.care_plan_versions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  version integer not null check (version > 0),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  goals jsonb not null,
  interventions jsonb not null,
  barriers jsonb not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (care_plan_id, version)
);

create table if not exists public.care_plan_reviews (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  care_plan_version integer not null check (care_plan_version > 0),
  decision text not null
    check (decision in ('coordinator_ready', 'submitted', 'approved', 'changes_requested', 'superseded')),
  comments text,
  reviewer_user_id uuid not null references auth.users(id),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.care_plan_versions (
  practice_id, care_plan_id, version, patient_id, provider_id,
  goals, interventions, barriers, notes, created_by, created_at
)
select
  practice_id, id, version, patient_id, provider_id,
  goals, interventions, barriers, notes, coalesce(updated_by, created_by), created_at
from public.care_plans
on conflict (care_plan_id, version) do nothing;

insert into public.care_plan_reviews (
  practice_id, care_plan_id, care_plan_version, decision, comments,
  reviewer_user_id, snapshot, created_at
)
select
  practice_id, id, version, 'approved', 'Migrated from the legacy reviewed care plan.',
  approved_by,
  jsonb_build_object(
    'goals', goals, 'interventions', interventions, 'barriers', barriers,
    'notes', notes, 'provider_id', provider_id, 'review_status', review_status
  ),
  coalesce(approved_at, updated_at, created_at)
from public.care_plans
where review_status = 'approved' and approved_by is not null
  and not exists (
    select 1 from public.care_plan_reviews existing
    where existing.care_plan_id = care_plans.id
      and existing.care_plan_version = care_plans.version
      and existing.decision = 'approved'
  );

create or replace function public.version_care_plan_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  intentional_reapproval boolean;
begin
  if row(new.goals, new.interventions, new.barriers, new.notes, new.provider_id)
     is distinct from
     row(old.goals, old.interventions, old.barriers, old.notes, old.provider_id) then
    intentional_reapproval := new.review_status = 'approved'
      and (old.review_status <> 'approved' or new.approved_at is distinct from old.approved_at);
    if old.review_status = 'approved' then
      insert into public.care_plan_reviews (
        practice_id, care_plan_id, care_plan_version, decision, comments,
        reviewer_user_id, snapshot
      ) values (
        old.practice_id, old.id, old.version, 'superseded',
        'Approved content was edited and requires a new provider review.',
        coalesce(new.updated_by, old.updated_by, old.created_by),
        jsonb_build_object(
          'goals', old.goals, 'interventions', old.interventions,
          'barriers', old.barriers, 'notes', old.notes,
          'provider_id', old.provider_id, 'review_status', old.review_status
        )
      );
    end if;
    new.version = old.version + 1;
    if not intentional_reapproval then
      new.review_status = 'draft';
      new.status = 'draft';
      new.last_reviewed_at = null;
      new.approved_by = null;
      new.approved_at = null;
      new.coordinator_ready_by = null;
      new.coordinator_ready_at = null;
      new.provider_review_requested_by = null;
      new.provider_review_requested_at = null;
      new.revision_requested_at = null;
      new.review_comments = null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists care_plans_version_content on public.care_plans;
create trigger care_plans_version_content
before update on public.care_plans
for each row execute function public.version_care_plan_content();

create or replace function public.snapshot_care_plan_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.version is distinct from old.version then
    insert into public.care_plan_versions (
      practice_id, care_plan_id, version, patient_id, provider_id,
      goals, interventions, barriers, notes, created_by
    ) values (
      new.practice_id, new.id, new.version, new.patient_id, new.provider_id,
      new.goals, new.interventions, new.barriers, new.notes,
      coalesce(new.updated_by, new.created_by)
    ) on conflict (care_plan_id, version) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists care_plans_snapshot_version on public.care_plans;
create trigger care_plans_snapshot_version
after insert or update on public.care_plans
for each row execute function public.snapshot_care_plan_version();

create or replace function public.transition_care_plan_review(
  target_care_plan_id uuid,
  expected_review_status text,
  next_review_status text,
  review_decision text,
  review_comment_text text,
  reviewer_user_id uuid
)
returns public.care_plans
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_plan public.care_plans;
  saved_plan public.care_plans;
begin
  select * into current_plan from public.care_plans where id = target_care_plan_id for update;
  if current_plan.id is null then raise exception 'Care plan not found'; end if;
  if current_plan.review_status <> expected_review_status then
    raise exception 'Care plan review status changed';
  end if;

  update public.care_plans
  set
    review_status = next_review_status,
    status = case when review_decision = 'approved' then 'active' when review_decision = 'changes_requested' then 'draft' else status end,
    coordinator_ready_by = case when review_decision = 'coordinator_ready' then reviewer_user_id else coordinator_ready_by end,
    coordinator_ready_at = case when review_decision = 'coordinator_ready' then now() else coordinator_ready_at end,
    provider_review_requested_by = case when review_decision = 'submitted' then reviewer_user_id else provider_review_requested_by end,
    provider_review_requested_at = case when review_decision = 'submitted' then now() else provider_review_requested_at end,
    approved_by = case when review_decision = 'approved' then reviewer_user_id else approved_by end,
    approved_at = case when review_decision = 'approved' then now() else approved_at end,
    last_reviewed_at = case when review_decision = 'approved' then now() else last_reviewed_at end,
    revision_requested_at = case when review_decision = 'changes_requested' then now() else revision_requested_at end,
    review_comments = review_comment_text,
    updated_by = reviewer_user_id
  where id = target_care_plan_id
  returning * into saved_plan;

  insert into public.care_plan_reviews (
    practice_id, care_plan_id, care_plan_version, decision, comments,
    reviewer_user_id, snapshot
  ) values (
    saved_plan.practice_id, saved_plan.id, saved_plan.version,
    review_decision, review_comment_text, reviewer_user_id,
    jsonb_build_object(
      'goals', saved_plan.goals, 'interventions', saved_plan.interventions,
      'barriers', saved_plan.barriers, 'notes', saved_plan.notes,
      'provider_id', saved_plan.provider_id, 'review_status', next_review_status
    )
  );
  return saved_plan;
end;
$$;

create index if not exists care_plan_reviews_plan_created_idx
  on public.care_plan_reviews(care_plan_id, created_at desc);

create index if not exists care_plans_pending_provider_idx
  on public.care_plans(practice_id, provider_id, updated_at desc)
  where review_status = 'provider_review_required';

create table if not exists public.checkin_deliveries (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  checkin_instance_id uuid not null references public.checkin_instances(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  method text not null check (method in ('email', 'sms', 'link')),
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'opened', 'completed', 'expired', 'failed', 'cancelled')),
  destination_masked text,
  provider_message_id text,
  request_key text not null,
  attempt_number integer not null check (attempt_number > 0),
  token_expires_at timestamptz not null,
  delivered_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  expired_at timestamptz,
  failure_code text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (checkin_instance_id, attempt_number)
);

create unique index if not exists checkin_deliveries_practice_request_idx
  on public.checkin_deliveries(practice_id, request_key);

create index if not exists checkin_deliveries_checkin_created_idx
  on public.checkin_deliveries(checkin_instance_id, created_at desc);

create or replace function public.prevent_immutable_pilot_history_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Pilot history rows are immutable';
end;
$$;

drop trigger if exists care_plan_versions_immutable on public.care_plan_versions;
create trigger care_plan_versions_immutable
before update or delete on public.care_plan_versions
for each row execute function public.prevent_immutable_pilot_history_change();

drop trigger if exists care_plan_reviews_immutable on public.care_plan_reviews;
create trigger care_plan_reviews_immutable
before update or delete on public.care_plan_reviews
for each row execute function public.prevent_immutable_pilot_history_change();

drop trigger if exists set_practice_staff_invitations_updated_at on public.practice_staff_invitations;
create trigger set_practice_staff_invitations_updated_at
before update on public.practice_staff_invitations
for each row execute function public.set_updated_at();

alter table public.practice_staff_invitations enable row level security;
alter table public.care_plan_versions enable row level security;
alter table public.care_plan_reviews enable row level security;
alter table public.checkin_deliveries enable row level security;

drop policy if exists practice_staff_invitations_member_select on public.practice_staff_invitations;
create policy practice_staff_invitations_member_select
on public.practice_staff_invitations for select to authenticated
using (public.is_practice_member(practice_id));

drop policy if exists care_plan_versions_member_select on public.care_plan_versions;
create policy care_plan_versions_member_select
on public.care_plan_versions for select to authenticated
using (public.is_practice_member(practice_id));

drop policy if exists care_plan_reviews_member_select on public.care_plan_reviews;
create policy care_plan_reviews_member_select
on public.care_plan_reviews for select to authenticated
using (public.is_practice_member(practice_id));

drop policy if exists checkin_deliveries_member_select on public.checkin_deliveries;
create policy checkin_deliveries_member_select
on public.checkin_deliveries for select to authenticated
using (public.is_practice_member(practice_id));

revoke all on table public.practice_staff_invitations from anon, authenticated;
revoke all on table public.care_plan_versions from anon, authenticated;
revoke all on table public.care_plan_reviews from anon, authenticated;
revoke all on table public.checkin_deliveries from anon, authenticated;

grant select on table public.practice_staff_invitations to authenticated;
grant select on table public.care_plan_versions to authenticated;
grant select on table public.care_plan_reviews to authenticated;
grant select on table public.checkin_deliveries to authenticated;

grant select, insert, update on table public.practice_staff_invitations to service_role;
grant select, insert on table public.care_plan_versions to service_role;
grant select, insert on table public.care_plan_reviews to service_role;
grant select, insert, update on table public.checkin_deliveries to service_role;
revoke all on function public.transition_care_plan_review(uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.transition_care_plan_review(uuid, text, text, text, text, uuid) to service_role;
