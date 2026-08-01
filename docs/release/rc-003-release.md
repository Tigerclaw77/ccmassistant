# RC-003 Development Release

Released: July 21, 2026

## Release status

RC-003 is released to the hosted CCM Assistant development environment.

- GitHub SHA: `f334825b813adbc7220335161be7f9b7f1999803`
- Branch: `main`
- Supabase development project: `msrgkmhtzoufhqcykbxi` (`CCM Assistant`)
- Supabase organization: `ribpskojnhvegmhuhdei`
- Vercel deployment: `dpl_2yBCggbb9Q1WCWSXLFyvdLUrorrW`
- Deployment source: Git integration from `origin/main`
- Deployment state: `READY`

## Release commits

1. `7bf343d` — `feat(db): add RC-003 role and care-workflow schema`
2. `498b4e7` — `feat: complete RC-003 onboarding and care coordination`
3. `a7d50c1` — `feat(dev): add development persona mode`
4. `dc814ac` — `test: add RC-003 regression and local database validation`
5. `f334825` — `docs: add RC-003 founder review package`

GitHub `origin/main` was verified at the full release SHA after push.

## Migration status

The hosted development migration ledger was verified through `026` before promotion. Only `027_task_driven_coordinator_workflow.sql` was applied. Migrations `001` through `026` were not replayed or changed.

The hosted ledger now ends at:

```text
027  task_driven_coordinator_workflow
```

Migration `027` created the deterministic opportunity, evidence, disposition, work-item, routing, and immutable event model; normalized the forward grant and tenant-integrity hardening; fixed security-definer search paths and execution privileges; enforced provider lifecycle rules; and validated all staged public constraints.

## Hosted validation

- Hosted project reported `ACTIVE_HEALTHY` on Postgres 17.
- Migration ledger contains `001` through `027` in order.
- All eight RC-003 workflow tables exist.
- RLS is enabled on every RC-003 workflow table.
- Workflow tables have the expected tenant policies.
- Anonymous workflow table grants are absent.
- Authenticated grants are operation-specific and remain behind RLS.
- Opportunity and evidence insertion is service-role-only.
- All public constraints are validated; unvalidated count is zero.
- Trigger-only security-definer functions have no direct execution grant.
- Authenticated RPC functions remain limited to their documented AAL2, identity, and patient-scope contracts.
- Server-only opportunity storage is security-invoker and executable only by `service_role`.
- Deployed protected APIs reject anonymous access.
- Application regression passed all 33 commands after hosted migration, including authorization, onboarding, provider bootstrap, first patient, coordinator queue, opportunity detector, provider review, and compliance contracts.
- The only regression warning is the existing intentional catalog state: 4,583 ICD `PASS` records remain unmapped by design.

Supabase advisors continue to report intentional authenticated security-definer RPCs and a service-only table with RLS but no user policy. They also report that leaked-password protection is disabled. The intentional RPCs are documented and enforce AAL2 plus caller scope. Leaked-password protection remains a hosted Auth configuration item before external pilot onboarding.

## Vercel deployment

GitHub triggered the normal deployment. No manual redeployment or promotion command was used.

- Project: `ccmassistant`
- Framework: Next.js
- Node runtime: `24.x`
- Deployment target configured for `main`: `production`
- Build result: successful
- Static routes generated: 64
- Deployment state: `READY`
- Deployed Git SHA matches GitHub and local SHA.
- Canonical `https://www.ccmassistant.com` startup check returned HTTP 200.
- Provider, compliance, and coordinator worklist routes rendered successfully.
- Vercel grouped runtime-error scan found no errors after validation traffic.

The Vercel deployment target is named `production` by Vercel because it is connected to `main`; this release applied database changes only to the hosted CCM Assistant development Supabase project. No production database was accessed or modified.

## Developer infrastructure

RC-003 includes the permanent local Supabase environment, Docker/WSL2 workflow, fresh migration replay, database lint, four pgTAP contract files, and the single-command regression runner. Local validation before promotion passed migrations `001–027`, database lint, 66 pgTAP assertions, TypeScript, ESLint, production build, and the complete application regression suite.

## Persona mode

Development Persona Mode remains gated by both `NODE_ENV=development` and `NEXT_PUBLIC_CCM_AUDIT_MODE=true`. It changes only the browser-session authorization view layered over the authenticated developer. It does not change database memberships, real roles, audit history, or RLS. Production runtime ignores a fabricated persona header and does not expose the persona hub.

## Known limitations

- Department administration has an architectural placeholder but no management UI.
- Patient access is modeled separately; the pilot patient path remains secure-link check-ins rather than a full patient portal.
- Alternate clinical-report recipient selection is deferred; coordinator routing defaults to the patient's Primary Responsible Provider.
- Production communication and EHR vendors are not selected.
- Auth invitation, password-reset, and confirmation-email inbox delivery still require a controlled hosted end-to-end test before external users are invited.
- Supabase leaked-password protection is currently disabled and should be enabled before external pilot onboarding.
- Persona Mode is a developer review tool, not a replacement for independent-user authorization testing.

## Deferred work

- Department CRUD and delegation UI
- General-purpose custom permissions
- Dedicated patient portal
- Alternate-provider routing workflow
- EHR integration
- Production notification and secure-message vendor selection
- Automatic time, billing, or CPT decisions
- Remaining cognitive-load improvements documented in founder review notes

## Pilot readiness

RC-003 is ready for founder testing in the hosted development environment. External pilot onboarding remains contingent on the documented hosted Auth email tests, leaked-password protection decision, and one complete synthetic CCM month using separate real-role test accounts.

