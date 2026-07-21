# Founder Review Sprint 1 — Simulated Coordinator Day

Persona: Mary, a care coordinator working a normal mixed-priority day. These are observations, not implemented changes.

## Simulated day

Mary begins in `My Work Today`, checks urgent and ready-to-contact work, opens a patient, reviews the exact trigger and recent context, records a decision, performs outreach, documents actual time, routes a clinical question, returns to the queue, handles an awaiting-provider item, and ends by checking documentation and compliance visibility.

| Current workflow | Problem observed | Suggested improvement | Estimated impact | Engineering effort |
| --- | --- | --- | --- | --- |
| Queue groups count only patients loaded on the current page. | Mary cannot treat the group counts as full-practice workload and must interpret the explanatory footnote. | Return server-calculated counts for the complete filtered scope. | High: more trustworthy daily planning. | Medium |
| The coordinator filter bar includes billing readiness alongside clinical scope. | It shifts attention from valuable care activity toward billing state. | Move billing readiness into an advanced filter or billing workspace; add care-state filters instead. | Medium–high: lower cognitive switching. | Small–medium |
| The table has both Status and Next required action, plus several queue badges. | Mary reads overlapping representations before knowing which one controls her next click. | Establish one primary action and demote status/badges to a single secondary line. | High: faster triage. | Small |
| Opening a row can lead directly to a legacy check-in, care-plan, eligibility, or settings page. | Mary sometimes bypasses the focused patient review sequence and loses context. | Route clinical rows through a lightweight patient-work landing state before the specific tool. | High: safer sequencing. | Medium |
| Patient header emphasizes billing readiness while the clinical suggestion panel sits below it. | The first visual status can still feel billing-led even though the workflow is clinically ordered. | Replace the header badge with “Current care state”; keep billing readiness in the evidence section. | Medium: stronger clinical posture. | Small |
| Eligibility, consent, billing readiness, conditions, intake, care plan, progress, and audit all appear on one long page. | Mary must scan substantial information even when only one trigger matters. | Add a focused default view with expandable supporting evidence and retain a comprehensive record view. | High: less cognitive load. | Medium–large |
| Suggested care decision includes optional review time, while task completion can later require another time entry. | Mary may be unsure which time belongs to review versus performed care and risks double entry. | Label time by phase and show linked prior time when completing the task. | High: documentation integrity. | Medium |
| Accepted suggestions create tasks, but the patient task card currently exposes reassignment and reprioritization rather than complete/defer/route actions. | Mary reaches a task but cannot finish the full workflow in the same panel. | Add explicit Start, Complete, Defer, and Route actions with outcome capture. | Critical: removes a workflow dead end. | Medium |
| Provider review creates an awaiting-provider task without an explicit recipient confirmation in the decision form. | Mary cannot verify who will receive the work before saving. | Show the PRP by default and require confirmation or an approved alternate recipient. | High: safer routing. | Medium |
| Specialist routing has a secure report API and durable model but no coordinator-facing composer. | Mary cannot complete specialist routing end to end in the UI. | Add a constrained secure report composer with recipient, purpose, delivery route, and follow-up date. | High for multi-clinician pilots. | Medium–large |
| Returning from patient work relies on browser navigation or existing contextual links. | Mary loses momentum and must relocate the next item. | Preserve queue position and provide “Save and next patient” after a disposition or completion. | High: fewer clicks during repetitive work. | Medium |
| No-result suggestions and stale suggestions share the same quiet area after refresh. | Mary cannot immediately distinguish “nothing clinically appropriate” from “evidence needs refreshing” without reading status details. | Give stale, refreshed-empty, and unavailable states distinct plain-language treatments. | Medium: higher trust. | Small |
| Compliance combines immutable events and decisions but does not present a patient-centered audit timeline. | Reviewers must mentally connect suggestion, task, time, routing, and completion records. | Add a read-only patient/work-item timeline with rule and evidence links. | Medium–high: audit efficiency. | Medium |
| The worklist remains a wide table on narrow screens. | Remote coordinators using smaller laptops may scroll horizontally during triage. | Use a compact card/list treatment below the desktop breakpoint. | Medium: better remote usability. | Medium |

## Cognitive load review for a 120-250 patient panel

This review applies one test to every coordinator-facing surface: **What information can be removed without reducing patient safety or workflow quality?** No changes in this section have been implemented.

