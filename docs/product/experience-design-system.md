# CCM Assistant Experience Design System

Status: governing UI/UX reference  
Scope: product experience standards for CCM Assistant  
Non-goals: visual redesign, implementation plan, component API specification, brand system

This document translates the CCM Assistant product principles into concrete experience standards for future UI implementation. It should be read alongside:

- `docs/product/product-principles.md`
- `docs/product/ux-backlog.md`
- `docs/product/ccm-workflow-spec.md`
- `docs/product/vertical-slice-mvp.md`

CCM Assistant is a clinical operations and billing-readiness product. Its interface should help physician practices trust the workflow, protect patient safety, preserve privacy, and defend billing decisions. It should not feel like a black box, a sales dashboard, or a generic admin panel.

# Governing Decision Rule

Whenever multiple UX options exist, evaluate them in this order:

1. Adoption
2. Patient Safety
3. Privacy
4. Billing Integrity
5. User Experience
6. Efficiency
7. Automation

Efficiency and automation are valuable only when they do not weaken trust, documentation quality, reviewability, or billing defensibility.

# Experience Model

CCM Assistant has three primary presentation experiences over the same workflow and source of truth:

1. Executive Experience
2. Staff Experience
3. Patient Experience

These are not separate products. They are different lenses over the same clinical, operational, and billing records.

The Staff Experience is the primary experience. Care coordinators, front desk users, MAs, and nurses spend the most time in the product and should drive the everyday usability standard.

# Audience 1: Executive Experience

## Users

- Practice owner
- Physician owner
- Administrator
- Compliance or financial reviewer

## Primary Goals

- Confidence
- Financial oversight
- Compliance visibility
- Practice health

## Information Hierarchy

Executive screens should answer:

1. Is the practice operationally healthy?
2. Are patient-months ready, blocked, held, reviewed, or billed?
3. What compliance or documentation risks require attention?
4. What financial or operational work remains?

Recommended hierarchy:

1. Practice-level status
2. Billing readiness summary
3. Compliance and documentation blockers
4. Patient-month exceptions
5. Evidence and audit access
6. Trend or performance information, when available

Executive users should not have to inspect every patient workflow step unless something needs review.

## Dashboard Philosophy

Executive dashboards should be summary-first and exception-driven.

Always visible:

- Current practice
- Billing month or reporting period
- Ready / not ready / hold / billed counts
- High-risk blockers
- Evidence availability
- Manual review queues or exceptions

Progressively disclosed:

- Patient-level details
- Full blocker lists
- Audit event history
- Time log detail
- Condition and care plan detail

Avoid:

- Dense patient-level operational forms
- Large editable clinical components
- Raw reason codes
- Overly optimistic financial projections

## Tone

Tone should be calm, precise, and defensible.

Use:

- "Ready for billing review"
- "Documentation incomplete"
- "Manual review needed"
- "Evidence available"
- "Held for review"

Avoid:

- "Guaranteed billable"
- "Approved by CCM Assistant"
- "Automatically compliant"
- "Claim ready" when the product does not submit or validate claims

## Visual Style

Executive screens should feel stable and credible.

Use:

- Clear summary bands
- Compact but readable cards
- Tables for review queues and patient-month lists
- Conservative status colors
- Plain-English explanations
- Prominent evidence links

Avoid:

- Decorative graphics that obscure operational meaning
- Large marketing-style hero areas
- Overuse of charts before the underlying workflow is trusted
- Status colors without labels

## Typical Workflows

Executive workflows include:

- Review practice setup completeness.
- Review monthly billing readiness totals.
- Inspect patient-months on hold.
- Open evidence packets.
- Confirm reviewed or billed states.
- Review compliance blockers.
- Identify operational bottlenecks across staff workflow.

# Audience 2: Staff Experience

## Users

- Care coordinator
- Front desk
- Medical assistant
- Nurse

## Primary Status

This is the primary CCM Assistant experience.

These users may spend all day inside the product. The interface should be comfortable, predictable, readable, and low-friction without removing meaningful review steps.

Core principle:

**Reduce cognitive load before reducing clicks.**

A shorter workflow is not automatically better. A workflow is better when staff can understand the patient state, trust what changed, avoid omissions, and know what to do next.

## Optimize For

