# CCM Workflow Spec

Status: product architecture specification  
Scope: end-to-end CCM Assistant workflow, state transitions, responsibilities, and operational records  
Non-goals: UI design, implementation details, billing/legal advice, recommendation-engine design

Governing philosophy: this workflow is subordinate to `docs/product/product-principles.md`. Future workflow changes should prioritize adoption, patient safety, privacy, billing integrity, user experience, efficiency, and automation in that order.

## Governing Assumptions

This specification uses the CCM eligibility assumptions from prior product research and local project documentation:

- CCM Assistant is an operational ledger for Chronic Care Management, not an EHR, claims engine, payer eligibility clearinghouse, or legal authority.
- A patient must have qualifying chronic conditions, commonly two or more conditions expected to last at least 12 months or until death and placing the patient at significant risk of death, acute exacerbation, decompensation, or functional decline.
- CCM Assistant can validate structured completeness, consistency, dates, thresholds, and documentation presence. Medical necessity and CMS eligibility remain provider attestations.
- Patient consent is required before billing. Consent may be written or verbal if documented with required elements, date, method, user, and audit trail.
- A comprehensive care plan must exist, be reviewed by the provider, and be available for ongoing care management.
- A monthly CCM period requires documented qualifying work, including time tracking. The default classic CCM threshold is 20 minutes, but the practice should be able to configure the threshold.
- One practitioner should be identified as the billing practitioner for a patient-month. The product should warn about duplicate billing risk but cannot independently prove no other organization billed CCM.
- Billing readiness means the system has enough evidence to support billing review. The final billing decision belongs to the practice.
- Automation should assist the practice without replacing provider judgment, hiding meaningful review, or obscuring the source of billable time.

## Lifecycle Stages

### 1. Practice Onboarding

| Area | Specification |
| --- | --- |
| Purpose | Establish the practice, billing practitioner, operational settings, and initial dashboard state so CCM work can be attributed correctly. |
| Actor(s) | Practice owner, organization administrator, billing practitioner, CCM coordinator, system. |
| Inputs | Practice name, address, phone, timezone, default CCM billing threshold, owner account, billing practitioner name, credentials, NPI, contact information, CMS eligibility attestations, manual review notes when needed. |
| User-entered information | Practice identity, billing practitioner profile, coordinator profile, service configuration, attestation checkboxes, manual review disposition. |
| Required documents | Practice billing policy or internal onboarding checklist; optional practitioner credential record; optional CMS compliance checklist. |
| AI-generated artifacts | None required for MVP. Future: onboarding checklist summary and risk prompts. |
| Outputs | Active practice workspace, provider record, owner membership, coordinator assignment, billing threshold, initialized dashboard. |
| Decisions | Is the practice profile complete? Is a billing practitioner configured? Does the administrator attest that the practice intends to provide CCM under applicable CMS rules? Does any incomplete or questionable setup require manual review? |
| Validations | Required fields present; timezone valid; phone format reasonable; default threshold positive; provider NPI format valid; owner account linked to practice; duplicate practice warning where possible. |
| Generated records | `practices`, `practice_members`, `providers`, practice settings, provider attestation record, audit event for setup completion. |
| Internal system state | Practice Draft, Practice Created, Practitioner Configured, Setup Needs Review, Dashboard Ready. |
| Possible next states | Dashboard initialized; manual setup review; provider correction required; patient enrollment enabled. |

Practice onboarding should not block on advanced staff management. For the minimum operational path, the authenticated owner may act as administrator and coordinator. The workflow must still create explicit records so later multi-staff support does not reinterpret historical work.

### 2. Patient Enrollment

