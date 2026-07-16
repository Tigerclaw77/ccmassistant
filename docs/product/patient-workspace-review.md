# Patient Workspace Clinical Workflow UX Review

Status: UX review  
Scope: `components/patients/PatientWorkspace.tsx`  
Non-goals: implementation, backend changes, new business logic, new features

This review evaluates the current Patient Workspace against the governing product priorities:

1. Adoption
2. Patient Safety
3. Privacy
4. Billing Integrity
5. User Experience
6. Efficiency
7. Automation

The Patient Workspace is directionally correct: it makes the patient detail page the central hub, reuses the condition manager, summarizes monthly status, and links into existing detailed workflow pages. The main UX problem is hierarchy. Too many cards compete for attention, and the page does not yet make the next safe action obvious enough.

# 1. First Impression

## What immediately draws attention

- Patient name, DOB, Medicare review state, provider, billing month, and current CCM status appear in the header.
- The current CCM status badge is visually prominent and gives the page an operational frame.
- Quick links are visible immediately, which helps experienced users jump to existing workflow pages.
- The first row of cards, especially Billing Readiness, signals that the page is about billability.
- The Condition Manager draws a lot of attention because it is a large full-width interactive component.

## What is confusing

- `Current CCM status` can represent different concepts depending on available data: billability status, enrollment status, or patient status. A new user may not know whether this means clinical status, enrollment status, or billing readiness.
- Billing Readiness can say `Ready` from locally computed requirements while the calculation row says `Not calculated`. That is conceptually defensible, but it reads like a contradiction.
- The page asks users to inspect multiple blocker lists: Eligibility, Consent, Billing Readiness, Care Plan, and Monthly Progress. A coordinator has to mentally merge them to determine the real next action.
- The quick-link row is useful but visually undifferentiated. `Edit patient`, `Eligibility`, `AI intake`, `Care plan`, `Check-in`, `Log time`, and `Billing` all look equally important.
- The Condition Manager is powerful but large. For users trying to answer whether the month is billable, it can interrupt the status-review flow.
- `Audit` includes `Export: HTML evidence view available`, but no export action is present in the card. The label may imply a feature beyond the linked evidence page.

## What is missing

- A single top-level answer to: `Can I safely bill CCM for this patient this month?`
- A single top-level `Next action` recommendation, such as `Log 8 more minutes`, `Complete consent elements`, or `Recalculate billability`.
- Last billability recalculation time or a clear `not calculated yet` state.
- A distinction between system readiness, human review, and final billing action.
- A visible warning area for safety-sensitive issues, such as incomplete provider attestation, missing consent, unaccepted AI summary, or flagged check-in responses.
- Patient contact information is absent from the header even though front desk and coordinator users often need it.
- The page does not visibly distinguish unsaved condition edits from persisted condition data.

# 2. Cognitive Load

## Unnecessary visual clutter

- The quick-link row contains seven equal-weight actions. This forces users to choose before the page tells them what matters.
- Each `WorkspaceCard` includes title, description, status badge, action button, and content. Repeating that structure across many cards makes the page scan like a dashboard of equal priorities instead of a workflow.
- Multiple cards show blocker lists in similar formats. This is useful data, but the repetition increases scanning burden.
- The Condition Manager includes search, banks, cards, edit controls, and a separate save button. It is valuable but too visually dominant for a monthly workspace summary.

## Duplicated information

- Conditions appear as their own large component and are also represented in Eligibility and Billing Readiness blockers.
- Consent missing elements appear in the Consent card and are duplicated into the Billing Readiness aggregate.
- Care plan missing items appear in the Care Plan card and Billing Readiness aggregate.
- Monthly minutes appear in Monthly Progress and also affect Billing Readiness.

Duplication is acceptable when one view is summary and another is detail. The current page often shows both as full detail, which increases cognitive load.

## Hidden important information

- The most important blocker is not elevated. If consent is missing, it appears in a list inside a card rather than as the page's primary next action.
- The page does not make clear whether billability has been recalculated after the latest condition, consent, care plan, or time-log change.
- Check-in responses are summarized only as status and timeline. Flagged responses or clinically meaningful patient-reported changes are not surfaced.
- Provider manual review is included in eligibility missing items, but provider identity and manual review status are not visually prominent.
- AI intake risk is understated. `Draft`, `Accepted`, and `Not accepted` are visible, but the safety principle that AI is not final documentation until accepted could be clearer.

