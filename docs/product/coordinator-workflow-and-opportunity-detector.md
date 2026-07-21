# Coordinator Workflow and Suggested Care Activities

Status: RC-003 blocker implementation and fresh local validation complete; migration `027_task_driven_coordinator_workflow.sql` remains unapplied to shared environments.

## Clinical workflow philosophy

CCM Assistant is a clinical workflow optimizer, not a billing optimizer. The product should identify the most valuable legitimate next action, support staff in completing it safely, and preserve trustworthy documentation. Billing readiness is a downstream result of real, documented care.

The product never invents a service to approach a time threshold. If current patient evidence supports no further care activity, the correct result is: “No additional clinically appropriate activity is supported by the available patient evidence.”

## Coordinator philosophy

`My Work Today` helps coordinators move through evidence-backed care in a stable sequence: review, decide, perform, document, and route. Work is grouped into Needs Attention, Ready to Contact, Awaiting Patient, Awaiting Provider, Documentation Needed, and Completed Today.

Coordinators should see one concise “Why now” reason. Practice assignment remains the default: an administrator assigns coordinators. Self-claiming of an unassigned patient is disabled by default and can be enabled only through a practice policy. A claim requires AAL2, an active coordinator membership, and a patient with no coordinator assignment.

## Provider philosophy

Providers receive clinical decisions and review requests, not billing prompts. The Primary Responsible Provider (PRP) remains the patient’s clinical owner even when work is routed to a supervising provider or specialist. Provider review returns clear instructions to the care team without transferring ownership.

## Why threshold awareness exists

Current CCM time and days remaining provide operational awareness of the monthly care cycle. They help staff understand context, scheduling, and documentation completeness. Threshold proximity is never the trigger or primary reason for a suggested care activity.

The intended message is: before the monthly care cycle concludes, consider whether any additional clinically appropriate service would benefit the patient. “More minutes” is not itself a service.

Month-end awareness begins on the 25th by default, evaluated in the practice timezone. Administrators can configure days 1–28. Month-end context can elevate or generate a reminder only when unresolved care activity already exists.

## How suggested care activities are generated

Detector engine version `ccm-opportunity-rules-v1` evaluates recorded patient facts. The clinical trigger catalog is independently versioned as `ccm-clinical-trigger-catalog-v1`.

Current rules cover:

- abnormal questionnaire responses;
- documented medication access or adherence issues;
- home-monitoring barriers;
- hospital discharge and other transitions of care;
- provider-review requirements;
- care-plan revision requests;
- upcoming month-end with unresolved care activity.

The detector makes no opaque model call. Each suggestion records its detector version, catalog version, rule identifier, exact trigger summary, structured evidence, rationale, related condition or workflow item, eligible performers, provider involvement, generated date, type-specific expiration, and evidence fingerprint. The fingerprint covers the complete immutable detector output and evidence inputs, excluding only generation and expiration timestamps. A detector-version, rule-version, or evaluated-input change therefore creates a new row. An exact retry returns the existing row and never updates it.

## Type-specific expiration

Defaults are configurable per practice and constrained to 1–90 days:

| Suggested care activity type | Default |
| --- | ---: |
| Abnormal questionnaire | 1 day |
| Hospital discharge | 2 days |
| Provider review | 3 days |
| Month-end operational reminder | 3 days |
| Medication follow-up | 7 days |
| Home monitoring | 7 days |
| Care-plan revision | 7 days |
| Educational reminder | 14 days |

Expired suggestions fail closed and must be regenerated from current evidence.

## Explainability

Every suggestion answers “Why am I seeing this?” with the exact recorded trigger, such as an abnormal questionnaire response, a documented adherence issue, a hospital discharge task, or an overdue care-plan revision. It separately shows the clinical rationale and immutable rule identifier/version. The user never has to infer why the item appeared.

## Time capture

Time defaults to none. The available choices are no time, 1 minute, 2 minutes, or a custom whole-number duration. Any positive duration requires the user to affirm that it is the actual time they personally spent reviewing the item.