| Area | Specification |
| --- | --- |
| Purpose | Create a patient record and establish whether the patient is a candidate for CCM enrollment. |
| Actor(s) | Coordinator, practice owner, provider for review/attestation, system. |
| Inputs | Patient demographics, contact information, preferred contact method, Medicare/payer details, assigned provider, assigned coordinator, chronic conditions, ICD-10 codes where known, consent status, enrollment start date, documentation sources. |
| User-entered information | Name, date of birth, phone, email, address, MRN or external identifier, payer identifiers if available, condition list, condition onset/status, enrollment notes. |
| Required documents | Patient demographic source, payer/Medicare information, clinical documentation supporting chronic conditions, enrollment note. |
| AI-generated artifacts | Future: missing-information checklist, draft intake summary, suggested condition normalization. |
| Outputs | Patient profile, enrollment candidate record, condition list, assigned care team, enrollment status. |
| Decisions | Is the patient a CCM candidate? Are there enough chronic conditions to request provider attestation? Is contact information valid enough for outreach? Is consent already captured or still required? |
| Validations | Required demographics present; contact route present; duplicate patient check by name/date of birth/MRN; at least one assigned provider; at least one assigned coordinator; condition entries are not blank; Medicare fields captured or explicitly marked unknown. |
| Generated records | `patients`, `patient_conditions`, `ccm_enrollments`, patient assignment records, audit events for creation and enrollment status changes. |
| Internal system state | Patient Draft, Enrollment Candidate, Enrollment Incomplete, Enrollment Pending Eligibility, Enrollment Active, Enrollment Declined. |
| Possible next states | Eligibility review; missing information; patient not eligible; consent collection; intake questionnaire. |

Enrollment should distinguish between a patient record existing in the practice and a patient being active for CCM. A patient can be created before all billing requirements are satisfied.

### 3. Eligibility Review

| Area | Specification |
| --- | --- |
| Purpose | Determine whether the patient appears eligible for CCM and identify what must be attested by the provider or reviewed manually. |
| Actor(s) | Coordinator, provider, practice owner for exceptions, system. |
| Inputs | Patient demographics, Medicare/payer information, chronic conditions, expected condition duration, risk criteria, existing clinical documentation, provider assignment, prior consent/enrollment state, duplicate billing risk notes. |
| User-entered information | Eligibility checklist answers, provider attestation, manual review notes, failure reason, effective eligibility date. |
| Required documents | Condition documentation; provider attestation; payer/Medicare source where available; manual review note for exceptions. |
| AI-generated artifacts | Future: eligibility summary, missing-evidence list, draft provider attestation prompt. |
| Outputs | Eligibility status and reason codes understandable to users. |
| Decisions | Is structured information complete? Does provider attest that chronic condition requirements are met? Does the case require manual review? Should enrollment continue, pause, or stop? |
| Validations | Two or more qualifying chronic conditions or documented exception path; provider assigned; attestation completed by authorized provider; enrollment dates valid; consent not treated as eligibility; conflicting or missing payer data flagged. |
| Generated records | Eligibility review record, provider attestation record, audit event, updated `ccm_enrollments` status. |
| Internal system state | Eligibility Pending, Needs Information, Manual Review, Eligible, Not Eligible, Deferred. |
| Possible next states | Intake questionnaire; consent collection; patient excluded; manual review queue; enrollment active pending consent. |

CCM Assistant validates completeness and consistency. Provider attestation is required for clinical eligibility, expected duration, risk, and medical necessity. Manual review is required when documentation conflicts, payer information is missing, duplicate billing risk is known, the condition count is unclear, or the patient recently received CCM elsewhere.

### 4. AI Intake Questionnaire

