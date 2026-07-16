const ALL_CONTEXTS = ["intake", "monthly_checkin", "care_plan_review", "annual_review"];
const MONTHLY_CONTEXTS = ["intake", "monthly_checkin", "care_plan_review"];

function canonical(id, name, clinicalDomain, aliases, mappingRationale, relatedConditionIds = []) {
  return {
    id,
    name,
    description: `Canonical condition identity added in the controlled clinical-content batch. Mapping rationale: ${mappingRationale}`,
    aliases,
    clinicalDomain,
    profileStatus: "starter_placeholder",
    content: {
      questionModules: [],
      carePlanTemplateId: null,
      commonGoals: [],
      monitoringConcepts: [],
      educationTopics: [],
      commonInterventions: [],
      relatedConditionIds,
      clinicalNotes: ["Question content is DRAFT_CLINICAL_REVIEW, content version 1."],
      icdMappings: [mappingRationale],
    },
  };
}

export const NEW_CANONICAL_CONDITIONS = [
  canonical("lumbar_spinal_stenosis", "Lumbar Spinal Stenosis", "musculoskeletal", ["Lumbar canal stenosis"], "Map M48.061 and M48.062; retain neurogenic claudication as a material variant."),
  canonical("cervical_spinal_stenosis", "Cervical Spinal Stenosis", "musculoskeletal", ["Cervical canal stenosis"], "Map M48.02; keep cervical monitoring distinct from lumbar claudication content."),
  canonical("lumbar_radiculopathy", "Lumbar Radiculopathy", "neurology", ["Lumbosacral radiculopathy", "Lumbar nerve root disorder"], "Map M54.16 and M54.17; collapse laterality while preserving the exact diagnosis title."),
  canonical("cervical_radiculopathy", "Cervical Radiculopathy", "neurology", ["Cervical nerve root disorder"], "Map M54.12; keep cervical upper-extremity monitoring separate from lumbar disease."),
  canonical("cervical_disc_disease", "Cervical Disc Disease", "musculoskeletal", ["Cervical disc disorder", "Cervical degenerative disc disease"], "Map M50 billable diagnoses; retain myelopathy and radiculopathy variants."),
  canonical("lumbar_disc_disease", "Lumbar Disc Disease", "musculoskeletal", ["Lumbar degenerative disc disease", "Lumbosacral disc disorder"], "Map billable M51 diagnoses whose official titles identify lumbar or lumbosacral disease; retain myelopathy and radiculopathy variants."),
  canonical("fibromyalgia", "Fibromyalgia", "rheumatology", ["Fibromyalgia syndrome"], "Map M79.7 as a specific chronic pain-processing disorder, not a generic pain identity."),
  canonical("chronic_gout", "Chronic Gout", "rheumatology", ["Gouty arthritis", "Tophaceous gout"], "Map M1A chronic gout; collapse site and laterality while retaining tophus status."),
  canonical("non_pressure_chronic_ulcer", "Non-Pressure Chronic Ulcer", "wound_care", ["Chronic skin ulcer", "Non-pressure ulcer"], "Map L97 and L98 diagnoses explicitly titled non-pressure chronic ulcer; collapse laterality and retain deep tissue involvement."),
  canonical("chronic_osteomyelitis", "Chronic Osteomyelitis", "infectious_disease", ["Chronic bone infection"], "Map M86 diagnoses explicitly titled chronic osteomyelitis; collapse site and laterality for bank identity."),
  canonical("chronic_venous_insufficiency", "Chronic Venous Insufficiency", "vascular", ["Peripheral venous insufficiency"], "Map I87.2 only; do not merge post-thrombotic syndrome or acute thrombosis."),
  canonical("cirrhosis", "Cirrhosis", "hepatology", ["Hepatic cirrhosis", "Liver fibrosis and cirrhosis"], "Map K74 fibrosis and cirrhosis diagnoses; retain exact etiology and stage wording in the ICD record."),
  canonical("psoriasis", "Psoriasis", "dermatology", ["Plaque psoriasis"], "Map L40 psoriasis diagnoses; do not merge unrelated dermatitis conditions."),
  canonical("interstitial_lung_disease", "Interstitial Lung Disease", "pulmonology", ["Pulmonary fibrosis", "ILD"], "Map J84 interstitial pulmonary diseases; preserve the exact disease title."),
  canonical("bronchiectasis", "Bronchiectasis", "pulmonology", ["Chronic bronchiectasis"], "Map J47 and retain exacerbation or lower-respiratory-infection treatment-state variants."),
  canonical("sickle_cell_disease", "Sickle Cell Disease", "hematology", ["Sickle-cell disorder"], "Map D57 sickle-cell disorders; retain crisis and acute-chest variants."),
  canonical("ankylosing_spondylitis", "Ankylosing Spondylitis", "rheumatology", ["Axial spondyloarthritis"], "Map M45 ankylosing spondylitis; collapse spinal subsite for bank identity."),
  canonical("systemic_lupus_erythematosus", "Systemic Lupus Erythematosus", "rheumatology", ["SLE", "Lupus"], "Map M32 systemic lupus erythematosus; preserve organ involvement in the exact ICD title."),
  canonical("sarcoidosis", "Sarcoidosis", "pulmonology", ["Systemic sarcoidosis"], "Map D86 sarcoidosis; preserve organ involvement in the exact ICD title."),
  canonical("aortic_aneurysm", "Aortic Aneurysm", "vascular", ["Aortic aneurysm without dissection"], "Map I71 diagnoses whose official title identifies aneurysm; do not map dissection-only diagnoses and retain rupture status."),
  canonical("post_traumatic_stress_disorder", "Post-Traumatic Stress Disorder", "behavioral_health", ["PTSD"], "Map F43.1 PTSD diagnoses; do not merge acute stress or adjustment disorders."),
  canonical("alcohol_use_disorder", "Alcohol Use Disorder", "behavioral_health", ["Alcohol dependence", "Alcohol abuse"], "Map F10 alcohol-related abuse and dependence diagnoses; retain remission, withdrawal, and complication states."),
  canonical("opioid_use_disorder", "Opioid Use Disorder", "behavioral_health", ["Opioid dependence", "Opioid abuse"], "Map F11 opioid-related abuse and dependence diagnoses; retain remission, withdrawal, and complication states."),
  canonical("nicotine_dependence", "Nicotine Dependence", "behavioral_health", ["Tobacco dependence"], "Map F17 nicotine-dependence diagnoses; retain remission and withdrawal states."),
  canonical("insomnia", "Insomnia", "sleep_medicine", ["Chronic insomnia", "Primary insomnia"], "Map G47.0 and F51.0 insomnia diagnoses; do not merge hypersomnia or parasomnia."),
  canonical("essential_tremor", "Essential Tremor", "neurology", ["Familial tremor"], "Map G25.0 only; do not merge drug-induced tremor or other movement disorders."),
  canonical("benign_prostatic_hyperplasia", "Benign Prostatic Hyperplasia", "urology", ["BPH", "Enlarged prostate"], "Map N40 BPH diagnoses; retain lower-urinary-tract-symptom state."),
  canonical("hearing_loss", "Hearing Loss", "audiology", ["Conductive hearing loss", "Sensorineural hearing loss"], "Map H90 and H91 hearing-loss diagnoses; collapse ear laterality while preserving type in the exact title."),
  canonical("amyotrophic_lateral_sclerosis", "Amyotrophic Lateral Sclerosis", "neurology", ["ALS", "Lou Gehrig disease"], "Map G12.21 only; do not merge other motor-neuron diseases."),
  canonical("myasthenia_gravis", "Myasthenia Gravis", "neurology", ["MG"], "Map G70 diagnoses explicitly titled myasthenia gravis; retain crisis status."),
  canonical("hyperthyroidism", "Hyperthyroidism", "endocrinology", ["Thyrotoxicosis"], "Map E05 thyrotoxicosis diagnoses; retain crisis or storm as a high-risk state."),
  canonical("adrenal_insufficiency", "Adrenal Insufficiency", "endocrinology", ["Addison disease", "Adrenocortical insufficiency"], "Map E27 diagnoses explicitly identifying adrenocortical insufficiency or Addisonian crisis."),
  canonical("cerebral_palsy", "Cerebral Palsy", "neurology", ["CP"], "Map G80 cerebral palsy diagnoses; collapse laterality while preserving functional diagnosis wording."),
  canonical("muscular_dystrophy", "Muscular Dystrophy", "neurology", ["Inherited muscular dystrophy"], "Map G71 diagnoses explicitly identifying muscular dystrophy; preserve subtype in the exact title."),
  canonical("visual_impairment", "Visual Impairment", "ophthalmology", ["Low vision", "Blindness"], "Map H54 blindness and low-vision diagnoses; collapse eye laterality while preserving severity category."),
];

