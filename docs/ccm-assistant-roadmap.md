# CCM Assistant Roadmap

CCM Assistant is being narrowed from a rough prototype into a revenue-focused Chronic Care Management monthly ledger for small practices.

Core promise:

> Know exactly which CCM patients are billable this month, and generate the evidence to support it.

The product is ledger-first. Every module should help a practice complete one clean CCM billing month with defensible evidence.

## Current State

The app currently contains a small Next/Supabase prototype:

- A patient list that can fetch patients and assign a form.
- A basic form creator that inserts one sample "Basic Check-in" basket.
- Public token-based forms that insert submissions.
- A worklist that sorts patients by overdue follow-up and month-to-date minutes.
- A simple interaction logger.
- A monthly billing rollup by patient.

The app is not yet a production CCM product:

- Auth, signup, login, enrollment, patient details, form editing, submissions, API routes, and several components were zero-byte before this pass and are now explicit TODO placeholders.
- Legacy Supabase migrations `001` through `005` are still zero-byte; the first schema draft is `006_ccm_assistant_initial_schema.sql`.
- The browser writes directly to Supabase tables, including patient and interaction records.
- The old submission flow marked assignments as `completed`, while the worklist looked at `response_status`.
- There is no durable consent, eligibility, care plan, provider profile, RLS, audit logging, billing export, or audit packet model.

## Required Modules

### A. Auth & Security

Purpose: protect practice-scoped clinical and billing data before expanding workflows.

Required pieces:

- Login and signup.
- Roles: `owner`, `provider`, `coordinator`, `billing_staff`, `admin`.
- Practice membership through `practice_members`.
- Every patient-facing and billing-facing table must carry `practice_id`.
- RLS should only allow users to access rows for practices where they are active members.
- Server actions or API routes should own writes that affect billability, audit trails, patient records, consent, and check-in status.
- `audit_events` should record important create/update/delete/status transitions.

Phase owner: Phase 1.

### B. Practice & Provider Profiles

Purpose: support real clinic context, provider accountability, and provider-specific check-in preferences.

Required pieces:

- `practices` for the clinic/account.
- `providers` for billing providers and clinical owners of care.
- Staff/users through `practice_members`.
- `provider_preferences` for lightweight per-provider settings.
- `provider_question_preferences` for favorite/avoided questions.
- Provider condition-specific preferences using condition tags and soft caps.

Phase owner: Phase 1 and Phase 3.

### C. Patients & Enrollment

Purpose: establish who is eligible, who consented, and who should be worked this month.

Required pieces:

- `patients`.
- `patient_conditions`.
- `ccm_enrollments`.
- CCM eligibility status and reason metadata.
- Consent status, date, method, and revocation path.
- Optional initiating visit date.
- Active/inactive/declined CCM status.
- Assigned provider and care coordinator.

Phase owner: Phase 2.

### D. Question Bank

Purpose: make check-ins reusable, provider-specific, and condition-aware without over-generating noise.

Required pieces:

- Global questions.
- Practice questions.
- Provider favorites.
- Condition tags.
- Patient-specific preferred or avoided questions.
- Future AI-generated candidate questions must require approve/reject before use.
- Soft caps should prevent repetitive questions for the same condition in the same month.

Phase owner: Phase 3.

### E. Outreach / Check-ins

Purpose: create a monthly outreach record that ties questions, responses, follow-up, and billing evidence together.

Required pieces:

- `checkin_templates`.
- `checkin_instances`.
- `checkin_responses`.
- Monthly check-in statuses: `draft`, `ready`, `sent`, `responded`, `no_response`, `follow_up_needed`, `closed`.
- Status changes should be centralized through server actions/API routes.
- Legacy assignment/basket flows should be migrated or retired once `checkin_instances` exists.
- Submission and worklist status vocabulary must stay aligned.

Phase owner: Phase 4.

### F. Time Ledger

Purpose: make billability auditable by patient and month.

Required pieces:

- `interaction_logs`.
- Activity type.
- Staff member.
- Patient.
- Minutes.
- Billing month/year rollup.
- Notes.
- Source: `manual`, `check_in`, `call`, `portal`, `care_coordination`, `import`.
- Soft-delete or correction workflow, not silent overwrites.

