# Implementation Gap Analysis

Status: static implementation audit  
Reference documents:

- `docs/product/ccm-workflow-spec.md`
- `docs/product/vertical-slice-mvp.md`

Scope: current codebase only. This audit does not propose new product features and does not include browser/runtime validation.

Governing philosophy: completion is evaluated against `docs/product/product-principles.md` as well as the workflow and MVP documents. A missing automation is not a gap unless it is required for adoption, patient safety, privacy, billing integrity, user experience, or the defined vertical slice.

## Status Legend

- ✅ Complete: implemented enough for the documented vertical slice.
- 🟡 Partial: real implementation exists, but it does not fully satisfy the product documentation.
- ⚪ Stub: placeholder, hidden route, schema-only, or 501/not-found implementation.
- ❌ Missing: no meaningful implementation found.

## Executive Finding

CCM Assistant already has a substantial ledger-first first-billable-month implementation: Supabase auth, practice bootstrap, provider records, patient/enrollment records, chronic condition capture, manual care plans, monthly check-ins, public responses, time logs, billability recalculation, billing state changes, and evidence packets.

The main gap is that the current implementation predates the newest vertical-slice product plan. The product plan now requires a more demo-ready clinical/compliance story: CMS setup attestation, structured provider eligibility attestation, consent element checklist, AI-assisted intake, AI draft summary, and provider review marker. Those are either missing or only represented as generic status/notes fields.

The current app can demonstrate the vertical-slice billing story. After Sprint 1, practice attestations, provider type/manual review, structured consent elements, consent audit history, and stricter billing readiness were implemented. After Sprint 2, structured patient-level eligibility and reviewed AI intake are implemented and included in billing readiness, care-plan context, and evidence packets.

## Sprint 1 Update

Implemented in this sprint:

- Practice onboarding captures billing practitioner type, CMS eligibility attestation, and Medicare enrollment attestation.
- Unsupported billing practitioner types are marked for manual review and block billability until resolved.
- Structured consent captures method, date, status, required CMS consent elements, and consent audit history.
- Billability now checks practice attestations, two chronic conditions, consent method/elements, and provider manual-review state.
- Worklist and evidence packet now surface the new readiness inputs.

Updated vertical-slice completion estimate: 75%.

## Sprint 2 Update

Implemented in this sprint:

- Structured eligibility workflow at `/patients/[patientId]/eligibility`.
- Eligibility metadata now separates user-entered facts, provider attestations, and system validations.
- AI-assisted intake workflow at `/patients/[patientId]/intake`.
- `POST/PATCH/GET /api/patient-intake` for draft generation, editable review, acceptance, and retrieval.
- `patient_intake_summaries` database table for reviewed intake artifacts.
- Billability now requires structured eligibility completion and an accepted reviewed intake summary.
- Worklist, care plan, billing evidence, and evidence snapshots now surface the reviewed intake artifact.

Updated vertical-slice completion estimate: 87%.

## MVP Feature Audit

