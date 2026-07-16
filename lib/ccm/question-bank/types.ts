export type QuestionCategoryId =
  | "general_health"
  | "medication_adherence"
  | "symptoms"
  | "functional_status"
  | "falls"
  | "blood_pressure"
  | "diabetes"
  | "copd"
  | "chf"
  | "asthma"
  | "mental_health"
  | "pain"
  | "preventive_care"
  | "social_determinants"
  | "transportation"
  | "nutrition"
  | "sleep"
  | "care_coordination"
  | "specialist_follow_up"
  | "hospitalizations"
  | "emergency_visits"
  | "patient_goals";

export type QuestionContext = "intake" | "monthly_checkin" | "annual_review" | "care_plan_review";

export type QuestionAnswerType =
  | "yes_no"
  | "number"
  | "text"
  | "date"
  | "single_select"
  | "multi_select";

export type ConditionModuleId =
  | "diabetes"
  | "chf"
  | "copd"
  | "hypertension"
  | "ckd"
  | "depression"
  | "anxiety"
  | "hyperlipidemia"
  | "arthritis";

export type QuestionId = `ccm.${string}`;
export type AnswerValue = boolean | number | string | string[] | null;

export type SelectOption = {
  value: string;
  label: string;
};

export type QuestionValidation = {
  integer?: boolean;
  max?: number;
  maxLength?: number;
  min?: number;
  minLength?: number;
  options?: SelectOption[];
  pattern?: string;
};

export type AnswerOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "in"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";

export type AnswerCondition = {
  operator: AnswerOperator;
  value: AnswerValue | AnswerValue[];
};

export type DisplayRule = AnswerCondition & {
  questionId: QuestionId;
};

export type FollowUpUrgency = "routine" | "soon" | "same_day" | "urgent";

export type FollowUpAction =
  | {
      type: "show_questions";
      questionIds: QuestionId[];
    }
  | {
      type: "flag_for_review";
      code: string;
      urgency: FollowUpUrgency;
      providerNotification: boolean;
    }
  | {
      type: "create_care_coordination_task";
      code: string;
      urgency: FollowUpUrgency;
    };

export type FollowUpTriggerRule = {
  id: string;
  when: AnswerCondition;
  actions: FollowUpAction[];
};

export type QuestionVersionSnapshot = {
  id: QuestionId;
  version: number;
  text: string;
  helperText: string;
  answerType: QuestionAnswerType;
  required: boolean;
  validation: QuestionValidation;
};

export type QuestionDefinition = QuestionVersionSnapshot & {
  category: QuestionCategoryId;
  clinicalRationale: string;
  billingRelevance: string;
  followUpTriggers: FollowUpTriggerRule[];
  contexts: QuestionContext[];
  conditionIds: ConditionModuleId[];
  tags: string[];
  displayWhen: DisplayRule[];
  previousVersions: QuestionVersionSnapshot[];
  sourceCanonicalConditionIds?: string[];
  followUpBehavior?: string;
  reviewStatus?: "DRAFT_CLINICAL_REVIEW" | "CLINICALLY_REVIEWED" | "PUBLISHED";
  contentVersion?: number;
};

export type QuestionResponse = {
  questionId: QuestionId;
  questionVersion: number;
  answer: AnswerValue;
  answeredAt: string;
};

export type QuestionSearchFilters = {
  answerTypes?: QuestionAnswerType[];
  categories?: QuestionCategoryId[];
  conditionIds?: ConditionModuleId[];
  contexts?: QuestionContext[];
  required?: boolean;
  tags?: string[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  normalizedValue: AnswerValue;
};

export type ConditionQuestionModule = {
  id: ConditionModuleId;
  label: string;
  aliases: string[];
  intakeQuestionIds: QuestionId[];
  monthlyQuestionIds: QuestionId[];
  annualQuestionIds: QuestionId[];
  carePlanQuestionIds: QuestionId[];
};

export type QuestionCategory = {
  id: QuestionCategoryId;
  label: string;
  description: string;
};
