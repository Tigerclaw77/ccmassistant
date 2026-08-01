# RC-004 Founder Experience Audit

> RC-005 implementation note (2026-08-01): F-02 is implemented in the repository. F-01 application recovery paths are implemented; hosted SMTP delivery and lifecycle evidence remain an external release gate. The original findings below are preserved as the audit baseline.

Date: August 1, 2026

Baseline: `main` at `42cdaf8` (`docs: add RC-003 release record`)

Disposition: audit only; no product, database, migration, or configuration changes

## Executive summary

CCM Assistant has a credible, security-conscious CCM operating core. The first-provider bootstrap, Medicare-aware DOB control, opportunity-to-task transition, actual-time affirmation, provider review, immutable workflow evidence, and development-persona security gates are all present and their focused regression contracts pass. The public and authentication shells render cleanly at desktop and mobile widths without horizontal page overflow.

The product is ready for continued founder testing, but it is not yet ready for an external, multi-role pilot without intervention. Two P0 issues prevent a safe pilot launch:

1. Auth confirmation, invitation, and password-reset delivery remain unproven end to end. A new pilot user may never get through the first gate.
2. The long-term role catalog exists, but real staff provisioning exposes only Practice Administrator, Coordinator, and Provider. Compliance, billing, front desk, clinical staff, and read-only users cannot be provisioned through the product with their intended least-privilege access.

The highest operational risk after those gates is worklist completeness. Coordinator queue-group counts describe only the 25 patients on the current page, the default view is practice-wide rather than assigned-to-me, and the provider attention queue silently caps itself at 100 records. For a practice with 120–250 active CCM patients, those behaviors prevent the queues from being treated as authoritative worklists.

The largest usability issue is progressive disclosure. First-patient registration, the patient workspace, monthly check-in, and Settings expose too much of the full system at once. The underlying capabilities are useful, but the user is repeatedly asked to choose among multiple destinations instead of being shown the next safe action.

**Overall pilot readiness score: 64/100.**

- Founder and guided internal evaluation: ready.
- Single-practice synthetic validation: technically credible.
- External multi-role pilot: blocked by F-01 and F-02.
- Coordinator throughput at 120–250 patients: needs F-07 through F-10 before the queue can be trusted operationally.

## Audit method and evidence

The application was run locally with the development persona flag enabled. Live browser checks covered the public homepage, sign-up, sign-in redirect behavior, demo, request-demo, and mobile layouts at 1280×720 and 390×844. The public pages had meaningful content, no Next.js error overlay, and no horizontal overflow at the tested mobile width.

The available browser did not contain an authenticated AAL2 developer session, Chrome was not connected, and the audit explicitly prohibited creating users or changing database records. Protected workflows were therefore reviewed through their current rendered structure, route and component behavior, authorization contracts, existing RC-003 release evidence, and focused regression tests rather than by submitting live patient or practice mutations. This limitation is material: no claim in this report treats hosted email delivery or a real-role pilot handoff as proven.

Focused contract validation passed:

- Development Persona Mode: 8/8
- First-patient onboarding: 6/6
- Coordinator workflow and opportunity detector: 18/18
- Authorization layer: 7/7

The passing contracts establish that the safeguards exist; they do not negate the usability and operational-completeness findings below.

### Priority scale

| Priority | Meaning |
| --- | --- |
| P0 | Prevents a safe or representative pilot. |
| P1 | Should be corrected before pilot because it can hide work, create a dead end, or cause material confusion. |
| P2 | Improves usability, learnability, or efficiency without blocking a guided pilot. |
| P3 | Deliberate future enhancement or polish. |

### Effort scale

| Estimate | Typical effort |
| --- | --- |
| XS | Less than 1 engineering day |
| S | 1–2 engineering days |
| M | 3–5 engineering days |
| L | 1–2 engineering weeks |
| XL | More than 2 engineering weeks |

## Findings

### F-01 — Auth communication delivery is not a proven first-run path

