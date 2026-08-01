# Pilot launch checklist

Last verified: 2026-08-01

Target: first hosted external pilot

Canonical application origin: `https://www.ccmassistant.com`

Hosted Supabase project: `CCM Assistant` (`msrgkmhtzoufhqcykbxi`, `us-east-1`)

This checklist is the RC-005 launch control document. A checked item requires retained evidence; a successful local test or an unverified dashboard assumption is not a pass.

## Current release state

| Item | Status | Verified state |
| --- | --- | --- |
| Repository software | **PASS locally** | RC-005 recorded TypeScript, ESLint, production build, 35-command regression, all 29 local migrations, 93 pgTAP assertions, database lint, and `git diff --check` as passing. |
| Candidate identity | **BLOCKED** | Branch `main` is at `42cdaf8aafbcaed9e023e98ba4d89b13aacf28ba`, but RC-004/RC-005 implementation, tests, migrations, and documents are uncommitted. |
| Vercel | **PARTIAL** | Project `ccmassistant` is healthy on Node `24.x`. Deployment `dpl_DVY8UPFJAYVZeq43YxgkiKff1xzh` is `READY`, but it serves SHA `42cdaf8`, not a frozen RC-005 SHA. |
| Supabase | **PARTIAL** | Project is `ACTIVE_HEALTHY`; the hosted ledger contains 27 migrations and ends at `027_task_driven_coordinator_workflow`. The two RC-004/RC-005 migrations are not hosted. |
| Hosted authentication | **NOT VALIDATED** | No Auth log events were available for the previous 24 hours. Site URL, redirect allow list, templates, password policy, MFA/session settings, and custom SMTP require dashboard evidence. |
| External-pilot approval | **NO-GO** | Custom SMTP delivery, hosted lifecycle testing, compliance agreements, backup/restore evidence, and exact release deployment remain open. |

## Required launch documents

### Repository-controlled documents

| Document | Status | Launch use |
| --- | --- | --- |
| `docs/release/rc-005-pilot-gate.md` | **Current, uncommitted** | Software scope, role model, validation baseline, and remaining external gates. |
| `docs/operations/hosted-auth-validation.md` | **Current, uncommitted** | Authentication lifecycle test matrix and failure classification. |
| `docs/release/pilot-launch-checklist.md` | **Current** | Configuration, dependency, document, and founder-action control list. |
| `docs/release/hosted-validation-checklist.md` | **Current** | Exact hosted validation and evidence procedure. |
| `docs/release/pilot-go-no-go.md` | **Current** | Hard release gates and approval record. |
| `docs/operations/production-runbook.md` | **Reference only** | Rollback, offboarding, recovery, and incident procedures remain useful, but its migration range stops at `023` and its Auth redirect list predates invitations. This checklist supersedes those release-specific sections. |
| `docs/operations/pilot-practice-checklist.md` | **Usable, not executed** | Practice onboarding and first-two-month operational controls. Store completed evidence outside Git. |
| `docs/operations/two-month-smoke-test.md` | **Reference template** | Historical evidence stops at migration `023`; rerun the affected synthetic workflow against the frozen pilot SHA and current migration ledger. |
| `docs/operations/hosted-production-readiness.md` | **Historical** | Do not use its `READY` statement as current approval; it covers only migrations through `023`. |
| `docs/release/pilot-checklist.md` | **Historical RC-003** | Do not use its hosted status; current status is controlled here. |

### Founder, practice, security, and legal records

These records may live in an approved private system rather than the public repository. The release evidence manifest must identify the owner, approval date, version, and storage location.

- [ ] Signed pilot participation agreement and approved pilot scope, including whether real PHI is permitted.
- [ ] Supabase BAA and HIPAA add-on evidence; the project is marked High Compliance before PHI.
- [ ] Vercel BAA/equivalent account evidence appropriate to the selected plan before PHI.
- [ ] Approved agreement and vendor review for every SMTP or email provider that will receive patient or workforce identifiers.
- [ ] Security risk analysis and data-flow/vendor inventory.
- [ ] Data retention, deletion, legal-hold, and pilot-exit policy.
- [ ] Incident response and breach-notification procedure with named contacts.
- [ ] Access provisioning, access review, offboarding, MFA-loss, and password-recovery procedure.
- [ ] Backup retention and restore procedure with recovery objectives and completed isolated restore evidence.
- [ ] Practice training and support/escalation roster.
- [ ] Privacy notice, terms, patient communication language, and consent language approved by counsel/practice where applicable.
- [ ] Written founder and pilot-practice GO approval recorded in `pilot-go-no-go.md` or the linked private approval system.

This is an operational inventory, not legal advice. Counsel and the pilot practice must decide which agreements and notices apply.

