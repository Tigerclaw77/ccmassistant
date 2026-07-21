# CCM Assistant UX Validation Report

Date: 2026-07-17
Scope: RC-002 user experience and existing workflow coverage
Roles: Practice Administrator, Coordinator, Provider, Patient

## Audit Method

This review traced every role-visible route, navigation branch, form, empty/loading/error state, authorization-dependent action, and the public secure-link experience. It combined source-level workflow tracing with browser review of the deployed public experience. No clinical content, billing behavior, authorization rule, or production data was changed.

A permanent local Persona Mode is available only when both `NODE_ENV=development` and `NEXT_PUBLIC_CCM_AUDIT_MODE=true`. It preserves the signed-in identity, MFA, AAL2, real active-practice membership, and database RLS while layering a browser-session persona over the application authorization resolver. `/dev/personas` and the compatibility `/dev/audit` route render only the not-found boundary in production builds; no persona controls or hub content are rendered.

## Role Walkthrough Summary

### Practice Administrator

Practice bootstrap, initial practitioner creation, CMS attestations, practice details, practitioner profiles, coordinator status, management reporting, and Stripe subscription access are present. The first-use path is not a complete real-practice onboarding experience because an administrator cannot invite and activate staff, configure communication defaults, manage security factors, or see a setup-completion checklist. Settings are presented as one long administration page and are not tailored to the current role.

### Coordinator

The coordinator has a credible monthly operating path: prioritized worklist, patient search and filters, patient workspace, eligibility, consent, intake, care plan, check-in, time logging, billability, evidence, and billing handoff. Context-preserving month links and focused work queues are strong. Daily friction remains around manual message delivery, separate time-log trips after common actions, no durable reminders/tasks, and repeated movement through a large patient workspace.

### Provider

The provider queue correctly prioritizes clinical alerts, attestations, care-plan review, and other attention items. The queue is a launch point rather than a review workspace: approvals happen on deeper patient pages, there are no inline review decisions, and care-plan approval is represented by data fields rather than a distinct provider attestation/signature action. The shared Settings page also exposes administration controls that non-admin roles cannot meaningfully use.

### Patient

The public secure-link check-in avoids account creation, supports pause/resume, shows progress, provides practice/provider context, expires tokens, and has clear completion and already-submitted states. The operational invitation is clipboard-only; no email or SMS is sent or tracked. Accessibility needs include stronger mobile sizing, semantic progress, announced errors, focus management, and clearer recovery when a link expires.

## Preferences Audit

| Interface | Status | Evidence / gap |
| --- | --- | --- |
| Practice profile | Present | Name, phone, address, time zone, billing threshold, CMS attestations. |
| Practice logo | Missing | No upload, storage, or display setting. |
| Time zone | Present | Editable practice default and used for calendar-date policy. |
| Office hours | Missing | No structured hours or after-hours support setting. |
| Contact information | Partially implemented | Phone and address exist; no general support email, website, or contact routing. |
| Staff management | Present | Administrators can invite, resend, cancel, disable, re-enable, and remove staff while viewing invitation, login, and MFA status. |
| Role management | Present | Administrators can assign and change Practice Administrator, Coordinator, and Provider roles; the final administrator is protected. |
| Notification preferences | Missing | No staff event, digest, alert, or reminder preferences. |
| Patient communication preferences | Partially implemented | Patient contact method is stored and monthly check-ins support tracked email or secure-link delivery. Practice-wide cadence and sender defaults remain absent. |
| Billing preferences | Partially implemented | Threshold, attestations, practitioner setup, Checkout, and Portal exist; no billing contact/invoice preference surface. |
| Security | Partially implemented | MFA/AAL2 are enforced; there is no security settings page, session view, recovery guidance, or security activity view. |
| MFA management | Partially implemented | Enrollment/recovery/restart exists during access gating; verified-factor management is absent from Settings. |
| Password changes | Partially implemented | Forgot/reset flows exist, but an authenticated user cannot initiate a password change from Account settings. |
| API keys | Missing (not currently applicable) | No external customer API is exposed; avoid adding a key surface until one exists. |
| Subscription management | Present | Stripe-hosted Checkout and Customer Portal are available. |
| Branding | Missing | No logo, patient-message sender identity, colors, or patient-page branding controls. |

## Navigation Audit