### Practice

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Sign up and login | ✅ Complete | Files/components/routes: `app/login/page.tsx`, `app/signup/page.tsx`, `components/auth/AuthForm.tsx`, `components/auth/AuthGate.tsx`, `lib/supabase.ts`, `lib/auth.ts`. DB: Supabase `auth.users`. APIs: Supabase client auth; `app/api/auth/route.ts` is a legacy 501 stub and not used. AI: none. | Password reset/email confirmation UX is not present, but not required for the one-user demo. | XS |
| Practice creation | ✅ Complete | Files/routes: `app/setup/practice/page.tsx`, `app/api/practices/bootstrap/route.ts`, `app/api/practices/active/route.ts`. DB: `practices`, `practice_members`, `audit_events`. API: `POST /api/practices/bootstrap`, `GET/PATCH /api/practices/active`. AI: none. | Setup only captures practice name; richer settings are edited later. | XS |
| Single billing practitioner setup | ✅ Complete | Files/routes: `app/setup/practice/page.tsx`, `app/settings/page.tsx`, `app/api/providers/route.ts`. Components: settings provider list/add/edit. DB: `providers`. API: `GET/POST/PATCH /api/providers`. AI: none. | Setup creates a provider but only asks name and NPI. | XS |
| Practitioner NPI and credentials | 🟡 Partial | Files/routes: `app/setup/practice/page.tsx` captures NPI; `app/settings/page.tsx` captures credentials, NPI, phone, email, active state. DB: `providers.credentials`, `providers.npi`. API: `GET/POST/PATCH /api/providers`. AI: none. | Credentials are not captured during setup; NPI has no format validation; no explicit billing-practitioner attestation. | S |
| Default CCM minute threshold | 🟡 Partial | Files/routes: `app/settings/page.tsx`, `app/api/practices/active/route.ts`, `app/api/billability/recalculate/route.ts`. DB: `practices.ccm_monthly_min_minutes`. API: `PATCH /api/practices/active`. AI: none. | Threshold is configurable in settings and used in billability, but not captured during initial practice setup as the product plan describes. | XS |
| Basic CMS setup attestation | ✅ Complete | Files/components/routes: `app/setup/practice/page.tsx`, `app/settings/page.tsx`. DB: stored in `practices.billing_settings`. APIs: `POST /api/practices/bootstrap`, `PATCH /api/practices/active`. AI: none. | No dedicated attestation table; JSON settings are sufficient for the vertical slice. | XS |
| Simple dashboard | 🟡 Partial | Files/routes: `app/dashboard/page.tsx` redirects to `app/dashboard/worklist/page.tsx`; `components/Header.tsx` provides production navigation. DB/APIs: reads patient, billing, care plan, check-in, log, and condition APIs. AI: none. | No dashboard setup-completion view; worklist is useful after patients exist but does not guide initial practice setup. | S |
| Edit practice/provider typo | ✅ Complete | Files/routes: `app/settings/page.tsx`, `app/api/practices/active/route.ts`, `app/api/providers/route.ts`. DB: `practices`, `providers`, `audit_events`. APIs: `PATCH /api/practices/active`, `PATCH /api/providers`. AI: none. | Minor validation polish only. | XS |

### Patient

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Create one patient | ✅ Complete | Files/components/routes: `app/patients/page.tsx`, `app/patients/new/page.tsx`, `app/patients/[patientId]/page.tsx`, `components/patients/PatientForm.tsx`, `components/patients/PatientTable.tsx`. DB: `patients`, `ccm_enrollments`, `patient_conditions`, `audit_events`. APIs: `GET/POST/PATCH /api/patients`, `POST/PATCH /api/enroll`, `GET/PUT /api/patient-conditions`. AI: none. | No blocker for one-patient demo. | XS |
| Patient demographics | ✅ Complete | Files/components/routes: `PatientForm`, patient pages. DB: `patients.first_name`, `last_name`, `display_name`, `dob`, `phone`, `email`, `external_id`, `preferred_contact_method`. APIs: `/api/patients`. AI: none. | Address and payer fields are not implemented, but the vertical slice can identify one patient without them. | XS |
| Chronic condition capture | 🟡 Partial | Files/components/routes: `PatientForm`. DB: `patient_conditions` supports condition name, code system, code, diagnosed date, notes. API: `GET/PUT /api/patient-conditions`. AI: none. | UI only captures free-text condition names; it does not capture ICD-10 code, onset/date, notes, or enforce two qualifying chronic conditions. Billability currently requires at least one active condition, which is weaker than the product assumptions. | S |
| Assign billing practitioner | ✅ Complete | Files/components/routes: `PatientForm`. DB: `patients.primary_provider_id`, `ccm_enrollments.assigned_provider_id`. APIs: `/api/patients`, `/api/enroll`, `/api/providers`. AI: none. | No blocker for one-practitioner demo. | XS |
| Eligibility attestation | ✅ Complete | Files/components/routes: `app/patients/[patientId]/eligibility/page.tsx`, `components/patients/PatientForm.tsx`. DB: `ccm_enrollments.eligibility_status`, `eligibility_notes`, `eligibility_metadata`. APIs: `POST/PATCH /api/enroll`. AI: none. | Dedicated manual review queue remains deferred; the vertical slice has structured facts, provider attestations, system validations, actor/date metadata, and audit events. | XS |
| Enrollment status | ✅ Complete | Files/components/routes: `PatientForm`, `PatientTable`, `Worklist`. DB: `ccm_enrollments.status`, `enrolled_at`, `ended_at`. API: `POST/PATCH /api/enroll`. AI: none. | No blocker for vertical slice. | XS |
| Duplicate patient warning | ❌ Missing | Existing: DB has `patients_unique_external_id` only. Files/components/routes: no duplicate warning UI. APIs: no duplicate-search path. AI: none. | Name/date-of-birth duplicate warning. This is nice-to-have, not required for the one-patient demo. | S |

