# Visual Impairment

## Review Metadata

- Canonical ID: `visual_impairment`
- Bank ID: `ccm-bank.visual_impairment`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 49
- Estimated review time: 14 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| H54 | 76 |

Total mapped codes: 76

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.vision.sudden_change` | Have you had a sudden loss of vision or a new dark curtain over your vision? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for an urgent vision change. |
| 70 | `ccm.vision.daily_tasks` | Is vision loss making any daily activity unsafe? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Assesses functional and safety impact of visual impairment. |
| 80 | `ccm.vision.treatment_barrier` | Is anything preventing you from following your eye-care plan? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies treatment and appointment barriers without assuming a specific therapy. |
| 90 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.transportation.barrier` | Has transportation caused you to miss or delay health care or medication pickup? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.vision.sudden_change` (3 banks): Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks` (3 banks): Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier` (3 banks): Is anything preventing you from following your eye-care plan?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.transportation.barrier` (8 banks): Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.vision.sudden_change`: Have you had a sudden loss of vision or a new dark curtain over your vision?
- `ccm.vision.daily_tasks`: Is vision loss making any daily activity unsafe?
- `ccm.vision.treatment_barrier`: Is anything preventing you from following your eye-care plan?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.transportation.barrier`: Has transportation caused you to miss or delay health care or medication pickup?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.vision.sudden_change` (urgent): Have you had a sudden loss of vision or a new dark curtain over your vision?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.vision.sudden_change`: Screens for an urgent vision change.
- `ccm.vision.daily_tasks`: Assesses functional and safety impact of visual impairment.
- `ccm.vision.treatment_barrier`: Identifies treatment and appointment barriers without assuming a specific therapy.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.transportation.barrier`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