| Area | Specification |
| --- | --- |
| Purpose | Collect clinical and operational information needed to support care planning and ongoing monthly CCM work. |
| Actor(s) | Patient, coordinator, provider, AI service, system. |
| Inputs | Existing demographics, diagnoses, medications, allergies, recent visits, barriers, goals, symptoms, home measurements, missing documentation, preferred language. |
| User-entered information | Patient answers, coordinator-entered answers from phone call, provider corrections, free-text notes, skipped-question reasons. |
| Required documents | Intake questionnaire completion record; source notes for externally supplied information. |
| AI-generated artifacts | Missing-information list, dynamic follow-up questions, draft clinical summary, draft care-plan inputs, draft documentation for provider review. |
| Outputs | Completed intake packet, structured answers, unresolved information gaps, provider-review queue. |
| Decisions | Is enough information present to draft a care plan? Are any answers clinically urgent? Are follow-up questions required? Does the provider need to review before care-plan activation? |
| Validations | Required questions answered or intentionally skipped; dynamic follow-ups completed when triggered; high-risk answers escalated; patient identity/token valid; generated drafts marked unapproved until reviewed. |
| Generated records | Intake session, questionnaire responses, generated draft artifacts, escalation events, audit events. |
| Internal system state | Intake Not Started, Intake In Progress, Intake Needs Follow-up, Intake Complete, Intake Review Required. |
| Possible next states | Consent collection; care plan drafting; provider review; outreach task; escalation. |

AI intake must never silently become final clinical documentation. Drafts are system-generated artifacts that require user review before becoming care-plan or billing evidence.

### 5. Consent

| Area | Specification |
| --- | --- |
| Purpose | Capture and preserve patient consent for CCM services before billing. |
| Actor(s) | Patient, coordinator, provider if required by practice policy, system. |
| Inputs | Patient identity, consent method, consent date/time, consenting user, required CMS consent elements, written document or verbal script confirmation, revocation request if applicable. |
| User-entered information | Consent obtained flag, date, method, documented script acknowledgement, notes, revocation date/reason. |
| Required documents | Written consent form or verbal consent documentation; consent script/version used; revocation record when applicable. |
| AI-generated artifacts | Future: plain-language consent explanation draft or script variant. |
| Outputs | Valid consent record, audit trail, enrollment status update. |
| Decisions | Was consent obtained? Was it written or verbal? Were required elements communicated? Did the patient revoke consent? Does consent need manual review? |
| Validations | Consent date not in future; method selected; required elements acknowledged; user captured; written document attached when method requires it; revocation disables future billing periods after effective date. |
| Generated records | Consent record, consent audit event, updated enrollment state, revocation event if applicable. |
| Internal system state | Consent Missing, Consent Pending, Consent Complete, Consent Revoked, Consent Needs Review. |
| Possible next states | Care plan creation; enrollment active; billing blocked; revocation archive. |

Required consent elements should include availability/nature of CCM services, possible cost sharing, patient right to stop CCM, permission to coordinate care, and acknowledgement that only one practitioner can bill CCM for a patient in a calendar month.

### 6. Care Plan

| Area | Specification |
| --- | --- |
| Purpose | Establish a comprehensive, provider-reviewed plan that guides monthly care management and supports billing evidence. |
| Actor(s) | Provider, coordinator, patient, AI service for draft generation, system. |
| Inputs | Eligible conditions, intake answers, medications, allergies, goals, barriers, symptoms, functional status, care team, patient preferences, provider notes. |
| User-entered information | Goals, interventions, barriers, notes, medication reconciliation summary, responsible parties, review date, plan status, patient distribution date. |
| Required documents | Active care plan; provider review/approval; patient distribution record or documented availability. |
| AI-generated artifacts | Future: initial draft care plan, care-plan update suggestions, patient-friendly summary. |
| Outputs | Active care plan, revision history, patient-facing care plan copy, provider approval audit trail. |
| Decisions | Is the plan clinically complete enough to activate? Did provider approve/edit it? Does it need to be distributed to the patient? Does monthly information require revision? |
| Validations | Provider assigned; at least one active condition linked; goals and interventions present; reviewed date present; status valid; generated draft cannot be active without provider approval. |
| Generated records | `care_plans`, care-plan revisions, patient distribution record, audit events. |
| Internal system state | Care Plan Missing, Draft, Provider Review, Active, Needs Revision, Retired. |
| Possible next states | Monthly CCM cycle; billing readiness blocked; care-plan revision; patient distribution pending. |

The care plan is a living record. Monthly updates should create revision history instead of overwriting the only source of evidence for prior months.

### 7. Monthly CCM Cycle

