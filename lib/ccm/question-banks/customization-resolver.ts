import { SUGGESTED_QUESTION_REGISTRY } from "../question-bank/questions.ts";
import type { QuestionDefinition } from "../question-bank/types.ts";
import { buildSuggestedQuestionBank } from "./builder.ts";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  SUGGESTED_QUESTION_BANK_OVERRIDES,
} from "./mappings.ts";
import type {
  CanonicalSuggestedQuestionBank,
  SuggestedQuestionBankOverride,
  SuggestedQuestionReference,
} from "./types.ts";
import type {
  ClinicCustomQuestionVersion,
  CustomQuestionDefinitionSnapshot,
  QuestionBankCustomizationData,
  QuestionBankCustomizationIdentity,
  QuestionBankCustomizationScope,
  QuestionBankDiscoveryItem,
  QuestionBankFavoriteVersion,
  QuestionBankOverrideVersion,
  QuestionBankQuestionChange,
  QuestionBankQuestionKey,
  ResolveCustomizedQuestionBankInput,
  ResolvedCustomizedQuestion,
  ResolvedCustomizedQuestionBank,
  ResolvedQuestionBankFavorite,
} from "./customization-types.ts";
import { validateQuestionBankCustomization } from "./customization-validation.ts";

type ResolverOptions = {
  banks?: CanonicalSuggestedQuestionBank[];
  systemOverrides?: SuggestedQuestionBankOverride[];
  questions?: QuestionDefinition[];
};

type WorkingQuestion = ResolvedCustomizedQuestion & { included: boolean };

const SCOPE_ORDER: readonly QuestionBankCustomizationScope[] = [
  "clinic",
  "provider",
  "coordinator",
];

function scopeKey(owner: {
  clinicId: string;
  providerId: string | null;
  coordinatorId: string | null;
  scope: QuestionBankCustomizationScope;
}): string {
  return [owner.scope, owner.clinicId, owner.providerId ?? "", owner.coordinatorId ?? ""].join(":");
}

function latestByKey<T extends { version: number }>(
  records: readonly T[],
  keyFor: (record: T) => string,
): Map<string, T> {
  const latest = new Map<string, T>();
  for (const record of records) {
    const key = keyFor(record);
    const current = latest.get(key);
    if (!current || record.version > current.version) latest.set(key, record);
  }
  return latest;
}

function identityMatchesScope(
  record: {
    clinicId: string;
    providerId: string | null;
    coordinatorId: string | null;
    scope: QuestionBankCustomizationScope;
  },
  identity: QuestionBankCustomizationIdentity,
): boolean {
  if (record.clinicId !== identity.clinicId) return false;
  if (record.scope === "clinic") return true;
  if (record.scope === "provider") return record.providerId === identity.providerId;
  return record.providerId === identity.providerId &&
    record.coordinatorId === identity.coordinatorId;
}

function assertValidIdentity(identity: QuestionBankCustomizationIdentity): void {
  if (!identity.clinicId.trim()) throw new Error("A clinic identity is required to resolve customizations.");
  if (identity.coordinatorId && !identity.providerId) {
    throw new Error("A coordinator customization must be resolved within a provider scope.");
  }
}

function latestCustomQuestions(
  records: readonly ClinicCustomQuestionVersion[],
  clinicId: string,
): Map<string, ClinicCustomQuestionVersion> {
  const latest = latestByKey(
    records.filter((record) => record.clinicId === clinicId),
    (record) => `${record.clinicId}:${record.questionId}`,
  );
  return new Map(
    [...latest.values()]
      .filter((record) => record.state === "active")
      .map((record) => [record.questionId, record]),
  );
}

function customDefinition(record: ClinicCustomQuestionVersion): CustomQuestionDefinitionSnapshot {
  return {
    id: record.questionId,
    version: record.version,
    text: record.text,
    helperText: record.helperText,
    answerType: record.answerType,
    contexts: [...record.contexts],
  };
}

function selectionFlags(level: ResolvedCustomizedQuestion["selectionLevel"]): Pick<
  ResolvedCustomizedQuestion,
  "optional" | "recommended" | "required"
> {
  return {
    optional: level !== "required",
    recommended: level !== "optional",
    required: level === "required",
  };
}

function systemReferenceTemplate(
  bank: CanonicalSuggestedQuestionBank,
  questionId: QuestionBankQuestionKey,
): SuggestedQuestionReference | null {
  return [...bank.questionReferences, ...bank.variants.flatMap((variant) => variant.questionReferences)]
    .find((reference) => reference.questionId === questionId) ?? null;
}

