# Dementia

## Review Metadata

- Canonical ID: `dementia`
- Bank ID: `ccm-bank.dementia`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 15
- Estimated review time: 16 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| F01 | 33 |
| F02 | 33 |
| F03 | 33 |
| G30 | 5 |

Total mapped codes: 104

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.dementia.safety_change` | Has a new safety concern come up because of changes in memory or thinking? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Screens for changes in daily safety that may require caregiver or clinician action. |
| 30 | `ccm.dementia.caregiver_strain` | Does the caregiver need more help to safely carry out the care plan? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies caregiver support needs affecting plan feasibility. |
| 40 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.mental.mood_frequency` (8 banks): How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency` (8 banks): How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?

## New Questions

- `ccm.dementia.safety_change`: Has a new safety concern come up because of changes in memory or thinking?
- `ccm.dementia.caregiver_strain`: Does the caregiver need more help to safely carry out the care plan?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.dementia.safety_change`: Has a new safety concern come up because of changes in memory or thinking?
- `ccm.dementia.caregiver_strain`: Does the caregiver need more help to safely carry out the care plan?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.dementia.safety_change`: Has a new safety concern come up because of changes in memory or thinking?
- `ccm.dementia.caregiver_strain`: Does the caregiver need more help to safely carry out the care plan?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Red-Flag Questions

- None

## Variants

### Behavioral features (`behavioral_features`)

- Activation: clinical_content_group
- Clinical content groups: dementia__mild_behavioral_features, dementia__moderate_behavioral_features, dementia__severe_behavioral_features, dementia__unspecified_behavioral_features

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.mental.mood_frequency` | How often have you felt down, depressed, or hopeless in the past two weeks? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.mental.anxiety_frequency` | How often have you felt nervous, anxious, or unable to control worry in the past two weeks? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.dementia.safety_change`: Screens for changes in daily safety that may require caregiver or clinician action.
- `ccm.dementia.caregiver_strain`: Identifies caregiver support needs affecting plan feasibility.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
