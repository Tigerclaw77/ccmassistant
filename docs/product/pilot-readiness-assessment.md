# CCM Assistant 30-Day Pilot Readiness Assessment

Status: product readiness assessment  
Scope: operational friction for a friendly Internal Medicine practice running a 30-day pilot  
References:

- `docs/product/product-principles.md`
- `docs/product/experience-design-system.md`
- `docs/product/vertical-slice-mvp.md`

Non-goals:

- Sales
- Pricing
- Marketing
- Feature redesign
- Implementation specification

# Executive Summary

CCM Assistant is ready for a tightly supported 30-day pilot with a friendly Internal Medicine practice if the pilot is framed as a controlled workflow validation, not a self-serve production rollout.

The strongest product value is clear: the app can organize one patient-month around enrollment, eligibility, consent, chronic conditions, AI-assisted intake, care plan, monthly contact, time logs, billing readiness, and evidence. That is the right center of gravity. It supports the product principles well: adoption, patient safety, privacy, and billing integrity come before automation.

The main pilot risk is not missing advanced functionality. The main risk is operational ambiguity. Staff need to know where to start every morning, how to recover when a step is missed, what CCM Assistant is validating, what remains human judgment, and how the evidence view maps to their normal billing and EHR workflows.

The product should not chase more features before the pilot. It should strengthen the guided operating model around the existing vertical slice.

# Pilot Readiness Score

Estimated score: **78 / 100**

Interpretation:

- Suitable for a friendly, closely supported 30-day pilot.
- Not yet suitable for a hands-off practice rollout.
- Strong enough to demonstrate value if the pilot starts with one or two carefully selected patients.
- Most likely failure mode is staff uncertainty, not technical impossibility.

# Assumptions

- One friendly Internal Medicine practice.
- One practice owner or administrator.
- One billing practitioner.
- One coordinator or staff operator.
- A small number of pilot patients, starting with one complete patient-month.
- No EHR integration.
- No claims submission.
- No automated email or SMS delivery.
- The practice understands that CCM Assistant supports billing readiness and evidence, but does not guarantee reimbursement.

# 1. Practice Onboarding

## What Works

- The practice setup flow captures the right early objects: practice, billing practitioner, NPI, practitioner type, and CMS-facing attestations.
- The product philosophy is aligned with pilot trust: it does not claim to automate billing, replace provider judgment, or write directly into the EHR.
- Settings allow later correction of practice and billing practitioner information, which reduces fear of setup mistakes.

## Likely Friction

| Friction | Why it matters during a pilot | Severity |
| --- | --- | --- |
| The practice may not know the intended order after setup. | Staff may jump to patients, billing, or settings without understanding the minimum path. | High |
| CMS setup attestations may need verbal explanation. | Users may ask whether checking the box creates legal/compliance responsibility. | High |
| Billing practitioner type and manual review may feel unfamiliar. | Staff may not understand why some practitioner types need review. | Medium |
| No explicit pilot mode or first-month checklist at the practice level. | The practice may not know whether setup is complete enough to begin. | Medium |
| No EHR workflow guidance. | Staff may ask whether they should copy summaries into the chart, print evidence, or document elsewhere. | High |

## Onboarding Verdict

A real office could complete onboarding with a 15 to 30 minute guided session. It is not yet self-explanatory enough for an unsupported first login.

# 2. Staff Training

## What Requires Explanation

- CCM Assistant supports documentation and billing readiness; it does not submit claims.
- "Ready for Billing" means the patient-month appears complete according to the configured checklist, not that payment is guaranteed.
- System validations are separate from provider/practice attestation.
- AI intake is draft documentation until accepted after human review.
- Time logs must reflect meaningful CCM work and belong to the correct billing month.
- Evidence view is the operational audit packet, not a formal Medicare claim record.
- Public check-in links are manually copied and sent during the pilot.
- Care plan review matters because the active care plan anchors the monthly CCM record.

## What Should Be Self-Explanatory

- How to add a patient.
- How to add conditions.
- How to see missing billing-readiness items.
- How to log time.
- How to open a patient workspace.
- How to open evidence for a patient-month.
- How to mark reviewed, hold, or billed.

## Training Requirements

| Role | Training Needed | Time Estimate |
| --- | --- | --- |
| Practice owner | Product boundary, billing readiness, evidence view, reviewed/billed workflow. | 30 minutes |
| Billing practitioner | Eligibility attestation, AI review, care plan review, what "manual review" means. | 20 minutes |
| Coordinator | Daily worklist, patient workspace, consent, condition entry, check-ins, time logs, recovery workflow. | 60 to 90 minutes |
| Front desk or MA | Patient demographics, contact fields, condition capture basics, public link handling. | 30 minutes |
| Billing staff | Billing dashboard, readiness blockers, evidence packet, reviewed/billed state. | 30 minutes |

