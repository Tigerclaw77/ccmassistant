# Vertical Slice MVP

Status: product implementation plan  
Goal: define the smallest complete CCM Assistant product that can credibly demonstrate value to a physician practice or pilot customer  
Scope: one practice, one billing practitioner, one patient, one billable-ready CCM month  
Non-goals: broad platform architecture, full workflow roadmap, production-scale operations, claims submission, integrations

Governing philosophy: this MVP is constrained by `docs/product/product-principles.md`. The vertical slice should prove a trusted workflow, not maximize automation.

## Product Rule

The MVP should include a feature only when it helps complete or explain one billable-ready CCM month. If a feature does not directly help the practice onboard, enroll one patient, document the month, or understand billing readiness, it should be removed from MVP.

The MVP is not the smallest codebase, the fastest workflow, or the most automated path. It is the smallest coherent product that makes a physician or office manager believe: "I would actually use this."

# 1. Core User Story

A physician practice signs up for CCM Assistant because it wants a simple way to manage Chronic Care Management documentation without adding EHR complexity.

The practice owner creates an account, enters the practice name, and adds the one billing practitioner who will supervise CCM. The system asks for the minimum CMS-facing setup information needed to make the workflow credible: practitioner identity, NPI, default monthly minute threshold, and a basic attestation that the practice will review eligibility and billing decisions.

The coordinator creates one patient, enters demographics, captures at least two chronic conditions, assigns the billing practitioner, and records that the patient is being considered for CCM. The provider reviews the patient record and attests that the patient appears clinically eligible for CCM based on chronic condition burden and risk.

The coordinator runs an AI-assisted intake questionnaire. The AI helps identify missing information and drafts a concise clinical summary, but the practice remains responsible for reviewing the content. The coordinator documents consent, including consent method, date, and required consent elements.

The provider reviews or edits a basic care plan with goals, interventions, barriers, and notes. Once approved, the care plan becomes active.

During the month, the coordinator sends or opens a patient check-in, records the patient response, logs CCM time, and documents follow-up notes. Once the patient has an active enrollment, consent, active care plan, completed monthly contact, and at least 20 qualifying minutes, the coordinator recalculates billing readiness.

The billing dashboard marks the patient-month as ready to bill. The office manager opens the evidence view and sees a clear explanation of why the month is ready: patient eligibility, consent, chronic conditions, care plan, check-in response, time logs, and audit events. No claim is submitted from CCM Assistant; the practice uses the evidence to support its normal billing process.

# 2. MVP Feature List

## Practice

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Sign up and login | Required | Let one practice user access a private workspace. | A demonstrable product needs authenticated state and audit attribution. | Auth provider, session handling. |
| Practice creation | Required | Create the practice workspace. | All patient, provider, and billing records need a practice context. | Authenticated user. |
| Single billing practitioner setup | Required | Identify the practitioner responsible for CCM supervision/billing. | Billing readiness is not credible without a named practitioner. | Practice record. |
| Practitioner NPI and credentials | Required | Capture minimum practitioner identity. | A physician practice will expect the evidence packet to identify the billing practitioner. | Provider setup. |
| Default CCM minute threshold | Required | Configure the monthly time threshold, defaulting to 20 minutes. | Billability depends on a threshold; hard-coding weakens trust. | Practice setup. |
| Basic CMS setup attestation | Required | Capture that the practice accepts responsibility for eligibility and billing review. | Keeps system validation distinct from provider/practice attestation. | Practice setup. |
| Simple dashboard | Required | Show the next action and patient-month status. | The user needs to know what to do after setup. | Practice, provider, patient status. |
| Edit practice/provider typo | Nice to have | Correct setup mistakes. | Useful for demo comfort, but not required to complete one month if setup is entered correctly. | Practice/provider records. |
| Multiple practices | Remove from MVP | Support several organizations. | The vertical slice assumes one practice. Adds routing, permissions, and UX overhead. | None for MVP. |
| Staff invitations and role management | Remove from MVP | Add multiple users with roles. | One authenticated user can act as owner/coordinator for pilot demo. | None for MVP. |