Phase owner: Phase 4.

### G. Care Plans

Purpose: maintain a simple, reviewable care plan that supports CCM billing evidence.

Required pieces:

- `care_plans`.
- Patient and optional condition linkage.
- Goals.
- Interventions.
- Barriers.
- Notes.
- Last reviewed/updated fields.
- No complex AI care-plan generation until the core ledger works.

Phase owner: Phase 5 or Phase 6 depending on billing dependency.

### H. Billing / Account

Purpose: make the revenue workflow explicit.

Required pieces:

- Account/subscription placeholder only.
- Practice billing settings.
- Monthly CCM billability status.
- Ready-to-bill list.
- Already-billed marker.
- Billing export CSV.
- Future Stripe integration placeholder only if Stripe is already present or intentionally added later.

Phase owner: Phase 5.

### I. Audit Packet

Purpose: give the practice evidence for one patient in one month.

Required pieces:

- Per-patient monthly evidence bundle.
- Consent.
- Care plan.
- Time logs.
- Check-in responses.
- Monthly billability summary.
- Start as structured page/export data. PDF can wait unless it becomes trivial.

Phase owner: Phase 6.

## Data Model Plan

The first-pass schema draft lives in:

- `supabase/migrations/006_ccm_assistant_initial_schema.sql`

Core tables:

- `practices`
- `practice_members`
- `providers`
- `provider_preferences`
- `patients`
- `patient_conditions`
- `ccm_enrollments`
- `questions`
- `question_tags`
- `provider_question_preferences`
- `patient_question_preferences`
- `checkin_templates`
- `checkin_instances`
- `checkin_responses`
- `interaction_logs`
- `care_plans`
- `monthly_billability`
- `audit_events`

The schema uses UUID primary keys, `practice_id` for multi-tenancy, timestamps, creator/updater references where useful, enums for important statuses, and RLS assumptions.

The current legacy tables implied by code are:

- `patients`
- `baskets`
- `assignments`
- `submissions`
- `interactions`

These should be mapped forward rather than expanded indefinitely. The new model should replace `baskets` with `questions` plus `checkin_templates`, replace `assignments` with `checkin_instances`, replace `submissions` with `checkin_responses`, and replace `interactions` with `interaction_logs`.

## Build Order

1. Stabilize the repo so app routes are valid modules and generated artifacts are ignored.
2. Create the first real schema and RLS assumptions.
3. Move writes behind server actions/API routes.
4. Build patient import, enrollment, consent, and eligibility.
5. Build provider profiles and question preferences.
6. Build monthly check-in instances and status transitions.
7. Build the time ledger and monthly rollups.
8. Build ready-to-bill status and CSV export.
9. Build the audit packet view/export.
10. Add AI assistance only after the ledger can produce a clean billing month.

## Risk Areas

- Compliance risk: CCM billing support needs consent, care plans, time, eligibility, and evidence to be explicit.
- Security risk: browser-side Supabase writes are too loose for patient and billing data.
- Data quality risk: imported patients, conditions, consent state, and provider assignment need validation.
- Workflow risk: practices will not adopt a standalone tool unless it is faster than spreadsheets and gives billers confidence.
- Integration risk: no EHR import/export path exists yet.
- Product risk: broad assistant features can distract from the one-month billing ledger.

## Non-Goals For Now

- AI-first workflows.
- RPM.
- AWV.
- APCM expansion.
- CHI.
- PIN.
- TCM.
- Population analytics.
- Aggregated pharma/research data insights.
- Decorative theme systems.
- Full EHR replacement.
- Complex AI-generated care plans.

## Definition Of A Useful MVP

The MVP is useful when a small practice can:

1. Import or enter CCM patients.
2. Mark eligibility, consent, and enrollment state.
3. Assign provider and care coordinator.
4. Send or record a monthly check-in.
5. Log all CCM work time.
6. Maintain a simple care plan.
7. See who is ready to bill this month.
8. Export a billing list and evidence packet.
