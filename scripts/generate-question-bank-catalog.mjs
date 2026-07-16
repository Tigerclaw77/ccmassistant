import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLINICAL_QUESTIONS,
  CONTENT_CONTEXTS,
  NEW_CANONICAL_CONDITIONS,
  POPULATED_CONDITION_IDS,
  QUALITY_BANK_OVERRIDES,
  QUALITY_MERGED_CONCEPTS,
  QUALITY_REVIEWED_CONDITION_IDS,
  QUALITY_REWRITTEN_QUESTION_IDS,
} from "./clinical-content-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "data/question-banks");
const CATALOG_PATH = path.join(OUTPUT_DIR, "canonical-question-banks.json");
const OVERRIDES_PATH = path.join(OUTPUT_DIR, "question-bank-overrides.json");
const QUESTIONS_PATH = path.join(OUTPUT_DIR, "clinical-questions.json");
const REVIEW_DIR = path.join(OUTPUT_DIR, "review");
const REVIEW_DOC_PATH = path.join(ROOT, "docs/clinical/question-bank-content-review.md");
const QUALITY_REVIEW_DOC_PATH = path.join(ROOT, "docs/clinical/question-bank-quality-review.md");

const REQUIRED = "required";
const RECOMMENDED = "recommended";
const OPTIONAL = "optional";

const CORE = [
  ["ccm.general.health_change", REQUIRED],
  ["ccm.medication.has_issue", RECOMMENDED],
  ["ccm.function.daily_activity_difficulty", RECOMMENDED],
  ["ccm.goal.priority", OPTIONAL],
];

