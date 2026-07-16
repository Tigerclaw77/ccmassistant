import type {
  QuestionAnswerType,
  QuestionContext,
  QuestionDefinition,
  QuestionId,
} from "../question-bank/types.ts";
import type {
  BuildSuggestedQuestionBankInput,
  CanonicalSuggestedQuestionBank,
} from "./types.ts";

export const QUESTION_BANK_CUSTOMIZATION_SCOPES = [
  "clinic",
  "provider",
  "coordinator",
] as const;
export type QuestionBankCustomizationScope =
  (typeof QUESTION_BANK_CUSTOMIZATION_SCOPES)[number];

export const QUESTION_BANK_CUSTOMIZATION_STATES = ["active", "retired"] as const;
export type QuestionBankCustomizationState =
  (typeof QUESTION_BANK_CUSTOMIZATION_STATES)[number];

export type CustomQuestionId = `custom.${string}`;
export type QuestionBankQuestionKey = QuestionId | CustomQuestionId;
export type QuestionSelectionLevel = "required" | "recommended" | "optional";

export type QuestionBankScopeOwner = {
  clinicId: string;
  providerId: string | null;
  coordinatorId: string | null;
  scope: QuestionBankCustomizationScope;
};

export type QuestionBankQuestionChange = {
  questionId: QuestionBankQuestionKey;
  included?: boolean;
  displayOrder?: number;
  defaultSelected?: boolean;
  selectionLevel?: QuestionSelectionLevel;
  applicableContexts?: QuestionContext[];
};

export type QuestionBankOverrideVersion = QuestionBankScopeOwner & {
  id: string;
  bankId: string;
  canonicalConditionId: string;
  version: number;
  state: QuestionBankCustomizationState;
  changes: QuestionBankQuestionChange[];
  changeNote: string | null;
  createdBy: string;
  createdAt: string;
};

export type ClinicCustomQuestionVersion = {
  id: string;
  questionId: CustomQuestionId;
  ownerId: string;
  scope: "clinic";
  clinicId: string;
  canonicalConditionId: string;
  text: string;
  helperText: string;
  answerType: QuestionAnswerType;
  contexts: QuestionContext[];
  version: number;
  state: QuestionBankCustomizationState;
  createdBy: string;
  createdAt: string;
};

export type QuestionBankFavoriteVersion = QuestionBankScopeOwner & {
  id: string;
  canonicalConditionId: string;
  favorite: boolean;
  displayOrder: number;
  version: number;
  state: QuestionBankCustomizationState;
  createdBy: string;
  createdAt: string;
};

export const CONTRIBUTION_OPT_IN_STATUSES = [
  "not_opted_in",
  "opted_in",
  "withdrawn",
] as const;
export type ContributionOptInStatus =
  (typeof CONTRIBUTION_OPT_IN_STATUSES)[number];

export type QuestionContributionCandidate = {
  id: string;
  canonicalConditionId: string;
  question: string;
  context: QuestionContext;
  usageCount: number;
  optInStatus: ContributionOptInStatus;
  anonymous: boolean;
  noPhiAttested: boolean;
  createdBy: string | null;
  createdAt: string;
};

export type AnonymousQuestionContributionPayload = Pick<
  QuestionContributionCandidate,
  "id" | "canonicalConditionId" | "question" | "context" | "usageCount"
>;

export type QuestionBankCustomizationIdentity = {
  clinicId: string;
  providerId?: string | null;
  coordinatorId?: string | null;
};

export type QuestionBankCustomizationData = {
  overrides?: readonly QuestionBankOverrideVersion[];
  customQuestions?: readonly ClinicCustomQuestionVersion[];
  favorites?: readonly QuestionBankFavoriteVersion[];
  contributions?: readonly QuestionContributionCandidate[];
};

export type CustomQuestionDefinitionSnapshot = {
  id: CustomQuestionId;
  version: number;
  text: string;
  helperText: string;
  answerType: QuestionAnswerType;
  contexts: QuestionContext[];
};

export type ResolvedCustomizedQuestion = {
  questionId: QuestionBankQuestionKey;
  displayOrder: number;
  defaultSelected: boolean;
  optional: boolean;
  recommended: boolean;
  required: boolean;
  selectionLevel: QuestionSelectionLevel;
  applicableContexts: QuestionContext[];
  definition: QuestionDefinition | CustomQuestionDefinitionSnapshot;
  source: "system" | "clinic_custom";
  appliedScopes: QuestionBankCustomizationScope[];
};

export type AppliedQuestionBankOverride = {
  id: string;
  scope: QuestionBankCustomizationScope;
  version: number;
};

export type ResolvedCustomizedQuestionBank = {
  bankId: string;
  canonicalConditionId: string;
  variantId: string | null;
  clinicalContentGroupId: string | null;
  diagnosisCode: string | null;
  diagnosisTitle: string | null;
  heading: string;
  questions: ResolvedCustomizedQuestion[];
  appliedOverrides: AppliedQuestionBankOverride[];
};

export type ResolveCustomizedQuestionBankInput = BuildSuggestedQuestionBankInput & {
  identity: QuestionBankCustomizationIdentity;
};

export type ResolvedQuestionBankFavorite = {
  bankId: string;
  canonicalConditionId: string;
  displayName: string;
  displayOrder: number;
  sourceScope: QuestionBankCustomizationScope;
};

export type QuestionBankDiscoveryItem = {
  bankId: string;
  canonicalConditionId: string;
  displayName: string;
  source: "favorite" | "icd_search";
};

export type QuestionBankCustomizationValidationInput = QuestionBankCustomizationData & {
  banks: readonly CanonicalSuggestedQuestionBank[];
  questionIds: readonly QuestionId[];
};

export type QuestionBankCustomizationValidationErrorCode =
  | "conflicting_scope"
  | "duplicate_change"
  | "duplicate_version"
  | "invalid_change"
  | "invalid_contribution"
  | "invalid_custom_question"
  | "invalid_favorite"
  | "invalid_version"
  | "orphan_bank"
  | "orphan_condition"
  | "orphan_custom_question"
  | "orphan_question";

export type QuestionBankCustomizationValidationError = {
  code: QuestionBankCustomizationValidationErrorCode;
  path: string;
  message: string;
};

export type QuestionBankCustomizationValidationResult = {
  valid: boolean;
  errors: QuestionBankCustomizationValidationError[];
};