## Patient

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Create one patient | Required | Establish the patient being managed for CCM. | The vertical slice is patient-centered. | Practice and provider. |
| Patient demographics | Required | Identify the patient and support evidence review. | A billing-ready packet without patient identity is not credible. | Patient creation. |
| Chronic condition capture | Required | Record the clinical basis for CCM eligibility. | CCM eligibility depends on chronic condition burden and risk. | Patient record. |
| Assign billing practitioner | Required | Link the patient to the supervising practitioner. | Required to explain who is responsible for the patient-month. | Provider record. |
| Eligibility attestation | Required | Let provider/practice attest that CCM eligibility is met. | The system cannot independently determine medical necessity. | Conditions, provider assignment. |
| Enrollment status | Required | Track whether the patient is active for CCM. | Billing readiness requires active enrollment. | Eligibility and consent. |
| Duplicate patient warning | Nice to have | Avoid accidentally creating the same patient twice. | Important later, but one-patient MVP can proceed without robust merge/deduplication. | Patient demographics. |
| Full payer verification | Remove from MVP | Confirm Medicare coverage externally. | No integrations are allowed; manual entry and attestation are enough for the demo. | Future clearinghouse/EHR integration. |
| Multi-patient registry | Remove from MVP | Manage a population. | The MVP proves one complete month, not population operations. | Later scale work. |

## Questionnaire

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| AI-assisted intake prompt | Required | Gather missing information and draft useful documentation. | AI is useful only as a bounded clinical documentation assistant; the demo value comes from editable drafts and visible review. | Patient, conditions. |
| Minimal reusable question set | Required | Ask enough questions to support care planning and monthly documentation. | A physician needs to see that the product captures clinically useful context. | Questionnaire storage or template. |
| Coordinator-entered answers | Required | Allow intake to be completed without a patient portal. | Keeps the demo reliable and avoids patient account complexity. | Intake form. |
| AI draft clinical summary | Required | Produce a concise draft that the practice can review. | This is the smallest meaningful AI artifact. | Intake answers. |
| Provider review marker | Required | Make clear the AI draft is not final clinical documentation until reviewed. | Prevents unsafe automation assumptions. | AI summary. |
| Dynamic branching questions | Nice to have | Ask follow-ups based on answers. | Useful, but the MVP can use a fixed concise intake plus manual notes. | Question model. |
| Large clinical question bank | Remove from MVP | Support many diagnoses and questionnaires. | Broad content creation delays the vertical slice and is not needed for one patient. | Future clinical knowledge base. |
| AI optimization/recommendation engine | Remove from MVP | Generate clinical recommendations or optimize plans. | Too risky and broad for MVP; draft documentation is enough. | Future clinical governance. |

## Consent

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Consent status | Required | Indicate whether consent has been obtained. | Billing readiness cannot pass without consent. | Patient enrollment. |
| Consent date | Required | Establish when consent became effective. | The evidence packet must show timing. | Consent capture. |
| Consent method | Required | Distinguish written and verbal consent. | Practices need to document how consent was obtained. | Consent capture. |
| Required consent element checklist | Required | Confirm required CCM consent elements were communicated. | Makes consent more credible than a single checkbox. | Consent screen. |
| Consent audit event | Required | Preserve who captured consent and when. | Needed for evidence and trust. | Authenticated user. |
| Consent revocation | Nice to have | Stop future billing after patient revokes consent. | Important operationally, but not needed for one positive month demo. | Enrollment state. |
| E-signature workflow | Remove from MVP | Obtain legally signed digital forms. | Too much scope; written/verbal metadata is enough for the vertical slice. | Future document signing. |
| Consent document upload | Remove from MVP | Attach scanned consent forms. | Useful later; not necessary for a credible first demo if consent metadata is captured. | Future file storage. |

## Care Plan

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Basic care plan create/edit | Required | Record goals, interventions, barriers, notes, and status. | Active care plan is central to CCM documentation. | Eligible patient. |
| Provider review/approval | Required | Convert draft plan into an active care plan. | Billing readiness should require provider-reviewed care plan. | Care plan draft. |
| Active care plan status | Required | Let billability distinguish draft from active documentation. | Prevents incomplete plans from satisfying readiness. | Care plan. |
| Last reviewed date | Required | Show the plan is current for the patient-month. | Practices expect review timing in evidence. | Provider review. |
| AI-generated care-plan draft | Nice to have | Convert intake summary into draft goals/interventions. | Strong demo value, but manual care plan can complete the slice if AI draft is not ready. | Intake answers, AI summary. |
| Revision history | Nice to have | Preserve care plan edits over time. | Important for production, but one month can use current plan plus audit event. | Care plan records. |
| Patient-facing care plan delivery | Remove from MVP | Send a copy to the patient. | Valuable later, but not needed to demonstrate internal billing readiness. | Future patient communications. |

