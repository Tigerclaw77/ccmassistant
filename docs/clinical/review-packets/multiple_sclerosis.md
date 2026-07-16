# Multiple Sclerosis

## Review Metadata

- Canonical ID: `multiple_sclerosis`
- Bank ID: `ccm-bank.multiple_sclerosis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 77
- Estimated review time: 14 minutes
- Medicare relevance: RARE

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| G35 | 11 |

Total mapped codes: 11

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.neuro.new_weakness` | Have you developed new or worsening weakness in an arm or leg? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 12 | yes | Screens for neurologic progression that may require prompt clinical assessment. |
| 50 | `ccm.neuro.balance_change` | Has your balance become worse since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 10 | no | Detects neurologic functional decline and increased fall risk. |
| 60 | `ccm.neuro.swallow_breathe` | Have swallowing or breathing become newly difficult because of muscle weakness? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for bulbar or respiratory decline in neuromuscular disease. |
| 70 | `ccm.neuro.assistive_device` | Do you need a mobility or communication device repaired or replaced? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | no | Identifies equipment needs that affect safety and independence. |
| 80 | `ccm.neuro.transfer_change` | Has getting in or out of bed, a chair, or a vehicle become harder? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | no | Tracks functional decline relevant to caregiver and therapy planning. |
| 90 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.neuro.new_weakness` (12 banks): Have you developed new or worsening weakness in an arm or leg?
- `ccm.neuro.balance_change` (10 banks): Has your balance become worse since the last review?
- `ccm.neuro.swallow_breathe` (5 banks): Have swallowing or breathing become newly difficult because of muscle weakness?
- `ccm.neuro.assistive_device` (5 banks): Do you need a mobility or communication device repaired or replaced?
- `ccm.neuro.transfer_change` (5 banks): Has getting in or out of bed, a chair, or a vehicle become harder?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.neuro.swallow_breathe`: Have swallowing or breathing become newly difficult because of muscle weakness?
- `ccm.neuro.assistive_device`: Do you need a mobility or communication device repaired or replaced?
- `ccm.neuro.transfer_change`: Has getting in or out of bed, a chair, or a vehicle become harder?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.neuro.swallow_breathe`: Have swallowing or breathing become newly difficult because of muscle weakness?
- `ccm.neuro.assistive_device`: Do you need a mobility or communication device repaired or replaced?
- `ccm.neuro.transfer_change`: Has getting in or out of bed, a chair, or a vehicle become harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.neuro.swallow_breathe`: Have swallowing or breathing become newly difficult because of muscle weakness?
- `ccm.neuro.assistive_device`: Do you need a mobility or communication device repaired or replaced?
- `ccm.neuro.transfer_change`: Has getting in or out of bed, a chair, or a vehicle become harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.neuro.new_weakness` (same_day): Have you developed new or worsening weakness in an arm or leg?
- `ccm.neuro.swallow_breathe` (urgent): Have swallowing or breathing become newly difficult because of muscle weakness?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.neuro.new_weakness`: Screens for neurologic progression that may require prompt clinical assessment.
- `ccm.neuro.balance_change`: Detects neurologic functional decline and increased fall risk.
- `ccm.neuro.swallow_breathe`: Screens for bulbar or respiratory decline in neuromuscular disease.
- `ccm.neuro.assistive_device`: Identifies equipment needs that affect safety and independence.
- `ccm.neuro.transfer_change`: Tracks functional decline relevant to caregiver and therapy planning.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
