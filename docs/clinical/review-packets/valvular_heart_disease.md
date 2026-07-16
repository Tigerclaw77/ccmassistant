# Valvular Heart Disease

## Review Metadata

- Canonical ID: `valvular_heart_disease`
- Bank ID: `ccm-bank.valvular_heart_disease`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 30
- Estimated review time: 18 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| I34 | 8 |
| I35 | 6 |
| I36 | 6 |
| I37 | 6 |
| I38 | 1 |

Total mapped codes: 27

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.cardiac.chest_discomfort` | Have you had new or worsening chest pressure or discomfort? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for a potentially urgent cardiac symptom. |
| 50 | `ccm.cardiac.fainting` | Have you fainted or nearly fainted since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for hemodynamic or rhythm-related instability. |
| 60 | `ccm.anticoag.bleeding` | If you use a blood thinner, have you had unusual bleeding or large unexplained bruises? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for anticoagulant harm without assuming use. |
| 70 | `ccm.bp.latest_systolic` | What was your most recent systolic blood pressure reading? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 11 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 80 | `ccm.symptom.shortness_of_breath` | Are you having shortness of breath? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 9 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 90 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.cardiac.chest_discomfort` (3 banks): Have you had new or worsening chest pressure or discomfort?
- `ccm.cardiac.fainting` (3 banks): Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding` (3 banks): If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.bp.latest_systolic` (11 banks): What was your most recent systolic blood pressure reading?
- `ccm.symptom.shortness_of_breath` (9 banks): Are you having shortness of breath?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.cardiac.chest_discomfort`: Have you had new or worsening chest pressure or discomfort?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.valve.procedure_plan`: Is a heart-valve test, procedure, or cardiology decision pending?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.cardiac.chest_discomfort`: Have you had new or worsening chest pressure or discomfort?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.valve.procedure_plan`: Is a heart-valve test, procedure, or cardiology decision pending?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.cardiac.chest_discomfort`: Have you had new or worsening chest pressure or discomfort?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding`: If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?
- `ccm.bp.latest_systolic`: What was your most recent systolic blood pressure reading?
- `ccm.symptom.shortness_of_breath`: Are you having shortness of breath?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.valve.procedure_plan`: Is a heart-valve test, procedure, or cardiology decision pending?

## Red-Flag Questions

- `ccm.cardiac.chest_discomfort` (urgent): Have you had new or worsening chest pressure or discomfort?
- `ccm.cardiac.fainting` (same_day): Have you fainted or nearly fainted since the last review?
- `ccm.anticoag.bleeding` (same_day): If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?

## Variants

### Aortic valve disease (`aortic_valve`)

- Activation: clinical_content_group
- Clinical content groups: valvular_heart_disease__aortic_valve

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.valve.procedure_plan` | Is a heart-valve test, procedure, or cardiology decision pending? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies coordination needs around valve surveillance or intervention. |

### Mitral valve disease (`mitral_valve`)

- Activation: clinical_content_group
- Clinical content groups: valvular_heart_disease__mitral_valve

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.valve.procedure_plan` | Is a heart-valve test, procedure, or cardiology decision pending? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies coordination needs around valve surveillance or intervention. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.cardiac.chest_discomfort`: Screens for a potentially urgent cardiac symptom.
- `ccm.cardiac.fainting`: Screens for hemodynamic or rhythm-related instability.
- `ccm.anticoag.bleeding`: Screens for anticoagulant harm without assuming use.
- `ccm.bp.latest_systolic`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.symptom.shortness_of_breath`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 2 variant(s) require confirmation that activation criteria materially change CCM questioning.
