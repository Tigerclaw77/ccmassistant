# RC-003 Founder Review

Prepared: July 21, 2026

## Recommendation

**READY TO COMMIT RC-003**

The two verified blockers are resolved:

1. Applied migrations `024`, `025`, and `026` now match the exact SQL recorded in shared development. Migration `024` has no working-tree diff. All later tenant, grant, search-path, provider-lifecycle, and security comments remain forward-only in the unpublished migration `027`.
2. A coordinator can now start a work item in the patient workspace, perform the work, document an outcome and actual affirmed time, route to the PRP or defer when needed, complete the task, and return automatically to My Work Today with an optional next-patient action.

No hosted database, deployment, commit, push, or remote branch was changed while resolving these blockers.

## Candidate scope

RC-003 is the accumulated pilot-readiness candidate after RC-001. It contains:

- per-user first-run onboarding instead of the former global first-practice restriction;
- guided TOTP MFA enrollment and interrupted-enrollment recovery;
- atomic organization/practice/owner bootstrap;
- first-provider bootstrap and a Medicare-aware date-of-birth calendar view;
- canonical long-term role assignments while retaining legacy role compatibility;
- immutable Primary Responsible Provider ownership history and provider lifecycle controls;
- deterministic suggested-care detection, immutable evidence and decisions, work items, routing records, and a compliance view;
- a local-only development persona overlay that preserves real authentication, AAL2, membership, and RLS;
- a permanent local Supabase stack and fresh-database pgTAP validation workflow.

RC-003 does not add department management, a patient portal, production communication vendors, automatic time, automatic billing, CPT logic, live Stripe changes, or a general-purpose permission builder.

## Complete working-tree inventory

The inventory below covers all 84 modified or untracked paths after blocker resolution. The groups are disjoint.

### Implementation and schema: include (43 files)

Database migrations:

```text
supabase/migrations/025_pilot_readiness_sprint_2.sql
supabase/migrations/026_pilot_readiness_sprint_2_function_hardening.sql
supabase/migrations/027_task_driven_coordinator_workflow.sql
```

Application implementation:

```text
app/api/clinical-reports/route.ts
app/api/compliance/workflow/route.ts
app/api/interaction-logs/route.ts
app/api/opportunities/[opportunityId]/disposition/route.ts
app/api/opportunities/route.ts
app/api/patients/claim/route.ts
app/api/patients/route.ts
app/api/practices/active/route.ts
app/api/practices/bootstrap/route.ts
app/api/practices/first-provider/route.ts
app/api/work-items/[workItemId]/route.ts
app/api/worklist/route.ts
app/dashboard/compliance/page.tsx
app/dashboard/worklist/page.tsx
app/globals.css
app/mfa/page.tsx
app/patients/new/page.tsx
app/settings/page.tsx
app/setup/practice/page.tsx
components/auth/AuthGate.tsx
components/onboarding/OnboardingProgress.tsx
components/patients/PatientForm.tsx
components/patients/PatientWorkspace.tsx
components/ui/ContextualDateInput.tsx
components/work/OpportunityReviewPanel.tsx
components/work/WorkItemWorkspace.tsx
lib/calendar-defaults.ts
lib/ccm/first-provider-bootstrap.ts
lib/ccm/month-context.ts
lib/ccm/opportunity-detector.ts
lib/ccm/staff-experience.ts
lib/ccm/types.ts
lib/ccm/work-authorization.ts
lib/ccm/workflow-settings.ts
lib/ccm/worklist.ts
lib/integrations/clinical-workflow.ts
lib/mfa-enrollment.ts
lib/practice-bootstrap.ts
lib/role-architecture.ts
lib/supabase/database.types.ts
```

`lib/supabase/database.types.ts` is an intentional checked-in generated type surface. It belongs with implementation because the new routes and role/workflow records compile against it.

### Infrastructure: include (3 files)

```text
scripts/local-gate3-runtime-validation.mjs
supabase/.gitignore
supabase/config.toml
```

These establish the isolated local stack and repeatable Gate 3 runtime validation. Ignored local CLI state, Docker volumes, `.env.local`, `.next`, and Supabase temporary directories are not in Git status and must remain excluded.

### Tests: include (12 files)

```text
scripts/coordinator-workflow-opportunity-detector.test.mjs
scripts/development-persona-mode.test.mjs
scripts/first-patient-onboarding.test.mjs
scripts/founder-review-sprint-1.test.mjs
scripts/mfa-enrollment.test.mjs
scripts/pilot-readiness-sprint-2.test.mjs
scripts/practice-bootstrap.test.mjs
scripts/staff-experience.test.mjs
supabase/tests/001_schema_security_contract.test.sql
supabase/tests/002_tenant_and_ownership_contract.test.sql
supabase/tests/003_opportunity_workflow_contract.test.sql
supabase/tests/004_legacy_bootstrap_compatibility.test.sql
```