- Comfort
- Low cognitive load
- Readability
- Confidence
- Predictability
- Clear next action
- Safe completion of clinical and billing documentation

## Typography

Staff screens should use practical, readable typography.

Standards:

- Body text should be easy to read for full-day use.
- Field labels should be visually active, not faint or disabled-looking.
- Section headings should stand out clearly from helper text.
- Status labels should be text-first, color-second.
- Dense operational screens should use compact headings rather than oversized display text.
- Avoid tiny helper text for clinically or billing-relevant information.

Recommended hierarchy:

- Page title: clear patient, workflow, or dashboard name.
- Section title: operational purpose.
- Field label: strong enough to scan.
- Helper text: readable and concise.
- Metadata: smaller but still legible.

## Contrast

Contrast must support all-day use.

Standards:

- Labels and secondary text should not appear disabled.
- Placeholder text should be visually distinct from entered values.
- Disabled controls should look clearly unavailable.
- Blockers and warnings should be readable without relying only on color.
- Important information should never be hidden in pale gray text.

Use muted color for lower priority, not low legibility.

## Density

Staff screens should be dense enough for repeated work but not crowded.

Use higher density for:

- Worklists
- Billing rows
- Patient-month status summaries
- Time log tables

Use more space for:

- Patient onboarding
- Consent capture
- Eligibility attestation
- AI-generated draft review
- Care plan review
- Patient safety warnings

Avoid:

- Page sections that require excessive scrolling before the next action is visible.
- Multiple large editable components competing on the same screen.
- Equal visual weight for every workflow step.

## Form Philosophy

Forms should feel deliberate and reviewable.

Standards:

- Required fields must be clearly marked.
- Required indicators should be visible near labels.
- Avoid "Condition 1" / "Condition 2" style fields when the product can evaluate a list.
- Group related fields by workflow meaning, not database table.
- Show save/success/error feedback after important actions.
- Distinguish editable values from read-only values.
- Avoid making editable fields look disabled.
- Use explicit edit, save, and cancel modes for complex objects.

Meaningful review is valuable. Do not compress clinical or billing attestation into ambiguous one-click actions.

## Navigation Philosophy

Staff navigation should support predictable repeated work.

Standards:

- The patient workspace is the central hub.
- Deep pages should remain available for focused work.
- Every deep page should link back to the patient workspace.
- Primary action should be visually distinct from secondary navigation.
- Avoid rows of equal-weight links when one next action is more important.
- Use breadcrumbs for patient-specific workflows.
- Preserve billing month context where possible.

Global navigation should remain simple:

- Dashboard
- Patients
- Worklist
- Billing
- Practice
- Settings
- Account
- Logout

## Progressive Disclosure

Staff screens should show what matters now and hide what is only occasionally needed.

Always visible when relevant:

- Current patient
- Billing month
- Billability status
- Next action
- Top blockers
- Safety/integrity alerts
- Minutes logged and remaining
- Check-in status

Progressively disclosed:

- Full condition manager after condition readiness is satisfied
- Full eligibility checklist when complete
- Full consent element list when complete
- Full AI intake details after acceptance
- Full audit event history
- Inactive or historical records

Hidden unless expanded:

- Recent/Favorites/Search condition banks
- Raw metadata
- Technical reason codes
- Detailed audit JSON
- Low-priority historical activity

## Status Indicators

Statuses should be plain-English and role-relevant.

Status patterns:

- `Ready to bill`
- `Not ready`
- `On hold`
- `Billed`
- `Needs review`
- `Complete`
- `Missing`
- `In progress`

Always pair color with text.

Do not expose raw system codes such as `missing_checkin_response` in the UI.

Use badges for compact state, not for long explanations. Use blocker lists for explanations.

## Empty States

Empty states should explain why the section exists and what to do next.

Good empty state:

- "No active care plan yet. Create and review a care plan before billing readiness can pass."

Weak empty state:

- "No data."

Empty states should include:

- What is missing
- Why it matters
- Next action or destination

## Error States

Error states must preserve confidence.

Standards:

- Say what failed.
- Say whether data may have been saved partially.
- Provide the next safe action.
- Avoid technical stack language unless useful for support.
- Do not silently fail after clinical or billing actions.

Examples:

- "Patient saved, but conditions were not saved. Review conditions before billing readiness."
- "Billability row not found. Recalculate billing readiness before marking reviewed."

