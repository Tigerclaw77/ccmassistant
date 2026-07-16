import type { ConditionModuleId, ConditionQuestionModule } from "./types";

const sharedIntake = [
  "ccm.general.self_rated_health",
  "ccm.medication.has_issue",
  "ccm.hospital.had_admission",
  "ccm.emergency.had_visit",
] as const;

const sharedAnnual = [
  "ccm.general.self_rated_health",
  "ccm.function.daily_activity_difficulty",
  "ccm.preventive.overdue_care",
  "ccm.goal.priority",
] as const;

export const CONDITION_MODULES = [
  {
    id: "diabetes",
    label: "Diabetes",
    aliases: ["type 1 diabetes", "type 2 diabetes", "t1dm", "t2dm"],
    intakeQuestionIds: [...sharedIntake, "ccm.diabetes.latest_glucose", "ccm.diabetes.foot_concern"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.diabetes.latest_glucose", "ccm.diabetes.low_episode", "ccm.diabetes.foot_concern", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.diabetes.low_episode", "ccm.diabetes.foot_concern"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.medication.has_issue", "ccm.nutrition.food_access"],
  },
  {
    id: "chf",
    label: "Congestive heart failure",
    aliases: ["heart failure", "hf", "hfref", "hfpef"],
    intakeQuestionIds: [...sharedIntake, "ccm.symptom.shortness_of_breath", "ccm.chf.swelling_change"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.chf.rapid_weight_gain", "ccm.chf.swelling_change", "ccm.symptom.shortness_of_breath", "ccm.bp.latest_systolic", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.function.daily_activity_difficulty", "ccm.bp.monitoring_barrier"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.function.daily_activity_difficulty", "ccm.coordination.open_need"],
  },
  {
    id: "copd",
    label: "COPD",
    aliases: ["chronic obstructive pulmonary disease", "emphysema", "chronic bronchitis"],
    intakeQuestionIds: [...sharedIntake, "ccm.symptom.shortness_of_breath"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.symptom.shortness_of_breath", "ccm.copd.rescue_inhaler_use", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.function.daily_activity_difficulty"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.function.daily_activity_difficulty", "ccm.coordination.open_need"],
  },
  {
    id: "hypertension",
    label: "Hypertension",
    aliases: ["high blood pressure", "htn"],
    intakeQuestionIds: [...sharedIntake, "ccm.bp.latest_systolic", "ccm.bp.monitoring_barrier"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.bp.latest_systolic", "ccm.bp.monitoring_barrier", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.bp.monitoring_barrier"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.bp.monitoring_barrier", "ccm.medication.has_issue"],
  },
  {
    id: "ckd",
    label: "Chronic kidney disease",
    aliases: ["ckd", "renal insufficiency", "chronic renal disease"],
    intakeQuestionIds: [...sharedIntake, "ccm.bp.latest_systolic", "ccm.chf.swelling_change"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.bp.latest_systolic", "ccm.chf.swelling_change", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.function.daily_activity_difficulty"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.nutrition.food_access", "ccm.coordination.open_need"],
  },
  {
    id: "depression",
    label: "Depression",
    aliases: ["major depressive disorder", "mdd", "depressive disorder"],
    intakeQuestionIds: [...sharedIntake, "ccm.mental.mood_frequency"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.mental.mood_frequency", "ccm.medication.has_issue", "ccm.sleep.quality"],
    annualQuestionIds: [...sharedAnnual, "ccm.mental.mood_frequency", "ccm.function.daily_activity_difficulty"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.mental.mood_frequency", "ccm.coordination.open_need"],
  },
  {
    id: "anxiety",
    label: "Anxiety",
    aliases: ["generalized anxiety disorder", "gad", "anxiety disorder"],
    intakeQuestionIds: [...sharedIntake, "ccm.mental.anxiety_frequency"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.mental.anxiety_frequency", "ccm.medication.has_issue", "ccm.sleep.quality"],
    annualQuestionIds: [...sharedAnnual, "ccm.mental.anxiety_frequency"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.mental.anxiety_frequency", "ccm.coordination.open_need"],
  },
  {
    id: "hyperlipidemia",
    label: "Hyperlipidemia",
    aliases: ["high cholesterol", "dyslipidemia", "hld"],
    intakeQuestionIds: [...sharedIntake, "ccm.medication.has_issue", "ccm.nutrition.food_access"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.nutrition.food_access"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.medication.has_issue", "ccm.nutrition.food_access"],
  },
  {
    id: "arthritis",
    label: "Arthritis",
    aliases: ["osteoarthritis", "rheumatoid arthritis", "joint disease"],
    intakeQuestionIds: [...sharedIntake, "ccm.pain.severity", "ccm.function.daily_activity_difficulty", "ccm.falls.had_fall"],
    monthlyQuestionIds: ["ccm.general.health_change", "ccm.pain.severity", "ccm.pain.function_interference", "ccm.function.daily_activity_difficulty", "ccm.falls.had_fall", "ccm.medication.has_issue"],
    annualQuestionIds: [...sharedAnnual, "ccm.pain.severity", "ccm.falls.had_fall"],
    carePlanQuestionIds: ["ccm.goal.progress", "ccm.pain.function_interference", "ccm.function.daily_activity_difficulty"],
  },
] as const satisfies readonly ConditionQuestionModule[];

export const CONDITION_MODULES_BY_ID = new Map<ConditionModuleId, ConditionQuestionModule>(
  CONDITION_MODULES.map((module) => [module.id, module]),
);

export function findConditionModule(value: string): ConditionQuestionModule | undefined {
  const normalized = value.trim().toLowerCase();
  return CONDITION_MODULES.find(
    (module) =>
      module.id === normalized ||
      module.label.toLowerCase() === normalized ||
      module.aliases.some((alias) => alias === normalized),
  );
}