| Area | Specification |
| --- | --- |
| Purpose | Execute and document the monthly CCM work needed to manage the patient and support a patient-month billing decision. |
| Actor(s) | Coordinator, provider, patient, system. |
| Inputs | Monthly check-in, patient responses, outreach attempts, phone calls, messages, clinical updates, medication changes, tasks, escalations, care-plan changes, time logs. |
| User-entered information | Interaction notes, minutes, occurred date, billing month, task outcomes, escalation notes, provider review notes, care-plan updates, medication reconciliation notes. |
| Required documents | Monthly interaction logs; check-in response or documented closure; care-plan update note when applicable; escalation resolution documentation. |
| AI-generated artifacts | Future: monthly summary draft, follow-up task suggestions, care-plan update suggestions. |
| Outputs | Monthly activity ledger, documented patient contact, tracked time, tasks, resolved or escalated concerns, updated care plan when needed. |
| Decisions | Has the patient responded? Is follow-up required? Do responses require provider review? Are there enough qualifying minutes? Should the check-in be closed without response? Should billing be held? |
| Validations | Time entries have patient, practice, occurred date, billing month, minutes, note, and user; minutes are positive; check-in token is valid; responses satisfy required fields; duplicate monthly check-ins are prevented or reconciled; escalations cannot be ignored silently. |
| Generated records | `checkin_instances`, `checkin_responses`, `interaction_logs`, tasks, escalation records, audit events, care-plan revision records. |
| Internal system state | Month Not Started, Outreach Pending, Check-in Sent, Response Received, Follow-up Needed, Provider Review Needed, Month Closed, Billing Review Pending. |
| Possible next states | Continue monthly work; provider review; care-plan revision; billing readiness; hold; nonresponsive workflow. |

Monthly work should be organized by patient-month. The system should make clear which activities count toward the billing threshold and which are administrative context only.

### 8. Billing Readiness

| Area | Specification |
| --- | --- |
| Purpose | Convert the patient-month ledger into a clear Ready, Not Ready, or Hold decision with supporting reasons. |
| Actor(s) | Coordinator, practice owner, provider, billing reviewer, system. |
| Inputs | Enrollment status, eligibility status, consent status/date, active care plan, monthly check-in status, time logs, unresolved tasks/escalations, provider reviews, warnings. |
| User-entered information | Manual hold reason, reviewed by/date, billed by/date, reviewer notes, override notes if practice policy permits. |
| Required documents | Billability checklist, monthly activity evidence, active care plan, consent record, eligibility attestation, review note. |
| AI-generated artifacts | Future: billing-readiness narrative summary. |
| Outputs | Monthly billability result, missing item list, warnings, reviewed/held/billed status, link to evidence packet. |
| Decisions | Are all required checklist items complete? Are there warning conditions? Should the month be marked ready, held, reviewed, or billed? |
| Validations | Active enrollment; eligible status; consent obtained before or during billable period according to policy; active/current care plan; check-in responded or documented closed; total qualifying minutes meet threshold; no unresolved required escalation; no missing provider. |
| Generated records | `monthly_billability`, billing review audit event, hold/release events, billed event. |
| Internal system state | Not Ready, Ready to Bill, Hold, Reviewed, Billed, Reopened/Corrected. |
| Possible next states | Fix missing items; hold; review; bill; archive; reopen for correction. |

Warnings should not be confused with hard blockers. For example, a patient responded late or had multiple outreach attempts may be warning context, while missing consent or insufficient minutes blocks readiness.

### 9. Billing Archive

