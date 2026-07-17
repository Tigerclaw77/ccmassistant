# Pilot Readiness Sprint 1

Date: 2026-07-17

## Scope

This sprint implements only the three Critical findings in the UX validation report. It does not change clinical logic, question banks, billing rules, Stripe behavior, or the existing practice authorization model.

## Implemented Workflows

### Practice staff management

- Practice owners and administrators can invite staff as Practice Administrator, Coordinator, or Provider.
- Invitations use Supabase Auth, expire, and can be resent or cancelled.
- Administrators can change roles, disable, re-enable, and soft-remove users.
- The final active owner/administrator cannot be reassigned, disabled, or removed.
- The directory shows invitation state, last login, and verified MFA state.
- Invitation acceptance requires an authenticated AAL2 session and an email match.
- Provider membership is linked to an existing provider profile or a non-billing profile marked for administrator completion.
- Every administrative lifecycle action is written to the existing audit log.

### Provider care-plan review

- Review states are `draft`, `coordinator_ready`, `provider_review_required`, `approved`, and `revision_requested`.
- Coordinators explicitly mark a draft ready and submit it for provider review.
- The assigned provider, or practice owner, can approve or request changes with comments.
- Providers see an explicit Pending Provider Reviews queue.
- Every content edit creates a new care-plan version. Editing approved content supersedes the approved version and returns the current plan to draft.
- Review decisions and content versions are immutable database records with reviewer, timestamp, comments, and snapshots.

### Patient monthly check-in delivery

- Creating a check-in is separate from delivering it; legacy callers remain supported.
- The coordinator can send by email, resend, regenerate an expired or compromised link, or copy a secure link for an approved external channel.
- Tokens expire after the established 14-day public check-in window.
- Delivery attempts record pending, delivered, opened, completed, expired, failed, or cancelled state.
- Request keys make repeated delivery requests idempotent.
- Email bodies are generic and contain no patient or clinical data. Only a masked destination is persisted.
- Completing the public check-in marks the existing check-in responded, which immediately surfaces it through the coordinator worklist.
- SMS is represented by the delivery adapter contract but remains unavailable until a provider is selected and configured.

## Migration Notes

Apply `supabase/migrations/024_pilot_readiness_sprint_1.sql` after migration 023.

The migration adds staff invitation history, care-plan review/version history, and check-in delivery history. Existing active care plans with a recorded review date are backfilled as approved. Historical migration numbers and existing records are not rewritten.

Hosted environments require:

- `NEXT_PUBLIC_APP_URL` set to the exact application origin.
- The application origin and `/accept-invitation` callback allowed in Supabase Auth redirect URLs.
- Supabase Email OTP Expiration aligned with `STAFF_INVITATION_TTL_MINUTES` (default 60 minutes).
- `RESEND_API_KEY` and `PATIENT_EMAIL_FROM` for email delivery.

Use a verified sender/domain before pilot email delivery. No SMS credential is required because SMS sending is intentionally disabled.

## Security And Audit

- All staff, review, and delivery routes use canonical practice authorization before service-role operations.
- Every database query and mutation is scoped to the authorized practice.
- The final-administrator guard prevents practice lockout.
- Provider decisions are limited to the provider profile assigned to the care plan, with owner compatibility retained.
- Invitation acceptance requires AAL2 and matching authenticated email.
- Care-plan review and version rows cannot be updated or deleted.
- No token is written to audit data, and no PHI is sent in email content or stored in delivery metadata.

## Testing Performed

- Deterministic Pilot Readiness Sprint 1 tests: 7 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed (58 routes generated).
- Authorization regression: 7 passed.
- Coordinator efficiency regression: 9 passed.
- Staff experience regression: 6 passed.
- All other functional registered suites passed. Three byte-reproducibility assertions for untouched clinical/ICD generated artifacts fail on this Windows checkout because Git supplies CRLF working-tree bytes while the generators produce canonical LF bytes. Git reports no clinical or ICD source/artifact changes; these files were not regenerated or modified in this sprint.

Coverage includes invitation normalization and expiry, role boundaries, final-administrator protection, provider approval/revision transitions, immutable migration contracts, delivery status/expiry/resend behavior, destination masking, idempotency, PHI-safe email content, audit calls, and practice-scoped authorization.

## Remaining High Findings

No High finding was implemented in this sprint:

1. H1: First-use onboarding ends before the practice is operational.
2. H2: Settings is not role-aware.
3. H3: Authenticated security management is incomplete.
4. H4: Coordinator reminders and follow-up work are inferred, not managed.
5. H5: Common coordinator actions require a second trip to log time.
6. H6: Provider queue does not support a fast review loop.
7. H7: Mobile staff navigation hides destinations through horizontal overflow.
8. H8: Patient accessibility feedback is incomplete.
9. H9: Patient communication preferences are captured but not fully operationalized.
10. H10: Public Demo is a visible dead end.
