# RC1 production deployment runbook

This runbook promotes an approved, immutable CCM Assistant RC1 candidate. It does not authorize a deployment. Use non-PHI test identities until the final external-pilot approval.

## Roles and change record

Before the window, record:

- candidate SHA and signed tag;
- change-window start/end in UTC;
- release operator, database operator, independent reviewer, rollback owner, and incident lead;
- Supabase project ref and Vercel project ID;
- pre-change recovery point and evidence folder;
- approved maintenance message and decision authority.

No operator should approve their own database and application evidence.

## Production environment

Configure values through Vercel Project Settings. Never paste values into tickets, screenshots, logs, shell history, or documentation. Environment changes apply only to new deployments, so deploy after any change.

| Variable | Scope | Secret | Required | Production rule |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | No | Yes | Exact `https://<production-project-ref>.supabase.co` origin; no path or trailing slash. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | No | Yes | Publishable/legacy anon key for the same production project. It must never have service-role power. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, server only | **Yes** | Yes | Mark Sensitive. Never expose through `NEXT_PUBLIC_*`, browser bundles, logs, or Preview. Rotate on suspected exposure. |
| `NEXT_PUBLIC_APP_URL` | Production | No | Yes | `https://www.ccmassistant.com` with no path or trailing slash. |
| `STAFF_INVITATION_TTL_MINUTES` | Production | No | Optional | Omit for the documented 60-minute default or set the approved integer. |
| `RESEND_API_KEY` | Production, server only | **Yes** | Optional | Set only if patient email delivery is approved and covered operationally. This is separate from Supabase Auth SMTP. |
| `PATIENT_EMAIL_FROM` | Production | No | Conditional | Required with Resend; use a verified, approved sender. |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Production, server only | **Yes/No** | No | Omit for RC1. Deterministic fallback remains available and avoids an unnecessary external dependency. |
| Stripe variables | Production, server only except publishable key | Mixed | No | Omit for the first pilot. Never place live keys without separate billing release approval. |
| `NEXT_PUBLIC_CCM_AUDIT_MODE` | Production | No | No | Must be absent or `false`. Production code also rejects the overlay, but configuration must not request it. |

`NODE_ENV` is set by Vercel. Use Node `24.x`, matching `package.json`. Preview must use a non-production Supabase project and must never receive the production service-role key.

Run the repository environment validator in a protected release shell and retain only PASS/FAIL output:

```powershell
npm run env:check
```

## Supabase production configuration

### Database migration order

First compare the production ledger with the repository. Do not reapply a version already recorded and do not repair history by editing an applied migration.

The complete repository order is:

1. `001_profiles.sql` through `027_task_driven_coordinator_workflow.sql`, in numeric order, including zero-byte historical placeholders `001`–`005`.
2. `20260801160641_rc004_durable_opportunity_deferral.sql`.
3. `20260801170717_rc005_operational_role_provisioning.sql`.
4. `20260801193000_version_1_0_practice_member_service_grant.sql`.

Repository evidence last indicated the shared environment ended at `027`. Treat that as historical evidence, not current truth. If the production ledger differs from the expected prefix, stop and reconcile before applying anything.

Pre-migration gates:

1. capture the exact ledger, database version, adviser findings, table counts, function/grant snapshot, and UTC timestamp;
2. create and verify the documented recovery point;
3. replay all migrations on an empty local stack from the tagged SHA;
4. test the pending suffix against a production-schema clone or approved isolated restore;
5. verify every migration hash against the signed release manifest;
6. confirm application deployment rollback remains schema-compatible.

Apply only the missing contiguous suffix using the approved Supabase migration workflow. Stop on the first error. Never mark a failed migration as applied without database-owner and security review.

Post-migration evidence:

- ledger contains each version exactly once and ends at `20260801193000`;
- RLS is enabled on tenant/PHI tables and expected policies exist;
- anonymous, authenticated, service-role, and function grants match contract tests;
- SECURITY DEFINER functions have fixed safe `search_path` values and only intended execute grants;
- immutable audit/evidence objects reject update/delete as designed;
- tenant, role, provider ownership, opportunity deferral, and membership service-grant tests pass;
- Supabase database/security advisers have no unexplained release blocker.

### Authentication

Configure and capture redacted evidence for:

