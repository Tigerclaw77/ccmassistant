# Phase 2 Auth + Practice Bootstrap

Phase 2 makes CCM Assistant usable by a first practice owner without adding billing UI, Stripe, AI, or expansion modules.

## Auth Flow Created

- `/login` uses Supabase email/password sign-in.
- `/signup` uses Supabase email/password sign-up.
- `components/auth/AuthGate.tsx` redirects unauthenticated users away from protected routes.
- Authenticated users visiting `/login` or `/signup` are redirected into `/patients`.
- Public routes are `/`, `/login`, `/signup`, and public form URLs under `/f/`.

Because the app currently uses Supabase's browser session storage, route protection is client-side. Server APIs still require Bearer tokens and enforce membership.

## Practice Bootstrap

- `/setup/practice` lets an authenticated user create the first practice workspace.
- `POST /api/practices/bootstrap` verifies the Supabase user from the Bearer token.
- If the user already has an active membership, the existing practice is returned.
- If the user has no active membership, the route creates:
  - a `practices` row
  - an active `practice_members` row with role `owner`
  - an `audit_events` row for `practice.bootstrapped`
- Bootstrap uses the server-side service role key because a user with no membership cannot pass RLS yet.

## Active Practice Context

- `lib/practice-context.ts` resolves the active practice from:
  - `x-active-practice-id` header when present
  - otherwise the first active membership for the user
- `GET /api/practices/active` returns the active practice and membership.
- The browser stores the active practice id in `localStorage.activePracticeId`.

## Membership / Role Foundation

- `GET /api/practice-members` lists members for a practice.
- `POST /api/practice-members` creates an active member by `userId` or an invited placeholder by `invitedEmail`.
- Member creation requires owner/admin role.
- This is a foundation only; invitation email delivery is not implemented.

## Patient List Reads

- `app/patients/page.tsx` no longer reads Supabase directly.
- It resolves the active practice through `GET /api/practices/active`.
- It loads patients through `GET /api/patients?practiceId=...`.
- The patient list now renders enrollment, eligibility, consent, and patient status from server-owned reads.
- Legacy basket/template reads were removed from the patient page.

## Patient Enrollment UI

- `/patients/new` resolves the active practice and creates a patient through `POST /api/patients`.
- New patients also receive an initial `ccm_enrollments` row through `POST /api/enroll`.
- `/patients/[patientId]` loads patient detail through `GET /api/patients?practiceId=...&patientId=...`.
- Patient detail edits demographics through `PATCH /api/patients`.
- Patient detail edits enrollment through `PATCH /api/enroll` when an enrollment exists, otherwise `POST /api/enroll`.
- `/enroll` redirects to `/patients/new` so the enrollment entry point uses the real patient workflow.

## Security Notes

- No service role key is used client-side.
- Practice bootstrap and legacy public submission are the only current service-role routes.
- Authenticated mutation APIs require Bearer token and active practice membership.
- Patient list reads are server-owned and practice-scoped.
- RLS-compatible assumptions remain: server APIs pass the user's access token to Supabase unless a service-role exception is explicitly required.

## Remaining Direct Browser Reads

The patient list is fixed. These prototype reads remain:

- `app/dashboard/worklist/page.tsx` reads legacy patients, assignments, and interactions.
- `app/dashboard/billing/page.tsx` reads legacy patients, interactions, and submissions.
- `app/f/[token]/page.tsx` reads legacy assignment and basket data for public form rendering.

These should move behind server routes when those workflows are migrated from legacy tables to the new ledger schema.
