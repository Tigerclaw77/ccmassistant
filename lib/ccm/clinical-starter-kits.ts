import { CONDITION_MODULES_BY_ID, findConditionModule } from "./question-bank/conditions.ts";
import type { ConditionModuleId, QuestionId } from "./question-bank/types.ts";
import type { JsonValue } from "./types.ts";

export const CLINICAL_STARTER_KIT_IDS = [
  "diabetes",
  "hypertension",
  "chf",
  "copd",
  "ckd",
  "hyperlipidemia",
  "depression",
  "anxiety",
] as const;

export type ClinicalStarterKitId = (typeof CLINICAL_STARTER_KIT_IDS)[number];

export type ClinicalStarterKit = {
  coordinatorReminders: readonly string[];
  educationTopics: readonly string[];
  escalationSuggestions: readonly string[];
  id: ClinicalStarterKitId;
  label: string;
  monthlyQuestionIds: readonly QuestionId[];
  providerReviewPrompts: readonly string[];
  summary: string;
};

type StarterKitContent = Omit<ClinicalStarterKit, "monthlyQuestionIds">;

const KIT_CONTENT: readonly StarterKitContent[] = [
  {
    id: "diabetes",
    label: "Diabetes",
    summary: "Glucose trends, hypoglycemia, medication access, and foot concerns.",
    educationTopics: ["Recognizing and responding to low blood sugar", "Daily foot awareness and when to contact the care team"],
    coordinatorReminders: ["Confirm the patient can access medications and monitoring supplies", "Review reported glucose changes in the context of the care plan"],
    providerReviewPrompts: ["Review meaningful glucose changes, recurrent low readings, or new foot concerns"],
    escalationSuggestions: ["Consider escalation under practice protocol for severe or recurrent low readings, acute symptoms, or a new foot wound"],
  },
  {
    id: "hypertension",
    label: "Hypertension",
    summary: "Home blood-pressure trends, monitoring barriers, and medication follow-through.",
    educationTopics: ["Using a home blood-pressure cuff consistently", "Keeping a blood-pressure log for care-team review"],
    coordinatorReminders: ["Ask how and when home readings are being collected", "Identify medication or equipment barriers without changing treatment"],
    providerReviewPrompts: ["Review sustained changes, symptoms, or readings outside the practice-approved range"],
    escalationSuggestions: ["Consider escalation under practice protocol for concerning readings with symptoms or a material change from the patient baseline"],
  },
  {
    id: "chf",
    label: "CHF",
    summary: "Weight, swelling, breathing, and fluid-status changes.",
    educationTopics: ["Tracking daily weight consistently", "Recognizing worsening swelling or shortness of breath"],
    coordinatorReminders: ["Compare reported weight and symptoms with the prior contact", "Confirm the patient understands the practice contact plan for worsening symptoms"],
    providerReviewPrompts: ["Review rapid weight change, worsening edema, breathing changes, or a recent acute-care encounter"],
    escalationSuggestions: ["Consider prompt escalation under practice protocol for rapid weight gain, worsening breathing, new chest symptoms, or acute functional decline"],
  },
  {
    id: "copd",
    label: "COPD",
    summary: "Breathing changes, rescue-treatment use, medications, and exacerbation risk.",
    educationTopics: ["Recognizing a change from usual breathing", "Following the prescribed inhaler and action-plan instructions"],
    coordinatorReminders: ["Ask whether rescue-treatment use has changed", "Confirm medication access and technique concerns are routed for clinical review"],
    providerReviewPrompts: ["Review increased rescue-treatment use, worsening breathlessness, or recent urgent care"],
    escalationSuggestions: ["Consider prompt escalation under practice protocol for severe breathing difficulty, new confusion, cyanosis, or rapid deterioration"],
  },
  {
    id: "ckd",
    label: "CKD",
    summary: "Blood pressure, swelling, medication safety, and coordination needs.",
    educationTopics: ["Keeping an up-to-date medication list", "Reporting meaningful swelling or urine-output changes"],
    coordinatorReminders: ["Identify new over-the-counter medicines for clinician review", "Check for unresolved nephrology, laboratory, or medication follow-up"],
    providerReviewPrompts: ["Review new swelling, medication concerns, or unresolved renal follow-up"],
    escalationSuggestions: ["Consider escalation under practice protocol for acute swelling, breathing changes, confusion, or a significant change in urine output"],
  },
  {
    id: "hyperlipidemia",
    label: "Hyperlipidemia",
    summary: "Medication access, adherence barriers, nutrition, and follow-up completion.",
    educationTopics: ["Understanding the purpose of prescribed lipid therapy", "Preparing questions about nutrition and medication concerns"],
    coordinatorReminders: ["Identify refill or tolerance concerns for clinician review", "Confirm ordered follow-up has been scheduled or completed"],
    providerReviewPrompts: ["Review reported medication intolerance, adherence barriers, or overdue follow-up"],
    escalationSuggestions: ["Consider escalation under practice protocol for a suspected serious medication reaction or new acute cardiovascular symptoms"],
  },
  {
    id: "depression",
    label: "Depression",
    summary: "Mood change, function, medication concerns, support, and safety signals.",
    educationTopics: ["Using the practice contact plan when mood worsens", "Keeping follow-up appointments and discussing medication concerns"],
    coordinatorReminders: ["Ask about change from the patient's usual mood and function", "Follow the approved safety protocol for concerning responses"],
    providerReviewPrompts: ["Review meaningful mood or functional decline, medication concerns, or a positive safety signal"],
    escalationSuggestions: ["Immediately follow the practice crisis and emergency protocol for self-harm concerns, inability to remain safe, or acute behavioral change"],
  },
  {
    id: "anxiety",
    label: "Anxiety",
    summary: "Symptom frequency, sleep, function, medication concerns, and safety signals.",
    educationTopics: ["Tracking symptom and sleep changes for review", "Using the practice contact plan when symptoms become difficult to manage"],
    coordinatorReminders: ["Ask how symptoms affect daily function", "Route medication or safety concerns rather than offering treatment changes"],
    providerReviewPrompts: ["Review worsening symptoms, marked functional change, or medication concerns"],
    escalationSuggestions: ["Immediately follow the practice crisis and emergency protocol for self-harm concerns, inability to remain safe, or severe acute symptoms"],
  },
] as const;

