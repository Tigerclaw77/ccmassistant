import { QUESTION_BANK_STATUSES } from "./types.ts";
import { SUGGESTED_QUESTION_REGISTRY } from "../question-bank/questions.ts";
import {
  DEFAULT_CANONICAL_CONDITIONS,
  DEFAULT_CLINICAL_CONTENT_GROUPS,
  DEFAULT_ICD_CLASSIFICATIONS,
} from "../icd/mappings.ts";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  SUGGESTED_QUESTION_BANK_OVERRIDES,
} from "./mappings.ts";
import type {
  CanonicalSuggestedQuestionBank,
  QuestionBankValidationError,
  QuestionBankValidationErrorCode,
  QuestionBankValidationInput,
  QuestionBankValidationResult,
  SuggestedQuestionReference,
} from "./types.ts";

function addError(
  errors: QuestionBankValidationError[],
  code: QuestionBankValidationErrorCode,
  path: string,
  message: string,
): void {
  errors.push({ code, path, message });
}

function validateReferenceList(
  references: SuggestedQuestionReference[],
  path: string,
  questionIds: Set<string>,
  errors: QuestionBankValidationError[],
): void {
  const seenQuestions = new Set<string>();
  const seenOrders = new Set<number>();
  references.forEach((reference, index) => {
    const referencePath = `${path}[${index}]`;
    if (seenQuestions.has(reference.questionId)) {
      addError(errors, "duplicate_question_reference", `${referencePath}.questionId`, `Question ${reference.questionId} is referenced more than once.`);
    }
    seenQuestions.add(reference.questionId);
    if (!questionIds.has(reference.questionId)) {
      addError(errors, "orphan_question_id", `${referencePath}.questionId`, `Question ${reference.questionId} does not exist in the reusable registry.`);
    }
    if (!Number.isInteger(reference.displayOrder) || reference.displayOrder < 0) {
      addError(errors, "question_order_conflict", `${referencePath}.displayOrder`, "Display order must be a non-negative integer.");
    } else if (seenOrders.has(reference.displayOrder)) {
      addError(errors, "question_order_conflict", `${referencePath}.displayOrder`, `Display order ${reference.displayOrder} is duplicated.`);
    }
    seenOrders.add(reference.displayOrder);
    if (reference.required && (!reference.defaultSelected || reference.optional || !reference.recommended)) {
      addError(errors, "invalid_reference_flags", referencePath, "Required questions must be selected, recommended, and not optional.");
    }
    if (!reference.optional && !reference.required) {
      addError(errors, "invalid_reference_flags", referencePath, "A non-required question must be optional.");
    }
    const expectedLevel = reference.required ? "required" : reference.recommended ? "recommended" : "optional";
    if (reference.selectionLevel !== expectedLevel || reference.applicableContexts.length === 0 || !reference.clinicalRationale.trim() || !reference.followUpBehavior.trim()) {
      addError(errors, "missing_clinical_metadata", referencePath, "Question references require consistent selection level, contexts, rationale, and follow-up behavior.");
    }
  });
}

function normalizedLateralityTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(right|left|bilateral|unilateral|unspecified side)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bankQuestionIds(bank: CanonicalSuggestedQuestionBank): Set<string> {
  return new Set([
    ...bank.questionReferences.map((reference) => reference.questionId),
    ...bank.variants.flatMap((variant) => variant.questionReferences.map((reference) => reference.questionId)),
  ]);
}

