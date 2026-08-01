# Pilot GO / NO-GO

Assessment date: 2026-08-01

Decision: **NO-GO — hosted release evidence is incomplete**

There is no known remaining application P0 in the RC-005 working tree. The first external pilot is still blocked because that software is not an immutable hosted candidate and the required authentication, email, compliance, and recovery controls have not been proven.

## Decision rule

The pilot is **GO** only when every Hard Gate row is **PASS** against the same immutable SHA. `PARTIAL`, `UNKNOWN`, `NOT VALIDATED`, an old release result, or an ownerless exception is a **NO-GO**.

## Hard gates

| Gate | Current status | Pass evidence required | Owner/signoff |
| --- | --- | --- | --- |
| RC-005 candidate frozen | **FAIL** | Clean working tree, reviewed file inventory, full-history secret scan, immutable commit SHA, and GitHub `main` at the same SHA. | Founder + release operator |
| Local release validation | **PASS, recorded** | RC-005 record: TypeScript, ESLint, build, 35-command regression, 29-migration replay, 93 pgTAP assertions, DB lint, and diff check. Rerun from the frozen SHA. | Engineering |
| Hosted schema current | **FAIL** | Hosted ledger shows all 29 migrations once and in order. It currently stops at `027`; `20260801160641` and `20260801170717` are pending. | Database operator + reviewer |
| Hosted database security | **NOT VALIDATED for RC-005** | Post-migration RLS, grants, function/search-path, tenant isolation, immutable evidence, canonical role, and advisor results. | Engineering + security |
| Vercel candidate deployment | **FAIL** | `READY` deployment whose Git SHA equals frozen RC-005 SHA. Current deployment `dpl_DVY8UPFJAYVZeq43YxgkiKff1xzh` is `READY` at `42cdaf8`, the pre-RC-005 baseline. | Release operator |
| Vercel runtime/domain | **PARTIAL** | Node 24, canonical `www` HTTPS routes, apex redirect, no build/runtime error after representative traffic, environment scopes, team security, and rollback evidence. Node/domain/current deployment health pass; candidate traffic and settings evidence remain. | Release operator |
| Core hosted environment | **UNKNOWN** | Four required Production variable names, correct project/origin association, Sensitive service key, and a successful hosted `npm run env:check`, all without exposing values. | Vercel owner |
| Production-only persona security | **NOT VALIDATED for candidate** | `NEXT_PUBLIC_CCM_AUDIT_MODE` absent/false and `/dev/personas`/persona headers unavailable in Production. | Engineering + security |
| Supabase Auth URL configuration | **UNKNOWN** | Site URL `https://www.ccmassistant.com`; narrow confirmation, reset, and invitation redirects; approved templates. | Supabase owner |
| Password/MFA/session security | **FAIL / UNKNOWN** | Leaked-password protection enabled, 12+ character minimum, TOTP enabled, approved session/rate-limit/CAPTCHA policy, and recovery test. Current Security Advisor explicitly reports leaked-password protection disabled. | Supabase owner + security |
| Custom SMTP | **NOT VALIDATED** | Approved provider, credentials in Supabase only, sender/domain/SPF/DKIM/DMARC evidence, rate limits, logs, and message IDs. Default Supabase SMTP is prohibited. | Email/Supabase owner |
| Authentication lifecycle | **NOT VALIDATED** | Confirmation, resend, reset, expired/used links, invitation, wrong-email, rejection, defer, and MFA interruption pass with provider and database evidence. No Auth logs were available for the previous 24 hours. | QA + email operator |
| Operational role provisioning | **PASS locally; NOT HOSTED** | Independent AAL2 accounts for every canonical role, allow/deny matrix, assign/change/disable/remove lifecycle, founder protection, legacy projection, RLS, and audit evidence. | QA + practice administrator |
| Synthetic pilot workflow | **NOT VALIDATED for RC-005** | Owner/provider bootstrap, first patient, coordinator task/deferral, provider review, compliance, billing evidence, secure patient link, and one complete synthetic CCM month without manual SQL. | QA + founder |
| Backup and isolated restore | **UNKNOWN** | Retention/PITR settings, pre-release recovery point, isolated restore, integrity/count comparison, achieved RPO/RTO, and approved cleanup. | Supabase owner + security |
| Supabase PHI eligibility | **UNKNOWN** | Signed Supabase BAA, HIPAA add-on, High Compliance project, PITR, SSL enforcement, network restrictions, and Postgres logging before PHI. | Founder + legal/security |
| Vercel PHI eligibility | **UNKNOWN** | Plan/account and BAA evidence appropriate for PHI use. | Founder + legal/security |
| Email/vendor PHI eligibility | **UNKNOWN** | Approved agreement/BAA or documented legal determination for custom SMTP and Resend if enabled. | Founder + legal/security |
| Practice/legal approval | **UNKNOWN** | Pilot agreement/scope, risk analysis, retention/deletion, incident/breach, privacy/consent, training/support, and written practice approval. | Founder + practice + counsel |
| Open defects and exceptions | **UNKNOWN after hosted test** | No open P0/P1, no unexplained security/configuration failure, and every accepted exception has owner, expiry, compensating control, and written approval. | Founder + security + practice |

