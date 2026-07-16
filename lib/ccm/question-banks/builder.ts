import { findIcdClassificationByCode } from "../icd/classifier.ts";
import { SUGGESTED_QUESTION_REGISTRY } from "../question-bank/questions.ts";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  SUGGESTED_QUESTION_BANK_OVERRIDES,
  cloneCanonicalSuggestedQuestionBank,
  cloneSuggestedQuestionReference,
} from "./mappings.ts";
import type {
  BuildSuggestedQuestionBankInput,
  CanonicalSuggestedQuestionBank,
  ResolvedSuggestedQuestionBank,
  SuggestedQuestionBankOverride,
  SuggestedQuestionBankVariant,
  SuggestedQuestionReference,
} from "./types.ts";

function selectVariant(
  bank: CanonicalSuggestedQuestionBank,
  input: BuildSuggestedQuestionBankInput,
): SuggestedQuestionBankVariant | null {
  if (input.variantId) {
    return bank.variants.find((variant) => variant.id === input.variantId) ?? null;
  }
  if (!input.clinicalContentGroupId) return null;
  return bank.variants.find((variant) =>
    variant.activation === "clinical_content_group" &&
    variant.clinicalContentGroupIds.includes(input.clinicalContentGroupId as string)) ?? null;
}

function applyOverride(
  references: SuggestedQuestionReference[],
  override: SuggestedQuestionBankOverride | undefined,
): SuggestedQuestionReference[] {
  if (!override) return references.map(cloneSuggestedQuestionReference);
  const removed = new Set(override.removeQuestionIds);
  const patches = new Map(
    override.questionReferenceOverrides.map((reference) => [reference.questionId, reference]),
  );
  return references
    .filter((reference) => !removed.has(reference.questionId))
    .map((reference) => ({ ...reference, ...(patches.get(reference.questionId) ?? {}) }));
}

function mergeReferences(
  bank: CanonicalSuggestedQuestionBank,
  variant: SuggestedQuestionBankVariant | null,
  override: SuggestedQuestionBankOverride | undefined,
): SuggestedQuestionReference[] {
  return applyOverride(
    [...bank.questionReferences, ...(variant?.questionReferences ?? [])],
    override,
  ).sort((left, right) =>
    left.displayOrder - right.displayOrder || left.questionId.localeCompare(right.questionId));
}

export function buildSuggestedQuestionBank(
  input: BuildSuggestedQuestionBankInput,
  options: {
    banks?: CanonicalSuggestedQuestionBank[];
    overrides?: SuggestedQuestionBankOverride[];
  } = {},
): ResolvedSuggestedQuestionBank | null {
  const banks = options.banks ?? CANONICAL_SUGGESTED_QUESTION_BANKS;
  const overrides = options.overrides ?? SUGGESTED_QUESTION_BANK_OVERRIDES;
  const bank = banks.find((candidate) => candidate.canonicalConditionId === input.canonicalConditionId);
  if (!bank) return null;

  const variant = selectVariant(bank, input);
  const override = overrides.find((candidate) => candidate.bankId === bank.id);
  const definitions = new Map(SUGGESTED_QUESTION_REGISTRY.map((question) => [question.id, question]));
  const questions = mergeReferences(bank, variant, override)
    .filter((reference) => !input.context || reference.applicableContexts.includes(input.context))
    .map((reference) => {
    const definition = definitions.get(reference.questionId);
    if (!definition) {
      throw new Error(`Question bank ${bank.id} references missing question ${reference.questionId}.`);
    }
    return { ...reference, definition };
    });
  const conditionLabel = input.diagnosisTitle?.trim() ||
    (variant ? `${bank.displayName} - ${variant.label}` : bank.displayName);

  return {
    bankId: bank.id,
    canonicalConditionId: bank.canonicalConditionId,
    variantId: variant?.id ?? null,
    clinicalContentGroupId: input.clinicalContentGroupId ?? null,
    diagnosisCode: input.diagnosisCode ?? null,
    diagnosisTitle: input.diagnosisTitle ?? null,
    heading: `Suggested Questions for ${conditionLabel}`,
    questions,
  };
}

export function buildSuggestedQuestionBankForIcdCode(
  code: string,
): ResolvedSuggestedQuestionBank | null {
  const classification = findIcdClassificationByCode(code);
  if (!classification || classification.classification !== "PASS" || !classification.canonicalConditionId) {
    return null;
  }
  return buildSuggestedQuestionBank({
    canonicalConditionId: classification.canonicalConditionId,
    clinicalContentGroupId: classification.clinicalContentGroupId,
    diagnosisCode: classification.code,
    diagnosisTitle: classification.officialTitle ?? classification.title,
  });
}

export function createCanonicalSuggestedQuestionBank(input: {
  canonicalConditionId: string;
  displayName: string;
  questionReferences: SuggestedQuestionReference[];
  variants?: SuggestedQuestionBankVariant[];
}): CanonicalSuggestedQuestionBank {
  return cloneCanonicalSuggestedQuestionBank({
    id: `ccm-bank.${input.canonicalConditionId}`,
    canonicalConditionId: input.canonicalConditionId,
    displayName: input.displayName,
    status: "architecture_seed",
    sourceCanonicalConditionId: input.canonicalConditionId,
    applicableContexts: ["intake", "monthly_checkin", "care_plan_review", "annual_review"],
    reviewStatus: "DRAFT_CLINICAL_REVIEW",
    contentVersion: 1,
    questionReferences: input.questionReferences,
    variants: input.variants ?? [],
    notes: "Future bank scaffold references reusable question IDs only.",
  });
}