function createWorkingQuestion(
  change: QuestionBankQuestionChange,
  bank: CanonicalSuggestedQuestionBank,
  definitions: Map<string, QuestionDefinition>,
  customQuestions: Map<string, ClinicCustomQuestionVersion>,
): WorkingQuestion {
  if (change.displayOrder === undefined) {
    throw new Error(`Question ${change.questionId} needs a display order before it can be added to ${bank.id}.`);
  }
  const systemDefinition = definitions.get(change.questionId);
  const custom = customQuestions.get(change.questionId);
  if (!systemDefinition && !custom) throw new Error(`Unknown question override target: ${change.questionId}.`);
  const template = systemReferenceTemplate(bank, change.questionId);
  const selectionLevel = change.selectionLevel ?? template?.selectionLevel ??
    (systemDefinition?.required ? "required" : "optional");
  const flags = selectionFlags(selectionLevel);
  return {
    questionId: change.questionId,
    displayOrder: change.displayOrder,
    defaultSelected: selectionLevel === "required"
      ? true
      : change.defaultSelected ?? template?.defaultSelected ?? false,
    ...flags,
    selectionLevel,
    applicableContexts: [...(
      change.applicableContexts ?? template?.applicableContexts ??
      systemDefinition?.contexts ?? custom?.contexts ?? []
    )],
    definition: systemDefinition ?? customDefinition(custom as ClinicCustomQuestionVersion),
    source: systemDefinition ? "system" : "clinic_custom",
    appliedScopes: [],
    included: true,
  };
}

function applyChange(
  questions: Map<QuestionBankQuestionKey, WorkingQuestion>,
  change: QuestionBankQuestionChange,
  scope: QuestionBankCustomizationScope,
  bank: CanonicalSuggestedQuestionBank,
  definitions: Map<string, QuestionDefinition>,
  customQuestions: Map<string, ClinicCustomQuestionVersion>,
): void {
  let question = questions.get(change.questionId);
  if (!question) {
    if (change.included !== true) return;
    question = createWorkingQuestion(change, bank, definitions, customQuestions);
    questions.set(change.questionId, question);
  }

  if (change.included !== undefined) question.included = change.included;
  if (change.displayOrder !== undefined) question.displayOrder = change.displayOrder;
  if (change.applicableContexts) question.applicableContexts = [...change.applicableContexts];
  if (change.selectionLevel) {
    question.selectionLevel = change.selectionLevel;
    Object.assign(question, selectionFlags(change.selectionLevel));
  }
  if (change.defaultSelected !== undefined) question.defaultSelected = change.defaultSelected;
  if (question.required) question.defaultSelected = true;
  if (!question.appliedScopes.includes(scope)) question.appliedScopes.push(scope);
}

function activeOverrideLayers(
  records: readonly QuestionBankOverrideVersion[],
  bankId: string,
  identity: QuestionBankCustomizationIdentity,
): QuestionBankOverrideVersion[] {
  const latest = latestByKey(
    records.filter((record) => record.bankId === bankId),
    (record) => `${scopeKey(record)}:${record.bankId}`,
  );
  return SCOPE_ORDER.flatMap((scope) => {
    const match = [...latest.values()].find((record) =>
      record.scope === scope && identityMatchesScope(record, identity));
    return match?.state === "active" ? [match] : [];
  });
}

