# Chronic Back Pain

## Review Metadata

- Canonical ID: `chronic_back_pain`
- Bank ID: `ccm-bank.chronic_back_pain`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 1
- Estimated review time: 14 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M54 | 1 |

Total mapped codes: 1

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.pain.function_interference` | Is pain preventing an important daily activity? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 13 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.neuro.new_weakness` | Have you developed new or worsening weakness in an arm or leg? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 12 | yes | Screens for neurologic progression that may require prompt clinical assessment. |
| 50 | `ccm.spine.bowel_bladder_change` | Have you had a new loss of bowel or bladder control? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Screens for possible severe neural compression requiring urgent evaluation. |
| 60 | `ccm.spine.saddle_numbness` | Have you had new numbness around the groin, buttocks, or inner thighs? | optional | no | intake, monthly_checkin, care_plan_review | yes | 7 | yes | Adds a focused follow-up for possible cauda equina or severe cord compression. |
| 70 | `ccm.spine.therapy_progress` | Are you currently doing prescribed exercises or physical therapy for your spine condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 7 | no | Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed. |
| 80 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 100 | `ccm.falls.had_fall` | Have you fallen since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.spine.procedure_planned` | Is an injection, imaging study, or spine consultation pending? | optional | no | intake, monthly_checkin, care_plan_review | yes | 7 | no | Identifies time-sensitive coordination needs for planned diagnostic or procedural care. |
| 120 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.pain.function_interference` (13 banks): Is pain preventing an important daily activity?
- `ccm.neuro.new_weakness` (12 banks): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (7 banks): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (7 banks): Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress` (7 banks): Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.spine.procedure_planned` (7 banks): Is an injection, imaging study, or spine consultation pending?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.neuro.new_weakness`: Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change`: Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness`: Have you had new numbness around the groin, buttocks, or inner thighs?
- `ccm.spine.therapy_progress`: Are you currently doing prescribed exercises or physical therapy for your spine condition?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.spine.procedure_planned`: Is an injection, imaging study, or spine consultation pending?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.neuro.new_weakness` (same_day): Have you developed new or worsening weakness in an arm or leg?
- `ccm.spine.bowel_bladder_change` (urgent): Have you had a new loss of bowel or bladder control?
- `ccm.spine.saddle_numbness` (urgent): Have you had new numbness around the groin, buttocks, or inner thighs?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.severity`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.function_interference`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.neuro.new_weakness`: Screens for neurologic progression that may require prompt clinical assessment.
- `ccm.spine.bowel_bladder_change`: Screens for possible severe neural compression requiring urgent evaluation.
- `ccm.spine.saddle_numbness`: Adds a focused follow-up for possible cauda equina or severe cord compression.
- `ccm.spine.therapy_progress`: Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.spine.procedure_planned`: Identifies time-sensitive coordination needs for planned diagnostic or procedural care.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
- Existing canonical audit reuse/merge concern (HIGH): Consider one chronic-pain canonical core with back-pain and neoplasm-related variants; preserve site-specific functional modules where needed.