## Hosted dependency inventory

| Dependency | Required for pilot | Current verification | Gate |
| --- | --- | --- | --- |
| GitHub repository | Yes | Vercel is Git-connected to `Tigerclaw77/ccmassistant`; latest hosted SHA is `42cdaf8`. Repository visibility is public. | Freeze, review, commit, and push the intended RC-005 candidate; run secret scanning before push. |
| Vercel project | Yes | `prj_fnaokoHqCinVay6Mx1O0I2dOLR6l`, Next.js, Node `24.x`, latest deployment `READY`. Canonical `www` routes return `200`; apex redirects `308` to `www`. | Deploy the frozen RC-005 SHA and retain build/deployment evidence. |
| Supabase project | Yes | `msrgkmhtzoufhqcykbxi`, `ACTIVE_HEALTHY`, PostgreSQL 17.6, API `https://msrgkmhtzoufhqcykbxi.supabase.co`. One active legacy anon key and one active modern publishable key were observed; values were not displayed. | Apply only the two pending migrations after approval, then validate schema/security. |
| Custom SMTP for Supabase Auth | Yes | Not inspectable with the available read-only project API; no recent Auth log evidence. | Configure and prove confirmation, invitation, and recovery delivery. Supabase default SMTP is not acceptable for external users. |
| DNS/domain | Yes | `www.ccmassistant.com` serves the application over HTTPS; `ccmassistant.com` redirects to `www`. | Use `https://www.ccmassistant.com` everywhere as the single canonical origin. |
| Resend patient email | Conditional | No local optional email variables are configured; hosted state is unknown. | Required only if the in-app patient email delivery action is in pilot scope. Otherwise use the secure-link workflow and do not claim email delivery. |
| Stripe | No for core pilot | Repository permits test-mode Stripe only; hosted state is unknown. | Leave disabled unless sandbox billing-provider testing is explicitly approved. Never add live keys in this release. |
| OpenAI | No | Deterministic fallback is implemented; hosted state is unknown. | Prefer disabled for the first pilot unless vendor/privacy approval and the intended model/data policy are recorded. |
| Supabase Storage, Edge Functions, cron | No current runtime dependency | Repository documentation states none are required. | No launch configuration. |

## Environment and secret contract

All Vercel values must be checked by **name, target environment, sensitivity, and non-empty status**. Do not put values in screenshots, logs, tickets, or this repository. Vercel environment changes affect only new deployments, so redeploy after any change.

### Required for application startup and core workflows

| Variable | Vercel scope | Secret | Required value/validation |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production build and runtime | No | Exactly `https://msrgkmhtzoufhqcykbxi.supabase.co`; HTTPS origin only, no path/query/fragment. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production build and runtime | Public credential | Active key for the same project. A modern publishable key may be used under this existing variable name; never use a secret/service key here. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production runtime | **Yes; mark Sensitive** | Service-role key for the same project, different from the public key, server-only. Rotate immediately if ever exposed. |
| `NEXT_PUBLIC_APP_URL` | Production build and runtime | No | Exactly `https://www.ccmassistant.com`; no trailing path/query/fragment. Do not use the apex domain because it redirects. |

The local `.env.local` has all four core names, points at the expected Supabase project, uses distinct recognized public/service credentials, and intentionally uses `http://localhost:3000` for the app origin. That validates local setup only, not Vercel.

### Required only when the named capability is enabled

| Capability | Variables/secrets | Decision for first pilot |
| --- | --- | --- |
| Patient check-in email via Resend | `RESEND_API_KEY` (Sensitive), `PATIENT_EMAIL_FROM` | Required together if coordinators will send email from the app. Verify sender domain, provider logs, idempotency, rejection, and message IDs. |
| Stripe sandbox | `STRIPE_SECRET_KEY` (Sensitive, `sk_test_`), `STRIPE_WEBHOOK_SECRET` (Sensitive), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_`), and one or both of `STRIPE_PLATFORM_PRICE_ID` and `STRIPE_PATIENT_PRICE_ID` | Optional; live keys are rejected by code and forbidden for this pilot release. Webhook URL is listed below. |
| OpenAI-assisted intake | `OPENAI_API_KEY` (Sensitive), optional `OPENAI_MODEL` | Optional; deterministic fallback remains available. Enable only after vendor/data-use approval. |

### Optional operational values

| Variable | Default/constraint |
| --- | --- |
| `STAFF_INVITATION_TTL_MINUTES` | Defaults to `60`; if set, use an approved positive testable value and record it. |
| `NEXT_PUBLIC_CCM_AUDIT_MODE` | Must be absent or `false` in Production. Persona Mode also requires `NODE_ENV=development`, but production evidence must show this public flag is not enabled. |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` only when `OPENAI_API_KEY` is enabled. |