- **Priority:** P0
- **Location:** `/signup`, `/forgot-password`, `/reset-password`, staff invitations in Settings, hosted Supabase Auth/SMTP configuration
- **Description:** The UI reports that a confirmation, invitation, or reset email was requested when Supabase accepts the request, but RC-003 still records inbox delivery and redirect validation as outstanding. The earlier observed registration attempt also reached the “verification email sent” state without a received email.
- **Why it matters:** A pilot user who cannot confirm an account, accept an invitation, or reset a password cannot enter the product. The application cannot infer provider delivery from a successful Auth API response.
- **Recommended solution:** Configure the intended development/pilot SMTP provider, exact Site URL and redirect allowlist, then run a controlled inbox-level test for confirmation, invitation, resend, expiry, and password reset. Record provider message IDs and delivery outcomes for support without exposing secrets.
- **Estimated engineering effort:** S application/QA effort plus configuration ownership
- **Expected pilot impact:** Critical; removes the first-login blocker and makes support behavior knowable.

### F-02 — The role architecture is not provisionable as real pilot access

- **Priority:** P0
- **Location:** Settings → Practice Staff; `ASSIGNABLE_STAFF_ROLES`; real practice membership roles
- **Description:** The architecture and Persona Mode list Organization Owner, Practice Administrator, Compliance Administrator, Billing Administrator, Provider, Clinical Staff, Coordinator, Front Desk, Read Only, and Patient. The actual staff invitation UI permits only Practice Administrator, Coordinator, and Provider. Billing staff is displayed only as a legacy existing role. Compliance, front desk, clinical staff, and read-only access cannot be assigned through the product.
- **Why it matters:** A representative pilot cannot give each participant least-privilege access. Using owner/admin access or shared credentials to compensate would invalidate the role-boundary evaluation and weaken security.
- **Recommended solution:** Operationalize only the pilot-required role mappings in invitations, membership resolution, navigation, and authorization tests. Keep patient access separate and do not implement future department administration.
- **Estimated engineering effort:** L
- **Expected pilot impact:** Critical; enables a real multi-role pilot without over-privileging users.

### F-03 — The public demo and request-demo paths are circular dead ends

- **Priority:** P1
- **Location:** Homepage “Watch demo,” `/demo`, `/request-demo`
- **Description:** “Watch demo” opens a page that says the demo is coming soon. Its primary action opens “Request demo,” which has no form, email address, calendar, or contact action and sends the visitor to sign in or back to the homepage.
- **Why it matters:** A first-time pilot prospect cannot evaluate the product or request access from the product’s two strongest public calls to action.
- **Recommended solution:** In the smallest release-safe change, provide one functional contact/scheduling action and set accurate CTA expectations. A synthetic no-signup demo can remain deferred.
- **Estimated engineering effort:** S for a functional request path; L for a synthetic demo
- **Expected pilot impact:** High; prevents qualified pilot interest from disappearing.

### F-04 — Practice setup stops before the practice is operationally ready

- **Priority:** P1
- **Location:** `/setup/practice`; Settings → Practice and Billing Practitioners; first billable-month readiness
- **Description:** The wizard creates the practice and first provider, but explicitly defers NPI and other provider details. Practice CMS eligibility and Medicare enrollment attestations live later in the 1,100-line Settings page. The founder can create a patient, but cannot complete the first billable workflow without discovering these hidden prerequisites.
- **Why it matters:** The first-run promise is “create first patient and begin CCM,” yet the system still sends the founder searching through Settings before readiness can be achieved.
- **Recommended solution:** Add an operational-readiness handoff after practice creation that names the exact remaining compliance items and routes to the next one. Collect NPI during onboarding when available, but allow a clearly owned “complete before billing review” state rather than silently deferring it.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; turns setup completion into an honest, guided operational state.

### F-05 — Provider profile creation and provider login access are disconnected

- **Priority:** P1
- **Location:** Practice setup first-provider step; Settings → Billing Practitioners; Settings → Practice Staff
- **Description:** An administrator-only owner creates a billing practitioner profile during onboarding, then must separately invite a staff member as Provider. The UI does not explain how or whether the invitation will link to the existing practitioner profile.
- **Why it matters:** The founder can believe a provider is ready while the physician still has no account, or create duplicate provider identities while trying to fix access.
- **Recommended solution:** Present provider clinical identity and user access as two explicit linked states on one provider card: “Provider record” and “Login access.” Offer the invite/link action in context and prevent ambiguous duplicates.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; reduces setup errors and gets the physician into the correct review queue.

### F-06 — First-patient registration asks for downstream work before the patient exists

