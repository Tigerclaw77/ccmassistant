# Hyperthyroidism

## Review Metadata

- Canonical ID: `hyperthyroidism`
- Bank ID: `ccm-bank.hyperthyroidism`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 54
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| E05 | 22 |

Total mapped codes: 22

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.thyroid.lab_due` | Is a thyroid blood test or thyroid follow-up overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Identifies overdue monitoring. |
| 70 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.thyroid.lab_due` (2 banks): Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.endocrine.heart_racing` (2 banks): Have you had new episodes of a racing or irregular heartbeat?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.thyroid.lab_due`: Is a thyroid blood test or thyroid follow-up overdue?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?

## Red-Flag Questions

- `ccm.endocrine.heart_racing` (same_day): Have you had new episodes of a racing or irregular heartbeat?

## Variants

### Thyroid crisis or storm (`crisis_or_storm`)

- Activation: clinical_content_group
- Clinical content groups: hyperthyroidism__thyroid_crisis_or_storm

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.endocrine.heart_racing` | Have you had new episodes of a racing or irregular heartbeat? | required | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for a potentially important rhythm symptom. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.thyroid.lab_due`: Identifies overdue monitoring.
- `ccm.nutrition.food_access`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
