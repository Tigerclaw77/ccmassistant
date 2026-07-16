# Hosted Production Readiness Assessment

Assessment date: 2026-07-16

## Decision

**READY FOR STAGING PILOT AFTER DEPLOYMENT CONFIGURATION**

The application has passed the complete historical June and July 2026 synthetic workflow, including AAL2 authentication, first-practice bootstrap, tenant authorization, CCM workflow execution, independent monthly totals, two immutable billing evidence snapshots, and Stripe test-mode billing. Hosted synthetic validation is complete. It is not approved for production, PHI, public deployment, or Stripe live mode; external production operational controls remain open.

## Readiness score

Hosted synthetic validation: **100/100**

Broader production-control assessment: **90/100**

| Area | Score | Evidence |
| --- | ---: | --- |
| Application release gates | 25/25 | Audit, lint, TypeScript, build, registered regressions, and deterministic checks have passing baselines; rerun results belong in the release record. |
| Database and migration design | 20/20 | Forward migrations through `023` are ordered and applied in hosted development/staging; production application and constraint evidence remain open. |
| Security configuration | 16/20 | AAL2, tenant isolation, bootstrap authorization, signed Stripe webhooks, and public-token controls passed staging; production SMTP, session policy, and edge limits remain open. |
| Operations | 14/20 | Deployment, rollback, backup/restore, onboarding, offboarding, reset, and MFA recovery procedures exist; production restore and recovery drills remain open. |
| Hosted pilot evidence | 15/15 | Historical June and July workflows passed with independent totals, distinct immutable evidence, role enforcement, and cross-practice isolation. |

The score measures demonstrated evidence, not production authorization.

## Repository verification baseline

| Gate | Most recent result |
| --- | --- |
| `npm audit --omit=dev` | Pass, 0 vulnerabilities |
| `npm run lint` | Pass |
| TypeScript | Pass |
| `npm run build` | Pass, 47 generated pages/routes |
| Registered regression scripts | Pass, 21 scripts with 169 `node:test` cases plus the launch guard |
| Hosted readiness and launch suites | Pass |
| Question-bank catalog | Pass, 14 files |
| Clinical review package | Pass, 81 packets and 89 review files |
| ICD import and validation | Pass, 98,186 rows, 81 canonical conditions, and 301 groups |
| ICD audit | Pass with expected 77/100 confidence; 4,583 `PASS` records remain unmapped by design |

These results must be refreshed against the final release candidate. Repository checks do not prove hosted provider configuration or production recovery.

## Hosted evidence

Hosted development/staging has verified migrations through `023` and passed:

- TOTP enrollment under React Strict Mode, AAL2 enforcement, login, and first-practice bootstrap.
- Owner membership, practice resolution, provider, coordinator, patient, eligibility, consent, and active enrollment.
- Intake, care plan, question session, customization resolution, check-in, documented non-response, and time logging.
- Historical June 2026 billability, immutable evidence, review, billed state, and month rollover.
- Historical July 2026 check-in, question session, persistent customization, independent time and billability, second immutable evidence, review, and billed state.
- Stripe test-mode Checkout, customer/subscription persistence, signed webhook handling, replay idempotency, cancellation/reactivation, and Billing Portal access.

The June snapshot remained byte-stable after July activity and denied update/delete attempts. June retained 25 minutes, July retained 35 minutes, future occurrence dates remained rejected, and the dedicated validation practice created no Stripe object.

## Remaining blockers

| Blocker | Required evidence |
| --- | --- |
| Production Auth and email | Exact URLs, custom SMTP, password/session policy, confirmation, reset, and MFA recovery pass in production configuration. |
| Backup and restore | Selected retention/PITR controls and an isolated restore drill meet approved recovery objectives. |
| Public endpoint protection | Hosting edge/WAF limits are configured and tested for public check-in routes; the unused legacy submit route is denied. |
| Production migration evidence | Production ledger shows `006` through `023` once and in order; all intended constraints are validated. |
| Compliance and vendor approval | Required agreements, risk analysis, incident/retention procedures, and permission to process PHI are recorded. |
| Live commercial billing | Final prices, Stripe live catalog, production webhook, portal policy, and founder approval are completed in a separate release. |

## Environment contract

Core hosted variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL`. AI variables are optional and retain a deterministic reviewed fallback. Stripe variables are optional for the core app and currently restricted to test mode; see `.env.example` and the production runbook.

No secret value belongs in Git, browser-visible configuration, logs, audit metadata, or release evidence. `.env.local`, Supabase CLI state, logs, and local exports remain excluded.

## Release boundaries

- No PHI until all external controls and approvals are complete.
- No public deployment from this consolidation sprint.
- No Stripe live-mode configuration or production pricing approval.
- No editing applied migration files; use a reviewed forward migration.
- Historical synthetic validation is not authorization to process PHI or operate production services.

## Next action

Preserve and push the verified RC-001 commit sequence, import the repository into a Vercel staging project with Git LFS enabled, configure non-production environment values, and repeat the deployment smoke checks against the exact staging URL. Production remains a separate founder-approved release decision.