## Verified positive evidence

- RC-005 has no known remaining software P0 and has a strong local validation record.
- Hosted Supabase is `ACTIVE_HEALTHY` in `us-east-1` and its API/key endpoints are reachable.
- Hosted Supabase migration history through `027` is internally ordered; only the two documented forward migrations are missing.
- Vercel project `ccmassistant` is Next.js on Node `24.x`, matching `package.json`.
- Current Vercel build and deployment are `READY`; the canonical `www` homepage and Auth routes return `200`, and the apex domain permanently redirects to `www`.
- Vercel reported no runtime error clusters in the previous seven days. This is platform health evidence, not representative pilot traffic.
- Only `.env.example` is tracked among environment files; the local four-key setup is internally consistent without exposing values.

## True blockers today

1. **No immutable RC-005 SHA.** RC-004/RC-005 code, tests, migrations, and documentation remain uncommitted in the working tree.
2. **Hosted schema is behind.** The two RC-004/RC-005 forward migrations have not been applied to the hosted project.
3. **Hosted deployment is behind.** Vercel serves SHA `42cdaf8`, not RC-005.
4. **Leaked-password protection is disabled.** Supabase Security Advisor reports this directly.
5. **Auth URLs, templates, MFA/session policy, custom SMTP, and four Vercel Production values lack retained configuration evidence.**
6. **Email lifecycle is unproven.** There is no current confirmation/invitation/recovery provider-message evidence.
7. **Hosted role and synthetic workflow evidence is absent for RC-005.**
8. **BAA/High Compliance, vendor, backup/restore, incident, retention, and pilot-practice approvals have not been located or evidenced.**

These are release and operational blockers, not a request for new product features.

## Founder actions

1. Approve the exact RC-005 release inventory and separately authorize commit/push.
2. Identify the private owners and locations of BAA, vendor, risk, incident, retention, restore, support, and practice approvals.
3. Choose the first-pilot communication scope:
   - Auth custom SMTP is mandatory.
   - Decide whether in-app patient email via Resend is enabled or the pilot uses secure links only.
   - Leave OpenAI and Stripe disabled unless explicitly approved; Stripe remains test-mode only.
4. Approve the hosted change window, database operator, reviewer, backup point, and rollback owner.
5. Configure/verify Vercel Production values and Supabase Auth/security/SMTP settings.
6. Promote the frozen SHA and the two pending migrations under `hosted-validation-checklist.md`.
7. Complete the hosted evidence matrix and isolated restore drill.
8. Conduct final founder, security/compliance, and pilot-practice review; sign below only when every hard gate is PASS.

## Estimated time to first pilot

| Scenario | Estimate | Assumptions |
| --- | --- | --- |
| Best case | **6–10 focused hours** | BAAs/approvals and sender domain already exist; DNS is verified; owners have access; no hosted test fails. Includes packaging/promotion, configuration, Auth/role/workflow validation, and evidence assembly. |
| More likely | **2–5 business days** | SMTP/DNS or BAA/account settings need coordination, the restore drill must be scheduled, or one validation cycle needs correction/retest. |
| External dependency delay | **Unbounded until complete** | A required BAA, High Compliance upgrade, vendor approval, DNS access, practice agreement, or legal/PHI authorization is not available. |

No external user should be invited and no PHI should be entered until the signed GO decision exists.

## Final approval record

Candidate SHA: `______________________________`

Vercel deployment ID: `______________________________`

Supabase final migration: `______________________________`

Evidence package: `______________________________`

Open P0/P1 count: `________`

Exceptions: `______________________________`

| Approver | Decision | Name | UTC timestamp | Approval record |
| --- | --- | --- | --- | --- |
| Founder/release owner | GO / NO-GO |  |  |  |
| Security/compliance owner | GO / NO-GO |  |  |  |
| Pilot-practice approver | GO / NO-GO |  |  |  |
| Technical release operator | GO / NO-GO |  |  |  |

Final decision: `GO / NO-GO`

Pilot start window: `______________________________`

Rollback owner: `______________________________`

Support/incident channel: `______________________________`
