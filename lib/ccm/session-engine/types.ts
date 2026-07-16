import type {
  AnswerValue,
  ConditionModuleId,
  QuestionCategoryId,
  QuestionContext,
  QuestionId,
  QuestionResponse,
} from "../question-bank/types";

export type SessionWorkflow = QuestionContext;
export type SessionStatus = "active" | "paused" | "cancelled" | "completed";
export type SessionPriority = "NONE" | "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ReviewTarget = "coordinator" | "provider";

export type JsonData =
  | string
  | number
  | boolean
  | null
  | JsonData[]
  | { [key: string]: JsonData };

export type PatientDemographicsInput = {
  age?: number | null;
  dob?: string | null;
  preferredLanguage?: string | null;
  sex?: string | null;
};

export type DiagnosisInput = {
  active?: boolean;
  canonicalName?: string | null;
  code?: string | null;
  conditionId?: ConditionModuleId;
  name: string;
};

export type CarePlanInput = {
  barriers?: JsonData;
  conditionIds?: ConditionModuleId[];
  goals?: JsonData;
  lastReviewedAt?: string | null;
  status?: string | null;
};

export type MedicationInput = {
  name: string;
  active?: boolean;
  dose?: string | null;
  instructions?: string | null;
};

export type HistoricalResponseSource =
  | "previous_answer"
  | "prior_month"
  | "intake"
  | "existing_vital";

export type HistoricalQuestionResponse = QuestionResponse & {
  source: HistoricalResponseSource;
  reuseForDays?: number;
  validUntil?: string | null;
};

export type ExistingVitalInput = {
  answer: AnswerValue;
  observedAt: string;
  questionId: QuestionId;
  questionVersion: number;
  reuseForDays?: number;
  validUntil?: string | null;
};

export type SessionInput = {
  carePlan?: CarePlanInput | null;
  demographics?: PatientDemographicsInput;
  diagnoses?: DiagnosisInput[];
  existingVitals?: ExistingVitalInput[];
  intakeResponses?: HistoricalQuestionResponse[];
  medications?: MedicationInput[];
  patientId: string;
  previousAnswers?: HistoricalQuestionResponse[];
  priorMonthResponses?: HistoricalQuestionResponse[];
  sessionId?: string;
  workflow: SessionWorkflow;
};

export type SessionContextSnapshot = {
  carePlan: CarePlanInput | null;
  demographics: PatientDemographicsInput;
  diagnoses: DiagnosisInput[];
  existingVitals: ExistingVitalInput[];
  intakeResponses: HistoricalQuestionResponse[];
  medications: MedicationInput[];
  previousAnswers: HistoricalQuestionResponse[];
  priorMonthResponses: HistoricalQuestionResponse[];
};

export type SessionPlanItemSource = "workflow" | "condition" | "follow_up";

export type SessionPlanItem = {
  category: QuestionCategoryId;
  moduleIds: ConditionModuleId[];
  questionId: QuestionId;
  questionVersion: number;
  required: boolean;
  sequence: number;
  source: SessionPlanItemSource;
};

export type SessionPlan = {
  activeModuleIds: ConditionModuleId[];
  candidateQuestionIds: QuestionId[];
  items: SessionPlanItem[];
  seedQuestionIds: QuestionId[];
};

export type SessionSkipReason = "branch_excluded" | "recent_valid_response";

export type SessionSkippedQuestion = {
  questionId: QuestionId;
  questionVersion: number;
  reason: SessionSkipReason;
  sourceQuestionId?: QuestionId;
  skippedAt: string;
};

export type BranchQuestionStatus = "active" | "excluded" | "inactive";

export type BranchQuestionState = {
  questionId: QuestionId;
  status: BranchQuestionStatus;
};

export type SessionReviewFlag = {
  code: string;
  createdAt: string;
  priority: SessionPriority;
  questionId: QuestionId;
  questionVersion: number;
  reviewTarget: ReviewTarget;
};

export type SessionTaskType =
  | "contact_patient"
  | "notify_provider"
  | "schedule_follow_up"
  | "medication_reconciliation"
  | "care_plan_review"
  | "obtain_discharge_summary";

export type SessionTask = {
  assignedTo: "coordinator";
  createdAt: string;
  id: string;
  patientId: string;
  priority: SessionPriority;
  questionId: QuestionId;
  questionVersion: number;
  reason: string;
  reviewTarget: ReviewTarget;
  status: "open";
  type: SessionTaskType;
};

export type SessionProgressSlice = {
  answered: number;
  complete: boolean;
  id: string;
  skipped: number;
  total: number;
};

export type SessionProgress = {
  answeredQuestions: number;
  completionPercentage: number;
  estimatedCompletionAt: string | null;
  estimatedMinutesRemaining: number;
  moduleProgress: SessionProgressSlice[];
  optionalQuestionsRemaining: number;
  requiredQuestionsRemaining: number;
  sectionProgress: SessionProgressSlice[];
  skippedQuestions: number;
  totalQuestions: number;
};

export type SessionSummaryFinding = {
  answer: AnswerValue;
  category: QuestionCategoryId;
  questionId: QuestionId;
  questionVersion: number;
  triggerCodes: string[];
};

export type BillingDocumentationItem = SessionSummaryFinding & {
  answeredAt: string;
  billingRelevance: string;
};

export type SessionSummary = {
  billingRelevantDocumentation: BillingDocumentationItem[];
  functionalConcerns: SessionSummaryFinding[];
  hospitalizations: SessionSummaryFinding[];
  missedMedications: SessionSummaryFinding[];
  negativeFindings: SessionSummaryFinding[];
  patientConcerns: SessionSummaryFinding[];
  positiveFindings: SessionSummaryFinding[];
  socialBarriers: SessionSummaryFinding[];
  suggestedCoordinatorActions: SessionTask[];
  suggestedProviderReview: SessionReviewFlag[];
};

export type SessionSchedulingPolicy = {
  allowVersionMismatch: boolean;
  defaultReuseDays: Partial<Record<HistoricalResponseSource, number>>;
  optionalQuestionSeconds: number;
  requiredQuestionSeconds: number;
};

export type SessionState = {
  activeModuleIds: ConditionModuleId[];
  activeQuestionIds: QuestionId[];
  answers: Partial<Record<QuestionId, QuestionResponse>>;
  branchState: BranchQuestionState[];
  cancelledAt: string | null;
  completedAt: string | null;
  completedQuestionIds: QuestionId[];
  context: SessionContextSnapshot;
  coordinatorReviewRequired: boolean;
  createdAt: string;
  flags: SessionReviewFlag[];
  highestPriority: SessionPriority;
  id: string;
  lastResumedAt: string | null;
  patientId: string;
  pausedAt: string | null;
  plan: SessionPlan;
  progress: SessionProgress;
  providerReviewRequired: boolean;
  questionVersions: Partial<Record<QuestionId, number>>;
  resumeCount: number;
  reusableResponses: Partial<Record<QuestionId, HistoricalQuestionResponse>>;
  schemaVersion: 1;
  skippedQuestions: SessionSkippedQuestion[];
  startedAt: string;
  status: SessionStatus;
  summary: SessionSummary;
  tasks: SessionTask[];
  updatedAt: string;
  workflow: SessionWorkflow;
};

export type NextSessionQuestion = {
  helperText: string;
  position: number;
  questionId: QuestionId;
  questionVersion: number;
  required: boolean;
  text: string;
  total: number;
};

export type AnswerSessionResult = {
  nextQuestion: NextSessionQuestion | null;
  session: SessionState;
};