### Questionnaire

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| AI-assisted intake prompt | ✅ Complete | Files/routes/APIs: `app/patients/[patientId]/intake/page.tsx`, `app/api/patient-intake/route.ts`, `lib/ccm/ai-intake.ts`. DB: `patient_intake_summaries`. AI: OpenAI chat completion when `OPENAI_API_KEY` is configured, deterministic fallback otherwise. | Prompt is intentionally minimal and produces draft documentation only. | S |
| Minimal reusable question set | 🟡 Partial | Existing for monthly check-ins: `app/api/check-ins/route.ts` creates three fixed default questions in `questions` and `checkin_templates`. Clinical KB exists in `supabase/migrations/008_clinical_knowledge_base.sql`, `app/clinical-knowledge/page.tsx`, `app/api/clinical-knowledge/*`. Intake screen captures medications and free-text clinical notes. | Intake questions are not stored as reusable question records yet; this is acceptable for the physician demo but not a full questionnaire engine. | S |
| Coordinator-entered answers | ✅ Complete | Files/routes/APIs: `app/patients/[patientId]/intake/page.tsx`, `app/api/patient-intake/route.ts`. DB: `patient_intake_summaries.input_snapshot`. AI: intake draft generation consumes coordinator-entered medications and clinical notes. | Patient-facing intake remains deferred. | XS |
| AI draft clinical summary | ✅ Complete | Files/routes/APIs: `app/patients/[patientId]/intake/page.tsx`, `app/api/patient-intake/route.ts`, `lib/ccm/ai-intake.ts`. DB: `patient_intake_summaries.draft_summary`, `reviewed_summary`, `missing_information`, `follow_up_questions`. AI: bounded draft summary prompt with fallback. | Advanced prompt optimization and care-plan generation remain deferred. | S |
| Provider review marker | ✅ Complete | Files/routes/APIs: `app/patients/[patientId]/intake/page.tsx`, `app/api/patient-intake/route.ts`. DB: `patient_intake_summaries.status`, `accepted_by`, `accepted_at`, `reviewed_summary`. AI: generated sections remain draft until accepted. | Dedicated provider signature workflow remains deferred. | XS |
| Dynamic branching questions | ⚪ Stub | DB-only future support exists in clinical KB: `question_dependencies`, `question_rotation_rules` in migration `008`. Admin browser can view knowledge data. APIs: `/api/clinical-knowledge`, `/api/clinical-knowledge/diagnosis`. AI: none. | No runtime branching questionnaire engine. Nice-to-have only. | M |

### Consent

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Consent status | ✅ Complete | Files/components/routes: `PatientForm`, `PatientTable`, `Worklist`, `Billing`, `EvidencePacket`. DB: `ccm_enrollments.consent_status`. API: `POST/PATCH /api/enroll`. AI: none. | No blocker for vertical slice. | XS |
| Consent date | ✅ Complete | Files/components/routes: `PatientForm`, evidence packet. DB: `ccm_enrollments.consent_date`. API: `/api/enroll`. AI: none. | No blocker for vertical slice. | XS |
| Consent method | ✅ Complete | Files/components/routes: `PatientForm`. DB: `ccm_enrollments.consent_method`. API: `/api/enroll`. AI: none. | No blocker for vertical slice. | XS |
| Required consent element checklist | ✅ Complete | Files/components/routes: `components/patients/PatientForm.tsx`, `app/dashboard/worklist/page.tsx`, `app/dashboard/billing/[patientId]/[month]/page.tsx`. DB: `ccm_enrollments.consent_metadata`. APIs: `POST/PATCH /api/enroll`, `POST /api/billability/recalculate`, `GET /api/audit-packet`. AI: none. | Consent script/version is not captured; not required for this sprint. | XS |
| Consent audit event | ✅ Complete | Files/components/routes: `components/patients/PatientForm.tsx`. DB: `audit_events`. APIs: `POST/PATCH /api/enroll`, `GET /api/patients` returns recent consent audit events. AI: none. | Full audit administration remains deferred. | XS |
| Consent revocation | 🟡 Partial | Files/components/routes: `PatientForm` can set consent status to `revoked`; billability fails unless status is `obtained`. DB: `ccm_consent_status` enum includes `revoked`. API: `/api/enroll`. AI: none. | No revocation date, reason, actor-specific workflow, or future-period state handling beyond status. Nice-to-have for vertical slice. | S |

