# Parkinson Disease

## Review Metadata

- Canonical ID: `parkinson_disease`
- Bank ID: `ccm-bank.parkinson_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 61
- Estimated review time: 13 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| G20 | 8 |

Total mapped codes: 8

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.parkinson.mobility_change` | Compared with the last review, how has your walking changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks Parkinson-related mobility change with low cognitive load. |
| 30 | `ccm.parkinson.wearing_off` | If you use Parkinson medicine, does its benefit wear off before the next dose? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies a treatment-timing problem without assuming a particular medicine. |
| 40 | `ccm.parkinson.swallowing` | Have you had new trouble swallowing food or drinks? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for swallowing decline that may increase aspiration and nutrition risk. |
| 50 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.parkinson.mobility_change`: Compared with the last review, how has your walking changed?
- `ccm.parkinson.wearing_off`: If you use Parkinson medicine, does its benefit wear off before the next dose?
- `ccm.parkinson.swallowing`: Have you had new trouble swallowing food or drinks?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.parkinson.mobility_change`: Compared with the last review, how has your walking changed?
- `ccm.parkinson.wearing_off`: If you use Parkinson medicine, does its benefit wear off before the next dose?
- `ccm.parkinson.swallowing`: Have you had new trouble swallowing food or drinks?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.parkinson.mobility_change`: Compared with the last review, how has your walking changed?
- `ccm.parkinson.wearing_off`: If you use Parkinson medicine, does its benefit wear off before the next dose?
- `ccm.parkinson.swallowing`: Have you had new trouble swallowing food or drinks?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.parkinson.swallowing` (same_day): Have you had new trouble swallowing food or drinks?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.parkinson.mobility_change`: Tracks Parkinson-related mobility change with low cognitive load.
- `ccm.parkinson.wearing_off`: Identifies a treatment-timing problem without assuming a particular medicine.
- `ccm.parkinson.swallowing`: Screens for swallowing decline that may increase aspiration and nutrition risk.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