# Audience 3: Patient Experience

## Users

Patients, primarily Medicare population.

## Optimize For

- Trust
- Accessibility
- Simplicity
- Large typography
- Plain language
- Low intimidation
- Completion confidence

## Reading Level

Patient-facing copy should use plain language.

Standards:

- Prefer short sentences.
- Avoid billing jargon unless necessary.
- Avoid clinical acronyms without explanation.
- Ask one idea at a time.
- Use reassuring, factual language.

Use:

- "Your care team will review your answers."
- "Call the practice if you need help."
- "You have already submitted this check-in."

Avoid:

- "Your CCM monthly instance is closed."
- "Submission persisted."
- "You are billable."

## Layout

Patient screens should be visually simple.

Standards:

- Single-column layout by default.
- Large text and generous spacing.
- Clear practice name and provider name if available.
- Support phone/email visible.
- Privacy statement visible.
- Required fields clearly marked.
- Friendly completion page.

Avoid:

- Dense dashboards
- Multi-column clinical forms
- Raw status codes
- Small text
- Unclear buttons

## Button Sizing

Buttons should be large enough for older patients and mobile users.

Standards:

- Primary buttons should be visually obvious.
- Touch targets should be comfortably sized.
- Avoid multiple competing primary buttons.
- Use clear verbs such as `Submit answers`, `Continue`, `Call practice`.

## Messaging Tone

Tone should be calm, human, and trustworthy.

Use:

- "Thank you. Your responses were sent to your care team."
- "Some questions are required so your care team has enough information."
- "If this is urgent, call your doctor or emergency services."

Avoid:

- Alarmist language
- Billing-focused language
- AI-focused language
- Internal workflow terminology

## Accessibility

Patient-facing screens should be accessible by default.

Standards:

- Large readable type.
- Strong contrast.
- Clear focus states.
- Keyboard-accessible form controls.
- Proper labels for every input.
- Error messages associated with fields.
- Avoid relying on color alone.
- Make completion states obvious to screen readers and sighted users.

# Global Design Rules

## Card Hierarchy

Cards should communicate hierarchy, not just grouping.

Use cards for:

- Repeated patient rows
- Focused workflow summaries
- Evidence sections
- Modals or bounded tools
- Patient-month status modules

Avoid:

- Cards inside cards
- Every page section as a floating card when a simple section would work
- Equal-weight cards for unequal priorities

Recommended card levels:

1. Page summary card: one per major workspace when needed.
2. Primary action/status card: answers the main workflow question.
3. Supporting cards: grouped details and secondary workflow areas.
4. Collapsible detail panels: detailed records, history, and audit.

## Status Colors

Colors should be consistent and conservative.

Suggested meanings:

- Green: complete, ready, accepted, safe to proceed.
- Amber: needs review, incomplete but not blocked, warning, manual review.
- Red: blocking, missing required item, failed action, unsafe to proceed.
- Blue or neutral: informational, draft, in progress, not yet reviewed.
- Slate/gray: inactive, archived, disabled, unavailable.

Rules:

- Never rely on color alone.
- Always include a text label.
- Do not use green for states that still require human billing action.
- Distinguish `ready for review` from `billed`.

## Warning Philosophy

Warnings should protect patient safety and billing integrity.

Use warnings for:

- Missing consent
- Missing consent elements
- Missing provider attestation
- Missing active care plan
- Unaccepted AI draft
- Provider manual review required
- Incomplete check-in
- Insufficient minutes
- Stale or missing billability calculation

Warnings should be visible near the relevant workflow area and elevated when they block billability.

Do not overuse warnings for ordinary neutral states, or users will stop trusting them.

## Success Philosophy

Success messages should confirm meaningful completion.

Use success for:

- Patient saved
- Conditions saved
- Consent updated
- Care plan activated
- Check-in submitted
- Time logged
- Billing recalculated
- Marked reviewed
- Marked billed

Success should be brief, visible, and specific.

Avoid implying more than happened. For example:

- Use "Billing readiness recalculated."
- Avoid "Claim approved."

## Required Field Indicators

Required fields should be obvious before submission.

Standards:

