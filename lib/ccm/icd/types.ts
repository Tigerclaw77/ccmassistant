export const ICD_CLASSIFICATIONS = ["PASS", "FAIL", "UNSURE"] as const;
export type IcdClassification = (typeof ICD_CLASSIFICATIONS)[number];

export const ICD_REVIEW_STATUSES = [
  "system_reviewed",
  "needs_clinical_review",
  "imported_unreviewed",
  "authorized_override",
] as const;
export type IcdReviewStatus = (typeof ICD_REVIEW_STATUSES)[number];

export const ICD_GENERATED_STATUSES = [
  "not_generated",
  "mapped_existing",
  "pending_generation",
  "generated",
  "deferred",
  "blocked",
] as const;
export type IcdGeneratedStatus = (typeof ICD_GENERATED_STATUSES)[number];

export const CANONICAL_PROFILE_STATUSES = [
  "starter_placeholder",
  "generated_placeholder",
  "authored",
] as const;
export type CanonicalProfileStatus = (typeof CANONICAL_PROFILE_STATUSES)[number];

export type IcdCodeInput = {
  code: string;
  title?: string | null;
};

export type IcdVariantMetadata = {
  laterality: "right" | "left" | "bilateral" | "unspecified" | null;
  anatomicSite: string | null;
  encounter: "initial" | "subsequent" | "sequela" | null;
  stage: string | null;
  severity: string | null;
  complication: string | null;
};

export type IcdGroupingConfidence = "high" | "low" | "not_grouped";

export type IcdClassificationRecord = {
  code: string;
  title: string;
  classification: IcdClassification;
  rationale: string;
  canonicalConditionId: string | null;
  sourceCode?: string;
  officialTitle?: string;
  billable?: boolean;
  clinicalContentGroupId?: string | null;
  variantMetadata?: IcdVariantMetadata;
  clinicallyMaterialDistinction?: boolean;
  groupingConfidence?: IcdGroupingConfidence;
  unmappedPass?: boolean;
  reviewStatus: IcdReviewStatus;
  generatedStatus: IcdGeneratedStatus;
};

export type ClinicalContentGroup = {
  id: string;
  canonicalConditionId: string;
  name: string;
  variant: string;
  materialDimensions: string[];
  codes: string[];
};

export type CanonicalConditionContent = {
  questionModules: string[];
  carePlanTemplateId: string | null;
  commonGoals: string[];
  monitoringConcepts: string[];
  educationTopics: string[];
  commonInterventions: string[];
  relatedConditionIds: string[];
  clinicalNotes: string[];
  icdMappings: string[];
};

export type CanonicalCondition = {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  clinicalDomain: string;
  profileStatus: CanonicalProfileStatus;
  content: CanonicalConditionContent;
};

export type IcdKnowledgeBase = {
  canonicalConditions: CanonicalCondition[];
  classifications: IcdClassificationRecord[];
  clinicalContentGroups?: ClinicalContentGroup[];
};

export type IcdValidationErrorCode =
  | "duplicate_canonical_id"
  | "duplicate_icd_code"
  | "duplicate_icd_mapping"
  | "duplicate_clinical_content_group_id"
  | "invalid_canonical_condition"
  | "invalid_classification"
  | "invalid_code_format"
  | "invalid_generated_status"
  | "invalid_review_status"
  | "missing_code"
  | "missing_rationale"
  | "missing_title"
  | "orphan_mapping"
  | "orphan_clinical_content_group"
  | "incompatible_content_groups"
  | "inconsistent_laterality_grouping"
  | "profile_explosion";

export type IcdValidationError = {
  code: IcdValidationErrorCode;
  message: string;
  path: string;
};

export type IcdValidationResult = {
  valid: boolean;
  errors: IcdValidationError[];
};

export type IcdGenerationAction =
  | "map_existing"
  | "generate_profile"
  | "defer_until_selected"
  | "generate_after_selection"
  | "block_generation";

export type ConditionGenerationPlan = {
  action: IcdGenerationAction;
  classification: IcdClassificationRecord;
  reason: string;
  canonicalCondition: CanonicalCondition | null;
  generatedCondition: CanonicalCondition | null;
};

export type SelectedDiagnosisGenerationRequest = {
  userId: string;
  reason: string;
  timestamp?: string;
};

export type FailDiagnosisOverride = {
  icd: {
    code: string;
    title: string;
  };
  timestamp: string;
  userId: string;
  reason: string;
  originalClassification: IcdClassification;
  originalRationale: string;
  reviewStatus: "authorized_override";
  generatedCondition: CanonicalCondition;
};