## Excessive scrolling

- The page will become long for patients with multiple conditions because the full Condition Manager sits between the top cards and the rest of monthly workflow.
- A staff user may have to scroll past condition management to reach AI Intake, Care Plan, Monthly Progress, and Audit, even if the condition list is already complete.
- On smaller screens, the top three cards become stacked, and the core billing answer may require scrolling through several sections.

## Cards that should be merged

- Eligibility and Conditions should be more tightly connected. Conditions are part of eligibility readiness, not an unrelated mid-page island.
- Billing Readiness and Monthly Progress should share a top-level summary because minutes and check-in completion are usually the coordinator's active monthly work.
- Audit should be visually tied to Billing Readiness because evidence is the explanation for the billing decision.

## Cards that should be split

- The current Condition Manager should be split conceptually into a compact condition summary and an expanded condition editor.
- Billing Readiness should separate `System readiness` from `Human billing decision` so users can distinguish ready-to-bill from reviewed/billed.
- Monthly Progress could separate `Time` from `Patient contact` if the content grows, but for now it can remain one card with clearer summary.

# 3. Clinical Workflow

## Can staff answer: Is this patient billable?

Partially.

The page contains the answer, but it is not singular enough. Users see:

- Header `Current CCM status`
- Billing Readiness status
- Billability calculation status
- Reason codes or local missing requirements
- Audit/evidence status

This is too many places to infer billability. The workspace needs one dominant readiness summary that states:

- `Ready to bill`
- `Not ready`
- `On hold`
- `Billed`
- `Not calculated`

Then it should show the one or two highest-priority blockers underneath.

## Can staff answer: What still needs to be done?

Partially.

Missing items are present, but they are distributed across multiple cards. A coordinator can answer the question after scanning the page, but not within a few seconds. The page needs a single consolidated blocker list near the top, ordered by workflow dependency.

Recommended blocker order:

1. Practice/provider setup blockers
2. Enrollment/eligibility blockers
3. Consent blockers
4. Condition blockers
5. AI intake review blockers
6. Care plan blockers
7. Monthly check-in blockers
8. Minute threshold blockers
9. Billing review/action blockers

## Can staff answer: What should I do next?

Not reliably.

The page provides links, but it does not recommend a next action. A new coordinator must choose among seven header links plus card-level links. The absence of a prioritized next action weakens adoption and day-to-day usability.

The next action should be a display treatment, not a new workflow engine. It can be derived from the first missing requirement already shown on the page.

## Can staff answer: Is anything unsafe or incomplete?

Partially.

Incomplete items are visible, but safety-sensitive items are not visually separated from ordinary administrative blockers. Missing consent, unaccepted AI summary, missing provider attestation, manual provider review, and missing care plan review should read as higher-risk than `not calculated` or `HTML evidence unavailable`.

The workspace should reserve a consistent warning area for safety/integrity concerns.

# Role-Specific Review

## Care Coordinator

The coordinator can see most work needed for the month, especially check-in status, minutes, consent, care plan, and conditions. The current page is useful but not yet calm enough for daily operations.

Primary friction:

- No single next action.
- Too many equal-weight links and cards.
- Monthly Progress is below Conditions, AI Intake, and Care Plan, even though coordinators often live in monthly activity.
- Condition editing may distract from month execution once eligibility is complete.

Coordinator need:

- A top summary with readiness, next action, minutes, check-in status, and blockers.
- Detailed condition editing available but collapsed after readiness is satisfied.

## Front Desk

The current workspace is too clinical and billing-heavy for front desk use. A front desk user opening this page may not know what they are supposed to do.

Primary friction:

- Patient contact information is missing from the header.
- Quick links use clinical/billing terms with equal weight.
- Medicare status says `Reviewed` or `Needs review`, but does not explain whether front desk should act.
- There is no clear distinction between administrative patient details and clinical CCM work.

Front desk need:

- Patient identity and contact information always visible.
- Administrative actions, such as edit patient/contact info, visually separated from clinical/billing actions.
- Complex billing readiness details progressively disclosed.

## Nurse

The nurse can find care plan status, check-in status, and AI intake state, but clinical review information is thin.

Primary friction:

- Check-in responses are not summarized for clinical concern.
- Flagged responses are not surfaced.
- Care plan status is visible, but goals/interventions are not summarized.
- AI intake review status appears, but reviewed summary content is not previewed.

Nurse need:

- Clinical status summary near the top: care plan active, check-in responded, any flagged responses, latest patient-reported concern.
- Care Plan and Monthly Progress should sit closer together.

## Physician Quick Review

The physician can determine whether attestation and care plan review are complete, but only after scanning multiple cards.

Primary friction:

- Provider attestation is nested inside Eligibility.
- Provider approval of care plan is nested inside Care Plan.
- AI accepted status is in a separate card.
- The physician's likely quick-review question is: `What needs my review?` The page does not answer that directly.

Physician need:

- A compact `Provider review needed` summary, derived from existing statuses.
- Fewer operational details visible by default.
- Quick links to Eligibility, Intake, and Care Plan are useful, but they should be grouped as provider review actions.

# 4. Information Hierarchy

The ideal section order should optimize for adoption, patient safety, billing integrity, and staff usability.

## Recommended order

## 1. Patient Header and Month Control

Always visible:

- Patient name
- DOB
- Phone/email or preferred contact
- Billing month
- Billing practitioner
- Current billability status

Reason: orients every role immediately.

## 2. Billing Answer and Next Action

Always visible:

- `Ready to bill`, `Not ready`, `Hold`, `Billed`, or `Not calculated`
- Top blocker or next action
- Minutes logged / threshold
- Check-in status
- Link to recalculate/billing page if calculation is stale or missing

Reason: answers the workspace's core question first.

## 3. Safety and Integrity Alerts

Always visible when present:

- Missing consent
- Missing provider attestation
- Missing or unreviewed care plan
- AI draft not accepted
- Provider manual review required
- Check-in response incomplete or flagged

Reason: patient safety and billing defensibility outrank convenience.

## 4. Monthly Work Summary

Always visible:

- Minutes logged
- Remaining minutes
- Check-in status
- Last activity
- Links to check-in and time log

Reason: this is the daily coordinator workflow.

## 5. Enrollment Foundation

Summary visible, details collapsible:

- Eligibility status
- Conditions count
- Consent status
- Assigned provider

Reason: foundation must be visible, but full detail is only needed when incomplete or under review.

## 6. Clinical Documentation

Summary visible, details collapsible:

- AI intake status
- Care plan status
- Last reviewed date
- Provider review state

Reason: supports clinical confidence without crowding the monthly work surface.

## 7. Conditions

Summary visible by default:

- Qualifying count
- Active condition names
- `Manage conditions` expansion

Reason: condition editing is important during enrollment but too large for monthly scanning once complete.

## 8. Audit and Evidence

Summary visible, details collapsed:

- Evidence available
- Last snapshot date
- Link to evidence page

Reason: billing integrity matters, but audit detail is usually needed at review time, not every coordinator touch.

# 5. Dashboard Philosophy

The Patient Workspace should behave more like a clinical work surface than a data dashboard.

## Always visible

- Patient name, DOB, contact route, provider, billing month.
- One billability answer.
- One next action.
- Top blockers.
- Minutes logged and remaining.
- Check-in status.
- Consent status if missing or incomplete.
- Care plan status if missing or incomplete.

## Progressively disclosed

- Full condition manager.
- Full eligibility checklist details.
- Full consent element list when complete.
- Full AI intake details.
- Care plan contents.
- Audit event counts and evidence details.
- Inactive conditions.

## Hidden unless expanded

- Recent/Favorites/Search condition banks when the user is not actively editing conditions.
- Full blocker lists for sections that are already complete.
- Audit event count if no evidence exists yet.
- Technical labels such as `HTML evidence view available`.

## Where accordions would help