export const CLINICAL_MAPPING_RULES = [
  { canonicalConditionId: "lumbar_spinal_stenosis", prefixes: ["M48061", "M48062"] },
  { canonicalConditionId: "cervical_spinal_stenosis", prefixes: ["M4802"] },
  { canonicalConditionId: "lumbar_radiculopathy", prefixes: ["M5416", "M5417"] },
  { canonicalConditionId: "cervical_radiculopathy", prefixes: ["M5412"] },
  { canonicalConditionId: "cervical_disc_disease", prefixes: ["M50"] },
  { canonicalConditionId: "lumbar_disc_disease", prefixes: ["M51"], billableOnly: true, titleIncludesAny: ["lumbar", "lumbosacral"] },
  { canonicalConditionId: "fibromyalgia", prefixes: ["M797"] },
  { canonicalConditionId: "chronic_gout", prefixes: ["M1A"] },
  { canonicalConditionId: "non_pressure_chronic_ulcer", prefixes: ["L97", "L98"], titleIncludesAny: ["non-pressure chronic ulcer"] },
  { canonicalConditionId: "chronic_osteomyelitis", prefixes: ["M86"], titleIncludesAny: ["chronic"] },
  { canonicalConditionId: "chronic_venous_insufficiency", prefixes: ["I872"] },
  { canonicalConditionId: "cirrhosis", prefixes: ["K74"] },
  { canonicalConditionId: "psoriasis", prefixes: ["L40"] },
  { canonicalConditionId: "interstitial_lung_disease", prefixes: ["J84"] },
  { canonicalConditionId: "bronchiectasis", prefixes: ["J47"] },
  { canonicalConditionId: "sickle_cell_disease", prefixes: ["D57"] },
  { canonicalConditionId: "ankylosing_spondylitis", prefixes: ["M45"] },
  { canonicalConditionId: "systemic_lupus_erythematosus", prefixes: ["M32"] },
  { canonicalConditionId: "sarcoidosis", prefixes: ["D86"] },
  { canonicalConditionId: "aortic_aneurysm", prefixes: ["I71"], titleIncludesAny: ["aneurysm"] },
  { canonicalConditionId: "post_traumatic_stress_disorder", prefixes: ["F431"] },
  { canonicalConditionId: "alcohol_use_disorder", prefixes: ["F10"] },
  { canonicalConditionId: "opioid_use_disorder", prefixes: ["F11"] },
  { canonicalConditionId: "nicotine_dependence", prefixes: ["F17"] },
  { canonicalConditionId: "insomnia", prefixes: ["G470", "F510", "F511", "F512", "F513", "F514", "F515"] },
  { canonicalConditionId: "essential_tremor", prefixes: ["G250"] },
  { canonicalConditionId: "benign_prostatic_hyperplasia", prefixes: ["N40"] },
  { canonicalConditionId: "hearing_loss", prefixes: ["H90", "H91"] },
  { canonicalConditionId: "amyotrophic_lateral_sclerosis", prefixes: ["G1221"] },
  { canonicalConditionId: "myasthenia_gravis", prefixes: ["G70"], titleIncludesAny: ["myasthenia gravis"] },
  { canonicalConditionId: "hyperthyroidism", prefixes: ["E05"] },
  { canonicalConditionId: "adrenal_insufficiency", prefixes: ["E27"], titleIncludesAny: ["adrenocortical insufficiency", "addisonian crisis"] },
  { canonicalConditionId: "cerebral_palsy", prefixes: ["G80"] },
  { canonicalConditionId: "muscular_dystrophy", prefixes: ["G71"], titleIncludesAny: ["muscular dystrophy"] },
  { canonicalConditionId: "visual_impairment", prefixes: ["H54"] },
];

export const COMMON_CONDITION_IDS = [
  "essential_hypertension", "type_2_diabetes", "copd", "chronic_heart_failure", "chronic_kidney_disease",
  "hyperlipidemia", "major_depressive_disorder", "osteoarthritis", "atrial_fibrillation", "coronary_artery_disease",
  "obesity", "hypothyroidism", "gerd", "glaucoma", "age_related_macular_degeneration", "chronic_back_pain",
  "peripheral_neuropathy", "dementia", "anemia", "osteoporosis", "malignancy", "chronic_pain", "sleep_apnea",
  "peripheral_vascular_disease",
];

export const ADDITIONAL_REVIEWED_EXISTING_IDS = [
  "multiple_sclerosis", "epilepsy", "inflammatory_bowel_disease", "valvular_heart_disease",
  "asthma", "generalized_anxiety_disorder", "parkinson_disease",
];