- **Priority:** P1
- **Location:** `/patients/new`; `PatientForm`; embedded condition manager
- **Description:** One long form combines demographics, PRP assignment, chronic-condition management, enrollment, consent, initiating visit, coordinator assignment, eligibility notes, and a seven-item first-billable-month checklist. It also tells the user to save before structured eligibility, care plan, intake, check-in, time, and billing can be completed. The primary action is the generic label “Save.”
- **Why it matters:** A first-time user sees incomplete and impossible downstream requirements before establishing the core patient record. This increases abandonment and makes validation failures hard to localize.
- **Recommended solution:** Keep one continuous experience but stage it: identify patient → confirm PRP/coordinator → save core record → guide eligibility/consent/conditions in the required order. Replace the global checklist with the next actionable prerequisite.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; shortens time to first patient and reduces training burden.

### F-07 — “My Work Today” is not scoped to the current coordinator by default

- **Priority:** P1
- **Location:** `/dashboard/worklist`
- **Description:** The initial assignment filter is blank (“Practice scope”), so Mary starts with the whole practice rather than her assigned work. She must remember to choose herself.
- **Why it matters:** A coordinator may work the wrong patient, miss assigned work, or repeatedly spend time re-establishing scope. The title promises a personal worklist that the default state does not provide.
- **Recommended solution:** Default coordinators to their own assignment, preserve the chosen scope, and make practice-wide/unassigned views deliberate exceptions.
- **Estimated engineering effort:** S
- **Expected pilot impact:** High; immediately reduces decisions and assignment mistakes.

### F-08 — Coordinator queue-group counts are page-local, not workload totals

- **Priority:** P1
- **Location:** `/dashboard/worklist` → Today’s work
- **Description:** Six queue counts are computed from the 25 patients loaded on the current page. The UI discloses this in small text, but the cards visually read as authoritative workload totals.
- **Why it matters:** With 120–250 patients, Mary cannot use the counts for prioritization or daily planning, and a zero can mean “not on this page” rather than “no work.”
- **Recommended solution:** Return server-calculated counts for the full filtered practice/assignment scope and keep pagination limited to the detail rows.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; makes the queue trustworthy.

### F-09 — The provider attention queue silently stops at 100 patients

- **Priority:** P1
- **Location:** `/dashboard/provider`
- **Description:** The provider dashboard requests page 1 with `pageSize=100`, filters those rows client-side, and exposes no total or pagination. Summary counts therefore also describe only the loaded subset.
- **Why it matters:** A physician responsible for a 120–250-patient panel may never see review work beyond the first 100 records. This is a clinical-work visibility risk, not merely a presentation issue.
- **Recommended solution:** Make provider-attention filtering and counts server-side, paginate the result, and show a complete-scope total with deterministic urgency ordering.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; prevents hidden provider work.

### F-10 — The patient workspace has many competing “next” actions

- **Priority:** P1
- **Location:** `/patients/[patientId]`
- **Description:** The first view presents billing readiness, billing month, seven quick links, a five-step instructional strip, suggested care activities, eligibility, consent, billing readiness, conditions, intake, care plan, monthly progress, and audit. Several cards expose their own “Open,” “Edit,” “Evidence,” or “Log time” action.
- **Why it matters:** The coordinator must interpret the whole patient record before deciding what to do. This conflicts with the desired Patient → Decision → Action → Documentation → Next Patient rhythm.
- **Recommended solution:** Default to a focused work state containing patient identity/safety context, the exact trigger, the current task, and one primary action. Put the comprehensive record and billing evidence behind progressive disclosure or role-specific views.
- **Estimated engineering effort:** L
- **Expected pilot impact:** High; reduces cognitive load in the screen used most often.

### F-11 — Suggestion-level deferral has no follow-up commitment

- **Priority:** P1
- **Location:** Patient workspace → Suggested care activities → Record your decision
- **Description:** A suggestion can be marked “Defer” with an optional note, but there is no follow-up date and no visible task commitment. By contrast, deferring an accepted work item requires a follow-up date.
- **Why it matters:** A clinically relevant suggestion can disappear from active review without becoming scheduled work. The two deferral meanings are inconsistent.
- **Recommended solution:** Either remove defer from the suggestion disposition or require a follow-up date and create a deferred work item. Keep “no intervention” as the explicit decision that creates no task.
- **Estimated engineering effort:** S–M
- **Expected pilot impact:** High; prevents lost follow-up work.

### F-12 — Monthly check-in still presents too many simultaneous paths

