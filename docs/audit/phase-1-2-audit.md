# Phase 1/2 Executive Audit

Generated on 2026-05-31 from repository evidence only.

Scope:

- Phase 1: schema, auth assumptions, server-owned mutations, RLS assumptions.
- Phase 2: auth UI, practice bootstrap, active practice context, membership foundation.
- No feature implementation was performed as part of this audit pass.
- This audit reflects the current working tree, which already contains uncommitted patient/enrollment feature edits from an earlier pass.

Generated artifacts:

- `schema.sql`
- `docs/audit/migrations.md`
- `docs/audit/rls-inventory.md`

## 1. Executive Audit

Current state:

- The repo has a ledger-first CCM schema draft with practices, memberships, providers, patients, enrollments, questions, check-ins, time logs, care plans, billability, and audit events.
- Supabase email/password login/signup exists in client UI.
- Server API helpers require Supabase bearer tokens and active practice membership.
- Practice bootstrap exists and uses a service-role client for the first owner/practice creation path.
- Active practice context exists through `/api/practices/active` and `localStorage.activePracticeId`.
- Several prototype screens still read legacy tables directly from the browser.
- Supabase Storage is not in use.
- The actual hosted Supabase schema state is not proven by repository files.

Highest-risk findings:

- **High:** RLS policies are over-broad for writes. Most practice tables use active-membership-only `for all` policies, so database-level permissions are broader than application route permissions.
- **High:** `practice_members` RLS allows any active member to insert/update membership rows at the database layer.
- **High:** `audit_events` RLS allows active members to update/delete audit rows because the policy is `for all`.
- **High:** Legacy browser reads still depend on live legacy tables and their unknown RLS state.
- **Medium:** Auth route protection is client-side; server APIs are protected, but page-level access depends on `AuthGate`.
- **Medium:** Login/signup `next` redirect is not constrained to app-local paths.
- **Medium:** There is no repo proof that migration `006` has been applied or tested against a live multi-practice Supabase project.

## 2. Architecture Review

Application architecture:

- Framework: Next.js App Router under `app/`.
- Client Supabase singleton: `lib/supabase.ts`.
- Server auth and Supabase clients: `lib/auth.ts`.
- Active practice resolution: `lib/practice-context.ts`.
- Shared product/domain types: `lib/ccm/types.ts`.
- Hand-authored Supabase database type surface: `lib/supabase/database.types.ts`.
- Audit event writer: `lib/ccm/audit.ts`.

Server-owned Phase 1/2 API surfaces:

- `POST /api/practices/bootstrap`
- `GET /api/practices/active`
- `GET /api/practice-members`
- `POST /api/practice-members`
- `GET /api/patients`
- `POST /api/patients`
- `PATCH /api/patients`
- `POST /api/enroll`
- `PATCH /api/enroll`
- `POST /api/interaction-logs`
- `POST /api/care-plans`
- `PATCH /api/care-plans`
- `PATCH /api/check-ins/status`
- `POST /api/submit/[token]`

Architecture strengths:

- Practice membership checks are centralized in `requirePracticeMembership`.
- Server clients pass the user's bearer token through to Supabase so RLS applies on normal API routes.
- Service-role usage is isolated to bootstrap and legacy public submission routes.
- Practice context is explicit and request-scoped for server APIs.

Architecture gaps:

- Browser client reads still exist in legacy worklist, billing, and public form routes.
- Legacy and new data models coexist: `baskets`, `assignments`, `submissions`, `interactions` versus `questions`, `checkin_templates`, `checkin_instances`, `checkin_responses`, `interaction_logs`.
- `database.types.ts` is manually maintained rather than generated from the actual Supabase project.
- There is no server-side route middleware; route gating is implemented in a client component.
- There is no observed automated RLS/membership integration test suite.

## 3. Security Review

Auth:

- Supabase browser auth stores the client session.
- Login uses `supabase.auth.signInWithPassword`.
- Signup uses `supabase.auth.signUp`.
- Protected pages rely on `components/auth/AuthGate.tsx`.
- Server APIs require `Authorization: Bearer <access token>` and call `supabase.auth.getUser`.

Authorization:

- Practice access is enforced in server code through active `practice_members` rows.
- Application-level role groups:
  - `PRACTICE_ADMIN_ROLES`: `owner`, `admin`
  - `PATIENT_WRITE_ROLES`: `owner`, `admin`, `provider`, `coordinator`
  - `BILLING_WRITE_ROLES`: `owner`, `admin`, `billing_staff`
