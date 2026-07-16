# Major Depressive Disorder

## Review Metadata

- Canonical ID: `major_depressive_disorder`
- Bank ID: `ccm-bank.major_depressive_disorder`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 11
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| F32 | 12 |
| F33 | 11 |

Total mapped codes: 23

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.mental.mood_frequency` | How often have you felt down, depressed, or hopeless in the past two weeks? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.mental.safety_thoughts` | Have you had thoughts of harming yourself or that you would be better off dead? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for an urgent behavioral-health safety concern. |
| 40 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.mental.mood_frequency` (8 banks): How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.safety_thoughts` (2 banks): Have you had thoughts of harming yourself or that you would be better off dead?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.mental.safety_thoughts`: Have you had thoughts of harming yourself or that you would be better off dead?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.safety_thoughts`: Have you had thoughts of harming yourself or that you would be better off dead?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.safety_thoughts`: Have you had thoughts of harming yourself or that you would be better off dead?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.mental.safety_thoughts` (urgent): Have you had thoughts of harming yourself or that you would be better off dead?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.mental.mood_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.mental.safety_thoughts`: Screens for an urgent behavioral-health safety concern.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