The target operating model is a persistent work surface rather than a chain of pages:

`Patient -> Decision -> Action -> Documentation -> Next patient`

The worklist should choose the next patient and remember scope, filters, queue position, and unfinished work. The focused patient workspace should then keep Mary in context until the outcome and actual time are documented. Supporting evidence should remain available through progressive disclosure, not compete with the next clinical action.

### Screen-by-screen removal test

| Screen or surface | Information or decisions that can be removed from the primary view | Intended primary action | Competing actions and rationale | Impact | Effort |
| --- | --- | --- | --- | --- | --- |
| Global coordinator navigation | Remove Provider, Billing, Knowledge, Question Banks, and Settings from the always-visible coordinator path. Keep them available through role-appropriate secondary navigation or contextual links. Practice and signed-in identity can remain compact because they prevent wrong-practice work. | Return to or resume `My Work Today`. | Patient search is a justified secondary escape for unscheduled calls. Sign out is utility navigation, not a workflow action. | High: fewer destinations to remember and less accidental role switching. | Medium |
| My Work Today | Remove page-local queue counts, billing-readiness filter, repeated status, up to three queue badges, operational threshold text per row, and owner from the default assigned-to-Mary view. Collapse provider, assignment, historical month, and other exception filters under an advanced control. | Start or resume the highest-priority patient. | Search is necessary for inbound calls. Queue-group selection is useful for exception work, but should not compete with the recommended next patient. | Critical: the main queue becomes prioritization rather than a dashboard Mary must interpret. | Medium-large |
| Patient registry | Remove default sort and status decisions from routine use; use relevance for search and active patients by default. Keep inactive status and advanced sort available only when needed. | Open the searched patient. | Add patient is justified only for roles responsible for intake and should not visually compete after search results exist. | Medium: fewer controls for an episodic task. | Small-medium |
| Patient workspace header | Remove billing readiness, billing month, and seven equal-weight quick links from the primary header. Keep name, DOB, PRP, and only safety-critical identity/context. Move record editing and billing evidence to secondary actions. | Review the patient-specific next step. | Change patient and urgent escalation are legitimate secondary exits. | Critical: makes the workspace clinical and action-led from the first viewport. | Medium |
| Five-step instructional strip | Remove the static Review/Decide/Perform/Document/Route strip after first-use onboarding. It consumes vertical space but does not say where this patient currently is. Replace it eventually with one stateful step indicator. | Continue the current patient state. | None; completed/future steps are context, not actions. | Medium: less scrolling and more patient-specific guidance. | Small |
| Suggested care activities | Keep exact trigger, patient evidence, rationale, and recommended next step. Move rule ID, catalog version, and expiration to an audit-details disclosure. Remove manual evidence refresh from normal operation by refreshing on entry. Move time capture from the decision itself to completion of performed work. | Review and accept the supported next step. | Different action, provider review, defer, and no intervention are clinically necessary alternatives; reveal them after review and visually subordinate them. | High: preserves explainability while reducing technical and documentation choices. | Medium |
| Patient work items | Do not list every work item below the suggestion panel. Promote the current item into the focused flow and place history/other open items in a compact drawer. Reassignment and reprioritization should not be the only available item actions. | Start or complete the current work item. | Defer and route are safety-preserving alternatives. Reassign is an exception action and can live in an overflow menu. | Critical: removes the current dead end after accepting a suggestion. | Medium-large |
| Eligibility review | Hide completed facts, coordinator-read-only provider attestations, and system validations unless they are blocking. Remove the separate Completion Status card because the actionable missing-items view can communicate state. Replace Save, Save and continue, and Care plan with one state-aware continuation action. | Save missing coordinator facts and continue. | Provider attestation remains visible to a provider when it is the provider's required action. | High: Mary sees only what she can resolve. | Medium |
| Patient intake | Collapse the accepted summary after completion and remove the separate Log intake time link by carrying the performed action into documentation. Do not show correction fields unless the deterministic review identifies a missing field. | Answer the next question, then complete intake. | Pause is justified for interrupted calls. Correction and cancel are exception actions and should remain secondary. | High: maintains continuity through a guided interview. | Medium |
| Care plan | Collapse reviewed intake context, approval history, version metadata, and completed question history. Do not expose check-in and time-log exits while care-plan work is unfinished. Present one state-specific action at a time: save draft, mark coordinator ready, or submit to PRP. | Complete the current care-plan state. | A provider must retain Approve and Request changes as two explicit clinical decisions after review; neither should be hidden. | Critical: converts a long multi-purpose form into a staged workflow. | Large |
| Monthly check-in | Remove the raw public URL, duplicate Copy invitation controls, always-visible message variants, duplicate resend actions, engine metrics, full delivery history, full question list, and response detail when they do not affect the next step. Choose the normal delivery method from patient preferences. Use state to show only Create, Send, Review and close, or Document non-response. | Perform the next check-in state. | Resend, regenerate, copy alternate wording, and change delivery method are recovery/exception actions and belong under secondary options. | Critical: the most overloaded coordinator screen becomes a controlled state machine. | Large |
| Time capture | Remove read-only billing month, threshold-oriented helper text, duplicate Back/Worklist exits, and the full monthly log list from the primary form. Prefill patient, action type, occurrence date, and linked work item. Ask only for actual minutes and an outcome note when not already captured. | Save actual performed work and continue. | Edit date/type is required for late documentation but can be disclosed as a correction. Recent logs remain available for audit or duplicate prevention. | Critical: reduces repetitive entry across 120-250 patients. | Medium-large |
| Provider routing from coordinator work | Remove the generic destination decision when the PRP is already known. Show the PRP, reason, requested response, and urgency in-line; remember this routing with the patient work item. Do not send Mary to the provider dashboard. | Route to the responsible provider. | Choosing an approved alternate recipient is a necessary exception and requires an explicit reason. | High: safer routing with less searching. | Medium |
| Provider attention queue | Remove the four summary tiles when their counts merely repeat the queue below, and avoid separate pending-care-plan cards plus a second table containing overlapping work. Use one priority-ordered provider queue. | Review the next clinical item. | Approve versus request changes remains a necessary clinical decision inside the patient review, not on the queue. | High for end-to-end coordinator continuity because routed work becomes predictable. | Medium |
| Specialist routing | No usable coordinator screen currently exists. When added, it should be an in-workspace action populated from the patient, PRP, trigger, and evidence. Avoid a separate composer page or modal requiring Mary to reconstruct context. | Send the clinically relevant report securely. | Alternate recipient, purpose, and follow-up date are justified safeguards; delivery mechanics should be selected by the system/provider adapter. | High for multi-clinician pilots. | Medium-large |
| Billing evidence | Remove it from Mary's normal patient path unless missing documentation requires coordinator action. Billing calculations, snapshots, audit events, and export state belong to billing/compliance roles. Surface only the specific clinical documentation gap Mary can resolve. | Resolve the named documentation gap, when one exists. | Full evidence review is justified for billing or compliance roles, not as a competing coordinator action. | High: reinforces clinical workflow over threshold chasing. | Medium |
| Compliance audit | Remove it from coordinator navigation. The generated/decided/routed totals and immutable event table are appropriate for a capability-authorized reviewer, but they do not help Mary select the next patient. | Review an exception or audit trail for authorized roles. | Filters and export may compete here because this is an investigative, not throughput, workspace. | Medium: clearer role boundaries. | Small |
| Clinical Knowledge and Question Banks | Remove both from Mary's primary navigation. Present relevant guidance contextually during the patient decision rather than asking Mary to search an administrative hierarchy. | Return to current patient work. | Administrative editing/search belongs to authorized configuration workflows. | High: less searching and less remembering. | Medium |
| Patient creation, practice settings, and administrative setup | Keep these episodic workflows outside the daily coordinator workspace. Within them, show only required fields for the current state and place policy/configuration fields under advanced sections. | Complete the current setup step. | Save and cancel are necessary; no daily-work actions should compete here. | Medium: protects the focused work model. | Medium |

