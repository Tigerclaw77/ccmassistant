# Hypothyroidism

## Review Metadata

- Canonical ID: `hypothyroidism`
- Bank ID: `ccm-bank.hypothyroidism`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 22
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| E03 | 9 |

Total mapped codes: 9

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.thyroid.lab_due` | Is a thyroid blood test or thyroid follow-up overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Identifies overdue monitoring. |
| 30 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.thyroid.lab_due` (2 banks): Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.thyroid.lab_due`: Identifies overdue monitoring.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Small preset; confirm it is sufficient for the clinic's patient mix.
