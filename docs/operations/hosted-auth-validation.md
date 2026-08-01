# Hosted authentication validation

This is the deterministic RC-005 evidence procedure for the hosted **development** project. It does not authorize production changes and it must be run with non-PHI test accounts. Repository tests prove application behavior; only this hosted exercise can prove delivery-provider behavior.

## Configuration evidence

Capture screenshots or exported settings with secret values redacted:

- Supabase Auth **Site URL** equals the deployed development origin.
- Redirect allow list contains the exact deployed origins and these paths: `/login`, `/reset-password`, and `/accept-invitation` (query strings may follow).
- Email confirmation is enabled.
- A custom SMTP provider is enabled. Supabase's default SMTP is not acceptable for an external pilot: it is rate-limited, best-effort, and normally delivers only to project-team addresses.
- Sender domain, From address, SPF, DKIM, and DMARC are verified by the provider.
- Password minimum is at least 12 characters; leaked-password protection and the approved session policy are enabled.
- Confirmation, invitation, password recovery, and email-change templates point to `{{ .ConfirmationURL }}` or an approved token-hash endpoint. No template exposes secrets.

Record: project ref, deployed SHA, deployed URL, tester, UTC timestamp, SMTP provider, sender domain, and redacted setting screenshots.

## Lifecycle matrix

Use a new plus-addressed mailbox for each row. For every message record Supabase Auth log correlation, provider message ID, provider outcome, recipient timestamp, link timestamp, final browser URL, and result.

| Flow | Procedure | Pass evidence |
| --- | --- | --- |
| Owner signup | Create an account; inspect Auth user; open only the newest confirmation email. | User exists unconfirmed before click, confirmation request appears in Auth/provider logs, provider reports delivered, click confirms email, sign-in routes to MFA then practice setup. |
| Confirmation resend | Request resend twice; open the older link, then newest link. | UI never claims provider delivery; newest link succeeds; stale/used link shows actionable recovery and no protected access. |
| Staff invitation | As founder, invite each operational role; inspect Staff access and Auth/provider logs; accept as the invited address. | Member starts invited, canonical role is recorded, message ID is delivered, MFA is required, accept activates the same member and assignment. |
| Expired invitation | Set a short approved test expiry or wait; open the link; resend from Staff access. | Expired link cannot activate membership, explains recovery, newest resend succeeds, old link remains unusable. |
| Password reset | From sign-in request reset for an existing and nonexistent address; open the existing-user email. | Both requests have enumeration-safe UI; provider delivery is recorded only for the existing user; recovery page is reachable before MFA; password changes; session signs out; new password plus MFA signs in. |
| Expired/used reset | Reuse a successful reset URL and test an expired URL. | Password is unchanged and UI offers a new reset link with no protected access. |
| Provider rejection/defer | Use a controlled invalid recipient and, if supported, a temporary-defer provider test. | Provider status and reason are captured; the application does not claim delivery; administrator can resend after correction. |

## Role verification after invitation

For independent accounts (Persona Mode disabled), verify:

- Founder / Organization Owner: protected override, full practice administration.
- Practice Administrator: staff and practice administration, no founder reassignment/removal.
- Provider: provider attention and clinical patient work; no staff or billing administration.
- Clinical Staff and Coordinator: assigned clinical workflow; no billing or staff administration. Only Coordinator may claim when claiming is enabled.
- Compliance Administrator: compliance evidence and patient read access; no clinical, billing, or staff writes.
- Billing Administrator: billing workflow; no clinical or staff writes.
- Front Desk: patient registry read access only in RC-005; no clinical, billing, compliance, or staff writes.
- Read Only: patient/knowledge read access only; no writes.

Attempt at least one allowed and one denied operation per account. Capture HTTP status, Auth user ID, practice/member ID, canonical assignment, and audit-event delta. Confirm Persona Mode is disabled and no persona header is sent.

## Failure classification

- No Auth user: browser/API request failed before Auth creation.
- Auth user exists, no Auth mail event: Supabase Auth configuration/template/redirect failure.
- Auth mail event exists, no provider message ID: Supabase-to-SMTP handoff failure.
- Provider rejected/deferred: provider/domain/recipient issue; record the exact provider response.
- Provider delivered, inbox absent: recipient filtering/mailbox issue; retain provider evidence.
- Link opens with an Auth error: token expiry, previous use, link scanner/prefetch, or redirect allow-list issue. Record the exact `error_code` and URL with tokens redacted.
- Link succeeds but app stops: application onboarding/authorization defect.

## Approval

Hosted authentication is **PASS** only when every lifecycle row has evidence against the exact release SHA. Any missing provider message ID, delivery outcome, or redirect result is **NOT VALIDATED**, never an inferred pass. Do not paste access tokens, refresh tokens, OTPs, SMTP credentials, or full magic links into the release record.
