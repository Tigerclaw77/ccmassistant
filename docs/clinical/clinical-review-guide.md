# CCM Assistant Clinical Review Guide

## Purpose

This package supports the first structured review of condition-specific suggested question banks by physicians, nurses, and experienced CCM coordinators. All banks and questions remain `DRAFT_CLINICAL_REVIEW`. Review materials summarize existing content; they do not add or rewrite clinical content.

Start with the [prioritized packet index](./review-packets/index.md). Use `data/clinical-review/review-priority.csv` for assignment planning and the XLSX workbook or CSV review files for markup.

## Reviewer Roles

- Physicians should focus on clinical appropriateness, missing high-impact concepts, red-flag thresholds, urgency, provider notification, and variant activation.
- Nurses should focus on question clarity, triage logic, branching, urgency, patient comprehension, and whether follow-up behavior is safe and actionable.
- Experienced CCM coordinators should focus on monthly usefulness, duplication, call burden, care-plan relevance, answerability, and whether coordinator actions are operationally clear.

At least one clinician with escalation authority should review every red-flag question. High-priority banks should receive both clinical and coordinator review.

## Review Order

The queue is sorted using existing catalog metadata in this order:

1. Medicare relevance: `COMMON`, then `OCCASIONAL`, then `RARE`.
2. CCM-impact proxy: required/default questions, red flags, and variants.
3. Uncertainty proxy: architecture-seed status and existing split, merge, or variant concerns.
4. Reuse: number of condition banks affected by the questions in the bank.

The displayed weighted score is supplemental. These are operational review-priority proxies, not disease prevalence estimates, clinical severity scores, or treatment guidance.

## How To Review

1. Confirm that the canonical condition and ICD families describe one coherent longitudinal CCM target.
2. Read the base suggested bank in order. Assess whether each question is necessary, understandable, answerable, and appropriate for its listed contexts.
3. Review reused questions for fit in this condition. Approval in one bank does not automatically approve the same question in another clinical context.
4. Review new questions closely for wording, answer type, rationale, follow-up behavior, and redundancy.
5. Check intake-only, monthly, and care-plan lists for burden and cadence.
6. Review every red-flag question, branch, urgency, and provider-notification expectation against the clinic's escalation protocol.
7. Review variants only when their activation criteria materially change care-management questioning.
8. Record one feedback action per row and provide a rationale. Add a bank-level `missing_question` row when needed.

## Expected Time

- Small architecture-seed bank: approximately 10 minutes.
- Typical populated bank: approximately 12-18 minutes.
- Bank with several red flags or variants: approximately 20-30 minutes.

The packet and priority spreadsheet include an estimate for each condition. Assign additional time when local escalation protocols or specialist input are required.

## Feedback Actions

Use only these machine-readable values in `feedback_action`:

| Value | Meaning | Required proposal field |
| --- | --- | --- |
| `approve` | Approve the reviewed target as written | None |
| `reject` | Reject the target or bank | Rationale |
| `rewrite` | Replace wording exactly as supplied | `proposed_text` |
| `optional` | Make the question optional | `proposed_selection_level` may be blank or `optional` |
| `missing_question` | Record a missing concept on a bank row | `proposed_text` |
| `unnecessary_question` | Recommend removing a question | Rationale |
| `incorrect_branching` | Replace branching with supplied structured JSON | `proposed_branching` |
| `incorrect_urgency` | Change urgency | `proposed_urgency` |

Every reviewed row should include `reviewer`, `reviewed_at`, and `rationale`. Timestamps use UTC ISO-8601 format, such as `2026-07-15T18:30:00Z`.

## Approval Workflow

1. Reviewer enters feedback and leaves `disposition` as `pending`.
2. A clinical steward reconciles conflicting feedback and confirms the exact proposed value.
3. The steward changes `disposition` to `accepted` or `declined`.
4. Accepted rows require `accepted_by` and `accepted_at`.
5. Run a validation-only import before staging:

   `npm run clinical-review:import -- --input path/to/feedback.csv --check`

6. Stage accepted decisions in an append-only change ledger:

   `npm run clinical-review:import -- --input path/to/feedback.csv`

The importer never calls an AI model, never rewrites reviewer text, and never applies changes directly to the canonical catalog. A separate controlled publication step must review the staged ledger before any source update.

## Import Format

`data/clinical-review/question-review.csv` and `bank-review.csv` are the authoritative CSV templates. The XLSX workbook contains the same editable fields with validation lists.

For accepted changes, preserve these source columns unchanged: `feedback_id`, `row_type`, `canonical_condition_id`, `bank_id`, `variant_id`, `question_id`, `current_bank_version`, and `current_question_version`. The importer rejects stale or orphan targets.

Required accepted-row fields are `feedback_action`, `reviewer`, `reviewed_at`, `rationale`, `disposition=accepted`, `accepted_by`, and `accepted_at`. Action-specific proposal fields are defined in `data/clinical-review/feedback-schema.json`.

## Versioning

Imported decisions record the source bank and question versions, proposed next versions, reviewer and steward identities, both timestamps, rationale, prior-value snapshot, exact proposed value, and transformation type `exact_clinician_input_no_ai`.

Approve/reject decisions preserve the current content version. Content-changing decisions propose the next version. Staging does not alter source files or automatically merge missing questions into the canonical library.

Before publication, rerun the complete question-bank validation and regression suite. Retain the staged import ledger with the published content version for audit history.

## Safety And Scope

Do not enter patient names, dates of birth, medical record numbers, encounter details, or other PHI in reviewer rationale or proposed text. Review should address generic question-bank content only.

This package does not constitute clinical approval. Content remains draft until the documented approval and publication workflow is complete.
