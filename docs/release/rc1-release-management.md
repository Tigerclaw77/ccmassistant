# CCM Assistant RC1 release management

Assessment date: 2026-08-01

Current branch: `main`

Current committed HEAD: `93cbd8d2ae62f466d4229920c2c5b27e9ef2c69a`

Recommended tag: `v1.0.0-rc.1`

Current decision: **READY TO COMMIT RC1**

The application candidate is locally certified, but it is not yet an immutable release artifact. Before this report, the tree contained 46 changed paths: 29 modified and 17 untracked. This report and the pilot package bring the intended RC1 manifest to 48 paths. All 48 belong to the candidate; none is an unrelated carry-over. Commit, tag, hosted migration, deployment, Auth/SMTP, recovery, and legal/compliance gates remain intentionally unperformed.

## 1. RC1 release manifest

### Application implementation — include 23

These are the accepted RC006/RC007 and Version 1.0 corrections. They belong together because their behavior was certified as one complete pilot workflow.

| File | RC1 purpose |
| --- | --- |
| `app/accept-invitation/page.tsx` | Preserves the invitation identifier through hydration and recovery. |
| `app/api/practices/active/route.ts` | Validates and persists practice starter-kit settings. |
| `app/api/practices/bootstrap/route.ts` | Adds safe starter-kit defaults to first-practice bootstrap. |
| `app/dashboard/billing/[patientId]/[month]/page.tsx` | Uses deterministic clinical-intake terminology. |
| `app/patients/[patientId]/care-plan/page.tsx` | Uses deterministic clinical-intake terminology. |
| `app/patients/[patientId]/page.tsx` | Recovers partial first-patient setup and confirms completed onboarding. |
| `app/patients/new/page.tsx` | Connects first-patient creation to the guided onboarding path. |
| `app/patients/page.tsx` | Hides patient creation from roles that cannot perform it. |
| `app/settings/question-banks/page.tsx` | Lets authorized administrators manage starter-kit defaults. |
| `app/setup/practice/page.tsx` | Adds required starter-kit selection to first-run setup. |
| `components/Header.tsx` | Uses the locked role-minimum MVP navigation. |
| `components/ccm/QuestionSessionPanel.tsx` | Prevents overlapping questionnaire mutations. |
| `components/onboarding/ClinicalStarterKitPicker.tsx` | Provides the reusable eight-kit selector. |
| `components/patients/PatientForm.tsx` | Prevents impossible active-at-create enrollment and recovers partial saves. |
| `components/patients/PatientWorkspace.tsx` | Adds one guided next action, monthly progress, and condition-matched starter guidance. |
| `lib/ccm/clinical-starter-kits.ts` | Defines validated, backwards-compatible starter-kit defaults/content. |
| `lib/ccm/labels.ts` | Removes optional-AI wording from required clinical workflow. |
| `lib/ccm/question-bank/conditions.ts` | Adds the complete asthma condition module. |
| `lib/ccm/question-bank/questions.ts` | Scopes rescue-frequency monitoring to asthma. |
| `lib/ccm/question-bank/types.ts` | Adds the asthma module identifier. |
| `lib/ccm/universal-care-guidance.ts` | Selects the next safe action from existing workflow state and role. |
| `lib/ccm/worklist.ts` | Keeps billed months terminal while preserving historical evidence. |
| `lib/mvp-navigation.ts` | Locks production navigation to role-required MVP destinations. |

### Database migration — include 1

| File | RC1 purpose |
| --- | --- |
| `supabase/migrations/20260801193000_version_1_0_practice_member_service_grant.sql` | Forward-only acceptance correction: grants the server's required membership DML to `service_role` and makes the immutable care-plan snapshot trigger an uncallable SECURITY DEFINER function. |

No previously applied migration was edited. The recorded SHA-256 for this migration is `690F37483F2B3EF8778257E7DA1A5C80D580CAD1B391BF2642D491D0EC612CE2` and must be rechecked from the committed candidate.

### Deterministic generated artifact — include 1

| File | RC1 purpose |
| --- | --- |
| `data/clinical-review/review-package.json` | Regenerated clinical-review artifact reflecting asthma condition scoping; byte/determinism checks passed. |

This is generated, but it is a tracked release artifact required by the clinical-review contract. It should not be excluded.

### Automated tests and release validation — include 12