- Conditions: collapsed by default once 2+ qualifying active conditions exist.
- Eligibility: show summary; expand to missing facts and attestations.
- Consent: show missing elements only if incomplete; collapse completed element list.
- AI Intake: show status; expand draft/accepted metadata.
- Audit: show snapshot/evidence status; expand audit event summary.

## Where badges would help

- Header: `Ready to bill`, `Not ready`, `Hold`, `Billed`, `Not calculated`.
- Foundation row: `Eligibility`, `Consent`, `Conditions`, `Provider`.
- Monthly row: `Check-in`, `Minutes`, `Care plan`, `AI intake`.

## Where summaries would help

- A single `This month` summary near the top:
  - `18 / 20 minutes`
  - `Check-in responded`
  - `Consent complete`
  - `Care plan active`
  - `Next: log 2 more minutes`

# 6. Immediate UX Improvements

These are the ten highest-value improvements that require minimal engineering effort and do not add new backend functionality.

## 1. Add a top-level readiness summary panel

Problem: Billability is distributed across header, Billing Readiness, and Audit.

Improvement: Add a single first card stating the patient-month status, calculation state, top blocker, minutes, and check-in status.

Benefit: Users answer `Can I safely bill this month?` immediately.

## 2. Add a `Next action` line

Problem: The page has many links but no recommendation.

Improvement: Derive a display-only next action from the first blocker already computed in `billingMissing` or billability reason codes.

Benefit: Coordinators know what to do without interpreting the whole page.

## 3. Rename `Current CCM status`

Problem: It can represent billability, enrollment, or patient status.

Improvement: Use a more precise label such as `Patient-month status` or `Billing readiness status`.

Benefit: Reduces confusion and improves billing integrity.

## 4. Clarify `Ready` versus `Not calculated`

Problem: Billing Readiness can look ready while calculation says not calculated.

Improvement: When no billability row exists, label the card `Checklist complete - not recalculated` or `Not calculated`.

Benefit: Prevents users from mistaking local completeness for reviewed billability.

## 5. Collapse Condition Manager after readiness is satisfied

Problem: The full condition editor dominates the page.

Improvement: Show a compact conditions summary by default when 2+ qualifying active conditions exist; expand to manage.

Benefit: Keeps monthly workflow focused while preserving editability.

## 6. Reorder Monthly Progress above AI Intake and Conditions detail

Problem: Coordinators need monthly work status quickly, but it sits lower on the page.

Improvement: Move Monthly Progress near the top, directly after the readiness summary.

Benefit: Better supports all-day coordinator workflow.

## 7. Group quick links by role or workflow

Problem: Seven equal-weight links create decision noise.

Improvement: Split into primary action plus secondary links, or group as `Monthly work`, `Clinical review`, `Billing`.

Benefit: Improves adoption without changing destinations.

## 8. Surface safety/integrity blockers separately

Problem: Missing consent and missing provider attestation look like ordinary checklist items.

Improvement: Add a warning strip when consent, provider attestation, care plan review, AI acceptance, or provider manual review is incomplete.

Benefit: Reinforces patient safety and billing defensibility.

## 9. Add contact details to the patient header

Problem: Front desk and coordinators need phone/email frequently.

Improvement: Show phone, email, and preferred contact method in the header.

Benefit: Makes the workspace more useful for daily staff without adding functionality.

## 10. Change Audit wording from `Export` to `Evidence`

Problem: `Export: HTML evidence view available` implies an export feature.

Improvement: Use `Evidence view: Available` and keep the Evidence link.

Benefit: Avoids overpromising and aligns with MVP scope.

# Summary Assessment

The Patient Workspace is a strong foundation because it brings the monthly CCM workflow into one place and preserves deep links to existing task pages. The current implementation is functionally coherent but visually too egalitarian. It treats eligibility, consent, billing, conditions, AI intake, care plan, monthly progress, and audit as peer cards, when staff need a hierarchy.

The next UX pass should not add new workflow capability. It should reorganize what already exists into:

1. One billability answer.
2. One next action.
3. Visible safety/integrity warnings.
4. Monthly progress near the top.
5. Detailed foundation and audit information progressively disclosed.

This would make the workspace feel more like a daily clinical operations surface and less like a set of assembled data cards.