The Stripe catalog script additionally accepts `STRIPE_PATIENT_AMOUNT_CENTS`, `STRIPE_PLATFORM_AMOUNT_CENTS`, `STRIPE_CURRENCY`, and `STRIPE_CATALOG_VERSION`. These are one-time sandbox catalog inputs, not application runtime requirements.

### Secrets stored outside Vercel

- Supabase custom SMTP host, port, username, password, sender email, and sender name belong in Supabase Auth settings.
- SMTP DNS/provider credentials belong in the provider and DNS control planes.
- Supabase/Vercel/GitHub administrator credentials and recovery codes belong in an approved password manager.
- BAA, restore, and release evidence locations must be access-controlled and must not contain raw tokens, OTPs, magic links, or PHI.

Tracked-file review found only `.env.example` under Git. Pattern hits were limited to documented placeholders/local development credentials, environment-variable references, and test fixtures; no production secret value was identified. Run the organization-approved GitHub secret scanner against full history before the RC-005 push.

## URL and callback contract

### Canonical URLs generated by the application

| Purpose | Exact application URL | Supabase allow-list action |
| --- | --- | --- |
| Signup confirmation/resend | `https://www.ccmassistant.com/login?confirmed=1` | Add exact URL. |
| Password recovery | `https://www.ccmassistant.com/reset-password` | Add exact URL. |
| Staff invitation | `https://www.ccmassistant.com/accept-invitation?invitation=<generated-id>` | Allow only the canonical host and this path. Because the query value is generated, use the narrow pattern `https://www.ccmassistant.com/accept-invitation**` if the dashboard cannot match the path independent of its query. Do not use a cross-host wildcard. |
| Public patient check-in | `https://www.ccmassistant.com/f/<token>` | Not a Supabase Auth redirect. Confirm the generated origin and token lifecycle. |
| Stripe Checkout success (conditional) | `https://www.ccmassistant.com/settings?billing=success&session_id={CHECKOUT_SESSION_ID}` | Stripe redirect only. |
| Stripe Checkout cancel (conditional) | `https://www.ccmassistant.com/settings?billing=cancelled` | Stripe redirect only. |
| Stripe webhook (conditional) | `https://www.ccmassistant.com/api/stripe/webhook` | Register in Stripe test mode and retain signing-secret evidence. |

Set the Supabase Auth **Site URL** exactly to `https://www.ccmassistant.com`. Do not add broad entries such as `https://**` or a production wildcard covering other Vercel projects. Preview deployments must not be permitted to use pilot authentication unless a dedicated, stable preview origin and non-PHI Supabase environment are explicitly approved.

## Supabase configuration checklist

- [x] Correct hosted project identified and healthy: `msrgkmhtzoufhqcykbxi`, `us-east-1`.
- [x] Project API origin identified and active publishable credentials exist.
- [ ] Hosted migration ledger includes `001` through `027`, then `20260801160641` and `20260801170717`, once each and in order. It currently ends at `027`.
- [ ] Repository migration SHA-256 manifest is attached to the release evidence before application.
- [ ] Post-migration database contract, RLS, grants, function/search-path, trigger, and tenant-isolation tests pass.
- [ ] Security Advisor is captured after migration. Current warnings include leaked-password protection disabled plus intentionally authenticated `SECURITY DEFINER` RPCs; every remaining warning needs a documented disposition.
- [ ] Performance Advisor is reviewed. Current hosted output contains 257 notices (193 unindexed foreign keys, 4 Auth RLS init-plan warnings, 60 unused indexes); assign explicit accept/fix dispositions based on pilot load rather than silently ignoring them.
- [ ] Email/password provider enabled and email confirmation required.
- [ ] Site URL and redirect allow list match the canonical contract above.
- [ ] Confirmation, invitation, recovery, and email-change templates use `{{ .ConfirmationURL }}` or an explicitly implemented token-hash flow and do not expose secrets.
- [ ] Custom SMTP enabled with approved sender. Default Supabase SMTP is not used for the pilot.
- [ ] SPF and DKIM pass; DMARC policy and monitoring are recorded.
- [ ] Auth email rate limits support the test/pilot volume. New custom SMTP configurations begin with a low default rate limit; do not raise it beyond expected need.
- [ ] Password minimum is at least 12 characters and leaked-password protection is enabled. The latter is currently a verified warning.
- [ ] TOTP MFA is enabled and the approved session maximum, inactivity timeout, refresh-token reuse interval, and recovery procedure are recorded.
- [ ] CAPTCHA/bot and Auth rate-limit settings are reviewed for signup, login, resend, reset, and token verification.
- [ ] Anonymous key has only intended RLS access; service-role key remains server-only.
- [ ] Supabase BAA/HIPAA add-on is active and project is High Compliance before PHI.
- [ ] High Compliance requirements are evidenced: PITR, SSL enforcement, network restrictions, and Postgres connection logging.
- [ ] Backup retention and an isolated restore drill meet approved RPO/RTO.
- [ ] Auth, Postgres, API, and security logs are retained/access-controlled for the approved period without secrets or unnecessary PHI.

