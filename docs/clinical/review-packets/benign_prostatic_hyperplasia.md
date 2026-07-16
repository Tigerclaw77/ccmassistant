# Benign Prostatic Hyperplasia

## Review Metadata

- Canonical ID: `benign_prostatic_hyperplasia`
- Bank ID: `ccm-bank.benign_prostatic_hyperplasia`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 55
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| N40 | 5 |

Total mapped codes: 5

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.urinary.emptying` | Have you been unable to empty your bladder or unable to urinate? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for urinary retention requiring prompt evaluation. |
| 70 | `ccm.urinary.nocturia` | How many times do you usually get up to urinate at night? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Measures nocturia burden using a deterministic range. |
| 80 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.urinary.emptying`: Have you been unable to empty your bladder or unable to urinate?
- `ccm.urinary.nocturia`: How many times do you usually get up to urinate at night?
- `ccm.urinary.symptom_change`: Has urine flow or the feeling of incomplete emptying worsened?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.urinary.emptying`: Have you been unable to empty your bladder or unable to urinate?
- `ccm.urinary.nocturia`: How many times do you usually get up to urinate at night?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.urinary.symptom_change`: Has urine flow or the feeling of incomplete emptying worsened?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.urinary.emptying`: Have you been unable to empty your bladder or unable to urinate?
- `ccm.urinary.nocturia`: How many times do you usually get up to urinate at night?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.urinary.symptom_change`: Has urine flow or the feeling of incomplete emptying worsened?

## Red-Flag Questions

- `ccm.urinary.emptying` (same_day): Have you been unable to empty your bladder or unable to urinate?

## Variants

### Lower urinary tract symptoms (`lower_urinary_tract_symptoms`)

- Activation: clinical_content_group
- Clinical content groups: benign_prostatic_hyperplasia__with_lower_urinary_tract_symptoms

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.urinary.symptom_change` | Has urine flow or the feeling of incomplete emptying worsened? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks lower-urinary-tract symptom change. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.urinary.emptying`: Screens for urinary retention requiring prompt evaluation.
- `ccm.urinary.nocturia`: Measures nocturia burden using a deterministic range.
- `ccm.hospital.had_admission`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
