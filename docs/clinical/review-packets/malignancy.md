# Active Malignancy

## Review Metadata

- Canonical ID: `malignancy`
- Bank ID: `ccm-bank.malignancy`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 7
- Estimated review time: 22 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| C00 | 10 |
| C01 | 1 |
| C02 | 8 |
| C03 | 4 |
| C04 | 5 |
| C05 | 6 |
| C06 | 8 |
| C07 | 1 |
| C08 | 4 |
| C09 | 5 |
| C10 | 8 |
| C11 | 7 |
| C12 | 1 |
| C13 | 6 |
| C14 | 4 |
| C15 | 6 |
| C16 | 10 |
| C17 | 7 |
| C18 | 11 |
| C19 | 1 |
| C20 | 1 |
| C21 | 5 |
| C22 | 9 |
| C23 | 1 |
| C24 | 5 |
| C25 | 9 |
| C26 | 4 |
| C30 | 3 |
| C31 | 7 |
| C32 | 7 |
| C33 | 1 |
| C34 | 22 |
| C37 | 1 |
| C38 | 7 |
| C39 | 3 |
| C40 | 25 |
| C41 | 7 |
| C43 | 33 |
| C44 | 147 |
| C45 | 6 |
| C46 | 12 |
| C47 | 16 |
| C48 | 5 |
| C49 | 24 |
| C4A | 33 |
| C50 | 86 |
| C51 | 6 |
| C52 | 1 |
| C53 | 5 |
| C54 | 7 |
| C55 | 1 |
| C56 | 5 |
| C57 | 18 |
| C58 | 1 |
| C60 | 6 |
| C61 | 1 |
| C62 | 13 |
| C63 | 13 |
| C64 | 4 |
| C65 | 4 |
| C66 | 4 |
| C67 | 11 |
| C68 | 5 |
| C69 | 37 |
| C70 | 4 |
| C71 | 11 |
| C72 | 19 |
| C73 | 1 |
| C74 | 13 |
| C75 | 9 |
| C76 | 14 |
| C77 | 9 |
| C78 | 17 |
| C79 | 33 |
| C7A | 28 |
| C7B | 10 |
| C80 | 4 |
| C81 | 85 |
| C82 | 109 |
| C83 | 87 |
| C84 | 98 |
| C85 | 49 |
| C86 | 22 |
| C88 | 19 |
| C90 | 17 |
| C91 | 37 |
| C92 | 41 |
| C93 | 21 |
| C94 | 22 |
| C95 | 13 |
| C96 | 13 |

Total mapped codes: 1539

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.cancer.new_symptom` | Has a new symptom appeared that your cancer team does not yet know about? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Prompts timely oncology communication without diagnosing the symptom. |
| 30 | `ccm.cancer.treatment_change` | Has cancer treatment started, stopped, or changed since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Captures a major care-plan and medication-reconciliation event. |
| 40 | `ccm.liver.appetite_weight` | Have poor appetite or unplanned weight loss made eating enough difficult? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies nutrition risk needing care-plan follow-up. |
| 50 | `ccm.hematology.lab_followup` | Is a blood-count test, infusion, or hematology visit overdue? | optional | no | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies overdue monitoring or treatment coordination. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.liver.appetite_weight` (3 banks): Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.hematology.lab_followup` (3 banks): Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.goal.progress` (2 banks): How is progress toward your current care-plan goal?
- `ccm.pain.function_interference` (13 banks): Is pain preventing an important daily activity?
- `ccm.coordination.open_need` (10 banks): Do you need help arranging care, equipment, referrals, records, or services?

## New Questions

- `ccm.cancer.new_symptom`: Has a new symptom appeared that your cancer team does not yet know about?
- `ccm.cancer.treatment_change`: Has cancer treatment started, stopped, or changed since the last review?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.cancer.new_symptom`: Has a new symptom appeared that your cancer team does not yet know about?
- `ccm.cancer.treatment_change`: Has cancer treatment started, stopped, or changed since the last review?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.preventive.overdue_care`: Are any recommended vaccines, screenings, or preventive visits overdue?
- `ccm.goal.progress`: How is progress toward your current care-plan goal?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.cancer.new_symptom`: Has a new symptom appeared that your cancer team does not yet know about?
- `ccm.cancer.treatment_change`: Has cancer treatment started, stopped, or changed since the last review?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.hematology.lab_followup`: Is a blood-count test, infusion, or hematology visit overdue?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.preventive.overdue_care`: Are any recommended vaccines, screenings, or preventive visits overdue?
- `ccm.goal.progress`: How is progress toward your current care-plan goal?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?

## Red-Flag Questions

- None

## Variants

### Active treatment (`active_treatment`)

- Activation: explicit
- Clinical content groups: None

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1120 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Surveillance (`surveillance`)

- Activation: explicit
- Clinical content groups: None

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.preventive.overdue_care` | Are any recommended vaccines, screenings, or preventive visits overdue? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 1 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.goal.progress` | How is progress toward your current care-plan goal? | optional | no | monthly_checkin, care_plan_review, annual_review | no | 2 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Metastatic disease (`metastatic`)

- Activation: explicit
- Clinical content groups: None

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1120 | `ccm.pain.function_interference` | Is pain preventing an important daily activity? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 13 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.cancer.new_symptom`: Prompts timely oncology communication without diagnosing the symptom.
- `ccm.cancer.treatment_change`: Captures a major care-plan and medication-reconciliation event.
- `ccm.liver.appetite_weight`: Identifies nutrition risk needing care-plan follow-up.
- `ccm.hematology.lab_followup`: Identifies overdue monitoring or treatment coordination.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- Cancer site and treatment phase still require coordinator judgment.
- Existing canonical audit split concern (HIGH): Retain site families but add active treatment, metastatic disease, remission/surveillance, and symptom-burden dimensions.
- 3 variant(s) require confirmation that activation criteria materially change CCM questioning.