- **Priority:** P1
- **Location:** `/patients/[patientId]/checkin`
- **Description:** The same page can create a check-in, copy four message/link variants, send or resend, regenerate a link, document non-response, review and close, inspect delivery history, review responses/questions, log time, and return to the worklist. Email is the default delivery choice even though patient email delivery is optional configuration; SMS is visible but disabled.
- **Why it matters:** The coordinator must reason about lifecycle state and provider configuration instead of following one state-appropriate action. In an unconfigured environment the prominent send path can fail after work has begun.
- **Recommended solution:** Render one primary action per lifecycle state: Create → Send/Copy → Await → Review/Document non-response → Close and record time. Detect unavailable delivery providers before showing them as the default.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; reduces errors in the core monthly contact workflow.

### F-13 — Clinical reports are an opaque PRP-only side effect

- **Priority:** P1
- **Location:** Coordinator task workspace → Route to PRP; `/api/clinical-reports`; compliance report count
- **Description:** Routing creates a secure-workspace report for the PRP, but the coordinator cannot preview the report, confirm the recipient, select an approved alternate/specialist, or inspect delivery/follow-up state from a clinical-report workspace.
- **Why it matters:** A coordinator cannot verify what was routed or manage common multi-clinician handoffs. The feature records a report but does not yet support an end-to-end report workflow.
- **Recommended solution:** For pilot scope, show the PRP, purpose, included patient/task context, and resulting status before confirmation. Defer alternate recipients unless the pilot requires them, but make the created report inspectable.
- **Estimated engineering effort:** M
- **Expected pilot impact:** Medium–high; improves handoff safety and trust.

### F-14 — Compliance cannot investigate the evidence summarized by its dashboard

- **Priority:** P1
- **Location:** `/dashboard/compliance`
- **Description:** The page shows three counts and merges events, opportunities, and dispositions into a 100-row table. Secure routing records are counted but omitted from the table. Rows have no patient identity, actor, work item, filters, date range, or detail drill-down.
- **Why it matters:** A compliance reviewer can see that activity happened but cannot efficiently answer who, for which patient, under what rule, with what outcome, or whether a routing record succeeded.
- **Recommended solution:** Include report rows, patient/actor-safe identifiers, event type, outcome/status, and filters for patient, date, event, and exception. Add a read-only detail view that preserves immutable source evidence.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; turns compliance from a counter page into an audit workspace.

### F-15 — Account security is enforced but not self-manageable

- **Priority:** P1
- **Location:** Settings → Account; MFA enrollment and password-reset paths
- **Description:** Settings says password changes are handled by “the authentication provider” but provides no action. Users cannot review or replace MFA factors, access recovery guidance, review sessions, or intentionally initiate a password change while signed in.
- **Why it matters:** Lost devices, suspected compromise, and routine password changes become support incidents. For a patient-data product, the security journey must continue after first-run MFA.
- **Recommended solution:** Add a focused Security section linking supported password change, factor replacement/recovery, and session revocation operations. Keep AAL2 and reauthentication safeguards intact.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; reduces lockouts and improves security confidence.

### F-16 — Settings is a single high-load administration page

- **Priority:** P1
- **Location:** `/settings`
- **Description:** The page is approximately 1,100 lines and combines role education, practice profile, coordinator policy, CMS/Medicare attestations, subscription, practitioner list/edit/add, staff invitations, and account management. It contains many independently saved controls without a section index or clear setup-state summary.
- **Why it matters:** The practice administrator must remember where unrelated prerequisites live and can miss unsaved or incomplete sections during setup.
- **Recommended solution:** Preserve the underlying workflows but add a section index and setup-status summary, then route users directly to the incomplete section. A full settings redesign is not required.
- **Estimated engineering effort:** M
- **Expected pilot impact:** High; lowers administrator training and prerequisite hunting.

### F-17 — Front Desk Persona advertises an action its authorization rejects

- **Priority:** P1
- **Location:** Development Persona Mode → Front Desk; internal navigation; patient-create API
- **Description:** The Front Desk persona navigation includes “Add patient,” but restrictive persona roles intentionally do not satisfy current patient-write role checks. The founder can be led into a form whose save is forbidden.
- **Why it matters:** Persona Mode gives a false impression of front-desk readiness and cannot validate the workflow it advertises.
- **Recommended solution:** Until a real front-desk permission exists, remove or label the write action as unavailable in Persona Mode. When the role is operationalized under F-02, add the minimum demographic-intake permission and tests.
- **Estimated engineering effort:** XS now; M with real permission
- **Expected pilot impact:** Medium–high; restores trust in founder role simulation.

