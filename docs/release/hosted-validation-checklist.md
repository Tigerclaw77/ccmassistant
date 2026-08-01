# Hosted validation checklist

Last verified: 2026-08-01

Environment: hosted CCM Assistant pilot candidate

Supabase project ref: `msrgkmhtzoufhqcykbxi`

Vercel project: `ccmassistant`

Canonical origin: `https://www.ccmassistant.com`

This procedure proves the hosted system against one immutable release SHA. It does not authorize deployment or database changes. Execute the mutating steps only after a separately approved release action, using synthetic users and invented patient data until all PHI approvals are complete.

## Pass rule

A row is **PASS** only when the expected result and the listed evidence exist for the same release SHA and environment. Use **FAIL** for a contradictory result and **NOT VALIDATED** when evidence is missing. Never convert absence of an error into a pass.

## Evidence package

Create a private, access-controlled evidence folder outside the public repository:

```text
pilot-evidence/
  YYYYMMDD-<12-character-sha>/
    00-manifest/
    01-release/
    02-vercel/
    03-supabase-config/
    04-migrations-security/
    05-auth-email/
    06-roles-authorization/
    07-workflows/
    08-backup-operations/
    09-signoff/
```

The manifest must contain:

- Release SHA, branch, repository URL, Vercel deployment ID/URL, Supabase project ref, canonical origin, tester, approver, and UTC start/end timestamps.
- Migration filename, version, name, SHA-256, application timestamp, and operator.
- Every test case ID, result, evidence path, Vercel request ID where available, Supabase log timestamp/correlation, SMTP provider message ID/status, database evidence file, defect ID, and retest result.
- Configuration screenshot index, with values and tokens redacted.
- Explicit statement that all test identities and patients are synthetic.

Do not retain passwords, TOTP seeds/codes, access or refresh tokens, service keys, SMTP credentials, full confirmation/reset/invitation URLs, or PHI. Redact link query values and fragments while preserving host, path, error code, and timestamps.

## Phase 0 — Preconditions

- [ ] Founder has authorized the candidate packaging and hosted-development promotion in a separate action.
- [ ] All testers are named and have access only to the systems needed for their role.
- [ ] Synthetic mailbox aliases exist for owner, administrator, provider, coordinator, front desk, compliance, billing, read-only, expired-link, rejection, and deferral tests.
- [ ] SMTP provider operator can view message IDs, accepted/deferred/rejected/delivered status, bounce, complaint, and suppression events.
- [ ] A maintenance/rollback owner and communication channel are named.
- [ ] Hosted backup or approved recovery point is captured before migration.
- [ ] No real patient or practice data is used before the GO decision and required agreements.

Evidence:

- `00-manifest/test-identities-redacted.csv`
- `00-manifest/test-plan.md`
- `08-backup-operations/pre-migration-recovery-point.png`
- `09-signoff/change-authorization.pdf` or approved-system reference

## Phase 1 — Freeze and prove the release candidate

1. Review `git status --short` and classify every path.
2. Run full-history secret scanning using the organization-approved GitHub scanner.
3. Run the release gates from a clean Node 24 checkout:

```powershell
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
git status --short
```

4. Run fresh local database validation:

```powershell
supabase start
supabase db reset
supabase test db
supabase db lint --local
```

5. Compute the migration manifest:

```powershell
Get-ChildItem supabase\migrations\*.sql |
  Sort-Object Name |
  Get-FileHash -Algorithm SHA256
```

6. After separate approval, commit and push the exact candidate. Record:

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
git ls-remote origin refs/heads/main
```

Expected:

- Node reports `24.x`.
- Every test exits `0`; the known ICD unmapped-row informational warning may remain only if its count and meaning are unchanged.
- Local migration replay applies all 29 migrations and pgTAP reports 93 passing assertions or the explicitly reviewed newer baseline.
- Working tree is clean after the release documentation is included.
- Local SHA equals GitHub `main` SHA.

Evidence:

- `01-release/local-gates.txt`
- `01-release/local-migration-replay.txt`
- `01-release/migration-sha256.txt`
- `01-release/secret-scan-summary.png`
- `01-release/github-main-sha.png`
- `01-release/repository-clean.txt`

Stop if any source, test, or migration changes after the SHA is recorded. Create a new candidate SHA and restart the checklist.

## Phase 2 — Verify hosted configuration before migration

### Vercel

1. Open team `tigerclaw77's projects` → project `ccmassistant`.
2. Capture project framework, root directory, Production Branch, Node version, install/build settings, and domain list.
3. Capture **environment variable names, scopes, and Sensitive labels only**. Never reveal values.
4. Confirm Production contains the four required variables and `NEXT_PUBLIC_CCM_AUDIT_MODE` is absent or `false`.
5. Confirm `NEXT_PUBLIC_APP_URL` was entered as the canonical `www` origin and the Supabase URL belongs to `msrgkmhtzoufhqcykbxi`.
6. Confirm Preview and Development cannot use pilot PHI credentials without explicit approval.

