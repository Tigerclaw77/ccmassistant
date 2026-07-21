# RC-003 Pilot Checklist

Prepared: July 21, 2026

Status definitions:

- **Ready**: implemented and covered by current local validation.
- **Needs Review**: implemented or intentionally scoped, but founder or hosted end-to-end evidence remains. It is not automatically a commit blocker.
- **Blocked**: a verified gap prevents the intended pilot workflow or safe release packaging.

| Area | Status | Evidence or required review |
| --- | --- | --- |
| Owner onboarding | **Ready** | AAL2 users without membership enter per-user bootstrap; organization, practice, owner membership, canonical roles, profile, and audit event are atomic and tested. |
| Provider onboarding | **Ready** | Provider-owner and administrator-only paths both provision an active first provider before patient creation; interrupted provisioning recovers to onboarding. |
| Coordinator workflow | **Ready** | The patient task workspace supports start, outcome documentation, actual affirmed time, PRP routing, defer with follow-up, completion, automatic return to My Work Today, and optional next-patient continuity. |
| Patient workflow | **Needs Review** | Staff-facing patient creation, enrollment, PRP assignment, eligibility, care planning, check-in, and time flows exist. A dedicated patient portal is deferred; pilot scope must confirm the secure-link patient path is sufficient. |
| Provider review | **Needs Review** | Care-plan review and secure PRP work routing are implemented and tested. Alternate-recipient selection remains outside this release and must be accepted as pilot scope. |
| Billing review | **Ready** | Existing billing review remains explicit and presentation-only; the new detector does not create billing actions or automatic time. Regression and Stripe sandbox contracts pass. |
| Compliance review | **Ready** | The read-only compliance workflow exposes immutable decisions, rules, routing, and time attestations under existing owner/administrator capability checks. |
| Invitation flow | **Needs Review** | Invitation creation, expiry, resend, acceptance, delivery-failure status, role boundaries, and audit behavior are tested. Hosted Supabase Auth sender/template/redirect delivery still needs an end-to-end inbox test. |
| Password reset | **Needs Review** | The UI handles Supabase errors and invalid/expired sessions safely. Hosted email delivery and `/reset-password` redirect allow-list behavior have not been reconfirmed end to end for RC-003. |
| MFA | **Ready** | Guided TOTP enrollment, verified-factor preservation, duplicate cleanup, interrupted Continue/Restart/Cancel paths, and AAL2 enforcement pass tests. |
| Persona mode | **Ready** | Development-only dual gate, session-only overlay, production header rejection, real authentication/RLS preservation, reset behavior, and no database/audit persistence pass tests and production build. |
| Opportunity detector | **Ready** | Deterministic versioned rules, exact evidence, immutable fingerprints, stale failure, retry/replay behavior, no threshold-only work, and service-only persistence pass local tests. |
| Work queue | **Ready** | Prioritization, scoping, filters, assignment, queue groups, in-place task execution, documented completion, preserved return context, and optional next-patient continuity are implemented and tested. |
| First patient | **Ready** | The first active provider is available and preselected as PRP; DOB remains blank while opening at the Medicare-aware calendar view; manual entry and validation remain intact. |
| First CCM month | **Needs Review** | Legacy month workflow and the RC-003 coordinator task lifecycle pass automated validation; one complete hosted synthetic month remains a pre-pilot operational review. |
| Security | **Ready** | Applied migrations `024`-`026` match shared development exactly; hardening is forward-only in unpublished `027`; local RLS, grant, tenant, immutability, security-definer, authorization, and fresh-replay contracts pass. |
| Hosted validation | **Needs Review** | Shared development is through migration `026`; `027` is intentionally unapplied. Apply and validate it only after commit/founder approval using the hosted preflight, backup, migration, advisor, authorization, and workflow gates. |

## Current automated evidence

- TypeScript: passed.
- ESLint: passed with zero lint warnings.
- Regression suite: passed all 33 commands.
- Production build: passed with the development persona flag set.
- Local migrations: `001` through `027` present in order.
- Local database lint: no schema errors.
- pgTAP: 4 files and 66 assertions passed.
- Known informational warning: 4,583 ICD `PASS` rows are intentionally unmapped by design.

## Founder decisions still required

- Approve the validated coordinator work-item completion interaction for pilot use.
- Confirm the pilot's patient-facing scope is the existing secure-link workflow rather than a patient portal.
- Confirm PRP-only default routing is sufficient for the pilot; alternate-recipient routing remains deferred.
- Approve applying migration `027` to shared development after the repository candidate is committed and reviewed.
