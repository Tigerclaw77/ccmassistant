# Question Bank Quality Review

## Status

**DRAFT_CLINICAL_REVIEW.** This refinement is ready for clinician review and is not clinically approved. No diagnoses, UI, session behavior, billing behavior, or coordinator workflow were added.

## Quality Metrics

| Metric | Before | After |
| --- | ---: | ---: |
| Average bank size | 10.24 | 8.45 |
| Largest bank | 16 | 12 |
| Smallest bank | 4 | 6 |
| Internal quality score | 63/100 | 89/100 |

- Banks reviewed and improved: 29
- Bank references removed: 67
- Bank references added: 15
- Duplicate concepts consolidated: 7
- Questions rewritten: 14
- Question concepts merged: 7
- New reusable questions: 3
- New condition-specific questions: 3
- Score improvement: +26

Internal 100-point review rubric: usefulness 25, patient wording 20, cognitive load 20, follow-up logic 15, context fit 10, cross-condition consistency 10.

## Review Approach

Presets were reviewed for recurring monthly value, plain language, one-purpose wording, default-versus-optional status, context fit, provider escalation, coordinator action, and consistency across cardiovascular, pulmonary, vision, neurologic, musculoskeletal, behavioral-health, and metabolic disease. The review removed filler defaults and retained disease-specific wording when it materially improves coordination.

