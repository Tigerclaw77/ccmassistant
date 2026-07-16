# Anemia

## Review Metadata

- Canonical ID: `anemia`
- Bank ID: `ccm-bank.anemia`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 19
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| D64 | 1 |

Total mapped codes: 1

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.anemia.symptom_change` | Has anemia made your usual activities harder since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks clinically meaningful anemia symptom burden. |
| 30 | `ccm.hematology.lab_followup` | Is a blood-count test, infusion, or hematology visit overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies overdue monitoring or treatment coordination. |
| 40 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 70 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.hematology.lab_followup` (3 banks): Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.anemia.symptom_change`: Has anemia made your usual activities harder since the last review?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.anemia.symptom_change`: Has anemia made your usual activities harder since the last review?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.anemia.symptom_change`: Has anemia made your usual activities harder since the last review?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.anemia.symptom_change`: Tracks clinically meaningful anemia symptom burden.
- `ccm.hematology.lab_followup`: Identifies overdue monitoring or treatment coordination.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.hospital.had_admission`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
