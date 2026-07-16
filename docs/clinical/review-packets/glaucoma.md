# Glaucoma

## Review Metadata

- Canonical ID: `glaucoma`
- Bank ID: `ccm-bank.glaucoma`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 12
- Estimated review time: 15 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| H40 | 319 |
| H42 | 1 |

Total mapped codes: 320

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.vision.sudden_change` | Have you had a sudden loss of vision or a new dark curtain over your vision? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for an urgent vision change. |
| 30 | `ccm.vision.daily_tasks` | Is vision loss making any daily activity unsafe? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Assesses functional and safety impact of visual impairment. |
| 40 | `ccm.vision.treatment_barrier` | Is anything preventing you from following your eye-care plan? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies treatment and appointment barriers without assuming a specific therapy. |
| 50 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.vision.sudden_change` (3 banks): Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks` (3 banks): Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier` (3 banks): Is anything preventing you from following your eye-care plan?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.transportation.barrier` (8 banks): Has transportation caused you to miss or delay health care or medication pickup?

## New Questions

- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?

## Red-Flag Questions

- `ccm.vision.sudden_change` (urgent): Have you had a sudden loss of vision or a new dark curtain over your vision?

## Variants

### Severe glaucoma (`severe`)

- Activation: clinical_content_group
- Clinical content groups: glaucoma__angle_closure_severe, glaucoma__general_severe, glaucoma__open_angle_severe

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1110 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1120 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 1130 | `ccm.transportation.barrier` | Has transportation caused you to miss or delay health care or medication pickup? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.vision.sudden_change`: Screens for an urgent vision change.
- `ccm.vision.daily_tasks`: Assesses functional and safety impact of visual impairment.
- `ccm.vision.treatment_barrier`: Identifies treatment and appointment barriers without assuming a specific therapy.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Small preset; confirm it is sufficient for the clinic's patient mix.
- Clinician must approve local escalation thresholds and notification timing.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
