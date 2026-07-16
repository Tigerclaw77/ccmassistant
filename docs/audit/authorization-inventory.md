# Authorization Inventory

## Canonical current-user authorization

- `lib/auth.ts#getCurrentUser` verifies the bearer token and requires AAL2.
- `lib/practice-authorization.ts#resolvePracticeAuthorization` is the only application caller of `resolve_practice_access`.
- `lib/practice-authorization.ts#requirePracticeAuthorization` resolves the requested practice and enforces the allowed role set.
- `lib/auth.ts#requirePracticeMembership` is the compatibility entry point used by protected API routes.
- `lib/practice-context.ts` uses the same resolver for startup, active-practice lookup, and first-use routing.

The authorization RPC returns only the current user's active membership, role, active practice, and state. A requested practice belonging to another user returns `403`. An empty system returns `bootstrap`.

## Role boundaries

- Owner/admin: practice settings, provider management, and staff membership management.
- Owner/admin/provider/coordinator: patient, enrollment, condition, intake, care-plan, check-in, question-session, and interaction writes.
- Owner/admin/billing staff: billing review and billing-status writes.
- All active members: practice-scoped reads permitted by table RLS.

## Protected routes using the canonical entry point

- Patients: `patients`, `patient-conditions`, `enroll`, and `patient-intake`.
- Care delivery: `care-plans`, `check-ins`, `check-ins/status`, `question-sessions`, and `interaction-logs`.
- Operations: `worklist`, `providers`, `practice-members`, and `practices/active`.
- Billing and evidence: `billability/recalculate`, `billability/recalculate/batch`, `billing/month`, `billing/next-unreviewed`, and `audit-packet`.

## Direct membership data consumers

These are business-data operations after canonical authorization, not authorization lookups:

- `app/api/practice-members/route.ts` lists, creates, and updates staff rows. Owner/admin checks occur first; RLS remains active.
- `app/api/worklist/route.ts` reads a limited active staff projection for coordinator labels. Membership is established first; RLS remains active.

No other application module queries `practice_members` directly.

## Direct practice data consumers

- `app/api/practices/active/route.ts` updates the authorized active practice after an owner/admin check.
- Public check-in display reads only the practice name and billing contact context through the server-only client.
- Other routes receive practice identity from the canonical authorization result.

## Database privilege boundary

Migration `020` grants only operations exercised by current routes and already protected by RLS. It contains no schema-wide grants, no `ALL TABLES`, and no anonymous access. Service-role grants are limited to public check-in handling and the billability upsert that explicitly require server-only access.