- Use a clear required marker near the label.
- Required markers must have sufficient contrast.
- Do not rely on placeholder text to indicate required fields.
- For clinical checklists, explain why required items matter.
- Validation errors should identify the field and the required correction.

## Progress Indicators

Progress should reflect meaningful workflow state, not arbitrary completion percentages.

Recommended progress indicators:

- Checklist state: complete / missing / needs review.
- Patient-month readiness: not ready / ready to bill / hold / billed.
- Minute progress: logged / threshold / remaining.
- Intake: not started / draft / accepted.
- Care plan: missing / draft / active / reviewed.
- Consent: missing / obtained / revoked.

Avoid:

- Decorative progress bars with unclear meaning.
- Percent complete when the workflow is not linear.
- Progress that hides hard blockers.

## Timeline Presentation

Timelines should explain clinical and billing evidence.

Use timelines for:

- Monthly patient contact history
- Time logs
- Check-in sent/responded/closed
- Consent updates
- Billing reviewed/billed events
- Evidence snapshot creation

Timeline rules:

- Show date/time, actor where available, action, and short note.
- Keep recent events visible.
- Collapse older or lower-priority events.
- Distinguish audit events from clinical timeline when needed.
- Do not mix raw audit metadata into routine clinical timeline views.

## Badge Usage

Badges are for compact state, not explanation.

Good badge usage:

- `Ready to bill`
- `Needs review`
- `Active`
- `Missing`
- `Accepted`
- `Billed`

Poor badge usage:

- Long reason text
- Raw reason codes
- Multiple badges that repeat card content

Badges should be readable, text-first, and color-supported.

## Table Usage

Use tables for comparison and review queues.

Good table use:

- Patients list
- Worklist
- Billing dashboard
- Time log history
- Evidence rows
- Provider list

Table standards:

- Keep primary identifier first.
- Put status and blockers early.
- Use plain-English labels.
- Keep actions predictable and right-aligned where appropriate.
- Avoid tables for complex edit forms.
- Avoid wrapping too much dense text into table cells.

## Form Spacing

Forms should balance scanability and comfort.

Standards:

- Group fields by workflow intent.
- Use consistent vertical spacing between fields.
- Use section headings for major workflow steps.
- Avoid huge gaps that force unnecessary scrolling.
- Avoid cramped controls that cause data-entry fatigue.
- Use full-width fields for long text.
- Use compact grids for short demographic or settings fields.

## Keyboard Accessibility

All product surfaces should support keyboard operation.

Standards:

- Every interactive element must be reachable by keyboard.
- Focus states must be visible.
- Buttons and links must use semantic elements.
- Form inputs must have labels.
- Keyboard order should follow visual order.
- Collapsible panels must be operable with keyboard.
- Disabled controls must be skipped or clearly unavailable.
- Error and success messages should be announced or placed where users encounter them naturally.

# Theme Philosophy

Themes may be introduced later, but themes must only change presentation.

The workflow remains identical across themes.

Themes must not:

- Change required fields
- Hide blockers
- Change status meaning
- Alter billing logic
- Reduce accessibility
- Make clinical warnings less visible

## Executive Theme

Future executive themes may emphasize:

- Calm summary views
- Financial and compliance clarity
- High-level practice health
- Conservative styling

This theme should not make clinical or billing uncertainty appear more certain.

## Comfort Themes

Future comfort themes may support all-day staff use.

Possible goals:

- Softer backgrounds
- Higher contrast text
- Reduced glare
- Larger spacing options
- User-selectable density

Comfort themes should prioritize readability over decoration.

## Seasonal Themes

Seasonal themes may add restrained visual warmth after core workflows are stable.

Rules:

- Must be optional.
- Must preserve contrast.
- Must not distract from clinical or billing work.
- Must not alter workflow hierarchy.

## Holiday Themes

Holiday themes should be subtle and optional.

Avoid:

- Distracting backgrounds
- Novelty styles on clinical warning states
- Reduced seriousness around billing or patient safety

# Future Personalization

Personalization should improve comfort and reduce repeated effort without changing clinical or billing rules.

## User Appearance Preferences

Future support may include:

- Preferred theme
- Text size preference
- Density preference
- High-contrast mode
- Reduced motion

These preferences should apply presentation-only changes.

## Remember Collapsed Panels

Remembering collapsed panels can reduce staff fatigue.

Examples:

- Condition banks
- Completed consent elements
- Completed eligibility details
- Audit history
- Inactive conditions

Rules:

- Critical warnings should not stay hidden.
- Collapsed complete sections should still show summary state.
- User preference should not obscure new blockers.

## Favorite Condition Banks

Condition banks should assist without cluttering the workflow.

Future banks:

- Recent
- Practice favorites
- Search
- Provider-specific frequent conditions

Rules:

- Collapsed by default unless actively used.
- Remember user preference.
- Never require staff to know ICD-10 to enter a common condition.
- Always distinguish user-entered text from canonical condition and code.

## Adaptive Layouts

Adaptive layouts may help different roles work more comfortably.

Examples:

- Coordinator: next action, monthly progress, contact, blockers.
- Nurse: clinical status, care plan, patient responses, concerns.
- Physician: review-needed items, attestations, care plan approval.
- Executive: practice health, billing readiness, holds, evidence.

Rules:

- Adapt layout, not source of truth.
- Do not hide required workflow steps.
- Do not personalize away safety or billing warnings.

# Screen-Level Standards

## Patient Workspace

The Patient Workspace should answer:

**Can I safely bill CCM for this patient this month?**

It should show:

- Patient identity and contact route.
- Billing month.
- One billability answer.
- One next action.
- Safety and integrity blockers.
- Monthly progress.
- Foundation status: eligibility, consent, conditions, provider.
- Clinical documentation status: AI intake and care plan.
- Evidence and audit access.

Detailed editing should remain available through deep links or progressive disclosure.

## Worklist

The Worklist should answer:

**Which patients need attention today?**

It should show:

- Patient.
- Billing month.
- Enrollment and consent state.
- Provider state.
- Conditions readiness.
- Check-in state.
- Minutes progress.
- Plain-English blockers.
- Next likely action.

The Worklist should not become a billing evidence page or full patient chart.

## Billing Dashboard

The Billing Dashboard should answer:

**Which patient-months are ready for billing review, held, billed, or blocked?**

It should show:

- Month selector.
- Patient-month rows.
- Status.
- Minutes.
- Plain-English blocker summary.
- Review/hold/billed actions.
- Evidence link.

Billing actions should use confirmation dialogs and clear success feedback.

## Evidence View

The Evidence View should answer:

**Why was this patient-month considered ready, held, not ready, reviewed, or billed?**

It should show:

- Patient and practice identity.
- Billing practitioner.
- Enrollment and eligibility.
- Consent.
- Conditions.
- Care plan.
- Check-in responses.
- Time logs.
- Billability result.
- Audit events.
- Snapshot status.

Evidence views should prioritize completeness, traceability, and clarity over compactness.

# Copy Standards

## Use Plain Operational Language

Use:

- "Add consent date"
- "Complete provider attestation"
- "Log 8 more CCM minutes"
- "Create active care plan"
- "Open evidence view"

Avoid:

- "Resolve reason code"
- "Mutation failed"
- "Entity not found"
- "Run workflow"

## Separate System Checks From Human Decisions

Use:

- "System checklist complete"
- "Provider attestation missing"
- "Ready for billing review"
- "Marked billed by practice"

Avoid:

- "CCM Assistant approved this month"
- "Automatically billable"
- "Guaranteed eligible"

## AI Copy

AI-generated content should always be framed as draft until reviewed.

Use:

- "AI draft"
- "Needs review"
- "Accepted summary"
- "Regenerate draft"

Avoid:

- "Final summary" before acceptance
- "AI-approved"
- "Autogenerated care plan is active"

# Implementation Review Checklist

Before shipping a new UI surface, check:

- Does the screen have one clear purpose?
- Is the primary action obvious?
- Is the next safe action visible?
- Are blockers plain-English?
- Are clinical and billing warnings elevated?
- Are AI drafts clearly marked as draft?
- Are required fields obvious?
- Are success and error states specific?
- Can keyboard users complete the workflow?
- Is the page comfortable for repeated staff use?
- Does the screen avoid implying reimbursement certainty?
- Does it preserve human review where it matters?

# Final Principle

The best CCM Assistant interface is not the one with the fewest clicks. It is the one a real practice can understand, trust, operate safely, and defend during billing review.

Design should remove wasted effort, not meaningful professional judgment.