| Area | Specification |
| --- | --- |
| Purpose | Preserve a monthly documentation package that explains why a patient-month was or was not billed. |
| Actor(s) | Billing reviewer, practice owner, coordinator, auditor, system. |
| Inputs | Final billability row, enrollment evidence, consent, conditions, care plan, check-in responses, interaction logs, tasks/escalations, audit events, reviewer/billed state. |
| User-entered information | Billing notes, correction notes, archive acknowledgement, manual hold reason. |
| Required documents | Monthly evidence packet; audit trail; billing decision record; care plan and consent evidence. |
| AI-generated artifacts | Future: audit narrative summary and document index. |
| Outputs | Immutable or versioned evidence snapshot, historical patient-month record, audit-support package. |
| Decisions | Is the evidence snapshot complete? Should the month be archived as billed, held, not ready, or corrected? Does a correction require a new snapshot version? |
| Validations | Snapshot references valid records; record timestamps preserved; billed/reviewed states captured; correction history retained; stale snapshot warning when source records change after snapshot creation. |
| Generated records | `billing_evidence_snapshots`, archive audit event, snapshot version records if corrected. |
| Internal system state | Evidence Draft, Evidence Snapshot Created, Archived, Correction Needed, Corrected Snapshot Created. |
| Possible next states | Historical archive; audit review; correction/reopen; next monthly cycle. |

The archive should preserve what the practice knew at the time of billing review. Later changes should produce a corrected version, not silently rewrite historical evidence.

## State Machine

```text
Practice Draft
    ↓
Practice Created
    ↓
Practitioner Configured
    ↓
CMS Setup Attested
    ↓
Dashboard Initialized
    ↓
Patient Created
    ↓
Patient Enrolled
    ↓
Eligibility Pending
    ├─→ Needs Information
    ├─→ Manual Review
    ├─→ Not Eligible
    ↓
Eligible
    ↓
Intake Pending
    ↓
Questionnaire Complete
    ↓
Consent Pending
    ├─→ Consent Revoked
    ↓
Consent Complete
    ↓
Care Plan Draft
    ↓
Provider Reviewed
    ↓
Care Plan Active
    ↓
Monthly Cycle Open
    ├─→ Outreach Pending
    ├─→ Follow-up Needed
    ├─→ Provider Review Needed
    ↓
Monthly Cycle Closed
    ↓
Billing Review
    ├─→ Not Ready
    ├─→ Hold
    ↓
Ready to Bill
    ↓
Reviewed
    ↓
Billed
    ↓
Archived
```

Revocation, ineligibility, unresolved escalation, missing consent, missing care plan, and insufficient time can move a patient-month out of the happy path and into Not Ready, Hold, or Manual Review.

## Screen Inventory

This is an inventory of required workflow screens and responsibilities, not a UI layout design.

