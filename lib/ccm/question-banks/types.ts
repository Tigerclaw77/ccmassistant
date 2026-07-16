import type { QuestionDefinition, QuestionId } from "../question-bank/types.ts";
import type { QuestionContext } from "../question-bank/types.ts";
import type { CanonicalCondition, ClinicalContentGroup, IcdClassificationRecord } from "../icd/types.ts";

export const QUESTION_BANK_STATUSES = ["architecture_seed", "draft_clinical_review", "reviewed", "published"] as const;
export type SuggestedQuestionBankStatus = (typeof QUESTION_BANK_STATUSES)[number];

export type SuggestedQuestionReference = {
  questionId: QuestionId;
  displayOrder: number;
  defaultSelected: boolean;
  optional: boolean;
  recommended: boolean;
  required: boolean;
  selectionLevel: "required" | "recommended" | "optional";
  applicableContexts: QuestionDefinition["contexts"];
  clinicalRationale: string;
  followUpBehavior: string;
  notes?: string;
};

export type SuggestedQuestionBankVariant = {
  id: string;
  label: string;
  activation: "clinical_content_group" | "explicit";
  clinicalContentGroupIds: string[];
  questionReferences: SuggestedQuestionReference[];
  notes?: string;
};

export type CanonicalSuggestedQuestionBank = {
  id: string;
  canonicalConditionId: string;
  displayName: string;
  status: SuggestedQuestionBankStatus;
  sourceCanonicalConditionId: string;
  applicableContexts: QuestionDefinition["contexts"];
  reviewStatus: "DRAFT_CLINICAL_REVIEW" | "CLINICALLY_REVIEWED" | "PUBLISHED";
  contentVersion: number;
  questionReferences: SuggestedQuestionReference[];
  variants: SuggestedQuestionBankVariant[];
  notes?: string;
};

export type SuggestedQuestionBankOverride = {
  bankId: string;
  removeQuestionIds: QuestionId[];
  questionReferenceOverrides: Array<
    Partial<Omit<SuggestedQuestionReference, "questionId">> & { questionId: QuestionId }
  >;
  notes?: string;
};

export type SuggestedQuestionBankCatalog = {
  schemaVersion: number;
  banks: CanonicalSuggestedQuestionBank[];
};

export type SuggestedQuestionBankOverrideCatalog = {
  schemaVersion: number;
  overrides: SuggestedQuestionBankOverride[];
};

export type ResolvedSuggestedQuestion = SuggestedQuestionReference & {
  definition: QuestionDefinition;
};

export type ResolvedSuggestedQuestionBank = {
  bankId: string;
  canonicalConditionId: string;
  variantId: string | null;
  clinicalContentGroupId: string | null;
  diagnosisCode: string | null;
  diagnosisTitle: string | null;
  heading: string;
  questions: ResolvedSuggestedQuestion[];
};

export type BuildSuggestedQuestionBankInput = {
  canonicalConditionId: string;
  clinicalContentGroupId?: string | null;
  diagnosisCode?: string | null;
  diagnosisTitle?: string | null;
  variantId?: string | null;
  context?: QuestionContext | null;
};

export type QuestionBankValidationErrorCode =
  | "duplicate_bank_id"
  | "duplicate_canonical_bank"
  | "duplicate_question_reference"
  | "duplicate_variant_id"
  | "empty_bank"
  | "invalid_reference_flags"
  | "laterality_generated_duplicate"
  | "missing_suggested_bank"
  | "orphan_canonical_condition"
  | "orphan_clinical_content_group"
  | "orphan_question_id"
  | "question_order_conflict"
  | "content_group_multiple_variants"
  | "invalid_override"
  | "duplicate_question_text"
  | "invalid_branching_reference"
  | "missing_clinical_metadata"
  | "vague_canonical_condition"
  | "excessive_default_questions"
  | "incompatible_variant_combination";

export type QuestionBankValidationError = {
  code: QuestionBankValidationErrorCode;
  path: string;
  message: string;
};

export type QuestionBankValidationResult = {
  valid: boolean;
  errors: QuestionBankValidationError[];
  metrics: {
    bankCount: number;
    canonicalConditionCount: number;
    uniqueQuestionReferenceCount: number;
    totalQuestionReferenceCount: number;
    reusedQuestionCount: number;
    variantCount: number;
    populatedBankCount: number;
    averageDefaultQuestionCount: number;
    maximumDefaultQuestionCount: number;
  };
};

export type QuestionBankValidationInput = {
  banks: readonly CanonicalSuggestedQuestionBank[];
  overrides?: readonly SuggestedQuestionBankOverride[];
  canonicalConditions: readonly CanonicalCondition[];
  clinicalContentGroups: readonly ClinicalContentGroup[];
  classifications?: readonly IcdClassificationRecord[];
  questions: readonly QuestionDefinition[];
};
