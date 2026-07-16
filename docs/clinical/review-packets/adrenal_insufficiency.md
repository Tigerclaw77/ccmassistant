# Adrenal Insufficiency

## Review Metadata

- Canonical ID: `adrenal_insufficiency`
- Bank ID: `ccm-bank.adrenal_insufficiency`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 51
- Estimated review time: 16 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| E27 | 6 |

Total mapped codes: 6

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.adrenal.missed_steroid` | If you use steroid replacement, have you missed doses or had trouble obtaining it? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies interruption of essential replacement therapy without assuming use. |
| 70 | `ccm.adrenal.sick_day_plan` | Do you need help understanding your sick-day or emergency steroid plan? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies an education or access gap for an established emergency plan. |
| 80 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.adrenal.missed_steroid`: If you use steroid replacement, have you missed doses or had trouble obtaining it?
- `ccm.adrenal.sick_day_plan`: Do you need help understanding your sick-day or emergency steroid plan?
- `ccm.adrenal.vomiting_red_flag`: Are vomiting or severe illness keeping you from taking your adrenal medicine?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.adrenal.missed_steroid`: If you use steroid replacement, have you missed doses or had trouble obtaining it?
- `ccm.adrenal.sick_day_plan`: Do you need help understanding your sick-day or emergency steroid plan?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.adrenal.vomiting_red_flag`: Are vomiting or severe illness keeping you from taking your adrenal medicine?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.adrenal.missed_steroid`: If you use steroid replacement, have you missed doses or had trouble obtaining it?
- `ccm.adrenal.sick_day_plan`: Do you need help understanding your sick-day or emergency steroid plan?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.adrenal.vomiting_red_flag`: Are vomiting or severe illness keeping you from taking your adrenal medicine?

## Red-Flag Questions

- `ccm.adrenal.vomiting_red_flag` (urgent): Are vomiting or severe illness keeping you from taking your adrenal medicine?

## Variants

### Adrenal crisis (`adrenal_crisis`)

- Activation: clinical_content_group
- Clinical content groups: adrenal_insufficiency__adrenal_crisis

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.adrenal.vomiting_red_flag` | Are vomiting or severe illness keeping you from taking your adrenal medicine? | required | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for adrenal-crisis risk during intercurrent illness. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.adrenal.missed_steroid`: Identifies interruption of essential replacement therapy without assuming use.
- `ccm.adrenal.sick_day_plan`: Identifies an education or access gap for an established emergency plan.
- `ccm.nutrition.food_access`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