export function validateSuggestedQuestionBankCatalog(
  input: QuestionBankValidationInput,
): QuestionBankValidationResult {
  const errors: QuestionBankValidationError[] = [];
  const canonicalIds = new Set(input.canonicalConditions.map((condition) => condition.id));
  const contentGroupIds = new Set(input.clinicalContentGroups.map((group) => group.id));
  const questionIds = new Set(input.questions.map((question) => question.id));
  const seenBankIds = new Set<string>();
  const seenCanonicalIds = new Set<string>();
  const contentGroupOwners = new Map<string, string>();
  const questionUsage = new Map<string, number>();
  let totalQuestionReferenceCount = 0;
  let variantCount = 0;
  const defaultQuestionCounts: number[] = [];
  let populatedBankCount = 0;

  const normalizedQuestionText = new Map<string, string>();
  input.questions.forEach((question, index) => {
    const normalized = question.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const prior = normalizedQuestionText.get(normalized);
    if (prior && prior !== question.id) {
      addError(errors, "duplicate_question_text", `questions[${index}].text`, `Question text duplicates ${prior} under ${question.id}.`);
    }
    normalizedQuestionText.set(normalized, question.id);
    if (question.reviewStatus === "DRAFT_CLINICAL_REVIEW" &&
      (!question.sourceCanonicalConditionIds?.length || !question.contexts.length || !question.clinicalRationale.trim() || !question.followUpBehavior?.trim() || !question.contentVersion)) {
      addError(errors, "missing_clinical_metadata", `questions[${index}]`, `Draft question ${question.id} is missing source, contexts, rationale, follow-up behavior, or content version.`);
    }
    [...question.displayWhen, ...question.followUpTriggers.flatMap((trigger) => trigger.actions.filter((action) => action.type === "show_questions").flatMap((action) => action.questionIds).map((questionId) => ({ questionId })))].forEach((rule) => {
      if (!questionIds.has(rule.questionId)) addError(errors, "invalid_branching_reference", `questions[${index}]`, `Question ${question.id} branches from or to missing question ${rule.questionId}.`);
    });
  });

  input.banks.forEach((bank, bankIndex) => {
    const path = `banks[${bankIndex}]`;
    if (seenBankIds.has(bank.id)) addError(errors, "duplicate_bank_id", `${path}.id`, `Bank ID ${bank.id} is duplicated.`);
    seenBankIds.add(bank.id);
    if (seenCanonicalIds.has(bank.canonicalConditionId)) {
      addError(errors, "duplicate_canonical_bank", `${path}.canonicalConditionId`, `Canonical condition ${bank.canonicalConditionId} owns more than one suggested bank.`);
    }
    seenCanonicalIds.add(bank.canonicalConditionId);
    if (!canonicalIds.has(bank.canonicalConditionId)) {
      addError(errors, "orphan_canonical_condition", `${path}.canonicalConditionId`, `Canonical condition ${bank.canonicalConditionId} does not exist.`);
    }
    if (["pain", "mobility_problem", "mobility_problems", "weakness", "fatigue"].includes(bank.canonicalConditionId.toLowerCase())) {
      addError(errors, "vague_canonical_condition", `${path}.canonicalConditionId`, `Vague symptom identity ${bank.canonicalConditionId} cannot own a condition bank.`);
    }
    if (!QUESTION_BANK_STATUSES.includes(bank.status)) {
      addError(errors, "invalid_reference_flags", `${path}.status`, `Bank status ${bank.status} is invalid.`);
    }
    if (bank.status === "draft_clinical_review") populatedBankCount += 1;
    if (bank.sourceCanonicalConditionId !== bank.canonicalConditionId || !bank.applicableContexts.length || bank.reviewStatus !== "DRAFT_CLINICAL_REVIEW" || !bank.contentVersion) {
      addError(errors, "missing_clinical_metadata", path, "Banks require matching source canonical identity, contexts, draft review status, and content version.");
    }
    if (/\b(right|left|bilateral|unilateral)\b/i.test(`${bank.id} ${bank.displayName}`)) {
      addError(errors, "laterality_generated_duplicate", path, "Bank identity must not encode laterality.");
    }
    if (bank.questionReferences.length === 0) addError(errors, "empty_bank", `${path}.questionReferences`, "A canonical suggested bank cannot be empty.");
    validateReferenceList(bank.questionReferences, `${path}.questionReferences`, questionIds, errors);
    const baseDefaultCount = bank.questionReferences.filter((reference) => reference.defaultSelected).length;
    if (bank.status === "draft_clinical_review") defaultQuestionCounts.push(baseDefaultCount);
    if (baseDefaultCount > 20) addError(errors, "excessive_default_questions", `${path}.questionReferences`, `Bank has ${baseDefaultCount} default questions; the maximum is 20.`);
    totalQuestionReferenceCount += bank.questionReferences.length;
    bank.questionReferences.forEach((reference) => questionUsage.set(reference.questionId, (questionUsage.get(reference.questionId) ?? 0) + 1));

    const variantIds = new Set<string>();
    bank.variants.forEach((variant, variantIndex) => {
      variantCount += 1;
      const variantPath = `${path}.variants[${variantIndex}]`;
      if (variantIds.has(variant.id)) addError(errors, "duplicate_variant_id", `${variantPath}.id`, `Variant ID ${variant.id} is duplicated within ${bank.id}.`);
      variantIds.add(variant.id);
      if (/\b(right|left|bilateral|unilateral)\b/i.test(`${variant.id} ${variant.label}`)) {
        addError(errors, "laterality_generated_duplicate", variantPath, "Variant identity must not encode laterality.");
      }
      if (variant.questionReferences.length === 0) addError(errors, "empty_bank", `${variantPath}.questionReferences`, "A declared variant must add at least one reusable question reference.");
      validateReferenceList(variant.questionReferences, `${variantPath}.questionReferences`, questionIds, errors);
      const baseQuestionIds = new Set(bank.questionReferences.map((reference) => reference.questionId));
      variant.questionReferences.forEach((reference, referenceIndex) => {
        if (baseQuestionIds.has(reference.questionId)) {
          addError(errors, "duplicate_question_reference", `${variantPath}.questionReferences[${referenceIndex}].questionId`, `Variant duplicates base question ${reference.questionId}.`);
        }
        questionUsage.set(reference.questionId, (questionUsage.get(reference.questionId) ?? 0) + 1);
      });
      const combinedOrders = new Map<number, string>();
      [...bank.questionReferences, ...variant.questionReferences].forEach((reference) => {
        const owner = combinedOrders.get(reference.displayOrder);
        if (owner && owner !== reference.questionId) {
          addError(errors, "question_order_conflict", variantPath, `Display order ${reference.displayOrder} conflicts between ${owner} and ${reference.questionId}.`);
        }
        combinedOrders.set(reference.displayOrder, reference.questionId);
      });
      totalQuestionReferenceCount += variant.questionReferences.length;
      const resolvedDefaultCount = [...bank.questionReferences, ...variant.questionReferences].filter((reference) => reference.defaultSelected).length;
      if (resolvedDefaultCount > 20) addError(errors, "excessive_default_questions", variantPath, `Resolved variant has ${resolvedDefaultCount} default questions; the maximum is 20.`);

      variant.clinicalContentGroupIds.forEach((groupId, groupIndex) => {
        if (!contentGroupIds.has(groupId)) {
          addError(errors, "orphan_clinical_content_group", `${variantPath}.clinicalContentGroupIds[${groupIndex}]`, `Clinical content group ${groupId} does not exist.`);
        }
        const priorOwner = contentGroupOwners.get(groupId);
        if (priorOwner) {
          addError(errors, "content_group_multiple_variants", `${variantPath}.clinicalContentGroupIds[${groupIndex}]`, `Clinical content group ${groupId} is assigned to both ${priorOwner} and ${bank.id}:${variant.id}.`);
          addError(errors, "incompatible_variant_combination", `${variantPath}.clinicalContentGroupIds[${groupIndex}]`, `Clinical content group ${groupId} cannot activate incompatible variants simultaneously.`);
        }
        contentGroupOwners.set(groupId, `${bank.id}:${variant.id}`);
      });
    });
  });

  input.canonicalConditions.forEach((condition, index) => {
    if (!seenCanonicalIds.has(condition.id)) {
      addError(errors, "missing_suggested_bank", `canonicalConditions[${index}].id`, `Canonical condition ${condition.id} has no suggested question bank.`);
    }
  });

  const bankByCanonical = new Map(input.banks.map((bank) => [bank.canonicalConditionId, bank.id]));
  const lateralityOwners = new Map<string, string>();
  for (const classification of input.classifications ?? []) {
    if (!classification.variantMetadata?.laterality || !classification.canonicalConditionId) continue;
    const bankId = bankByCanonical.get(classification.canonicalConditionId);
    if (!bankId) continue;
    const key = normalizedLateralityTitle(classification.officialTitle ?? classification.title);
    const prior = lateralityOwners.get(key);
    if (prior && prior !== bankId) {
      addError(errors, "laterality_generated_duplicate", "classifications", `Laterality variants for ${key} resolve to different banks: ${prior} and ${bankId}.`);
    }
    lateralityOwners.set(key, bankId);
  }

  const banksById = new Map(input.banks.map((bank) => [bank.id, bank]));
  (input.overrides ?? []).forEach((override, index) => {
    const bank = banksById.get(override.bankId);
    if (!bank) {
      addError(errors, "invalid_override", `overrides[${index}].bankId`, `Override bank ${override.bankId} does not exist.`);
      return;
    }
    const available = bankQuestionIds(bank);
    [...override.removeQuestionIds, ...override.questionReferenceOverrides.map((reference) => reference.questionId)].forEach((questionId) => {
      if (!available.has(questionId)) addError(errors, "invalid_override", `overrides[${index}]`, `Override targets question ${questionId}, which is not present in ${bank.id}.`);
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    metrics: {
      bankCount: input.banks.length,
      canonicalConditionCount: input.canonicalConditions.length,
      uniqueQuestionReferenceCount: questionUsage.size,
      totalQuestionReferenceCount,
      reusedQuestionCount: [...questionUsage.values()].filter((count) => count > 1).length,
      variantCount,
      populatedBankCount,
      averageDefaultQuestionCount: defaultQuestionCounts.length ? defaultQuestionCounts.reduce((sum, value) => sum + value, 0) / defaultQuestionCounts.length : 0,
      maximumDefaultQuestionCount: defaultQuestionCounts.length ? Math.max(...defaultQuestionCounts) : 0,
    },
  };
}

export function assertValidSuggestedQuestionBankCatalog(
  input: QuestionBankValidationInput,
): void {
  const result = validateSuggestedQuestionBankCatalog(input);
  if (!result.valid) {
    throw new Error(result.errors.map((error) => `${error.code} at ${error.path}: ${error.message}`).join("\n"));
  }
}

export function validateDefaultSuggestedQuestionBankCatalog(): QuestionBankValidationResult {
  return validateSuggestedQuestionBankCatalog({
    banks: CANONICAL_SUGGESTED_QUESTION_BANKS,
    overrides: SUGGESTED_QUESTION_BANK_OVERRIDES,
    canonicalConditions: DEFAULT_CANONICAL_CONDITIONS,
    clinicalContentGroups: DEFAULT_CLINICAL_CONTENT_GROUPS,
    classifications: DEFAULT_ICD_CLASSIFICATIONS,
    questions: SUGGESTED_QUESTION_REGISTRY,
  });
}
