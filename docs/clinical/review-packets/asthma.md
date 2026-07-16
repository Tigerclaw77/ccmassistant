# Asthma

## Review Metadata

- Canonical ID: `asthma`
- Bank ID: `ccm-bank.asthma`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 62
- Estimated review time: 13 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| J45 | 26 |

Total mapped codes: 26

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.symptom.shortness_of_breath` | Are you having shortness of breath? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 9 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.asthma.rescue_frequency` | How many days in the past week did asthma symptoms require rescue medication? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 1 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.pulmonary.urgent_breathing` | Are you short of breath at rest or unable to speak comfortably because of breathing difficulty? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for severe respiratory compromise. |
| 50 | `ccm.pulmonary.flare_treatment` | Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Captures exacerbation treatment and potential medication reconciliation needs. |
| 60 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 80 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.symptom.shortness_of_breath` (9 banks): Are you having shortness of breath?
- `ccm.pulmonary.urgent_breathing` (5 banks): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment` (4 banks): Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.asthma.rescue_frequency`: How many days in the past week did asthma symptoms require rescue medication?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.asthma.rescue_frequency`: How many days in the past week did asthma symptoms require rescue medication?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.pulmonary.urgent_breathing` (urgent): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.symptom.shortness_of_breath`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.asthma.rescue_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pulmonary.urgent_breathing`: Screens for severe respiratory compromise.
- `ccm.pulmonary.flare_treatment`: Captures exacerbation treatment and potential medication reconciliation needs.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
