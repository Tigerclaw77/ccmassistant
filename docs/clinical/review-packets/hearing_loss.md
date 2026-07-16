# Hearing Loss

## Review Metadata

- Canonical ID: `hearing_loss`
- Bank ID: `ccm-bank.hearing_loss`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 64
- Estimated review time: 13 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| H90 | 26 |
| H91 | 28 |

Total mapped codes: 54

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.hearing.change` | Has your ability to hear conversations changed since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Tracks functionally meaningful hearing change. |
| 70 | `ccm.hearing.device_issue` | If you use a hearing device, is a device problem limiting its use? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies hearing-device barriers without assuming use. |
| 80 | `ccm.hearing.communication_barrier` | Is hearing difficulty preventing you from understanding health instructions or phone calls? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies a communication-access risk affecting care coordination. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.hearing.change`: Has your ability to hear conversations changed since the last review?
- `ccm.hearing.device_issue`: If you use a hearing device, is a device problem limiting its use?
- `ccm.hearing.communication_barrier`: Is hearing difficulty preventing you from understanding health instructions or phone calls?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.hearing.change`: Has your ability to hear conversations changed since the last review?
- `ccm.hearing.device_issue`: If you use a hearing device, is a device problem limiting its use?
- `ccm.hearing.communication_barrier`: Is hearing difficulty preventing you from understanding health instructions or phone calls?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.hearing.change`: Has your ability to hear conversations changed since the last review?
- `ccm.hearing.device_issue`: If you use a hearing device, is a device problem limiting its use?
- `ccm.hearing.communication_barrier`: Is hearing difficulty preventing you from understanding health instructions or phone calls?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.hearing.change`: Tracks functionally meaningful hearing change.
- `ccm.hearing.device_issue`: Identifies hearing-device barriers without assuming use.
- `ccm.hearing.communication_barrier`: Identifies a communication-access risk affecting care coordination.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
