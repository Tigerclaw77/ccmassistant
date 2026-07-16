# Psoriasis

## Review Metadata

- Canonical ID: `psoriasis`
- Bank ID: `ccm-bank.psoriasis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 58
- Estimated review time: 13 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| L40 | 15 |

Total mapped codes: 15

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.inflammatory.flare_change` | Compared with the last review, how have condition flares changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | no | Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption. |
| 70 | `ccm.inflammatory.infection_signs` | Have you had a fever or other infection concern while using immune-suppressing treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for infection concerns when immune-suppressing treatment is actually in use. |
| 80 | `ccm.psoriasis.skin_change` | Have your psoriasis patches become more widespread or uncomfortable? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks skin disease burden in patient-appropriate language. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change` (5 banks): Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs` (5 banks): Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.psoriasis.skin_change`: Have your psoriasis patches become more widespread or uncomfortable?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.psoriasis.skin_change`: Have your psoriasis patches become more widespread or uncomfortable?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.psoriasis.skin_change`: Have your psoriasis patches become more widespread or uncomfortable?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.inflammatory.infection_signs` (same_day): Have you had a fever or other infection concern while using immune-suppressing treatment?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.inflammatory.flare_change`: Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption.
- `ccm.inflammatory.infection_signs`: Screens for infection concerns when immune-suppressing treatment is actually in use.
- `ccm.psoriasis.skin_change`: Tracks skin disease burden in patient-appropriate language.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