### F-18 — Eligibility repeats state and exposes non-actionable controls

- **Priority:** P2
- **Location:** `/patients/[patientId]/eligibility`
- **Description:** Coordinators see a Completion Status card, editable facts, disabled provider attestations, system validations, notes, “Save eligibility review,” “Save and continue,” and a separate Care plan link.
- **Why it matters:** The user must distinguish what can be completed now from what belongs to the provider, and choose among three competing continuations.
- **Recommended solution:** For coordinators, show only missing editable facts and one state-aware save/continue action. Summarize provider attestations as routed or pending. Providers should see their attestations as the primary action.
- **Estimated engineering effort:** S–M
- **Expected pilot impact:** Medium; reduces role confusion and scrolling.

### F-19 — Patient registry exposes clinical status to front desk and becomes a wide mobile table

- **Priority:** P2
- **Location:** `/patients`
- **Description:** The registry includes Enrollment, Eligibility, and Consent columns for every role and uses a 760-pixel minimum-width table. Front desk primarily needs identity, contact, status, and an intake action.
- **Why it matters:** Non-actionable clinical/billing states increase cognitive load and require horizontal scanning on phones.
- **Recommended solution:** Make registry columns role-aware and convert the narrow-screen view to compact patient cards or a prioritized two-column list.
- **Estimated engineering effort:** M
- **Expected pilot impact:** Medium; improves front-desk speed and mobile usability.

### F-20 — Authenticated mobile navigation relies on undisclosed horizontal scrolling

- **Priority:** P2
- **Location:** Internal header and table-based workspaces at narrow widths
- **Description:** The internal navigation is an overflow-x row, and the coordinator/provider/patient tables use 760–780-pixel minimum widths. The public shell is responsive, but authenticated users must discover sideways scrolling to reach destinations or columns.
- **Why it matters:** Practical phone use is possible but not obvious, especially for urgent review or quick patient lookup.
- **Recommended solution:** Add a compact mobile menu for navigation and card/list alternatives for the most-used worklists. Preserve desktop tables.
- **Estimated engineering effort:** M–L
- **Expected pilot impact:** Medium; supports on-call and between-room use.

### F-21 — Expanded Persona Mode controls can exceed a mobile viewport

- **Priority:** P2
- **Location:** Floating Development Persona toolbar at mobile widths
- **Description:** The expanded toolbar is fixed to the bottom and stacks five selectors, context badges, and eight quick links without a maximum height or internal vertical scrolling.
- **Why it matters:** On a 390×844 viewport, upper controls can move offscreen and the fixed panel can cover the application being evaluated.
- **Recommended solution:** Give the panel a mobile max-height with internal scrolling or use a full-height development drawer.
- **Estimated engineering effort:** S
- **Expected pilot impact:** Low for customers, high for founder review efficiency.

### F-22 — Persona Mode cannot create a clean first-run review context

- **Priority:** P2
- **Location:** `/dev/personas` and floating developer toolbar
- **Description:** Persona Mode requires a real AAL2 account, active membership, and existing practice data. It selects from real authorized practices/patients and contains no synthetic starter scenario. It therefore cannot simulate “brand-new pilot customer” without separately provisioning data.
- **Why it matters:** Founder review is fast only after a test tenant already exists, and results can vary with whatever data happens to be present.
- **Recommended solution:** Document and provide a repeatable local-only synthetic scenario through test infrastructure, not production authorization. Keep persona switching read-only and session-only.
- **Estimated engineering effort:** M
- **Expected pilot impact:** Low for customers; high for repeatable founder QA.

### F-23 — Protected routes briefly disclose an incorrect signed-in shell

- **Priority:** P2
- **Location:** Protected-route initial render, including `/dev/personas`
- **Description:** Before unauthenticated redirect, the header briefly rendered “Practice setup” and “Signed in” with internal navigation while the body said “Verifying secure access.” It then redirected correctly to login.
- **Why it matters:** The flash looks like a broken session and undermines trust, even though protected data was not displayed.
- **Recommended solution:** Keep the public/neutral shell until authentication and active practice resolve; mount internal navigation only after a confirmed authorized state.
- **Estimated engineering effort:** S
- **Expected pilot impact:** Medium; improves perceived reliability and removes confusing state leakage.

