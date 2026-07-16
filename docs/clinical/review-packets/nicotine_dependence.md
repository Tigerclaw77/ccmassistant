# Nicotine Dependence

## Review Metadata

- Canonical ID: `nicotine_dependence`
- Bank ID: `ccm-bank.nicotine_dependence`
- Bank content version: 1
- Review status: DRAFT_CLINICAL_REVIEW
- Priority rank: 56
- Estimated review time: 15 minutes
- Medicare relevance: OCCASIONAL

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
| F17 | 26 |

Total mapped codes: 26

## Suggested Question Bank

| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 10 | `ccm.general.health_change` | Has your health changed since the last review? | required | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 81 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 20 | `ccm.medication.has_issue` | Are you having any problem taking or obtaining your medications? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 78 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 30 | `ccm.function.daily_activity_difficulty` | Are health problems making daily activities harder? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 72 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 40 | `ccm.treatment.plan_barrier` | Is anything making it difficult to follow the care plan for this condition? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 52 | no | Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment. |
| 50 | `ccm.specialist.visit_change` | Has a specialist changed this condition's treatment plan since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 37 | no | Captures treatment changes that may require medication reconciliation or care-plan updates. |
| 60 | `ccm.substance.use_since_contact` | Have you used the substance related to this diagnosis since the last contact? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Tracks current use without judgment and supports treatment planning. |
| 70 | `ccm.substance.craving_change` | Compared with the last review, how have cravings changed? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Tracks relapse risk using a deterministic response set. |
| 80 | `ccm.substance.treatment_access` | Have you had trouble getting counseling, recovery support, or prescribed treatment? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 3 | no | Identifies access barriers to ongoing substance-use treatment. |
| 90 | `ccm.tobacco.quit_support` | Would support for reducing or stopping nicotine use be helpful now? | recommended | yes | intake, monthly_checkin, care_plan_review | yes | 1 | no | Identifies readiness for support without assuming a quit attempt. |
| 100 | `ccm.mental.mood_frequency` | How often have you felt down, depressed, or hopeless in the past two weeks? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 110 | `ccm.mental.anxiety_frequency` | How often have you felt nervous, anxious, or unable to control worry in the past two weeks? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 8 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 120 | `ccm.sleep.quality` | How would you rate your sleep quality? | recommended | yes | intake, monthly_checkin, care_plan_review, annual_review | no | 24 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |
| 130 | `ccm.goal.priority` | What health or daily-life goal matters most to you now? | optional | no | intake, care_plan_review, annual_review | no | 79 | no | Reuses an established CCM question whose wording and intent fit this condition bank. |

## Reused Questions

- `ccm.general.health_change` (81 banks): Has your health changed since the last review?
- `ccm.medication.has_issue` (78 banks): Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty` (72 banks): Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier` (52 banks): Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change` (37 banks): Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.substance.use_since_contact` (3 banks): Have you used the substance related to this diagnosis since the last contact?
- `ccm.substance.craving_change` (3 banks): Compared with the last review, how have cravings changed?
- `ccm.substance.treatment_access` (3 banks): Have you had trouble getting counseling, recovery support, or prescribed treatment?
- `ccm.mental.mood_frequency` (8 banks): How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency` (8 banks): How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality` (24 banks): How would you rate your sleep quality?
- `ccm.goal.priority` (79 banks): What health or daily-life goal matters most to you now?

## New Questions

- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.substance.use_since_contact`: Have you used the substance related to this diagnosis since the last contact?
- `ccm.substance.craving_change`: Compared with the last review, how have cravings changed?
- `ccm.substance.treatment_access`: Have you had trouble getting counseling, recovery support, or prescribed treatment?
- `ccm.tobacco.quit_support`: Would support for reducing or stopping nicotine use be helpful now?

## Intake-Only Questions

- None

## Monthly Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.substance.use_since_contact`: Have you used the substance related to this diagnosis since the last contact?
- `ccm.substance.craving_change`: Compared with the last review, how have cravings changed?
- `ccm.substance.treatment_access`: Have you had trouble getting counseling, recovery support, or prescribed treatment?
- `ccm.tobacco.quit_support`: Would support for reducing or stopping nicotine use be helpful now?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?

## Care-Plan Questions

- `ccm.general.health_change`: Has your health changed since the last review?
- `ccm.medication.has_issue`: Are you having any problem taking or obtaining your medications?
- `ccm.function.daily_activity_difficulty`: Are health problems making daily activities harder?
- `ccm.treatment.plan_barrier`: Is anything making it difficult to follow the care plan for this condition?
- `ccm.specialist.visit_change`: Has a specialist changed this condition's treatment plan since the last contact?
- `ccm.substance.use_since_contact`: Have you used the substance related to this diagnosis since the last contact?
- `ccm.substance.craving_change`: Compared with the last review, how have cravings changed?
- `ccm.substance.treatment_access`: Have you had trouble getting counseling, recovery support, or prescribed treatment?
- `ccm.tobacco.quit_support`: Would support for reducing or stopping nicotine use be helpful now?
- `ccm.mental.mood_frequency`: How often have you felt down, depressed, or hopeless in the past two weeks?
- `ccm.mental.anxiety_frequency`: How often have you felt nervous, anxious, or unable to control worry in the past two weeks?
- `ccm.sleep.quality`: How would you rate your sleep quality?
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
- `ccm.substance.use_since_contact`: Tracks current use without judgment and supports treatment planning.
- `ccm.substance.craving_change`: Tracks relapse risk using a deterministic response set.
- `ccm.substance.treatment_access`: Identifies access barriers to ongoing substance-use treatment.
- `ccm.tobacco.quit_support`: Identifies readiness for support without assuming a quit attempt.
- `ccm.mental.mood_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.mental.anxiety_frequency`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.sleep.quality`: Reuses an established CCM question whose wording and intent fit this condition bank.
- `ccm.goal.priority`: Reuses an established CCM question whose wording and intent fit this condition bank.

## Outstanding Review Concerns

- Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.
