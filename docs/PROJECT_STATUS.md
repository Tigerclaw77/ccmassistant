# Project Status

## 1. Current Product Vision

CCM Assistant is a ledger-first Chronic Care Management product for small medical practices. It helps clinics know which CCM patients are billable this month and generate the evidence to support billing. It is not an AI-first assistant, RPM platform, AWV tool, APCM expansion product, population analytics product, or EHR replacement. The current target customer is a small independent primary-care or specialty practice that wants CCM revenue but does not have a clean operational workflow for consent, monthly outreach, time tracking, care plans, and billing evidence. The core value proposition is: know exactly which CCM patients are billable this month, and generate the evidence to support it.

## 2. Current Architecture

Next.js:

- App Router lives under `app/`.
- Prototype UI routes currently include patients, worklist, billing, public form links, form creation, and interaction logging.
- API routes under `app/api/` now own the initial Phase 1 mutation paths.
- Shared UI components live under `components/`.

Supabase:

- Browser Supabase client lives in `lib/supabase.ts`.
- Server auth/membership helpers live in `lib/auth.ts`.
- Database types live in `lib/supabase/database.types.ts`.
- Shared CCM product/domain types live in `lib/ccm/types.ts`.
- Initial ledger-first schema draft lives in `supabase/migrations/006_ccm_assistant_initial_schema.sql`.
- Legacy migrations `001` through `005` are still zero-byte.

Existing modules:

- Prototype patients.
- Prototype forms/baskets.
- Prototype public submissions.
- Prototype worklist.
- Prototype interaction logging.
- Prototype billing rollup.

Draft modules:

- Auth & Security.
- Practice & Provider Profiles.
- Patients & Enrollment.
- Question Bank.
- Outreach / Check-ins.
- Time Ledger.
- Care Plans.
- Billing / Account.
- Audit Packet.

## 3. Completed Work

- Product-facing legacy branding cleanup to CCM Assistant.
- Homepage promise added.
- Roadmap created.
- Build checklist created.
- Prototype debt inventory created.
- Initial Supabase schema draft created.
- Shared CCM TypeScript types created.
- Supabase database types created.
- Auth/practice membership helpers created.
- Server-owned API mutation foundations created.
- Supabase login/signup UI created.
- Authenticated route gate created.
- First-practice bootstrap flow created.
- Active practice context helper/API created.
- Minimal practice member management API foundation created.
- Patient list reads moved behind practice-scoped API.
- Patient list/detail reads now include current CCM enrollment context.
- Patient create/edit/detail UI now uses server-owned patient and enrollment APIs.
- Initial CCM enrollment fields are wired for status, eligibility, consent, and initiating visit date.
- Status mismatch partially fixed by moving legacy public submission updates server-side and setting `response_status: responded`.
- Empty app/API/component files replaced with explicit TODO placeholders or exports.
- Stale `.next` generated artifacts removed; typecheck passes after cleanup.
- Lint and typecheck pass after the patient enrollment UI pass.

## 4. Current Phase

Phase 2: Auth + Practice Bootstrap.

## 5. Next Recommended Work

1. Finish patient enrollment metadata: chronic conditions, assigned provider, and care coordinator.
2. Time ledger.
3. Question bank.
4. Care plans.
5. Billing engine.
6. Audit packet.

## 6. Known Risks

- The schema has not yet been applied to a live Supabase project.
- RLS policies need real multi-practice testing.
- Practice bootstrap exists but needs live Supabase/RLS testing.
- Some prototype UI still reads legacy tables directly from the browser.
- Public form reading still uses legacy client-side assignment/basket fetches.
- Password reset/email confirmation UX is not implemented.
- Legacy and new data models coexist and need a migration decision.

## 7. Known Technical Debt

- Zero-byte legacy migrations `001` through `005`.
- Prototype tables implied by UI: `baskets`, `assignments`, `submissions`, `interactions`.
- Prototype UI still assumes `patients.name` while the new schema uses `patients.display_name`.
- Placeholder routes need real screens or removal.
- `app/api/assign` and `app/api/forms` are still planning stubs.
- Remaining legacy browser reads should move server-side after their workflows are migrated.
- Billing page still computes from legacy tables.

## 8. Files Most Important To Read First

- `docs/ccm-assistant-roadmap.md`
- `docs/ccm-assistant-build-checklist.md`
- `docs/phase-1-foundation.md`
- `docs/phase-2-auth-practice-bootstrap.md`
- `docs/prototype-debt.md`
- `supabase/migrations/006_ccm_assistant_initial_schema.sql`
- `lib/ccm/types.ts`
- `lib/supabase/database.types.ts`
- `lib/auth.ts`
- `app/api/patients/route.ts`
- `app/api/practices/active/route.ts`
- `app/api/practices/bootstrap/route.ts`
- `app/api/practice-members/route.ts`
- `app/api/enroll/route.ts`
- `app/api/interaction-logs/route.ts`
- `app/api/care-plans/route.ts`
- `app/api/check-ins/status/route.ts`

## 9. Current Product Definition

CCM Assistant solves the operational problem that small practices often cannot reliably prove which Chronic Care Management patients are eligible, consented, actively worked, sufficiently documented, and ready to bill in a given month. It turns CCM from scattered outreach, notes, and spreadsheet math into a practice-scoped monthly ledger with patient enrollment, check-ins, time logs, care plans, billability status, and audit evidence.

## 10. Do Not Build Yet

- AI insights.
- RPM.
- AWV.
- APCM.
- Population analytics.
- Theme systems.
- Expansion modules.