| File | RC1 purpose |
| --- | --- |
| `package.json` | Registers RC006 and RC007 test commands. No dependency changed; `package-lock.json` remains unchanged. |
| `scripts/coordinator-efficiency.test.mjs` | Covers billed-month terminal worklist behavior. |
| `scripts/question-bank.test.mjs` | Covers the asthma condition module. |
| `scripts/rc005-pilot-gate.test.mjs` | Covers invitation hydration and least-privilege membership/care-plan correction. |
| `scripts/rc006-universal-coordinator.test.mjs` | Covers starter kits, adaptive guidance, and guided onboarding. |
| `scripts/rc007-mvp-lock.test.mjs` | Covers locked navigation, patient creation recovery, and deterministic intake. |
| `scripts/run-regression-suite.mjs` | Adds RC006 and RC007 to the complete regression sequence. |
| `scripts/session-engine.test.mjs` | Proves asthma prompts are condition-scoped. |
| `scripts/session-integration.test.mjs` | Covers the synchronous mutation guard. |
| `scripts/version-1.0-local-acceptance.mjs` | Reproducible 50-patient synthetic acceptance harness using environment-supplied credentials. |
| `supabase/tests/001_schema_security_contract.test.sql` | Updates the contract to the 30-version migration ledger. |
| `supabase/tests/002_tenant_and_ownership_contract.test.sql` | Makes the ownership fixture repeatable on a populated acceptance database. |

### Product, certification, operations, and release documentation — include 11

| File | RC1 purpose |
| --- | --- |
| `docs/product/mvp-definition.md` | Defines the locked MVP and deferrals. |
| `docs/product/rc-006-universal-coordinator-experience.md` | Records implemented RC006 scope and remaining work. |
| `docs/product/version-1.0-acceptance.md` | Records the dress rehearsal, corrections, evidence, and known issues. |
| `docs/product/version-1.0-release-certification.md` | Records adversarial certification and conditions. |
| `docs/operations/rc1-backup-recovery.md` | Defines PHI-aware backup, PITR, restore, deletion, migration, and disaster recovery. |
| `docs/operations/rc1-pilot-operations.md` | Defines actual owner, staff, patient, coordinator, provider, billing, compliance, withdrawal, and turnover operations. |
| `docs/operations/rc1-production-deployment.md` | Defines environment, migration, Auth/SMTP, deployment, verification, and rollback controls. |
| `docs/operations/rc1-pilot-package.md` | Supplies the practice-facing onboarding and role checklists. |
| `docs/release/rc1-launch-day-checklist.md` | Single operator gate sheet with expected result and stop/rollback for every step. |
| `docs/release/rc1-readiness-summary.md` | Summarizes external dependencies and current internal-pilot readiness. |
| `docs/release/rc1-release-management.md` | Supplies this complete manifest, release notes, hosted delta, and decision. |

### Files excluded from RC1

**None of the 48 changed paths should be excluded.** Every path is implementation, a forward migration, deterministic generated evidence, regression protection, acceptance tooling, or release documentation for the already-certified candidate.

The following local ignored state must remain excluded from source control and the release archive:

- `.env.local` and every secret-bearing `.env.*.local` file;
- `.next/`;
- `node_modules/`;
- `supabase/.temp/`;
- `tsconfig.tsbuildinfo`;
- local database volumes, dumps, logs, screenshots, provider links, OTPs, and test mail.

The extraneous local package `@emnapi/runtime@1.9.1` is in ignored `node_modules`, is not in the lockfile, and is removed by `npm ci`; it is not an RC1 file.

## 2. Commit preparation

### Repository verification

| Check | Result |
| --- | --- |
| Clean repository | **Fail by design:** 48 intended RC1 paths are not committed. |
| Temporary files in changed set | Pass: no `.tmp`, `.temp`, `.bak`, `.orig`, `.rej`, `.log`, or editor-backup path found. |
| Generated build artifacts tracked | Pass: no `.next`, `node_modules`, coverage, log, or TypeScript build-info file is tracked. |
| Environment files tracked | Pass: only `.env.example` is tracked. |
| Full repository secret scan | Pass: Gitleaks `v8.30.1` scanned 195,623,059 bytes, including the large ICD artifact. Two redacted findings were reviewed as false positives: the non-secret eligibility key `conditions_expected_12_months` and deliberately fake Stripe test strings used to prove live-mode rejection and masking. |
| Full-history secret scan | Pass: all 25 commits and 111,564,949 bytes of `--all --full-history` textual patch history were scanned. The only findings were the same two reviewed false positives, introduced in `cfce748` and `1c699fd`. No production credential was detected. |
| PHI pattern review | Pass: no SSN pattern was found in the current candidate or Git history; email values use reserved example/test domains; phone values use synthetic `555` test ranges. No patient PHI was identified. |
| Debug code | Pass: no application `console.log`, `console.debug`, or `debugger` found. |
| TODO/placeholder impact | No pilot blocker: legacy helper comments and the public `/demo` “coming soon” page are outside the authenticated MVP workflow. |
| Accidental edit review | Pass for scope: all changed files map to certified RC1 behavior, tests, migration, generated evidence, or release documentation. |
| Diff hygiene | `git diff --check` passes; new Markdown files also pass whitespace/newline inspection. |