Time is never automatic because a generated suggestion proves neither that someone reviewed it nor that a service occurred. Explicit capture protects clinical integrity, staff accountability, and downstream billing evidence. No multiplier, inferred duration, or threshold-based time is permitted.

## Suggestion, task, completed work, and billable work

| Record | Meaning |
| --- | --- |
| Suggestion | A deterministic, evidence-backed possible next step. It is not work performed. |
| Task | A real assignment created after a user accepts or changes the suggested action, or routes it for provider review. |
| Completed work | An activity actually performed, with outcome documentation and any actual time. Completion is an explicit state transition. |
| Billable work | Completed, documented work that separately satisfies applicable program, payer, consent, care-plan, practitioner, and time requirements. The system never assumes that completed work is billable. |

## Routing and production adapters

Clinical reports retain the PRP separately from the recipient. Supported recipient purposes include PRP, supervising provider, specialist, compliance, billing, and coordinator workflows. PHI-bearing content requires a secure workspace, secure link, approved secure message, or controlled export. Ordinary email remains a generic notification containing no PHI.

Vendor selection is deliberately deferred. `NotificationProvider`, `ClinicalReportExporter`, and `SecureMessageProvider` define the integration contracts so a future approved vendor can plug in without rewriting clinical workflow rules.

## Compliance visibility

Compliance remains capability-based under the existing owner/administrator authorization path. The compliance view is read-only and shows rule identifiers and versions, suggestion decisions, time attestations, routing status, and immutable history. No separate authorization model was introduced.

## Durable records and audit

Migration `027` adds internal `ccm_opportunities` records, evidence, dispositions, work items, priority factors, deviation notes, clinical reports, and work-item events. The internal schema name remains stable even though the clinical UI says “Suggested care activity.” Interaction logs link to work items and decisions. Generated evidence, decisions, priority factors, deviations, and events are immutable.

All new public tables use RLS and explicit least-privilege grants. Authenticated users may read practice-scoped workflow records, update scoped work items and reports, and create scoped reports. They cannot insert detector opportunities, evidence, priority factors, dispositions, deviations, work items, or audit events directly.

Opportunity generation first authorizes the authenticated AAL2 user and reads detector inputs through that user's RLS-bound client. Only then does the server use its service credential to call `store_ccm_opportunity`, a service-role-only, `SECURITY INVOKER` transaction with exact insert/select grants on opportunities and evidence. The transaction inserts an opportunity and all evidence atomically; exact retries return the existing immutable opportunity.

The intentionally privileged functions are:

- `ccm_user_in_patient_scope`: authenticated read-only AAL2 scope helper used by RLS and clinical transactions;
- `claim_unassigned_ccm_patient`: authenticated AAL2 coordinator claim transaction with tenant, role, policy, and unassigned-state checks;
- `dispose_ccm_opportunity`: authenticated AAL2 clinical transaction that validates scope before writing a disposition, optional work item, affirmed time, and audit event;
- `record_ccm_work_item_change`: trigger-only audit writer, with direct execution revoked; and
- `enforce_provider_lifecycle`: trigger-only provider ownership guard, with direct execution revoked.

Each `SECURITY DEFINER` function has a fixed trusted search path, schema-qualified relations, explicit execute revocations, and a database comment documenting why elevation is required. The optional claim function remains narrowly scoped: it rechecks AAL2, role, practice policy, tenant, and unassigned state before assigning the coordinator and recording an audit event.

## Explicit boundaries

This sprint does not add automatic billing, automatic time, automatic patient contact, CPT changes, opaque AI reasoning, production communication vendors, department-management UI, VPN/device controls, full EMR integration, unrestricted PHI email, or custom role builders.

## Release prerequisite

Migration `027` passed a fresh-database migration run, database lint, RLS/grant review, and 66 pgTAP assertions. Founder approval and controlled hosted preflight remain required before application. No fallback bypasses the missing schema.