# 3. Daily Workflow

## Morning Start

Staff should begin each day in this order:

1. Open Worklist.
2. Confirm the current billing month.
3. Review patients with blockers.
4. Open the patient workspace for the first patient needing attention.
5. Complete missing documentation or follow-up.
6. Log any CCM time immediately after work is performed.
7. Recalculate billing readiness after meaningful changes.

## Current Strengths

- Worklist gives a plain-English list of blockers.
- Patient workspace centralizes status across eligibility, conditions, consent, AI intake, care plan, monthly progress, billing readiness, and audit.
- Billing dashboard gives a month-based readiness view.
- Evidence view provides a clear destination for audit confidence.

## Current Friction

| Friction | Impact |
| --- | --- |
| Staff may not know whether to start in Dashboard, Patients, Worklist, or Billing. | Slows daily adoption and increases missed steps. |
| Worklist is useful, but it may not yet feel like the default "today" screen. | Coordinators may browse patient records manually instead of acting from blockers. |
| Billing month context can be changed on several screens. | Staff may accidentally review or log against the wrong month. |
| No explicit "next best action" ranking. | A blocked patient may show many issues without making the first recovery step obvious. |
| Manual public check-in delivery requires local practice process. | Staff must remember to send the link outside the system. |

## Daily Workflow Verdict

The daily workflow can work for a small pilot, but the practice needs a recommended morning routine. The product should make Worklist feel like the operational home base for staff.

# 4. Failure Recovery

## If Someone Forgets a Step

| Missed Step | Current Recovery Signal | Likely Friction | Severity |
| --- | --- | --- | --- |
| Missing consent | Worklist, patient workspace, billing readiness blockers. | Staff still need to know whether consent can be backfilled or must be re-obtained. | High |
| Missing consent date | Blocker appears. | Recovery is obvious, but policy implications may need training. | Medium |
| Missing chronic condition | Condition readiness and blocker appear. | Staff may not know whether a manual condition is acceptable without ICD-10 normalization. | Medium |
| Missing provider assignment | Blocker appears. | Term "billing practitioner" helps, but staff may need to know who should be assigned. | Medium |
| Missing provider attestation | Eligibility remains Needs Review. | Physician may not know where to go unless staff routes them there. | High |
| Missing accepted AI intake | Workspace and worklist show missing intake. | Users may ask whether AI intake is truly required or just helpful. | Medium |
| Missing care plan | Blocker appears. | Recovery is clear if the user knows care plan must be reviewed and active. | Medium |
| Missing check-in response | Blocker appears. | Recovery path depends on whether staff should resend link, call patient, or close with documentation. | High |
| Insufficient minutes | Worklist and billing show remaining minutes. | Recovery is obvious, but staff must understand what time is appropriate to log. | High |
| Wrong billing month | Not always obvious until evidence or billing does not match expectations. | High risk of staff confusion. | High |

## Recovery Verdict

The product exposes missing items well. The weak point is operational interpretation: when a missing item appears, staff need guidance on the acceptable recovery action.

# 5. Audit Confidence

## What Inspires Confidence

- Evidence view collects enrollment, eligibility, consent, chronic conditions, care plan, AI intake, check-in responses, time logs, billability result, and audit events.
- Billing readiness is explainable through missing items rather than raw codes.
- Human review states are visible.
- AI is framed as draft until accepted.
- Time logs are tied to billing month.

## What May Still Create Doubt

| Concern | Why a practice might hesitate |
| --- | --- |
| Evidence view is HTML only. | Billing or compliance staff may expect PDF, print, or export artifacts. |
| No formal audit packet checklist header. | Users may not immediately know whether the packet is complete enough to save externally. |
| No EHR copy/export workflow. | Staff may worry that documentation in CCM Assistant is separate from the medical record. |
| Audit events may not be meaningful enough to non-technical staff. | If audit events read like system actions, confidence drops. |
| Reviewed/billed state does not equal claim submission. | Billing users need this distinction reinforced. |
| No explicit policy disclaimer. | Practices may ask who is responsible if readiness is wrong. |

## Audit Verdict

Audit confidence is good for a pilot demonstration and early workflow validation. It is not yet strong enough for a practice to feel fully independent without export guidance and a simple audit-readiness explanation.

# 6. Trust

## Trust Strengths

- The product does not over-automate clinical or billing decisions.
- It preserves human review.
- It shows missing requirements clearly.
- It keeps AI bounded to draft documentation.
- It makes billing evidence visible.

## Trust Risks

