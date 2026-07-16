# Pilot Practice Checklist

Use this checklist for one controlled practice after the hosted staging smoke test passes. Store signed evidence outside the repository.

## Before onboarding

- [ ] Hosted release record identifies commit, application URL, Supabase project, migrations `006` through `023`, operator, and rollback owner.
- [ ] HTTPS, exact Auth URLs, custom SMTP, TOTP MFA, session policy, backups, restore drill, logging redaction, and public-route rate limiting are evidenced.
- [ ] All database constraints are validated and cross-practice isolation tests pass.
- [ ] Vendor agreements, risk review, incident process, retention policy, and practice approval are complete.
- [ ] Pilot roster, minimum necessary roles, billing owner, security contact, success measures, and stop authority are named.
- [ ] The two-month hosted synthetic smoke test passes without developer intervention.

## During onboarding

- [ ] Create the owner Auth account and bootstrap the practice exactly once.
- [ ] Add providers and manually provision invited staff Auth users; link each exact user ID to one approved membership.
- [ ] Require email confirmation, TOTP enrollment, sign-out, and fresh AAL2 login for every staff member.
- [ ] Verify owner/admin, coordinator, clinician, and billing permissions with synthetic records before PHI.
- [ ] Train staff on password reset, MFA loss, patient check-in links, escalation, evidence review, and offboarding.
- [ ] Record access approval and training completion for every user.

## Week 1

- [ ] Review authentication failures, privileged actions, public check-in failures, and application errors daily.
- [ ] Confirm no secrets, public tokens, or patient answers appear in application or hosting logs.
- [ ] Verify staff assignments and deactivate any unnecessary access.
- [ ] Confirm backup jobs and monitoring are healthy; investigate every missed or failed job.
- [ ] Test support escalation, password reset, and one non-production MFA recovery.

## First billing month

- [ ] Confirm enrollment, consent, care-plan review, interaction minutes, check-in status, and month boundaries before billing review.
- [ ] Verify coordinator/clinician cannot mark reviewed or billed.
- [ ] Verify owner/billing review creates one immutable evidence snapshot and billing does not mutate it.
- [ ] Reconcile the application evidence packet with the practice's approved billing/EHR process.
- [ ] Record defects, manual interventions, support time, and user feedback without placing PHI in issue trackers.

## Second billing month

- [ ] Confirm rollover creates a separate patient-month and leaves Month 1 evidence unchanged.
- [ ] Complete a second check-in, qualifying work, evidence review, and billing authorization.
- [ ] Compare both immutable snapshots and audit histories.
- [ ] Repeat access review, backup verification, and incident review.
- [ ] Hold a pilot continuation decision with founder, billing owner, clinical owner, and security contact.

## Success criteria

- Every hosted and pilot checklist item has evidence and an owner.
- No cross-practice access, PHI leakage, secret leakage, or unauthorized billing transition occurs.
- MFA, password reset, offboarding, backups, and restore work within approved targets.
- Two consecutive synthetic or approved live months produce distinct, immutable, reconcilable evidence without developer intervention.
- No unresolved launch-blocking defect or unapproved manual database repair remains.

## Rollback criteria

Stop new data entry and invoke the runbook for any suspected tenant isolation failure, PHI exposure, altered evidence, migration divergence, failed backup/restore, unavailable MFA recovery, uncontrolled privileged access, repeated public-endpoint abuse, or inability to reconcile billing evidence. Preserve logs, notify the named contacts, revoke affected access, and return only after documented root-cause correction and a complete affected-section retest.
