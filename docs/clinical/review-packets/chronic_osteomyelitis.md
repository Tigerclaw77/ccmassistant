# Chronic Osteomyelitis

## Review Metadata

- Canonical ID: `chronic_osteomyelitis`
- Bank ID: `ccm-bank.chronic_osteomyelitis`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 46
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| M86 | 128 |

Total mapped codes: 128

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.wound.size_depth_change` | Has the wound become larger or deeper since the last review? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Tracks wound progression using observable change. |
| 70 | `ccm.wound.drainage_odor` | Has drainage or odor from the wound increased? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Screens for worsening local wound burden. |
| 80 | `ccm.wound.infection_red_flag` | Do you have spreading redness, warmth, or fever with the wound? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | yes | Screens for possible spreading infection requiring prompt review. |
| 90 | `ccm.wound.dressing_access` | Do you have the supplies and help needed for wound care? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Identifies supply or caregiver barriers that can delay healing. |
| 100 | `ccm.wound.appointment_pending` | Is a wound, podiatry, vascular, or infectious-disease visit overdue? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 2 | no | Identifies overdue specialty follow-up relevant to wound healing. |
| 110 | `ccm.specialist.pending_followup` | Is any specialist recommendation, test, or follow-up still incomplete? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 47 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.coordination.open_need` | Do you need help arranging care, equipment, referrals, records, or services? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 10 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 130 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.wound.size_depth_change` (2 banks): Has the wound become larger or deeper since the last review?
- `ccm.wound.drainage_odor` (2 banks): Has drainage or odor from the wound increased?
- `ccm.wound.infection_red_flag` (2 banks): Do you have spreading redness, warmth, or fever with the wound?
- `ccm.wound.dressing_access` (2 banks): Do you have the supplies and help needed for wound care?
- `ccm.wound.appointment_pending` (2 banks): Is a wound, podiatry, vascular, or infectious-disease visit overdue?
- `ccm.specialist.pending_followup` (47 banks): Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need` (10 banks): Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.wound.size_depth_change`: Has the wound become larger or deeper since the last review?
- `ccm.wound.drainage_odor`: Has drainage or odor from the wound increased?
- `ccm.wound.infection_red_flag`: Do you have spreading redness, warmth, or fever with the wound?
- `ccm.wound.dressing_access`: Do you have the supplies and help needed for wound care?
- `ccm.wound.appointment_pending`: Is a wound, podiatry, vascular, or infectious-disease visit overdue?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.wound.size_depth_change`: Has the wound become larger or deeper since the last review?
- `ccm.wound.drainage_odor`: Has drainage or odor from the wound increased?
- `ccm.wound.infection_red_flag`: Do you have spreading redness, warmth, or fever with the wound?
- `ccm.wound.dressing_access`: Do you have the supplies and help needed for wound care?
- `ccm.wound.appointment_pending`: Is a wound, podiatry, vascular, or infectious-disease visit overdue?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.wound.size_depth_change`: Has the wound become larger or deeper since the last review?
- `ccm.wound.drainage_odor`: Has drainage or odor from the wound increased?
- `ccm.wound.infection_red_flag`: Do you have spreading redness, warmth, or fever with the wound?
- `ccm.wound.dressing_access`: Do you have the supplies and help needed for wound care?
- `ccm.wound.appointment_pending`: Is a wound, podiatry, vascular, or infectious-disease visit overdue?
- `ccm.specialist.pending_followup`: Is any specialist recommendation, test, or follow-up still incomplete?
- `ccm.coordination.open_need`: Do you need help arranging care, equipment, referrals, records, or services?
- `ccm.goal.priority`: What health or daily-life goal matters most to you now?

## Red-Flag Questions

- `ccm.wound.infection_red_flag` (same_day): Do you have spreading redness, warmth, or fever with the wound?

## Variants

_No variants._

## Clinical Rationale

- `ccm.general.health_change`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.medication.has_issue`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.function.daily_activity_difficulty`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.treatment.plan_barrier`: Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.
- `ccm.specialist.visit_change`: Captures treatment changes that may require medication reconciliation or care-plan updates.
- `ccm.wound.size_depth_change`: Tracks wound progression using observable change.
- `ccm.wound.drainage_odor`: Screens for worsening local wound burden.
- `ccm.wound.infection_red_flag`: Screens for possible spreading infection requiring prompt review.
- `ccm.wound.dressing_access`: Identifies supply or caregiver barriers that can delay healing.
- `ccm.wound.appointment_pending`: Identifies overdue specialty follow-up relevant to wound healing.
- `ccm.specialist.pending_followup`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.coordination.open_need`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
