# Lumbar Radiculopathy

## Review Metadata

- Canonical ID: `lumbar_radiculopathy`
- Bank ID: `ccm-bank.lumbar_radiculopathy`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 28
- Estimated review time: 17 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M54 | 2 |

Total mapped codes: 2

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.spine.walking_tolerance` | Compared with the last review, how has the distance you can walk before symptoms start changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Tracks neurogenic claudication and functional change using a repeatable patient-reported measure. |
| 70 | `ccm.spine.leg_symptoms_standing` | Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies posture- and activity-related lower-extremity symptoms characteristic of lumbar nerve compression. |
| 80 | `ccm.neuro.new_weakness` | Have you developed new or worsening weakness in an arm or leg? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 12 | yes | Screens for neurologic progression that may require prompt clinical assessment. |
| 90 | `ccm.spine.bowel_bladder_change` | Have you had a new loss of bowel or bladder control? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Screens for possible severe neural compression requiring urgent evaluation. |
| 100 | `ccm.spine.saddle_numbness` | Have you had new numbness around the groin, buttocks, or inner thighs? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Adds a focused follow-up for possible cauda equina or severe cord compression. |
| 110 | `ccm.spine.radiating_pain_change` | How has pain traveling into an arm or leg changed since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Tracks radicular symptom trajectory separately from general pain severity. |
| 120 | `ccm.spine.therapy_progress` | Are you currently doing prescribed exercises or physical therapy for your spine condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | no | Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed. |
| 130 | `ccm.spine.procedure_planned` | Is an injection, imaging study, or spine consultation pending? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | no | Identifies time-sensitive coordination needs for planned diagnostic or procedural care. |
| 140 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 150 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 160 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 170 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.spine.walking_tolerance` (3 banks): Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing` (3 banks): Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness` (12 banks): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (7 banks): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (7 banks): Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.radiating_pain_change` (4 banks): How has pain traveling into an arm or leg changed since the last review?
- `ccm.spine.therapy_progress` (7 banks): Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.spine.procedure_planned` (7 banks): Is an injection, imaging study, or spine consultation pending?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.radiating_pain_change`: How has pain traveling into an arm or leg changed since the last review?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.radiating_pain_change`: How has pain traveling into an arm or leg changed since the last review?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.radiating_pain_change`: How has pain traveling into an arm or leg changed since the last review?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.sleep.quality`: How would you rate your sleep quality?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.neuro.new_weakness` (same_day): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (urgent): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (urgent): Have you had new numbness around the groin, buttocks, or inner thighs?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.spine.walking_tolerance`: Tracks neurogenic claudication and functional change using a repeatable patient-reported measure.
- `ccm.spine.leg_symptoms_standing`: Identifies posture- and activity-related lower-extremity symptoms characteristic of lumbar nerve compression.
- `ccm.neuro.new_weakness`: Screens for neurologic progression that may require prompt clinical assessment.
- `ccm.spine.bowel_bladder_change`: Screens for possible severe neural compression requiring urgent evaluation.
- `ccm.spine.saddle_numbness`: Adds a focused follow-up for possible cauda equina or severe cord compression.
- `ccm.spine.radiating_pain_change`: Tracks radicular symptom trajectory separately from general pain severity.
- `ccm.spine.therapy_progress`: Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed.
- `ccm.spine.procedure_planned`: Identifies time-sensitive coordination needs for planned diagnostic or procedural care.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
