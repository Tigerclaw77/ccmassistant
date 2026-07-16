import type {
  AnswerValue,
  QuestionDefinition,
  QuestionId,
  QuestionResponse,
  QuestionSearchFilters,
  QuestionVersionSnapshot,
} from "./types";
import clinicalQuestionsJson from "../../../data/question-banks/clinical-questions.json" with { type: "json" };

const CLINICAL_CONTENT_QUESTIONS = clinicalQuestionsJson.questions as QuestionDefinition[];

type OptionalQuestionFields =
  | "conditionIds"
  | "displayWhen"
  | "followUpTriggers"
  | "helperText"
  | "previousVersions"
  | "required"
  | "tags"
  | "validation"
  | "version";

type QuestionInput = Omit<QuestionDefinition, OptionalQuestionFields> &
  Partial<Pick<QuestionDefinition, OptionalQuestionFields>>;

const YES = { operator: "equals" as const, value: true };
const NO = { operator: "equals" as const, value: false };
const MONTHLY = ["monthly_checkin", "care_plan_review"] as const;
const LONGITUDINAL = ["intake", "monthly_checkin", "annual_review", "care_plan_review"] as const;

const select = (...values: string[]) => ({
  options: values.map((value) => ({
    label: value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()),
    value,
  })),
});

function defineQuestion(input: QuestionInput): QuestionDefinition {
  return {
    ...input,
    conditionIds: input.conditionIds ?? [],
    displayWhen: input.displayWhen ?? [],
    followUpTriggers: input.followUpTriggers ?? [],
    helperText: input.helperText ?? "Answer using the most accurate information available.",
    previousVersions: input.previousVersions ?? [],
    required: input.required ?? false,
    tags: input.tags ?? [],
    validation: input.validation ?? {},
    version: input.version ?? 1,
  };
}