- Site URL: `https://www.ccmassistant.com`;
- email confirmation enabled;
- TOTP MFA enabled and enforced by application onboarding;
- minimum password length of at least 12 characters;
- leaked-password protection enabled where supported;
- approved session lifetime, refresh-token reuse interval, rate limits, and CAPTCHA policy;
- approved confirmation, invitation, recovery, and email-change templates;
- no token, OTP, or PHI in retained evidence.

Allow only the production paths used by the application:

- `https://www.ccmassistant.com/login`
- `https://www.ccmassistant.com/reset-password`
- `https://www.ccmassistant.com/accept-invitation`

Do not use a broad production wildcard. Confirm `https://ccmassistant.com` permanently redirects to the canonical `www` origin.

### Custom SMTP

Supabase's default email service is not acceptable for the external pilot. Configure custom SMTP in Supabase Auth with:

- an approved provider and sender mailbox;
- verified SPF, DKIM, and DMARC records;
- credentials stored only in Supabase;
- a provider agreement/BAA or documented legal determination appropriate to the content;
- rate and bounce monitoring, a named operator, and an escalation channel.

Validate owner confirmation, resend, staff invitation, password reset, expired/used link, invalid recipient, and provider defer/reject behavior. For every test retain the Supabase Auth correlation, provider message ID, provider final status, UTC timestamps, redacted final URL, and database/user outcome. A UI statement that a request was accepted is not proof of delivery.

### Storage

RC1 does not require Supabase Storage. Before deployment, record the bucket list and confirm no unexpected bucket or public object exists. If this changes later, it requires a separate storage security and recovery review.

## Vercel deployment

1. Confirm the approved tag resolves to the reviewed SHA and the working tree is clean.
2. Confirm GitHub `main`, the local SHA, and the release record match.
3. Review Vercel Production variable names/scopes without exposing values; verify Preview cannot reach production data.
4. Allow the normal GitHub integration to build the exact SHA. Do not manually rebuild an older commit.
5. Confirm build success, Node 24, deployment ID, source SHA, alias assignment, HTTPS, and canonical-domain redirect.
6. Send representative non-PHI traffic through sign-in, confirmation, reset, invitation, onboarding, patient, coordinator, provider, compliance, and billing paths.
7. Review Vercel function/build logs for errors and verify Persona Mode routes/context are unavailable.
8. Record the deployment ID, URL, SHA, UTC time, operator, and log-query links.

Do not invite an external user or enter PHI merely because the deployment is `READY`; all launch gates must pass.

## Deployment verification

Against independent, non-founder test accounts:

1. create and confirm an owner account;
2. complete MFA, practice setup, provider bootstrap, and first synthetic patient;
3. invite and activate one administrator, provider, and coordinator;
4. perform one allowed and one denied action for each operational role;
5. enroll a synthetic patient, use a starter kit, execute coordinator work, log actual time, route provider review, approve, review compliance, and produce billing-ready evidence;
6. test withdrawal without deleting the patient or evidence;
7. confirm audit events, immutable snapshots, tenant isolation, and no service key/browser leakage;
8. validate all Auth lifecycle rows with SMTP evidence;
9. review Supabase/Vercel logs and advisers after traffic;
10. record PASS/FAIL against the same tag, SHA, deployment, and migration level.

## Rollback

### Application failure

1. Stop pilot activity and announce maintenance.
2. Preserve logs, request IDs, UTC timestamps, and the failing deployment ID.
3. If the previous application is compatible with the now-forward database schema, use Vercel Instant Rollback or promote the last approved deployment.
4. Verify its historical build-time environment is still valid; Vercel rollback also restores the old deployment's environment snapshot.
5. Run health, Auth, authorization, and representative workflow checks before reopening.
6. Undo rollback mode or promote a corrected deployment only through a new change record.

### Migration failure

1. Stop immediately; do not rerun blindly and do not edit the applied file.
2. Preserve database/error logs and determine whether the migration transaction rolled back completely.
3. If no durable change occurred, correct only through the normal reviewed forward-release process.
4. If data/schema changed, keep the application in maintenance and use the recovery runbook. Prefer a reviewed forward repair when safe; destructive down-migrations are not the default.
5. Restore only when the incident lead accepts the resulting RPO/data-loss boundary.

Application rollback is not database rollback. Never point an old build at an incompatible schema and never restore production over the current project without an isolated verification first.

## Official references

- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)