| Screen | Purpose | Primary user | Inputs | Outputs | Navigation destinations |
| --- | --- | --- | --- | --- | --- |
| Sign Up | Create the first authenticated user for a practice. | Practice owner | Email, password, display name. | Authenticated account. | Practice Setup, Login. |
| Login | Start an authenticated session. | All staff | Email, password. | Session. | Dashboard, Practice Setup if no practice exists. |
| Practice Setup | Create practice and first billing practitioner. | Practice owner | Practice profile, billing practitioner details, threshold, attestation. | Practice, owner membership, provider, setup audit event. | Dashboard, Practice Settings, Provider Settings. |
| Dashboard | Show operational status after setup. | Practice owner, coordinator, provider | Practice context, patient-month filters. | Summary of patients, blockers, billing readiness. | Patients, Worklist, Billing, Settings. |
| Practice Settings | Edit practice values entered during setup. | Practice owner | Name, address, phone, timezone, default threshold. | Updated practice settings and audit event. | Dashboard, Provider Settings, Account. |
| Provider Settings | Add/edit billing practitioners. | Practice owner | Provider name, credentials, NPI, email, active flag. | Provider records. | Practice Settings, Patient Assignment, Eligibility Review. |
| Coordinator Settings | Manage active coordinators for workflow ownership. | Practice owner | User, display name, active flag. | Coordinator records and status. | Practice Settings, Worklist. |
| Account | Manage current user session and profile. | All staff | Display name, password-provider link, logout action. | Updated profile or ended session. | Dashboard, Login. |
| Patients List | Find and create patients. | Coordinator | Search, filters, new patient demographics. | Patient selected or created. | Patient Detail, New Patient. |
| New/Edit Patient | Capture patient demographics and assignments. | Coordinator | Demographics, contact, payer info, provider, coordinator. | Patient profile. | Patient Detail, Eligibility Review. |
| Patient Detail | Show patient status and next required action. | Coordinator, provider | Patient context. | Status overview, blockers, links to workflow stages. | Eligibility, Consent, Care Plan, Check-in, Time Log, Evidence. |
| Conditions | Capture chronic conditions and ICD-10 details. | Coordinator, provider | Condition names, ICD-10, status, onset, notes. | Patient condition records. | Eligibility Review, Care Plan. |
| Eligibility Review | Separate system validations from provider attestation. | Provider, coordinator | Checklist, condition evidence, attestation, manual review notes. | Eligible, needs information, manual review, or not eligible state. | Patient Detail, Intake, Consent. |
| AI Intake | Collect missing patient/clinical information. | Patient, coordinator | Existing information, questionnaire answers, follow-up answers. | Intake packet and draft documentation. | Provider Review, Care Plan, Patient Detail. |
| Intake Review | Review AI-generated draft documentation. | Provider, coordinator | Draft summary, answers, corrections. | Approved/edited intake summary. | Care Plan, Patient Detail. |
| Consent | Document written or verbal CCM consent. | Coordinator | Consent method, date, required element acknowledgements, notes, attachments. | Consent complete or revoked state. | Patient Detail, Care Plan, Billing Readiness. |
| Care Plan | Create, review, revise, and activate care plan. | Provider, coordinator | Goals, interventions, barriers, medications, notes, review date, status. | Active care plan and revision history. | Patient Detail, Monthly Cycle, Evidence. |
| Patient Care Plan Copy | Provide patient-accessible care plan information. | Coordinator, patient | Published care plan version. | Distribution record. | Patient Detail, Monthly Cycle. |
| Monthly Check-in | Create or view monthly patient contact workflow. | Coordinator | Billing month, questions, public link, status. | Check-in instance, responses, closure status. | Public Check-in, Patient Detail, Worklist. |
| Public Check-in | Let patient answer monthly questions without account creation. | Patient | Token, answers, required fields. | Check-in responses and completion audit event. | Completion page. |
| Time Log | Record qualifying monthly CCM time. | Coordinator, provider | Date, billing month, minutes, activity type, note. | Interaction log and minutes total. | Patient Detail, Billing Readiness. |
| Tasks and Escalations | Track follow-up work and unresolved concerns. | Coordinator, provider | Task, due date, owner, severity, resolution notes. | Open/closed task records and escalation audit. | Worklist, Patient Detail. |
| Worklist | Surface active operational blockers. | Coordinator | Month, filters, patient status. | Prioritized blocker list. | Patient Detail, Check-in, Time Log, Care Plan. |
| Billing Dashboard | Review patient-month readiness and billing states. | Billing reviewer, practice owner | Month, recalculation action, review/hold/bill action. | Ready/not ready/hold/reviewed/billed state. | Evidence Packet, Patient Detail. |
| Evidence Packet | Explain the patient-month billing decision. | Billing reviewer, auditor | Patient-month. | Evidence snapshot or live evidence view. | Billing Dashboard, Patient Detail. |
| Billing Archive | Browse historical patient-month packages. | Practice owner, auditor | Patient/month filters. | Historical evidence records. | Evidence Packet, Patient Detail. |
| Manual Review Queue | Resolve eligibility, setup, or billing exceptions. | Practice owner, provider | Review item, notes, disposition. | Approved, rejected, or needs information state. | Dashboard, Patient Detail, Billing. |

## MVP Scope

