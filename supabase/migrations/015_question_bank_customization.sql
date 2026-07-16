-- Hierarchical question-bank customization. A practice is the persisted clinic boundary.

create table if not exists public.question_bank_override_versions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  scope text not null check (scope in ('clinic', 'provider', 'coordinator')),
  provider_id uuid references public.providers(id) on delete cascade,
  coordinator_member_id uuid references public.practice_members(id) on delete cascade,
  bank_id text not null,
  canonical_condition_id text not null,
  version integer not null check (version > 0),
  state text not null check (state in ('active', 'retired')),
  changes jsonb not null check (jsonb_typeof(changes) = 'array'),
  change_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint question_bank_override_scope_check check (
    (scope = 'clinic' and provider_id is null and coordinator_member_id is null) or
    (scope = 'provider' and provider_id is not null and coordinator_member_id is null) or
    (scope = 'coordinator' and provider_id is not null and coordinator_member_id is not null)
  )
);

create table if not exists public.question_bank_custom_question_versions (
  id uuid primary key default gen_random_uuid(),
  question_key text not null check (question_key like 'custom.%'),
  practice_id uuid not null references public.practices(id) on delete cascade,
  owner_id uuid not null references public.practices(id) on delete cascade,
  scope text not null default 'clinic' check (scope = 'clinic'),
  canonical_condition_id text not null,
  question_text text not null check (length(trim(question_text)) > 0),
  helper_text text not null default '',
  answer_type text not null check (answer_type in ('yes_no', 'number', 'text', 'date', 'single_select', 'multi_select')),
  contexts text[] not null check (cardinality(contexts) > 0),
  version integer not null check (version > 0),
  state text not null check (state in ('active', 'retired')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint question_bank_custom_question_owner_check check (owner_id = practice_id)
);

create table if not exists public.question_bank_favorite_versions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  scope text not null check (scope in ('clinic', 'provider', 'coordinator')),
  provider_id uuid references public.providers(id) on delete cascade,
  coordinator_member_id uuid references public.practice_members(id) on delete cascade,
  canonical_condition_id text not null,
  favorite boolean not null,
  display_order integer not null check (display_order >= 0),
  version integer not null check (version > 0),
  state text not null check (state in ('active', 'retired')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint question_bank_favorite_scope_check check (
    (scope = 'clinic' and provider_id is null and coordinator_member_id is null) or
    (scope = 'provider' and provider_id is not null and coordinator_member_id is null) or
    (scope = 'coordinator' and provider_id is not null and coordinator_member_id is not null)
  )
);

create table if not exists public.question_contribution_candidates (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  canonical_condition_id text not null,
  question_text text not null check (length(trim(question_text)) > 0),
  context text not null check (context in ('intake', 'monthly_checkin', 'annual_review', 'care_plan_review')),
  usage_count integer not null default 0 check (usage_count >= 0),
  opt_in_status text not null default 'not_opted_in' check (opt_in_status in ('not_opted_in', 'opted_in', 'withdrawn')),
  anonymous boolean not null default true,
  no_phi_attested boolean not null check (no_phi_attested),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_contribution_anonymity_check check (
    (anonymous and created_by is null) or (not anonymous and created_by is not null)
  )
);

create unique index if not exists question_bank_override_version_unique
  on public.question_bank_override_versions (
    practice_id,
    scope,
    coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(coordinator_member_id, '00000000-0000-0000-0000-000000000000'::uuid),
    bank_id,
    version
  );
create unique index if not exists question_bank_custom_question_version_unique
  on public.question_bank_custom_question_versions(practice_id, question_key, version);
create unique index if not exists question_bank_favorite_version_unique
  on public.question_bank_favorite_versions (
    practice_id,
    scope,
    coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(coordinator_member_id, '00000000-0000-0000-0000-000000000000'::uuid),
    canonical_condition_id,
    version
  );

create index if not exists question_bank_override_resolution_idx
  on public.question_bank_override_versions(practice_id, bank_id, scope, version desc);
create index if not exists question_bank_custom_question_resolution_idx
  on public.question_bank_custom_question_versions(practice_id, canonical_condition_id, question_key, version desc);
create index if not exists question_bank_favorite_resolution_idx
  on public.question_bank_favorite_versions(practice_id, scope, version desc);
create index if not exists question_contribution_candidate_idx
  on public.question_contribution_candidates(practice_id, opt_in_status, canonical_condition_id);

create or replace function public.enforce_question_bank_scope_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider_id is not null and not exists (
    select 1 from public.providers provider
    where provider.id = new.provider_id and provider.practice_id = new.practice_id
  ) then
    raise exception 'Provider does not belong to the selected clinic' using errcode = '23503';
  end if;
  if new.coordinator_member_id is not null and not exists (
    select 1 from public.practice_members member
    where member.id = new.coordinator_member_id and member.practice_id = new.practice_id
  ) then
    raise exception 'Coordinator does not belong to the selected clinic' using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists question_bank_override_scope_owner on public.question_bank_override_versions;
create trigger question_bank_override_scope_owner
before insert on public.question_bank_override_versions
for each row execute function public.enforce_question_bank_scope_owner();

drop trigger if exists question_bank_favorite_scope_owner on public.question_bank_favorite_versions;
create trigger question_bank_favorite_scope_owner
before insert on public.question_bank_favorite_versions
for each row execute function public.enforce_question_bank_scope_owner();

drop trigger if exists question_bank_override_immutable on public.question_bank_override_versions;
create trigger question_bank_override_immutable
before update or delete on public.question_bank_override_versions
for each row execute function public.prevent_immutable_record_change();

drop trigger if exists question_bank_custom_question_immutable on public.question_bank_custom_question_versions;
create trigger question_bank_custom_question_immutable
before update or delete on public.question_bank_custom_question_versions
for each row execute function public.prevent_immutable_record_change();

drop trigger if exists question_bank_favorite_immutable on public.question_bank_favorite_versions;
create trigger question_bank_favorite_immutable
before update or delete on public.question_bank_favorite_versions
for each row execute function public.prevent_immutable_record_change();

drop trigger if exists set_question_contribution_candidates_updated_at on public.question_contribution_candidates;
create trigger set_question_contribution_candidates_updated_at
before update on public.question_contribution_candidates
for each row execute function public.set_updated_at();

alter table public.question_bank_override_versions enable row level security;
alter table public.question_bank_custom_question_versions enable row level security;
alter table public.question_bank_favorite_versions enable row level security;
alter table public.question_contribution_candidates enable row level security;

create policy question_bank_override_select on public.question_bank_override_versions
for select using (public.is_practice_member(practice_id));
create policy question_bank_override_insert on public.question_bank_override_versions
for insert with check (
  public.has_practice_role(practice_id, array['owner', 'admin']) or
  (scope = 'provider' and exists (
    select 1 from public.providers provider
    join public.practice_members member on member.id = provider.member_id
    where provider.id = provider_id and member.user_id = auth.uid() and member.status = 'active'
  )) or
  (scope = 'coordinator' and exists (
    select 1 from public.practice_members member
    where member.id = coordinator_member_id and member.user_id = auth.uid() and member.status = 'active'
  ))
);

create policy question_bank_custom_question_select on public.question_bank_custom_question_versions
for select using (public.is_practice_member(practice_id));
create policy question_bank_custom_question_insert on public.question_bank_custom_question_versions
for insert with check (public.has_practice_role(practice_id, array['owner', 'admin']));

create policy question_bank_favorite_select on public.question_bank_favorite_versions
for select using (public.is_practice_member(practice_id));
create policy question_bank_favorite_insert on public.question_bank_favorite_versions
for insert with check (
  public.has_practice_role(practice_id, array['owner', 'admin']) or
  (scope = 'provider' and exists (
    select 1 from public.providers provider
    join public.practice_members member on member.id = provider.member_id
    where provider.id = provider_id and member.user_id = auth.uid() and member.status = 'active'
  )) or
  (scope = 'coordinator' and exists (
    select 1 from public.practice_members member
    where member.id = coordinator_member_id and member.user_id = auth.uid() and member.status = 'active'
  ))
);

create policy question_contribution_candidate_select on public.question_contribution_candidates
for select using (public.is_practice_member(practice_id));
create policy question_contribution_candidate_insert on public.question_contribution_candidates
for insert with check (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']));
create policy question_contribution_candidate_update on public.question_contribution_candidates
for update using (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']))
with check (public.has_practice_role(practice_id, array['owner', 'admin', 'provider', 'coordinator']));

-- No policy permits canonical question or canonical bank writes from these tables.