## Monthly Tracking

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Monthly check-in instance | Required | Create the monthly patient contact record. | A billable month needs documented monthly activity. | Active patient. |
| Public check-in link | Required | Let the patient respond without an account. | Keeps onboarding simple and demoable. | Check-in token. |
| Patient response capture | Required | Record structured monthly updates. | Demonstrates patient engagement and supports documentation. | Public check-in. |
| Check-in reviewed/closed state | Required | Let the practice finish the monthly contact. | Billing readiness needs a completed monthly contact state. | Check-in response. |
| Interaction time logs | Required | Track qualifying CCM minutes. | Time threshold is a core billing readiness condition. | Patient, billing month. |
| Billing month on logs | Required | Attribute minutes to the correct patient-month. | Prevents ambiguous time evidence. | Time log form. |
| At least 20 logged minutes | Required | Satisfy default classic CCM threshold for demo. | The product must prove readiness calculation. | Interaction logs. |
| Medication reconciliation note | Nice to have | Document medication review during the month. | Clinically useful, but can be captured in notes for MVP. | Monthly tracking. |
| Follow-up task list | Nice to have | Track unresolved actions. | Helpful for real operations, but not required for one clean positive month. | Patient/month records. |
| Automated outreach notifications | Remove from MVP | Email/SMS check-in links. | Manual link copy is enough; notifications add delivery and compliance complexity. | Future messaging service. |
| Recurring monthly automation | Remove from MVP | Automatically create monthly cycles. | The demo can manually create one check-in. | Future scheduler. |

## Billing Readiness

| Feature | Decision | Purpose | Reason it belongs in MVP | Dependencies |
| --- | --- | --- | --- | --- |
| Billability checklist | Required | Show whether required items are complete. | This is the product's main value. | Enrollment, consent, care plan, check-in, logs. |
| Billability recalculation | Required | Compute ready/not-ready for the patient-month. | Demonstrates the workflow produces an actionable result. | Checklist data. |
| Plain-English blockers | Required | Explain what is missing. | A practice needs to trust and act on the result. | Billability reasons. |
| Ready to bill state | Required | Mark successful completion of the patient-month. | The demo must end with a clear outcome. | Billability calculation. |
| Evidence view | Required | Show the supporting documentation in one place. | This is what makes the product feel real to a physician or office manager. | All workflow records. |
| Mark reviewed | Required | Show that a human reviewed readiness. | Separates system calculation from billing decision. | Ready to bill state. |
| Mark billed | Required | Complete the operational story without submitting a claim. | The practice needs a way to record that external billing was done. | Reviewed state. |
| Exportable evidence | Nice to have | Download or print documentation. | Strong pilot value, but HTML evidence can be sufficient for initial demo. | Evidence view. |
| CSV/PDF exports | Remove from MVP | Produce formal files. | Not necessary for first demonstration; can be added after workflow validation. | Future export layer. |
| Claim submission | Remove from MVP | Submit Medicare claims. | Explicitly out of scope and high compliance/integration burden. | Future billing integration. |

# 3. Cut List

| Feature | MVP decision | Why it is deferred |
| --- | --- | --- |
| Analytics | Remove from MVP | One-patient MVP does not need trends, utilization, or performance dashboards. |
| Reporting | Remove from MVP | Evidence view is enough; formal reporting can follow after real pilot needs are known. |
| Multiple practitioners | Remove from MVP | Adds assignment, filtering, and billing responsibility complexity. One practitioner proves the slice. |
| Organization roles | Remove from MVP | One authenticated user can act as owner/coordinator for demonstration. |
| Staff invitations | Remove from MVP | Not required for one practice user. |
| Theme customization | Remove from MVP | Does not help complete a billable month. |
| Medicare Advantage support | Remove from MVP | Adds payer-specific policy variation and benefit complexity. Start with generic Medicare CCM documentation assumptions. |
| EHR integrations | Remove from MVP | High setup burden; internal database is enough for pilot demonstration. |
| Claims submission | Remove from MVP | Requires billing integration, payer workflows, and compliance review. The MVP stops at billing readiness evidence. |
| Billing automation | Remove from MVP | The practice should manually decide and bill externally during the first pilot. |
| AI optimization | Remove from MVP | The only AI use should be bounded draft documentation. Recommendations and optimization need clinical governance. |
| Recommendation engine | Remove from MVP | Too broad and clinically risky for first release. |
| Patient portal enhancements | Remove from MVP | Public check-in link is enough. Accounts, history, preferences, and messaging can wait. |
| Notifications beyond essentials | Remove from MVP | Manual link sharing is acceptable. Email/SMS introduces delivery, consent, and support issues. |
| Full question bank CRUD | Remove from MVP | A fixed or lightly configurable intake is enough for one patient. |
| Diagnosis-specific questionnaire library | Remove from MVP | Creates content burden and validation risk. Use generic chronic-care questions first. |
| File uploads | Remove from MVP | Consent and evidence metadata can be recorded without document storage in the first demo. |
| PDF export | Remove from MVP | HTML evidence is sufficient to prove value. |
| CSV billing export | Remove from MVP | No billing automation in MVP. |
| Duplicate merge | Remove from MVP | One-patient assumption removes the need. Basic warning can come later. |
| Lapsed patient workflows | Remove from MVP | The demo covers one active monthly cycle only. |
| Staff turnover workflows | Remove from MVP | No multi-staff model in MVP. |
| Advanced permissions | Remove from MVP | A single trusted pilot user is enough. |
| Full audit administration | Remove from MVP | Evidence view should show key audit events; no separate audit console yet. |
| Multi-month history | Remove from MVP | One completed month proves the vertical slice. |
| Mobile-specific polish | Remove from MVP | Useful later, but the pilot demo can assume desktop office workflow. |