export function resolveCustomizedSuggestedQuestionBank(
  input: ResolveCustomizedQuestionBankInput,
  data: QuestionBankCustomizationData = {},
  options: ResolverOptions = {},
): ResolvedCustomizedQuestionBank | null {
  assertValidIdentity(input.identity);
  const banks = options.banks ?? CANONICAL_SUGGESTED_QUESTION_BANKS;
  const definitions = options.questions ?? SUGGESTED_QUESTION_REGISTRY;
  const validation = validateQuestionBankCustomization({
    ...data,
    banks,
    questionIds: definitions.map((question) => question.id),
  });
  if (!validation.valid) {
    throw new Error(validation.errors.map((error) => `${error.path}: ${error.message}`).join("\n"));
  }

  const systemBank = buildSuggestedQuestionBank({
    canonicalConditionId: input.canonicalConditionId,
    clinicalContentGroupId: input.clinicalContentGroupId,
    diagnosisCode: input.diagnosisCode,
    diagnosisTitle: input.diagnosisTitle,
    variantId: input.variantId,
  }, {
    banks,
    overrides: options.systemOverrides ?? SUGGESTED_QUESTION_BANK_OVERRIDES,
  });
  if (!systemBank) return null;
  const bank = banks.find((candidate) => candidate.id === systemBank.bankId);
  if (!bank) return null;

  const definitionMap = new Map(definitions.map((question) => [question.id, question]));
  const customQuestionMap = latestCustomQuestions(data.customQuestions ?? [], input.identity.clinicId);
  const questions = new Map<QuestionBankQuestionKey, WorkingQuestion>(
    systemBank.questions.map((question) => [question.questionId, {
      questionId: question.questionId,
      displayOrder: question.displayOrder,
      defaultSelected: question.defaultSelected,
      optional: question.optional,
      recommended: question.recommended,
      required: question.required,
      selectionLevel: question.selectionLevel,
      applicableContexts: [...question.applicableContexts],
      definition: question.definition,
      source: "system" as const,
      appliedScopes: [],
      included: true,
    }]),
  );

  const appliedOverrides = activeOverrideLayers(data.overrides ?? [], bank.id, input.identity);
  for (const override of appliedOverrides) {
    for (const change of override.changes) {
      applyChange(questions, change, override.scope, bank, definitionMap, customQuestionMap);
    }
  }

  const resolvedQuestions = [...questions.values()]
    .filter((question) => question.included)
    .filter((question) => !input.context || question.applicableContexts.includes(input.context))
    .sort((left, right) => left.displayOrder - right.displayOrder ||
      left.questionId.localeCompare(right.questionId));
  const orders = new Set<number>();
  for (const question of resolvedQuestions) {
    if (orders.has(question.displayOrder)) {
      throw new Error(`Resolved bank ${bank.id} has conflicting display order ${question.displayOrder}.`);
    }
    orders.add(question.displayOrder);
  }

  return {
    ...systemBank,
    questions: resolvedQuestions.map(({ included, ...question }) => {
      void included;
      return question;
    }),
    appliedOverrides: appliedOverrides.map(({ id, scope, version }) => ({ id, scope, version })),
  };
}

export function resolveQuestionBankFavorites(
  identity: QuestionBankCustomizationIdentity,
  records: readonly QuestionBankFavoriteVersion[],
  banks: readonly CanonicalSuggestedQuestionBank[] = CANONICAL_SUGGESTED_QUESTION_BANKS,
): ResolvedQuestionBankFavorite[] {
  assertValidIdentity(identity);
  const bankByCondition = new Map(banks.map((bank) => [bank.canonicalConditionId, bank]));
  const latest = latestByKey(records, (record) =>
    `${scopeKey(record)}:${record.canonicalConditionId}`);
  const effective = new Map<string, ResolvedQuestionBankFavorite>();

  for (const scope of SCOPE_ORDER) {
    const layer = [...latest.values()]
      .filter((record) => record.scope === scope && identityMatchesScope(record, identity))
      .sort((left, right) => left.canonicalConditionId.localeCompare(right.canonicalConditionId));
    for (const record of layer) {
      if (record.state !== "active") continue;
      if (!record.favorite) {
        effective.delete(record.canonicalConditionId);
        continue;
      }
      const bank = bankByCondition.get(record.canonicalConditionId);
      if (!bank) throw new Error(`Favorite references unknown condition ${record.canonicalConditionId}.`);
      effective.set(record.canonicalConditionId, {
        bankId: bank.id,
        canonicalConditionId: bank.canonicalConditionId,
        displayName: bank.displayName,
        displayOrder: record.displayOrder,
        sourceScope: record.scope,
      });
    }
  }

  return [...effective.values()].sort((left, right) =>
    left.displayOrder - right.displayOrder || left.displayName.localeCompare(right.displayName));
}

export function favoritesBeforeIcdSearch(
  favorites: readonly ResolvedQuestionBankFavorite[],
  icdSearchResults: readonly CanonicalSuggestedQuestionBank[],
): QuestionBankDiscoveryItem[] {
  const favoriteConditions = new Set(favorites.map((favorite) => favorite.canonicalConditionId));
  return [
    ...favorites.map((favorite) => ({
      bankId: favorite.bankId,
      canonicalConditionId: favorite.canonicalConditionId,
      displayName: favorite.displayName,
      source: "favorite" as const,
    })),
    ...icdSearchResults
      .filter((bank) => !favoriteConditions.has(bank.canonicalConditionId))
      .map((bank) => ({
        bankId: bank.id,
        canonicalConditionId: bank.canonicalConditionId,
        displayName: bank.displayName,
        source: "icd_search" as const,
      })),
  ];
}
