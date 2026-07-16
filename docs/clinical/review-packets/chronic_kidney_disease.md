# Chronic Kidney Disease

## Review Metadata

- Canonical ID: `chronic_kidney_disease`
- Bank ID: `ccm-bank.chronic_kidney_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 13
- Estimated review time: 19 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| N18 | 11 |
| Z99 | 1 |

Total mapped codes: 12

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.ckd.lab_due` | Is a kidney blood test or urine test overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies overdue kidney-function or albumin monitoring. |
| 30 | `ccm.ckd.swelling_change` | Has swelling in your legs, feet, or around your eyes increased? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks possible fluid-balance change. |
| 40 | `ccm.bp.latest_systolic` | What was your most recent systolic blood pressure reading? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 11 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 70 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.bp.latest_systolic` (11 banks): What was your most recent systolic blood pressure reading?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.transportation.barrier` (8 banks): Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.coordination.open_need` (10 banks): Do you need help arranging care, equipment, referrals, records, or services?

## New Questions

- `ccm.ckd.lab_due`: Is a kidney blood test or urine test overdue?
- `ccm.ckd.swelling_change`: Has swelling in your legs, feet, or around your eyes increased?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.ckd.lab_due`: Is a kidney blood test or urine test overdue?
- `ccm.ckd.swelling_change`: Has swelling in your legs, feet, or around your eyes increased?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.ckd.lab_due`: Is a kidney blood test or urine test overdue?
- `ccm.ckd.swelling_change`: Has swelling in your legs, feet, or around your eyes increased?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?

## Red-Flag Questions

- None

## Variants

### Advanced-stage CKD (`advanced_stage`)

- Activation: clinical_content_group
- Clinical content groups: chronic_kidney_disease__advanced_stage

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Dialysis (`dialysis`)

- Activation: clinical_content_group
- Clinical content groups: chronic_kidney_disease__dialysis_considerations

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.transportation.barrier` | Has transportation caused you to miss or delay health care or medication pickup? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.ckd.lab_due`: Identifies overdue kidney-function or albumin monitoring.
- `ccm.ckd.swelling_change`: Tracks possible fluid-balance change.
- `ccm.bp.latest_systolic`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 2 variant(s) require confirmation that activation criteria materially change CCM questioning.