## Vercel configuration checklist

- [x] Correct project identified: `ccmassistant` (`prj_fnaokoHqCinVay6Mx1O0I2dOLR6l`).
- [x] Framework is Next.js and runtime is Node `24.x`, matching `package.json`.
- [x] `www.ccmassistant.com` serves HTTPS `200`; apex redirects to `www` with `308`.
- [x] Current deployment and build are `READY`; no runtime error clusters were reported for the previous seven days. This does not replace test traffic.
- [ ] Production branch is confirmed as `main` in project settings and branch protection/review requirements are recorded.
- [ ] Root directory, install command, build command, output settings, and Node version are captured.
- [ ] All four required environment names are present in Production; their project association and canonical origins are validated without exposing values.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `OPENAI_API_KEY` are Sensitive whenever present.
- [ ] Preview/Development variables cannot reach the pilot PHI environment unless explicitly approved. No pilot secret is shared team-wide without need.
- [ ] A new deployment is created after any environment change; deployed Git SHA equals the frozen RC-005 SHA.
- [ ] Custom-domain/TLS screenshots and DNS ownership are retained; only `www` is used in email links.
- [ ] Deployment protection, team MFA/RBAC, audit-log access, log retention/redaction, firewall/rate limits, and incident contacts are approved.
- [ ] Vercel BAA/account eligibility evidence is retained before PHI.
- [ ] Rollback candidate and rollback owner are recorded. A rollback never reverses a forward database migration without an independently reviewed recovery plan.

## SMTP and email requirements

Supabase Auth custom SMTP is mandatory because the default service refuses non-team recipients, is currently limited to two messages per hour, and has no delivery SLA. After custom SMTP is enabled, Supabase initially applies a low default sending limit (currently 30 messages per hour) until deliberately adjusted.

- [ ] Approved provider and account owner selected.
- [ ] Provider agreement/BAA or documented determination is complete before identifiers are transmitted.
- [ ] Dedicated sender domain/subdomain, sender address, display name, reply handling, and support contact approved.
- [ ] SMTP host, port, transport security, username, and password configured only in Supabase Auth.
- [ ] SPF and DKIM verification pass; DMARC is published and monitored.
- [ ] Bounce, complaint, suppression, and deferral dashboards are accessible to the named operator.
- [ ] Confirmation, invitation, recovery, expiry/reuse, resend, rejection, and defer cases pass using non-PHI accounts.
- [ ] For each message, retain Supabase Auth log correlation, provider message ID, final provider status, recipient timestamp, link timestamp, and redacted final URL.
- [ ] Templates contain no PHI and use the intended canonical `www` origin.
- [ ] If Resend patient delivery is enabled, repeat domain/provider/BAA, message-ID, bounce, complaint, and rejection validation separately; Supabase SMTP evidence does not validate Resend.

## Founder actions in order

1. Approve the exact RC-005 file inventory and authorize a commit/push in a separate release action.
2. Run full-history secret scanning, commit the intended candidate, push `main`, and record the immutable SHA.
3. Complete or locate the required private legal, vendor, risk, incident, retention, support, and practice approvals.
4. Configure the four Vercel Production variables; mark all server credentials Sensitive; keep Persona Mode disabled.
5. Configure Supabase Auth Site URL, narrow redirects, email confirmation, templates, password/leaked-password policy, TOTP/session policy, rate limits, and custom SMTP.
6. Confirm Supabase/Vercel/email-provider agreements and High Compliance configuration before PHI.
7. Back up hosted development, dry-run and apply only the two pending migrations in order, then run database/security validation.
8. Allow GitHub to deploy the frozen SHA; verify build, domains, environment, and SHA.
9. Execute `hosted-validation-checklist.md` using only synthetic accounts/data and retain the complete evidence package.
10. Complete the isolated restore drill and operational support/incident tabletop.
11. Review `pilot-go-no-go.md`; founder and pilot-practice approvers sign only when every hard gate is PASS.

## Authoritative platform references

- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase HIPAA projects](https://supabase.com/docs/guides/platform/hipaa-projects)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel environment management](https://vercel.com/docs/environment-variables/manage-across-environments)
- [Vercel sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel HIPAA guidance](https://vercel.com/kb/guide/hipaa-compliance-guide-vercel)
