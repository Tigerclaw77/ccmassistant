# Lumbar Spinal Stenosis

## Review Metadata

- Canonical ID: `lumbar_spinal_stenosis`
- Bank ID: `ccm-bank.lumbar_spinal_stenosis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 32
- Estimated review time: 17 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M48 | 2 |

Total mapped codes: 2

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.spine.walking_tolerance` | Compared with the last review, how has the distance you can walk before symptoms start changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Tracks neurogenic claudication and functional change using a repeatable patient-reported measure. |
| 30 | `ccm.spine.leg_symptoms_standing` | Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies posture- and activity-related lower-extremity symptoms characteristic of lumbar nerve compression. |
| 40 | `ccm.neuro.new_weakness` | Have you developed new or worsening weakness in an arm or leg? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 12 | yes | Screens for neurologic progression that may require prompt clinical assessment. |
| 50 | `ccm.spine.bowel_bladder_change` | Have you had a new loss of bowel or bladder control? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Screens for possible severe neural compression requiring urgent evaluation. |
| 60 | `ccm.spine.saddle_numbness` | Have you had new numbness around the groin, buttocks, or inner thighs? | optional | no | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Adds a focused follow-up for possible cauda equina or severe cord compression. |
| 70 | `ccm.spine.therapy_progress` | Are you currently doing prescribed exercises or physical therapy for your spine condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | no | Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed. |
| 80 | `ccm.pain.function_interference` | Is pain preventing an important daily activity? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 13 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.spine.procedure_planned` | Is an injection, imaging study, or spine consultation pending? | optional | no | intake, monthly_checkin, care_plan_review | yes | 7 | no | Identifies time-sensitive coordination needs for planned diagnostic or procedural care. |
| 120 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.spine.walking_tolerance` (3 banks): Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing` (3 banks): Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness` (12 banks): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (7 banks): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (7 banks): Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress` (7 banks): Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.pain.function_interference` (13 banks): Is pain preventing an important daily activity?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.spine.procedure_planned` (7 banks): Is an injection, imaging study, or spine consultation pending?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.spine.relief_with_flexion`: Do your leg symptoms improve when you sit or bend forward?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.spine.relief_with_flexion`: Do your leg symptoms improve when you sit or bend forward?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.spine.walking_tolerance`: Compared with the last review, how has the distance you can walk before symptoms start changed?
- `ccm.spine.leg_symptoms_standing`: Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.spine.relief_with_flexion`: Do your leg symptoms improve when you sit or bend forward?

## Red-Flag Questions

- `ccm.neuro.new_weakness` (same_day): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (urgent): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (urgent): Have you had new numbness around the groin, buttocks, or inner thighs?

## Variants

### Neurogenic claudication (`neurogenic_claudication`)

- Activation: clinical_content_group
- Clinical content groups: lumbar_spinal_stenosis__neurogenic_claudication

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.spine.relief_with_flexion` | Do your leg symptoms improve when you sit or bend forward? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Distinguishes the flexion-relieved pattern associated with neurogenic claudication. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.spine.walking_tolerance`: Tracks neurogenic claudication and functional change using a repeatable patient-reported measure.
- `ccm.spine.leg_symptoms_standing`: Identifies posture- and activity-related lower-extremity symptoms characteristic of lumbar nerve compression.
- `ccm.neuro.new_weakness`: Screens for neurologic progression that may require prompt clinical assessment.
- `ccm.spine.bowel_bladder_change`: Screens for possible severe neural compression requiring urgent evaluation.
- `ccm.spine.saddle_numbness`: Adds a focused follow-up for possible cauda equina or severe cord compression.
- `ccm.spine.therapy_progress`: Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed.
- `ccm.pain.function_interference`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.spine.procedure_planned`: Identifies time-sensitive coordination needs for planned diagnostic or procedural care.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
