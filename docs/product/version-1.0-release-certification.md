# Version 1.0 Release Certification

Assessment date: 2026-08-01

Decision: **GO WITH CONDITIONS**

Confidence score: **91/100**

## Executive summary

The feature-frozen candidate is suitable for a limited, closely supported pilot after the hosted and operational gates below are completed against one immutable SHA. No unresolved application P0 or P1 was found after correction and retest.

This certification did not trust the earlier acceptance conclusion. It replayed all 30 repository migrations into an empty local Supabase database, ran 93 pgTAP assertions and the 37-command regression suite, exercised a new owner/practice/patient through a complete synthetic CCM month, and separately exercised a real local invitation email through Supabase Auth, MFA, password creation, membership activation, and coordinator access.

Four genuine P1 defects were reproduced before they were fixed. The fixes are narrow and have regression coverage. One repeatability defect was also found in a pgTAP fixture and corrected. Hosted production readiness remains unproven; this document is not approval to use PHI or invite an external practice before those conditions pass.

## Proven defects and disposition

| Severity | Location | Evidence | Resolution | Regression protection |
| --- | --- | --- | --- | --- |
| P1 | First-patient creation | Selecting an impossible active enrollment state created the patient and conditions before enrollment validation failed; a retry then hit the patient unique constraint. | New-patient creation no longer offers the impossible active state. A post-create setup failure returns to the existing patient for recovery instead of attempting a duplicate. | `scripts/rc007-mvp-lock.test.mjs` plus live orphan recovery and a zero-orphan database query. |
| P1 | Monthly question planning | The asthma rescue-inhaler question appeared for diabetes/hypertension patients because it had no condition scope. | Added the existing asthma content as a complete runtime module and scoped the question to asthma. | `scripts/session-engine.test.mjs`, `scripts/question-bank.test.mjs`, catalog determinism checks, and live monthly-session inspection. |
| P1 | Structured staff interview | A quick Continue after an auto-submitting selection could issue an overlapping PATCH and leave a stale validation error. | Added a synchronous in-flight mutation guard without changing interview state semantics. | `scripts/session-integration.test.mjs` and a completed live intake/check-in. |
| P1 | Staff invitation acceptance | After the email callback and MFA enrollment, the acceptance page lost the invitation ID during server rendering and reported an incomplete link. | Resolve the invitation ID from the browser URL after hydration while keeping the page statically buildable. | `scripts/rc005-pilot-gate.test.mjs`, production build, and a complete live coordinator invitation/activation. |
| P2 | pgTAP repeatability | An ownership contract counted administrator assignments from the entire populated database, so it failed after a real invited user existed. | Scoped the assertion to its two fixture practices. No schema or security behavior changed. | The same 93 assertions now pass both immediately after reset and after the acceptance workflow. |

No applied migration was edited. The only acceptance migration is the forward-only `20260801193000_version_1_0_practice_member_service_grant.sql`; its SHA-256 is `690F37483F2B3EF8778257E7DA1A5C80D580CAD1B391BF2642D491D0EC612CE2`. It narrowly grants the service role the membership operations already used by the server and makes the care-plan snapshot trigger function a non-callable, fixed-search-path security definer. Direct execution remains revoked.

## Independent validation evidence

### Database

- Empty-database replay applied `001` through `027` and all three timestamped forward migrations in repository order. No placeholder was skipped.
- Local migration history contains 30 matching entries.
- pgTAP: 5 files, 93 assertions, pass on the populated acceptance database.
- Database lint: zero warnings.
- Local security advisor: zero findings.
- Public application tables retain RLS; anonymous table access remains revoked.
- Every reviewed `SECURITY DEFINER` function has an explicit search path and intended execution grants.
- The completed patient has one enrollment and one immutable PRP-history record; there are no patients without enrollment.
- Billing review produced one reviewed patient-month, one immutable evidence snapshot, and 13 expected evidence sections.
- Direct update attempts against `audit_events` and `billing_evidence_snapshots` were rejected by immutable-record triggers.

### Application and workflow

- New account confirmation was received in local Mailpit and the confirmation link succeeded.
- MFA enrollment completed through QR/manual key, six-digit verification, interruption-safe state, and AAL2 access.
- Practice, owner, first provider, first patient, eligibility, intake, care plan, provider approval, consent, enrollment, monthly check-in, public patient response, coordinator review, 20 minutes of documented work, billing recalculation, review, and evidence preservation completed without manual SQL.
- Billing moved from missing practice evidence to ready-to-bill only after the required attestations and NPI were present.
- The provider queue returned to a clean terminal state after review.
- A coordinator invite produced an actual local email, completed MFA and password setup, activated the canonical coordinator assignment, and entered the practice.
- Coordinator attempts to change practice configuration were denied by server authorization. Billing, provider, compliance, role, tenant, and Persona Mode boundaries also pass automated authorization contracts.

