-- Commercial Stripe billing is separate from CMS CCM billability and evidence.

create table if not exists public.practice_billing_accounts (
  practice_id uuid primary key references public.practices(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  active_price_ids text[] not null default '{}',
  current_patient_quantity integer not null default 0 check (current_patient_quantity >= 0),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'completed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.practice_billing_accounts;
create trigger set_updated_at
before update on public.practice_billing_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.stripe_webhook_events;
create trigger set_updated_at
before update on public.stripe_webhook_events
for each row execute function public.set_updated_at();

alter table public.practice_billing_accounts enable row level security;
alter table public.stripe_webhook_events enable row level security;

drop policy if exists practice_billing_accounts_admin_select on public.practice_billing_accounts;
create policy practice_billing_accounts_admin_select
on public.practice_billing_accounts for select
using (public.has_practice_role(practice_id, array['owner', 'admin']));

revoke all on table public.practice_billing_accounts from public, anon, authenticated;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;

grant select, insert, update on table public.practice_billing_accounts to service_role;
grant select, insert, update on table public.stripe_webhook_events to service_role;

