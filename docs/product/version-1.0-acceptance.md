# Version 1.0 Candidate Acceptance

Date: August 1, 2026  
Candidate boundary: RC-007 MVP plus acceptance-only corrections  
Environment: local Next.js application and local Docker Supabase only  
Data classification: synthetic; no PHI  
Final recommendation: **GO WITH MINOR KNOWN ISSUES**

## Executive summary

CCM Assistant completed the locked MVP acceptance path from an empty local database through a closed CCM month. A new owner confirmed an account through local Mailpit, configured TOTP MFA, created a new practice, selected the recommended clinical starter kits, and bootstrapped the first provider. Eight additional MFA-protected staff identities were then provisioned through the product's invitation lifecycle.

A 50-patient synthetic panel completed enrollment, eligibility, consent, clinical intake, active care plans, monthly outreach, documentation, actual-time entry, opportunity detection, provider routing and review, compliance review, billing review, immutable evidence capture, and external-billing disposition. Forty patients were assigned to a remote coordinator and ten to clinical staff. All 50 patient-months ended in `billed` status with preserved evidence snapshots.

The acceptance run found four release-relevant defects. All four received narrow fixes and regression coverage:

1. Server-side staff provisioning lacked explicit service-role privileges on practice membership and operational role-assignment tables.
2. The care-plan version snapshot trigger ran with caller privileges and could not write its deliberately protected immutable history table.
3. Historical questionnaire signals could make a billed month appear to remain in an active provider queue.
4. Compliance, front-desk, and read-only users were shown an Add patient action that their least-privilege authorization correctly rejects.

The database replayed cleanly from empty through all 30 migrations. Database lint reported no issues, pgTAP passed 93 assertions, the 37-command regression suite passed, and TypeScript, ESLint, and the production build passed.

No remaining application defect is known to prevent a friendly practice from completing one synthetic CCM month. Hosted authentication delivery, exact deployed-SHA validation, backup/restore evidence, and organizational approvals remain operational release gates; this local acceptance does not fabricate those outcomes.

## Overall confidence score

**92/100**

Confidence is high in the local application contract, tenant model, role boundaries, core monthly workflow, and clean-database reproducibility. The remaining eight points reflect unproven hosted SMTP/Auth delivery, hosted migration and deployment evidence, limited device-level mobile verification in this run, and several learnability issues that did not prevent completion.

## Would I personally deploy this to a friendly pilot practice?

**Yes, for a closely supported synthetic-patient pilot after the existing hosted launch checklist is completed.**

I would not authorize PHI or an unsupervised production rollout solely from this local result. Before external users are invited, the founder must prove confirmation, invitation, recovery, expiry, and redirect behavior through the approved hosted SMTP/Auth configuration; deploy and verify the exact accepted SHA and migrations; confirm backup/restore readiness; and complete the documented security, legal, vendor, and support approvals.

## Acceptance scope and method

The exercise used real application routes and API contracts against a freshly reset local Supabase stack. The application ran with local Supabase URL, anonymous key, and service-role credentials injected into the process. No hosted development or production resource was contacted or modified.

The owner onboarding was completed through the browser. Repetitive panel work used `scripts/version-1.0-local-acceptance.mjs`, which drives the same authenticated application API endpoints with separate AAL2 identities. The harness does not bulk-insert practice or patient workflow state and does not bypass application authorization. Database queries were used only after completion to record aggregate evidence and later to verify the empty migration replay.

The database was reset again after evidence collection. This deliberately destroyed the synthetic acceptance data and proved the repository can reconstruct its schema from migration history alone.

## Identities and permissions exercised

The synthetic practice contained nine verified staff identities:

| Perspective | Operational role | Acceptance use |
| --- | --- | --- |
| Practice owner | Organization Owner / Practice Administrator | Signup, MFA, practice bootstrap, starter kits, staff administration |
| Office manager | Practice Administrator | Monthly billing review |
| Remote coordinator | Coordinator | Forty-patient panel, intake, outreach, documentation, opportunities |
| Nurse | Clinical Staff | Ten-patient panel using the same adaptive workflow |
| Physician | Provider | Eligibility, care plans, clinical routing, provider review |
| Compliance reviewer | Compliance Administrator | Read-only workflow and immutable evidence review |
| Billing reviewer | Billing Administrator | Final billing disposition |
| Front desk | Front Desk | Patient registry read; prohibited writes verified |
| Read-only reviewer | Read Only | Patient registry read; prohibited writes verified |

Negative authorization evidence passed:

- Front Desk patient creation: `403`.
- Read Only patient creation: `403`.
- Coordinator compliance access: `403`.
- Coordinator billing disposition: `403`.
- Persona Mode and founder override regression contracts remained intact.

## Synthetic month evidence

Final aggregate evidence before the destructive reset:

| Evidence | Result |
| --- | ---: |
| Auth users | 9 |
| Active practice members | 9 |
| Active operational role assignments | 9 |
| Active providers | 2 |
| Patients | 50 |
| Active enrollments | 50 |
| Accepted clinical intakes | 50 |
| Active provider-approved care plans | 50 |
| Closed monthly check-ins | 50 |
| Actual-time interaction logs | 50 |
| Billed patient-months | 50 |
| Immutable billing evidence snapshots | 50 |
| Detected opportunities | 2 |
| Recorded opportunity dispositions | 1 |
| Completed provider work items | 1 |
| Secure clinical reports | 1 |

The panel used a realistic mix of diabetes, hypertension, CHF, COPD, CKD, hyperlipidemia, depression, and anxiety. Each patient had at least two qualifying conditions. Monthly documented time ranged from 20 to 35 minutes and was entered explicitly; no automatic or fabricated time was created.

One intentionally abnormal response exercised the full path from evidence-backed suggestion to human disposition, task, secure provider report, provider completion, compliance history, and final billing evidence. Normal patients completed without invented clinical work.

## Workflow acceptance

| Workflow | Result | Evidence |
| --- | --- | --- |
| Signup and confirmation | Passed locally | Confirmation message received in Mailpit and link completed |
| Login, logout, and TOTP MFA | Passed | Separate AAL2 identities used for role transitions |
| First practice onboarding | Passed | New practice, defaults, eight starter kits, first provider |
| Staff provisioning | Passed after fix | Assignable roles invited, accepted, active, and resolved by authorization |
| Provider bootstrap | Passed | Provider record linked to invited provider membership |
| Patient enrollment | Passed | Fifty active enrollments with conditions, eligibility, consent, PRP, coordinator |
| Clinical intake | Passed | Fifty deterministic, human-accepted intake summaries |
| Care plan | Passed after fix | Fifty active approved plans with immutable version history |
| Coordinator workflow | Passed | Same workflow used by remote coordinator and nurse |
| Opportunity detection | Passed | Explainable abnormal evidence, human decision, no automatic time |
| Provider review | Passed | Secure route, clinical report, documented outcome, completed task |
| Compliance review | Passed | Opportunities, dispositions, routing, and immutable events visible read-only |
| Billing readiness | Passed | Fifty recalculations reached ready; human review and billed disposition recorded |
| Audit evidence | Passed | Fifty immutable billing evidence snapshots |
| Navigation | Passed with minor issues | Role-specific primary navigation; forbidden patient-create link corrected |
| Mobile practicality | Limited pass | Existing responsive contracts pass; this run did not obtain reliable physical-device touch evidence |

## Defects corrected during acceptance

### A-01 — Staff provisioning failed at the database privilege boundary

- Severity: P0 before correction.
- Symptom: `/api/practice-members` returned `500` while creating or changing operational staff.
- Cause: the trusted server client lacked explicit privileges on `practice_members` and `practice_member_role_assignments` after the least-privilege grant migration.
- Correction: migration `20260801193000_version_1_0_practice_member_service_grant.sql` grants only the required service-role operations. Anonymous and authenticated privileges were not broadened.
- Result: all pilot operational roles were provisioned and least-privilege negative tests passed.

### A-02 — Care-plan history snapshot failed under protected RLS

- Severity: P0 before correction.
- Symptom: provider creation of an active care plan failed with permission denied on `care_plan_versions`.
- Cause: the snapshot trigger ran as the caller even though direct history writes are intentionally prohibited.
- Correction: the trigger-only snapshot function is `SECURITY DEFINER`; its direct execute privileges are revoked from public, anonymous, authenticated, and service-role roles.
- Result: provider care plans succeed while immutable history remains unavailable as a direct RPC or table write.

### A-03 — Closed months appeared to require active provider work

- Severity: P1 before correction.
- Symptom: billed rows showed `Awaiting Provider`, `Provider review is pending`, and `Review billing evidence` because preserved questionnaire tasks outranked the final month state.
- Cause: the worklist recalculated fallback blockers for an existing empty reason-code list and treated historical session tasks as active after billing closure.
- Correction: an existing monthly result now owns its reason-code state, and billed months ignore preserved questionnaire tasks for active prioritization while keeping the evidence intact. The terminal action is `View billing evidence`.
- Result: the provider dashboard ends with zero pending items and the explicit `Provider review is up to date` state.

### A-04 — Read-only roles were offered a forbidden action

- Severity: P1 before correction.
- Symptom: Compliance, Front Desk, and Read Only registry views displayed `Add patient`; the API correctly returned `403`.
- Cause: the registry rendered the action without checking resolved operational access roles.
- Correction: the link is rendered only for Organization Owner, Practice Administrator, Provider, Clinical Staff, and Coordinator roles. Authorization was not changed.
- Result: restrictive roles retain registry visibility without a predictable dead end.

## Hesitation log

