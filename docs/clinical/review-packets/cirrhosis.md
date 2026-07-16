# Cirrhosis

## Review Metadata

- Canonical ID: `cirrhosis`
- Bank ID: `ccm-bank.cirrhosis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 31
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| K74 | 13 |

Total mapped codes: 13

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.liver.abdominal_swelling` | Has your abdomen become more swollen? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Screens for increasing ascites burden. |
| 70 | `ccm.liver.confusion` | Have you or someone close to you noticed new confusion or unusual sleepiness? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for possible hepatic encephalopathy or other acute change. |
| 80 | `ccm.liver.bleeding_red_flag` | Have you vomited blood or passed black, tar-like stool? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for possible gastrointestinal bleeding requiring urgent evaluation. |
| 90 | `ccm.liver.jaundice_change` | Have your eyes or skin become more yellow? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Tracks visible change that may reflect worsening liver dysfunction. |
| 100 | `ccm.liver.appetite_weight` | Have poor appetite or unplanned weight loss made eating enough difficult? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies nutrition risk needing care-plan follow-up. |
| 110 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 130 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.liver.bleeding_red_flag` (2 banks): Have you vomited blood or passed black, tar-like stool?
- `ccm.liver.appetite_weight` (3 banks): Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.liver.abdominal_swelling`: Has your abdomen become more swollen?
- `ccm.liver.confusion`: Have you or someone close to you noticed new confusion or unusual sleepiness?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.liver.jaundice_change`: Have your eyes or skin become more yellow?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.liver.abdominal_swelling`: Has your abdomen become more swollen?
- `ccm.liver.confusion`: Have you or someone close to you noticed new confusion or unusual sleepiness?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.liver.jaundice_change`: Have your eyes or skin become more yellow?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.liver.abdominal_swelling`: Has your abdomen become more swollen?
- `ccm.liver.confusion`: Have you or someone close to you noticed new confusion or unusual sleepiness?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.liver.jaundice_change`: Have your eyes or skin become more yellow?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.liver.confusion` (same_day): Have you or someone close to you noticed new confusion or unusual sleepiness?
- `ccm.liver.bleeding_red_flag` (urgent): Have you vomited blood or passed black, tar-like stool?
- `ccm.liver.jaundice_change` (same_day): Have your eyes or skin become more yellow?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.liver.abdominal_swelling`: Screens for increasing ascites burden.
- `ccm.liver.confusion`: Screens for possible hepatic encephalopathy or other acute change.
- `ccm.liver.bleeding_red_flag`: Screens for possible gastrointestinal bleeding requiring urgent evaluation.
- `ccm.liver.jaundice_change`: Tracks visible change that may reflect worsening liver dysfunction.
- `ccm.liver.appetite_weight`: Identifies nutrition risk needing care-plan follow-up.
- `ccm.nutrition.food_access`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