### Care Plan

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Basic care plan create/edit | ✅ Complete | Files/routes: `app/patients/[patientId]/care-plan/page.tsx`, `app/api/care-plans/route.ts`. DB: `care_plans`. API: `GET/POST/PATCH /api/care-plans`. AI: none. | No blocker for one-month demo. | XS |
| Provider review/approval | 🟡 Partial | Existing: care plan screen captures status and last reviewed date; DB has `care_plans.status`, `last_reviewed_at`, `provider_id`. API: `/api/care-plans`. AI: none. | No explicit `reviewed_by`, provider approval action, or separate provider signature/attestation. | S |
| Active care plan status | ✅ Complete | Files/routes: care plan page, worklist, billability calculation. DB: `care_plans.status`. APIs: `/api/care-plans`, `/api/billability/recalculate`. AI: none. | No blocker. | XS |
| Last reviewed date | ✅ Complete | Files/routes: care plan page and billability logic. DB: `care_plans.last_reviewed_at`. API: `/api/care-plans`. AI: none. | No blocker. | XS |
| AI-generated care-plan draft | ❌ Missing | Files/components/routes/APIs: none. DB: no AI care-plan draft model. AI: none. | AI draft generation from intake. Nice-to-have in product plan. | L |
| Revision history | 🟡 Partial | Existing: updates are audit logged through `care_plan.updated`. DB: `audit_events`; no revision table. API: `/api/care-plans`. AI: none. | Dedicated revision history view/model is missing. Nice-to-have only. | M |

### Monthly Tracking

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Monthly check-in instance | ✅ Complete | Files/routes: `app/patients/[patientId]/checkin/page.tsx`, `app/api/check-ins/route.ts`. DB: `checkin_instances`, `checkin_templates`, `questions`. API: `GET/POST /api/check-ins`. AI: none; fixed default questions. | No blocker. | XS |
| Public check-in link | ✅ Complete | Files/routes: `app/patients/[patientId]/checkin/page.tsx`, `app/f/[token]/page.tsx`, `app/api/check-ins/public/[token]/route.ts`. DB: `checkin_instances.token`. API: `GET /api/check-ins/public/[token]`. AI: none. | No blocker. | XS |
| Patient response capture | ✅ Complete | Files/routes: `app/f/[token]/page.tsx`, `app/api/check-ins/public/[token]/submit/route.ts`. DB: `checkin_responses`, `audit_events`. API: `POST /api/check-ins/public/[token]/submit`. AI: none. | No blocker. | XS |
| Check-in reviewed/closed state | ✅ Complete | Files/routes: check-in page and status API. DB: `checkin_instances.status`, `closed_at`, `responded_at`. API: `PATCH /api/check-ins/status`. AI: none. | Closing requires at least one response; no documented no-response closure path for the happy-path demo. | XS |
| Interaction time logs | ✅ Complete | Files/routes: `app/dashboard/log/[patientId]/page.tsx`, `app/api/interaction-logs/route.ts`. DB: `interaction_logs`. API: `GET/POST /api/interaction-logs`. AI: none. | No blocker. | XS |
| Billing month on logs | ✅ Complete | Files/routes: time log page. DB: `interaction_logs.billing_month` with first-day check. API: `/api/interaction-logs`. AI: none. | No blocker. | XS |
| At least 20 logged minutes | ✅ Complete | Files/routes: billing and worklist. DB: `practices.ccm_monthly_min_minutes`, `interaction_logs`, `monthly_billability`. API: `POST /api/billability/recalculate`. AI: none. | No blocker; threshold is configurable but not initial setup. | XS |
| Medication reconciliation note | 🟡 Partial | Existing: interaction log notes and activity types can record care review/documentation. DB: `interaction_logs.notes`. API: `/api/interaction-logs`. AI: none. | No structured medication reconciliation field or monthly medication section. Nice-to-have only. | S |
| Follow-up task list | ❌ Missing | Files/components/routes/APIs/DB: none dedicated. AI: none. | Dedicated task/follow-up records and UI. Nice-to-have only. | M |

### Billing Readiness

