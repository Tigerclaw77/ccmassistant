# Prototype Debt Inventory

This file records known prototype/dead-code areas so future implementation can be deliberate.

## Zero-Byte Files Found Before This Pass

Routes:

- `app/api/assign/route.ts`
- `app/api/auth/route.ts`
- `app/api/enroll/route.ts`
- `app/api/forms/route.ts`
- `app/api/patients/route.ts`
- `app/api/submit/[token]/route.ts`
- `app/enroll/page.tsx`
- `app/forms/page.tsx`
- `app/forms/[basketId]/page.tsx`
- `app/login/page.tsx`
- `app/patients/new/page.tsx`
- `app/patients/[patientId]/page.tsx`
- `app/patients/[patientId]/checkin/page.tsx`
- `app/signup/page.tsx`
- `app/submissions/page.tsx`

Components and libraries:

- `components/auth/LoginForm.tsx`
- `components/auth/SignupForm.tsx`
- `components/forms/BasketBuilder.tsx`
- `components/patients/PatientForm.tsx`
- `components/patients/PatientTable.tsx`
- `lib/auth.ts`
- `lib/forms.ts`
- `lib/utils.ts`
- `types/basket.ts`
- `types/patient.ts`
- `types/submission.ts`

Migrations:

- `supabase/migrations/001_profiles.sql`
- `supabase/migrations/002_orgs.sql`
- `supabase/migrations/003_patients.sql`
- `supabase/migrations/004_baskets.sql`
- `supabase/migrations/005_submissions.sql`

## Placeholder/Test Data

- Removed from current client code: `app/patients/page.tsx` no longer creates `"Test Patient " + random number`.
- Removed from current client code: `app/patients/page.tsx` no longer writes `test@test.com`.
- Still present as prototype payload only: `app/forms/new/page.tsx` uses hardcoded `"Basic Check-in"` and `sampleQuestions`, but no longer writes directly to Supabase.
- Removed from current client code: `app/dashboard/log/[patientId]/page.tsx` no longer hardcodes `created_by: "staff"`.

## Hardcoded Localhost Links

- Removed from current client code: `app/patients/page.tsx` no longer alerts `http://localhost:3000/f/${token}` after assigning a form.

This should become a generated route from app config plus a server-side check-in send flow.

## Browser Writes That Should Move Server-Side

Current app/components code no longer writes directly to Supabase. These writes were moved behind API routes or replaced with Phase TODOs:

- `app/patients/page.tsx` no longer inserts patients or assignments directly.
- `app/forms/new/page.tsx` no longer inserts baskets directly.
- `components/forms/BasketRenderer.tsx` now posts to `POST /api/submit/[token]`.
- `app/dashboard/worklist/page.tsx` no longer updates assignment follow-up state directly.
- `app/dashboard/log/[patientId]/page.tsx` now posts to `POST /api/interaction-logs`.

Remaining direct Supabase reads are still prototype debt and should move server-side after auth/practice context exists.

## Incomplete Routes

The route tree implies larger workflows than the app currently implements:

- Auth: login/signup exist as files but not product flows.
- Enrollment: route exists but no enrollment workflow exists.
- Patients: detail, new, and check-in routes are empty.
- Forms: list and edit routes are empty.
- Submissions: route exists but no staff-facing submissions workflow exists.
- API: Phase 1 mutation routes exist for patients, enrollment, interaction logs, care plans, check-in status, and legacy public submission. `app/api/assign` and `app/api/forms` are still planning stubs.

## Legacy Model To Retire Or Map Forward

Current code implies:

- `baskets` as form templates.
- `assignments` as form/check-in sends.
- `submissions` as check-in responses.
- `interactions` as time logs.

Planned model:

- `questions`
- `checkin_templates`
- `checkin_instances`
- `checkin_responses`
- `interaction_logs`

Do not keep expanding both models indefinitely.

## Legacy Name Reference Audit

Changed:

- `components/Header.tsx`: user-facing product name changed to CCM Assistant.

Intentionally left alone:

- `package.json`: technical package identifier should be renamed only in a deliberate package/lockfile pass.
- `package-lock.json`: package lock mirrors the package name and should stay in sync with a later package rename.
- Historical/reference document artifact: untracked and left untouched.
