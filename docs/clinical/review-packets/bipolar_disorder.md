# Bipolar Disorder

## Review Metadata

- Canonical ID: `bipolar_disorder`
- Bank ID: `ccm-bank.bipolar_disorder`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 66
- Estimated review time: 12 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| F31 | 34 |

Total mapped codes: 34

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.mental.mood_frequency` | How often have you felt down, depressed, or hopeless in the past two weeks? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.mental.anxiety_frequency` | How often have you felt nervous, anxious, or unable to control worry in the past two weeks? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.mental.mood_frequency` (8 banks): How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency` (8 banks): How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?

## New Questions

- None

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.mental.mood_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.mental.anxiety_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Architecture seed only; condition-specific question selection remains outstanding.
- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
