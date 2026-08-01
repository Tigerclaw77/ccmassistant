# CCM Assistant RC1 pilot package

Audience: one friendly pilot practice with one provider, one coordinator, one administrator, and 50–100 patients.

This package is not authorization to enter PHI. The release owner must first complete `docs/release/rc1-launch-day-checklist.md` and record a signed GO against the exact RC1 tag, SHA, Vercel deployment, Supabase project, and migration level.

## 1. Practice onboarding packet

### Before the kickoff

- □ Practice signs the pilot agreement and required BAA.
- □ Practice names the Organization Owner, Practice Administrator, treating Provider, Coordinator, backup contact, privacy/security contact, and billing/compliance contacts.
- □ Practice confirms the initial patient limit, launch date, support hours, escalation path, success criteria, and exit process.
- □ Practice approves its CCM eligibility, consent, clinical escalation, emergency, documentation, billing, retention, and withdrawal procedures.
- □ Each user receives an individual work email account and an approved authenticator application.
- □ No shared accounts, shared passwords, or ordinary email containing PHI will be used.
- □ The release owner confirms custom SMTP, backup/PITR, isolated restore, vendor approvals, and production launch gates.

### Kickoff agenda

1. Explain the pilot boundary: one adaptive CCM workflow, human clinical judgment, and no automatic billing decision.
2. Explain roles: application access is separate from the patient's Primary Responsible Provider.
3. Demonstrate sign-in, email confirmation, TOTP MFA, password recovery, and the secure support channel.
4. Create the practice through the first-run wizard.
5. Confirm the active provider, owner membership, time zone, communication defaults, and starter kits.
6. Invite the administrator, provider, and coordinator through **Settings → Practice Staff**.
7. Use synthetic data to create, enroll, contact, document, route, review, and close one complete patient month.
8. Review billing-ready evidence, compliance evidence, withdrawal, failed email, and support procedures.
9. Begin real-patient onboarding only after the signed GO and in a small approved batch.

### Account setup handout

- Open only the newest confirmation, invitation, or recovery link.
- The application requesting an email is not proof it arrived; contact support if no message appears.
- Configure TOTP using Microsoft Authenticator, Google Authenticator, 2FAS, Authy, or 1Password.
- Never send a QR code, TOTP secret, OTP, password, recovery link, access token, or patient information to support.
- If a link is expired or used, return to the application and request a new one; do not repeatedly reuse it.
- Sign out and notify the administrator immediately if a device or account may be compromised.

## 2. Practice Administrator checklist

### Initial setup

- □ Confirm canonical URL is `https://www.ccmassistant.com` and TLS is valid.
- □ Complete individual confirmation, MFA, practice profile, provider bootstrap, starter-kit defaults, and synthetic first patient.
- □ Confirm practice name, time zone, phone, optional address/logo URL, coordinator settings, and notification defaults.
- □ Confirm at least one active treating provider exists before patient entry.
- □ Invite each staff member with the least-privilege role and verify provider delivery status.
- □ Test one allowed and one denied action for each independent account.
- □ Confirm Production Persona Mode is unavailable.

### Patient onboarding

- □ Add patients in small batches and review each batch before continuing.
- □ Select one active Primary Responsible Provider for every patient.
- □ Document two qualifying chronic conditions where clinically supported.
- □ Complete structured eligibility, provider attestations, consent, clinical intake, care plan, and enrollment.
- □ Select condition-appropriate starter guidance and confirm coordinator assignment/scope.
- □ Never activate a patient merely to clear a readiness warning.
- □ Never use ordinary email, CSV transfer, chat, or support tickets for PHI unless explicitly approved and protected.

### Weekly administration

- □ Review active, pending, disabled, and expired invitations.
- □ Review staff roles, departed-user access, and backup coverage.
- □ Review failed Auth/patient email and provider outcomes.
- □ Review backup/PITR status and open incidents.
- □ Review unresolved patient onboarding prerequisites and open work.
- □ Record operational exceptions with owner, due date, expiry, and compensating control.

### Staff turnover