| Feature | Status | Existing implementation | Missing | Difficulty |
| --- | --- | --- | --- | --- |
| Billability checklist | ✅ Complete | Files/routes: `app/dashboard/worklist/page.tsx`, `app/dashboard/billing/page.tsx`, `app/api/billability/recalculate/route.ts`. DB: `monthly_billability`. API: `POST /api/billability/recalculate`. AI: none. | Provider-documented exception for fewer than two conditions is not implemented; the vertical slice expects two conditions. | XS |
| Billability recalculation | ✅ Complete | Files/routes: `app/api/billability/recalculate/route.ts`, billing page. DB: `monthly_billability`, related CCM tables. API: `POST /api/billability/recalculate`. AI: none. | No blocker for ledger demo. | XS |
| Plain-English blockers | ✅ Complete | Files/routes: `app/dashboard/worklist/page.tsx`, `app/dashboard/billing/page.tsx`, `lib/ccm/labels.ts`. DB: `monthly_billability.reason_codes`. APIs: billing and recalc. AI: reviewed intake and structured eligibility blockers are represented in plain English. | Additional dashboard sequencing polish remains deferred. | XS |
| Ready to bill state | ✅ Complete | Files/routes/APIs: billing page and recalc API. DB: `monthly_billability.status`. API: `/api/billability/recalculate`. AI: none. | No blocker. | XS |
| Evidence view | ✅ Complete | Files/routes: `app/dashboard/billing/[patientId]/[month]/page.tsx`, `app/api/audit-packet/route.ts`. DB: `billing_evidence_snapshots`, `audit_events`, all source tables including `patient_intake_summaries`. API: `GET /api/audit-packet`. AI: accepted intake summary is displayed as reviewed evidence. | PDF/CSV exports remain deferred. | XS |
| Mark reviewed | ✅ Complete | Files/routes: `app/dashboard/billing/page.tsx`, `app/api/billing/month/route.ts`. DB: `monthly_billability.reviewed_by`, `reviewed_at`, `billing_evidence_snapshots`. API: `PATCH /api/billing/month`. AI: none. | No blocker. | XS |
| Mark billed | ✅ Complete | Files/routes: billing page and API. DB: `monthly_billability.billed_at`, `status`, `billing_evidence_snapshots`. API: `PATCH /api/billing/month`. AI: none. | No blocker. | XS |
| Exportable evidence | 🟡 Partial | Existing: HTML evidence page can be viewed/printed by browser. DB: `billing_evidence_snapshots`. API: `GET /api/audit-packet`. AI: none. | No explicit export/download action; PDF/CSV are intentionally deferred. | S |

## Cut List Implementation Check

The following items from `vertical-slice-mvp.md` are appropriately absent or hidden from the core workflow:

- Analytics/reporting: not implemented beyond billing/evidence views.
- Multiple practices: not exposed as a supported workflow, though the schema is practice-scoped.
- Organization roles/staff invitations: schema and APIs exist, but the MVP can operate with one owner/coordinator. This is more scaffolding than needed, not a blocker.
- Theme customization: only a small theme init script exists; no product customization workflow.
- Medicare Advantage support, EHR integration, claims submission, billing automation: not implemented.
- AI optimization/recommendation engine: not implemented.
- Patient portal enhancements: not implemented beyond public check-in link.
- Notifications beyond essentials: not implemented; public link must be copied manually.
- Full question bank CRUD: legacy `/forms` routes are hidden with `notFound`; clinical knowledge admin browser exists but is separate from the MVP path.
- File uploads, PDF export, CSV billing export, duplicate merge, lapsed patient workflows, staff turnover workflows, advanced permissions, full audit admin, multi-month history: not implemented or not exposed.

## Stubs and Legacy Surfaces

| Surface | Status | Notes |
| --- | --- | --- |
| `app/forms/page.tsx`, `app/forms/new/page.tsx`, `app/forms/[basketId]/page.tsx` | ⚪ Stub | Hidden with `notFound()`. Good for MVP cleanup. |
| `app/submissions/page.tsx` | ⚪ Stub | Hidden with `notFound()`. Good for MVP cleanup. |
| `app/api/forms/route.ts` | ⚪ Stub | Returns 501. Not on core path. |
| `app/api/assign/route.ts` | ⚪ Stub | Returns 501. Not on core path. |
| `app/api/auth/route.ts` | ⚪ Stub | Returns 501, while real auth uses Supabase client directly. |
| `app/api/submit/[token]/route.ts` | ⚪ Stub/legacy | Still targets legacy `assignments` and `submissions`; not used by `/f/[token]` new-schema check-in path. |
| `app/clinical-knowledge/page.tsx` and `/api/clinical-knowledge*` | 🟡 Partial/future | Implemented admin browser and APIs for Sprint 2 knowledge base, but not connected to the vertical-slice intake/check-in workflow. |