- Role-aware top navigation is present, but the authenticated mobile layout relies on horizontal scrolling. Important destinations and Sign out can move off-screen with no menu affordance.
- Administrator/coordinator navigation contains `Provider`, while providers see `Attention` for the same workspace. This weakens wayfinding in support conversations.
- `Settings` is linked for provider and billing roles but renders the full practice-administration page instead of a role-appropriate account/settings view.
- Patient search exists in both Patients and Worklist, but there is no persistent global patient lookup from provider, billing, management, or settings pages.
- The patient workspace provides the best cross-workflow navigation, but common action completion often sends the user through a separate Log time page.
- `/demo` is visible in public navigation and primary landing-page calls to action, but leads to a “coming soon” page.
- Legacy `/forms` and `/submissions` routes correctly return not found and are not linked; they should remain hidden until removed in a separate maintenance decision.

## Consistency Audit

Shared `EmptyState`, `LoadingState`, `button-primary`, `button-secondary`, page shell, status labels, and breadcrumbs establish a useful baseline. Older workflow pages still use bespoke black buttons, plain underlined links for primary next steps, raw rounded-border panels, and ad hoc success/error banners. Headings alternate between title case and sentence case (`New Patient`, `Monthly Check-in`, `Patient worklist`). Loading is sometimes the shared component and sometimes plain `Loading workspace...`. Inline errors are visible but generally are not live-announced or focused.

## Critical Findings

### C1. Staff invitation and activation workflow is absent

**Status: Completed in Pilot Readiness Sprint 1.** Administrators now have an audited invitation and access lifecycle, expiring Supabase Auth invitations, role changes, final-administrator protection, login/MFA visibility, and a secured invitation acceptance path.

- **Role affected:** Practice Administrator, Coordinator, Provider
- **Why it matters:** A real practice cannot onboard separate users into their actual roles. Settings explicitly says role invitations are not enabled, so the validated owner-as-every-role setup cannot become a multi-user pilot without manual database operations.
- **Suggested improvement:** Complete invitation delivery, acceptance, role assignment, resend/revoke, pending status, and first-login guidance using the existing membership model.
- **Estimated engineering effort:** Large (2-4 weeks including email delivery, security review, and end-to-end tests).

### C2. Provider care-plan approval is not a distinct accountable action

**Status: Completed in Pilot Readiness Sprint 1.** Care plans now move through draft, coordinator ready, provider review required, approved, revision requested, and version supersession with explicit role boundaries and immutable review/version history.

- **Role affected:** Provider, Coordinator, Practice Administrator
- **Why it matters:** The provider queue points to care-plan work, but the care-plan page stores provider identity and a reviewed date through a general save flow. This does not give the provider a clear approve/reject/sign action or give coordinators an unambiguous “waiting on provider” handoff.
- **Suggested improvement:** Add an explicit provider-only review decision with attestation text, timestamp, reviewer identity, revision request, and immutable history while preserving the existing care-plan workflow.
- **Estimated engineering effort:** Medium-Large (1-2 weeks plus authorization and evidence regression coverage).

### C3. Secure patient check-ins cannot be delivered or tracked in-product

**Status: Completed in Pilot Readiness Sprint 1.** Coordinators can send, resend, or regenerate expiring secure links through tracked email or manual secure-link delivery. Opened, completed, expired, and failed states are audited; SMS remains adapter-only until a provider is selected.

- **Role affected:** Coordinator, Patient, Practice Administrator
- **Why it matters:** The preferred patient experience is a secure web link, but coordinators can only copy message text or a URL. There is no email/SMS send, delivery state, failure handling, resend history, or proof of outreach. This creates off-system work and weakens the monthly audit trail.
- **Suggested improvement:** Add one approved secure-link delivery channel first, with consent-aware destination selection, delivery status, retry, and an auditable communication record. Keep PHI out of message bodies.
- **Estimated engineering effort:** Large (2-4 weeks including vendor, compliance, webhook, and deliverability work).

## High Findings

### H1. First-use onboarding ends before the practice is operational

- **Role affected:** Practice Administrator
- **Why it matters:** Bootstrap creates the practice and first practitioner, then drops the owner into normal navigation without a completion view for contact details, staff, subscription, patient communication, security, and first patient.
- **Suggested improvement:** Add a resumable setup checklist that links existing screens and clearly separates required-before-first-patient from optional configuration.
- **Estimated engineering effort:** Medium (4-7 days).

### H2. Settings is not role-aware