# 4. Build Order

Each milestone should leave the application in a usable state.

## Milestone 1: Authenticated Practice Shell

- Sign up and login.
- Create one practice.
- Create the first billing practitioner.
- Store default CCM threshold.
- Show a dashboard with setup completion status.

Usable state: a practice can create its workspace and see what must happen next.

## Milestone 2: One Patient Enrollment

- Create one patient.
- Capture demographics.
- Capture chronic conditions.
- Assign the billing practitioner.
- Record enrollment status.
- Add eligibility attestation.

Usable state: the practice has one CCM candidate with enough structured data to begin documentation.

## Milestone 3: Consent and Intake

- Capture consent method, date, and required consent elements.
- Run a minimal AI-assisted intake questionnaire.
- Save coordinator-entered answers.
- Generate a draft clinical summary.
- Require human review marker before using the draft as documentation support.

Usable state: the patient has documented consent and reviewed intake information.

## Milestone 4: Care Plan

- Create/edit a basic care plan.
- Include goals, interventions, barriers, and notes.
- Mark provider reviewed.
- Activate the care plan.

Usable state: the patient has an active care plan that can satisfy the billing checklist.

## Milestone 5: Monthly Cycle

- Create the monthly check-in.
- Generate a public check-in link.
- Capture patient response.
- Mark check-in reviewed or closed.
- Log interaction minutes against the billing month.

Usable state: the practice can document one month of patient contact and time.

## Milestone 6: Billing Readiness

- Recalculate billability.
- Show plain-English missing items.
- Mark the patient-month ready to bill when requirements are met.
- Allow reviewed and billed states.

Usable state: the practice can determine whether the patient-month is ready for external billing.

## Milestone 7: Evidence View

- Show enrollment, eligibility, consent, conditions, care plan, check-in responses, time logs, billability result, and audit events.
- Make the evidence view readable enough for a physician or office manager to trust.

Usable state: the practice can demonstrate why the month is ready to bill.

# 5. Demo Script

This script should fit in roughly 10 minutes and use only MVP functionality.

## Minute 0-1: Sign In and Practice Setup

"We will start as a small practice using CCM Assistant for the first time."

1. Sign up or log in.
2. Create "Lakeside Family Medicine."
3. Add "Dr. Maria Chen, MD" as the billing practitioner.
4. Enter an NPI and keep the default 20-minute threshold.
5. Land on the dashboard.

Message to audience: CCM Assistant begins with the billing practitioner and threshold because every monthly result must tie back to a real supervising provider.

## Minute 1-2: Create the Patient

1. Add one patient, "James Miller."
2. Enter basic demographics and contact information.
3. Add chronic conditions: hypertension and type 2 diabetes.
4. Assign Dr. Chen.
5. Mark the patient as an active CCM enrollment candidate.

Message to audience: the product is intentionally asking for only the information needed to support CCM documentation.

## Minute 2-3: Eligibility and Consent

1. Open eligibility.
2. Show the condition list.
3. Record provider attestation that the patient meets CCM chronic-condition criteria.
4. Capture verbal consent with today's date.
5. Confirm required consent elements.

Message to audience: the system checks completeness, but the provider still owns the clinical attestation.

## Minute 3-5: AI Intake

1. Open the intake questionnaire.
2. Answer a short set of questions as the coordinator speaking with the patient.
3. Generate an AI draft summary.
4. Show that the draft is marked as needing review.
5. Mark it reviewed after a quick provider check.

