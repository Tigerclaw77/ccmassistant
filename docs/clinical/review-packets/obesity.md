# Obesity

## Review Metadata

- Canonical ID: `obesity`
- Bank ID: `ccm-bank.obesity`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 23
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| E66 | 14 |

Total mapped codes: 14

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.weight.plan_barrier` | Is there a barrier making the agreed weight-management plan hard to follow? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies plan feasibility without stigmatizing language or prescribing a goal. |
| 30 | `ccm.goal.progress` | How is progress toward your current care-plan goal? | recommended | yes | monthly_checkin, care_plan_review, annual_review | no | 2 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.goal.progress` (2 banks): How is progress toward your current care-plan goal?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.weight.plan_barrier`: Is there a barrier making the agreed weight-management plan hard to follow?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.weight.plan_barrier`: Is there a barrier making the agreed weight-management plan hard to follow?
- `ccm.goal.progress`: How is progress toward your current care-plan goal?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.weight.plan_barrier`: Is there a barrier making the agreed weight-management plan hard to follow?
- `ccm.goal.progress`: How is progress toward your current care-plan goal?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.weight.plan_barrier`: Identifies plan feasibility without stigmatizing language or prescribing a goal.
- `ccm.goal.progress`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.nutrition.food_access`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Small preset; confirm it is sufficient for the clinic's patient mix.
- Keep wording weight-neutral and align goals with the patient's agreed plan.