### F-24 — Practice essentials accept error-prone free-form operational data

- **Priority:** P2
- **Location:** Practice setup → time zone, phone, logo URL
- **Description:** Time zone is a free-text IANA value, phone has no visible formatting/validation, and the optional logo is a URL field while the copy says upload can be added later.
- **Why it matters:** A typo in time zone can affect billing-month and date behavior; phone/logo fields add avoidable uncertainty during first run.
- **Recommended solution:** Use a searchable time-zone selector, basic phone normalization, and defer logo entirely until upload exists.
- **Estimated engineering effort:** S–M
- **Expected pilot impact:** Medium; reduces setup mistakes.

### F-25 — Management reporting is summary-only

- **Priority:** P2
- **Location:** `/dashboard/management`
- **Description:** Practice operations shows aggregate cards and a print action, but limited drill-down into the exact patients or workflow records behind several totals.
- **Why it matters:** An administrator can see a concerning number but may need to re-find the corresponding records in another workspace.
- **Recommended solution:** Make summary values link to prefiltered worklists or billing/compliance views before adding new exports.
- **Estimated engineering effort:** S–M
- **Expected pilot impact:** Medium; converts oversight into action with fewer searches.

### F-26 — “Current user” in Persona Mode is not a user view

- **Priority:** P3
- **Location:** Floating Persona Mode toolbar
- **Description:** The “Current user” quick link opens Settings rather than a scoped current-user/account view.
- **Why it matters:** It adds uncertainty during developer testing but has no production impact.
- **Recommended solution:** Rename it “Account settings” or link to a real current-user view if one is later created.
- **Estimated engineering effort:** XS
- **Expected pilot impact:** Low.

### F-27 — The Patient persona is not a patient portal

- **Priority:** P3
- **Location:** Development Persona Mode → Patient
- **Description:** The persona opens the staff patient workspace using the developer’s real authorization. The actual pilot patient experience remains secure-link check-ins.
- **Why it matters:** A founder can inspect shared patient context, but should not interpret the view as patient-facing readiness.
- **Recommended solution:** Keep the limitation explicit. Build a dedicated patient portal only if pilot scope requires it; do not broaden staff-workspace access.
- **Estimated engineering effort:** XL if pursued
- **Expected pilot impact:** Low when secure links are accepted; high only for a portal-dependent pilot.

### F-28 — SMS delivery is visible but unavailable

- **Priority:** P3
- **Location:** Monthly check-in delivery
- **Description:** SMS appears as a disabled option because no provider is configured.
- **Why it matters:** It signals a common workflow the pilot cannot use, but secure link and configured email remain viable alternatives.
- **Recommended solution:** Hide unavailable channels behind an “Available delivery methods” explanation until a provider is selected.
- **Estimated engineering effort:** XS for copy/visibility; L for an SMS integration
- **Expected pilot impact:** Low–medium depending practice communication habits.

## Role-by-role assessment

| Perspective | What works | Highest-risk friction |
| --- | --- | --- |
| Physician | Attention queue, care-plan review, eligibility attestation, month context, patient links | Queue silently capped at 100; provider identity/access linkage is unclear; mobile table requires horizontal scroll. |
| Care Coordinator | Evidence-backed suggestions, task workspace, documented outcome, actual-time affirmation, route/defer/complete, return to worklist | Default scope is practice-wide; counts are page-local; patient/check-in workspaces have too many competing actions; suggestion defer can lose follow-up. |
| Front Desk | Patient registry, search, basic add-patient route in Persona Mode | Real front-desk role is not provisionable; advertised add-patient action is unauthorized; registry includes non-actionable clinical states. |
| Compliance reviewer | Immutable workflow data is retained and a read-only dashboard exists | Real compliance role is not provisionable; reports are omitted from the detail table; no patient/actor/filter/drill-down makes investigation impractical. |
| Practice administrator | Practice/provider bootstrap, staff invitation, practitioner management, operations summary | Required role choices are missing; provider record and login are disconnected; Settings hides prerequisites in one very long page. |

## Major workflow assessment