If the Vercel CLI is authenticated and linked, the non-secret audit commands are:

```powershell
vercel env ls production
vercel env ls preview
vercel env run -e production -- npm run env:check
```

Expected:

- Production Branch is `main`, Node is `24.x`, and all required names are present.
- Hosted environment validation reports four required variables without printing values.
- Server secrets are Sensitive.

Evidence:

- `02-vercel/project-settings.png`
- `02-vercel/domain-settings.png`
- `02-vercel/environment-names-redacted.png`
- `02-vercel/hosted-env-check.txt`

### Supabase project and compliance configuration

1. Confirm project name/ref/region/status and API URL.
2. Capture Auth URL Configuration, Email provider, email templates, custom SMTP, password policy, leaked-password protection, TOTP MFA, session policy, rate limits/CAPTCHA, and Auth hooks if any.
3. Capture High Compliance status, BAA/HIPAA add-on evidence, PITR/backup retention, SSL enforcement, network restrictions, and Postgres connection logging.
4. Capture Security Advisor and Performance Advisor before migration.
5. Confirm the current migration ledger ends at `027_task_driven_coordinator_workflow` before applying anything.

Expected:

- Site URL is exactly `https://www.ccmassistant.com`.
- Redirects are limited to the three production flows documented in `pilot-launch-checklist.md`.
- Email confirmation and TOTP MFA are enabled.
- Leaked-password protection is enabled; the current hosted warning must be cleared.
- Custom SMTP is enabled with the approved sender.
- High Compliance requirements are active before PHI.

Evidence:

- `03-supabase-config/project.png`
- `03-supabase-config/auth-url-configuration.png`
- `03-supabase-config/email-provider-confirmation.png`
- `03-supabase-config/email-templates-redacted.pdf`
- `03-supabase-config/custom-smtp-redacted.png`
- `03-supabase-config/password-mfa-session.png`
- `03-supabase-config/rate-limits-captcha.png`
- `03-supabase-config/high-compliance-baa-reference.txt`
- `03-supabase-config/pitr-ssl-network-logging.png`
- `04-migrations-security/pre-migration-advisors.json` or screenshots
- `04-migrations-security/pre-migration-ledger.csv`

Stop if the project ref, canonical origin, backup evidence, or current ledger does not match the manifest.

## Phase 3 — Apply the two pending migrations

The hosted ledger currently ends at `027`. The only expected pending files are, in order:

1. `20260801160641_rc004_durable_opportunity_deferral.sql`
2. `20260801170717_rc005_operational_role_provisioning.sql`

Never reapply, edit, repair, or mark earlier migrations during this release.

After authenticating the Supabase CLI and linking to the exact development project, run:

```powershell
supabase link --project-ref msrgkmhtzoufhqcykbxi
supabase migration list
supabase db push --dry-run
```

Expected dry run: exactly the two files above and no other migration. Review the output and obtain the migration approver's confirmation. Then, and only then:

```powershell
supabase db push
supabase migration list
```

Immediately stop on any SQL error or unexpected migration. Preserve output and do not use `migration repair`, rerun a migration body manually, reset the database, or improvise a workaround.

Expected post-state:

- The ledger has 29 unique rows in order.
- `20260801160641` precedes `20260801170717`.
- Both names and SHA-256 values match the release manifest.
- No previous migration changed.

Evidence:

- `04-migrations-security/migration-list-before.txt`
- `04-migrations-security/db-push-dry-run.txt`
- `04-migrations-security/migration-approval.txt`
- `04-migrations-security/db-push.txt`
- `04-migrations-security/migration-list-after.txt`
- `04-migrations-security/migration-ledger-after.csv`

