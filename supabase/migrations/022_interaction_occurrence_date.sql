-- Separate the calendar date of CCM work from database event timestamps.
alter table public.interaction_logs
  add column if not exists occurrence_date date;

-- Historical rows did not retain a separate calendar date. Preserve their
-- existing UTC calendar projection so they remain stable and readable.
update public.interaction_logs
set occurrence_date = (occurred_at at time zone 'UTC')::date
where occurrence_date is null;

alter table public.interaction_logs
  alter column occurrence_date set not null;

alter table public.interaction_logs
  add column if not exists request_id uuid;

create unique index if not exists interaction_logs_practice_request_id_idx
  on public.interaction_logs(practice_id, request_id)
  where request_id is not null;

alter table public.interaction_logs
  drop constraint if exists interaction_logs_launch_validation_check;

alter table public.interaction_logs
  add constraint interaction_logs_launch_validation_check
  check (
    minutes > 0 and minutes <= 480
    and notes is not null and length(btrim(notes)) >= 8
    and billing_month = date_trunc('month', occurrence_date)::date
  ) not valid;

alter table public.interaction_logs
  validate constraint interaction_logs_launch_validation_check;