| Workflow | Assessment | Pilot status |
| --- | --- | --- |
| Practice onboarding | Atomic practice/owner/provider bootstrap is strong; operational readiness handoff is incomplete. | Needs review |
| Provider creation | First-provider dead end is removed; identity-to-login linkage and NPI completion remain unclear. | Needs review |
| First patient | PRP defaults and Medicare-aware DOB are strong; form is too broad and shows downstream blockers too early. | Needs review |
| Eligibility | Safety separation between user facts, provider judgment, and system checks is sound; role-specific focus is weak. | Needs review |
| Patient workspace | Comprehensive and traceable; not yet a focused coordinator terminal. | Needs review |
| Coordinator worklist | Task completion loop works; default scope and complete-scope counts are not trustworthy at pilot scale. | Blocked for scale |
| Opportunity detection | Deterministic, explainable, no automatic time; suggestion-level defer is incomplete. | Needs review |
| Clinical reports | Durable PRP routing record exists; coordinator verification and follow-up experience are incomplete. | Needs review |
| Provider review | Clear care-plan approval flow; queue completeness is unsafe beyond 100 records. | Blocked for scale |
| Compliance | Immutable data exists; reviewer investigation experience and real role assignment are incomplete. | Blocked |
| Persona Mode | Production gating and session-only overlay contracts pass; representative first-run data and some persona capabilities are misleading/incomplete. | Ready for limited founder use |
| Settings | Broad capability coverage; high cognitive load and weak prerequisite guidance. | Needs review |
| Navigation | Desktop role navigation is understandable; mobile depends on horizontal discovery and auth shell flashes incorrect state. | Needs review |
| Mobile | Public/auth pages pass practical narrow-width checks; authenticated tables and development controls need adaptation. | Needs review |

## Top ten highest-ROI improvements

1. **Prove the entire Auth email chain** for confirmation, invitation, and reset (F-01).
2. **Make pilot roles truly inviteable with least privilege** (F-02).
3. **Make coordinator and provider queues complete and authoritative**: assigned-to-me default, server counts, provider pagination (F-07, F-08, F-09).
4. **Stage first-patient onboarding around the next possible action** (F-06).
5. **Finish the practice-to-provider operational handoff**, including prerequisite visibility and provider login linkage (F-04, F-05).
6. **Turn the patient workspace into a focused current-task view** (F-10).
7. **Make check-in progression state-driven and configuration-aware** (F-12).
8. **Make every defer/routing decision durable and inspectable** (F-11, F-13).
9. **Make compliance evidence investigable, including report rows** (F-14).
10. **Add a functional public pilot-contact path and basic security self-service** (F-03, F-15).

## Recommended implementation order

### Gate 1 — Pilot access

1. F-01 Auth communication delivery and redirect validation.
2. F-02 real pilot-role provisioning and independent-account authorization checks.

Do not invite external pilot users until this gate passes.

### Gate 2 — Work cannot be hidden

3. F-07 assigned-to-me coordinator default.
4. F-08 complete-scope coordinator counts.
5. F-09 complete provider queue with server filtering and pagination.

This gate should precede usability polish because incomplete queues create patient-safety and workflow risk.

### Gate 3 — First successful patient

6. F-04 operational-readiness handoff.
7. F-05 provider identity/access linkage.
8. F-06 staged first-patient experience.
9. F-24 safer practice essentials.

### Gate 4 — Coordinator continuity

10. F-11 durable deferral.
11. F-12 state-driven check-in.
12. F-10 focused patient workspace.
13. F-18 role-specific eligibility.

### Gate 5 — Review and oversight

14. F-13 inspectable clinical routing.
15. F-14 compliance investigation.
16. F-15 account security management.
17. F-16 Settings section guidance.
18. F-25 actionable management drill-down.

### Gate 6 — Founder and responsive polish

19. F-17, F-21, F-22, and F-26 Persona Mode accuracy/usability.
20. F-19, F-20, and F-23 responsive/navigation polish.
21. F-03 public request path.
22. Retain F-27 and F-28 as explicit pilot-scope decisions unless requirements change.

## Founder conclusion

RC-003 succeeded at establishing a defensible technical workflow, but RC-004 should concentrate on operational truthfulness: every user who is shown a role must be provisionable, every queue total must mean what it appears to mean, every deferred item must come back, and every first-run screen must point to the next achievable action.

The product should remain feature-frozen until the two P0 access gates are resolved and the complete-scope worklist fixes are accepted into the pre-pilot plan. The rest can be implemented in the order above without redesigning the application or expanding the schema beyond what the existing architecture already anticipates.