### Click, navigation, and scrolling inventory

- A routine patient can currently require navigation from worklist to patient workspace, then to eligibility/intake/care plan/check-in/time, back to the patient, and back to the worklist. The target is one queue entry and one persistent workspace, with state transitions instead of route changes.
- The patient workspace repeats navigation in the header, action cards, breadcrumbs, return links, and task-specific pages. Context preservation is valuable; the repeated choices are not.
- The worklist has one headline action, six group controls, four filter/search controls, two links per row, optional claiming, and pagination. The queue should make prioritization automatic and disclose manual controls only on demand.
- Monthly check-in contains the highest action density: creation/closure, invitation copying, four message/link variants, send/resend/regenerate, non-response closure, delivery history, responses, and questions. Only one of those is normally valid for the current state.
- Care-plan and patient-work actions are frequently below substantial supporting information. This creates hidden actions through scrolling even though the application uses few modal dialogs.
- No new modal dialogs are recommended. State-specific inline panels, persistent patient context, and drawers for supporting history better preserve continuity.

### One-primary-action rule

The visible primary action should be calculated from patient state and user capability. It should not be chosen from billing proximity.

| State | Primary action | System memory/guidance required |
| --- | --- | --- |
| Queue | Start next patient | Preserve filters, position, unfinished patient, and priority reason. |
| Review | Review exact trigger and evidence | Load only relevant context and remember the governing rule/evidence. |
| Decide | Accept recommended next step | Keep clinically valid alternatives visible but secondary. |
| Perform | Complete the selected care activity | Retain patient, PRP, contact method, instructions, and work-item context. |
| Document | Save outcome and actual time | Prefill activity/date/work item and prevent duplicate time capture. |
| Route | Send to confirmed recipient when needed | Default to PRP, require reason for alternate routing, track response. |
| Complete | Next patient | Return to preserved queue state without another search or selection. |

