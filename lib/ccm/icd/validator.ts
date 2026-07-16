import {
  CANONICAL_PROFILE_STATUSES,
  ICD_CLASSIFICATIONS,
  ICD_GENERATED_STATUSES,
  ICD_REVIEW_STATUSES,
  type CanonicalCondition,
  type ClinicalContentGroup,
  type IcdClassificationRecord,
  type IcdGeneratedStatus,
  type IcdKnowledgeBase,
  type IcdReviewStatus,
  type IcdValidationError,
  type IcdValidationErrorCode,
  type IcdValidationResult,
} from "./types.ts";

export function normalizeIcdCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, "").trim();
}

export function compactIcdCode(code: string): string {
  return normalizeIcdCode(code).replace(/\./g, "");
}

function isValidClassification(value: string): boolean {
  return ICD_CLASSIFICATIONS.includes(value as (typeof ICD_CLASSIFICATIONS)[number]);
}

function isValidReviewStatus(value: string): value is IcdReviewStatus {
  return ICD_REVIEW_STATUSES.includes(value as IcdReviewStatus);
}

function isValidGeneratedStatus(value: string): value is IcdGeneratedStatus {
  return ICD_GENERATED_STATUSES.includes(value as IcdGeneratedStatus);
}

function addError(
  errors: IcdValidationError[],
  code: IcdValidationErrorCode,
  path: string,
  message: string,
): void {
  errors.push({ code, path, message });
}

function validateCanonicalConditions(
  conditions: CanonicalCondition[],
  errors: IcdValidationError[],
): Set<string> {
  const canonicalIds = new Set<string>();
  const seenCanonicalIds = new Map<string, number>();

  conditions.forEach((condition, index) => {
    const path = `canonicalConditions[${index}]`;
    const normalizedId = condition.id.trim().toLowerCase();

    if (!normalizedId) {
      addError(errors, "invalid_canonical_condition", `${path}.id`, "Canonical condition ID is required.");
      return;
    }

    if (seenCanonicalIds.has(normalizedId)) {
      addError(
        errors,
        "duplicate_canonical_id",
        `${path}.id`,
        `Canonical condition ID "${condition.id}" is duplicated.`,
      );
    }

    seenCanonicalIds.set(normalizedId, index);
    canonicalIds.add(normalizedId);

    if (!condition.name.trim()) {
      addError(errors, "invalid_canonical_condition", `${path}.name`, "Canonical condition name is required.");
    }

    if (!CANONICAL_PROFILE_STATUSES.includes(condition.profileStatus)) {
      addError(
        errors,
        "invalid_canonical_condition",
        `${path}.profileStatus`,
        `Profile status "${condition.profileStatus}" is not supported.`,
      );
    }
  });

  return canonicalIds;
}

function validateClassificationRecord(
  record: IcdClassificationRecord,
  index: number,
  canonicalIds: Set<string>,
  clinicalContentGroupIds: Set<string>,
  seenCodes: Map<string, number>,
  seenMappings: Map<string, number>,
  errors: IcdValidationError[],
): void {
  const path = `classifications[${index}]`;
  const normalizedCode = normalizeIcdCode(record.code);
  const compactCode = compactIcdCode(record.code);

  if (!normalizedCode) {
    addError(errors, "missing_code", `${path}.code`, "ICD code is required.");
  } else if (!/^[A-Z][A-Z0-9]{2,6}$/.test(compactCode)) {
    addError(errors, "invalid_code_format", `${path}.code`, `ICD code "${record.code}" has an invalid format.`);
  }

  if (!record.title.trim()) {
    addError(errors, "missing_title", `${path}.title`, "ICD title is required.");
  }

  if (!isValidClassification(record.classification)) {
    addError(
      errors,
      "invalid_classification",
      `${path}.classification`,
      `Classification "${record.classification}" is not PASS, FAIL, or UNSURE.`,
    );
  }

  if (!record.rationale.trim()) {
    addError(errors, "missing_rationale", `${path}.rationale`, "A short rationale is required.");
  }

  if (!isValidReviewStatus(record.reviewStatus)) {
    addError(
      errors,
      "invalid_review_status",
      `${path}.reviewStatus`,
      `Review status "${record.reviewStatus}" is not supported.`,
    );
  }

  if (!isValidGeneratedStatus(record.generatedStatus)) {
    addError(
      errors,
      "invalid_generated_status",
      `${path}.generatedStatus`,
      `Generated status "${record.generatedStatus}" is not supported.`,
    );
  }

  const duplicateCodeIndex = seenCodes.get(compactCode);
  if (duplicateCodeIndex !== undefined) {
    addError(
      errors,
      "duplicate_icd_code",
      `${path}.code`,
      `ICD code "${record.code}" duplicates classifications[${duplicateCodeIndex}].code.`,
    );
  }
  seenCodes.set(compactCode, index);

  if (record.canonicalConditionId !== null) {
    const normalizedConditionId = record.canonicalConditionId.trim().toLowerCase();
    if (!canonicalIds.has(normalizedConditionId)) {
      addError(
        errors,
        "orphan_mapping",
        `${path}.canonicalConditionId`,
        `Canonical condition "${record.canonicalConditionId}" does not exist.`,
      );
    }

    const duplicateMappingIndex = seenMappings.get(compactCode);
    if (duplicateMappingIndex !== undefined) {
      addError(
        errors,
        "duplicate_icd_mapping",
        `${path}.canonicalConditionId`,
        `ICD code "${record.code}" already has a canonical mapping in classifications[${duplicateMappingIndex}].`,
      );
    }
    seenMappings.set(compactCode, index);
  }

  if (record.clinicalContentGroupId) {
    if (!clinicalContentGroupIds.has(record.clinicalContentGroupId.toLowerCase())) {
      addError(
        errors,
        "orphan_clinical_content_group",
        `${path}.clinicalContentGroupId`,
        `Clinical content group "${record.clinicalContentGroupId}" does not exist.`,
      );
    }
    if (!record.canonicalConditionId) {
      addError(
        errors,
        "orphan_clinical_content_group",
        `${path}.clinicalContentGroupId`,
        "A clinical content group mapping requires a canonical condition mapping.",
      );
    }
  }
}