const SPINE = ["lumbar_spinal_stenosis", "cervical_spinal_stenosis", "lumbar_radiculopathy", "cervical_radiculopathy", "cervical_disc_disease", "lumbar_disc_disease", "chronic_back_pain"];
const LUMBAR = ["lumbar_spinal_stenosis", "lumbar_radiculopathy", "lumbar_disc_disease", "chronic_back_pain"];
const CERVICAL = ["cervical_spinal_stenosis", "cervical_radiculopathy", "cervical_disc_disease"];
const INFLAMMATORY = ["chronic_gout", "ankylosing_spondylitis", "systemic_lupus_erythematosus", "psoriasis", "rheumatoid_arthritis", "inflammatory_bowel_disease"];
const NEUROMUSCULAR = ["amyotrophic_lateral_sclerosis", "myasthenia_gravis", "cerebral_palsy", "muscular_dystrophy", "multiple_sclerosis"];
const PULMONARY = ["interstitial_lung_disease", "bronchiectasis", "sarcoidosis", "copd", "asthma", "chronic_respiratory_failure"];
const SUBSTANCE = ["alcohol_use_disorder", "opioid_use_disorder", "nicotine_dependence"];
const VASCULAR = ["chronic_venous_insufficiency", "peripheral_vascular_disease"];
const VISION = ["visual_impairment", "glaucoma", "age_related_macular_degeneration"];

function yesNoQuestion(id, text, sources, clinicalRationale, options = {}) {
  const urgency = options.urgency;
  const followUpTriggers = urgency ? [{
    id: `${id.replaceAll(".", "-")}-yes`,
    when: { operator: "equals", value: true },
    actions: [{ type: "flag_for_review", code: options.code ?? id.replace(/^ccm\./, "").replaceAll(".", "_"), urgency, providerNotification: options.providerNotification ?? urgency !== "routine" }],
  }] : [];
  if (options.showQuestionIds?.length) followUpTriggers.push({
    id: `${id.replaceAll(".", "-")}-branch`,
    when: { operator: "equals", value: true },
    actions: [{ type: "show_questions", questionIds: options.showQuestionIds }],
  });
  if (options.task) followUpTriggers.push({
    id: `${id.replaceAll(".", "-")}-task`,
    when: { operator: "equals", value: true },
    actions: [{ type: "create_care_coordination_task", code: options.task.code, urgency: options.task.urgency ?? "routine" }],
  });
  return {
    id,
    category: options.category ?? "symptoms",
    text,
    helperText: options.helperText ?? "Answer yes if this has occurred since the last contact.",
    answerType: "yes_no",
    required: false,
    validation: {},
    clinicalRationale,
    billingRelevance: "Supports condition-specific longitudinal assessment and care coordination.",
    contexts: options.contexts ?? MONTHLY_CONTEXTS,
    conditionIds: [],
    tags: [...(options.tags ?? []), ...(urgency === "same_day" || urgency === "urgent" ? ["red_flag"] : urgency ? ["provider_follow_up"] : [])],
    displayWhen: options.displayWhen ?? [],
    followUpTriggers,
    previousVersions: [],
    version: 1,
    sourceCanonicalConditionIds: sources,
    followUpBehavior: urgency ? `A yes response creates a ${urgency} clinical-review flag.` : options.followUpBehavior ?? "Review a yes response during routine CCM follow-up.",
    reviewStatus: "DRAFT_CLINICAL_REVIEW",
    contentVersion: 1,
  };
}

function selectQuestion(id, text, values, sources, clinicalRationale, options = {}) {
  return {
    ...yesNoQuestion(id, text, sources, clinicalRationale, options),
    answerType: "single_select",
    validation: { options: values.map((value) => ({ value, label: value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()) })) },
    helperText: options.helperText ?? "Choose the answer that best fits today.",
    followUpTriggers: options.followUpTriggers ?? [],
    followUpBehavior: options.followUpBehavior ?? "Review worsening or high-burden responses during routine CCM follow-up.",
  };
}

