# COPD

## Review Metadata

- Canonical ID: `copd`
- Bank ID: `ccm-bank.copd`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 10
- Estimated review time: 14 minutes
- Medicare relevance: COMMON

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| J43 | 6 |
| J44 | 7 |

Total mapped codes: 13

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.pulmonary.breathing_change` | Compared with the last review, how has your breathing during usual activity changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Tracks respiratory trajectory during ordinary activity. |
| 30 | `ccm.pulmonary.cough_sputum_change` | Has your cough or mucus changed from your usual pattern? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Detects a change that may indicate pulmonary exacerbation or infection. |
| 40 | `ccm.pulmonary.urgent_breathing` | Are you short of breath at rest or unable to speak comfortably because of breathing difficulty? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for severe respiratory compromise. |
| 50 | `ccm.pulmonary.flare_treatment` | Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Captures exacerbation treatment and potential medication reconciliation needs. |
| 60 | `ccm.copd.rescue_inhaler_use` | How often have you needed your rescue inhaler in the past seven days? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 1 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.pulmonary.oxygen_issue` | If you use oxygen, is a device or supply problem keeping you from using it as directed? | optional | no | intake, monthly_checkin, care_plan_review | yes | 4 | no | Identifies oxygen equipment-access barriers without assuming oxygen use. |
| 100 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | optional | no | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 110 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.pulmonary.breathing_change` (4 banks): Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change` (4 banks): Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing` (5 banks): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment` (4 banks): Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.pulmonary.oxygen_issue` (4 banks): If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.copd.rescue_inhaler_use`: How often have you needed your rescue inhaler in the past seven days?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.copd.rescue_inhaler_use`: How often have you needed your rescue inhaler in the past seven days?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.pulmonary.urgent_breathing` (urgent): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pulmonary.breathing_change`: Tracks respiratory trajectory during ordinary activity.
- `ccm.pulmonary.cough_sputum_change`: Detects a change that may indicate pulmonary exacerbation or infection.
- `ccm.pulmonary.urgent_breathing`: Screens for severe respiratory compromise.
- `ccm.pulmonary.flare_treatment`: Captures exacerbation treatment and potential medication reconciliation needs.
- `ccm.copd.rescue_inhaler_use`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.pulmonary.oxygen_issue`: Identifies oxygen equipment-access barriers without assuming oxygen use.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- Clinician must approve local escalation thresholds and notification timing.