| Page | Action | Why a normal user may hesitate | Priority | Disposition |
| --- | --- | --- | --- | --- |
| `/mfa` | First account MFA | A brand-new account briefly used interrupted-setup language before restart; returning verified users also traverse setup-oriented copy | P1 | Should fix during pilot; enrollment and verification still completed safely |
| `/setup/practice` | Decide owner/provider relationship | The administrator-only path is safe, but provider record versus provider login access remains conceptually separate | P1 | Should fix during pilot with clearer linked-state language |
| `/patients/new` | Create first patient | The form is long and exposes downstream enrollment detail before the core record feels established | P1 | Should fix during pilot through progressive disclosure, not a new workflow |
| Monthly questionnaire | Answer asthma rescue-use question | The legacy asthma question is globally seeded even for patients without an asthma condition | P1 | Should fix during pilot by condition-scoping it without altering stored response history |
| Patient registry | Interpret columns | Clinical eligibility and consent columns are useful to clinical staff but add noise for Front Desk and Read Only | P2 | Role-aware columns during pilot if feedback confirms need |
| `/dashboard/compliance` | Investigate a count | The page proves events exist but offers limited patient/actor/detail drill-down | P2 | Improve during pilot; raw evidence and audit packet already exist |
| `/settings` | Find an incomplete prerequisite | The page remains dense despite guided onboarding and readiness links | P2 | Add a compact section index/status summary only if pilot users struggle |
| Narrow screens | Scan registry/worklist tables | Responsive contracts pass, but wide evidence tables remain more comfortable on desktop | P2 | Observe during pilot; do not redesign preemptively |

## Top ten remaining improvements

| Rank | Category | Improvement | Reason |
| ---: | --- | --- | --- |
| 1 | Must fix before pilot | Prove hosted confirmation, invitation, resend, expiry, password reset, and recovery through approved SMTP | Account lifecycle is the only way external users can enter and recover access |
| 2 | Must fix before pilot | Promote and verify the exact accepted SHA and all 30 migrations in the hosted pilot environment | Local success cannot establish hosted schema, environment, redirect, or RLS state |
| 3 | Must fix before pilot | Complete backup/restore evidence, support ownership, security/vendor approval, and signed GO decision before PHI | These are operational safety gates, not missing software |
| 4 | Should fix during pilot | Replace setup-oriented MFA copy for verified returning users and remove false interrupted-state messaging | Reduces anxiety at the most security-sensitive step |
| 5 | Should fix during pilot | Condition-scope the legacy asthma rescue-frequency question | Prevents irrelevant questions and avoidable provider alerts |
| 6 | Should fix during pilot | Stage first-patient registration with one visible prerequisite at a time | Reduces training and form abandonment without changing workflow or schema |
| 7 | Should fix during pilot | Show provider clinical record and login access as two linked states | Prevents duplicate providers and missed physician invitations |
| 8 | Should fix during pilot | Add patient/actor/detail drill-down to compliance evidence rows | Makes investigation faster while preserving read-only access |
| 9 | Post-pilot enhancement | Make patient registry columns role-aware and use compact narrow-screen cards | Improves Front Desk and phone scanning but does not block a supported desktop pilot |
| 10 | Post-pilot enhancement | Add a compact Settings section index and completion summary | Reduces searching after onboarding; existing direct readiness links are sufficient for pilot |

## Validation results

| Gate | Result |
| --- | --- |
| Fresh migration replay | Passed: 30/30, from empty, no seed data |
| Empty-state verification | Passed: 0 practices and 0 patients after replay |
| Database lint | Passed: no schema warnings or errors |
| pgTAP | Passed: 5 files, 93 assertions |
| TypeScript | Passed: `tsc --noEmit` |
| ESLint | Passed |
| Full regression suite | Passed: 37 commands |
| Production build | Passed: Next.js 16.2.10, 64 static pages generated |
| Focused acceptance regressions | Passed: billed-month closure, role-aware patient creation, service grants |
| `git diff --check` | Passed |

Non-blocking warnings observed:

- Node reports the repository's existing module-type reparsing warning when individual TypeScript modules are executed directly by Node tests.
- The regression suite reports 4,583 PASS ICD records intentionally unmapped by design; artifact validation still passed for 98,186 CMS rows.
- Supabase CLI 2.109.1 reports that 2.111.0 is available.
- Next development mode reports the existing smooth-scroll advisory. No production build warning resulted.

## Final recommendation

# GO WITH MINOR KNOWN ISSUES

The application candidate is coherent enough that additional pre-pilot feature engineering now has lower expected value than structured feedback from a friendly practice. The complete synthetic month, separate-role boundaries, immutable evidence, clean database replay, regression suite, and production build are proven locally.

The recommendation is conditional only on completing the already-documented hosted and organizational release gates. The remaining product issues are learnability and efficiency improvements, not known blockers to completing the supported MVP workflow. Keep the feature freeze active, promote the accepted candidate deliberately, collect hosted evidence, and begin the first synthetic external pilot before expanding scope.
