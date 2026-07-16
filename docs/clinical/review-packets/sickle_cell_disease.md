# Sickle Cell Disease

## Review Metadata

- Canonical ID: `sickle_cell_disease`
- Bank ID: `ccm-bank.sickle_cell_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 38
- Estimated review time: 18 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| D57 | 53 |

Total mapped codes: 53

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.sickle.fever` | Do you have a fever now or have you had one with new illness symptoms? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for infection risk requiring prompt assessment in sickle cell disease. |
| 70 | `ccm.hematology.lab_followup` | Is a blood-count test, infusion, or hematology visit overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies overdue monitoring or treatment coordination. |
| 80 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.hematology.lab_followup` (3 banks): Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.sickle.fever`: Do you have a fever now or have you had one with new illness symptoms?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.sickle.pain_crisis`: Have you had a sickle-cell pain crisis since the last review?
- `ccm.sickle.chest_symptoms`: Have you had new chest pain or new breathing difficulty?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.sickle.fever`: Do you have a fever now or have you had one with new illness symptoms?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.sickle.pain_crisis`: Have you had a sickle-cell pain crisis since the last review?
- `ccm.sickle.chest_symptoms`: Have you had new chest pain or new breathing difficulty?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.sickle.fever`: Do you have a fever now or have you had one with new illness symptoms?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.sickle.pain_crisis`: Have you had a sickle-cell pain crisis since the last review?
- `ccm.sickle.chest_symptoms`: Have you had new chest pain or new breathing difficulty?

## Red-Flag Questions

- `ccm.sickle.fever` (urgent): Do you have a fever now or have you had one with new illness symptoms?
- `ccm.sickle.chest_symptoms` (urgent): Have you had new chest pain or new breathing difficulty?

## Variants

### Crisis (`crisis`)

- Activation: clinical_content_group
- Clinical content groups: sickle_cell_disease__with_crisis

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.sickle.pain_crisis` | Have you had a sickle-cell pain crisis since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks a major disease-specific acute event. |

### Acute chest syndrome (`acute_chest`)

- Activation: clinical_content_group
- Clinical content groups: sickle_cell_disease__acute_chest_syndrome

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.sickle.chest_symptoms` | Have you had new chest pain or new breathing difficulty? | required | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for possible acute chest syndrome or another urgent cardiopulmonary problem. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.sickle.fever`: Screens for infection risk requiring prompt assessment in sickle cell disease.
- `ccm.hematology.lab_followup`: Identifies overdue monitoring or treatment coordination.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.hospital.had_admission`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 2 variant(s) require confirmation that activation criteria materially change CCM questioning.