### Recommended commit

Title:

```text
feat: freeze CCM Assistant v1.0 RC1
```

Suggested body:

```text
- complete the universal coordinator and first-patient MVP path
- correct invitation, care-plan snapshot, and terminal month defects
- add clinical starter kits and role-minimum navigation
- add the final forward migration and full acceptance coverage
- record Version 1.0 certification and pilot operating runbooks

Validated: 30 migrations, 93 pgTAP assertions, 37-command regression,
TypeScript, ESLint, production build, DB lint, and synthetic 50-patient month.
```

Before committing: review the 48-path manifest and confirm the recorded release gates still apply to the exact tree. Do not stage `.env.local`, `.next`, `node_modules`, `supabase/.temp`, `tsconfig.tsbuildinfo`, dumps, or evidence containing PHI/tokens.

### Recommended annotated tag

```text
v1.0.0-rc.1
```

Annotation:

```text
CCM Assistant v1.0.0 RC1 — feature-frozen pilot candidate
```

Create the annotated, preferably signed tag only after the commit is on `main`, the clean-checkout validation passes, and GitHub identifies the same SHA. Do not tag current HEAD `93cbd8d`; it does not contain the 48-path RC1 manifest.

## 3. Release notes

### CCM Assistant v1.0.0 RC1

RC1 is the feature-frozen candidate for a limited, closely supported CCM pilot covering one practice, one provider, one coordinator, one administrator, and 50–100 patients.

Highlights:

- Guided first-run practice, provider, starter-kit, and first-patient onboarding.
- Eight curated clinical starter kits with condition-specific monitoring and reviewed guidance.
- One adaptive patient workspace that presents the next safe action and monthly progress.
- Role-minimum navigation and protected operational-role provisioning.
- Complete coordinator task, documentation, time, routing, deferral, and terminal-month behavior.
- Provider review, compliance review, billing readiness, immutable evidence, and audit preservation.
- Safe recovery from partial patient creation and invitation hydration.
- Deterministic clinical intake without a required AI dependency.
- Complete local acceptance, adversarial certification, migration, authorization, and synthetic-month evidence.

Known limitations accepted for a supported pilot:

- hosted confirmation/invitation/recovery delivery still requires final custom-SMTP proof;
- role-forbidden direct presentation URLs may render limited in-practice data, while server mutations and restricted compliance operations remain denied;
- practice phone is represented in both onboarding and billing settings and should be confirmed during setup;
- some audit displays show an actor UUID rather than a friendly name;
- compliance review is event/evidence oriented rather than a complete patient-centered timeline;
- wide registry/evidence tables are best operated on desktop during the pilot;
- the public `/demo` page remains a marketing placeholder and is not part of pilot operations.

No live Stripe, OpenAI, new integration, or advanced analytics dependency is required for RC1.

## 4. Exact hosted deployment delta

### Known production baseline

- Vercel project: `ccmassistant` (`prj_fnaokoHqCinVay6Mx1O0I2dOLR6l`).
- Latest production deployment: `dpl_9NBuRX9cBKfQGY4vyEjR9qjw6q1L`, state `READY`.
- Hosted SHA: `93cbd8d2ae62f466d4229920c2c5b27e9ef2c69a`.
- Vercel Node: `24.x`, matching `package.json`.
- Domains present: `www.ccmassistant.com` and `ccmassistant.com` plus Vercel aliases.
- Runtime errors: none reported in the last seven days.
- GitHub commit verification on the hosted deployment: `unverified`; use the signed RC1 tag/release record to establish candidate identity.
- Supabase live project, migration, and adviser reads returned “You do not have permission to perform this action.” Supabase configuration below is therefore a required verification/apply delta, not a claim about current dashboard state.