- Database-level RLS does not currently mirror these role groups.

Service role:

- `createServiceRoleSupabaseClient` exists in `lib/auth.ts`.
- Service role is used by `POST /api/practices/bootstrap`.
- A separate legacy service client is used by `POST /api/submit/[token]`.
- `.env.local` in this repo has public Supabase URL/anon configuration but no `SUPABASE_SERVICE_ROLE_KEY`.

Security gaps:

- The database layer permits broader writes than the application layer.
- Public legacy submission uses service role and a path token; repo evidence does not show token expiry, one-time enforcement, or rate limiting.
- Legacy direct browser reads are only as safe as the live RLS policies on legacy tables, which are not represented in current migrations.
- Password reset, email confirmation UX, MFA, and session management policies are not present in repo evidence.
- No CSRF-specific controls are visible for same-origin API routes. Bearer-token auth limits exposure, but this should be validated.

## 4. Database Inventory

Source of truth found in repo:

- `schema.sql` generated from `supabase/migrations/006_ccm_assistant_initial_schema.sql`.
- `supabase/migrations/001_profiles.sql` through `005_submissions.sql` are empty placeholders.

Core schema counts:

- Enums: 16
- Tables: 18
- Functions: 2
- RLS-enabled tables: 18
- RLS policies: 22
- Indexes: 19

Core tables:

- Practice/account: `practices`, `practice_members`
- Clinical actors: `providers`, `provider_preferences`
- Patient anchor: `patients`, `patient_conditions`, `ccm_enrollments`
- Question bank: `questions`, `question_tags`, `provider_question_preferences`, `patient_question_preferences`
- Outreach/check-ins: `checkin_templates`, `checkin_instances`, `checkin_responses`
- Ledger/evidence: `interaction_logs`, `care_plans`, `monthly_billability`, `audit_events`

Live database status:

- Unknown from repository evidence.
- The docs repeatedly note that the schema has not been validated against a live multi-practice Supabase project.

## 5. Auth Inventory

Files:

- `lib/supabase.ts`
- `lib/auth.ts`
- `lib/practice-context.ts`
- `components/auth/AuthGate.tsx`
- `components/auth/AuthForm.tsx`
- `components/auth/LoginForm.tsx`
- `components/auth/SignupForm.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/setup/practice/page.tsx`
- `app/api/practices/bootstrap/route.ts`
- `app/api/practices/active/route.ts`
- `app/api/practice-members/route.ts`

Public routes:

- `/`
- `/login`
- `/signup`
- `/f/*`

Protected route behavior:

- Unauthenticated users are redirected to `/login?next=<path>`.
- Authenticated users on login/signup are redirected to `/patients`.
- Authenticated users without an active practice are redirected to `/setup/practice`.

Membership behavior:

- Active practice can be requested through `x-active-practice-id`.
- If no active practice is requested, the first active membership is used.
- Practice member management exists but invitations are placeholders only.

## 6. Storage Inventory

Repo evidence:

- No Supabase Storage client usage found.
- No `.storage` API calls found.
- No bucket creation migrations found.
- No storage RLS/policy SQL found.
- No upload/download UI found.

Storage status:

- Not implemented.
- Any future consent document storage, care-plan attachments, audit exports, or PDFs will need bucket design and storage policies.

## 7. RLS Inventory

Detailed RLS policy inventory is in `docs/audit/rls-inventory.md`.

RLS posture:

- Good tenant isolation primitive: active membership by `practice_id`.
- Incomplete least-privilege posture: role-specific authorization is mostly in application code, not database policies.
- Audit immutability is not enforced by RLS.
- Deletes are unintentionally available anywhere a policy uses `for all` unless Supabase grants/revokes or table privileges prevent them separately.

## Recommended Phase 1/2 Remediation Order

No feature work is included here; this is remediation sequencing only.

1. Confirm whether migration `006` is applied in the hosted Supabase project.
2. Replace broad `for all` RLS policies with command-specific policies.
3. Add role-aware RLS checks for membership management and sensitive writes.
4. Make `audit_events` append-only for normal authenticated clients.
5. Inventory or migrate legacy live tables and document their RLS policies.
6. Add multi-practice RLS tests with owner, admin, provider, coordinator, billing staff, and non-member users.
7. Constrain login/signup `next` redirects to local paths.
8. Decide whether page-level protection should move from client gate to server middleware/layout boundaries.