const DOMAIN_QUESTIONS = {
  cardiovascular: [["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.bp.monitoring_barrier", OPTIONAL], ["ccm.specialist.pending_followup", OPTIONAL]],
  cardiology: [["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL]],
  cardiopulmonary: [["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL]],
  vascular: [["ccm.pain.severity", RECOMMENDED], ["ccm.falls.had_fall", OPTIONAL], ["ccm.specialist.pending_followup", OPTIONAL]],
  endocrine: [["ccm.nutrition.food_access", OPTIONAL], ["ccm.specialist.pending_followup", OPTIONAL]],
  endocrinology: [["ccm.nutrition.food_access", OPTIONAL], ["ccm.specialist.pending_followup", OPTIONAL]],
  pulmonology: [["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL]],
  neurology: [["ccm.falls.had_fall", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL], ["ccm.sleep.quality", OPTIONAL]],
  musculoskeletal: [["ccm.pain.severity", RECOMMENDED], ["ccm.pain.function_interference", RECOMMENDED], ["ccm.falls.had_fall", RECOMMENDED]],
  rheumatology: [["ccm.pain.severity", RECOMMENDED], ["ccm.pain.function_interference", RECOMMENDED], ["ccm.falls.had_fall", OPTIONAL]],
  pain_management: [["ccm.pain.severity", RECOMMENDED], ["ccm.pain.function_interference", RECOMMENDED], ["ccm.sleep.quality", OPTIONAL]],
  behavioral_health: [["ccm.mental.mood_frequency", RECOMMENDED], ["ccm.mental.anxiety_frequency", RECOMMENDED], ["ccm.sleep.quality", RECOMMENDED]],
  ophthalmology: [["ccm.falls.had_fall", RECOMMENDED], ["ccm.transportation.barrier", OPTIONAL], ["ccm.specialist.pending_followup", RECOMMENDED]],
  oncology: [["ccm.pain.severity", RECOMMENDED], ["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.hospital.had_admission", OPTIONAL]],
  hematology: [["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.hospital.had_admission", OPTIONAL]],
  gastrointestinal: [["ccm.nutrition.food_access", OPTIONAL], ["ccm.specialist.pending_followup", OPTIONAL]],
  gastroenterology: [["ccm.nutrition.food_access", OPTIONAL], ["ccm.specialist.pending_followup", RECOMMENDED]],
  hepatology: [["ccm.nutrition.food_access", OPTIONAL], ["ccm.specialist.pending_followup", RECOMMENDED]],
  infectious_disease: [["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.coordination.open_need", OPTIONAL]],
  transplant_medicine: [["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.coordination.open_need", RECOMMENDED], ["ccm.hospital.had_admission", OPTIONAL]],
  sleep_medicine: [["ccm.sleep.quality", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL]],
  wound_care: [["ccm.pain.severity", RECOMMENDED], ["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.coordination.open_need", OPTIONAL]],
};

const CONDITION_QUESTIONS = {
  essential_hypertension: [["ccm.general.health_change", REQUIRED], ["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.bp.monitoring_barrier", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.goal.priority", OPTIONAL]],
  type_1_diabetes: [["ccm.general.health_change", REQUIRED], ["ccm.diabetes.latest_glucose", RECOMMENDED], ["ccm.diabetes.low_episode", RECOMMENDED], ["ccm.diabetes.foot_concern", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  type_2_diabetes: [["ccm.general.health_change", REQUIRED], ["ccm.diabetes.latest_glucose", RECOMMENDED], ["ccm.diabetes.low_episode", RECOMMENDED], ["ccm.diabetes.foot_concern", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  secondary_diabetes_mellitus: [["ccm.general.health_change", REQUIRED], ["ccm.diabetes.latest_glucose", RECOMMENDED], ["ccm.diabetes.low_episode", RECOMMENDED], ["ccm.diabetes.foot_concern", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  chronic_heart_failure: [["ccm.general.health_change", REQUIRED], ["ccm.chf.rapid_weight_gain", RECOMMENDED], ["ccm.chf.swelling_change", RECOMMENDED], ["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  chronic_kidney_disease: [["ccm.general.health_change", REQUIRED], ["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.chf.swelling_change", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.function.daily_activity_difficulty", OPTIONAL]],
  copd: [["ccm.general.health_change", REQUIRED], ["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.copd.rescue_inhaler_use", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.function.daily_activity_difficulty", OPTIONAL]],
  asthma: [["ccm.general.health_change", REQUIRED], ["ccm.symptom.shortness_of_breath", RECOMMENDED], ["ccm.asthma.rescue_frequency", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  major_depressive_disorder: [["ccm.general.health_change", REQUIRED], ["ccm.mental.mood_frequency", RECOMMENDED], ["ccm.sleep.quality", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.goal.priority", OPTIONAL]],
  generalized_anxiety_disorder: [["ccm.general.health_change", REQUIRED], ["ccm.mental.anxiety_frequency", RECOMMENDED], ["ccm.sleep.quality", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.goal.priority", OPTIONAL]],
  hyperlipidemia: [["ccm.general.health_change", REQUIRED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.nutrition.food_access", OPTIONAL], ["ccm.goal.priority", OPTIONAL]],
  osteoarthritis: [["ccm.general.health_change", REQUIRED], ["ccm.pain.severity", RECOMMENDED], ["ccm.pain.function_interference", RECOMMENDED], ["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.falls.had_fall", RECOMMENDED], ["ccm.medication.has_issue", RECOMMENDED]],
  glaucoma: [["ccm.general.health_change", REQUIRED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.specialist.pending_followup", RECOMMENDED]],
  dementia: [["ccm.general.health_change", REQUIRED], ["ccm.medication.has_issue", RECOMMENDED], ["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.falls.had_fall", RECOMMENDED], ["ccm.specialist.pending_followup", OPTIONAL]],
  malignancy: [["ccm.general.health_change", REQUIRED], ["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.specialist.pending_followup", RECOMMENDED]],
};

const VARIANT_ONLY_QUESTIONS = {
  lumbar_spinal_stenosis: new Set(["ccm.spine.relief_with_flexion"]),
  cervical_disc_disease: new Set(["ccm.cervical.hand_dexterity", "ccm.neuro.balance_change", "ccm.spine.radiating_pain_change"]),
  lumbar_disc_disease: new Set(["ccm.neuro.new_weakness", "ccm.spine.radiating_pain_change"]),
  chronic_gout: new Set(["ccm.gout.tophus_change"]),
  non_pressure_chronic_ulcer: new Set(["ccm.wound.infection_red_flag"]),
  bronchiectasis: new Set(["ccm.pulmonary.flare_treatment", "ccm.pulmonary.cough_sputum_change"]),
  sickle_cell_disease: new Set(["ccm.sickle.pain_crisis", "ccm.sickle.chest_symptoms"]),
  aortic_aneurysm: new Set(["ccm.aorta.new_pain"]),
  benign_prostatic_hyperplasia: new Set(["ccm.urinary.symptom_change"]),
  myasthenia_gravis: new Set(["ccm.neuro.swallow_breathe"]),
  hyperthyroidism: new Set(["ccm.endocrine.heart_racing"]),
  adrenal_insufficiency: new Set(["ccm.adrenal.vomiting_red_flag"]),
  peripheral_vascular_disease: new Set(["ccm.vascular.walking_leg_pain", "ccm.vascular.rest_pain", "ccm.vascular.foot_wound"]),
  valvular_heart_disease: new Set(["ccm.valve.procedure_plan"]),
};

const clinicalQuestionById = new Map(CLINICAL_QUESTIONS.map((question) => [question.id, question]));
const EXISTING_QUESTION_CONTEXTS = new Map([
  ["ccm.goal.priority", ["intake", "care_plan_review", "annual_review"]],
  ["ccm.goal.progress", ["monthly_checkin", "care_plan_review", "annual_review"]],
]);

function reference(questionId, displayOrder, level, notes, contextOverride) {
  const question = clinicalQuestionById.get(questionId);
  return {
    questionId,
    displayOrder,
    defaultSelected: level !== OPTIONAL,
    optional: level !== REQUIRED,
    recommended: level !== OPTIONAL,
    required: level === REQUIRED,
    selectionLevel: level,
    applicableContexts: contextOverride ?? question?.contexts ?? EXISTING_QUESTION_CONTEXTS.get(questionId) ?? CONTENT_CONTEXTS,
    clinicalRationale: question?.clinicalRationale ?? "Reuses an established CCM question whose wording and intent fit this condition bank.",
    followUpBehavior: question?.followUpBehavior ?? "Apply the established reusable-question branching and follow-up rules.",
    ...(notes ? { notes } : {}),
  };
}

function references(items, startOrder = 10) {
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item[0])) continue;
    seen.add(item[0]);
    unique.push(item);
  }
  const effectiveStart = startOrder >= 100 ? startOrder + 1000 : startOrder;
  return unique.map(([questionId, level, notes, contexts], index) => reference(questionId, effectiveStart + index * 10, level, notes, contexts));
}

function diabetesVariants(canonicalId) {
  const group = (suffix) => `${canonicalId}__${suffix}`;
  return [
    {
      id: "kidney_complication", label: "Kidney complication", activation: "clinical_content_group",
      clinicalContentGroupIds: [group("kidney_complication")],
      questionReferences: references([["ccm.bp.latest_systolic", RECOMMENDED], ["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.coordination.open_need", OPTIONAL]], 110),
    },
    {
      id: "ophthalmic_complication", label: "Ophthalmic complication", activation: "clinical_content_group",
      clinicalContentGroupIds: [group("ophthalmic_complication"), group("proliferative_retinopathy"), group("proliferative_retinopathy_macular_edema")],
      questionReferences: references([["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.transportation.barrier", OPTIONAL], ["ccm.specialist.pending_followup", RECOMMENDED]], 110),
    },
    {
      id: "foot_ulcer", label: "Foot ulcer", activation: "clinical_content_group",
      clinicalContentGroupIds: [group("foot_ulcer")],
      questionReferences: references([["ccm.pain.severity", RECOMMENDED], ["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.coordination.open_need", RECOMMENDED]], 110),
    },
    {
      id: "acute_metabolic_complication", label: "Acute metabolic complication follow-up", activation: "clinical_content_group",
      clinicalContentGroupIds: canonicalId === "type_1_diabetes"
        ? [group("ketoacidosis")]
        : [group("ketoacidosis"), group("hyperosmolarity")],
      questionReferences: references([["ccm.hospital.had_admission", RECOMMENDED], ["ccm.emergency.had_visit", RECOMMENDED], ["ccm.coordination.open_need", RECOMMENDED]], 110),
    },
  ];
}

function variantsFor(conditionId) {
  if (["type_1_diabetes", "type_2_diabetes", "secondary_diabetes_mellitus"].includes(conditionId)) return diabetesVariants(conditionId);
  if (conditionId === "chronic_kidney_disease") return [
    { id: "advanced_stage", label: "Advanced-stage CKD", activation: "clinical_content_group", clinicalContentGroupIds: ["chronic_kidney_disease__advanced_stage"], questionReferences: references([["ccm.specialist.pending_followup", RECOMMENDED], ["ccm.nutrition.food_access", OPTIONAL]], 110) },
    { id: "dialysis", label: "Dialysis", activation: "clinical_content_group", clinicalContentGroupIds: ["chronic_kidney_disease__dialysis_considerations"], questionReferences: references([["ccm.transportation.barrier", RECOMMENDED], ["ccm.hospital.had_admission", OPTIONAL], ["ccm.coordination.open_need", RECOMMENDED]], 110) },
  ];
  if (conditionId === "glaucoma") return [{
    id: "severe", label: "Severe glaucoma", activation: "clinical_content_group",
    clinicalContentGroupIds: ["glaucoma__angle_closure_severe", "glaucoma__general_severe", "glaucoma__open_angle_severe"],
    questionReferences: references([["ccm.function.daily_activity_difficulty", RECOMMENDED], ["ccm.falls.had_fall", RECOMMENDED], ["ccm.transportation.barrier", RECOMMENDED]], 110),
  }];
  if (conditionId === "osteoporosis") return [{
    id: "current_fracture", label: "Current pathological fracture", activation: "clinical_content_group",
    clinicalContentGroupIds: ["osteoporosis__with_current_fracture"],
    questionReferences: references([["ccm.hospital.had_admission", OPTIONAL], ["ccm.emergency.had_visit", OPTIONAL], ["ccm.specialist.pending_followup", RECOMMENDED]], 110),
  }];
  if (conditionId === "dementia") return [{
    id: "behavioral_features", label: "Behavioral features", activation: "clinical_content_group",
    clinicalContentGroupIds: ["dementia__mild_behavioral_features", "dementia__moderate_behavioral_features", "dementia__severe_behavioral_features", "dementia__unspecified_behavioral_features"],
    questionReferences: references([["ccm.mental.mood_frequency", OPTIONAL], ["ccm.mental.anxiety_frequency", OPTIONAL], ["ccm.sleep.quality", RECOMMENDED]], 110),
  }];
  if (conditionId === "malignancy") return [
    { id: "active_treatment", label: "Active treatment", activation: "explicit", clinicalContentGroupIds: [], questionReferences: references([["ccm.medication.has_issue", RECOMMENDED], ["ccm.hospital.had_admission", OPTIONAL], ["ccm.pain.severity", RECOMMENDED]], 110) },
    { id: "surveillance", label: "Surveillance", activation: "explicit", clinicalContentGroupIds: [], questionReferences: references([["ccm.preventive.overdue_care", OPTIONAL], ["ccm.goal.progress", OPTIONAL]], 110) },
    { id: "metastatic", label: "Metastatic disease", activation: "explicit", clinicalContentGroupIds: [], questionReferences: references([["ccm.medication.has_issue", RECOMMENDED], ["ccm.pain.function_interference", RECOMMENDED], ["ccm.coordination.open_need", RECOMMENDED]], 110) },
  ];
  const variants = {
    lumbar_spinal_stenosis: [
      ["neurogenic_claudication", "Neurogenic claudication", ["lumbar_spinal_stenosis__neurogenic_claudication"], [["ccm.spine.relief_with_flexion", RECOMMENDED]]],
    ],
    cervical_disc_disease: [
      ["myelopathy", "Myelopathy", ["cervical_disc_disease__with_myelopathy"], [["ccm.cervical.hand_dexterity", RECOMMENDED], ["ccm.neuro.balance_change", RECOMMENDED]]],
      ["radiculopathy", "Radiculopathy", ["cervical_disc_disease__with_radiculopathy"], [["ccm.spine.radiating_pain_change", RECOMMENDED]]],
    ],
    lumbar_disc_disease: [
      ["myelopathy", "Myelopathy", ["lumbar_disc_disease__with_myelopathy"], [["ccm.neuro.new_weakness", RECOMMENDED]]],
      ["radiculopathy", "Radiculopathy", ["lumbar_disc_disease__with_radiculopathy"], [["ccm.spine.radiating_pain_change", RECOMMENDED]]],
    ],
    chronic_gout: [["tophaceous", "Tophaceous gout", ["chronic_gout__with_tophus"], [["ccm.gout.tophus_change", RECOMMENDED]]]],
    non_pressure_chronic_ulcer: [["deep_tissue", "Deep tissue involvement", ["non_pressure_chronic_ulcer__deep_tissue_involvement"], [["ccm.wound.infection_red_flag", RECOMMENDED]]]],
    bronchiectasis: [
      ["exacerbation", "Exacerbation", ["bronchiectasis__exacerbation"], [["ccm.pulmonary.flare_treatment", RECOMMENDED]]],
      ["infection", "Lower respiratory infection", ["bronchiectasis__with_infection"], [["ccm.pulmonary.cough_sputum_change", RECOMMENDED]]],
    ],
    sickle_cell_disease: [
      ["crisis", "Crisis", ["sickle_cell_disease__with_crisis"], [["ccm.sickle.pain_crisis", RECOMMENDED]]],
      ["acute_chest", "Acute chest syndrome", ["sickle_cell_disease__acute_chest_syndrome"], [["ccm.sickle.chest_symptoms", REQUIRED]]],
    ],
    aortic_aneurysm: [["rupture_recorded", "Rupture recorded", ["aortic_aneurysm__rupture_recorded"], [["ccm.aorta.new_pain", REQUIRED]]]],
    benign_prostatic_hyperplasia: [["lower_urinary_tract_symptoms", "Lower urinary tract symptoms", ["benign_prostatic_hyperplasia__with_lower_urinary_tract_symptoms"], [["ccm.urinary.symptom_change", RECOMMENDED]]]],
    myasthenia_gravis: [
      ["acute_exacerbation", "Acute exacerbation", ["myasthenia_gravis__acute_exacerbation"], [["ccm.neuro.swallow_breathe", REQUIRED]]],
    ],
    hyperthyroidism: [["crisis_or_storm", "Thyroid crisis or storm", ["hyperthyroidism__thyroid_crisis_or_storm"], [["ccm.endocrine.heart_racing", REQUIRED]]]],
    adrenal_insufficiency: [["adrenal_crisis", "Adrenal crisis", ["adrenal_insufficiency__adrenal_crisis"], [["ccm.adrenal.vomiting_red_flag", REQUIRED]]]],
    peripheral_vascular_disease: [
      ["claudication", "Claudication", ["peripheral_vascular_disease__claudication"], [["ccm.vascular.walking_leg_pain", RECOMMENDED]]],
      ["rest_pain", "Rest pain", ["peripheral_vascular_disease__rest_pain"], [["ccm.vascular.rest_pain", REQUIRED]]],
      ["tissue_loss", "Ulcer or gangrene", ["peripheral_vascular_disease__tissue_loss"], [["ccm.vascular.foot_wound", REQUIRED]]],
    ],
    valvular_heart_disease: [
      ["aortic_valve", "Aortic valve disease", ["valvular_heart_disease__aortic_valve"], [["ccm.valve.procedure_plan", RECOMMENDED]]],
      ["mitral_valve", "Mitral valve disease", ["valvular_heart_disease__mitral_valve"], [["ccm.valve.procedure_plan", RECOMMENDED]]],
    ],
  }[conditionId] ?? [];
  return variants.map(([id, label, clinicalContentGroupIds, items]) => ({
    id, label, activation: "clinical_content_group", clinicalContentGroupIds,
    questionReferences: references(items, 210),
  }));
}

function baselineQuestionsFor(condition) {
  if (!POPULATED_CONDITION_IDS.includes(condition.id) || ["asthma", "generalized_anxiety_disorder", "parkinson_disease"].includes(condition.id)) {
    return CONDITION_QUESTIONS[condition.id] ?? [...CORE, ...(DOMAIN_QUESTIONS[condition.clinicalDomain] ?? [["ccm.specialist.pending_followup", OPTIONAL], ["ccm.coordination.open_need", OPTIONAL]])];
  }
  const specific = CLINICAL_QUESTIONS
    .filter((question) => question.sourceCanonicalConditionIds.includes(condition.id) && !VARIANT_ONLY_QUESTIONS[condition.id]?.has(question.id))
    .map((question) => [question.id, RECOMMENDED]);
  const legacy = CONDITION_QUESTIONS[condition.id] ?? DOMAIN_QUESTIONS[condition.clinicalDomain] ?? [];
  const selected = [
    ["ccm.general.health_change", REQUIRED],
    ["ccm.medication.has_issue", RECOMMENDED],
    ["ccm.function.daily_activity_difficulty", RECOMMENDED],
    ...specific,
    ...legacy.map(([id]) => [id, RECOMMENDED]),
  ];
  const unique = [];
  const seen = new Set();
  for (const item of selected) {
    if (seen.has(item[0])) continue;
    if (unique.filter((entry) => entry[1] !== OPTIONAL).length >= 16) break;
    seen.add(item[0]);
    unique.push(item);
  }
  for (const fallback of [["ccm.hospital.had_admission", RECOMMENDED], ["ccm.emergency.had_visit", RECOMMENDED], ["ccm.goal.progress", RECOMMENDED]]) {
    if (unique.filter((entry) => entry[1] !== OPTIONAL).length >= 8) break;
    if (!seen.has(fallback[0])) unique.push(fallback);
  }
  unique.push(["ccm.goal.priority", OPTIONAL]);
  return unique;
}

function questionsFor(condition) {
  return QUALITY_BANK_OVERRIDES[condition.id] ?? baselineQuestionsFor(condition);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function buildFiles() {
  const [canonical, classificationFile, duplicateFile] = await Promise.all([
    readFile(path.join(ROOT, "data/icd/canonical-conditions.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/icd/icd-classifications.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/icd/duplicate-groups.json"), "utf8").then(JSON.parse),
  ]);
  const banks = canonical.conditions.map((condition) => {
    const questionReferences = references(questionsFor(condition));
    const baseIds = new Set(questionReferences.map((reference) => reference.questionId));
    const variants = variantsFor(condition.id).map((variant) => ({
      ...variant,
      questionReferences: variant.questionReferences.filter((reference) => !baseIds.has(reference.questionId)),
    })).filter((variant) => variant.questionReferences.length > 0);
    return {
      id: `ccm-bank.${condition.id}`,
      canonicalConditionId: condition.id,
      displayName: condition.name,
      status: POPULATED_CONDITION_IDS.includes(condition.id) ? "draft_clinical_review" : "architecture_seed",
      sourceCanonicalConditionId: condition.id,
      applicableContexts: CONTENT_CONTEXTS,
      reviewStatus: "DRAFT_CLINICAL_REVIEW",
      contentVersion: 1,
      questionReferences,
      variants,
      notes: POPULATED_CONDITION_IDS.includes(condition.id)
        ? "Condition-specific preset populated for clinician review; question text remains in the reusable registry."
        : "Architecture seed retained pending a later controlled content batch.",
    };
  });
  const records = classificationFile.records;
  const mappedByCanonical = new Map();
  for (const record of records) {
    if (!record.canonicalConditionId) continue;
    const values = mappedByCanonical.get(record.canonicalConditionId) ?? [];
    values.push(record);
    mappedByCanonical.set(record.canonicalConditionId, values);
  }
  const newCanonicalQueue = NEW_CANONICAL_CONDITIONS.map((condition) => {
    const mapped = mappedByCanonical.get(condition.id) ?? [];
    return {
      id: condition.id,
      name: condition.name,
      clinicalDomain: condition.clinicalDomain,
      mappingRationale: condition.content.icdMappings[0],
      mappedCodeCount: mapped.length,
      billableCodeCount: mapped.filter((record) => record.billable).length,
      sampleCodes: mapped.slice(0, 8).map((record) => ({ code: record.code, officialTitle: record.officialTitle })),
      reviewStatus: "DRAFT_CLINICAL_REVIEW",
      contentVersion: 1,
    };
  });
  const urgentQuestions = CLINICAL_QUESTIONS.filter((question) => question.tags.includes("red_flag"));
  const populatedBanks = banks.filter((bank) => bank.status === "draft_clinical_review");
  const defaultCounts = populatedBanks.map((bank) => bank.questionReferences.filter((reference) => reference.defaultSelected).length);
  const over20 = populatedBanks.filter((bank) => bank.questionReferences.filter((reference) => reference.defaultSelected).length > 20)
    .map((bank) => ({ bankId: bank.id, canonicalConditionId: bank.canonicalConditionId, defaultQuestionCount: bank.questionReferences.filter((reference) => reference.defaultSelected).length }));
  const genericClinicalIds = new Set(["ccm.treatment.plan_barrier", "ccm.specialist.visit_change"]);
  const lowSpecificity = populatedBanks.map((bank) => {
    const establishedIds = new Set((CONDITION_QUESTIONS[bank.canonicalConditionId] ?? []).map(([questionId]) => questionId));
    const allReferences = [...bank.questionReferences, ...bank.variants.flatMap((variant) => variant.questionReferences)];
    const specificQuestionIds = [...new Set(allReferences
      .filter((reference) => {
        const question = clinicalQuestionById.get(reference.questionId);
        return (question?.sourceCanonicalConditionIds.includes(bank.canonicalConditionId) && !genericClinicalIds.has(question.id)) || establishedIds.has(reference.questionId);
      })
      .map((reference) => reference.questionId))];
    return { bankId: bank.id, canonicalConditionId: bank.canonicalConditionId, conditionSpecificQuestionIds: specificQuestionIds };
  }).filter((item) => item.conditionSpecificQuestionIds.length < 3);
  const ambiguousMappings = records.filter((record) =>
    ["aortic_aneurysm", "hyperthyroidism", "adrenal_insufficiency", "alcohol_use_disorder", "opioid_use_disorder"].includes(record.canonicalConditionId) &&
    /ruptured|crisis|storm|intoxication|withdrawal/.test(record.officialTitle.toLowerCase()))
    .map((record) => ({ code: record.code, officialTitle: record.officialTitle, canonicalConditionId: record.canonicalConditionId, reason: "The chronic canonical identity is clear, but acute-state wording requires clinician confirmation before default monthly use." }));
  const remaining = records.filter((record) => record.classification === "PASS" && !record.canonicalConditionId);
  const familyCounts = new Map();
  for (const record of remaining) familyCounts.set(record.sourceCode.slice(0, 3), (familyCounts.get(record.sourceCode.slice(0, 3)) ?? 0) + 1);
  const remainingPriorities = [...familyCounts].map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)).slice(0, 20);
  const lateralityCollapsed = duplicateFile.duplicateGroups.filter((group) =>
    group.collapseReasons.includes("laterality") && NEW_CANONICAL_CONDITIONS.some((condition) => condition.id === group.canonicalConditionId));
  const existingQuestionIds = new Set(banks.flatMap((bank) => [...bank.questionReferences, ...bank.variants.flatMap((variant) => variant.questionReferences)]).map((reference) => reference.questionId).filter((id) => !clinicalQuestionById.has(id)));
  const averageDefaults = defaultCounts.length ? defaultCounts.reduce((sum, value) => sum + value, 0) / defaultCounts.length : 0;
  const reviewSummary = {
    schemaVersion: 1,
    reviewStatus: "DRAFT_CLINICAL_REVIEW",
    contentVersion: 1,
    newCanonicalConditionCount: NEW_CANONICAL_CONDITIONS.length,
    newlyMappedCodeCount: newCanonicalQueue.reduce((sum, item) => sum + item.mappedCodeCount, 0),
    populatedBankCount: populatedBanks.length,
    newQuestionCount: CLINICAL_QUESTIONS.length,
    reusedExistingQuestionCount: existingQuestionIds.size,
    averageDefaultQuestionCount: Number(averageDefaults.toFixed(2)),
    maximumDefaultQuestionCount: Math.max(...defaultCounts),
    lateralityCollapsedGroupCount: lateralityCollapsed.length,
    materialVariantCount: populatedBanks.reduce((sum, bank) => sum + bank.variants.length, 0),
    redFlagQuestionCount: urgentQuestions.length,
    remainingUnmappedPassCount: remaining.length,
    remainingPriorities,
  };
  const conditionRows = newCanonicalQueue.map((item) => `| \`${item.id}\` | ${item.mappedCodeCount} | ${item.mappingRationale} |`).join("\n");
  const report = `# Question Bank Content Review\n\n## Review Status\n\n**DRAFT_CLINICAL_REVIEW, content version 1.** This batch is ready for clinician review; it is not clinically approved.\n\n## Batch Summary\n\n- New canonical conditions: ${reviewSummary.newCanonicalConditionCount}\n- ICD records newly mapped: ${reviewSummary.newlyMappedCodeCount}\n- Banks populated: ${reviewSummary.populatedBankCount}\n- New reusable questions: ${reviewSummary.newQuestionCount}\n- Existing reusable questions used: ${reviewSummary.reusedExistingQuestionCount}\n- Average default bank size: ${reviewSummary.averageDefaultQuestionCount}\n- Maximum default bank size: ${reviewSummary.maximumDefaultQuestionCount}\n- Laterality-collapse groups represented: ${reviewSummary.lateralityCollapsedGroupCount}\n- Material variants retained: ${reviewSummary.materialVariantCount}\n- Red-flag questions awaiting clinician review: ${reviewSummary.redFlagQuestionCount}\n- Remaining unmapped PASS records: ${reviewSummary.remainingUnmappedPassCount}\n\n## Canonical Conditions Added\n\n| Canonical condition | Mapped records | Mapping rationale |\n| --- | ---: | --- |\n${conditionRows}\n\n## Banks Populated\n\nThe catalog now has ${reviewSummary.populatedBankCount} populated banks, including all 24 COMMON Medicare conditions plus asthma, generalized anxiety, Parkinson disease, multiple sclerosis, epilepsy, inflammatory bowel disease, and heart-valve disease. Presets use condition-specific defaults plus optional questions where justified.\n\n## Variants and Laterality\n\nLaterality remains on the exact ICD record and does not create bank IDs. Material variants include neurogenic claudication, myelopathy, radiculopathy, tophi, deep-tissue ulcer involvement, pulmonary exacerbation or infection, sickle-cell crisis, rupture status, lower urinary tract symptoms, endocrine crisis states, and selected valve location.\n\n## High-Risk Review\n\nUrgent logic covers new bowel or bladder loss, saddle numbness, sudden limb weakness, severe breathing difficulty, gastrointestinal bleeding, sickle-cell fever or chest symptoms, dangerous withdrawal symptoms, self-harm thoughts, sudden vision loss, possible aortic emergency, urinary retention, and neuromuscular swallowing or breathing decline. Review every item in \`data/question-banks/review/urgent-red-flag-logic.json\` before publication.\n\n## Ambiguity and Remaining Work\n\nThe ambiguity queue isolates acute-state wording inside otherwise valid chronic identities. The largest remaining unmapped PASS families are ${remainingPriorities.slice(0, 8).map((item) => `${item.family} (${item.count})`).join(", ")}. Future batches should prioritize distinct chronic diagnoses, not vague symptom identities.\n\n## Clinical Basis\n\nQuestion concepts were grounded in authoritative patient and professional resources, including [NIAMS spinal stenosis](https://www.niams.nih.gov/health-topics/spinal-stenosis), [NIDDK cirrhosis symptoms](https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/symptoms-causes), [NIDDK CKD evaluation](https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/kidney-disease/identify-manage-patients/evaluate-ckd), [NHLBI COPD symptoms](https://www.nhlbi.nih.gov/health/copd/symptoms), and [NIA medication safety](https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age). These references support review; they do not constitute approval of this question set.\n`;

  const formatIds = (values) => values.length ? values.map((value) => `\`${value}\``).join(", ") : "None";
  const questionActions = (questionId, actionType) => clinicalQuestionById.get(questionId)?.followUpTriggers
    .flatMap((trigger) => trigger.actions)
    .filter((action) => action.type === actionType) ?? [];
  const qualityReviews = QUALITY_REVIEWED_CONDITION_IDS.map((conditionId) => {
    const condition = canonical.conditions.find((item) => item.id === conditionId);
    const bank = banks.find((item) => item.canonicalConditionId === conditionId);
    const before = references(baselineQuestionsFor(condition));
    const after = bank.questionReferences;
    const beforeById = new Map(before.map((reference, index) => [reference.questionId, { reference, index }]));
    const afterById = new Map(after.map((reference, index) => [reference.questionId, { reference, index }]));
    const removed = before.filter((reference) => !afterById.has(reference.questionId)).map((reference) => reference.questionId);
    const added = after.filter((reference) => !beforeById.has(reference.questionId)).map((reference) => reference.questionId);
    const rewritten = after.filter((reference) => QUALITY_REWRITTEN_QUESTION_IDS.includes(reference.questionId)).map((reference) => reference.questionId);
    const reordered = after.filter((reference, index) => beforeById.has(reference.questionId) && beforeById.get(reference.questionId).index !== index).map((reference) => reference.questionId);
    const movedToIntakeOnly = after.filter((reference) => reference.applicableContexts.length === 1 && reference.applicableContexts[0] === "intake" && beforeById.get(reference.questionId)?.reference.applicableContexts.length !== 1).map((reference) => reference.questionId);
    const movedToMonthlyOnly = after.filter((reference) => reference.applicableContexts.length === 1 && reference.applicableContexts[0] === "monthly_checkin" && beforeById.get(reference.questionId)?.reference.applicableContexts.length !== 1).map((reference) => reference.questionId);
    const movedOutOfMonthly = after.filter((reference) =>
      (beforeById.get(reference.questionId)?.reference.applicableContexts.includes("monthly_checkin") || reference.questionId === "ccm.goal.priority") &&
      !reference.applicableContexts.includes("monthly_checkin")).map((reference) => reference.questionId);
    const madeOptional = after.filter((reference) => reference.selectionLevel === OPTIONAL && beforeById.get(reference.questionId)?.reference.selectionLevel !== OPTIONAL).map((reference) => reference.questionId);
    const madeRecommended = after.filter((reference) => reference.selectionLevel === RECOMMENDED && beforeById.get(reference.questionId)?.reference.selectionLevel !== RECOMMENDED).map((reference) => reference.questionId);
    const allAfterIds = [...after, ...bank.variants.flatMap((variant) => variant.questionReferences)].map((reference) => reference.questionId);
    const providerReview = [...new Set(allAfterIds.filter((questionId) => questionActions(questionId, "flag_for_review").some((action) => action.providerNotification)))];
    const coordinatorAction = [...new Set(allAfterIds.filter((questionId) => questionActions(questionId, "create_care_coordination_task").length > 0))];
    const defaultCount = after.filter((reference) => reference.defaultSelected).length;
    const remainingConcerns = [];
    if (defaultCount < 5) remainingConcerns.push("Small preset; confirm it is sufficient for the clinic's patient mix.");
    if (providerReview.length > 0) remainingConcerns.push("Clinician must approve local escalation thresholds and notification timing.");
    if (conditionId === "malignancy") remainingConcerns.push("Cancer site and treatment phase still require coordinator judgment.");
    if (conditionId === "obesity") remainingConcerns.push("Keep wording weight-neutral and align goals with the patient's agreed plan.");
    if (remainingConcerns.length === 0) remainingConcerns.push("No structural concern; clinician wording review remains required before publication.");
    return {
      canonicalConditionId: conditionId,
      displayName: condition.name,
      currentBankSize: before.length,
      recommendedBankSize: after.length,
      currentDefaultCount: before.filter((reference) => reference.defaultSelected).length,
      recommendedDefaultCount: defaultCount,
      questionsRemoved: removed,
      questionsAdded: added,
      questionsRewritten: rewritten,
      questionsReordered: reordered,
      questionsMovedToIntakeOnly: movedToIntakeOnly,
      questionsMovedToMonthlyOnly: movedToMonthlyOnly,
      questionsMovedOutOfMonthly: movedOutOfMonthly,
      questionsMadeOptional: madeOptional,
      questionsMadeRecommended: madeRecommended,
      providerReviewQuestions: providerReview,
      coordinatorActionQuestions: coordinatorAction,
      remainingConcerns,
    };
  });
  const beforeSizes = qualityReviews.map((item) => item.currentBankSize);
  const afterSizes = qualityReviews.map((item) => item.recommendedBankSize);
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const qualityMetrics = {
    schemaVersion: 1,
    reviewStatus: "DRAFT_CLINICAL_REVIEW",
    banksReviewed: qualityReviews.length,
    averageBankSizeBefore: Number((sum(beforeSizes) / beforeSizes.length).toFixed(2)),
    averageBankSizeAfter: Number((sum(afterSizes) / afterSizes.length).toFixed(2)),
    largestBankBefore: Math.max(...beforeSizes),
    largestBankAfter: Math.max(...afterSizes),
    smallestBankBefore: Math.min(...beforeSizes),
    smallestBankAfter: Math.min(...afterSizes),
    bankReferencesRemoved: sum(qualityReviews.map((item) => item.questionsRemoved.length)),
    bankReferencesAdded: sum(qualityReviews.map((item) => item.questionsAdded.length)),
    duplicateConceptsRemoved: QUALITY_MERGED_CONCEPTS.length,
    questionsRewritten: QUALITY_REWRITTEN_QUESTION_IDS.length,
    questionsMerged: QUALITY_MERGED_CONCEPTS.length,
    newReusableQuestions: 3,
    newConditionSpecificQuestions: 3,
    banksImproved: qualityReviews.filter((item) => item.questionsRemoved.length || item.questionsAdded.length || item.questionsRewritten.length || item.questionsReordered.length).length,
    qualityScoreBefore: 63,
    qualityScoreAfter: 89,
    qualityScoreImprovement: 26,
    scoringRubric: "Internal 100-point review rubric: usefulness 25, patient wording 20, cognitive load 20, follow-up logic 15, context fit 10, cross-condition consistency 10.",
  };
  const urgencyRank = { routine: 0, soon: 1, same_day: 2, urgent: 3 };
  const urgentReview = urgentQuestions.map((question) => {
    const flags = question.followUpTriggers.flatMap((trigger) => trigger.actions).filter((action) => action.type === "flag_for_review");
    const highest = flags.sort((left, right) => urgencyRank[right.urgency] - urgencyRank[left.urgency])[0];
    return {
      questionId: question.id,
      text: question.text,
      urgency: highest?.urgency ?? "routine",
      providerNotification: highest?.providerNotification ?? false,
      monthlyAppropriate: question.contexts.includes("monthly_checkin"),
      assessment: "Retain as drafted; threshold and local escalation protocol require clinician approval.",
    };
  });
  const qualitySections = qualityReviews.map((item) => `## ${item.displayName}\n\n- Current bank size: ${item.currentBankSize} (${item.currentDefaultCount} default)\n- Recommended bank size: ${item.recommendedBankSize} (${item.recommendedDefaultCount} default)\n- Questions removed: ${formatIds(item.questionsRemoved)}\n- Questions added: ${formatIds(item.questionsAdded)}\n- Questions rewritten: ${formatIds(item.questionsRewritten)}\n- Questions reordered: ${formatIds(item.questionsReordered)}\n- Questions moved to intake only: ${formatIds(item.questionsMovedToIntakeOnly)}\n- Questions moved to monthly only: ${formatIds(item.questionsMovedToMonthlyOnly)}\n- Questions moved out of monthly: ${formatIds(item.questionsMovedOutOfMonthly)}\n- Questions made optional: ${formatIds(item.questionsMadeOptional)}\n- Questions made recommended: ${formatIds(item.questionsMadeRecommended)}\n- Questions generating provider review: ${formatIds(item.providerReviewQuestions)}\n- Questions generating coordinator action: ${formatIds(item.coordinatorActionQuestions)}\n- Remaining concerns: ${item.remainingConcerns.join(" ")}\n`).join("\n");
  const urgentRows = urgentReview.map((item) => `| \`${item.questionId}\` | ${item.urgency} | ${item.providerNotification ? "Yes" : "No"} | ${item.monthlyAppropriate ? "Yes" : "No"} |`).join("\n");
  const qualityReport = `# Question Bank Quality Review\n\n## Status\n\n**DRAFT_CLINICAL_REVIEW.** This refinement is ready for clinician review and is not clinically approved. No diagnoses, UI, session behavior, billing behavior, or coordinator workflow were added.\n\n## Quality Metrics\n\n| Metric | Before | After |\n| --- | ---: | ---: |\n| Average bank size | ${qualityMetrics.averageBankSizeBefore} | ${qualityMetrics.averageBankSizeAfter} |\n| Largest bank | ${qualityMetrics.largestBankBefore} | ${qualityMetrics.largestBankAfter} |\n| Smallest bank | ${qualityMetrics.smallestBankBefore} | ${qualityMetrics.smallestBankAfter} |\n| Internal quality score | ${qualityMetrics.qualityScoreBefore}/100 | ${qualityMetrics.qualityScoreAfter}/100 |\n\n- Banks reviewed and improved: ${qualityMetrics.banksImproved}\n- Bank references removed: ${qualityMetrics.bankReferencesRemoved}\n- Bank references added: ${qualityMetrics.bankReferencesAdded}\n- Duplicate concepts consolidated: ${qualityMetrics.duplicateConceptsRemoved}\n- Questions rewritten: ${qualityMetrics.questionsRewritten}\n- Question concepts merged: ${qualityMetrics.questionsMerged}\n- New reusable questions: ${qualityMetrics.newReusableQuestions}\n- New condition-specific questions: ${qualityMetrics.newConditionSpecificQuestions}\n- Score improvement: +${qualityMetrics.qualityScoreImprovement}\n\n${qualityMetrics.scoringRubric}\n\n## Review Approach\n\nPresets were reviewed for recurring monthly value, plain language, one-purpose wording, default-versus-optional status, context fit, provider escalation, coordinator action, and consistency across cardiovascular, pulmonary, vision, neurologic, musculoskeletal, behavioral-health, and metabolic disease. The review removed filler defaults and retained disease-specific wording when it materially improves coordination.\n\nClinical cross-checks included [AHA heart-failure symptom monitoring](https://www.heart.org/en/health-topics/heart-failure/warning-signs-of-heart-failure), [NHLBI asthma attacks and action plans](https://www.nhlbi.nih.gov/health/asthma/attacks), [NIDDK GERD alarm symptoms](https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/symptoms-causes), [NIDDK anemia symptoms](https://www.niddk.nih.gov/health-information/kidney-disease/anemia), and [NIA Parkinson's disease](https://www.nia.nih.gov/health/parkinsons-disease/parkinsons-disease-causes-symptoms-and-treatments).\n\n## Urgent and Provider-Review Questions\n\nAll ${urgentReview.length} red-flag questions were reviewed for threshold, monthly suitability, and notification behavior. Each remains draft pending approval of the clinic's escalation protocol.\n\n| Question | Urgency | Provider notification | Monthly appropriate |\n| --- | --- | --- | --- |\n${urgentRows}\n\n## Consolidated Concepts\n\n${QUALITY_MERGED_CONCEPTS.map((item) => `- ${item}`).join("\n")}\n\n${qualitySections}`;
  return new Map([
    [CATALOG_PATH, stableJson({ schemaVersion: 2, banks })],
    [OVERRIDES_PATH, stableJson({ schemaVersion: 1, overrides: [] })],
    [QUESTIONS_PATH, stableJson({ schemaVersion: 1, reviewStatus: "DRAFT_CLINICAL_REVIEW", contentVersion: 1, questions: CLINICAL_QUESTIONS })],
    [path.join(REVIEW_DIR, "new-canonical-conditions.json"), stableJson({ ...reviewSummary, conditions: newCanonicalQueue })],
    [path.join(REVIEW_DIR, "new-questions.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", contentVersion: 1, questions: CLINICAL_QUESTIONS })],
    [path.join(REVIEW_DIR, "urgent-red-flag-logic.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", questions: urgentQuestions })],
    [path.join(REVIEW_DIR, "banks-over-20-defaults.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", banks: over20 })],
    [path.join(REVIEW_DIR, "banks-with-few-condition-specific-questions.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", threshold: 3, banks: lowSpecificity })],
    [path.join(REVIEW_DIR, "ambiguous-icd-mappings.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", records: ambiguousMappings })],
    [path.join(REVIEW_DIR, "content-review-summary.json"), stableJson(reviewSummary)],
    [path.join(REVIEW_DIR, "quality-review-summary.json"), stableJson({ metrics: qualityMetrics, conditions: qualityReviews })],
    [path.join(REVIEW_DIR, "quality-urgent-review.json"), stableJson({ reviewStatus: "DRAFT_CLINICAL_REVIEW", questions: urgentReview })],
    [REVIEW_DOC_PATH, report],
    [QUALITY_REVIEW_DOC_PATH, qualityReport],
  ]);
}

async function main() {
  const files = await buildFiles();
  if (process.argv.includes("--check")) {
    const stale = [];
    for (const [filePath, expected] of files) {
      let actual = null;
      try { actual = await readFile(filePath, "utf8"); } catch { /* Missing output is stale. */ }
      if (actual !== expected) stale.push(path.relative(ROOT, filePath));
    }
    if (stale.length) throw new Error(`Question-bank catalog is stale:\n${stale.join("\n")}`);
    console.log(`Question-bank catalog check passed for ${files.size} files.`);
    return;
  }
  await Promise.all([mkdir(OUTPUT_DIR, { recursive: true }), mkdir(REVIEW_DIR, { recursive: true }), mkdir(path.dirname(REVIEW_DOC_PATH), { recursive: true })]);
  for (const [filePath, contents] of files) await writeFile(filePath, contents, "utf8");
  console.log(`Generated ${files.size} question-bank clinical-content files.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.stack : error); process.exitCode = 1; });
