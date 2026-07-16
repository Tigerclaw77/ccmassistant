import catalogJson from "../../../data/question-banks/canonical-question-banks.json" with { type: "json" };
import overridesJson from "../../../data/question-banks/question-bank-overrides.json" with { type: "json" };
import type {
  CanonicalSuggestedQuestionBank,
  SuggestedQuestionBankCatalog,
  SuggestedQuestionBankOverride,
  SuggestedQuestionBankOverrideCatalog,
  SuggestedQuestionBankVariant,
  SuggestedQuestionReference,
} from "./types.ts";

const catalog = catalogJson as unknown as SuggestedQuestionBankCatalog;
const overrideCatalog = overridesJson as unknown as SuggestedQuestionBankOverrideCatalog;

export function cloneSuggestedQuestionReference(
  reference: SuggestedQuestionReference,
): SuggestedQuestionReference {
  return { ...reference, applicableContexts: [...reference.applicableContexts] };
}

export function cloneSuggestedQuestionBankVariant(
  variant: SuggestedQuestionBankVariant,
): SuggestedQuestionBankVariant {
  return {
    ...variant,
    clinicalContentGroupIds: [...variant.clinicalContentGroupIds],
    questionReferences: variant.questionReferences.map(cloneSuggestedQuestionReference),
  };
}

export function cloneCanonicalSuggestedQuestionBank(
  bank: CanonicalSuggestedQuestionBank,
): CanonicalSuggestedQuestionBank {
  return {
    ...bank,
    applicableContexts: [...bank.applicableContexts],
    questionReferences: bank.questionReferences.map(cloneSuggestedQuestionReference),
    variants: bank.variants.map(cloneSuggestedQuestionBankVariant),
  };
}

export function cloneSuggestedQuestionBankOverride(
  override: SuggestedQuestionBankOverride,
): SuggestedQuestionBankOverride {
  return {
    ...override,
    removeQuestionIds: [...override.removeQuestionIds],
    questionReferenceOverrides: override.questionReferenceOverrides.map((reference) => ({ ...reference })),
  };
}

export const CANONICAL_SUGGESTED_QUESTION_BANKS = catalog.banks.map(
  cloneCanonicalSuggestedQuestionBank,
);

export const SUGGESTED_QUESTION_BANK_OVERRIDES = overrideCatalog.overrides.map(
  cloneSuggestedQuestionBankOverride,
);

export const CANONICAL_SUGGESTED_QUESTION_BANKS_BY_ID = new Map(
  CANONICAL_SUGGESTED_QUESTION_BANKS.map((bank) => [bank.id, bank]),
);

export const CANONICAL_SUGGESTED_QUESTION_BANKS_BY_CONDITION = new Map(
  CANONICAL_SUGGESTED_QUESTION_BANKS.map((bank) => [bank.canonicalConditionId, bank]),
);

export function listCanonicalSuggestedQuestionBanks(
  banks: CanonicalSuggestedQuestionBank[] = CANONICAL_SUGGESTED_QUESTION_BANKS,
): CanonicalSuggestedQuestionBank[] {
  return banks.map(cloneCanonicalSuggestedQuestionBank);
}

export function findCanonicalSuggestedQuestionBank(
  canonicalConditionId: string,
  banks: CanonicalSuggestedQuestionBank[] = CANONICAL_SUGGESTED_QUESTION_BANKS,
): CanonicalSuggestedQuestionBank | null {
  const normalized = canonicalConditionId.trim().toLowerCase();
  const bank = banks.find((candidate) => candidate.canonicalConditionId.toLowerCase() === normalized);
  return bank ? cloneCanonicalSuggestedQuestionBank(bank) : null;
}