## Phase 4 — Database and security verification

Run the approved read-only queries from Supabase SQL Editor or an access-controlled operator session. Export results without user email, patient data, tokens, or secrets.

### Migration ledger

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

### RLS inventory

```sql
select n.nspname as schema_name,
       c.relname as relation_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
```

### Exposed grants

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;
```

### Security-definer inventory and search path

```sql
select p.oid::regprocedure::text as function_name,
       p.prosecdef as security_definer,
       p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by function_name;
```

### Canonical role assignments without identifiers

```sql
select role, status, count(*) as assignment_count
from public.practice_member_role_assignments
group by role, status
order by role, status;
```

Then:

- [ ] Run the current database contract/pgTAP suite against a fresh local replay of the same SHA.
- [ ] Run hosted cross-tenant allow/deny checks with separate AAL2 accounts.
- [ ] Verify anonymous denial, authenticated least privilege, service-only opportunity evidence, immutable audit/evidence, canonical role lifecycle, and founder protections.
- [ ] Re-run Supabase Security Advisor and Performance Advisor.
- [ ] Explain every remaining advisor warning by function/table and approved caller; do not blanket-accept a warning class.

Expected:

- All intended public application tables have RLS enabled.
- No anonymous write or unintended function execution is available.
- Security-definer functions use the expected safe search path and narrowly intended execute grants.
- Leaked-password protection warning is absent.
- The role-assignment table/function introduced by RC-005 exists and preserves founder override/legacy compatibility.

Evidence:

- `04-migrations-security/rls-inventory.csv`
- `04-migrations-security/grants.csv`
- `04-migrations-security/security-definers.csv`
- `04-migrations-security/role-assignment-counts.csv`
- `04-migrations-security/tenant-isolation-tests.txt`
- `04-migrations-security/post-migration-security-advisor.json`
- `04-migrations-security/post-migration-performance-advisor.json`
- `04-migrations-security/advisor-dispositions.md`

## Phase 5 — Deploy and verify the exact SHA

1. Allow the normal GitHub integration to deploy `main`; do not manually redeploy a different build.
2. Record the Vercel deployment ID, immutable deployment URL, domains, build start/end, and Git SHA.
3. Confirm deployment state `READY` and build log has no errors.
4. Confirm the following canonical URLs return the expected public/auth shell over HTTPS:

```text
https://www.ccmassistant.com/
https://www.ccmassistant.com/login
https://www.ccmassistant.com/signup
https://www.ccmassistant.com/forgot-password
https://www.ccmassistant.com/reset-password
```

5. Confirm `https://ccmassistant.com/...` redirects once to the equivalent `www` path.
6. Query Vercel runtime errors and runtime logs after test traffic, scoped to the deployment.

Expected:

- Deployed Git SHA equals the frozen candidate SHA.
- Production build is `READY`; no environment or initialization error occurs.
- Canonical routes return `200`; apex returns one intentional permanent redirect.
- Persona Mode route/control is not exposed in Production.

Evidence:

- `02-vercel/deployment-ready.png`
- `02-vercel/deployment-metadata.json` or screenshot
- `02-vercel/build-log.txt`
- `02-vercel/route-statuses.txt`
- `02-vercel/runtime-errors-after-validation.json`
- `02-vercel/runtime-logs-redacted.txt`

Stop if the SHA differs, a required environment variable is missing, or a build/runtime error appears.

## Phase 6 — Authentication and SMTP lifecycle

Use a new synthetic mailbox alias for each case. Record the browser request time before starting, then correlate Vercel, Supabase Auth, and SMTP-provider evidence.

