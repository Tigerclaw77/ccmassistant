-- Vertical Slice MVP Sprint 1: practice onboarding and structured consent.

alter table public.providers
  add column if not exists billing_practitioner_type text not null default 'physician',
  add column if not exists manual_review_status text not null default 'not_required',
  add column if not exists manual_review_reason text;

do $$
begin
  alter table public.providers
    add constraint providers_billing_practitioner_type_check
    check (
      billing_practitioner_type in (
        'physician',
        'nurse_practitioner',
        'physician_assistant',
        'clinical_nurse_specialist',
        'certified_nurse_midwife',
        'registered_nurse',
        'medical_assistant',
        'other'
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.providers
    add constraint providers_manual_review_status_check
    check (manual_review_status in ('not_required', 'needs_review', 'reviewed'));
exception when duplicate_object then null;
end $$;

alter table public.ccm_enrollments
  add column if not exists consent_metadata jsonb not null default '{}'::jsonb;