- **Role affected:** Provider, Coordinator, Billing staff
- **Why it matters:** Non-admin roles can navigate to a page labeled Practice administration and see practitioner, staff, practice, and subscription controls. Authorization may reject writes, but the interface invites actions that are outside the role.
- **Suggested improvement:** Render Account/Security for every user and show practice administration/subscription sections only to owner/admin roles.
- **Estimated engineering effort:** Small-Medium (2-4 days).

### H3. Authenticated security management is incomplete

- **Role affected:** All staff roles
- **Why it matters:** Users cannot initiate a password change from Settings, review or replace verified MFA factors, see recovery guidance, or inspect active sessions. Security is enforced but not manageable.
- **Suggested improvement:** Add a dedicated Security section using Supabase-supported password, factor, recovery, and session operations without weakening AAL2.
- **Estimated engineering effort:** Medium (1 week plus security tests).

### H4. Coordinator reminders and follow-up work are inferred, not managed

- **Role affected:** Coordinator, Practice Administrator
- **Why it matters:** Worklist queues show overdue/blocked states, but users cannot assign a due date, snooze, record ownership of a follow-up, or mark a task complete independently of closing the whole workflow.
- **Suggested improvement:** Introduce a narrow follow-up task layer tied to existing patient-month events, with owner, due date, status, and audit history.
- **Estimated engineering effort:** Large (2-3 weeks).

### H5. Common coordinator actions require a second trip to log time

- **Role affected:** Coordinator
- **Why it matters:** Closing a check-in, reviewing a care plan, or completing intake leaves time entry as a separate link/page. For repeated monthly work this is a high-frequency click and context-switch cost.
- **Suggested improvement:** Offer an optional compact “Log time for this completed action” step using the existing interaction-log API, prefilled activity and date, without automatic billing credit.
- **Estimated engineering effort:** Medium (4-6 days).

### H6. Provider queue does not support a fast review loop

- **Role affected:** Provider
- **Why it matters:** The provider must open each patient, locate the relevant section, act, and manually return. There is no queue filter, reviewed/remaining count by type beyond summary cards, inline decision, or next-item navigation.
- **Suggested improvement:** Add focused review detail with approve/request-change actions where already supported, then “Save and open next” while preserving patient context.
- **Estimated engineering effort:** Medium-Large (1-2 weeks).

### H7. Mobile staff navigation hides destinations through horizontal overflow

- **Role affected:** All staff roles
- **Why it matters:** On narrow screens the navigation row scrolls without a visible menu indicator, so users may not discover Settings, Management, or Sign out.
- **Suggested improvement:** Replace mobile overflow with a standard menu/drawer and keep the current desktop navigation.
- **Estimated engineering effort:** Small-Medium (2-4 days with responsive/accessibility testing).

### H8. Patient accessibility feedback is incomplete

- **Role affected:** Patient
- **Why it matters:** Older or impaired users need errors announced, focus moved to the failing field or message, progress exposed semantically, larger touch targets, and clearer input constraints. Current visual feedback alone can be missed by assistive technology.
- **Suggested improvement:** Add `aria-live`, error associations, focus management, a semantic progress element, descriptive input labels/hints, and 44px mobile targets; validate with keyboard and screen reader checks.
- **Estimated engineering effort:** Medium (4-7 days).

### H9. Patient communication preferences are captured but not operationalized

- **Role affected:** Patient, Coordinator, Practice Administrator
- **Why it matters:** A patient has a preferred contact method, but creation and check-in flows do not validate that the selected channel has a usable destination or honor practice-level communication rules.
- **Suggested improvement:** Validate destination/channel consistency and surface the preferred method wherever a coordinator prepares outreach.
- **Estimated engineering effort:** Medium (4-7 days; larger if combined with delivery).

### H10. Public Demo is a visible dead end

- **Role affected:** Prospective Practice Administrator, Provider
- **Why it matters:** The landing page and public navigation promise a demo, but `/demo` says it is coming soon. This undermines confidence at the highest-intent moment.
- **Suggested improvement:** Until a demo is ready, route the CTA directly to Request demo or remove it from primary navigation. Do not expose a placeholder promise.
- **Estimated engineering effort:** Extra Small (under 1 day).

## Medium Findings

### M1. Practice profile lacks a complete support identity