### Developer tooling: include (15 files)

```text
.env.example
app/dev/audit/page.tsx
app/dev/personas/page.tsx
app/layout.tsx
components/Header.tsx
components/dev/DeveloperPersonaToolbar.tsx
components/dev/DevelopmentPersonaHub.tsx
components/dev/useDevelopmentPersona.ts
lib/auth.ts
lib/development-persona.ts
lib/practice-authorization.ts
lib/practice-context.ts
lib/supabase.ts
package.json
scripts/run-regression-suite.mjs
```

The persona overlay is developer tooling rather than a pilot permission model. It is gated by both `NODE_ENV=development` and `NEXT_PUBLIC_CCM_AUDIT_MODE=true`, stores only browser-session context, and is ignored by the server in production.

### Documentation: include (11 files)

```text
docs/audit/migrations.md
docs/development/local-setup.md
docs/development/local-supabase.md
docs/development/persona-mode.md
docs/product/coordinator-workflow-and-opportunity-detector.md
docs/product/founder-review-notes.md
docs/product/pilot-readiness-sprint-2.md
docs/product/ux-backlog.md
docs/product/ux-validation-report.md
docs/release/pilot-checklist.md
docs/release/rc-003-review.md
```

The founder notes and UX backlog belong because they distinguish verified release behavior from accepted/deferred review work. They do not authorize feature expansion.

### Exclude from RC-003

No changed path is excluded. Migration `024` was restored and no longer appears in the working tree.

No temporary/debug file, secret file, production value, generated build directory, or unrelated carry-over is visible in the working tree.

## Major features and workflow changes

### First-run owner and provider onboarding

An authenticated AAL2 user with no active membership enters onboarding rather than a membership dead end. Practice bootstrap atomically creates the organization, practice, owner membership, canonical owner/administrator roles, setup profile, and audit event. The flow then provisions or collects the first active provider before allowing first-patient creation. The first patient's PRP defaults to that provider.

### MFA

The MFA experience explains the purpose of TOTP, presents supported authenticator applications, guides QR/manual enrollment and six-digit verification, and recovers interrupted enrollment through Continue, Restart, or Cancel without deleting verified factors.

### Role and clinical-ownership architecture

The schema adds canonical multi-role assignments with organization, practice, clinical, future department, read-only, and patient scopes while preserving the existing `practice_members.role` contract. Administrative ownership is separate from patient clinical ownership. Every patient has one current PRP, changes append immutable history, and provider deactivation/archival cannot orphan active patients.

### Coordinator and provider workflow

The worklist prioritizes patient-specific clinical triggers rather than minute thresholds. Suggested care activities are deterministic and versioned; generated evidence, dispositions, priority factors, deviations, and work-item events are immutable. Providers receive clinical review work, and compliance receives a read-only workflow view. Migration `027` also adds scoped clinical reports and patient/coordinator assignment controls.

The task is now the coordinator workspace. Outcome documentation is required for final transitions; linked time requires explicit actual-time affirmation and remains retry-safe; PRP routing creates an idempotent secure-workspace clinical report; defer requires a follow-up date; and successful completion returns to the preserved worklist with an optional next-patient action. Provider recipient confirmation remains visible because routing defaults to the patient's PRP.

### Development persona mode

The persona hub and toolbar switch a browser-session development context without changing Supabase users, memberships, real database roles, or audit history. Existing APIs continue through the canonical resolver, and RLS evaluates the real JWT. Production builds return the normal not-found experience for the persona route and ignore a fabricated persona header.

## Migration record

| Migration | Shared development | Repository state | RC-003 disposition |
| --- | --- | --- | --- |
| `024` | Applied | Exact shared-development contents; no diff | Preserve unchanged and do not stage it. |
| `025` | Applied | Exact shared-development contents | Include unchanged so repository history matches the shared ledger. |
| `026` | Applied | Exact shared-development contents | Include unchanged so repository history matches the shared ledger. |
| `027` | Not applied | New/untracked forward migration | Include after founder review; apply only after commit review and hosted backup/preflight gates. |

Read-only catalog and migration-ledger checks on shared development confirmed that `024`, `025`, and `026` are applied and `027` is absent. The normalized local SQL for all three applied migrations matches the shared migration statements exactly. Migration `027` explicitly applies the compatible forward grant, tenant-integrity, fixed-search-path, provider-lifecycle, and documentation hardening.