### Migrations

Verify the hosted ledger first. Repository evidence last recorded hosted schema through `027`. If that exact prefix is confirmed, apply only this ordered suffix:

1. `20260801160641_rc004_durable_opportunity_deferral.sql`
2. `20260801170717_rc005_operational_role_provisioning.sql`
3. `20260801193000_version_1_0_practice_member_service_grant.sql`

Do not reapply `001`–`027`, edit an applied migration, or repair ledger history by assumption. The final expected repository level is `20260801193000`, with 30 versions recorded once.

### Production environment variables

Verify these four required Production values point to the production Supabase project and canonical origin:

| Variable | Required state |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Exact production Supabase HTTPS origin. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Active publishable/legacy anon key for that same project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production server-only Sensitive secret; never Preview/browser/logs. |
| `NEXT_PUBLIC_APP_URL` | `https://www.ccmassistant.com` with no path/trailing slash. |

Required negative configuration:

- `NEXT_PUBLIC_CCM_AUDIT_MODE` absent or `false` in Production;
- OpenAI variables absent for RC1;
- Stripe variables absent for RC1;
- `RESEND_API_KEY` and `PATIENT_EMAIL_FROM` present only if separately approved patient-email delivery is enabled;
- Preview/Development scopes must not contain production database/service credentials.

Environment changes require a new Vercel deployment; they do not mutate an existing build.

### Redirects and Auth

Verify/apply in Supabase Auth:

- Site URL: `https://www.ccmassistant.com`
- `https://www.ccmassistant.com/login`
- `https://www.ccmassistant.com/reset-password`
- `https://www.ccmassistant.com/accept-invitation`

Use exact production paths, not a broad wildcard. Confirm apex `https://ccmassistant.com` redirects permanently to `www`.

Verify/apply:

- confirmation enabled;
- TOTP enabled;
- password minimum at least 12 characters;
- leaked-password protection enabled where supported;
- approved session, refresh-token, rate-limit, and CAPTCHA policy;
- approved confirmation, invitation, recovery, and security-change templates;
- Custom SMTP with verified sender, SPF, DKIM, DMARC, monitoring, and approved vendor agreement.

Retain provider message IDs and final delivered/deferred/rejected results for confirmation, resend, invitation, reset, expired/used links, and invalid recipients. Application acceptance is not delivery proof.

### Deployment configuration

No framework or Node-version change is required. The deployment delta is:

1. commit and tag the 48-path RC1 manifest;
2. complete the hosted migration suffix and post-migration security verification;
3. verify Production variables/Auth/SMTP/redirects;
4. allow GitHub to create a Vercel production deployment from the exact RC1 SHA;
5. verify deployment ID, source SHA, build, aliases, Persona Mode absence, representative traffic, and runtime logs;
6. preserve the prior deployment as an application rollback candidate only after confirming forward-schema compatibility.

No Supabase Storage bucket or Edge Function is required by RC1.

## 5. Remaining blockers by type

| Type | Remaining pilot-day blockers |
| --- | --- |
| Software | **None known.** The candidate passed local acceptance/certification after narrow corrections. |
| Infrastructure | Candidate not committed/tagged/deployed; three-migration hosted suffix unverified; Production environment/Auth/SMTP state unverified; isolated restore not proven. |
| Compliance | HIPAA project controls, risk analysis, audit review ownership, retention, incident/breach, access-review, training, and support evidence not retained in this repository. |
| Business | Named pilot practice roster, pilot scope, support expectations, success criteria, onboarding window, and exit criteria require final approval. |
| Operations | Release/change owners, hosted lifecycle test evidence, backup monitoring, recovery drill, practice training, launch support, and signed launch checklist remain incomplete. |
| Legal | Executed pilot agreement and required BAAs/vendor determinations for Supabase, Vercel, and email delivery are not evidenced. |

## 6. Final recommendation

**READY TO COMMIT RC1**

Every changed path belongs to the certified candidate, both secret scans pass after review of two synthetic false positives, no PHI or temporary release artifact was identified, and diff hygiene passes. The repository is ready for the recommended commit. The annotated tag should be created only after the commit exists and the clean post-commit tree resolves to that exact SHA. External infrastructure, Auth/SMTP, recovery, compliance, business, operational, and legal gates still block external pilot deployment, not creation of the immutable repository release. No further feature work is indicated.
