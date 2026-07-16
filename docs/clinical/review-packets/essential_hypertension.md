# Essential Hypertension

## Review Metadata

- Canonical ID: `essential_hypertension`
- Bank ID: `ccm-bank.essential_hypertension`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 20
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| I10 | 1 |

Total mapped codes: 1

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.bp.latest_systolic` | What was your most recent systolic blood pressure reading? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 11 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.bp.monitoring_barrier` | Is anything preventing you from checking blood pressure as directed? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 1 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 60 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | optional | no | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 70 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.bp.latest_systolic` (11 banks): What was your most recent systolic blood pressure reading?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.bp.monitoring_barrier`: Is anything preventing you from checking blood pressure as directed?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.bp.monitoring_barrier`: Is anything preventing you from checking blood pressure as directed?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.bp.latest_systolic`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.bp.monitoring_barrier`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
