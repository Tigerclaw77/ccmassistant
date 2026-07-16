# Sleep Apnea

## Review Metadata

- Canonical ID: `sleep_apnea`
- Bank ID: `ccm-bank.sleep_apnea`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 21
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| G47 | 10 |

Total mapped codes: 10

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.osa.device_use` | If you use a sleep-apnea device, have you been able to use it on most nights? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Assesses adherence without assuming device use. |
| 30 | `ccm.osa.device_barrier` | Is a device or supply problem limiting your sleep-apnea treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies common treatment barriers. |
| 40 | `ccm.sleep.daytime_impact` | Is poor sleep making daytime activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Assesses functional impact of sleep disturbance. |
| 50 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.sleep.daytime_impact` (3 banks): Is poor sleep making daytime activities harder?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.osa.device_use`: If you use a sleep-apnea device, have you been able to use it on most nights?
- `ccm.osa.device_barrier`: Is a device or supply problem limiting your sleep-apnea treatment?
- `ccm.sleep.daytime_impact`: Is poor sleep making daytime activities harder?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.osa.device_use`: If you use a sleep-apnea device, have you been able to use it on most nights?
- `ccm.osa.device_barrier`: Is a device or supply problem limiting your sleep-apnea treatment?
- `ccm.sleep.daytime_impact`: Is poor sleep making daytime activities harder?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.osa.device_use`: If you use a sleep-apnea device, have you been able to use it on most nights?
- `ccm.osa.device_barrier`: Is a device or supply problem limiting your sleep-apnea treatment?
- `ccm.sleep.daytime_impact`: Is poor sleep making daytime activities harder?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.osa.device_use`: Assesses adherence without assuming device use.
- `ccm.osa.device_barrier`: Identifies common treatment barriers.
- `ccm.sleep.daytime_impact`: Assesses functional impact of sleep disturbance.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
