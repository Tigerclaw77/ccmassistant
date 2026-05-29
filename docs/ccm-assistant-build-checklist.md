# CCM Assistant Build Checklist

This checklist is intentionally ledger-first. Do not add AI, RPM, AWV, APCM, CHI, PIN, analytics, or theme work until the core monthly CCM ledger works.

## Phase 0: Stabilize Repo

- [x] Rename product-facing legacy-brand references to CCM Assistant.
- [x] Keep technical package identifiers stable until a deliberate package rename is safe.
- [x] Ignore generated `tsconfig.tsbuildinfo`.
- [x] Replace zero-byte app routes with explicit planned placeholders or remove unused routes.
- [x] Replace zero-byte API routes with 501 stubs or implement the real server route.
- [ ] Decide whether legacy `baskets`, `assignments`, `submissions`, and `interactions` stay temporarily or migrate.
- [ ] Make `npm run lint` pass.
- [ ] Make `npx tsc --noEmit` pass from a clean checkout.

## Phase 1: Auth + Schema + RLS Assumptions

- [ ] Create Supabase schema for practices, memberships, providers, patients, enrollments, questions, check-ins, time logs, care plans, monthly billability, and audit events.
- [ ] Add Supabase auth-backed login and signup.
- [ ] Implement roles: `owner`, `provider`, `coordinator`, `billing_staff`, `admin`.
- [ ] Implement practice membership checks.
- [ ] Enable RLS for all practice-scoped tables.
- [ ] Add audit event writes for key status changes.
- [ ] Move sensitive writes out of browser components and into server actions/API routes.

## Phase 2: Patients / Enrollment

- [ ] Build patient create/edit/list/detail.
- [ ] Add CSV patient import.
- [ ] Add chronic condition management.
- [ ] Add CCM eligibility status and reason metadata.
- [ ] Add consent status/date/method.
- [ ] Add initiating visit date if tracked.
- [ ] Add active/inactive CCM status.
- [ ] Add assigned provider and care coordinator.

## Phase 3: Question Bank / Provider Preferences

- [ ] Build global question catalog seed path.
- [ ] Build practice question CRUD.
- [ ] Add condition tags.
- [ ] Add provider favorite/avoid preferences.
- [ ] Add patient-specific preferred/avoid preferences.
- [ ] Add soft caps by condition and month.
- [ ] Reserve AI-generated candidate questions for a later approve/reject workflow.

## Phase 4: Outreach / Time Ledger

- [ ] Build check-in templates.
- [ ] Build monthly check-in instances.
- [ ] Align statuses: `draft`, `ready`, `sent`, `responded`, `no_response`, `follow_up_needed`, `closed`.
- [ ] Store structured check-in responses.
- [ ] Build follow-up worklist from check-in status and due dates.
- [ ] Build interaction logging with staff member, patient, minutes, source, activity type, and billing month.
- [ ] Add correction/audit behavior for time logs.

## Phase 5: Billability Dashboard / Export

- [ ] Create monthly billability calculation.
- [ ] Track consent validity, care-plan availability, enrollment status, time threshold, and check-in evidence.
- [ ] Build ready-to-bill list.
- [ ] Add hold/ineligible reason codes.
- [ ] Add already-billed marker.
- [ ] Add CSV export for billing staff.
- [ ] Add account/subscription placeholder only.

## Phase 6: Audit Packet

- [ ] Build per-patient monthly evidence page.
- [ ] Include consent details.
- [ ] Include care plan and review date.
- [ ] Include time logs.
- [ ] Include check-in responses.
- [ ] Include monthly billability summary.
- [ ] Add exportable structured data.
- [ ] Add PDF export only after the structured packet is useful.

## Phase 7: AI Assistive Features Only After Core Ledger Works

- [ ] Generate candidate questions only after provider preferences and question approval exist.
- [ ] Require approve/reject before any AI-generated question is used.
- [ ] Add care-plan drafting only after simple manual care plans are stable.
- [ ] Avoid population analytics until enough clean ledger data exists.
