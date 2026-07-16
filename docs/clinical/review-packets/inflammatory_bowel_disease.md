# Inflammatory Bowel Disease

## Review Metadata

- Canonical ID: `inflammatory_bowel_disease`
- Bank ID: `ccm-bank.inflammatory_bowel_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 42
- Estimated review time: 13 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| K50 | 37 |
| K51 | 64 |

Total mapped codes: 101

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.inflammatory.flare_change` | Compared with the last review, how have condition flares changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | no | Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption. |
| 50 | `ccm.inflammatory.infection_signs` | Have you had a fever or other infection concern while using immune-suppressing treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for infection concerns when immune-suppressing treatment is actually in use. |
| 60 | `ccm.liver.appetite_weight` | Have poor appetite or unplanned weight loss made eating enough difficult? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies nutrition risk needing care-plan follow-up. |
| 70 | `ccm.ibd.stool_change` | Have bowel movements become more frequent or contained blood? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Tracks a potentially important change in inflammatory bowel disease. |
| 80 | `ccm.nutrition.food_access` | Have you worried about having enough food or the right food for your care plan? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.inflammatory.flare_change` (5 banks): Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs` (5 banks): Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.liver.appetite_weight` (3 banks): Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.nutrition.food_access` (8 banks): Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.ibd.stool_change`: Have bowel movements become more frequent or contained blood?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.ibd.stool_change`: Have bowel movements become more frequent or contained blood?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.liver.appetite_weight`: Have poor appetite or unplanned weight loss made eating enough difficult?
- `ccm.ibd.stool_change`: Have bowel movements become more frequent or contained blood?
- `ccm.nutrition.food_access`: Have you worried about having enough food or the right food for your care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.inflammatory.infection_signs` (same_day): Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.ibd.stool_change` (same_day): Have bowel movements become more frequent or contained blood?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.inflammatory.flare_change`: Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption.
- `ccm.inflammatory.infection_signs`: Screens for infection concerns when immune-suppressing treatment is actually in use.
- `ccm.liver.appetite_weight`: Identifies nutrition risk needing care-plan follow-up.
- `ccm.ibd.stool_change`: Tracks a potentially important change in inflammatory bowel disease.
- `ccm.nutrition.food_access`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
