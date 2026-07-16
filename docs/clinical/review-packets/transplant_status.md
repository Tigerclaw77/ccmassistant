# Transplant Status

## Review Metadata

- Canonical ID: `transplant_status`
- Bank ID: `ccm-bank.transplant_status`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 80
- Estimated review time: 12 minutes
- Medicare relevance: RARE

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| Z94 | 16 |

Total mapped codes: 16

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 50 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 60 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 70 | `ccm.hospital.had_admission` | Have you been admitted to a hospital since the last review? | optional | no | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need` (10 banks): Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.hospital.had_admission` (10 banks): Have you been admitted to a hospital since the last review?

## New Questions

- None

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.hospital.had_admission`: Have you been admitted to a hospital since the last review?

## Red-Flag Questions

- None

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.coordination.open_need`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.hospital.had_admission`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Architecture seed only; condition-specific question selection remains outstanding.
- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
