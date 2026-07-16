# CCM Assistant Hosted Production Runbook

## Scope and release record

This runbook covers a controlled hosted pilot. Repository review confirms migrations `006` through `023` exist. Complete a release record with the commit SHA, deployment URL, Supabase project reference, migration ledger, operator, date, test evidence, backup tier, and rollback owner.

## Environment configuration

| Variable | Required | Exposure | Missing or invalid behavior |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser/server | Supabase clients cannot initialize; `env:check` fails. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser/server | Browser authentication and RLS requests fail; `env:check` fails. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | Bootstrap, public check-in, and controlled billability routes fail; `env:check` fails. |
| `NEXT_PUBLIC_APP_URL` | Yes | Browser build | Canonical email redirects and public links are unsafe; hosted release gate fails. |
| `OPENAI_API_KEY` | No | Server only | Reviewed deterministic fallback remains available. |
| `OPENAI_MODEL` | No | Server | Defaults to `gpt-4o-mini` where AI intake is enabled. |
| `STRIPE_SECRET_KEY` | Sandbox billing only | Server only | Checkout, Portal, and Stripe API operations are unavailable. Must be a test-mode key until a separate live-billing approval. |
| `STRIPE_WEBHOOK_SECRET` | Sandbox billing only | Server only | Signed webhook processing is unavailable. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sandbox billing only | Browser/server | Reserved for test-mode browser integration. |
| `STRIPE_PLATFORM_PRICE_ID` | No | Server only | No platform-fee item is created when omitted. |
| `STRIPE_PATIENT_PRICE_ID` | Sandbox Checkout | Server only | Patient-management subscription Checkout is unavailable when omitted. |

Use separate development, staging, and production Supabase projects. Set required values in the hosting provider secret store. `NEXT_PUBLIC_APP_URL` must be the exact HTTPS production origin with no path. Never expose or log the service-role key. Run `npm run env:check` in the release environment before build.

The app has no Supabase Storage dependency and no scheduled/cron worker. Production SMTP, Site URL, redirect allowlists, password policy, session policy, backup tier, and WAF/rate-limit rules are hosted-provider configuration rather than application environment variables. Stripe configuration documented here is test-mode only; live credentials, live catalog objects, and production billing activation require a separate approval and release record.

## Deployment

1. Confirm the intended commit and cleanly record all local differences. Do not deploy an unreviewed dirty worktree.
2. Create isolated staging and production Supabase projects. Confirm executed vendor agreements and the practice's compliance approval before PHI.
3. Configure exact Supabase Auth Site URL and allow only the required production redirects: `/patients` and `/reset-password`.
4. Configure custom production SMTP. Test confirmation and password-reset delivery; do not rely on the default Supabase SMTP service.
5. Configure at least a 12-character password minimum, email confirmation, TOTP MFA, JWT/session limits, and abuse protections.
6. Configure hosting HTTPS, HTTP-to-HTTPS redirect, secret values, logging redaction, and edge/WAF rate limits for `/api/check-ins/public/*`. Deny the unused legacy `/api/submit/*` route at the edge for the CCM pilot.
7. Run the migration procedure below against staging, then production. Record output.
8. Run audit, environment validation, lint, build, all regression suites, and deterministic artifact checks against the release commit.
9. Deploy staging and complete the two-month synthetic smoke test without developer intervention.
10. Obtain written go/no-go approval before deploying production or entering PHI.

## Migration procedure

Install the Supabase CLI in the controlled release environment, authenticate, and explicitly link the selected project. Then run:

```powershell
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

Migrations must appear once and in order from `006` through `023`. Files `001` through `005` are empty legacy placeholders. Never edit an applied migration or manually rerun a migration body; use the migration ledger and a new forward migration. Migration `021` adds the Stripe billing persistence foundation, migration `022` adds canonical occurrence-date and request-id support used by hosted workflow validation, and migration `023` adds least-privilege customization-table grants behind existing RLS.

Migration `016` adds expiring public tokens, cross-practice referential checks, and AAL2 enforcement. Several constraints in `012` and `016` are deliberately `NOT VALID` to avoid blocking an upgrade with legacy rows. Find them after deployment:

```sql
select n.nspname as schema_name,
       c.relname as table_name,
       con.conname,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not con.convalidated
