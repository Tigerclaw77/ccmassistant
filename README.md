# CCM Assistant

CCM Assistant is a Next.js and Supabase application for controlled chronic care management operations. The repository contains the application, database migrations, deterministic clinical-content artifacts, regression suites, and launch runbooks.

## Local setup

Requirements:

- Node.js 22 or newer
- npm
- A non-production Supabase project

Copy `.env.example` to `.env.local`, supply non-production credentials, then run:

```powershell
npm.cmd install
npm.cmd run env:check
npm.cmd run dev
```

`NEXT_PUBLIC_APP_URL` should be `http://localhost:3000` only for local development. Never copy production PHI into a local environment.

## Release gates

Run these before any hosted release:

```powershell
npm.cmd audit --omit=dev
npm.cmd run lint
npm.cmd run build
npm.cmd run test:hosted-readiness
npm.cmd run test:launch
```

The full deterministic and regression command list is maintained in `package.json`. Passing repository tests does not prove hosted Supabase configuration, migration application, email delivery, backups, or restore readiness.

## Hosted operations

- `docs/operations/hosted-production-readiness.md`: readiness decision, risks, and founder actions
- `docs/operations/production-runbook.md`: deployment, rollback, backup, restore, auth recovery, onboarding, and offboarding
- `docs/operations/two-month-smoke-test.md`: synthetic hosted acceptance test
- `docs/operations/pilot-practice-checklist.md`: controlled pilot checklist
- `docs/audit/migrations.md`: static migration inventory and validation plan
- `docs/release/release-candidate-001.md`: consolidated release-candidate scope, validation, exclusions, and commit plan

Hosted development/staging has been validated through migration `023`, including MFA, first-practice bootstrap, complete historical June and July 2026 CCM workflows, two immutable evidence snapshots, tenant and role isolation, and Stripe test-mode Checkout/Portal/webhooks. The validated candidate is ready for a staging pilot after its GitHub checkpoint and Vercel staging configuration are complete. Production deployment, live Stripe, PHI use, backup/restore evidence, and production operational approval remain separate controlled release decisions.