Clinical cross-checks included [AHA heart-failure symptom monitoring](https://www.heart.org/en/health-topics/heart-failure/warning-signs-of-heart-failure), [NHLBI asthma attacks and action plans](https://www.nhlbi.nih.gov/health/asthma/attacks), [NIDDK GERD alarm symptoms](https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/symptoms-causes), [NIDDK anemia symptoms](https://www.niddk.nih.gov/health-information/kidney-disease/anemia), and [NIA Parkinson's disease](https://www.nia.nih.gov/health/parkinsons-disease/parkinsons-disease-causes-symptoms-and-treatments).

## Urgent and Provider-Review Questions

All 28 red-flag questions were reviewed for threshold, monthly suitability, and notification behavior. Each remains draft pending approval of the clinic's escalation protocol.

| Question | Urgency | Provider notification | Monthly appropriate |
| --- | --- | --- | --- |
| `ccm.neuro.new_weakness` | same_day | Yes | Yes |
| `ccm.spine.bowel_bladder_change` | urgent | Yes | Yes |
| `ccm.spine.saddle_numbness` | urgent | Yes | Yes |
| `ccm.inflammatory.infection_signs` | same_day | Yes | Yes |
| `ccm.wound.infection_red_flag` | same_day | Yes | Yes |
| `ccm.pulmonary.urgent_breathing` | urgent | Yes | Yes |
| `ccm.liver.confusion` | same_day | Yes | Yes |
| `ccm.liver.bleeding_red_flag` | urgent | Yes | Yes |
| `ccm.liver.jaundice_change` | same_day | Yes | Yes |
| `ccm.sickle.fever` | urgent | Yes | Yes |
| `ccm.sickle.chest_symptoms` | urgent | Yes | Yes |
| `ccm.vascular.rest_pain` | same_day | Yes | Yes |
| `ccm.vascular.foot_wound` | same_day | Yes | Yes |
| `ccm.aorta.new_pain` | urgent | Yes | Yes |
| `ccm.mental.safety_thoughts` | urgent | Yes | Yes |
| `ccm.substance.withdrawal_red_flag` | urgent | Yes | Yes |
| `ccm.neuro.swallow_breathe` | urgent | Yes | Yes |
| `ccm.parkinson.swallowing` | same_day | Yes | Yes |
| `ccm.seizure.event` | same_day | Yes | Yes |
| `ccm.urinary.emptying` | same_day | Yes | Yes |
| `ccm.vision.sudden_change` | urgent | Yes | Yes |
| `ccm.endocrine.heart_racing` | same_day | Yes | Yes |
| `ccm.adrenal.vomiting_red_flag` | urgent | Yes | Yes |
| `ccm.cardiac.chest_discomfort` | urgent | Yes | Yes |
| `ccm.cardiac.fainting` | same_day | Yes | Yes |
| `ccm.anticoag.bleeding` | same_day | Yes | Yes |
| `ccm.gerd.swallowing` | same_day | Yes | Yes |
| `ccm.ibd.stool_change` | same_day | Yes | Yes |

## Consolidated Concepts

- Type 2 diabetes foot concern versus duplicate vascular wound default
- Heart-failure swelling versus duplicate CKD swelling wording
- CKD swelling versus legacy heart-failure swelling wording
- COPD activity breathing change versus generic dyspnea repetition
- Obesity-specific plan barrier versus generic plan-barrier repetition
- Sleep-apnea device barrier versus generic sleep-treatment barrier
- Back-pain functional interference versus generic daily-activity repetition

## Essential Hypertension

- Current bank size: 8 (8 default)
- Recommended bank size: 7 (5 default)
- Questions removed: `ccm.function.daily_activity_difficulty`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions reordered: `ccm.bp.latest_systolic`, `ccm.bp.monitoring_barrier`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.specialist.visit_change`, `ccm.goal.priority`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Type 2 Diabetes

- Current bank size: 11 (10 default)
- Recommended bank size: 9 (8 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.vascular.foot_wound`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.diabetes.latest_glucose`, `ccm.diabetes.high_pattern`, `ccm.diabetes.low_episode`, `ccm.diabetes.foot_concern`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: None
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Chronic Heart Failure

- Current bank size: 12 (11 default)
- Recommended bank size: 10 (8 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.ckd.swelling_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.chf.rapid_weight_gain`, `ccm.chf.swelling_change`, `ccm.symptom.shortness_of_breath`, `ccm.cardiac.chest_discomfort`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.bp.latest_systolic`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.bp.latest_systolic`
- Questions made recommended: None
- Questions generating provider review: `ccm.cardiac.chest_discomfort`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Chronic Kidney Disease

- Current bank size: 10 (9 default)
- Recommended bank size: 8 (6 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.chf.swelling_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.ckd.lab_due`, `ccm.ckd.swelling_change`, `ccm.bp.latest_systolic`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## COPD

- Current bank size: 13 (12 default)
- Recommended bank size: 11 (8 default)
- Questions removed: `ccm.treatment.plan_barrier`, `ccm.symptom.shortness_of_breath`
- Questions added: None
- Questions rewritten: `ccm.pulmonary.oxygen_issue`, `ccm.specialist.visit_change`
- Questions reordered: `ccm.pulmonary.breathing_change`, `ccm.pulmonary.cough_sputum_change`, `ccm.pulmonary.urgent_breathing`, `ccm.pulmonary.flare_treatment`, `ccm.copd.rescue_inhaler_use`, `ccm.medication.has_issue`, `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.pulmonary.oxygen_issue`, `ccm.specialist.visit_change`
- Questions made recommended: None
- Questions generating provider review: `ccm.pulmonary.urgent_breathing`
- Questions generating coordinator action: `ccm.pulmonary.oxygen_issue`, `ccm.specialist.visit_change`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Asthma

- Current bank size: 4 (4 default)
- Recommended bank size: 9 (7 default)
- Questions removed: None
- Questions added: `ccm.pulmonary.urgent_breathing`, `ccm.pulmonary.flare_treatment`, `ccm.treatment.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.medication.has_issue`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions made recommended: `ccm.pulmonary.urgent_breathing`, `ccm.pulmonary.flare_treatment`, `ccm.treatment.plan_barrier`
- Questions generating provider review: `ccm.pulmonary.urgent_breathing`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Coronary Artery Disease

- Current bank size: 11 (10 default)
- Recommended bank size: 9 (6 default)
- Questions removed: `ccm.bp.monitoring_barrier`, `ccm.specialist.pending_followup`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions reordered: `ccm.cardiac.chest_discomfort`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.bp.latest_systolic`, `ccm.specialist.visit_change`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.anticoag.bleeding`, `ccm.specialist.visit_change`
- Questions made recommended: None
- Questions generating provider review: `ccm.cardiac.chest_discomfort`, `ccm.anticoag.bleeding`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Atrial Fibrillation

- Current bank size: 12 (11 default)
- Recommended bank size: 9 (6 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.bp.monitoring_barrier`, `ccm.specialist.pending_followup`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions reordered: `ccm.endocrine.heart_racing`, `ccm.cardiac.fainting`, `ccm.anticoag.bleeding`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.bp.latest_systolic`, `ccm.specialist.visit_change`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.bp.latest_systolic`, `ccm.specialist.visit_change`
- Questions made recommended: None
- Questions generating provider review: `ccm.endocrine.heart_racing`, `ccm.cardiac.fainting`, `ccm.anticoag.bleeding`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Peripheral Vascular Disease

- Current bank size: 9 (8 default)
- Recommended bank size: 9 (7 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.pain.severity`, `ccm.specialist.pending_followup`
- Questions added: `ccm.vascular.walking_leg_pain`, `ccm.vascular.rest_pain`, `ccm.vascular.foot_wound`
- Questions rewritten: `ccm.vascular.foot_wound`, `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.falls.had_fall`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.falls.had_fall`
- Questions made recommended: `ccm.vascular.walking_leg_pain`, `ccm.vascular.rest_pain`, `ccm.vascular.foot_wound`
- Questions generating provider review: `ccm.vascular.rest_pain`, `ccm.vascular.foot_wound`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Hyperlipidemia

- Current bank size: 8 (8 default)
- Recommended bank size: 6 (4 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.lipid.lab_due`, `ccm.medication.has_issue`, `ccm.nutrition.food_access`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.nutrition.food_access`, `ccm.goal.priority`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Small preset; confirm it is sufficient for the clinic's patient mix.

## Osteoarthritis

- Current bank size: 10 (9 default)
- Recommended bank size: 8 (7 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.pain.severity`, `ccm.pain.function_interference`, `ccm.arthritis.stiffness_change`, `ccm.falls.had_fall`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: None
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Glaucoma

- Current bank size: 10 (9 default)
- Recommended bank size: 6 (4 default)
- Questions removed: `ccm.medication.has_issue`, `ccm.function.daily_activity_difficulty`, `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.vision.daily_tasks`, `ccm.vision.treatment_barrier`
- Questions reordered: `ccm.vision.sudden_change`, `ccm.vision.daily_tasks`, `ccm.vision.treatment_barrier`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: `ccm.vision.sudden_change`
- Questions generating coordinator action: `ccm.vision.treatment_barrier`
- Remaining concerns: Small preset; confirm it is sufficient for the clinic's patient mix. Clinician must approve local escalation thresholds and notification timing.

## Age-related Macular Degeneration

- Current bank size: 12 (11 default)
- Recommended bank size: 8 (4 default)
- Questions removed: `ccm.medication.has_issue`, `ccm.function.daily_activity_difficulty`, `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.vision.daily_tasks`, `ccm.vision.treatment_barrier`
- Questions reordered: `ccm.vision.sudden_change`, `ccm.vision.daily_tasks`, `ccm.vision.treatment_barrier`, `ccm.falls.had_fall`, `ccm.transportation.barrier`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.falls.had_fall`, `ccm.transportation.barrier`, `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: `ccm.vision.sudden_change`
- Questions generating coordinator action: `ccm.vision.treatment_barrier`
- Remaining concerns: Small preset; confirm it is sufficient for the clinic's patient mix. Clinician must approve local escalation thresholds and notification timing.

## Major Depressive Disorder

- Current bank size: 9 (9 default)
- Recommended bank size: 8 (7 default)
- Questions removed: `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.mental.mood_frequency`, `ccm.mental.safety_thoughts`, `ccm.function.daily_activity_difficulty`, `ccm.sleep.quality`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.goal.priority`
- Questions made recommended: None
- Questions generating provider review: `ccm.mental.safety_thoughts`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Generalized Anxiety Disorder

- Current bank size: 5 (4 default)
- Recommended bank size: 7 (6 default)
- Questions removed: None
- Questions added: `ccm.function.daily_activity_difficulty`, `ccm.treatment.plan_barrier`
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.sleep.quality`, `ccm.medication.has_issue`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: None
- Questions made recommended: `ccm.function.daily_activity_difficulty`, `ccm.treatment.plan_barrier`
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Dementia

- Current bank size: 10 (9 default)
- Recommended bank size: 8 (6 default)
- Questions removed: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.dementia.safety_change`
- Questions reordered: `ccm.dementia.safety_change`, `ccm.dementia.caregiver_strain`, `ccm.function.daily_activity_difficulty`, `ccm.falls.had_fall`, `ccm.medication.has_issue`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: `ccm.dementia.safety_change`
- Questions generating coordinator action: `ccm.dementia.caregiver_strain`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Parkinson Disease

- Current bank size: 7 (4 default)
- Recommended bank size: 9 (7 default)
- Questions removed: `ccm.sleep.quality`
- Questions added: `ccm.parkinson.mobility_change`, `ccm.parkinson.wearing_off`, `ccm.parkinson.swallowing`
- Questions rewritten: None
- Questions reordered: `ccm.function.daily_activity_difficulty`, `ccm.medication.has_issue`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: None
- Questions made recommended: `ccm.parkinson.mobility_change`, `ccm.parkinson.wearing_off`, `ccm.parkinson.swallowing`
- Questions generating provider review: `ccm.parkinson.mobility_change`, `ccm.parkinson.wearing_off`, `ccm.parkinson.swallowing`
- Questions generating coordinator action: None
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Peripheral Neuropathy

- Current bank size: 12 (11 default)
- Recommended bank size: 10 (8 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.specialist.pending_followup`
- Questions added: None
- Questions rewritten: `ccm.vascular.foot_wound`, `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.neuropathy.sensation_change`, `ccm.neuro.balance_change`, `ccm.vascular.foot_wound`, `ccm.falls.had_fall`, `ccm.function.daily_activity_difficulty`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.sleep.quality`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.sleep.quality`
- Questions made recommended: None
- Questions generating provider review: `ccm.vascular.foot_wound`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Chronic Back Pain

- Current bank size: 16 (15 default)
- Recommended bank size: 12 (8 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`, `ccm.spine.walking_tolerance`, `ccm.spine.leg_symptoms_standing`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.pain.severity`, `ccm.pain.function_interference`, `ccm.neuro.new_weakness`, `ccm.spine.bowel_bladder_change`, `ccm.spine.saddle_numbness`, `ccm.spine.therapy_progress`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.falls.had_fall`, `ccm.spine.procedure_planned`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.spine.saddle_numbness`, `ccm.falls.had_fall`, `ccm.spine.procedure_planned`
- Questions made recommended: None
- Questions generating provider review: `ccm.neuro.new_weakness`, `ccm.spine.bowel_bladder_change`, `ccm.spine.saddle_numbness`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Lumbar Spinal Stenosis

- Current bank size: 16 (15 default)
- Recommended bank size: 12 (9 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`, `ccm.pain.severity`
- Questions added: None
- Questions rewritten: None
- Questions reordered: `ccm.spine.walking_tolerance`, `ccm.spine.leg_symptoms_standing`, `ccm.neuro.new_weakness`, `ccm.spine.bowel_bladder_change`, `ccm.spine.saddle_numbness`, `ccm.spine.therapy_progress`, `ccm.pain.function_interference`, `ccm.falls.had_fall`, `ccm.medication.has_issue`, `ccm.spine.procedure_planned`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.spine.saddle_numbness`, `ccm.spine.procedure_planned`
- Questions made recommended: None
- Questions generating provider review: `ccm.neuro.new_weakness`, `ccm.spine.bowel_bladder_change`, `ccm.spine.saddle_numbness`
- Questions generating coordinator action: None
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Fibromyalgia

- Current bank size: 11 (10 default)
- Recommended bank size: 8 (7 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`, `ccm.falls.had_fall`
- Questions added: None
- Questions rewritten: `ccm.fibromyalgia.recovery`, `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.pain.severity`, `ccm.pain.function_interference`, `ccm.fibromyalgia.recovery`, `ccm.sleep.daytime_impact`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: None
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Obesity

- Current bank size: 9 (8 default)
- Recommended bank size: 7 (4 default)
- Questions removed: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`, `ccm.hospital.had_admission`, `ccm.emergency.had_visit`
- Questions added: `ccm.goal.progress`, `ccm.nutrition.food_access`
- Questions rewritten: None
- Questions reordered: `ccm.weight.plan_barrier`, `ccm.function.daily_activity_difficulty`, `ccm.medication.has_issue`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`, `ccm.medication.has_issue`
- Questions made recommended: `ccm.goal.progress`, `ccm.nutrition.food_access`
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.weight.plan_barrier`
- Remaining concerns: Small preset; confirm it is sufficient for the clinic's patient mix. Keep wording weight-neutral and align goals with the patient's agreed plan.

## Hypothyroidism

- Current bank size: 9 (8 default)
- Recommended bank size: 7 (4 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.nutrition.food_access`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.thyroid.lab_due`, `ccm.medication.has_issue`, `ccm.function.daily_activity_difficulty`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`, `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Small preset; confirm it is sufficient for the clinic's patient mix.

## Gastroesophageal Reflux Disease

- Current bank size: 10 (9 default)
- Recommended bank size: 7 (5 default)
- Questions removed: `ccm.function.daily_activity_difficulty`, `ccm.specialist.visit_change`, `ccm.nutrition.food_access`
- Questions added: None
- Questions rewritten: `ccm.gerd.swallowing`, `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.gerd.swallowing`, `ccm.liver.bleeding_red_flag`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: `ccm.gerd.swallowing`, `ccm.liver.bleeding_red_flag`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Anemia

- Current bank size: 10 (9 default)
- Recommended bank size: 8 (6 default)
- Questions removed: `ccm.specialist.visit_change`, `ccm.specialist.pending_followup`
- Questions added: None
- Questions rewritten: `ccm.anemia.symptom_change`, `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.anemia.symptom_change`, `ccm.hematology.lab_followup`, `ccm.function.daily_activity_difficulty`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.hospital.had_admission`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.hospital.had_admission`
- Questions made recommended: None
- Questions generating provider review: `ccm.anemia.symptom_change`
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Osteoporosis

- Current bank size: 11 (10 default)
- Recommended bank size: 8 (5 default)
- Questions removed: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`, `ccm.pain.function_interference`
- Questions added: None
- Questions rewritten: `ccm.osteoporosis.new_fracture`
- Questions reordered: `ccm.osteoporosis.new_fracture`, `ccm.falls.had_fall`, `ccm.osteoporosis.treatment_barrier`, `ccm.medication.has_issue`, `ccm.pain.severity`, `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.pain.severity`, `ccm.function.daily_activity_difficulty`
- Questions made recommended: None
- Questions generating provider review: `ccm.osteoporosis.new_fracture`
- Questions generating coordinator action: None
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing.

## Active Malignancy

- Current bank size: 11 (10 default)
- Recommended bank size: 9 (7 default)
- Questions removed: `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: None
- Questions reordered: `ccm.cancer.new_symptom`, `ccm.cancer.treatment_change`, `ccm.liver.appetite_weight`, `ccm.hematology.lab_followup`, `ccm.medication.has_issue`, `ccm.function.daily_activity_difficulty`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.hematology.lab_followup`
- Questions made recommended: None
- Questions generating provider review: `ccm.cancer.new_symptom`
- Questions generating coordinator action: None
- Remaining concerns: Clinician must approve local escalation thresholds and notification timing. Cancer site and treatment phase still require coordinator judgment.

## Chronic Pain

- Current bank size: 9 (8 default)
- Recommended bank size: 8 (6 default)
- Questions removed: `ccm.specialist.visit_change`
- Questions added: None
- Questions rewritten: `ccm.treatment.plan_barrier`
- Questions reordered: `ccm.pain.severity`, `ccm.pain.function_interference`, `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.sleep.quality`, `ccm.function.daily_activity_difficulty`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.treatment.plan_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.

## Sleep Apnea

- Current bank size: 12 (11 default)
- Recommended bank size: 8 (5 default)
- Questions removed: `ccm.medication.has_issue`, `ccm.treatment.plan_barrier`, `ccm.specialist.visit_change`, `ccm.sleep.treatment_barrier`
- Questions added: None
- Questions rewritten: `ccm.osa.device_barrier`
- Questions reordered: `ccm.osa.device_use`, `ccm.osa.device_barrier`, `ccm.sleep.daytime_impact`, `ccm.sleep.quality`, `ccm.function.daily_activity_difficulty`, `ccm.specialist.pending_followup`, `ccm.goal.priority`
- Questions moved to intake only: None
- Questions moved to monthly only: None
- Questions moved out of monthly: `ccm.goal.priority`
- Questions made optional: `ccm.function.daily_activity_difficulty`, `ccm.specialist.pending_followup`
- Questions made recommended: None
- Questions generating provider review: None
- Questions generating coordinator action: `ccm.osa.device_barrier`
- Remaining concerns: No structural concern; clinician wording review remains required before publication.