order by c.relname, con.conname;
```

For each result, first query for violating rows. Resolve only through an approved data-correction record, then run `alter table ... validate constraint ...`. A clean installation should validate every listed constraint before pilot onboarding. Verify `pg_trgm` is available for migration `014`.

## Deployment verification

- Confirm `/login`, `/signup`, `/forgot-password`, and `/reset-password` use the production origin.
- Confirm login cannot reach practice data until TOTP reaches AAL2.
- Confirm owner, coordinator, clinician, and billing role boundaries.
- Confirm a public check-in link expires after 14 days, is invalid after submission/closure, and returns `Cache-Control: no-store`.
- Confirm the unused legacy `/api/submit/*` endpoint is denied by hosted edge policy.
- Confirm application and audit logs contain no public token, bearer token, secret, or synthetic clinical answer.
- Confirm cross-practice IDs are rejected by API and database constraints.
- Confirm authenticated and public API failures return generic messages without backend details.

## Backup and restore

Before PHI, record the selected Supabase backup tier, retention window, encryption, restore method, and responsible operator. Repository code cannot verify hosted backups. If Point-in-Time Recovery is required by the practice recovery objective, enable and test it separately.

Restore drill:

1. Record a recovery point and source project reference.
2. Restore into an isolated non-production project with restricted access.
3. Apply later migrations, if any, using the normal ledger.
4. Configure temporary secrets and deploy the matching known-good application build.
5. Compare practice, membership, patient, enrollment, interaction, audit, and immutable evidence counts.
6. Verify one completed month, one public-token lifecycle, and one immutable evidence snapshot.
7. Record recovery point objective, recovery time, discrepancies, operator, and approval.
8. Securely remove the isolated copy under the approved retention policy.

## Rollback

Application rollback uses the hosting provider's previous known-good deployment. Confirm its environment configuration before promotion because a rollback may retain build-time values from the old deployment. Do not destructively reverse an applied database migration.

If a migration fails: stop the release, restrict writes, preserve logs, take a backup if possible, assess partial statements, and ship an independently reviewed forward corrective migration. If data integrity or tenant isolation is uncertain, keep the service unavailable until verified.

## First practice onboarding

1. Obtain practice approval, agreements, billing owner, security contact, and pilot roster.
2. Create the owner Auth account through the approved Supabase admin path and verify email delivery.
3. Have the owner enroll TOTP and bootstrap the practice once.
4. Add providers and memberships with minimum necessary roles. The current staff invitation record does not deliver or accept Auth invitations; provision each pilot staff Auth account manually and link the exact user ID to the invited membership.
5. Require every staff member to confirm email, enroll TOTP, sign out, and complete a fresh MFA login.
6. Run role-boundary tests and create only synthetic records until the checklist is signed.
7. Record training, access approval, first live date, escalation contact, and rollback decision owner.

## Offboarding

Immediately set the practice membership to `inactive`, revoke or ban the Supabase Auth user, and revoke active sessions. Rotate any shared external credentials, transfer assigned work, preserve required audit/evidence records, and record requester, approver, operator, timestamps, and verification. Never delete audit history to offboard a user.

## Password reset

The user starts at `/forgot-password` and completes at `/reset-password`. Support staff may verify account status and email delivery but must never request a password or TOTP code. For suspected compromise, revoke sessions after reset and review access/audit events. Record identity-verification method without storing identity documents or secrets.

## MFA recovery

There are no application recovery codes. After practice-approved identity verification, an authorized Supabase administrator must inspect and unenroll the lost TOTP factor, revoke sessions, and require immediate re-enrollment on next access. Record requester, approver, admin operator, factor ID suffix, timestamps, and outcome. Never disable the AAL2 database policy as a recovery shortcut.

## Incident contacts and stop conditions

Keep a current founder, practice security, hosting, Supabase, SMTP, and legal/compliance contact list outside the repository. Stop the pilot for suspected cross-practice access, PHI leakage, unverifiable evidence, failed restore, uncontrolled privileged access, unavailable MFA recovery, or migration divergence.
