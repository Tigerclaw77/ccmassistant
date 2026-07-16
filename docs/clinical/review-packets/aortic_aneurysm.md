# Aortic Aneurysm

## Review Metadata

- Canonical ID: `aortic_aneurysm`
- Bank ID: `ccm-bank.aortic_aneurysm`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 37
- Estimated review time: 17 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| I71 | 31 |

Total mapped codes: 31

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.aorta.surveillance_due` | Is imaging or a vascular follow-up for the aneurysm overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies missed surveillance or specialty follow-up. |
| 70 | `ccm.aorta.bp_plan` | Have you had trouble following the blood-pressure plan given for the aneurysm? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies a management barrier without prescribing a target or treatment. |
| 80 | `ccm.cardiac.fainting` | Have you fainted or nearly fainted since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | yes | Screens for hemodynamic or rhythm-related instability. |
| 90 | `ccm.pain.severity` | What is your pain level today from 0 to 10? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 20 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 100 | `ccm.falls.had_fall` | Have you fallen since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 32 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.cardiac.fainting` (3 banks): Have you fainted or nearly fainted since the last review?
- `ccm.pain.severity` (20 banks): What is your pain level today from 0 to 10?
- `ccm.falls.had_fall` (32 banks): Have you fallen since the last review?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.aorta.surveillance_due`: Is imaging or a vascular follow-up for the aneurysm overdue?
- `ccm.aorta.bp_plan`: Have you had trouble following the blood-pressure plan given for the aneurysm?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.aorta.new_pain`: Have you had sudden severe chest, back, or abdominal pain?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.aorta.surveillance_due`: Is imaging or a vascular follow-up for the aneurysm overdue?
- `ccm.aorta.bp_plan`: Have you had trouble following the blood-pressure plan given for the aneurysm?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.aorta.new_pain`: Have you had sudden severe chest, back, or abdominal pain?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.aorta.surveillance_due`: Is imaging or a vascular follow-up for the aneurysm overdue?
- `ccm.aorta.bp_plan`: Have you had trouble following the blood-pressure plan given for the aneurysm?
- `ccm.cardiac.fainting`: Have you fainted or nearly fainted since the last review?
- `ccm.pain.severity`: What is your pain level today from 0 to 10?
- `ccm.falls.had_fall`: Have you fallen since the last review?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.aorta.new_pain`: Have you had sudden severe chest, back, or abdominal pain?

## Red-Flag Questions

- `ccm.cardiac.fainting` (same_day): Have you fainted or nearly fainted since the last review?
- `ccm.aorta.new_pain` (urgent): Have you had sudden severe chest, back, or abdominal pain?

## Variants

### Rupture recorded (`rupture_recorded`)

- Activation: clinical_content_group
- Clinical content groups: aortic_aneurysm__rupture_recorded

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1210 | `ccm.aorta.new_pain` | Have you had sudden severe chest, back, or abdominal pain? | required | yes | intake, monthly_checkin, care_plan_review | yes | 1 | yes | Screens for a symptom pattern requiring emergency evaluation in a patient with aortic aneurysm. |

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.aorta.surveillance_due`: Identifies missed surveillance or specialty follow-up.
- `ccm.aorta.bp_plan`: Identifies a management barrier without prescribing a target or treatment.
- `ccm.cardiac.fainting`: Screens for hemodynamic or rhythm-related instability.
- `ccm.pain.severity`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.falls.had_fall`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
- 1 variant(s) require confirmation that activation criteria materially change CCM questioning.