export const CLINICAL_QUESTIONS = [
  yesNoQuestion("ccm.treatment.plan_barrier", "Is anything making it difficult to follow the care plan for this condition?", [...NEW_CANONICAL_CONDITIONS.map((item) => item.id), ...COMMON_CONDITION_IDS], "Identifies adherence, access, understanding, and feasibility barriers without assuming a specific treatment.", { category: "care_coordination", task: { code: "condition_care_plan_barrier" }, followUpBehavior: "A yes response creates a routine coordinator task to identify and address the barrier." }),
  yesNoQuestion("ccm.specialist.visit_change", "Has a specialist changed this condition's treatment plan since the last contact?", [...NEW_CANONICAL_CONDITIONS.map((item) => item.id), ...COMMON_CONDITION_IDS], "Captures treatment changes that may require medication reconciliation or care-plan updates.", { category: "specialist_follow_up", task: { code: "specialist_plan_reconciliation" }, followUpBehavior: "A yes response creates a routine coordinator task to reconcile the updated specialist plan." }),
  selectQuestion("ccm.spine.walking_tolerance", "Compared with the last review, how has the distance you can walk before symptoms start changed?", ["improved", "about_the_same", "shorter_distance", "not_applicable"], LUMBAR, "Tracks neurogenic claudication and functional change using a repeatable patient-reported measure."),
  yesNoQuestion("ccm.spine.leg_symptoms_standing", "Do pain, numbness, or heaviness in your legs start or worsen when you stand or walk?", LUMBAR, "Identifies posture- and activity-related lower-extremity symptoms characteristic of lumbar nerve compression."),
  yesNoQuestion("ccm.spine.relief_with_flexion", "Do your leg symptoms improve when you sit or bend forward?", ["lumbar_spinal_stenosis"], "Distinguishes the flexion-relieved pattern associated with neurogenic claudication."),
  yesNoQuestion("ccm.neuro.new_weakness", "Have you developed new or worsening weakness in an arm or leg?", [...SPINE, ...NEUROMUSCULAR], "Screens for neurologic progression that may require prompt clinical assessment.", { urgency: "same_day", code: "new_or_worsening_limb_weakness" }),
  yesNoQuestion("ccm.spine.bowel_bladder_change", "Have you had a new loss of bowel or bladder control?", SPINE, "Screens for possible severe neural compression requiring urgent evaluation.", { urgency: "urgent", code: "new_bowel_or_bladder_loss", showQuestionIds: ["ccm.spine.saddle_numbness"] }),
  yesNoQuestion("ccm.spine.saddle_numbness", "Have you had new numbness around the groin, buttocks, or inner thighs?", SPINE, "Adds a focused follow-up for possible cauda equina or severe cord compression.", { urgency: "urgent", code: "new_saddle_numbness", displayWhen: [{ questionId: "ccm.spine.bowel_bladder_change", operator: "equals", value: true }] }),
  yesNoQuestion("ccm.cervical.hand_dexterity", "Have buttons, handwriting, utensils, or other hand tasks become harder?", CERVICAL, "Tracks hand dexterity change associated with cervical nerve or cord dysfunction."),
  yesNoQuestion("ccm.neuro.balance_change", "Has your balance become worse since the last review?", [...CERVICAL, ...NEUROMUSCULAR, "essential_tremor", "peripheral_neuropathy"], "Detects neurologic functional decline and increased fall risk."),
  selectQuestion("ccm.spine.radiating_pain_change", "How has pain traveling into an arm or leg changed since the last review?", ["better", "about_the_same", "worse", "not_present"], ["lumbar_radiculopathy", "cervical_radiculopathy", "cervical_disc_disease", "lumbar_disc_disease"], "Tracks radicular symptom trajectory separately from general pain severity."),
  yesNoQuestion("ccm.spine.therapy_progress", "Are you currently doing prescribed exercises or physical therapy for your spine condition?", SPINE, "Assesses engagement with a commonly used nonprocedural management plan without assuming it was prescribed."),
  yesNoQuestion("ccm.spine.procedure_planned", "Is an injection, imaging study, or spine consultation pending?", SPINE, "Identifies time-sensitive coordination needs for planned diagnostic or procedural care.", { category: "care_coordination" }),
  selectQuestion("ccm.inflammatory.flare_change", "Compared with the last review, how have condition flares changed?", ["fewer_or_milder", "about_the_same", "more_or_worse", "no_flares"], INFLAMMATORY, "Tracks inflammatory disease activity without combining separate symptoms into one diagnostic assumption."),
  yesNoQuestion("ccm.inflammatory.swelling", "Have you had new or worsening joint swelling?", ["chronic_gout", "ankylosing_spondylitis", "systemic_lupus_erythematosus", "rheumatoid_arthritis"], "Identifies a change in inflammatory joint activity."),
  yesNoQuestion("ccm.inflammatory.infection_signs", "Have you had a fever or other infection concern while using immune-suppressing treatment?", INFLAMMATORY, "Screens for infection concerns when immune-suppressing treatment is actually in use.", { urgency: "same_day", code: "infection_concern_on_immunosuppression", helperText: "Answer no if you are not using an immune-suppressing treatment." }),
  selectQuestion("ccm.gout.flare_frequency", "How many gout flares have you had since the last review?", ["none", "one", "two_or_more"], ["chronic_gout"], "Measures recent gout activity using a deterministic frequency range."),
  yesNoQuestion("ccm.gout.tophus_change", "Have any gout lumps or tophi become larger, painful, or opened?", ["chronic_gout"], "Monitors clinically relevant tophus change and skin breakdown."),
  yesNoQuestion("ccm.psoriasis.skin_change", "Have your psoriasis patches become more widespread or uncomfortable?", ["psoriasis"], "Tracks skin disease burden in patient-appropriate language."),
  yesNoQuestion("ccm.lupus.organ_concern", "Has a clinician told you there is new organ involvement from lupus?", ["systemic_lupus_erythematosus"], "Captures confirmed management-changing organ involvement without asking the patient to diagnose it."),
  yesNoQuestion("ccm.fibromyalgia.recovery", "Do your symptoms make recovery after usual activity take longer?", ["fibromyalgia"], "Assesses post-activity symptom burden without treating fatigue as a diagnosis."),
  yesNoQuestion("ccm.wound.size_depth_change", "Has the wound become larger or deeper since the last review?", ["non_pressure_chronic_ulcer", "pressure_ulcer", "chronic_osteomyelitis"], "Tracks wound progression using observable change."),
  yesNoQuestion("ccm.wound.drainage_odor", "Has drainage or odor from the wound increased?", ["non_pressure_chronic_ulcer", "pressure_ulcer", "chronic_osteomyelitis"], "Screens for worsening local wound burden."),
  yesNoQuestion("ccm.wound.infection_red_flag", "Do you have spreading redness, warmth, or fever with the wound?", ["non_pressure_chronic_ulcer", "pressure_ulcer", "chronic_osteomyelitis"], "Screens for possible spreading infection requiring prompt review.", { urgency: "same_day", code: "possible_wound_infection" }),
  yesNoQuestion("ccm.wound.dressing_access", "Do you have the supplies and help needed for wound care?", ["non_pressure_chronic_ulcer", "pressure_ulcer", "chronic_osteomyelitis"], "Identifies supply or caregiver barriers that can delay healing.", { category: "care_coordination", task: { code: "wound_care_supply_or_help" } }),
  yesNoQuestion("ccm.wound.appointment_pending", "Is a wound, podiatry, vascular, or infectious-disease visit overdue?", ["non_pressure_chronic_ulcer", "pressure_ulcer", "chronic_osteomyelitis"], "Identifies overdue specialty follow-up relevant to wound healing.", { category: "specialist_follow_up" }),
  selectQuestion("ccm.pulmonary.breathing_change", "Compared with the last review, how has your breathing during usual activity changed?", ["better", "about_the_same", "worse"], PULMONARY, "Tracks respiratory trajectory during ordinary activity."),
  yesNoQuestion("ccm.pulmonary.cough_sputum_change", "Has your cough or mucus changed from your usual pattern?", PULMONARY, "Detects a change that may indicate pulmonary exacerbation or infection."),
  yesNoQuestion("ccm.pulmonary.urgent_breathing", "Are you short of breath at rest or unable to speak comfortably because of breathing difficulty?", PULMONARY, "Screens for severe respiratory compromise.", { urgency: "urgent", code: "severe_breathing_difficulty" }),
  yesNoQuestion("ccm.pulmonary.oxygen_issue", "If you use oxygen, is a device or supply problem keeping you from using it as directed?", ["interstitial_lung_disease", "bronchiectasis", "sarcoidosis", "copd", "chronic_respiratory_failure"], "Identifies oxygen equipment-access barriers without assuming oxygen use.", { category: "care_coordination", task: { code: "oxygen_equipment_or_supply_barrier", urgency: "soon" } }),
  yesNoQuestion("ccm.pulmonary.flare_treatment", "Have you needed an unplanned breathing treatment, antibiotic, or steroid since the last review?", ["bronchiectasis", "copd", "asthma", "interstitial_lung_disease"], "Captures exacerbation treatment and potential medication reconciliation needs."),
  yesNoQuestion("ccm.liver.abdominal_swelling", "Has your abdomen become more swollen?", ["cirrhosis"], "Screens for increasing ascites burden."),
  yesNoQuestion("ccm.liver.confusion", "Have you or someone close to you noticed new confusion or unusual sleepiness?", ["cirrhosis"], "Screens for possible hepatic encephalopathy or other acute change.", { urgency: "same_day", code: "new_confusion_with_cirrhosis" }),
  yesNoQuestion("ccm.liver.bleeding_red_flag", "Have you vomited blood or passed black, tar-like stool?", ["cirrhosis", "gerd"], "Screens for possible gastrointestinal bleeding requiring urgent evaluation.", { urgency: "urgent", code: "possible_gastrointestinal_bleeding" }),
  yesNoQuestion("ccm.liver.jaundice_change", "Have your eyes or skin become more yellow?", ["cirrhosis"], "Tracks visible change that may reflect worsening liver dysfunction.", { urgency: "same_day", code: "worsening_jaundice" }),
  yesNoQuestion("ccm.liver.appetite_weight", "Have poor appetite or unplanned weight loss made eating enough difficult?", ["cirrhosis", "malignancy", "inflammatory_bowel_disease"], "Identifies nutrition risk needing care-plan follow-up.", { category: "nutrition" }),
  yesNoQuestion("ccm.sickle.pain_crisis", "Have you had a sickle-cell pain crisis since the last review?", ["sickle_cell_disease"], "Tracks a major disease-specific acute event."),
  yesNoQuestion("ccm.sickle.fever", "Do you have a fever now or have you had one with new illness symptoms?", ["sickle_cell_disease"], "Screens for infection risk requiring prompt assessment in sickle cell disease.", { urgency: "urgent", code: "fever_with_sickle_cell_disease" }),
  yesNoQuestion("ccm.sickle.chest_symptoms", "Have you had new chest pain or new breathing difficulty?", ["sickle_cell_disease"], "Screens for possible acute chest syndrome or another urgent cardiopulmonary problem.", { urgency: "urgent", code: "possible_acute_chest_syndrome" }),
  yesNoQuestion("ccm.hematology.lab_followup", "Is a blood-count test, infusion, or hematology visit overdue?", ["sickle_cell_disease", "anemia", "malignancy"], "Identifies overdue monitoring or treatment coordination.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.vascular.walking_leg_pain", "Do leg symptoms make you stop when walking and improve with rest?", ["peripheral_vascular_disease"], "Screens for activity-related claudication burden."),
  yesNoQuestion("ccm.vascular.rest_pain", "Do you have foot or leg pain while resting, especially at night?", ["peripheral_vascular_disease"], "Screens for possible advanced limb ischemia.", { urgency: "same_day", code: "vascular_rest_pain" }),
  yesNoQuestion("ccm.vascular.foot_wound", "Do you have a foot or leg sore that is new or not healing?", [...VASCULAR, "type_2_diabetes", "peripheral_neuropathy"], "Identifies skin breakdown with vascular, diabetes-related, or sensory-loss healing risk.", { urgency: "same_day", code: "new_or_nonhealing_foot_wound" }),
  yesNoQuestion("ccm.venous.swelling_skin", "Has leg swelling or skin discoloration from venous disease worsened?", ["chronic_venous_insufficiency"], "Tracks venous congestion and skin-change burden."),
  yesNoQuestion("ccm.aorta.new_pain", "Have you had sudden severe chest, back, or abdominal pain?", ["aortic_aneurysm"], "Screens for a symptom pattern requiring emergency evaluation in a patient with aortic aneurysm.", { urgency: "urgent", code: "possible_aortic_emergency" }),
  yesNoQuestion("ccm.aorta.surveillance_due", "Is imaging or a vascular follow-up for the aneurysm overdue?", ["aortic_aneurysm"], "Identifies missed surveillance or specialty follow-up.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.aorta.bp_plan", "Have you had trouble following the blood-pressure plan given for the aneurysm?", ["aortic_aneurysm"], "Identifies a management barrier without prescribing a target or treatment."),
  selectQuestion("ccm.mental.trauma_change", "Compared with the last review, how have trauma-related symptoms changed?", ["better", "about_the_same", "worse"], ["post_traumatic_stress_disorder"], "Tracks PTSD symptom trajectory without requiring disclosure of traumatic details."),
  yesNoQuestion("ccm.mental.safety_thoughts", "Have you had thoughts of harming yourself or that you would be better off dead?", ["post_traumatic_stress_disorder", "major_depressive_disorder", "bipolar_disorder", "schizophrenia"], "Screens for an urgent behavioral-health safety concern.", { urgency: "urgent", code: "self_harm_thoughts" }),
  yesNoQuestion("ccm.substance.use_since_contact", "Have you used the substance related to this diagnosis since the last contact?", SUBSTANCE, "Tracks current use without judgment and supports treatment planning."),
  selectQuestion("ccm.substance.craving_change", "Compared with the last review, how have cravings changed?", ["less", "about_the_same", "more", "none"], SUBSTANCE, "Tracks relapse risk using a deterministic response set."),
  yesNoQuestion("ccm.substance.withdrawal_red_flag", "Are you having severe shaking, confusion, hallucinations, or a seizure while cutting down or stopping?", ["alcohol_use_disorder", "opioid_use_disorder"], "Screens for potentially dangerous withdrawal symptoms.", { urgency: "urgent", code: "severe_withdrawal_symptoms" }),
  yesNoQuestion("ccm.substance.treatment_access", "Have you had trouble getting counseling, recovery support, or prescribed treatment?", SUBSTANCE, "Identifies access barriers to ongoing substance-use treatment.", { category: "care_coordination" }),
  yesNoQuestion("ccm.tobacco.quit_support", "Would support for reducing or stopping nicotine use be helpful now?", ["nicotine_dependence"], "Identifies readiness for support without assuming a quit attempt."),
  selectQuestion("ccm.sleep.insomnia_change", "Compared with the last review, how has your ability to fall asleep or stay asleep changed?", ["better", "about_the_same", "worse"], ["insomnia"], "Tracks insomnia trajectory."),
  yesNoQuestion("ccm.sleep.daytime_impact", "Is poor sleep making daytime activities harder?", ["insomnia", "sleep_apnea", "fibromyalgia"], "Assesses functional impact of sleep disturbance."),
  yesNoQuestion("ccm.sleep.treatment_barrier", "Have you had trouble following the sleep treatment plan?", ["insomnia", "sleep_apnea"], "Identifies practical or tolerance barriers without assuming a particular treatment."),
  yesNoQuestion("ccm.neuro.swallow_breathe", "Have swallowing or breathing become newly difficult because of muscle weakness?", NEUROMUSCULAR, "Screens for bulbar or respiratory decline in neuromuscular disease.", { urgency: "urgent", code: "neuromuscular_swallowing_or_breathing_decline" }),
  yesNoQuestion("ccm.neuro.assistive_device", "Do you need a mobility or communication device repaired or replaced?", NEUROMUSCULAR, "Identifies equipment needs that affect safety and independence.", { category: "care_coordination", task: { code: "assistive_device_repair_or_replacement" } }),
  yesNoQuestion("ccm.neuro.transfer_change", "Has getting in or out of bed, a chair, or a vehicle become harder?", NEUROMUSCULAR, "Tracks functional decline relevant to caregiver and therapy planning."),
  yesNoQuestion("ccm.tremor.daily_tasks", "Is tremor making eating, drinking, writing, or dressing harder?", ["essential_tremor"], "Measures functional impact of tremor."),
  yesNoQuestion("ccm.tremor.medication_effect", "If you use treatment for tremor, is it wearing off or causing a problem?", ["essential_tremor"], "Assesses treatment effectiveness and adverse effects without assuming medication use."),
  selectQuestion("ccm.parkinson.mobility_change", "Compared with the last review, how has your walking changed?", ["better", "about_the_same", "worse"], ["parkinson_disease"], "Tracks Parkinson-related mobility change with low cognitive load.", { followUpTriggers: [{ id: "parkinson-mobility-worse", when: { operator: "equals", value: "worse" }, actions: [{ type: "flag_for_review", code: "parkinson_mobility_worse", urgency: "soon", providerNotification: true }] }], followUpBehavior: "A worse response creates a soon provider-review flag." }),
  yesNoQuestion("ccm.parkinson.wearing_off", "If you use Parkinson medicine, does its benefit wear off before the next dose?", ["parkinson_disease"], "Identifies a treatment-timing problem without assuming a particular medicine.", { urgency: "soon", code: "parkinson_treatment_wearing_off" }),
  yesNoQuestion("ccm.parkinson.swallowing", "Have you had new trouble swallowing food or drinks?", ["parkinson_disease"], "Screens for swallowing decline that may increase aspiration and nutrition risk.", { urgency: "same_day", code: "new_swallowing_difficulty_parkinson" }),
  yesNoQuestion("ccm.seizure.event", "Have you had a seizure since the last review?", ["epilepsy"], "Tracks the core disease event for epilepsy.", { urgency: "same_day", code: "breakthrough_seizure" }),
  yesNoQuestion("ccm.seizure.rescue_plan", "Do you or your caregiver need help understanding or obtaining the seizure rescue plan?", ["epilepsy"], "Identifies education or access gaps for an established rescue plan.", { category: "care_coordination" }),
  yesNoQuestion("ccm.dementia.safety_change", "Has a new safety concern come up because of changes in memory or thinking?", ["dementia"], "Screens for changes in daily safety that may require caregiver or clinician action.", { urgency: "soon", code: "new_cognitive_safety_concern" }),
  yesNoQuestion("ccm.dementia.caregiver_strain", "Does the caregiver need more help to safely carry out the care plan?", ["dementia"], "Identifies caregiver support needs affecting plan feasibility.", { category: "care_coordination", task: { code: "dementia_caregiver_support" } }),
  yesNoQuestion("ccm.urinary.emptying", "Have you been unable to empty your bladder or unable to urinate?", ["benign_prostatic_hyperplasia"], "Screens for urinary retention requiring prompt evaluation.", { urgency: "same_day", code: "possible_urinary_retention" }),
  selectQuestion("ccm.urinary.nocturia", "How many times do you usually get up to urinate at night?", ["none", "one", "two", "three_or_more"], ["benign_prostatic_hyperplasia"], "Measures nocturia burden using a deterministic range."),
  yesNoQuestion("ccm.urinary.symptom_change", "Has urine flow or the feeling of incomplete emptying worsened?", ["benign_prostatic_hyperplasia"], "Tracks lower-urinary-tract symptom change."),
  yesNoQuestion("ccm.hearing.change", "Has your ability to hear conversations changed since the last review?", ["hearing_loss"], "Tracks functionally meaningful hearing change."),
  yesNoQuestion("ccm.hearing.device_issue", "If you use a hearing device, is a device problem limiting its use?", ["hearing_loss"], "Identifies hearing-device barriers without assuming use.", { category: "care_coordination", task: { code: "hearing_device_support" } }),
  yesNoQuestion("ccm.hearing.communication_barrier", "Is hearing difficulty preventing you from understanding health instructions or phone calls?", ["hearing_loss"], "Identifies a communication-access risk affecting care coordination."),
  yesNoQuestion("ccm.vision.sudden_change", "Have you had a sudden loss of vision or a new dark curtain over your vision?", VISION, "Screens for an urgent vision change.", { urgency: "urgent", code: "sudden_vision_loss" }),
  yesNoQuestion("ccm.vision.daily_tasks", "Is vision loss making any daily activity unsafe?", VISION, "Assesses functional and safety impact of visual impairment."),
  yesNoQuestion("ccm.vision.treatment_barrier", "Is anything preventing you from following your eye-care plan?", VISION, "Identifies treatment and appointment barriers without assuming a specific therapy.", { category: "care_coordination", task: { code: "eye_care_plan_barrier" } }),
  yesNoQuestion("ccm.endocrine.heart_racing", "Have you had new episodes of a racing or irregular heartbeat?", ["hyperthyroidism", "atrial_fibrillation"], "Screens for a potentially important rhythm symptom.", { urgency: "same_day", code: "new_racing_or_irregular_heartbeat" }),
  yesNoQuestion("ccm.thyroid.lab_due", "Is a thyroid blood test or thyroid follow-up overdue?", ["hyperthyroidism", "hypothyroidism"], "Identifies overdue monitoring.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.adrenal.missed_steroid", "If you use steroid replacement, have you missed doses or had trouble obtaining it?", ["adrenal_insufficiency"], "Identifies interruption of essential replacement therapy without assuming use."),
  yesNoQuestion("ccm.adrenal.vomiting_red_flag", "Are vomiting or severe illness keeping you from taking your adrenal medicine?", ["adrenal_insufficiency"], "Screens for adrenal-crisis risk during intercurrent illness.", { urgency: "urgent", code: "possible_adrenal_crisis_risk" }),
  yesNoQuestion("ccm.adrenal.sick_day_plan", "Do you need help understanding your sick-day or emergency steroid plan?", ["adrenal_insufficiency"], "Identifies an education or access gap for an established emergency plan.", { category: "care_coordination", task: { code: "adrenal_emergency_plan_education", urgency: "soon" } }),
  yesNoQuestion("ccm.cardiac.chest_discomfort", "Have you had new or worsening chest pressure or discomfort?", ["coronary_artery_disease", "valvular_heart_disease", "chronic_heart_failure"], "Screens for a potentially urgent cardiac symptom.", { urgency: "urgent", code: "new_or_worsening_chest_discomfort" }),
  yesNoQuestion("ccm.cardiac.fainting", "Have you fainted or nearly fainted since the last review?", ["atrial_fibrillation", "valvular_heart_disease", "aortic_aneurysm"], "Screens for hemodynamic or rhythm-related instability.", { urgency: "same_day", code: "syncope_or_near_syncope" }),
  yesNoQuestion("ccm.anticoag.bleeding", "If you use a blood thinner, have you had unusual bleeding or large unexplained bruises?", ["atrial_fibrillation", "coronary_artery_disease", "valvular_heart_disease"], "Screens for anticoagulant harm without assuming use.", { urgency: "same_day", code: "possible_anticoagulant_bleeding" }),
  yesNoQuestion("ccm.ckd.lab_due", "Is a kidney blood test or urine test overdue?", ["chronic_kidney_disease"], "Identifies overdue kidney-function or albumin monitoring.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.ckd.swelling_change", "Has swelling in your legs, feet, or around your eyes increased?", ["chronic_kidney_disease", "chronic_heart_failure"], "Tracks possible fluid-balance change."),
  yesNoQuestion("ccm.diabetes.high_pattern", "Have glucose readings been above the range in your care plan more often than usual?", ["type_1_diabetes", "type_2_diabetes", "secondary_diabetes_mellitus"], "Tracks worsening hyperglycemia against the patient's established plan rather than prescribing a target."),
  yesNoQuestion("ccm.lipid.lab_due", "Is a cholesterol test or lipid follow-up overdue?", ["hyperlipidemia"], "Identifies overdue monitoring.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.gerd.swallowing", "Has food felt stuck when you swallow?", ["gerd"], "Screens for an alarm symptom needing prompt assessment.", { urgency: "same_day", code: "new_dysphagia" }),
  yesNoQuestion("ccm.anemia.symptom_change", "Has anemia made your usual activities harder since the last review?", ["anemia"], "Tracks clinically meaningful anemia symptom burden.", { urgency: "soon", code: "worsening_anemia_function" }),
  yesNoQuestion("ccm.osteoporosis.new_fracture", "Have you been told you have a new fracture since the last review?", ["osteoporosis"], "Captures a management-changing fracture event.", { urgency: "soon", code: "new_fracture" }),
  yesNoQuestion("ccm.osteoporosis.treatment_barrier", "Have you had trouble taking or receiving your osteoporosis treatment?", ["osteoporosis"], "Identifies adherence or access barriers without assuming treatment type."),
  yesNoQuestion("ccm.cancer.treatment_change", "Has cancer treatment started, stopped, or changed since the last review?", ["malignancy"], "Captures a major care-plan and medication-reconciliation event."),
  yesNoQuestion("ccm.cancer.new_symptom", "Has a new symptom appeared that your cancer team does not yet know about?", ["malignancy"], "Prompts timely oncology communication without diagnosing the symptom.", { urgency: "soon", code: "new_oncology_symptom" }),
  yesNoQuestion("ccm.osa.device_use", "If you use a sleep-apnea device, have you been able to use it on most nights?", ["sleep_apnea"], "Assesses adherence without assuming device use."),
  yesNoQuestion("ccm.osa.device_barrier", "Is a device or supply problem limiting your sleep-apnea treatment?", ["sleep_apnea"], "Identifies common treatment barriers.", { category: "care_coordination", task: { code: "sleep_apnea_device_or_supply_barrier" } }),
  yesNoQuestion("ccm.weight.plan_barrier", "Is there a barrier making the agreed weight-management plan hard to follow?", ["obesity"], "Identifies plan feasibility without stigmatizing language or prescribing a goal.", { category: "care_coordination", task: { code: "weight_plan_barrier" } }),
  yesNoQuestion("ccm.arthritis.stiffness_change", "Has joint stiffness made daily movement harder since the last review?", ["osteoarthritis", "rheumatoid_arthritis", "ankylosing_spondylitis"], "Tracks functional burden from stiffness."),
  yesNoQuestion("ccm.neuropathy.sensation_change", "Has numbness, burning, or tingling in your hands or feet worsened?", ["peripheral_neuropathy"], "Tracks sensory neuropathy change."),
  yesNoQuestion("ccm.valve.procedure_plan", "Is a heart-valve test, procedure, or cardiology decision pending?", ["valvular_heart_disease"], "Identifies coordination needs around valve surveillance or intervention.", { category: "specialist_follow_up" }),
  yesNoQuestion("ccm.ibd.stool_change", "Have bowel movements become more frequent or contained blood?", ["inflammatory_bowel_disease"], "Tracks a potentially important change in inflammatory bowel disease.", { urgency: "same_day", code: "ibd_blood_or_frequency_change" }),
];