### Priorities from the cognitive-load pass

1. **Resolved for RC-003 - Close the loop in one patient workspace.** Current-work completion/defer/PRP-route/outcome capability, actual-time documentation, automatic queue return, and optional `Next patient` continuity are implemented and validated.
2. **P0 - Turn monthly check-in into a state-driven flow.** It currently has the highest number of simultaneous actions and the most duplicated delivery information.
3. **P1 - Make the queue authoritative.** Use complete-scope counts and server ordering, default to Mary's assigned work, remove billing/status duplication, and remember queue position.
4. **P1 - Reduce the patient workspace first viewport.** Keep patient identity, safety context, exact trigger, and one recommended action; collapse everything else.
5. **P1 - Integrate documentation with performed work.** Remove separate log-time navigation and distinguish review time from performed-care time automatically.
6. **P2 - Remove administrative destinations from coordinator navigation.** Make knowledge, billing, compliance, question banks, and settings contextual or role-specific.

## Recommendation before approving migration 027

The task-completion blocker is resolved. Mary can start and finish the task without leaving the patient workspace, document a required outcome, affirm actual time, route securely to the patient's PRP or defer with a follow-up date, and return to the prioritized queue with an optional next-patient action. Alternate-recipient routing remains deliberately deferred; the pilot should confirm that PRP-only default routing is sufficient. The remaining observations can be sequenced after RC-003 or explicitly accepted for pilot scope.

## First-patient onboarding review

The avoidable prerequisite was an empty Primary Responsible Provider list after practice creation. Provider intent and the first active provider are now collected during onboarding, and interrupted provisioning returns an authorized owner or administrator to a one-step provider recovery screen. The first patient receives that provider as its initial selection.

Remaining prompts were classified by whether the software can safely create the missing information:

| Prompt or prerequisite | Finding | Founder observation |
| --- | --- | --- |
| Display name or patient name | The form already derives display name from first and last name. | Keep the fallback; do not require duplicate name entry. |
| Primary Responsible Provider | This can and should be created earlier. | Addressed in onboarding; the patient-form error remains defensive only. |
| Structured eligibility after initial save | The patient record must exist before dependent clinical records can reference it. | A future staged form could make the save boundary feel continuous, but should not fabricate eligibility. |
| Two qualifying chronic conditions | These are clinical facts and cannot be inferred or created for convenience. | Keep explicit review and evidence; improve guidance rather than automation. |
| Patient consent | Consent cannot be assumed or pre-checked. | Keep the deliberate capture step and required elements. |
| Provider attestation | Clinical judgment cannot be generated by onboarding. | Route it proactively to the responsible provider after the patient exists. |
| NPI and extended provider profile | Not required to assign the first patient, but may block later billing readiness. | State this during provider onboarding and surface the exact remaining profile task later; do not send the founder searching through Settings. |
| Potential duplicate confirmation | This is reactive by design because it protects patient identity and data quality. | Keep the interruption explicit and uncommon. |

The patient creation page remains a long combined demographics, conditions, enrollment, consent, and readiness form. It is possible to create the first patient without Settings, but a future review should stage clinical enrollment after the core patient record is saved while preserving the appearance of one continuous onboarding flow.