- □ Record effective time and transfer owner.
- □ Reassign open work/responsibilities without changing patient PRP merely for access.
- □ Disable membership and revoke sessions at the effective time.
- □ Verify denied access.
- □ Preserve historical membership, audit, time, and evidence.
- □ Remove only after transfer/compliance review; never improvise ownership transfer.

## 3. Coordinator checklist

### Start of day

- □ Sign in with the coordinator's own account and complete MFA.
- □ Open **My Work Today**.
- □ Confirm active practice, assigned scope, current month, and urgent/due items.
- □ Start with the highest-priority real patient need, not a configuration screen.

### For every patient

- □ Review what needs attention, why, monthly progress, PRP, and relevant clinical context.
- □ Perform only clinically appropriate CCM work within practice protocol.
- □ Record actual outcome, occurrence date, and actual elapsed minutes.
- □ Route to the provider when clinical review or a decision is required.
- □ Complete or defer with the true status, reason, and follow-up date.
- □ Confirm return to **My Work Today** and proceed to the next patient.
- □ Never complete a task solely to clear the queue or create work solely to reach a billing threshold.

### Outreach and email

- □ Keep PHI out of ordinary subject/body text.
- □ Treat provider message ID/final status as delivery evidence; UI acceptance alone is insufficient.
- □ Document unsuccessful outreach truthfully.
- □ Use only the approved secure-link/manual delivery procedure when application email is unavailable.
- □ Follow practice emergency/crisis protocol rather than relying on asynchronous CCM messaging.

### Month end

- □ Resolve or document all due work and unsuccessful contacts.
- □ Verify actual time entries and unresolved provider routes.
- □ Confirm consent/enrollment/PRP/care plan remain current.
- □ Do not mark billing reviewed/billed unless authorized for that separate role and the external action occurred.

## 4. Provider checklist

### Initial setup

- □ Use an independent Provider account with MFA; do not rely on founder impersonation.
- □ Confirm linked provider identity, credentials, practice, and patient panel.
- □ Confirm the practice's clinical escalation and emergency protocols.

### Clinical review

- □ Open **Provider Review/Attention**.
- □ Review patient identity, coordinator summary, clinical intake, care plan, current changes, escalation reason, and evidence.
- □ Approve only when clinically appropriate or request specific changes.
- □ Confirm decision, actor, timestamp, comment, and final workflow state.
- □ Resolve requested revisions promptly so they return clearly to the coordinator.
- □ Do not use an authorization role change to alter clinical ownership.

### Month end

- □ Resolve all routed reviews and clinical escalations.
- □ Confirm care-plan/provider decisions are attributable.
- □ Review any patient safety or protocol exception with the practice.
- □ Do not represent billing readiness as a clinical attestation beyond the implemented evidence.

## 5. Billing and compliance handoff

### Billing reviewer

- □ Recalculate readiness for the month.
- □ Resolve source workflow gaps through the proper workflow; never edit an evidence snapshot.
- □ Mark reviewed only when evidence is complete.
- □ Mark billed only after the external claim action actually occurs.
- □ Place a hold with a reason for unresolved eligibility, consent, time, evidence, or payer issues.

### Compliance reviewer

- □ Review enrollment/consent, PRP, care plan, interaction/time, provider decisions, opportunity/task history, billing evidence, and audit chronology.
- □ Verify evidence is attributable, tenant-scoped, chronologically consistent, and immutable where designed.
- □ Sample allowed/denied role access and departed-user denial.
- □ Record corrective action without rewriting historical clinical/billing evidence.

## 6. Support checklist

### Intake

- □ Record reporter, role, practice, affected workflow, UTC time, browser/device, severity, and safe reproduction summary.
- □ Obtain only redacted request/correlation IDs and screenshots without PHI/tokens.
- □ Never ask for passwords, OTPs, MFA secrets, magic/recovery links, service keys, or database dumps.
- □ Classify the issue as browser/application, Supabase Auth/database, SMTP/provider, Vercel, practice workflow, security/privacy, or external vendor.

### Severity