const PLAN_CONTEXTS = ["intake", "care_plan_review", "annual_review"];
const q = (id, level = "recommended", contexts) => [id, level, undefined, contexts];
const goal = () => q("ccm.goal.priority", "optional", PLAN_CONTEXTS);

export const QUALITY_BANK_OVERRIDES = {
  essential_hypertension: [q("ccm.general.health_change", "required"), q("ccm.bp.latest_systolic"), q("ccm.bp.monitoring_barrier"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.specialist.visit_change", "optional"), goal()],
  type_2_diabetes: [q("ccm.general.health_change", "required"), q("ccm.diabetes.latest_glucose"), q("ccm.diabetes.high_pattern"), q("ccm.diabetes.low_episode"), q("ccm.diabetes.foot_concern"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty"), goal()],
  chronic_heart_failure: [q("ccm.general.health_change", "required"), q("ccm.chf.rapid_weight_gain"), q("ccm.chf.swelling_change"), q("ccm.symptom.shortness_of_breath"), q("ccm.cardiac.chest_discomfort"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty"), q("ccm.bp.latest_systolic", "optional"), goal()],
  chronic_kidney_disease: [q("ccm.general.health_change", "required"), q("ccm.ckd.lab_due"), q("ccm.ckd.swelling_change"), q("ccm.bp.latest_systolic"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty", "optional"), goal()],
  copd: [q("ccm.general.health_change", "required"), q("ccm.pulmonary.breathing_change"), q("ccm.pulmonary.cough_sputum_change"), q("ccm.pulmonary.urgent_breathing"), q("ccm.pulmonary.flare_treatment"), q("ccm.copd.rescue_inhaler_use"), q("ccm.medication.has_issue"), q("ccm.function.daily_activity_difficulty"), q("ccm.pulmonary.oxygen_issue", "optional"), q("ccm.specialist.visit_change", "optional"), goal()],
  asthma: [q("ccm.general.health_change", "required"), q("ccm.symptom.shortness_of_breath"), q("ccm.asthma.rescue_frequency"), q("ccm.pulmonary.urgent_breathing"), q("ccm.pulmonary.flare_treatment"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty", "optional"), goal()],
  coronary_artery_disease: [q("ccm.general.health_change", "required"), q("ccm.cardiac.chest_discomfort"), q("ccm.function.daily_activity_difficulty"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.bp.latest_systolic"), q("ccm.anticoag.bleeding", "optional"), q("ccm.specialist.visit_change", "optional"), goal()],
  atrial_fibrillation: [q("ccm.general.health_change", "required"), q("ccm.endocrine.heart_racing"), q("ccm.cardiac.fainting"), q("ccm.anticoag.bleeding"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.bp.latest_systolic", "optional"), q("ccm.specialist.visit_change", "optional"), goal()],
  peripheral_vascular_disease: [q("ccm.general.health_change", "required"), q("ccm.vascular.walking_leg_pain"), q("ccm.vascular.rest_pain"), q("ccm.vascular.foot_wound"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty"), q("ccm.falls.had_fall", "optional"), goal()],
  hyperlipidemia: [q("ccm.general.health_change", "required"), q("ccm.lipid.lab_due"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.nutrition.food_access", "optional"), goal()],
  osteoarthritis: [q("ccm.general.health_change", "required"), q("ccm.pain.severity"), q("ccm.pain.function_interference"), q("ccm.arthritis.stiffness_change"), q("ccm.falls.had_fall"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), goal()],
  glaucoma: [q("ccm.general.health_change", "required"), q("ccm.vision.sudden_change"), q("ccm.vision.daily_tasks"), q("ccm.vision.treatment_barrier"), q("ccm.specialist.pending_followup", "optional"), goal()],
  age_related_macular_degeneration: [q("ccm.general.health_change", "required"), q("ccm.vision.sudden_change"), q("ccm.vision.daily_tasks"), q("ccm.vision.treatment_barrier"), q("ccm.falls.had_fall", "optional"), q("ccm.transportation.barrier", "optional"), q("ccm.specialist.pending_followup", "optional"), goal()],
  major_depressive_disorder: [q("ccm.general.health_change", "required"), q("ccm.mental.mood_frequency"), q("ccm.mental.safety_thoughts"), q("ccm.function.daily_activity_difficulty"), q("ccm.sleep.quality"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), goal()],
  generalized_anxiety_disorder: [q("ccm.general.health_change", "required"), q("ccm.mental.anxiety_frequency"), q("ccm.function.daily_activity_difficulty"), q("ccm.sleep.quality"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), goal()],
  dementia: [q("ccm.general.health_change", "required"), q("ccm.dementia.safety_change"), q("ccm.dementia.caregiver_strain"), q("ccm.function.daily_activity_difficulty"), q("ccm.falls.had_fall"), q("ccm.medication.has_issue"), q("ccm.specialist.pending_followup", "optional"), goal()],
  parkinson_disease: [q("ccm.general.health_change", "required"), q("ccm.parkinson.mobility_change"), q("ccm.parkinson.wearing_off"), q("ccm.parkinson.swallowing"), q("ccm.falls.had_fall"), q("ccm.function.daily_activity_difficulty"), q("ccm.medication.has_issue"), q("ccm.specialist.pending_followup", "optional"), goal()],
  peripheral_neuropathy: [q("ccm.general.health_change", "required"), q("ccm.neuropathy.sensation_change"), q("ccm.neuro.balance_change"), q("ccm.vascular.foot_wound"), q("ccm.falls.had_fall"), q("ccm.function.daily_activity_difficulty"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.sleep.quality", "optional"), goal()],
  chronic_back_pain: [q("ccm.general.health_change", "required"), q("ccm.pain.severity"), q("ccm.pain.function_interference"), q("ccm.neuro.new_weakness"), q("ccm.spine.bowel_bladder_change"), q("ccm.spine.saddle_numbness", "optional"), q("ccm.spine.therapy_progress"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.falls.had_fall", "optional"), q("ccm.spine.procedure_planned", "optional"), goal()],
  lumbar_spinal_stenosis: [q("ccm.general.health_change", "required"), q("ccm.spine.walking_tolerance"), q("ccm.spine.leg_symptoms_standing"), q("ccm.neuro.new_weakness"), q("ccm.spine.bowel_bladder_change"), q("ccm.spine.saddle_numbness", "optional"), q("ccm.spine.therapy_progress"), q("ccm.pain.function_interference"), q("ccm.falls.had_fall"), q("ccm.medication.has_issue"), q("ccm.spine.procedure_planned", "optional"), goal()],
  fibromyalgia: [q("ccm.general.health_change", "required"), q("ccm.pain.severity"), q("ccm.pain.function_interference"), q("ccm.fibromyalgia.recovery"), q("ccm.sleep.daytime_impact"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), goal()],
  obesity: [q("ccm.general.health_change", "required"), q("ccm.weight.plan_barrier"), q("ccm.goal.progress"), q("ccm.nutrition.food_access"), q("ccm.function.daily_activity_difficulty", "optional"), q("ccm.medication.has_issue", "optional"), goal()],
  hypothyroidism: [q("ccm.general.health_change", "required"), q("ccm.thyroid.lab_due"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.function.daily_activity_difficulty", "optional"), q("ccm.specialist.pending_followup", "optional"), goal()],
  gerd: [q("ccm.general.health_change", "required"), q("ccm.gerd.swallowing"), q("ccm.liver.bleeding_red_flag"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.specialist.pending_followup", "optional"), goal()],
  anemia: [q("ccm.general.health_change", "required"), q("ccm.anemia.symptom_change"), q("ccm.hematology.lab_followup"), q("ccm.function.daily_activity_difficulty"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.hospital.had_admission", "optional"), goal()],
  osteoporosis: [q("ccm.general.health_change", "required"), q("ccm.osteoporosis.new_fracture"), q("ccm.falls.had_fall"), q("ccm.osteoporosis.treatment_barrier"), q("ccm.medication.has_issue"), q("ccm.pain.severity", "optional"), q("ccm.function.daily_activity_difficulty", "optional"), goal()],
  malignancy: [q("ccm.general.health_change", "required"), q("ccm.cancer.new_symptom"), q("ccm.cancer.treatment_change"), q("ccm.liver.appetite_weight"), q("ccm.hematology.lab_followup", "optional"), q("ccm.medication.has_issue"), q("ccm.function.daily_activity_difficulty"), q("ccm.specialist.pending_followup"), goal()],
  chronic_pain: [q("ccm.general.health_change", "required"), q("ccm.pain.severity"), q("ccm.pain.function_interference"), q("ccm.medication.has_issue"), q("ccm.treatment.plan_barrier"), q("ccm.sleep.quality"), q("ccm.function.daily_activity_difficulty", "optional"), goal()],
  sleep_apnea: [q("ccm.general.health_change", "required"), q("ccm.osa.device_use"), q("ccm.osa.device_barrier"), q("ccm.sleep.daytime_impact"), q("ccm.sleep.quality"), q("ccm.function.daily_activity_difficulty", "optional"), q("ccm.specialist.pending_followup", "optional"), goal()],
};

export const QUALITY_REVIEWED_CONDITION_IDS = Object.keys(QUALITY_BANK_OVERRIDES);

export const QUALITY_REWRITTEN_QUESTION_IDS = [
  "ccm.treatment.plan_barrier", "ccm.specialist.visit_change", "ccm.fibromyalgia.recovery",
  "ccm.pulmonary.oxygen_issue", "ccm.neuro.assistive_device", "ccm.dementia.safety_change",
  "ccm.hearing.device_issue", "ccm.vision.daily_tasks", "ccm.vision.treatment_barrier",
  "ccm.gerd.swallowing", "ccm.anemia.symptom_change", "ccm.osteoporosis.new_fracture",
  "ccm.osa.device_barrier", "ccm.vascular.foot_wound",
];

export const QUALITY_MERGED_CONCEPTS = [
  "Type 2 diabetes foot concern versus duplicate vascular wound default",
  "Heart-failure swelling versus duplicate CKD swelling wording",
  "CKD swelling versus legacy heart-failure swelling wording",
  "COPD activity breathing change versus generic dyspnea repetition",
  "Obesity-specific plan barrier versus generic plan-barrier repetition",
  "Sleep-apnea device barrier versus generic sleep-treatment barrier",
  "Back-pain functional interference versus generic daily-activity repetition",
];

export const POPULATED_CONDITION_IDS = [...new Set([
  ...NEW_CANONICAL_CONDITIONS.map((condition) => condition.id),
  ...COMMON_CONDITION_IDS,
  ...ADDITIONAL_REVIEWED_EXISTING_IDS,
])];

export const CONTENT_CONTEXTS = ALL_CONTEXTS;