| Trust Risk | Likely User Reaction |
| --- | --- |
| AI summary quality varies. | "Can I trust this, or do I need to rewrite everything?" |
| Billing readiness sounds official. | "Is the software saying this is definitely billable?" |
| No EHR integration. | "Will this create duplicate documentation work?" |
| Manual check-in link delivery. | "Will staff remember to send this every month?" |
| Condition normalization is partial. | "Is the diagnosis list clinically/coding accurate?" |
| Manual review terminology. | "Who is supposed to review this and where?" |
| Multiple places show status. | "Which screen is the source of truth?" |
| Evidence view lacks export. | "How do I keep this for our records?" |

## Trust Verdict

The product is philosophically trustworthy. The pilot needs small operational guardrails so staff understand what the system is and is not responsible for.

# 7. Adoption

## Ten Biggest Reasons a Practice Might Stop Using CCM Assistant in Month One

1. Staff do not know where to start each morning.
2. The practice feels it is duplicating EHR documentation without a clear handoff.
3. The coordinator forgets to send or follow up on public check-in links.
4. The physician does not understand when and where attestation or review is needed.
5. Billing staff are unsure whether "Ready for Billing" is defensible enough.
6. Staff log time inconsistently or are unsure what counts as CCM time.
7. The evidence view is not exportable or easy to file with the practice's normal records.
8. AI intake creates more review burden than expected.
9. Staff accidentally work in the wrong billing month.
10. A missing item appears, but the acceptable recovery path is unclear.

## Ten Strongest Reasons a Practice Would Continue Using CCM Assistant

1. It makes missing CCM documentation visible instead of hidden in notes or spreadsheets.
2. It gives coordinators one patient workspace for the month.
3. It shows billing blockers in plain English.
4. It creates a clear evidence view for the patient-month.
5. It separates system checks from provider judgment.
6. It helps staff capture consent more deliberately.
7. It makes time logging easier to connect to billing readiness.
8. It gives AI a bounded, reviewable documentation role.
9. It helps a practice understand CCM as a repeatable workflow.
10. It reduces anxiety around whether the month is documented well enough to review for billing.

# Critical Pilot Blockers

These are not necessarily code defects. They are pilot-success blockers unless handled through product polish, training, or operational process.

| Blocker | Why It Matters | Recommended Response |
| --- | --- | --- |
| No explicit pilot operating playbook inside or alongside the app. | A friendly practice can still fail if staff do not know the daily rhythm. | Create a one-page pilot runbook and align the app entry point around Worklist. |
| EHR documentation boundary is not operationalized. | Practices will ask what belongs in the EHR versus CCM Assistant. | Provide copy-ready summaries and a simple "what to file in EHR" guide before pilot. |
| Recovery paths are not prescriptive enough. | Staff need to know what to do when consent, contact, review, or minutes are missing. | Add a blocker-to-action guide for pilot staff. |
| Time logging policy is not explained enough. | Bad time logs weaken billing integrity and trust. | Train staff on acceptable time examples and require notes that explain work performed. |
| Public check-in delivery is manual. | Manual delivery can be workable, but only if the practice has a clear process. | Define who sends links, when, and how follow-up is tracked during pilot. |
| Evidence export and filing process is informal. | Billing staff may not trust HTML-only evidence as an operational artifact. | Provide print/save-to-PDF guidance or a temporary manual export procedure. |

# Pilot Annoyances

| Annoyance | Likely Effect |
| --- | --- |
| Too many screens can feel equal in importance. | Staff may wander instead of using Worklist and Patient Workspace as anchors. |
| Some status terms still require explanation. | Users may ask about Ready, Reviewed, Billed, Hold, and Blocked. |
| Month selectors appear on several screens. | Users may worry they are changing global state when they are changing local page state. |
| Manual patient check-in link copying adds friction. | Staff may ask for email or SMS even though it is intentionally deferred. |
| AI intake requires careful review. | Some staff may see review as extra work unless the value is demonstrated. |
| No broad reporting. | Owners may ask for totals and trends, even in a pilot. |
| No patient portal accounts. | Patients cannot return to see prior responses. |
| No duplicate detection. | With more than a few pilot patients, staff may accidentally create duplicates. |
| No formal task queue. | Follow-up work may still happen outside the product. |
| No integrated help or inline pilot checklist. | Training depends on live support or external docs. |

# Suggested Onboarding Sequence

## Before Day 1

1. Select one pilot champion at the practice.
2. Select one coordinator who will operate CCM Assistant daily.
3. Select one billing practitioner.
4. Select one to three clinically straightforward CCM patients.
5. Agree that CCM Assistant is the pilot system for CCM workflow evidence, while the EHR remains the medical record.
6. Decide how patient check-in links will be sent during the pilot.
7. Decide how evidence will be saved or referenced for billing review.

## Day 1 Setup Session

1. Create practice.
2. Configure billing practitioner.
3. Review practice attestations.
4. Review settings.
5. Create the first patient together.
6. Add conditions.
7. Complete eligibility.
8. Record consent.
9. Generate and accept AI intake.
10. Create active care plan.
11. Create check-in and submit a test response.
12. Log sample time.
13. Recalculate billing readiness.
14. Open evidence view.

