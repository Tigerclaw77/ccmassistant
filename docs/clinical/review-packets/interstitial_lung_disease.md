# Interstitial Lung Disease

## Review Metadata

- Canonical ID: `interstitial_lung_disease`
- Bank ID: `ccm-bank.interstitial_lung_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 44
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| J84 | 31 |

Total mapped codes: 31

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.pulmonary.breathing_change` | Compared with the last review, how has your breathing during usual activity changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Tracks respiratory trajectory during ordinary activity. |
| 70 | `ccm.pulmonary.cough_sputum_change` | Has your cough or mucus changed from your usual pattern? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Detects a change that may indicate pulmonary exacerbation or infection. |
| 80 | `ccm.pulmonary.urgent_breathing` | Are you short of breath at rest or unable to speak comfortably because of breathing difficulty? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 5 | yes | Screens for severe respiratory compromise. |
| 90 | `ccm.pulmonary.oxygen_issue` | If you use oxygen, is a device or supply problem keeping you from using it as directed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Identifies oxygen equipment-access barriers without assuming oxygen use. |
| 100 | `ccm.pulmonary.flare_treatment` | Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 4 | no | Captures exacerbation treatment and potential medication reconciliation needs. |
| 110 | `ccm.symptom.shortness_of_breath` | Are you having shortness of breath? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 9 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 130 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.pulmonary.breathing_change` (4 banks): Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change` (4 banks): Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing` (5 banks): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.oxygen_issue` (4 banks): If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.pulmonary.flare_treatment` (4 banks): Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.symptom.shortness_of_breath` (9 banks): Are you having shortness of breath?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.pulmonary.breathing_change`: Compared with the last review, how has your breathing during usual activity changed?
- `ccm.pulmonary.cough_sputum_change`: Has your cough or mucus changed from your usual pattern?
- `ccm.pulmonary.urgent_breathing`: Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?
- `ccm.pulmonary.oxygen_issue`: If you use oxygen, is a device or supply problem keeping you from using it as directed?
- `ccm.pulmonary.flare_treatment`: Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.pulmonary.urgent_breathing` (urgent): Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.pulmonary.breathing_change`: Tracks respiratory trajectory during ordinary activity.
- `ccm.pulmonary.cough_sputum_change`: Detects a change that may indicate pulmonary exacerbation or infection.
- `ccm.pulmonary.urgent_breathing`: Screens for severe respiratory compromise.
- `ccm.pulmonary.oxygen_issue`: Identifies oxygen equipment-access barriers without assuming oxygen use.
- `ccm.pulmonary.flare_treatment`: Captures exacerbation treatment and potential medication reconciliation needs.
- `ccm.symptom.shortness_of_breath`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
