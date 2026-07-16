# Gastroesophageal Reflux Disease

## Review Metadata

- Canonical ID: `gerd`
- Bank ID: `ccm-bank.gerd`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 6
- Estimated review time: 12 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| K21 | 5 |

Total mapped codes: 5

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.gerd.swallowing` | Has food felt stuck when you swallow? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for an alarm symptom needing prompt assessment. |
| 30 | `ccm.liver.bleeding_red_flag` | Have you vomited blood or passed black, tar-like stool? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for possible gastrointestinal bleeding requiring urgent evaluation. |
| 40 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 60 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.liver.bleeding_red_flag` (2 banks): Have you vomited blood or passed black, tar-like stool?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.gerd.swallowing`: Has food felt stuck when you swallow?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.gerd.swallowing`: Has food felt stuck when you swallow?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.gerd.swallowing`: Has food felt stuck when you swallow?
- `ccm.liver.bleeding_red_flag`: Have you vomited blood or passed black, tar-like stool?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.gerd.swallowing` (same_day): Has food felt stuck when you swallow?
- `ccm.liver.bleeding_red_flag` (urgent): Have you vomited blood or passed black, tar-like stool?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.gerd.swallowing`: Screens for an alarm symptom needing prompt assessment.
- `ccm.liver.bleeding_red_flag`: Screens for possible gastrointestinal bleeding requiring urgent evaluation.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
