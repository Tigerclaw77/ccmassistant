# Osteoporosis

## Review Metadata

- Canonical ID: `osteoporosis`
- Bank ID: `ccm-bank.osteoporosis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 17
- Estimated review time: 16 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M80 | 397 |
| M81 | 4 |

Total mapped codes: 401

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.osteoporosis.new_fracture` | Have you been told you have a new fracture since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Captures a management-changing fracture event. |
| 30 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.osteoporosis.treatment_barrier` | Have you had trouble taking or receiving your osteoporosis treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies adherence or access barriers without assuming treatment type. |
| 50 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit` (4 banks): Have you visited an emergency department or urgent-care center since the last review?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?

## New Questions

- `ccm.osteoporosis.new_fracture`: Have you been told you have a new fracture since the last review?
- `ccm.osteoporosis.treatment_barrier`: Have you had trouble taking or receiving your osteoporosis treatment?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.osteoporosis.new_fracture`: Have you been told you have a new fracture since the last review?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.osteoporosis.treatment_barrier`: Have you had trouble taking or receiving your osteoporosis treatment?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit`: Have you visited an emergency department or urgent-care center since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.osteoporosis.new_fracture`: Have you been told you have a new fracture since the last review?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.osteoporosis.treatment_barrier`: Have you had trouble taking or receiving your osteoporosis treatment?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit`: Have you visited an emergency department or urgent-care center since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Red-Flag Questions

- None

## Variants

### Current pathological fracture (`current_fracture`)

- Activation: clinical_content_group
- Clinical content groups: osteoporosis__with_current_fracture

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.emergency.had_visit` | Have you visited an emergency department or urgent-care center since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 4 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.osteoporosis.new_fracture`: Captures a management-changing fracture event.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.osteoporosis.treatment_barrier`: Identifies adherence or access barriers without assuming treatment type.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.severity`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- Existing canonical audit split concern (MEDIUM): Current-fracture separation is useful; consider healing status and recurrent-fracture risk without creating site-by-side profiles.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
