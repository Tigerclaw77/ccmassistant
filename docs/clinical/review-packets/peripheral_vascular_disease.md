# Peripheral Vascular Disease

## Review Metadata

- Canonical ID: `peripheral_vascular_disease`
- Bank ID: `ccm-bank.peripheral_vascular_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 3
- Estimated review time: 13 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| I70 | 296 |
| I73 | 9 |

Total mapped codes: 305

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.vascular.walking_leg_pain` | Do leg symptoms make you stop when walking and improve with rest? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Screens for activity-related claudication burden. |
| 30 | `ccm.vascular.rest_pain` | Do you have foot or leg pain while resting, especially at night? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for possible advanced limb ischemia. |
| 40 | `ccm.vascular.foot_wound` | Do you have a foot or leg sore that is new or not healing? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Identifies skin breakdown with vascular, diabetes-related, or sensory-loss healing risk. |
| 50 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 70 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.falls.had_fall` | Have you fallen since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.vascular.foot_wound` (3 banks): Do you have a foot or leg sore that is new or not healing?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.vascular.walking_leg_pain`: Do leg symptoms make you stop when walking and improve with rest?
- `ccm.vascular.rest_pain`: Do you have foot or leg pain while resting, especially at night?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.vascular.walking_leg_pain`: Do leg symptoms make you stop when walking and improve with rest?
- `ccm.vascular.rest_pain`: Do you have foot or leg pain while resting, especially at night?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.vascular.walking_leg_pain`: Do leg symptoms make you stop when walking and improve with rest?
- `ccm.vascular.rest_pain`: Do you have foot or leg pain while resting, especially at night?
- `ccm.vascular.foot_wound`: Do you have a foot or leg sore that is new or not healing?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.vascular.rest_pain` (same_day): Do you have foot or leg pain while resting, especially at night?
- `ccm.vascular.foot_wound` (same_day): Do you have a foot or leg sore that is new or not healing?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.vascular.walking_leg_pain`: Screens for activity-related claudication burden.
- `ccm.vascular.rest_pain`: Screens for possible advanced limb ischemia.
- `ccm.vascular.foot_wound`: Identifies skin breakdown with vascular, diabetes-related, or sensory-loss healing risk.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- Existing canonical audit split concern (HIGH): Split general content by uncomplicated disease, ulceration, gangrene, and revascularization/amputation burden; laterality alone should still collapse.
