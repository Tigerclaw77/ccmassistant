# Peripheral Neuropathy

## Review Metadata

- Canonical ID: `peripheral_neuropathy`
- Bank ID: `ccm-bank.peripheral_neuropathy`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 8
- Estimated review time: 13 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| G62 | 9 |

Total mapped codes: 9

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.neuropathy.sensation_change` | Has numbness, burning, or tingling in your hands or feet worsened? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks sensory neuropathy change. |
| 30 | `ccm.neuro.balance_change` | Has your balance become worse since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 10 | no | Detects neurologic functional decline and increased fall risk. |
| 40 | `ccm.vascular.foot_wound` | Do you have a foot or leg sore that is new or not healing? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Identifies skin breakdown with vascular, diabetes-related, or sensory-loss healing risk. |
| 50 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 90 | `ccm.sleep.quality` | How would you rate your sleep quality? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.neuro.balance_change` (10 banks): Has your balance become worse since the last review?
- `ccm.vascular.foot_wound` (3 banks): Do you have a foot or leg sore that is new or not healing?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.neuropathy.sensation_change`: Has numbness, burning, or tingling in your hands or feet worsened?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.neuropathy.sensation_change`: Has numbness, burning, or tingling in your hands or feet worsened?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.neuropathy.sensation_change`: Has numbness, burning, or tingling in your hands or feet worsened?
- `ccm.neuro.balance_change`: Has your balance become worse since the last review?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.vascular.foot_wound` (same_day): Do you have a foot or leg sore that is new or not healing?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.neuropathy.sensation_change`: Tracks sensory neuropathy change.
- `ccm.neuro.balance_change`: Detects neurologic functional decline and increased fall risk.
- `ccm.vascular.foot_wound`: Identifies skin breakdown with vascular, diabetes-related, or sensory-loss healing risk.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- Existing canonical audit reuse/merge concern (MEDIUM): Keep neuropathy independently selectable while reusing a complication module for diabetic neuropathy.