### Repository validation

- TypeScript: pass.
- ESLint: pass.
- Next.js 16.2.10 production build: pass; 64 routes generated.
- Full regression: 37 commands, pass.
- Clinical review package: regenerated deterministically after the asthma scope correction; 81 packets and 89 files pass byte checks.
- `git diff --check`: pass.
- Expected non-blocking warning: 4,583 PASS ICD records remain unmapped by design.

## Remaining issues

### P0

None known.

### P1

None known in the repository candidate after the fixes above.

### P2 — accepted for a supported pilot

| Location | Risk accepted for pilot | Mitigation |
| --- | --- | --- |
| Patient form initial load | Provider/coordinator controls can briefly show an empty loading state before practice context resolves. | Do not submit until loading completes; automated and live bootstrap tests verify eventual population. |
| Direct role-forbidden URLs | A coordinator can manually open settings or billing presentation pages even though navigation hides them. Server mutations are denied, compliance access is denied, and the displayed practice/patient data is already within practice-member read scope. | Treat route-level presentation gating as a pilot usability fix; retain server authorization as the security boundary. |
| Practice phone data | Onboarding persists the practice phone column while Settings edits the billing-settings phone value. | Confirm the billing contact once in Settings during hosted onboarding. Consolidate after pilot feedback. |
| Audit labels | Condition history shows a user UUID for “Added by” rather than a human label. | Records remain attributable; improve display during pilot if coordinators report confusion. |
| Recovery edge case | A browser session whose Auth user is deleted by a local reset can show a raw Supabase user/sub-claim error. | Operational resets should include sign-out/new browser state. This is not a normal hosted-user lifecycle. |
| Acceptance automation | The 50-patient harness requires a bootstrapped owner/practice and is not a single-command pristine-browser fixture. | The database replay, pgTAP, regressions, and the independent one-patient browser month provide separate evidence. Improve harness isolation post-pilot. |
| Compliance presentation | The compliance page is workflow-event focused rather than a complete patient-centered timeline. | Immutable audit and evidence remain available; use the evidence packet and database audit procedures during the limited pilot. |

### P3

- Replace raw actor UUIDs with authorized display labels where useful.
- Add route-level redirects for role-hidden workspaces to reduce confusion.
- Make the large-panel acceptance harness create and clean up its own isolated practice.

## Conditions that must pass before the first real pilot

These are release and operational conditions, not missing product features:

1. Freeze and review the exact working tree, commit it, and deploy one immutable SHA to the hosted development/staging environment.
2. Apply the three pending forward migrations in order: `20260801160641`, `20260801170717`, `20260801193000`. Re-run hosted RLS, grants, function, tenant-isolation, advisor, and migration-ledger checks.
3. Deploy the same SHA through the normal Vercel integration and prove environment scopes, production Persona Mode absence, runtime logs, canonical domain behavior, and rollback access.
4. Configure and prove Supabase Auth Site URL, narrow redirect allowlist, approved templates, 12-character password policy, TOTP, leaked-password protection, session/rate-limit policy, and MFA recovery.
5. Configure approved custom SMTP. Retain provider message IDs and delivery/defer/reject evidence for confirmation, resend, invitation, password reset, expired/used links, and wrong-account recovery.
6. Complete an isolated backup/restore drill and approve achieved RPO/RTO.
7. Obtain the required Supabase, Vercel, and email-vendor PHI/BAA approvals plus the practice agreement, risk analysis, retention, incident, training, and support signoffs.

## Shortest path to pilot

1. Founder approves the release inventory and authorizes the existing commit/promotion checklist.
2. Freeze the SHA; rerun the recorded local gates from that SHA.
3. Apply the three forward migrations to hosted development/staging and validate database security.
4. Configure Auth, SMTP, redirects, and Vercel values; deploy that same SHA.
5. Run `docs/release/hosted-validation-checklist.md`, including the real provider-message and restore evidence.
6. Perform one 5–10 patient synthetic hosted smoke month with independent owner, coordinator, provider, billing, and compliance identities.
7. Sign `docs/release/pilot-go-no-go.md`, invite one friendly practice, begin with synthetic patients, and introduce PHI only after every legal/security gate is approved.

## Final recommendation

**GO WITH CONDITIONS.** The repository has no known remaining software blocker for a limited pilot. It is not yet a production-pilot GO because the candidate is uncommitted/unhosted and the external authentication, SMTP, backup/restore, PHI, and legal controls have not been demonstrated against the final SHA. Additional feature engineering now has lower value than completing those release controls and obtaining founder feedback from the first supported practice.
