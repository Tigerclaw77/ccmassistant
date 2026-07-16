# Two-Month Hosted Synthetic Smoke Test

Run this test in a production-like hosted staging environment using synthetic people and invented contact details only. Record tester, date, commit SHA, deployment URL, Supabase project reference, migration ledger `006` through `023`, and links to sanitized evidence. Repository tests do not replace this exercise.

## Current staged execution (2026-07-16)

Hosted development/staging has migrations through `023`. The original staging practice remains unchanged. A dedicated synthetic validation practice completed the full historical June and July 2026 workflow at AAL2, including provider/coordinator setup, eligibility, consent, accepted intake, active care plan, scoped favorites, patient check-ins, independent time totals, billability, immutable evidence, reviewed state, and billed state.

June retained 25 minutes and July retained 35 minutes with distinct evidence snapshots. The June snapshot remained byte-stable after July activity and after denied update/delete attempts. Coordinator billing actions and cross-practice requests returned `403`, a future occurrence date returned `400`, and the Stripe billing-account fingerprint remained unchanged with no Stripe object created for the validation practice. This completed hosted test used synthetic data only and is not authorization for PHI or public deployment.

## Preconditions

- [ ] Required environment values pass `npm run env:check`. Expected: exit code 0 with variable names only.
- [ ] Hosted migration ledger contains `006` through `023` exactly once and in order. Expected: no missing, duplicate, or out-of-order migration.
- [ ] Every `NOT VALID` constraint is validated. Expected: the unvalidated-constraint query returns zero rows.
- [ ] HTTPS, exact Auth Site URL/redirects, custom SMTP, password policy, TOTP MFA, session limits, backups, and public-route rate limits are configured. Expected: configuration is evidenced in the launch record.
- [ ] A restore drill owner and date are assigned. Expected: neither field is blank.

## Month 1

- [ ] Sign up the synthetic owner, confirm email, enroll TOTP, sign out, and sign in again. Expected: data access is denied before the TOTP challenge and succeeds at AAL2.
- [ ] Bootstrap one practice and create a billing provider with a syntactically valid synthetic NPI. Expected: practice/provider appear once and are linked to the owner.
- [ ] Provision synthetic coordinator, clinician, and billing users using the documented manual Auth process. Expected: each account has one active membership and minimum necessary role.
- [ ] Test role boundaries. Expected: only owner/admin manages staff; billing can review/bill but not alter care delivery; coordinator/clinician cannot mark reviewed or billed.
- [ ] Create a synthetic patient with a past DOB, then attempt the same name/DOB. Expected: duplicate warning requires explicit resubmission and cancel creates no duplicate.
- [ ] Complete the supported enrollment path for the synthetic patient. Expected: all required attestations and consent fields are visible and activation succeeds only when valid.
- [ ] Complete and accept intake review. Expected: reviewed answers persist and no unreviewed generated result becomes accepted automatically.
- [ ] Create an active provider-reviewed care plan. Expected: required structured fields, provider, and review date persist.
- [ ] Start, resume, and complete a synthetic question session. Expected: deterministic session state persists, completed answers integrate once, and another practice cannot read or mutate the session.
- [ ] Send a check-in and open its public link. Expected: link uses the configured production-like origin, response is not cached, and no authenticated practice data is exposed.
- [ ] Submit the public check-in. Expected: one response set is stored, status advances, token becomes unusable, and no token appears in audit metadata.
- [ ] Create another check-in and move its database expiry into the past in the controlled test project. Expected: public read and submit both reject it without revealing backend details.
- [ ] Log at least 20 qualifying synthetic minutes with meaningful notes. Expected: occurred date and billing month agree and total is deterministic.
- [ ] Recalculate eligibility as coordinator/clinician. Expected: calculation updates but review/billed state does not.
- [ ] Attempt billing status actions as coordinator and clinician. Expected: both receive `403` and no state changes.
- [ ] As owner or billing staff, review evidence and mark reviewed. Expected: exactly one immutable evidence snapshot is created.
- [ ] Mark billed. Expected: the same snapshot ID and content remain unchanged.
- [ ] Print the evidence packet to PDF. Expected: all sections are legible and the EHR/legal-record notice is present.
- [ ] Attempt client update/delete of audit events and evidence snapshots. Expected: database authorization denies both.

## Non-response regression

- [ ] Create a separate synthetic patient-month check-in with no response. Expected: it remains incomplete.
- [ ] Try to close it without a meaningful staff follow-up note. Expected: request is rejected.
- [ ] Close it with a meaningful follow-up note. Expected: evidence clearly distinguishes staff-documented non-response from a patient response.
- [ ] Recalculate the month. Expected: undocumented non-response never satisfies check-in completion.

## Isolation and recovery

- [ ] Copy a provider, patient, enrollment, check-in, template, session, or care-plan ID from a second synthetic practice into a first-practice request. Expected: API and database reject every cross-practice reference.
- [ ] Attempt a valid API request after reducing the session below AAL2. Expected: authenticated CCM API returns `401`.
- [ ] Exercise password reset through production-like SMTP. Expected: exact allowlisted redirect opens and the old password no longer works.
- [ ] Complete one documented MFA recovery drill. Expected: old factor and sessions are revoked; re-enrollment is required; AAL2 policy remains enabled.
- [ ] Restore the database into an isolated project. Expected: recorded counts and sampled immutable evidence/audit records match the source recovery point.

## Month 2

- [ ] Advance the same primary synthetic patient to the next calendar month and create a distinct check-in. Expected: Month 2 is separate and Month 1 remains read-only.
- [ ] Verify Month 1 totals, audit history, and snapshot before new activity. Expected: ID, content, minutes, and statuses are unchanged.
- [ ] Complete Month 2 check-in and qualifying work. Expected: a Month 1 occurred date cannot be filed into Month 2.
- [ ] Reach the threshold, recalculate, review evidence, mark reviewed, and mark billed. Expected: transitions follow the same role checks as Month 1.
- [ ] Compare snapshots. Expected: Month 2 has a distinct immutable snapshot and Month 1 is byte-for-byte unchanged.
- [ ] Print the Month 2 packet. Expected: patient, month, minutes, check-in, review, and billed state agree with stored evidence.

## Pass criteria

Every item must pass without developer intervention, unresolved severity-high defects, PHI, cross-practice leakage, or manual database repair. Record defects and rerun affected sections after an approved fix. Do not onboard the pilot practice until external configuration, restore evidence, and founder/practice sign-off are complete.
