# Local Development Setup

This guide prepares a clean CCM Assistant checkout for development on Windows, macOS, or Linux. Use synthetic data and non-production services only.

## Required Software

- Git with Git LFS enabled.
- Node.js `24.x`, matching `package.json` and the validated Vercel runtime. The current validated workstation uses Node `24.11.1`.
- npm `11.x`; npm `11.6.2` was used for this handoff.
- A non-production Supabase project and the Supabase CLI when applying or inspecting migrations.
- Stripe CLI when testing signed webhooks locally.

After cloning, initialize LFS and install the lockfile exactly:

```powershell
git lfs install
git lfs pull
npm.cmd ci
```

On macOS or Linux, use `npm` in place of `npm.cmd`.

## Environment

Copy `.env.example` to `.env.local`. Never commit `.env.local`, production credentials, PHI, or webhook payloads.

Required for the application:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Non-production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local development |

Optional or feature-specific:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional intake generation; deterministic fallback remains available |
| `STRIPE_SECRET_KEY` | Stripe sandbox secret key; local validation rejects live keys |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the active local forwarder or sandbox endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe sandbox publishable key |
| `STRIPE_PATIENT_PRICE_ID` | Existing patient-management sandbox Price |
| `STRIPE_PLATFORM_PRICE_ID` | Optional; leave empty while no platform fee is configured |
| `RESEND_API_KEY` | Optional email delivery for invitations and patient check-ins |
| `PATIENT_EMAIL_FROM` | Verified Resend sender; use a non-production sender locally |
| `STAFF_INVITATION_TTL_MINUTES` | Invitation lifetime; defaults to 60 minutes |
| `NEXT_PUBLIC_CCM_AUDIT_MODE` | Optional local navigation audit aid; effective only in development |

Validate the local file without displaying secret values:

```powershell
npm.cmd run env:check:local
```

`npm run env:check` is the stricter hosted-environment check and intentionally rejects localhost URLs.

## Supabase

Use a dedicated development project. The repository migrations are ordered and must not be renamed, skipped, or edited after application. Migration `024_pilot_readiness_sprint_1.sql` is required for staff invitations, provider review history, and check-in delivery records.

Inspect before applying anything:

```powershell
supabase login
supabase link --project-ref YOUR_NON_PRODUCTION_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

Do not point local development at a production database. See `docs/audit/migrations.md` and `docs/operations/production-runbook.md` for the controlled migration process.

## Stripe Sandbox

Use only the existing CCM Assistant sandbox Product and recurring Price. Do not rerun catalog setup unless a separate catalog change is approved.

For local webhook delivery:

```powershell
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Place the temporary `whsec_...` value printed by that command in `STRIPE_WEBHOOK_SECRET` for the current session, then restart the app. Keep `sk_live_` and `pk_live_` credentials out of local development; `npm run env:check:local` rejects them.

## Resend

Resend is optional for local UI and workflow development. To exercise delivery, use a sandbox/test domain or a verified non-production sender and set `RESEND_API_KEY` plus `PATIENT_EMAIL_FROM`. Delivery content must remain generic and contain no patient or clinical data.

Without Resend configuration, secure links can still be created for controlled local testing, but email delivery is unavailable.

## Run Locally

```powershell
npm.cmd run env:check:local
npm.cmd run dev
```

Open `http://localhost:3000`. Authentication, MFA, AAL2, practice authorization, and RLS remain active locally. When explicitly needed for UX review, set `NEXT_PUBLIC_CCM_AUDIT_MODE=true`; it previews navigation only and never changes server authorization.

## Production Build Locally

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

`npm run start` serves the already-built application locally. It is not a deployment command and does not modify Vercel or Supabase.

## Regression Checks

Run the complete deterministic suite with:

```powershell
npm.cmd test
```

The runner stops on the first failure and includes authorization, billing, clinical artifact, workflow, Sprint 1, and generated-artifact checks. Run `npm audit --omit=dev` separately when preparing a release.

## Change Map

- Public pages live under `app/page.tsx`, `app/demo`, and `app/request-demo` with shared public components in `components/public`.
- Role dashboards live under `app/dashboard`; shared operational UI belongs in `components` rather than another dashboard copy.
- Practice staff management is isolated in `components/settings/StaffManagement.tsx`, while `app/settings/page.tsx` still owns several unrelated settings panels.
- Care-plan and check-in pages remain workflow-dense and should be changed with their API routes and contract tests in view.
- Shared workflow rules belong in `lib/ccm`; routes should retain the canonical authorization helpers in `lib/auth`.

The settings, care-plan, and check-in pages are the most tightly coupled UI surfaces. They were intentionally not split during this handoff because component extraction would enlarge the release without changing behavior.

## Troubleshooting

**Node engine mismatch**

Install Node 24.x and reinstall dependencies. Confirm with `node --version` and `npm --version`.

**Git LFS pointer or missing ICD data**

Run `git lfs install` and `git lfs pull`, then verify `data/icd/icd-classifications.json` is not a small pointer file.

**Environment validation fails**

Check names against `.env.example`. The validator reports variable names only and never prints secret values. Restart Next.js after changing `.env.local`.

**Supabase authorization or missing-table errors**

Confirm the project reference, compare `supabase migration list` with `supabase/migrations`, and ensure migrations through 024 are applied to the non-production project.

**Stripe webhooks return 400**

Restart `stripe listen`, replace the local `STRIPE_WEBHOOK_SECRET` with its new signing secret, and restart Next.js. Do not reuse a Dashboard endpoint secret for CLI forwarding.

**Deterministic artifact checks differ on Windows**

Confirm `.gitattributes` is present and reclone or run `git restore` only on artifact files that have no intentional edits. The repository pins text files to LF so byte checks behave consistently across machines.