# Current Vertical Slice Completion

| Area | Completion | Rationale |
| --- | ---: | --- |
| Authentication | 85% | Real Supabase signup/login/session gate exists. Missing only account recovery/confirmation polish. |
| Practice onboarding | 78% | Practice bootstrap works; provider name/NPI/type and practice attestations are captured. Threshold remains settings-only and dashboard setup guidance is partial. |
| Billing practitioner | 88% | Provider CRUD, type, manual-review state, NPI, credentials, and active/inactive state exist. Setup does not capture credentials and validation is light. |
| Patient management | 75% | Patient create/edit/list/detail, assignments, enrollment, and conditions exist. Conditions are text-only and duplicate/payer workflows are absent. |
| Eligibility | 85% | Structured facts, provider attestations, system validations, audit events, worklist blockers, billability blockers, and evidence display are implemented. Dedicated manual-review queue is deferred. |
| Questionnaire | 80% | Minimal AI-assisted intake, coordinator-entered medications/notes, missing-info list, follow-up questions, editable draft summary, and accepted review marker are implemented. Reusable intake question records and branching are deferred. |
| Consent | 85% | Consent status/date/method/elements are implemented, audited, and affect billability. Consent script/version remains deferred. |
| Care plan | 75% | Manual care plan create/edit/active/reviewed-date path exists. Explicit provider approval and revision history are partial. |
| Monthly tracking | 85% | Check-in, public response, close/review, time logs, billing month, and threshold are implemented. Structured medication reconciliation and task list are missing but not critical. |
| Billing readiness | 94% | Recalculation, reason labels, ready/hold/reviewed/billed, snapshots, and evidence view are implemented with stricter Sprint 1 readiness inputs. Future AI/attestation artifacts remain gaps. |
| Dashboard | 65% | Worklist is useful and new-schema based with fuller blockers, but there is no dedicated setup progress/dashboard initialization experience. |

Overall vertical-slice completion estimate: 87%.

The first-billable-month ledger is now close to demo-ready. The remaining gap is mostly workflow polish: clearer dashboard guidance, more explicit care-plan approval semantics, reusable intake question records, and hands-on happy-path validation after migration 010 is applied.

# Critical Path

Remaining implementation tasks required to complete the Vertical Slice MVP, in dependency order:

1. Tighten care-plan approval:
   - Preserve current manual care-plan flow.
   - Add explicit provider reviewed/approved actor and date, or make the existing reviewed date unambiguous in UI/evidence.

2. Add setup/dashboard progress guidance:
   - Show the next required action after practice setup.
   - Make it obvious how to proceed from provider to patient to consent/intake/care plan/monthly work/billing.

3. Re-run the happy-path demo:
   - Practice setup.
   - Provider.
   - Patient with two conditions.
   - Eligibility attestation.
   - Consent elements.
   - AI intake and review.
   - Active care plan.
   - Check-in response.
   - 20+ minutes.
   - Recalculate.
   - Reviewed/billed.
   - Evidence packet.

# Recommended Next Sprint

Recommended sprint: demo hardening and happy-path validation, 1-2 days.

Goal: make the now-complete vertical slice easier to demonstrate without expanding into a recommendation engine, clinical knowledge integration, exports, notifications, or EHR work.

## Sprint Scope

1. Care-plan approval clarity:
   - Make the provider review/approval state unmistakable in UI and evidence.

2. Dashboard guidance:
   - Surface the next best action for the one-patient demo path.

3. Happy-path QA:
   - Apply migration 010.
   - Complete one patient-month through reviewed/billed/evidence.
   - Fix only true blockers.

## Why This Sprint

- It protects the exact demo path.
- It leaves the app usable because the core ledger, eligibility, and intake paths now work.
- It avoids speculative population, integration, notification, analytics, or recommendation work.
- It closes the remaining presentation and validation gaps a physician or office manager would notice during a demo.

## Out of Scope For This Sprint

- Dynamic branching questionnaire engine.
- Full clinical knowledge integration.
- PDF/CSV export.
- Claims submission.
- EHR integration.
- Multi-provider or role-management expansion.
- Recommendation engine.