| ID | Test | Expected result | Mandatory evidence |
| --- | --- | --- | --- |
| AUTH-01 | New owner signup | Auth user exists unconfirmed; confirmation requested; provider accepts and delivers; newest link confirms and opens `/login?confirmed=1`; sign-in routes to MFA/onboarding. | Pre/post Auth user status, Auth event, provider message ID/status, received timestamp, redacted destination URL, onboarding screenshot. |
| AUTH-02 | Confirmation resend and old-link use | UI describes a request, not verified delivery; newest link succeeds; old/used link displays recovery and grants no access. | Both message IDs/times, provider statuses, redacted `error_code`, browser result. |
| AUTH-03 | Password reset for existing user | Enumeration-safe request; provider delivery; `/reset-password` opens; password changes; recovery session signs out; new password plus MFA signs in. | Request/response status, Auth/provider logs, message ID, redirect, session result, old/new login outcomes without passwords. |
| AUTH-04 | Reset for nonexistent address | Same safe UI; no account disclosure. | UI screenshot and Auth log outcome. |
| AUTH-05 | Expired/used recovery link | Password remains unchanged; actionable request-new-link path; no protected access. | Error code/path, Auth event, subsequent valid recovery result. |
| AUTH-06 | Staff invitation | Correct pending member/invitation and canonical role; provider delivery; invited account completes MFA; acceptance activates the same member/assignment. | Member/invitation IDs, role row, Auth user ID, message ID/status, audit-event delta. |
| AUTH-07 | Wrong-email invitation | Acceptance denied without changing membership or role. | HTTP status/UI, unchanged database evidence, audit result. |
| AUTH-08 | Expired/reused invitation and resend | Old link cannot activate; administrator resends; newest link succeeds; old link stays unusable. | Both message IDs/times, invitation status history, audit events. |
| AUTH-09 | SMTP rejection | Invalid controlled recipient produces exact provider rejection; application/admin surface does not claim delivery. | Provider response/code/message ID if assigned, Supabase Auth log, UI/API result. |
| AUTH-10 | SMTP deferral | Controlled provider defer is recorded and later resolves or expires according to provider behavior. | Provider event timeline and final status. |
| AUTH-11 | Rate-limit/recovery behavior | Repeated resend/reset is throttled safely and recovers after approved interval. | Supabase rate-limit response/log and user-facing message. |
| AUTH-12 | MFA interruption | Start enrollment, interrupt, then Continue/Restart/Cancel. No duplicate verified factor or bypass; AAL2 required for protected app. | Factor IDs redacted, AAL before/after, screenshots, denied protected request at AAL1. |

For each email, record:

- Supabase Auth event timestamp/correlation and exact non-secret error, if any.
- SMTP provider message ID, accepted/deferred/rejected/delivered outcome, timestamps, and reason code.
- Inbox received timestamp; link click timestamp; final host/path and Auth `error_code` with tokens removed.
- Vercel request ID/status and relevant redacted log line.
- Database before/after state and audit-event count/ID where applicable.

Evidence:

- `05-auth-email/auth-lifecycle-results.csv`
- `05-auth-email/AUTH-01/` through `AUTH-12/`
- `05-auth-email/smtp-domain-spf-dkim-dmarc.png`
- `05-auth-email/provider-rate-limits.png`

Stop if a user is created but email handoff cannot be proven, a provider message lacks a terminal/understood state, a link reaches the wrong origin, or the UI claims success after a reported error.

## Phase 7 — Operational role and authorization validation

Disable Persona Mode and use independent AAL2 synthetic accounts. Invite and activate each canonical role:

- Founder / Organization Owner
- Practice Administrator
- Provider
- Clinical Staff
- Coordinator
- Compliance Administrator
- Billing Administrator
- Front Desk
- Read Only

For each role:

1. Capture Auth user ID, practice member ID, canonical assignment ID/role/status, and activation audit event.
2. Perform at least one intended allowed operation and one prohibited operation.
3. Record UI result, HTTP status, Vercel request ID, database delta, and audit-event delta.
4. Change the role, verify the previous assignment closes and the new assignment becomes active, then restore the intended role.
5. Disable/remove the member, verify access is denied and assignments expire; re-enable only where the procedure calls for it.

Additional required cases:

- [ ] Founder cannot be removed, disabled, or reassigned through normal staff management.
- [ ] Practice Administrator can provision staff but cannot seize founder status.
- [ ] Coordinator claim/scope rules do not expose other-practice or unassigned patients beyond configured policy.
- [ ] Provider can perform provider/clinical work but not staff or billing administration.
- [ ] Compliance can read evidence but cannot make clinical, billing, or staff writes.
- [ ] Billing can perform billing workflow but not clinical or staff writes.
- [ ] Front Desk and Read Only cannot perform clinical writes.
- [ ] Legacy `practice_members.role` stays compatible with the canonical active assignment.
- [ ] Persona Mode is absent in Production and no persona header changes authorization.

Evidence:

- `06-roles-authorization/role-matrix.csv`
- `06-roles-authorization/assignment-lifecycle.csv`
- `06-roles-authorization/founder-protection.txt`
- `06-roles-authorization/cross-practice-isolation.txt`
- `06-roles-authorization/persona-production-denial.txt`
- `06-roles-authorization/audit-deltas.csv`

## Phase 8 — Synthetic pilot workflow

Using the approved role accounts and one synthetic practice:

- [ ] New owner confirms email, configures MFA, creates practice, selects provider-owner or administrator-only path, and reaches an operational first-provider state without database intervention.
- [ ] Administrator-only owner adds/invites the first provider before onboarding completes.
- [ ] First patient creation has an active PRP, Medicare-aware empty DOB calendar behavior, eligibility, consent, and no empty prerequisite list.
- [ ] Coordinator sees the correctly scoped My Work Today queue and complete workload counts.
- [ ] Opportunity detector creates immutable evidence and expected suggestion without automatic clinical time.
- [ ] Coordinator accepts a suggestion, performs work in-task, documents outcome/actual affirmed time, routes if needed, completes, and returns to My Work Today/next patient.
- [ ] Durable deferral records a follow-up commitment and reappears when due.
- [ ] Provider sees the routed item/review and cannot access another practice.
- [ ] Compliance can investigate the expected read-only evidence available in pilot scope.
- [ ] Billing review creates and preserves immutable monthly evidence without enabling live Stripe.
- [ ] Patient secure check-in link opens, expires, regenerates, and cannot expose practice data.
- [ ] If patient email is enabled, Resend message ID and provider outcome are retained; if disabled, the pilot plan explicitly uses the secure-link workflow.
- [ ] Complete one synthetic CCM month without manual SQL or developer intervention.

Evidence:

- `07-workflows/workflow-results.csv`
- `07-workflows/onboarding/`
- `07-workflows/first-patient/`
- `07-workflows/coordinator-provider/`
- `07-workflows/compliance-billing/`
- `07-workflows/public-checkin/`
- `07-workflows/monthly-evidence/`

## Phase 9 — Operations, recovery, and signoff

- [ ] Restore the preapproved recovery point into an isolated non-production Supabase project with restricted access.
- [ ] Compare schema/migration ledger and approved aggregate counts; sample immutable audit/evidence integrity with synthetic records only.
- [ ] Record restore duration against approved RTO and recoverable point against RPO.
- [ ] Securely remove the isolated copy under the approved retention procedure.
- [ ] Run password-reset, MFA-loss, offboarding, suspected-account-compromise, tenant-isolation incident, SMTP outage, and deployment rollback table-top exercises.
- [ ] Confirm monitoring owners can access Vercel runtime/build logs, Supabase Auth/API/Postgres logs, SMTP provider events, DNS, and status pages.
- [ ] Confirm support and incident contacts, pilot hours, escalation threshold, and stop-work criteria.
- [ ] Review all defects; no open P0/P1 or unexplained security/configuration failure remains.
- [ ] Founder, security/compliance owner, and pilot-practice approver complete the GO/NO-GO record.

Evidence:

- `08-backup-operations/restore-drill.md`
- `08-backup-operations/aggregate-comparison.csv`
- `08-backup-operations/tabletop-results.md`
- `08-backup-operations/monitoring-access.png`
- `09-signoff/open-defects.csv`
- `09-signoff/pilot-go-no-go.pdf` or approved-system record

## Exact stop conditions

Return **NO-GO** immediately for any of the following:

- Candidate SHA, GitHub SHA, and Vercel SHA differ.
- Unexpected or failed migration, migration history divergence, or manual database repair.
- Missing required environment value, exposed service/SMTP secret, or Persona Mode enabled in Production.
- Missing custom SMTP/provider evidence or any unclassified confirmation/invitation/recovery failure.
- Leaked-password protection remains disabled.
- A role receives unintended access, tenant isolation fails, or founder protection fails.
- Immutable audit/evidence can be changed or service-only detector evidence can be written by a normal user.
- Backup/restore cannot meet the approved recovery objective.
- Required BAA/vendor/practice/PHI authorization is missing.
- Open P0/P1 defect or unexplained Vercel/Supabase/security warning affects the pilot path.

When a stop condition occurs, preserve evidence, restrict new data entry, classify the exact failing layer, correct it through a new reviewed candidate where software/schema changes are required, and rerun every affected phase.
