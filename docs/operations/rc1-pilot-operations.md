# RC1 pilot operations runbook

This runbook covers the implemented RC1 workflow for one practice, one provider, one coordinator, one administrator, and 50–100 patients. Use the application UI; never repair membership, ownership, time, audit, or evidence directly in SQL.

## Operating rules

- Use a unique named account for every person. Never share the founder, provider, coordinator, service-role, or recovery account.
- Require MFA and minimum-necessary role assignment before PHI access.
- The Organization Owner is the protected founder/owner role. Founder override is for administration and recovery, not routine coordinator work.
- The Primary Responsible Provider (PRP) records clinical ownership. It is separate from application permissions and must not be changed merely to grant access.
- Record actual CCM work and actual elapsed minutes. Never backfill fictional activity to make a month billable.
- Do not include PHI in ordinary email, tickets, chat, or screenshots. Send only the application-generated secure link through an approved channel.
- Never delete patients, audit events, detector evidence, or billing snapshots to correct workflow. Use implemented state transitions and document the reason.

## Onboard a new practice

Owner: release operator and intended Organization Owner

1. Confirm the launch-day platform, backup, Auth, SMTP, and compliance gates are signed.
2. Have the intended owner create their own account at the canonical production URL.
3. Verify the confirmation email by provider message ID; the owner opens only the newest link.
4. The owner signs in, configures TOTP MFA, and completes the MFA challenge.
5. At `/setup/practice`, enter the real practice name, organization type, time zone, phone, optional address/logo URL, coordinator defaults, and notification defaults.
6. Answer whether the owner personally provides CCM:
   - **Yes:** complete the provider information and verify the linked active provider profile is created.
   - **No:** add the first treating provider before setup can finish.
7. Verify the owner is an active Organization Owner/Practice Administrator member, an active provider exists, and the application does not show an empty-practice dead end.
8. Create one synthetic first patient and complete a synthetic workflow before real patient entry.

Expected result: the owner reaches the application with an active practice, membership, provider, and guided next action without manual database work.

If unsuccessful: stop at the failing step. Do not create duplicate practices or users. Capture redacted browser/API error, Auth/database log correlation, IDs, and UTC timestamp; then use the exact recovery action for that step.

## Invite and manage staff

Owner: Organization Owner or authorized Practice Administrator

1. Open **Settings → Practice Staff**.
2. Enter the staff member's individual work email and choose the least-privilege operational role.
3. Select **Invite staff**.
4. Verify the pending invitation and the custom SMTP provider message ID/final status. “Invitation requested” is not delivery proof.
5. The recipient opens the newest invitation, sets credentials as prompted, configures MFA, and signs in as their own identity.
6. Verify membership becomes active and test one allowed and one denied operation.
7. For provider staff, verify or create the proper provider linkage through the implemented workflow; do not make a coordinator a provider for convenience.

Role guide:

| Role | Pilot purpose |
| --- | --- |
| Organization Owner | Protected practice ownership and ultimate administrative recovery. |
| Practice Administrator | Routine practice/staff configuration without founder reassignment/removal. |
| Provider | Clinical ownership, care-plan/provider review, and clinical decisions. |
| Coordinator | Assigned daily queue, outreach, documentation, time, routing, and task completion. |
| Clinical Staff | Assigned clinical support without coordinator claiming privileges unless separately authorized. |
| Front Desk | Patient registry/read workflow only; no clinical, billing, compliance, or staff writes. |
| Compliance Administrator | Compliance/evidence review; no clinical, billing, or staff writes. |
| Billing Administrator | Billing readiness and review; no clinical or staff writes. |
| Read Only | Patient/knowledge read access only. |

### Failed invitation

1. Confirm the address, invitation record, Supabase Auth event, SMTP provider message ID, and provider status.
2. If rejected, correct the address/domain problem before resending.
3. If deferred, wait for the provider's final status or escalate under the email-provider procedure; do not claim delivery.
4. If expired or previously used, select **Resend** in Practice Staff and instruct the user to open only the newest link.
5. Select **Cancel** for an incorrect or unauthorized invitation.
6. Record the final membership state and ensure no duplicate active membership exists.

### Staff turnover

1. Confirm the termination/effective time and name the transfer owner.
2. Reassign open patient work, provider/coordinator assignments where appropriate, work items, and operational responsibilities before removal when possible. Do not change patient PRP merely because staff permissions change.
3. Disable the membership immediately at the effective time.
4. Revoke sessions/ban the Auth identity through the approved administrator procedure when access must end immediately.
5. Verify denied application and Data API access.
6. Preserve historical membership, audit, time, and evidence relationships.
7. Remove the membership only after transfer and compliance review; never remove the protected Organization Owner without the approved ownership-transfer procedure.
8. Complete access-review evidence and rotate any shared external credentials the departing person knew.

## Onboard the first patients

Owner: Practice Administrator or authorized clinical staff