| Feature | Scope | Notes |
| --- | --- | --- |
| Authenticated practice owner account | MVP | Required to establish practice context and audit trail. |
| Practice creation | MVP | Must create the operational workspace. |
| Practice settings editability | MVP | Values entered during setup must be editable. |
| First billing practitioner setup | MVP | Required before patient assignment and billing review. |
| Provider NPI/credentials fields | MVP | Structured enough for billing-practitioner identity. |
| CMS setup attestation | MVP | Basic attestation checklist and audit event. |
| Manual review path | Phase 2 | MVP can use notes/status; dedicated queue can follow. |
| Dashboard initialization | MVP | Must show next operational actions. |
| Patient demographics | MVP | Required for patient identity and duplicate warnings. |
| Duplicate patient detection | Phase 2 | MVP should avoid obvious duplicates; robust merge is later. |
| Chronic condition capture | MVP | Required for eligibility and care plan. |
| ICD-10 normalization/import | Phase 2 | Representative/manual codes first; full import later. |
| Medicare/payer eligibility inputs | MVP | Capture known values and unknown status; clearinghouse integration later. |
| Provider eligibility attestation | MVP | Required because system cannot make medical necessity decisions. |
| Automated payer verification | Future | Outside first operational release. |
| Enrollment status workflow | MVP | Needed to separate candidates from active CCM patients. |
| AI intake questionnaire | Phase 2 | Part of complete product architecture, not required for first billable month. |
| Dynamic follow-up questions | Phase 2 | Requires clinical knowledge model and review workflow. |
| AI-generated draft documentation | Phase 2 | Must remain draft until reviewed. |
| Consent capture | MVP | Required before billing. |
| Written consent attachment | Phase 2 | MVP may document verbal/written metadata; file management can follow. |
| Consent revocation | MVP | Must prevent future billing periods from being treated as consented. |
| Manual care plan creation | MVP | Required for billability. |
| AI-generated care plan draft | Phase 2 | Useful after intake model matures. |
| Provider care-plan approval | MVP | Required before active care plan. |
| Patient care-plan distribution tracking | Phase 2 | MVP can record availability; richer distribution later. |
| Monthly check-in | MVP | Required monthly contact/documentation path. |
| Public patient response without account | MVP | Reduces onboarding burden. |
| Automated email/SMS outreach | Phase 2 | Manual link handling is acceptable for MVP. |
| Time tracking by patient-month | MVP | Required for threshold evidence. |
| Medication reconciliation notes | MVP | Can be a structured monthly note before full medication module. |
| Tasks and escalations | Phase 2 | MVP can document follow-up in logs; dedicated task system follows. |
| Worklist blockers | MVP | Required for coordinator operations. |
| Billability calculation | MVP | Must produce ready/not-ready/hold with reasons. |
| Billing dashboard | MVP | Required to review patient-months. |
| Hold/release/reviewed/billed states | MVP | Required for operational billing workflow. |
| Evidence packet | MVP | HTML evidence page is enough initially. |
| Immutable/versioned archive | Phase 2 | MVP can snapshot; advanced correction/version policy follows. |
| PDF export | Future | Useful for audits but not required for initial workflow. |
| Claims export/EHR integration | Future | Outside CCM Assistant workflow foundation. |
| Multi-provider workflows | Phase 2 | Single provider can satisfy MVP, but model should not prevent expansion. |
| Staff invitations and role management | Phase 2 | Owner-as-coordinator is acceptable for first workflow. |
| Advanced analytics | Future | Not required for readiness or billing evidence. |

## Product Responsibilities

CCM Assistant is responsible for:

- Making required workflow state visible.
- Capturing user-entered documentation and dates.
- Separating system validation from provider attestation.
- Tracking monthly work by patient-month.
- Producing a clear billing-readiness decision with reasons.
- Preserving evidence and audit events.

CCM Assistant is not responsible for:

- Guaranteeing CMS reimbursement.
- Replacing provider medical judgment.
- Proving external payer activity without an integration.
- Submitting claims in the base workflow.
- Silently converting AI draft artifacts into final clinical documentation.

## Open Product Questions

- What exact consent script/version will the practice use?
- Does the practice require provider signature on eligibility, care plan, or both?
- Which activities count as qualifying CCM time under the practice policy?
- Should billing review allow manual override, or only hold/not-ready until data is corrected?
- At what point should an evidence snapshot become locked?
- What minimum patient-facing care plan distribution proof is acceptable for launch?
