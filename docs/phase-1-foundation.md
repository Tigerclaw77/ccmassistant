# Phase 1 Foundation

Phase 1 makes CCM Assistant structurally ready for real development without expanding beyond the monthly CCM ledger.

## What Is Now Server-Owned

These mutations now have API route ownership:

- `POST /api/patients` creates patients.
- `PATCH /api/patients` updates patients.
- `POST /api/enroll` creates CCM enrollment records.
- `PATCH /api/enroll` updates CCM enrollment records.
- `POST /api/interaction-logs` creates time ledger entries.
- `POST /api/care-plans` creates care plans.
- `PATCH /api/care-plans` updates care plans.
- `PATCH /api/check-ins/status` updates check-in instance status.
- `POST /api/submit/[token]` owns legacy public form submission writes.

The new authenticated routes require:

- `Authorization: Bearer <supabase access token>`.
- `practiceId` in the request body or query.
- Active membership in that practice.
- An allowed role for the action.

The public legacy submission route requires:

- A valid token in the URL.
- `SUPABASE_SERVICE_ROLE_KEY` configured server-side.

## What Still Writes From Client

No `insert`, `update`, `delete`, or `upsert` calls remain in app/components client code.

Remaining client-side Supabase use is read-oriented prototype code:

- `app/patients/page.tsx` still reads legacy `patients` and `baskets`.
- `app/dashboard/worklist/page.tsx` still reads legacy `patients`, `assignments`, and `interactions`.
- `app/dashboard/billing/page.tsx` still reads legacy `patients`, `interactions`, and `submissions`.
- `app/f/[token]/page.tsx` still reads legacy `assignments` and `baskets`.

These reads should move behind server loaders or API routes when the legacy model is migrated.

## RLS Assumptions

The draft schema assumes:

- Every operational table has `practice_id`.
- Users access rows only through active `practice_members` records.
- RLS is enabled on all practice-scoped tables.
- `is_practice_member(practice_id)` is the core policy primitive.
- Server-side route handlers pass the user's Supabase access token through to Supabase so RLS still applies.
- Public token submission is a special case and uses a service-role route until the new check-in token model is fully implemented.

## Role Rules

Current helper groups:

- `PATIENT_WRITE_ROLES`: owner, admin, provider, coordinator.
- `BILLING_WRITE_ROLES`: owner, admin, billing_staff.
- `PRACTICE_ADMIN_ROLES`: owner, admin.

These are intentionally simple. Refine them only when workflows require it.

## Supabase Configuration Needed Before Production

- Apply and validate the `006_ccm_assistant_initial_schema.sql` migration in a real Supabase project.
- Configure `NEXT_PUBLIC_SUPABASE_URL`.
- Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Configure `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- Confirm RLS policies with at least two practices and multiple roles.
- Add a secure practice bootstrap flow that creates the first practice and owner membership through a trusted server path.
- Decide how legacy tables map to the new schema before loading real patient data.

## Migration Validation Notes

This pass refined:

- Enum coverage for the ledger-first model.
- `practice_id` multi-tenancy on operational tables.
- UUID primary keys and timestamps.
- `created_by` / `updated_by` on mutable tables.
- Partial unique index for one active enrollment per patient.
- RLS enablement on all new tables.
- Membership-based RLS policies.
- Safer `question_tags` policies that authorize through the linked question.
- Execution grant for `is_practice_member`.

The SQL has not been applied to a live Supabase instance in this pass.

