# Osteoarthritis

## Review Metadata

- Canonical ID: `osteoarthritis`
- Bank ID: `ccm-bank.osteoarthritis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 16
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M15 | 8 |
| M16 | 19 |
| M17 | 14 |
| M18 | 17 |
| M19 | 72 |

Total mapped codes: 130

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.pain.function_interference` | Is pain preventing an important daily activity? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 13 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.arthritis.stiffness_change` | Has joint stiffness made daily movement harder since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Tracks functional burden from stiffness. |
| 50 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 80 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.pain.function_interference` (13 banks): Is pain preventing an important daily activity?
- `ccm.arthritis.stiffness_change` (2 banks): Has joint stiffness made daily movement harder since the last review?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.arthritis.stiffness_change`: Has joint stiffness made daily movement harder since the last review?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.arthritis.stiffness_change`: Has joint stiffness made daily movement harder since the last review?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.pain.function_interference`: Is pain preventing an important daily activity?
- `ccm.arthritis.stiffness_change`: Has joint stiffness made daily movement harder since the last review?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.severity`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pain.function_interference`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.arthritis.stiffness_change`: Tracks functional burden from stiffness.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Existing canonical audit split concern (MEDIUM): Laterality should remain collapsed, but weight-bearing versus upper-extremity disease may need different function and fall-risk modules.