export const QUESTION_BANK = [
  defineQuestion({
    id: "ccm.general.self_rated_health",
    category: "general_health",
    text: "How would you rate your health today?",
    helperText: "Choose the answer that best describes your overall health today.",
    answerType: "single_select",
    validation: select("excellent", "very_good", "good", "fair", "poor"),
    required: true,
    version: 2,
    clinicalRationale: "Provides a repeatable patient-reported global health baseline.",
    billingRelevance: "Supports longitudinal assessment and care-plan review documentation.",
    contexts: [...LONGITUDINAL],
    tags: ["baseline", "patient_reported"],
    previousVersions: [{
      id: "ccm.general.self_rated_health",
      version: 1,
      text: "In general, how is your health?",
      helperText: "Choose one response.",
      answerType: "single_select",
      required: true,
      validation: select("excellent", "very_good", "good", "fair", "poor"),
    }],
    followUpTriggers: [{
      id: "general-health-poor",
      when: { operator: "equals", value: "poor" },
      actions: [{ type: "flag_for_review", code: "poor_self_rated_health", urgency: "soon", providerNotification: false }],
    }],
  }),
  defineQuestion({
    id: "ccm.general.health_change",
    category: "general_health",
    text: "Has your health changed since the last review?",
    answerType: "single_select",
    validation: select("better", "about_the_same", "worse"),
    required: true,
    clinicalRationale: "Identifies change from the patient's prior baseline.",
    billingRelevance: "Documents ongoing monitoring and need for care-plan adjustment.",
    contexts: [...MONTHLY, "annual_review"],
    tags: ["change_from_baseline"],
    followUpTriggers: [{
      id: "general-health-worse",
      when: { operator: "equals", value: "worse" },
      actions: [{ type: "flag_for_review", code: "health_worsening", urgency: "soon", providerNotification: false }],
    }],
  }),

  defineQuestion({
    id: "ccm.medication.has_issue",
    category: "medication_adherence",
    text: "Are you having any problem taking or obtaining your medications?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Screens broadly for adherence, access, and tolerance barriers.",
    billingRelevance: "Supports medication review and documented care coordination.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["diabetes", "chf", "copd", "hypertension", "ckd", "depression", "anxiety", "hyperlipidemia", "arthritis"],
    tags: ["medication", "adherence", "access"],
    followUpTriggers: [{
      id: "medication-issue-details",
      when: YES,
      actions: [{ type: "show_questions", questionIds: ["ccm.medication.issue_reasons", "ccm.medication.provider_aware"] }],
    }],
  }),
  defineQuestion({
    id: "ccm.medication.issue_reasons",
    category: "medication_adherence",
    text: "What is making the medication difficult to take or obtain?",
    helperText: "Select every reason that applies.",
    answerType: "multi_select",
    validation: select("forgot", "cost", "side_effects", "unable_to_obtain", "schedule_confusing", "other"),
    required: true,
    clinicalRationale: "Separates adherence behaviors from affordability, access, and adverse effects.",
    billingRelevance: "Identifies actionable medication-management and coordination work.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["diabetes", "chf", "copd", "hypertension", "ckd", "depression", "anxiety", "hyperlipidemia", "arthritis"],
    tags: ["medication", "barrier"],
    displayWhen: [{ questionId: "ccm.medication.has_issue", ...YES }],
    followUpTriggers: [
      { id: "medication-side-effect-detail", when: { operator: "contains", value: "side_effects" }, actions: [{ type: "show_questions", questionIds: ["ccm.medication.side_effect_detail"] }] },
      { id: "medication-access-detail", when: { operator: "contains", value: "unable_to_obtain" }, actions: [{ type: "show_questions", questionIds: ["ccm.medication.access_detail"] }] },
      { id: "medication-cost-task", when: { operator: "contains", value: "cost" }, actions: [{ type: "create_care_coordination_task", code: "medication_cost_barrier", urgency: "soon" }] },
    ],
  }),
  defineQuestion({
    id: "ccm.medication.side_effect_detail",
    category: "medication_adherence",
    text: "What side effect are you experiencing?",
    answerType: "text",
    validation: { minLength: 3, maxLength: 500 },
    required: true,
    clinicalRationale: "Captures the patient-described adverse effect for clinical review.",
    billingRelevance: "Supports medication follow-up documentation.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["diabetes", "chf", "copd", "hypertension", "ckd", "depression", "anxiety", "hyperlipidemia", "arthritis"],
    tags: ["medication", "side_effect"],
    displayWhen: [{ questionId: "ccm.medication.issue_reasons", operator: "contains", value: "side_effects" }],
    followUpTriggers: [{ id: "medication-side-effect-review", when: { operator: "not_equals", value: "" }, actions: [{ type: "flag_for_review", code: "medication_side_effect", urgency: "soon", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.medication.access_detail",
    category: "medication_adherence",
    text: "Which medication could you not obtain, and what happened?",
    answerType: "text",
    validation: { minLength: 3, maxLength: 500 },
    required: true,
    clinicalRationale: "Identifies the medication and access failure requiring resolution.",
    billingRelevance: "Supports pharmacy, insurance, or prescriber coordination documentation.",
    contexts: [...LONGITUDINAL],
    tags: ["medication", "access"],
    displayWhen: [{ questionId: "ccm.medication.issue_reasons", operator: "contains", value: "unable_to_obtain" }],
    followUpTriggers: [{ id: "medication-access-task", when: { operator: "not_equals", value: "" }, actions: [{ type: "create_care_coordination_task", code: "medication_access", urgency: "soon" }] }],
  }),
  defineQuestion({
    id: "ccm.medication.provider_aware",
    category: "medication_adherence",
    text: "Does your prescribing clinician know about this medication problem?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Determines whether the medication concern has reached the responsible clinician.",
    billingRelevance: "Supports escalation and closed-loop coordination evidence.",
    contexts: [...LONGITUDINAL],
    tags: ["medication", "provider_notification"],
    displayWhen: [{ questionId: "ccm.medication.has_issue", ...YES }],
    followUpTriggers: [{ id: "medication-provider-unaware", when: NO, actions: [{ type: "flag_for_review", code: "medication_issue_provider_unaware", urgency: "soon", providerNotification: true }] }],
  }),

  defineQuestion({
    id: "ccm.symptom.shortness_of_breath",
    category: "symptoms",
    text: "Are you having shortness of breath?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Screens for a symptom relevant across cardiac and respiratory conditions.",
    billingRelevance: "Supports symptom monitoring and escalation documentation.",
    contexts: [...MONTHLY, "intake"],
    conditionIds: ["chf", "copd"],
    tags: ["respiratory", "cardiac", "shared"],
    followUpTriggers: [{
      id: "shortness-of-breath-flow",
      when: YES,
      actions: [{ type: "show_questions", questionIds: [
        "ccm.symptom.sob_onset",
        "ccm.symptom.sob_severity",
        "ccm.symptom.sob_worsening",
        "ccm.symptom.sob_associated",
        "ccm.symptom.sob_provider_notified",
      ] }],
    }],
  }),
  ...([
    ["ccm.symptom.sob_onset", "When did the shortness of breath begin?", "single_select", select("today", "one_to_three_days", "four_to_seven_days", "more_than_one_week")],
    ["ccm.symptom.sob_severity", "How severe is the shortness of breath?", "single_select", select("mild", "moderate", "severe")],
    ["ccm.symptom.sob_worsening", "Is the shortness of breath getting worse?", "yes_no", {}],
    ["ccm.symptom.sob_associated", "Which other symptoms are present?", "multi_select", select("chest_pain", "dizziness", "fever", "wheezing", "swelling", "none")],
    ["ccm.symptom.sob_provider_notified", "Has a clinician been notified about the shortness of breath?", "yes_no", {}],
  ] as const).map(([id, text, answerType, validation]) => defineQuestion({
    id,
    category: "symptoms",
    text,
    answerType,
    validation,
    required: true,
    clinicalRationale: "Characterizes shortness of breath for risk review and follow-up.",
    billingRelevance: "Documents symptom assessment and escalation decisions.",
    contexts: [...MONTHLY, "intake"],
    conditionIds: ["chf", "copd"],
    tags: ["shortness_of_breath", "branch"],
    displayWhen: [{ questionId: "ccm.symptom.shortness_of_breath", ...YES }],
    followUpTriggers: id === "ccm.symptom.sob_severity" ? [{ id: "severe-sob", when: { operator: "equals", value: "severe" }, actions: [{ type: "flag_for_review", code: "severe_shortness_of_breath", urgency: "urgent", providerNotification: true }] }] : [],
  })),

  defineQuestion({
    id: "ccm.falls.had_fall",
    category: "falls",
    text: "Have you fallen since the last review?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Screens for new falls and need for safety evaluation.",
    billingRelevance: "Supports risk assessment and care-plan updates.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["arthritis"],
    tags: ["fall", "safety"],
    followUpTriggers: [{ id: "fall-flow", when: YES, actions: [{ type: "show_questions", questionIds: ["ccm.falls.date", "ccm.falls.injury", "ccm.falls.er_visit", "ccm.falls.recurring"] }] }],
  }),
  ...([
    ["ccm.falls.date", "When did the most recent fall happen?", "date", {}],
    ["ccm.falls.injury", "Were you injured in the fall?", "yes_no", {}],
    ["ccm.falls.er_visit", "Did the fall lead to an emergency or urgent-care visit?", "yes_no", {}],
    ["ccm.falls.recurring", "Has this happened more than once in the past 12 months?", "yes_no", {}],
  ] as const).map(([id, text, answerType, validation]) => defineQuestion({
    id,
    category: "falls",
    text,
    answerType,
    validation,
    required: true,
    clinicalRationale: "Characterizes fall timing, harm, utilization, and recurrence.",
    billingRelevance: "Supports documented safety follow-up and care-plan revision.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["arthritis"],
    tags: ["fall", "branch"],
    displayWhen: [{ questionId: "ccm.falls.had_fall", ...YES }],
    followUpTriggers: id === "ccm.falls.injury" ? [{ id: "fall-injury-review", when: YES, actions: [{ type: "flag_for_review", code: "fall_with_injury", urgency: "same_day", providerNotification: true }] }] : [],
  })),

  defineQuestion({
    id: "ccm.function.daily_activity_difficulty",
    category: "functional_status",
    text: "Are health problems making daily activities harder?",
    helperText: "Consider bathing, dressing, meals, walking, shopping, and managing medications.",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Detects changes in independence and support needs.",
    billingRelevance: "Supports functional assessment and care-plan adjustment.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["chf", "copd", "ckd", "depression", "arthritis"],
    tags: ["adl", "iadl", "shared"],
    followUpTriggers: [{ id: "function-review", when: YES, actions: [{ type: "flag_for_review", code: "functional_decline", urgency: "soon", providerNotification: false }] }],
  }),
  defineQuestion({
    id: "ccm.bp.latest_systolic",
    category: "blood_pressure",
    text: "What was your most recent systolic blood pressure reading?",
    helperText: "Enter the top number only.",
    answerType: "number",
    validation: { min: 50, max: 260, integer: true },
    clinicalRationale: "Captures a bounded home blood-pressure value for trend review.",
    billingRelevance: "Supports hypertension and cardiovascular monitoring documentation.",
    contexts: [...MONTHLY, "intake"],
    conditionIds: ["hypertension", "chf", "ckd"],
    tags: ["blood_pressure", "shared"],
    followUpTriggers: [
      { id: "bp-very-high", when: { operator: "greater_than_or_equal", value: 180 }, actions: [{ type: "flag_for_review", code: "very_high_systolic", urgency: "urgent", providerNotification: true }] },
      { id: "bp-low", when: { operator: "less_than", value: 90 }, actions: [{ type: "flag_for_review", code: "low_systolic", urgency: "same_day", providerNotification: true }] },
    ],
  }),
  defineQuestion({
    id: "ccm.bp.monitoring_barrier",
    category: "blood_pressure",
    text: "Is anything preventing you from checking blood pressure as directed?",
    answerType: "yes_no",
    clinicalRationale: "Identifies equipment, technique, or access barriers.",
    billingRelevance: "Supports monitoring education and equipment coordination.",
    contexts: [...MONTHLY, "care_plan_review"],
    conditionIds: ["hypertension", "chf", "ckd"],
    tags: ["blood_pressure", "barrier"],
    followUpTriggers: [{ id: "bp-monitoring-task", when: YES, actions: [{ type: "create_care_coordination_task", code: "blood_pressure_monitoring_barrier", urgency: "routine" }] }],
  }),
  defineQuestion({
    id: "ccm.diabetes.latest_glucose",
    category: "diabetes",
    text: "What was your most recent blood glucose reading?",
    answerType: "number",
    validation: { min: 20, max: 600, integer: true },
    clinicalRationale: "Captures a bounded patient-reported glucose value.",
    billingRelevance: "Supports diabetes monitoring and documented clinical review.",
    contexts: [...MONTHLY, "intake"],
    conditionIds: ["diabetes"],
    tags: ["glucose"],
    followUpTriggers: [
      { id: "glucose-low", when: { operator: "less_than", value: 70 }, actions: [{ type: "flag_for_review", code: "low_glucose", urgency: "same_day", providerNotification: true }] },
      { id: "glucose-high", when: { operator: "greater_than", value: 300 }, actions: [{ type: "flag_for_review", code: "high_glucose", urgency: "same_day", providerNotification: true }] },
    ],
  }),
  defineQuestion({
    id: "ccm.diabetes.low_episode",
    category: "diabetes",
    text: "Have you had symptoms of low blood sugar since the last review?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Screens for interval hypoglycemia.",
    billingRelevance: "Supports medication and self-management review.",
    contexts: [...MONTHLY, "annual_review"],
    conditionIds: ["diabetes"],
    tags: ["hypoglycemia"],
    followUpTriggers: [{ id: "low-glucose-review", when: YES, actions: [{ type: "flag_for_review", code: "possible_hypoglycemia", urgency: "same_day", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.diabetes.foot_concern",
    category: "diabetes",
    text: "Do you have a new sore, blister, redness, or numbness in either foot?",
    answerType: "yes_no",
    clinicalRationale: "Screens for diabetes-related foot complications.",
    billingRelevance: "Supports preventive monitoring and timely referral.",
    contexts: [...MONTHLY, "annual_review"],
    conditionIds: ["diabetes"],
    tags: ["foot_care"],
    followUpTriggers: [{ id: "foot-concern-review", when: YES, actions: [{ type: "flag_for_review", code: "diabetic_foot_concern", urgency: "same_day", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.copd.rescue_inhaler_use",
    category: "copd",
    text: "How often have you needed your rescue inhaler in the past seven days?",
    answerType: "single_select",
    validation: select("none", "one_or_two_days", "three_or_four_days", "five_or_more_days"),
    clinicalRationale: "Provides a simple COPD symptom-control indicator.",
    billingRelevance: "Supports respiratory treatment review.",
    contexts: [...MONTHLY],
    conditionIds: ["copd"],
    tags: ["inhaler", "control"],
    followUpTriggers: [{ id: "copd-frequent-rescue", when: { operator: "equals", value: "five_or_more_days" }, actions: [{ type: "flag_for_review", code: "frequent_rescue_inhaler", urgency: "soon", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.chf.rapid_weight_gain",
    category: "chf",
    text: "Have you gained two or more pounds overnight or five pounds in one week?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Screens for patient-reported rapid weight change relevant to fluid status.",
    billingRelevance: "Supports CHF monitoring and escalation documentation.",
    contexts: [...MONTHLY],
    conditionIds: ["chf"],
    tags: ["weight", "fluid_status"],
    followUpTriggers: [{ id: "chf-weight-review", when: YES, actions: [{ type: "flag_for_review", code: "rapid_weight_gain", urgency: "same_day", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.chf.swelling_change",
    category: "chf",
    text: "Is swelling in your feet, legs, or abdomen new or worse?",
    answerType: "yes_no",
    clinicalRationale: "Screens for change in edema burden.",
    billingRelevance: "Supports CHF or kidney-disease symptom monitoring.",
    contexts: [...MONTHLY],
    conditionIds: ["chf", "ckd"],
    tags: ["edema", "shared"],
    followUpTriggers: [{ id: "swelling-review", when: YES, actions: [{ type: "flag_for_review", code: "worsening_swelling", urgency: "same_day", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.asthma.rescue_frequency",
    category: "asthma",
    text: "How many days in the past week did asthma symptoms require rescue medication?",
    answerType: "number",
    validation: { min: 0, max: 7, integer: true },
    clinicalRationale: "Captures a simple asthma-control measure.",
    billingRelevance: "Supports symptom and medication review.",
    contexts: [...MONTHLY],
    tags: ["asthma_control"],
    followUpTriggers: [{ id: "asthma-control-review", when: { operator: "greater_than", value: 2 }, actions: [{ type: "flag_for_review", code: "asthma_not_well_controlled", urgency: "soon", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.mental.mood_frequency",
    category: "mental_health",
    text: "How often have you felt down, depressed, or hopeless in the past two weeks?",
    answerType: "single_select",
    validation: select("not_at_all", "several_days", "more_than_half", "nearly_every_day"),
    clinicalRationale: "Provides a reusable mood symptom screen without claiming a diagnosis.",
    billingRelevance: "Supports depression monitoring and care-plan review.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["depression"],
    tags: ["mood", "depression"],
    followUpTriggers: [{ id: "mood-frequent", when: { operator: "in", value: ["more_than_half", "nearly_every_day"] }, actions: [{ type: "flag_for_review", code: "frequent_depressive_symptoms", urgency: "soon", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.mental.anxiety_frequency",
    category: "mental_health",
    text: "How often have you felt nervous, anxious, or unable to control worry in the past two weeks?",
    answerType: "single_select",
    validation: select("not_at_all", "several_days", "more_than_half", "nearly_every_day"),
    clinicalRationale: "Provides a reusable anxiety symptom screen without claiming a diagnosis.",
    billingRelevance: "Supports anxiety monitoring and care-plan review.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["anxiety"],
    tags: ["anxiety", "worry"],
    followUpTriggers: [{ id: "anxiety-frequent", when: { operator: "in", value: ["more_than_half", "nearly_every_day"] }, actions: [{ type: "flag_for_review", code: "frequent_anxiety_symptoms", urgency: "soon", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.pain.severity",
    category: "pain",
    text: "What is your pain level today from 0 to 10?",
    answerType: "number",
    validation: { min: 0, max: 10, integer: true },
    required: true,
    clinicalRationale: "Captures a repeatable patient-reported pain measure.",
    billingRelevance: "Supports symptom monitoring and treatment-plan review.",
    contexts: [...LONGITUDINAL],
    conditionIds: ["arthritis"],
    tags: ["pain", "shared"],
    followUpTriggers: [{ id: "high-pain", when: { operator: "greater_than_or_equal", value: 8 }, actions: [{ type: "flag_for_review", code: "high_pain", urgency: "same_day", providerNotification: true }] }],
  }),
  defineQuestion({
    id: "ccm.pain.function_interference",
    category: "pain",
    text: "Is pain preventing an important daily activity?",
    answerType: "yes_no",
    clinicalRationale: "Connects pain severity to functional impact and patient goals.",
    billingRelevance: "Supports care-plan intervention and goal review.",
    contexts: [...MONTHLY, "care_plan_review"],
    conditionIds: ["arthritis"],
    tags: ["pain", "function"],
    followUpTriggers: [{ id: "pain-function-review", when: YES, actions: [{ type: "flag_for_review", code: "pain_function_limit", urgency: "soon", providerNotification: false }] }],
  }),

  ...([
    ["ccm.preventive.overdue_care", "preventive_care", "Are any recommended vaccines, screenings, or preventive visits overdue?", "yes_no"],
    ["ccm.social.unmet_need", "social_determinants", "Are housing, utilities, finances, caregiving, or personal safety making health care harder?", "yes_no"],
    ["ccm.transportation.barrier", "transportation", "Has transportation caused you to miss or delay health care or medication pickup?", "yes_no"],
    ["ccm.nutrition.food_access", "nutrition", "Have you worried about having enough food or the right food for your care plan?", "yes_no"],
    ["ccm.sleep.quality", "sleep", "How would you rate your sleep quality?", "single_select"],
    ["ccm.coordination.open_need", "care_coordination", "Do you need help arranging care, equipment, referrals, records, or services?", "yes_no"],
    ["ccm.specialist.pending_followup", "specialist_follow_up", "Is any specialist recommendation, test, or follow-up still incomplete?", "yes_no"],
  ] as const).map(([id, category, text, answerType]) => defineQuestion({
    id,
    category,
    text,
    answerType,
    validation: answerType === "single_select" ? select("good", "fair", "poor") : {},
    clinicalRationale: "Screens for a common barrier or unresolved longitudinal care need.",
    billingRelevance: "Supports documented assessment and care-coordination follow-up.",
    contexts: [...LONGITUDINAL],
    tags: [category],
    followUpTriggers: answerType === "yes_no" ? [{ id: `${id}-task`, when: YES, actions: [{ type: "create_care_coordination_task", code: id.replaceAll(".", "_"), urgency: "routine" }] }] : [],
  })),

  defineQuestion({
    id: "ccm.hospital.had_admission",
    category: "hospitalizations",
    text: "Have you been admitted to a hospital since the last review?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Identifies interval hospitalization and transitional-care needs.",
    billingRelevance: "Supports care-transition and reconciliation documentation.",
    contexts: [...LONGITUDINAL],
    tags: ["utilization", "transition"],
    followUpTriggers: [{ id: "hospital-flow", when: YES, actions: [{ type: "show_questions", questionIds: ["ccm.hospital.discharge_date", "ccm.hospital.reason", "ccm.hospital.followup_complete"] }] }],
  }),
  ...([
    ["ccm.hospital.discharge_date", "What was the discharge date?", "date"],
    ["ccm.hospital.reason", "What was the main reason for the hospitalization?", "text"],
    ["ccm.hospital.followup_complete", "Has the recommended follow-up been completed?", "yes_no"],
  ] as const).map(([id, text, answerType]) => defineQuestion({
    id,
    category: "hospitalizations",
    text,
    answerType,
    validation: answerType === "text" ? { minLength: 3, maxLength: 500 } : {},
    required: true,
    clinicalRationale: "Captures core transition details needed for follow-up.",
    billingRelevance: "Supports post-discharge coordination evidence.",
    contexts: [...LONGITUDINAL],
    tags: ["hospital", "branch"],
    displayWhen: [{ questionId: "ccm.hospital.had_admission", ...YES }],
    followUpTriggers: id === "ccm.hospital.followup_complete" ? [{ id: "hospital-followup-task", when: NO, actions: [{ type: "create_care_coordination_task", code: "post_hospital_followup", urgency: "soon" }] }] : [],
  })),
  defineQuestion({
    id: "ccm.emergency.had_visit",
    category: "emergency_visits",
    text: "Have you visited an emergency department or urgent-care center since the last review?",
    answerType: "yes_no",
    required: true,
    clinicalRationale: "Identifies interval acute-care utilization.",
    billingRelevance: "Supports follow-up and avoidable-utilization review.",
    contexts: [...LONGITUDINAL],
    tags: ["utilization", "acute_care"],
    followUpTriggers: [{ id: "emergency-flow", when: YES, actions: [{ type: "show_questions", questionIds: ["ccm.emergency.visit_date", "ccm.emergency.reason", "ccm.emergency.followup_complete"] }] }],
  }),
  ...([
    ["ccm.emergency.visit_date", "What was the date of the most recent visit?", "date"],
    ["ccm.emergency.reason", "What was the main reason for the visit?", "text"],
    ["ccm.emergency.followup_complete", "Has recommended follow-up been completed?", "yes_no"],
  ] as const).map(([id, text, answerType]) => defineQuestion({
    id,
    category: "emergency_visits",
    text,
    answerType,
    validation: answerType === "text" ? { minLength: 3, maxLength: 500 } : {},
    required: true,
    clinicalRationale: "Captures acute-care timing, reason, and follow-up status.",
    billingRelevance: "Supports documented post-visit coordination.",
    contexts: [...LONGITUDINAL],
    tags: ["emergency", "branch"],
    displayWhen: [{ questionId: "ccm.emergency.had_visit", ...YES }],
    followUpTriggers: id === "ccm.emergency.followup_complete" ? [{ id: "emergency-followup-task", when: NO, actions: [{ type: "create_care_coordination_task", code: "post_emergency_followup", urgency: "soon" }] }] : [],
  })),
  defineQuestion({
    id: "ccm.goal.priority",
    category: "patient_goals",
    text: "What health or daily-life goal matters most to you now?",
    answerType: "text",
    validation: { minLength: 3, maxLength: 500 },
    required: true,
    clinicalRationale: "Anchors care planning in a patient-stated priority.",
    billingRelevance: "Supports person-centered comprehensive care-plan documentation.",
    contexts: ["intake", "annual_review", "care_plan_review"],
    tags: ["goal", "person_centered"],
  }),
  defineQuestion({
    id: "ccm.goal.progress",
    category: "patient_goals",
    text: "How is progress toward your current care-plan goal?",
    answerType: "single_select",
    validation: select("on_track", "some_progress", "no_progress", "goal_changed"),
    required: true,
    clinicalRationale: "Supports repeatable review of patient-defined goals.",
    billingRelevance: "Documents care-plan monitoring and revision needs.",
    contexts: ["monthly_checkin", "care_plan_review", "annual_review"],
    tags: ["goal", "progress"],
    followUpTriggers: [{ id: "goal-needs-review", when: { operator: "in", value: ["no_progress", "goal_changed"] }, actions: [{ type: "flag_for_review", code: "care_plan_goal_review", urgency: "routine", providerNotification: false }] }],
  }),
] as const satisfies readonly QuestionDefinition[];

export const SUGGESTED_QUESTION_REGISTRY: readonly QuestionDefinition[] = [
  ...QUESTION_BANK,
  ...CLINICAL_CONTENT_QUESTIONS,
];

export const QUESTIONS_BY_ID = new Map<QuestionId, QuestionDefinition>(
  QUESTION_BANK.map((question) => [question.id, question]),
);

export function getQuestion(questionId: QuestionId): QuestionDefinition | undefined {
  return QUESTIONS_BY_ID.get(questionId);
}

export function resolveQuestionVersion(
  questionId: QuestionId,
  version?: number,
): QuestionVersionSnapshot | undefined {
  const question = getQuestion(questionId);
  if (!question) return undefined;
  if (version === undefined || version === question.version) {
    const { id, answerType, helperText, required, text, validation } = question;
    return { id, answerType, helperText, required, text, validation, version: question.version };
  }
  return question.previousVersions.find((candidate) => candidate.version === version);
}

export function searchQuestions(
  query = "",
  filters: QuestionSearchFilters = {},
): QuestionDefinition[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return QUESTION_BANK.filter((question) => {
    const haystack = [question.id, question.text, question.helperText, question.category, ...question.tags]
      .join(" ")
      .toLowerCase();
    if (terms.some((term) => !haystack.includes(term))) return false;
    if (filters.answerTypes?.length && !filters.answerTypes.includes(question.answerType)) return false;
    if (filters.categories?.length && !filters.categories.includes(question.category)) return false;
    if (filters.contexts?.length && !filters.contexts.some((context) => question.contexts.includes(context))) return false;
    if (filters.conditionIds?.length && !filters.conditionIds.some((id) => question.conditionIds.includes(id))) return false;
    if (filters.required !== undefined && question.required !== filters.required) return false;
    if (filters.tags?.length && !filters.tags.every((tag) => question.tags.includes(tag))) return false;
    return true;
  });
}

export function serializeQuestionResponse(response: QuestionResponse): string {
  if (!resolveQuestionVersion(response.questionId, response.questionVersion)) {
    throw new Error(`Unknown question version: ${response.questionId}@${response.questionVersion}`);
  }
  if (Number.isNaN(new Date(response.answeredAt).valueOf())) {
    throw new Error("answeredAt must be a valid date and time");
  }
  return JSON.stringify({
    answer: response.answer,
    answeredAt: response.answeredAt,
    questionId: response.questionId,
    questionVersion: response.questionVersion,
  });
}

export function deserializeQuestionResponse(serialized: string): QuestionResponse {
  const value = JSON.parse(serialized) as Partial<QuestionResponse>;
  if (typeof value.questionId !== "string" || typeof value.questionVersion !== "number") {
    throw new Error("Serialized response is missing a question reference");
  }
  const questionId = value.questionId as QuestionId;
  if (!resolveQuestionVersion(questionId, value.questionVersion)) {
    throw new Error(`Unknown question version: ${questionId}@${value.questionVersion}`);
  }
  if (typeof value.answeredAt !== "string" || Number.isNaN(new Date(value.answeredAt).valueOf())) {
    throw new Error("Serialized response has an invalid answeredAt value");
  }
  return {
    answer: (value.answer ?? null) as AnswerValue,
    answeredAt: value.answeredAt,
    questionId,
    questionVersion: value.questionVersion,
  };
}