Applied-file SHA-256 values are `024` `c6c8ef770f89236717eae918db08c2b41ae98d7d20eb5724336fb24a47dbf1c8`, `025` `3872f3f66f9386a2d6b5b24978b6980462c7a6f40ee6459381ee435fb2a208c3`, and `026` `bd939f1e98bb6a14680786d8485efcb5a6bb3dd7bd8c5da098692c8a4b94d05e`. The unpublished `027` SHA-256 is `4596c62d1df9f3b832c4ab789661e6da219e2af5fff0049876c0fc4eafcda136`.

The local migration ledger contains `001` through `027` in order. Local database lint reports no schema errors. Four pgTAP files pass 66 assertions covering schema, tenant/ownership integrity, workflow transitions and audit events, legacy bootstrap compatibility, grants, RLS, immutable records, and security-definer boundaries.

## Developer tooling and infrastructure

- Node `24.x` is required by `package.json`; the validated workstation runtime is Node `24.18.0` with npm `10.5.0`.
- The local Supabase stack uses Docker Desktop/WSL2 and Supabase CLI `2.109.1`.
- `supabase/config.toml` enables the database, Auth, REST, Storage, Studio, Mailpit, Realtime, and Edge Runtime while keeping local Analytics disabled.
- The repeatable sequence is local-only: reset, migration replay, lint, pgTAP, TypeScript, ESLint, regression, and production build.
- Local credentials and runtime state remain ignored. No hosted credential is added to configuration or documentation.

## Validation evidence

Validated July 21, 2026 against the current frozen working tree:

| Gate | Result |
| --- | --- |
| TypeScript (`npm.cmd run typecheck`) | Passed |
| ESLint (`npm.cmd run lint`) | Passed with zero lint warnings |
| Full regression (`npm.cmd test`) | Passed: 33 commands |
| Production build with persona flag set | Passed; production gating remains compiled correctly |
| Local migration ledger | `001`-`027` present in order |
| Local database lint | Passed; no schema errors |
| pgTAP | Passed: 4 files, 66 assertions |
| Hosted migration ledger | Shared development is through `026`; `027` is absent |
| `git diff --check` before documentation edits | No whitespace errors |

The regression suite emits one known informational warning: 4,583 ICD `PASS` records remain intentionally unmapped by design. Git emits line-ending notices for `lib/supabase.ts` and unchanged `next-env.d.ts`; these are not validation failures but should not be normalized accidentally while staging.

## Known limitations and deferred work

- Department management is represented only by future-compatible role scope; there is no department UI or CRUD.
- Patient access is modeled separately, but there is no dedicated patient portal. The existing secure patient check-in flow remains the pilot-facing patient path.
- Provider/staff assignment and PRP reassignment administration are not complete general-purpose settings experiences.
- Production notification, secure-message, and clinical-report vendors are not selected. Ordinary email must remain PHI-free.
- Full EHR integration, custom roles, live Stripe decisions, automatic time, and automatic billing are outside RC-003.
- Founder-review notes identify additional cognitive-load and continuity improvements. Those are deferred unless explicitly marked as a blocker above.
- Hosted validation of migration `027`, Auth email delivery, password reset redirects, and invitation email delivery remains a controlled post-commit/pre-pilot gate.

## Release risks

1. Migration `027` changes grants, ownership invariants, and workflow tables and has not been applied to shared development; local proof does not replace hosted preflight and rollback preparation.
2. Invitation and password-reset success depends on hosted Supabase Auth email/redirect configuration and must be exercised end to end before pilot users are invited.
3. Persona Mode is not user impersonation and cannot replace separate-account authorization testing.

## Exact commit sequence

Use this sequence only after every staged diff is inspected.

### 1. `feat(db): add RC-003 role and care-workflow schema`

Purpose: record the already-applied Sprint 2 schema files and the forward coordinator workflow migration without rewriting `024`.

Files:

```text
supabase/migrations/025_pilot_readiness_sprint_2.sql
supabase/migrations/026_pilot_readiness_sprint_2_function_hardening.sql
supabase/migrations/027_task_driven_coordinator_workflow.sql
```

Reason: these migrations are one ordered database contract. `026` hardens `025`; `027` supplies the shared-environment forward normalization and the runtime workflow schema.

### 2. `feat: complete RC-003 onboarding and care coordination`

Purpose: deliver first-run owner/provider/patient onboarding, long-term roles, deterministic suggestions, work routing, compliance visibility, and shared runtime types.

Files:

```text
app/api/clinical-reports/route.ts
app/api/compliance/workflow/route.ts
app/api/interaction-logs/route.ts
app/api/opportunities/[opportunityId]/disposition/route.ts
app/api/opportunities/route.ts
app/api/patients/claim/route.ts
app/api/patients/route.ts
app/api/practices/active/route.ts
app/api/practices/bootstrap/route.ts
app/api/practices/first-provider/route.ts
app/api/work-items/[workItemId]/route.ts
app/api/worklist/route.ts
app/dashboard/compliance/page.tsx
app/dashboard/worklist/page.tsx
app/globals.css
app/mfa/page.tsx
app/patients/new/page.tsx
app/settings/page.tsx
app/setup/practice/page.tsx
components/auth/AuthGate.tsx
components/onboarding/OnboardingProgress.tsx
components/patients/PatientForm.tsx
components/patients/PatientWorkspace.tsx
components/ui/ContextualDateInput.tsx
components/work/OpportunityReviewPanel.tsx
components/work/WorkItemWorkspace.tsx
lib/calendar-defaults.ts
lib/ccm/first-provider-bootstrap.ts
lib/ccm/month-context.ts
lib/ccm/opportunity-detector.ts
lib/ccm/staff-experience.ts
lib/ccm/types.ts
lib/ccm/work-authorization.ts
lib/ccm/workflow-settings.ts
lib/ccm/worklist.ts
lib/integrations/clinical-workflow.ts
lib/mfa-enrollment.ts
lib/practice-bootstrap.ts
lib/role-architecture.ts
lib/supabase/database.types.ts
```

Reason: the UI, APIs, authorization contracts, detector, and generated database types are cross-dependent and form one pilot workflow. Splitting them would create intermediate commits that do not compile against one another.

### 3. `feat(dev): add development persona mode`

Purpose: add the development-only persona resolver overlay, hub, toolbar, representative navigation, and environment gate.

Files:

```text
.env.example
app/dev/audit/page.tsx
app/dev/personas/page.tsx
app/layout.tsx
components/Header.tsx
components/dev/DeveloperPersonaToolbar.tsx
components/dev/DevelopmentPersonaHub.tsx
components/dev/useDevelopmentPersona.ts
lib/auth.ts
lib/development-persona.ts
lib/practice-authorization.ts
lib/practice-context.ts
lib/supabase.ts
```

Reason: all files implement one session-only development boundary. Keeping them together makes production-exposure review straightforward.

### 4. `test: add RC-003 regression and local database validation`

Purpose: register feature tests, add local Supabase configuration, validate a fresh migration replay, and enforce database contracts.

Files:

```text
package.json
scripts/coordinator-workflow-opportunity-detector.test.mjs
scripts/development-persona-mode.test.mjs
scripts/first-patient-onboarding.test.mjs
scripts/founder-review-sprint-1.test.mjs
scripts/local-gate3-runtime-validation.mjs
scripts/mfa-enrollment.test.mjs
scripts/pilot-readiness-sprint-2.test.mjs
scripts/practice-bootstrap.test.mjs
scripts/run-regression-suite.mjs
scripts/staff-experience.test.mjs
supabase/.gitignore
supabase/config.toml
supabase/tests/001_schema_security_contract.test.sql
supabase/tests/002_tenant_and_ownership_contract.test.sql
supabase/tests/003_opportunity_workflow_contract.test.sql
supabase/tests/004_legacy_bootstrap_compatibility.test.sql
```

Reason: the runner, test registrations, local stack, migration harness, and pgTAP contracts together define the repeatable RC-003 acceptance gate.

### 5. `docs: add RC-003 founder review package`

Purpose: preserve architecture, workflow boundaries, local operations, founder findings, checklist status, and the final release record.

Files:

```text
docs/audit/migrations.md
docs/development/local-setup.md
docs/development/local-supabase.md
docs/development/persona-mode.md
docs/product/coordinator-workflow-and-opportunity-detector.md
docs/product/founder-review-notes.md
docs/product/pilot-readiness-sprint-2.md
docs/product/ux-backlog.md
docs/product/ux-validation-report.md
docs/release/pilot-checklist.md
docs/release/rc-003-review.md
```

Reason: these documents are the founder-facing approval and operational record for the same candidate. Keeping them last lets their validation claims refer to the exact preceding implementation.

## Approval boundary

All recorded gates now pass and `024` has no diff. Stage one commit group at a time and inspect every staged migration byte-for-byte. Committing RC-003 is not approval to apply `027`, push, deploy, enable production Persona Mode, or onboard PHI.