- **Role affected:** Practice Administrator, Patient
- **Why it matters:** Phone/address are available, but no support email, website, office hours, or after-hours guidance can be configured for patient check-ins.
- **Suggested improvement:** Add structured support contact and office-hours settings, then render them on the secure-link page.
- **Estimated engineering effort:** Medium (3-5 days).

### M2. Branding controls are absent

- **Role affected:** Practice Administrator, Patient
- **Why it matters:** The patient page can name the practice but cannot display a practice logo or verified sender identity, reducing trust in an unfamiliar secure link.
- **Suggested improvement:** Add restrained logo/sender identity configuration with safe file handling and accessible fallbacks.
- **Estimated engineering effort:** Medium (1 week).

### M3. Settings is a long mixed-responsibility page

- **Role affected:** Practice Administrator
- **Why it matters:** Practice, subscription, practitioners, coordinators, roles, and account settings share one scrolling page. Anchor cards help, but saving and error context can be far from the active section.
- **Suggested improvement:** Split Settings into stable tabs or subroutes while retaining the same forms and APIs.
- **Estimated engineering effort:** Medium (4-7 days).

### M4. No persistent global patient lookup

- **Role affected:** Coordinator, Provider, Billing staff
- **Why it matters:** Patient search is available only after navigating to Worklist or Patients. Providers and billers frequently need to jump directly from their current workspace.
- **Suggested improvement:** Add a role-safe global patient lookup in staff navigation with keyboard and screen-reader support.
- **Estimated engineering effort:** Medium (3-5 days).

### M5. Long forms do not protect unsaved work

- **Role affected:** Coordinator, Practice Administrator, Provider
- **Why it matters:** Patient enrollment, eligibility, care plan, and settings forms can contain substantial work, but there is no dirty-state warning, draft indicator, or recovery after accidental navigation.
- **Suggested improvement:** Add navigation warnings and local draft recovery only for unsaved form state; do not auto-submit clinical or billing data.
- **Estimated engineering effort:** Medium (1 week across forms).

### M6. Month selection is repeated and not always visibly global

- **Role affected:** Coordinator, Billing staff, Practice Administrator
- **Why it matters:** Month context is preserved in many links, but each page owns its own selector and some links omit context. Users can silently land in the current month after working historically.
- **Suggested improvement:** Display a consistent patient-month context control on monthly workflow pages and preserve it in every next/back action.
- **Estimated engineering effort:** Medium (3-5 days plus regression tests).

### M7. Terminology varies by role and page

- **Role affected:** All staff roles
- **Why it matters:** `Provider`, `billing practitioner`, `practitioner`, `Attention`, `provider review`, `Monthly Check-in`, and `Question Session` overlap without a visible glossary. The same destination has different navigation names.
- **Suggested improvement:** Adopt a controlled UI vocabulary and reserve “billing practitioner” for billing identity, “provider review” for accountable actions, and one label per destination.
- **Estimated engineering effort:** Small (2-3 days plus copy review).

### M8. Status feedback is not consistently persistent or announced

- **Role affected:** All staff roles
- **Why it matters:** Success/error banners are inline and can appear above the user’s current scroll position; most lack `role=status`, `aria-live`, and focus behavior.
- **Suggested improvement:** Standardize a message component with severity, live-region behavior, focus rules, and optional dismiss.
- **Estimated engineering effort:** Medium (3-5 days).

### M9. Patient registry filtering is basic for real panels

- **Role affected:** Coordinator, Practice Administrator
- **Why it matters:** Search/status/sort support is useful, but there are no provider, coordinator, eligibility, consent, or enrollment filters on the registry. Users must switch to the worklist or inspect records individually.
- **Suggested improvement:** Add only the highest-value assignment/readiness filters already supported by existing data and URLs.
- **Estimated engineering effort:** Medium (3-5 days).

### M10. Administrative audit history has no consolidated view

- **Role affected:** Practice Administrator
- **Why it matters:** Consent and evidence show local history, but an administrator cannot review security, membership, configuration, and high-risk workflow changes in one place.
- **Suggested improvement:** Add a read-only practice audit view with filters and links back to source records.
- **Estimated engineering effort:** Medium-Large (1-2 weeks).

### M11. Expired patient links provide little recovery guidance

- **Role affected:** Patient, Coordinator
- **Why it matters:** An expired or invalid token produces “Check-in unavailable / Invalid link” without naming the practice or a safe next step, leading to support calls and abandoned check-ins.
- **Suggested improvement:** Return a non-sensitive practice support reference when safe, or show generic instructions to contact the practice and request a new link.
- **Estimated engineering effort:** Small-Medium (2-4 days with privacy review).