function validateClinicalContentGroups(
  groups: ClinicalContentGroup[],
  canonicalIds: Set<string>,
  errors: IcdValidationError[],
): Set<string> {
  const ids = new Set<string>();
  groups.forEach((group, index) => {
    const path = `clinicalContentGroups[${index}]`;
    const id = group.id.trim().toLowerCase();
    if (ids.has(id)) {
      addError(errors, "duplicate_clinical_content_group_id", `${path}.id`, `Clinical content group ID "${group.id}" is duplicated.`);
    }
    ids.add(id);
    if (!canonicalIds.has(group.canonicalConditionId.trim().toLowerCase())) {
      addError(errors, "orphan_mapping", `${path}.canonicalConditionId`, `Canonical condition "${group.canonicalConditionId}" does not exist.`);
    }
  });
  return ids;
}

function lateralityGroupingKey(record: IcdClassificationRecord): string | null {
  if (!record.variantMetadata?.laterality || record.clinicallyMaterialDistinction) return null;
  const normalizedTitle = record.title
    .toLowerCase()
    .replace(/\b(right|left|bilateral|unilateral|unspecified side)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${record.canonicalConditionId ?? "none"}|${normalizedTitle}`;
}

export function validateIcdKnowledgeBase(knowledgeBase: IcdKnowledgeBase): IcdValidationResult {
  const errors: IcdValidationError[] = [];
  const canonicalIds = validateCanonicalConditions(knowledgeBase.canonicalConditions, errors);
  const clinicalContentGroupIds = validateClinicalContentGroups(
    knowledgeBase.clinicalContentGroups ?? [],
    canonicalIds,
    errors,
  );
  const seenCodes = new Map<string, number>();
  const seenMappings = new Map<string, number>();

  knowledgeBase.classifications.forEach((record, index) => {
    validateClassificationRecord(record, index, canonicalIds, clinicalContentGroupIds, seenCodes, seenMappings, errors);
  });

  const lateralityGroups = new Map<string, string>();
  knowledgeBase.classifications.forEach((record, index) => {
    const key = lateralityGroupingKey(record);
    if (!key || !record.clinicalContentGroupId) return;
    const prior = lateralityGroups.get(key);
    if (prior && prior !== record.clinicalContentGroupId) {
      addError(errors, "inconsistent_laterality_grouping", `classifications[${index}].clinicalContentGroupId`, `Non-material laterality variant is split between "${prior}" and "${record.clinicalContentGroupId}".`);
    }
    lateralityGroups.set(key, record.clinicalContentGroupId);
  });

  const mappedRecords = knowledgeBase.classifications.filter((record) => record.clinicalContentGroupId);
  if (mappedRecords.length >= 10 && clinicalContentGroupIds.size / mappedRecords.length > 0.85) {
    addError(errors, "profile_explosion", "clinicalContentGroups", "Clinical content groups are too close to one-per-code; shared CCM concepts must reuse groups.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidIcdKnowledgeBase(knowledgeBase: IcdKnowledgeBase): void {
  const validation = validateIcdKnowledgeBase(knowledgeBase);

  if (!validation.valid) {
    const message = validation.errors
      .map((error) => `${error.code} at ${error.path}: ${error.message}`)
      .join("\n");
    throw new Error(`Invalid ICD knowledge base:\n${message}`);
  }
}