Message to audience: AI reduces documentation effort without replacing clinical review.

## Minute 5-6: Care Plan

1. Create a care plan.
2. Add goals: improve BP control and maintain diabetes self-management.
3. Add interventions: monthly outreach, medication adherence check, home readings review.
4. Add barriers: transportation and diet consistency.
5. Mark provider reviewed and active.

Message to audience: the care plan becomes the anchor for monthly CCM work.

## Minute 6-8: Monthly Work

1. Create this month's check-in.
2. Open the public check-in link.
3. Submit patient responses.
4. Return to the patient record.
5. Log 12 minutes for intake follow-up.
6. Log 10 minutes for care coordination and medication review.

Message to audience: the product keeps the month organized around real contact and time evidence.

## Minute 8-9: Billing Readiness

1. Open billing readiness.
2. Recalculate.
3. Show ready to bill.
4. Mark reviewed.
5. Mark billed.

Message to audience: CCM Assistant does not submit the claim. It tells the office whether the month is documented well enough for their billing process.

## Minute 9-10: Evidence View

1. Open the evidence page.
2. Show eligibility, consent, chronic conditions, care plan, check-in responses, time logs, and billability result.
3. Point out the reviewed and billed states.

Message to audience: this is the value of the product: a simple, reviewable packet explaining why the practice can bill the month.

# 6. Success Criteria

The MVP is complete when all of the following are true:

- [ ] Practice can sign up and onboard in under 5 minutes.
- [ ] One billing practitioner can be created and assigned to a patient.
- [ ] One patient can be created with demographics and chronic conditions.
- [ ] Provider/practice eligibility attestation can be recorded.
- [ ] Consent method, date, and required consent elements can be documented.
- [ ] AI can generate a usable draft intake summary from entered answers.
- [ ] AI-generated text is clearly draft until reviewed.
- [ ] A care plan can be created, reviewed, and activated.
- [ ] A monthly check-in can be created and completed.
- [ ] A patient can complete the check-in without creating an account.
- [ ] Interaction logs can record at least 20 minutes for the correct billing month.
- [ ] Billability calculation shows missing items before completion.
- [ ] Billability calculation marks the patient-month ready when all requirements are met.
- [ ] The user can mark the month reviewed and billed.
- [ ] Evidence view explains why the patient-month is ready to bill.
- [ ] A physician or office manager can understand the demo without reading documentation.
- [ ] The product does not expose unfinished platform features during the demo.

# 7. Risks

| Risk | Why it matters | MVP mitigation |
| --- | --- | --- |
| Practices may disagree on what counts as qualifying CCM time. | Billing readiness depends on time logs. | Make threshold configurable and label the result as readiness support, not billing guarantee. |
| CMS interpretation may vary by payer, year, or practice policy. | The product could overstate confidence. | Separate system validation from provider/practice attestation. |
| AI draft documentation may be clinically incomplete or overconfident. | Unsafe summaries would reduce trust. | Keep AI output as draft only and require review marker. |
| Consent requirements may be implemented too generically. | Consent is a hard billing blocker. | Use explicit consent elements and audit events even in MVP. |
| The demo may feel too manual without notifications or integrations. | A practice may expect automation. | Position human review as a trust feature. Defer automation until workflow, billing defensibility, and user confidence are proven. |
| Evidence view may not satisfy real audit expectations. | The core value depends on trust in evidence. | Include all source records and timestamps in one view; export can come later. |
| One-patient MVP may hide population-management needs. | A pilot customer quickly needs more patients. | Design records with practice/patient/month structure while hiding population features from MVP. |
| AI intake may distract from the billing-readiness value. | The product could look like a chatbot instead of an operational tool. | Limit AI to intake summary and draft documentation. |
| Provider attestation may add friction. | Physicians may resist extra clicks. | Keep attestation minimal and tied to eligibility/care-plan approval. |
| No EHR integration may make data entry feel duplicative. | Practices live in their EHR. | Keep required fields minimal and prove the evidence packet value before integration work. |

## Final MVP Boundary

Build only the path that lets one authenticated practice user:

1. Create a practice and billing practitioner.
2. Create one patient with chronic conditions.
3. Record eligibility attestation and consent.
4. Complete a minimal AI-assisted intake.
5. Activate a care plan.
6. Complete one monthly check-in.
7. Log at least 20 minutes.
8. Recalculate billability.
9. Mark the month reviewed and billed.
10. Open an evidence view that explains the result.

Everything else waits.