| Severity | Definition | Action |
| --- | --- | --- |
| P0 | PHI exposure, cross-tenant access, audit/evidence corruption, widespread unsafe access, or unavailable core workflow with no safe alternative. | Stop affected processing, invoke incident lead, restrict access, preserve evidence, and evaluate rollback/breach procedure immediately. |
| P1 | Pilot-critical account/workflow cannot complete, incorrect clinical/billing terminal state, or recovery control fails. | Pause affected workflow, escalate same day, fix only the proven blocker, and fully retest. |
| P2 | Usability/efficiency issue with safe supported workaround. | Document workaround and observe during pilot; preserve feature freeze. |
| P3 | Future enhancement. | Record outside the RC1 change window. |

### Failed invitation or Auth email

- □ Determine whether the Auth user/request exists.
- □ Locate Supabase Auth correlation and SMTP provider message ID.
- □ Record provider delivered/deferred/rejected status and exact reason.
- □ Correct address/domain/configuration before resending.
- □ Cancel incorrect or unauthorized invitations.
- □ Tell the user to open only the newest link.
- □ Verify final membership/session state without direct SQL repair.

### Security/privacy event

- □ Stop further disclosure or unsafe access.
- □ Preserve logs and immutable evidence; do not “clean up” history.
- □ Revoke affected sessions/credentials and rotate exposed secrets through approved procedures.
- □ Notify security/privacy and practice contacts through the incident channel.
- □ Follow the approved breach-assessment and communication procedure.

## 7. Rollback checklist

- □ Declare the release/workflow incident and pause pilot activity.
- □ Record failing tag, SHA, Vercel deployment, Supabase project/migration, UTC time, request IDs, and affected scope.
- □ Preserve Vercel, Supabase Auth/database, SMTP, application, and audit evidence.
- □ Determine whether the fault is application-only, configuration, migration, data integrity, vendor, or security.
- □ Confirm the previous Vercel deployment is compatible with the current forward database schema.
- □ For application-only failure, use the approved previous deployment/Instant Rollback and verify its historical environment values remain valid.
- □ For migration failure, stop; never edit an applied migration or ledger row. Prefer a reviewed forward correction when safe.
- □ For data corruption, restore into isolation, prove scope/integrity, and obtain two-person approval before any production write.
- □ Do not restore production over the current project without isolated proof and explicit RPO/data-loss approval.
- □ Run Auth, authorization, patient, coordinator, provider, compliance, billing, audit, and log checks before reopening.
- □ Communicate status to the practice and complete incident/privacy follow-up.

Detailed procedures: `docs/operations/rc1-production-deployment.md` and `docs/operations/rc1-backup-recovery.md`.

## 8. Known limitations

Accepted for a closely supported pilot:

1. Direct role-hidden URLs may render limited data already within practice-member read scope; server mutations and restricted compliance operations remain the authorization boundary.
2. Practice phone information appears in onboarding and billing settings; the administrator should confirm the billing contact during setup.
3. Some audit displays show actor UUIDs instead of friendly names; attribution remains preserved.
4. Compliance presentation is event/evidence oriented rather than a complete patient-centered timeline.
5. Wide patient/evidence tables are best used on desktop during the pilot.
6. The public `/demo` page is an unfinished marketing page and is not pilot training.
7. Optional patient email requires separate Resend approval; otherwise use the approved secure-link/manual delivery procedure.
8. Stripe and OpenAI are not required or approved RC1 dependencies.

Not accepted:

- missing custom SMTP proof for account lifecycle;
- missing immutable RC1 tag/SHA/deployment identity;
- missing hosted migration/security validation;
- missing backup/restore proof;
- missing PHI/vendor/legal approvals;
- any open P0/P1 or unexplained authorization/audit/evidence failure.

## 9. Pilot completion record

Practice: `______________________________`

RC1 tag/SHA: `______________________________`

Vercel deployment: `______________________________`

Supabase project/final migration: `______________________________`

Pilot start: `______________________________`

Named owner/provider/coordinator/administrator: `______________________________`

Support and incident contacts: `______________________________`

Approved initial patient count: `______________________________`

Founder approval: `______________________________`

Security/compliance approval: `______________________________`

Practice approval: `______________________________`