## End of Setup Session

The practice should be able to answer:

- Where do I start each morning?
- What does Ready for Billing mean?
- Who reviews AI output?
- Who sends check-in links?
- Where do we log time?
- Where do we look if Medicare or billing asks why a month was ready?

# Recommended First-Week Workflow

## Day 1

- Complete setup with one patient.
- Walk through the full happy path using a real or internal test patient.
- Confirm the coordinator knows Worklist and Patient Workspace.
- Confirm the physician understands eligibility and care-plan review steps.

## Day 2

- Add one real pilot patient.
- Complete demographics, conditions, eligibility, consent, AI intake, and care plan.
- Do not rush to billing readiness; focus on clean documentation.

## Day 3

- Send or open the patient check-in.
- Verify the patient can submit responses.
- Review response and document follow-up.
- Log any qualifying time immediately.

## Day 4

- Review Worklist.
- Fix blockers.
- Recalculate billing readiness.
- Open evidence view and discuss whether staff trust the packet.

## Day 5

- Review the pilot with practice owner, coordinator, billing practitioner, and billing staff.
- Identify where staff hesitated.
- Decide whether to add more pilot patients in week two.

## Week 2 to Week 4

- Keep the patient count small until the daily workflow feels repeatable.
- Review Worklist every morning.
- Review Billing dashboard twice per week.
- Open evidence for every patient-month before marking reviewed.
- Hold any patient-month that staff cannot confidently explain.

# Area-by-Area Readiness

| Area | Readiness | Assessment |
| --- | --- | --- |
| Practice onboarding | Medium-high | Guided setup is workable, but not yet fully self-serve. |
| Staff training | Medium | Product is understandable after walkthrough, but needs a pilot runbook. |
| Daily workflow | Medium | Worklist and Patient Workspace are good anchors, but the daily routine must be taught. |
| Failure recovery | Medium | Blockers surface well, but recovery actions need clearer operational guidance. |
| Audit confidence | Medium-high | Evidence view is strong for pilot trust, but export/EHR filing guidance is needed. |
| Trust | Medium-high | Product principles are strong; AI, billing language, and EHR separation need careful framing. |
| Adoption | Medium-high | Friendly practice likely continues if first week is guided and narrow. |

# What Should Be Self-Explanatory Before Pilot Expansion

- Worklist is the staff starting point.
- Patient Workspace is the patient-month hub.
- Billing dashboard is for monthly readiness review, not daily care work.
- Evidence view explains why the month was ready, held, blocked, reviewed, or billed.
- AI intake is draft until accepted.
- Billing practitioner attestation is a human clinical decision.
- Ready for Billing is readiness support, not reimbursement guarantee.

# What Needs Training or Support

- How the practice should send public check-in links.
- What to do if the patient does not respond.
- What to do if consent is incomplete.
- What counts as CCM time.
- When to recalculate billing readiness.
- When to place a patient-month on hold.
- How to save or reference evidence outside CCM Assistant.
- How CCM Assistant and the EHR should coexist during pilot.

# Recommended Development Focus

## Highest-Impact Next Work

The development team should work next on **guided adoption and operational confidence**, not feature count.

Priority order:

1. Create an in-app or printable pilot runbook.
2. Make Worklist the unmistakable daily home for coordinators.
3. Add next-action guidance to blockers.
4. Improve billing-month context so staff always know which month they are touching.
5. Strengthen evidence view for non-technical billing and compliance readers.
6. Add simple print/save guidance for evidence packets.
7. Add examples of appropriate CCM time documentation.
8. Add recovery guidance for nonresponsive patients and incomplete consent.
9. Add a short EHR handoff guide with copy-ready summaries.
10. Improve first-use onboarding around "what CCM Assistant does and does not do."

## What Not To Prioritize Next

Do not prioritize:

- More AI automation.
- Recommendation engines.
- Advanced analytics.
- Multi-practice support.
- Complex role management.
- Broad reporting.
- Automated claims submission.
- EHR writeback.
- Large question-bank expansion.
- Theme customization.

These may become valuable later, but they do not address the biggest 30-day pilot risk: staff confidence in operating the workflow every day.

# Final Answer

For a friendly Internal Medicine pilot, CCM Assistant is close enough to test if the practice is guided through the first week and the patient count stays intentionally small.

The product should not add more breadth before the pilot. It should make the current vertical slice feel safer, clearer, and easier to operate repeatedly.

The next sprint should maximize successful adoption by turning the existing workflow into a guided daily operating system:

- Start in Worklist.
- Resolve blockers from Patient Workspace.
- Log time immediately.
- Recalculate readiness intentionally.
- Review evidence before billing.
- Hold anything staff cannot confidently explain.

That work will do more for pilot success than adding another major feature.
