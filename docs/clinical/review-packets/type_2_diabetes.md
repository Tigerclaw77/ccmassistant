# Type 2 Diabetes

## Review Metadata

- Canonical ID: `type_2_diabetes`
- Bank ID: `ccm-bank.type_2_diabetes`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 4
- Estimated review time: 26 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| E11 | 117 |

Total mapped codes: 117

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.diabetes.latest_glucose` | What was your most recent blood glucose reading? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 3 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.diabetes.high_pattern` | Have glucose readings been above the range in your care plan more often than usual? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks worsening hyperglycemia against the patient's established plan rather than prescribing a target. |
| 40 | `ccm.diabetes.low_episode` | Have you had symptoms of low blood sugar since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 3 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.diabetes.foot_concern` | Do you have a new sore, blister, redness, or numbness in either foot? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 3 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 80 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.diabetes.latest_glucose` (3 banks): What was your most recent blood glucose reading?
- `ccm.diabetes.low_episode` (3 banks): Have you had symptoms of low blood sugar since the last review?
- `ccm.diabetes.foot_concern` (3 banks): Do you have a new sore, blister, redness, or numbness in either foot?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.bp.latest_systolic` (11 banks): What was your most recent systolic blood pressure reading?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need` (10 banks): Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.transportation.barrier` (8 banks): Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit` (4 banks): Have you visited an emergency department or urgent-care center since the last review?

## New Questions

- `ccm.diabetes.high_pattern`: Have glucose readings been above the range in your care plan more often than usual?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.diabetes.latest_glucose`: What was your most recent blood glucose reading?
- `ccm.diabetes.high_pattern`: Have glucose readings been above the range in your care plan more often than usual?
- `ccm.diabetes.low_episode`: Have you had symptoms of low blood sugar since the last review?
- `ccm.diabetes.foot_concern`: Do you have a new sore, blister, redness, or numbness in either foot?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit`: Have you visited an emergency department or urgent-care center since the last review?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.diabetes.latest_glucose`: What was your most recent blood glucose reading?
- `ccm.diabetes.high_pattern`: Have glucose readings been above the range in your care plan more often than usual?
- `ccm.diabetes.low_episode`: Have you had symptoms of low blood sugar since the last review?
- `ccm.diabetes.foot_concern`: Do you have a new sore, blister, redness, or numbness in either foot?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?
- `ccm.emergency.had_visit`: Have you visited an emergency department or urgent-care center since the last review?

## Red-Flag Questions

- None

## Variants

### Kidney complication (`kidney_complication`)

- Activation: clinical_content_group
- Clinical content groups: type_2_diabetes__kidney_complication

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.bp.latest_systolic` | What was your most recent systolic blood pressure reading? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 11 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Ophthalmic complication (`ophthalmic_complication`)

- Activation: clinical_content_group
- Clinical content groups: type_2_diabetes__ophthalmic_complication, type_2_diabetes__proliferative_retinopathy, type_2_diabetes__proliferative_retinopathy_macular_edema

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1120 | `ccm.transportation.barrier` | Has transportation caused you to miss or delay health care or medication pickup? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Foot ulcer (`foot_ulcer`)

- Activation: clinical_content_group
- Clinical content groups: type_2_diabetes__foot_ulcer

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

### Acute metabolic complication follow-up (`acute_metabolic_complication`)

- Activation: clinical_content_group
- Clinical content groups: type_2_diabetes__ketoacidosis, type_2_diabetes__hyperosmolarity

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.emergency.had_visit` | Have you visited an emergency department or urgent-care center since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 4 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.diabetes.latest_glucose`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.diabetes.high_pattern`: Tracks worsening hyperglycemia against the patient's established plan rather than prescribing a target.
- `ccm.diabetes.low_episode`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.diabetes.foot_concern`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Existing canonical audit reuse/merge concern (MEDIUM): Retain distinct canonical IDs, but share a diabetes core and complication modules to avoid duplicate questions.
- Existing canonical audit reuse/merge concern (MEDIUM): Keep neuropathy independently selectable while reusing a complication module for diabetic neuropathy.
- 4 variant(s) require confirmation that activation criteria materially change CCM questioning.