export const CLINICAL_STARTER_KITS: readonly ClinicalStarterKit[] = KIT_CONTENT.map((content) => {
  const conditionModule = CONDITION_MODULES_BY_ID.get(content.id as ConditionModuleId);
  if (!conditionModule) throw new Error(`Clinical starter kit ${content.id} is missing its question module.`);
  return { ...content, monthlyQuestionIds: [...conditionModule.monthlyQuestionIds] };
});

export const DEFAULT_CLINICAL_STARTER_KIT_IDS: readonly ClinicalStarterKitId[] = [...CLINICAL_STARTER_KIT_IDS];

const STARTER_KIT_IDS = new Set<string>(CLINICAL_STARTER_KIT_IDS);

export function validateClinicalStarterKitIds(value: unknown): ClinicalStarterKitId[] {
  if (!Array.isArray(value)) throw new Error("clinicalStarterKitIds must be an array");
  const ids = [...new Set(value.map((item) => typeof item === "string" ? item.trim() : ""))];
  if (!ids.length) throw new Error("Select at least one clinical starter kit");
  const unsupported = ids.find((id) => !STARTER_KIT_IDS.has(id));
  if (unsupported) throw new Error(`Unsupported clinical starter kit: ${unsupported || "blank value"}`);
  return CLINICAL_STARTER_KIT_IDS.filter((id) => ids.includes(id));
}

export function clinicalStarterKitIdsFromSettings(value: JsonValue | null | undefined): ClinicalStarterKitId[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [...DEFAULT_CLINICAL_STARTER_KIT_IDS];
  const stored = value.clinical_starter_kit_ids;
  if (!Array.isArray(stored)) return [...DEFAULT_CLINICAL_STARTER_KIT_IDS];
  try {
    return validateClinicalStarterKitIds(stored);
  } catch {
    return [...DEFAULT_CLINICAL_STARTER_KIT_IDS];
  }
}

export function selectedClinicalStarterKits(ids: readonly ClinicalStarterKitId[]): ClinicalStarterKit[] {
  const selected = new Set(ids);
  return CLINICAL_STARTER_KITS.filter((kit) => selected.has(kit.id));
}

export function starterKitsForConditions(args: {
  conditionNames: readonly string[];
  selectedIds: readonly ClinicalStarterKitId[];
}): ClinicalStarterKit[] {
  const selected = new Set(args.selectedIds);
  const active = new Set<ConditionModuleId>();
  for (const value of args.conditionNames) {
    const conditionModule = findConditionModule(value);
    if (conditionModule) active.add(conditionModule.id);
  }
  return CLINICAL_STARTER_KITS.filter((kit) => selected.has(kit.id) && active.has(kit.id as ConditionModuleId));
}
