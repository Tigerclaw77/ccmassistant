# Release Candidate 001

Prepared: 2026-07-16

## Decision

RC-001 is a consolidation candidate for continued hosted staging validation. It is not a production deployment, PHI authorization, live Stripe release, clinical approval, or completed two-month pilot.

## Scope

This candidate consolidates the accumulated CCM Assistant implementation through Supabase migration `023`:

- TOTP MFA, AAL2 enforcement, first-practice bootstrap, and canonical practice authorization.
- Practice, provider, coordinator, patient, eligibility, consent, enrollment, and care-plan workflows.
- ICD-10 import/classification, deterministic question banks, question sessions, scoped customization, favorites, custom questions, and contribution metadata.
- Clinician-review packets and deterministic feedback-import support.
- Check-ins, documented non-response, interaction time, billability, immutable evidence, review, billed state, and month rollover.
- Stripe test-mode customer, Checkout, subscription, signed webhook, idempotency, quantity synchronization, and Billing Portal foundations.
- Staff Experience Sprint workflows for coordinators, providers, billers, and management.
- Hosted runbooks, release gates, regression tests, and deterministic artifact validation.

No new feature, workflow, UI redesign, clinical content, question-bank content, or commercial pricing decision is introduced by the consolidation itself.

## Worktree inventory

The pre-exclusion inventory contained 334 modified or untracked physical paths. RC documentation, the ignore-policy correction, and three dev-server logs written during the audit produce 339 currently classified paths. Every path is covered by the following disjoint rules:

| Category | Count | Classification rule | Disposition |
| --- | ---: | --- | --- |
| Launch-critical implementation | 169 | `app/**` (41), `components/**` (11), `lib/**` (69), non-clinical `scripts/**` (29), migrations `009`-`022` (14), `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, and `tsconfig.json` (5) | Review and commit as implementation/configuration. |
| Clinical content and source artifacts | 33 | `data/icd/**`, `data/question-banks/**` (32), and `scripts/clinical-content-config.mjs` | Review provenance and commit deliberately; do not edit during consolidation. |
| Documentation | 23 | `README.md`, `docs/**` excluding generated review packets | Review and commit; RC-001 is the current release authority. |
| Deterministic generated artifacts | 92 | `data/clinical-review/**` (7), `docs/clinical/review-packets/**` (82), and `next-env.d.ts` (1), plus local `outputs/**` (2) | Commit the deterministic review artifacts and `next-env.d.ts`; exclude local exports in `outputs/**`. |
| Temporary/debug artifacts | 22 | Root `*.log` files (13) and `supabase/.temp/**` (9) | Exclude; do not commit. |
| Dead or obsolete changed files | 0 | No changed/untracked path was proven dead solely by repository evidence | Do not delete speculative candidates. |

The physical counts retain ignored paths for audit traceability. After `.gitignore` takes effect, temporary logs, Supabase CLI state, and local exports no longer appear in ordinary Git status.

## Generated-artifact policy

Commit these deterministic artifacts because tests and review workflows depend on them:

- `data/clinical-review/**`
- `docs/clinical/review-packets/**`
- `next-env.d.ts`
- Runtime ICD and question-bank data under `data/icd/**` and `data/question-banks/**`

Exclude these machine-local artifacts:

- `*.log`
- `supabase/.temp/**`
- `outputs/**`
- `.env.local` and other secret-bearing local environment files

`data/icd/icd-classifications.json` is approximately 87.57 MiB and is tracked with Git LFS because it is a direct runtime/test dependency. The remaining `data/**` artifacts stay in ordinary Git. Vercel Git LFS support must be enabled after project import and before the final staging deployment so the build receives the artifact rather than an unresolved pointer.

## Migration record

| Range | State | Notes |
| --- | --- | --- |
| `001`-`005` | Empty legacy placeholders | Preserve for ledger continuity. |
| `006`-`008` | Existing tracked migrations | Base schema, immutable evidence, and clinical knowledge base. |
| `009`-`015` | Forward feature migrations | Vertical slices, intake, condition manager, hardening, sessions, coordinator efficiency, and customization. |
| `016`-`020` | Forward hosted security/authorization migrations | AAL2 and tenant hardening, advisor fixes, bootstrap, access resolution, and least-privilege grants. |
| `021` | Forward Stripe billing foundation | Practice-scoped Stripe state and idempotent webhook persistence. |
| `022` | Forward occurrence-date correction | Canonical calendar-date/request-id support for hosted interaction logging. |
| `023` | Forward customization grant correction | Least-privilege authenticated grants for question-bank customization tables while preserving RLS and immutable history. |

Versions are unique and numerically ordered. Hosted development/staging was verified through `023`. Applied migration files must remain immutable; any correction must be a new reviewed forward migration. Production application and constraint-validation evidence remain open.

## Environment contract

Required core hosted variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional AI variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Optional test-mode Stripe variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PLATFORM_PRICE_ID`
- `STRIPE_PATIENT_PRICE_ID`

`.env.example` contains names and placeholders only. Stripe remains test-mode only. Never commit `.env.local`, service-role keys, Stripe secrets, webhook secrets, patient data, or sanitized evidence that still contains identifiers.

## Hosted validation

The dedicated historical staged synthetic exercise completed the full two-month workflow without changing the pre-existing staging practice. Month 1, June 2026, passed practice/provider/coordinator/patient setup, eligibility, consent, intake, care plan, customization, check-in, time logging, billability, evidence, review, and billed state. Month 2, July 2026, passed rollover, a second check-in and question session, persistent customization, independent time logging and billability, a second evidence snapshot, review, and billed state.

Stripe sandbox validation passed test-mode Checkout, customer and subscription persistence, signed webhook processing, replay idempotency, cancellation/reactivation, correct Portal ownership, and server-derived active-patient quantity.

Both evidence snapshots are distinct and immutable. June remained byte-stable after July, monthly totals remained independent, role and cross-practice restrictions held, Stripe isolation was unchanged, and future-date rejection remained enforced. Hosted staging readiness is 100% for the defined synthetic workflow.

## Clinical and deterministic assets

The current baseline contains 81 canonical conditions, 301 content groups, 14 question-bank catalog files, 81 clinician review packets, and 89 review files. The ICD import contains 98,186 rows. Its audit retains an expected 77/100 confidence score and 4,583 `PASS` records that are intentionally unmapped.

Clinical artifacts are review candidates, not a claim of universal clinical approval. No clinical content is modified by this consolidation sprint.

## Validation gates

Run from a clean dependency installation against the candidate contents:

```powershell
npm.cmd audit --omit=dev
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Run every registered `test:*` script and the deterministic checks `question-banks:check`, `clinical-review:check`, `icd:check`, `icd:validate`, and `icd:audit:check`. Record exact results in the consolidation report before approval.

The current candidate passed 21 registered regression scripts with 169 `node:test` cases plus the launch guard, all deterministic artifact checks, lint, TypeScript, dependency audit, and the production build. These gates are reconfirmed against the six-commit candidate before push.

## Commit plan

Do not stage or commit until the worktree review is complete. Recommended logical commits:

1. `feat: consolidate CCM application and authorization foundations`
2. `feat: add reviewed ICD question-bank and customization assets`
3. `feat: add clinician review package and deterministic import tooling`
4. `feat: add sandbox Stripe billing foundation`
5. `test: consolidate regression and hosted readiness coverage`
6. `docs: add hosted operations and RC-001 release record`

Before each commit, stage only its named paths, inspect `git diff --cached`, verify no secret or machine-local file is included, and rerun the relevant tests. Because migrations `009`-`022` are already applied in staging, they must be included without editing their applied contents.

## Manual-review queue

- Confirm the Git LFS object uploads with the RC-001 push and enable Vercel Git LFS support after project import.
- Confirm provenance/licensing and intended source-control treatment for CMS source archives and generated ICD artifacts.
- Review old planning/status documents as historical records: `docs/PROJECT_STATUS.md`, `docs/IMPLEMENTATION_BACKLOG.md`, `docs/ccm-assistant-roadmap.md`, phase documents, prototype-debt notes, and earlier audits. Archive them later if desired; do not treat them as current readiness authority.
- Complete SMTP, edge limits, backup/restore, production migration evidence, vendor/compliance approval, and founder sign-off.
- Make production pricing and Stripe live-mode decisions in a separate approved release.

## Readiness

Repository RC readiness: **100/100 for RC-001 staging consolidation**, subject to the final clean-tree verification, Git LFS upload, and remote SHA check defined above.

Hosted staging readiness: **100/100 for the defined synthetic two-month workflow**. RC-001 is ready for a staging pilot after the verified GitHub checkpoint and Vercel staging configuration are complete. Controlled production, PHI use, production deployment, and Stripe live mode remain **NO-GO** until the separate operational, compliance, clinical-review, recovery, and founder approval gates are closed.
