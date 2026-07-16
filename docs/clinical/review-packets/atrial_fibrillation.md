# Atrial Fibrillation

## Review Metadata

- Canonical ID: `atrial_fibrillation`
- Bank ID: `ccm-bank.atrial_fibrillation`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 2
- Estimated review time: 13 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| I48 | 13 |

Total mapped codes: 13

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.endocrine.heart_racing` | Have you had new episodes of a racing or irregular heartbeat? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for a potentially important rhythm symptom. |
| 30 | `ccm.cardiac.fainting` | Have you fainted or nearly fainted since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for hemodynamic or rhythm-related instability. |
| 40 | `ccm.anticoag.bleeding` | If you use a blood thinner, have you had unusual bleeding or large unexplained bruises? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for anticoagulant harm without assuming use. |
| 50 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 70 | `ccm.bp.latest_systolic` | What was your most recent systolic blood pressure reading? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 11 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | optional | no | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.endocrine.heart_racing` (2 banks): Have you had new episodes of a racing or irregular heartbeat?
- `ccm.cardiac.fainting` (3 banks): Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding` (3 banks): If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.bp.latest_systolic` (11 banks): What was your most recent systolic blood pressure reading?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.endocrine.heart_racing`: Have you had new episodes of a racing or irregular heartbeat?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.endocrine.heart_racing` (same_day): Have you had new episodes of a racing or irregular heartbeat?
- `ccm.cardiac.fainting` (same_day): Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding` (same_day): If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.endocrine.heart_racing`: Screens for a potentially important rhythm symptom.
- `ccm.cardiac.fainting`: Screens for hemodynamic or rhythm-related instability.
- `ccm.anticoag.bleeding`: Screens for anticoagulant harm without assuming use.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.bp.latest_systolic`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