### M12. Provider and coordinator queues lack saved personal views

- **Role affected:** Coordinator, Provider
- **Why it matters:** URL filters preserve a view, but users cannot save a recurring assignment/readiness combination or return to a personal default.
- **Suggested improvement:** Add lightweight personal saved filters after observing pilot usage; avoid building a broad dashboard designer.
- **Estimated engineering effort:** Medium (4-6 days).

## Low Findings

### L1. Button hierarchy is inconsistent on older workflow pages

- **Role affected:** All staff roles
- **Why it matters:** Bespoke black buttons, bordered buttons, underlined links, and shared teal buttons compete for the same primary-action meaning.
- **Suggested improvement:** Migrate existing commands to shared button variants and reserve underlined links for navigation.
- **Estimated engineering effort:** Small (2-3 days).

### L2. Loading presentation is inconsistent

- **Role affected:** All staff roles
- **Why it matters:** Most pages use `LoadingState`; the patient workspace still renders plain “Loading workspace...”, causing a visible quality dip.
- **Suggested improvement:** Use the shared loading component and consistent minimum layout dimensions.
- **Estimated engineering effort:** Extra Small (under 1 day).

### L3. Heading capitalization is inconsistent

- **Role affected:** All roles
- **Why it matters:** `New Patient`, `Monthly Check-in`, and sentence-case dashboard titles make the interface feel assembled from different generations.
- **Suggested improvement:** Standardize headings and action labels to the design-system copy rules.
- **Estimated engineering effort:** Extra Small (under 1 day plus copy check).

### L4. Pagination gives little result context

- **Role affected:** Coordinator, Practice Administrator
- **Why it matters:** Patients and Worklist show page numbers but not the visible range or total after filters, making large lists harder to scan.
- **Suggested improvement:** Show “items X-Y of Z” and retain filters while paging.
- **Estimated engineering effort:** Small (1-2 days).

### L5. Public completion has no print/save reference

- **Role affected:** Patient
- **Why it matters:** The confirmation is clear but offers no timestamp or simple reference that reassures the patient what was received.
- **Suggested improvement:** Show a non-sensitive received timestamp and practice contact; do not expose answers or create an account requirement.
- **Estimated engineering effort:** Small (1-2 days).

### L6. Account display-name editing is isolated from staff identity

- **Role affected:** All staff roles, Practice Administrator
- **Why it matters:** A user can edit a display name, while practitioner/member labels may come from separate records. The relationship is not explained and can create inconsistent names.
- **Suggested improvement:** Clarify which name is personal account identity versus practitioner/member identity and where each appears.
- **Estimated engineering effort:** Small (1-2 days).

## Top 20 Improvements For The First Pilot Practice

1. Complete secure staff invitations and role activation.
2. Create an explicit provider approve/request-change attestation for care plans.
3. Deliver and track secure patient check-in links through one approved channel.
4. Add a resumable first-practice setup checklist.
5. Make Settings role-aware and remove unauthorized controls from non-admin views.
6. Add authenticated password, MFA-factor, recovery, and session management.
7. Add coordinator follow-up ownership, due dates, and completion status.
8. Offer optional inline time logging after completed coordinator actions.
9. Turn the provider queue into a save-and-next review loop.
10. Replace mobile staff nav overflow with a discoverable menu.
11. Complete patient accessibility: error focus/live regions, semantic progress, touch targets.
12. Validate and honor each patient’s preferred communication method.
13. Remove or redirect the public Demo placeholder until a real demo exists.
14. Add practice support email, office hours, and after-hours guidance.
15. Preserve and display one consistent patient-month context across workflow pages.
16. Add unsaved-work protection to long operational forms.
17. Standardize provider/practitioner/review/check-in terminology.
18. Add a persistent global patient lookup for staff roles.
19. Standardize success/error feedback and button hierarchy.
20. Add a read-only administrator audit-history view.

## Audit Mode Use

Start local development with `NEXT_PUBLIC_CCM_AUDIT_MODE=true`, sign in normally, complete MFA normally, then open `/dev/personas`. Persona selection changes the resolver's effective development role and representative navigation for the current tab without updating memberships or audit history. Database RLS still evaluates the real authenticated user. Never use Persona Mode as a substitute for separate-account RLS and authorization testing.
