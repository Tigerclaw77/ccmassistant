# Chronic Gout

## Review Metadata

- Canonical ID: `chronic_gout`
- Bank ID: `ccm-bank.chronic_gout`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 40
- Estimated review time: 17 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M1A | 404 |

Total mapped codes: 404

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.inflammatory.flare_change` | Compared with the last review, how have condition flares changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | no | Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption. |
| 70 | `ccm.inflammatory.swelling` | Have you had new or worsening joint swelling? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies a change in inflammatory joint activity. |
| 80 | `ccm.inflammatory.infection_signs` | Have you had a fever or other infection concern while using immune-suppressing treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for infection concerns when immune-suppressing treatment is actually in use. |
| 90 | `ccm.gout.flare_frequency` | How many gout flares have you had since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Measures recent gout activity using a deterministic frequency range. |
| 100 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.pain.function_interference` | Is pain preventing an important daily activity? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 13 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 130 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change` (5 banks): Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.swelling` (3 banks): Have you had new or worsening joint swelling?
- `ccm.inflammatory.infection_signs` (5 banks): Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.pain.function_interference` (13 banks): Is pain preventing an important daily activity?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.swelling`: Have you had new or worsening joint swelling?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.gout.flare_frequency`: How many gout flares have you had since the last review?
- `ccm.gout.tophus_change`: Have any gout lumps or tophi become larger, painful, or opened?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.swelling`: Have you had new or worsening joint swelling?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.gout.flare_frequency`: How many gout flares have you had since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.gout.tophus_change`: Have any gout lumps or tophi become larger, painful, or opened?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.inflammatory.flare_change`: Compared with the last review, how have condition flares changed?
- `ccm.inflammatory.swelling`: Have you had new or worsening joint swelling?
- `ccm.inflammatory.infection_signs`: Have you had a fever or other infection concern while using immune-suppressing treatment?
- `ccm.gout.flare_frequency`: How many gout flares have you had since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.gout.tophus_change`: Have any gout lumps or tophi become larger, painful, or opened?

## Red-Flag Questions

- `ccm.inflammatory.infection_signs` (same_day): Have you had a fever or other infection concern while using immune-suppressing treatment?

## Variants

### Tophaceous gout (`tophaceous`)

- Activation: clinical_content_group
- Clinical content groups: chronic_gout__with_tophus

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.gout.tophus_change` | Have any gout lumps or tophi become larger, painful, or opened? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Monitors clinically relevant tophus change and skin breakdown. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.inflammatory.flare_change`: Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption.
- `ccm.inflammatory.swelling`: Identifies a change in inflammatory joint activity.
- `ccm.inflammatory.infection_signs`: Screens for infection concerns when immune-suppressing treatment is actually in use.
- `ccm.gout.flare_frequency`: Measures recent gout activity using a deterministic frequency range.
- `ccm.pain.severity`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.function_interference`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