1. Open **Patients → Add patient**.
2. Enter the minimum identity/contact information. Date of birth may be typed; the calendar initially opens to the Medicare-age year without prefilling a date.
3. Select the active PRP. Stop if the provider list is empty; return to provider onboarding rather than creating an ownerless patient.
4. Select applicable chronic conditions and clinical starter kits. Defaults are editable later.
5. Save the patient and verify the workspace identifies the next onboarding action.
6. Complete eligibility review and document the actual determination.
7. Complete required intake and care-plan information; have the provider review/approve as required.
8. Record consent using the real effective date and method.
9. Activate CCM enrollment only after eligibility, consent, PRP, and care-plan prerequisites are correct.
10. Verify patient, practice, provider, coordinator scope, starter-kit content, and initial work item before moving to the next patient.

For bulk pilot onboarding, add patients in small batches, review failures after each batch, and never import real PHI through an unapproved channel.

## Daily/monthly coordinator workflow

Owner: Coordinator or authorized Clinical Staff

1. Open **My Work Today** and work from the prioritized queue.
2. Open the next patient/task. The task is the workspace; do not navigate to another screen to finish it.
3. Read **why this needs attention**, the monthly progress, assigned provider/coordinator, and relevant clinical context.
4. Perform the actual action: outreach, monitoring questions, education, follow-up, or coordination.
5. Document the outcome and actual minutes. Use the interaction date on which work occurred.
6. Route to the provider only when clinical review/decision is required; include the concise reason and supporting evidence.
7. Complete or defer the task using the real status and reason. A durable deferral must reappear at the appropriate time and remain auditable.
8. Confirm automatic return to **My Work Today**, then use **Next patient** when appropriate.
9. Review monthly progress; address only genuine gaps. Opportunity suggestions require human acceptance before a work item is created.
10. At month end, confirm completed work, actual time, unresolved tasks, provider review, consent/enrollment, and evidence before billing review.

Do not complete a task merely to clear the queue. If outreach fails, document the attempt and outcome; do not invent a successful contact.

## Provider review

Owner: treating Provider

1. Open **Provider Review** from the role-appropriate navigation.
2. Review the patient, care plan/month summary, coordinator documentation, escalation reason, and evidence.
3. Choose the implemented decision:
   - approve when clinically appropriate; or
   - request coordinator changes with a specific comment.
4. Confirm the decision, actor, timestamp, and resulting workflow status are recorded.
5. Verify the coordinator can see requested changes and that a completed approval does not remain in an ambiguous pending state.

The provider must use their own account. An owner/founder session is not substitute evidence for provider review.

## Billing review

Owner: Billing Administrator or authorized practice operator

1. Open **Billing Review** for the applicable month.
2. Recalculate readiness and inspect each missing/failed criterion.
3. Resolve source workflow gaps through the clinical/operational workflow; do not edit an evidence snapshot.
4. When evidence is complete, select **Mark reviewed** and inspect the immutable billing evidence.
5. Select **Mark billed** only after the external claim action actually occurs.
6. Use **Place hold** with a reason for unresolved eligibility, consent, evidence, time, or external billing issues.
7. Retain the external claim/reference according to the approved procedure without placing payer secrets in CCM Assistant notes.

CCM Assistant produces billing-ready documentation; it does not independently prove payer payment or replace billing judgment.

## Compliance review

Owner: Compliance Administrator

1. Open **Compliance** using an independent compliance identity.
2. Review enrollment/consent, PRP, care plan, interactions, actual time, provider decisions, opportunity history, task outcomes, billing evidence, and audit chronology.
3. Verify evidence is attributable, chronologically consistent, tenant-scoped, and immutable where designed.
4. Record any exception outside the immutable evidence with owner, corrective action, due date, and approval.
5. Do not rewrite historical clinical or billing evidence to resolve a finding.
6. Sample role access and departed-user denial during each monthly review.

## Failed patient email

1. Do not claim the patient received a message based only on an accepted API request.
2. Check the application delivery state, provider message ID, provider status/reason, recipient, and UTC time.
3. For rejection, correct the destination/provider issue and create a new approved delivery.
4. For defer, monitor until final status or escalate to the provider.
5. If application email is disabled or unavailable, copy the secure link and deliver it through the approved secure channel.
6. Never put diagnosis, care-plan content, or other PHI in an ordinary email subject/body.
7. Document the communication method and actual outcome in the patient workflow.

## Patient withdrawal

Owner: authorized clinical/practice operator with compliance review

1. Confirm the patient's request, effective time, identity, and applicable practice policy.
2. Document the reason and source in the implemented eligibility/consent notes.
3. Set consent to revoked and update enrollment to the appropriate paused/inactive/declined state.
4. Mark the patient inactive when appropriate; do not delete the patient.
5. Close or reclassify pending tasks/deliveries and prevent new outreach after the effective time.
6. Recalculate billing readiness and place the month on hold if required.
7. Preserve completed work, time, provider decisions, audit trail, and immutable evidence.
8. Follow the approved record-retention and patient-communication procedure; withdrawal from CCM is not automatic authorization to erase records.

## Month-end close

1. Coordinator resolves or documents all due work and failed outreach.
2. Provider resolves all routed clinical reviews.
3. Compliance reviews exceptions and access.
4. Billing recalculates readiness and marks reviewed/held/billed using actual external status.
5. Administrator verifies staff access, provider/coordinator coverage, Auth/email failures, backup status, and incident register.
6. Owner signs the monthly pilot review: patients active, patients withdrawn, completed work, unresolved risks, billed/held counts, and support issues.

