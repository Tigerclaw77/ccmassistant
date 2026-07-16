import type { QuestionContext } from "../question-bank/types.ts";
import type {
  ClinicCustomQuestionVersion,
  QuestionBankCustomizationValidationError,
  QuestionBankCustomizationValidationErrorCode,
  QuestionBankCustomizationValidationInput,
  QuestionBankCustomizationValidationResult,
  QuestionBankFavoriteVersion,
  QuestionBankOverrideVersion,
  QuestionBankScopeOwner,
} from "./customization-types.ts";

const CONTEXTS = new Set<QuestionContext>([
  "intake",
  "monthly_checkin",
  "annual_review",
  "care_plan_review",
]);
const ANSWER_TYPES = new Set(["yes_no", "number", "text", "date", "single_select", "multi_select"]);
const STATES = new Set(["active", "retired"]);
const OPT_IN_STATUSES = new Set(["not_opted_in", "opted_in", "withdrawn"]);

function addError(
  errors: QuestionBankCustomizationValidationError[],
  code: QuestionBankCustomizationValidationErrorCode,
  path: string,
  message: string,
): void {
  errors.push({ code, path, message });
}

function validateScope(
  owner: QuestionBankScopeOwner,
  path: string,
  errors: QuestionBankCustomizationValidationError[],
): void {
  const hasClinic = Boolean(owner.clinicId.trim());
  const hasProvider = Boolean(owner.providerId?.trim());
  const hasCoordinator = Boolean(owner.coordinatorId?.trim());
  const valid = hasClinic && (
    (owner.scope === "clinic" && !hasProvider && !hasCoordinator) ||
    (owner.scope === "provider" && hasProvider && !hasCoordinator) ||
    (owner.scope === "coordinator" && hasProvider && hasCoordinator)
  );
  if (!valid) {
    addError(
      errors,
      "conflicting_scope",
      path,
      "Clinic records cannot name provider/coordinator owners; provider records require only a provider; coordinator records require both provider and coordinator owners.",
    );
  }
}

function ownerKey(owner: QuestionBankScopeOwner): string {
  return [owner.scope, owner.clinicId, owner.providerId ?? "", owner.coordinatorId ?? ""].join(":");
}

function validateVersionedRecords<T extends { id: string; version: number }>(
  records: readonly T[],
  logicalKey: (record: T) => string,
  path: string,
  errors: QuestionBankCustomizationValidationError[],
): void {
  const versions = new Set<string>();
  const ids = new Set<string>();
  records.forEach((record, index) => {
    if (!record.id.trim() || !Number.isInteger(record.version) || record.version < 1) {
      addError(errors, "invalid_version", `${path}[${index}]`, "Versioned records require an ID and a positive integer version.");
    }
    const versionKey = `${logicalKey(record)}:${record.version}`;
    if (versions.has(versionKey)) {
      addError(errors, "duplicate_version", `${path}[${index}].version`, `Version ${record.version} is duplicated for the same owner and target.`);
    }
    versions.add(versionKey);
    if (ids.has(record.id)) {
      addError(errors, "duplicate_version", `${path}[${index}].id`, `Record ID ${record.id} is duplicated.`);
    }
    ids.add(record.id);
  });
}

function latestCustomByOwner(
  records: readonly ClinicCustomQuestionVersion[],
): Map<string, ClinicCustomQuestionVersion> {
  const latest = new Map<string, ClinicCustomQuestionVersion>();
  for (const record of records) {
    const key = `${record.clinicId}:${record.questionId}`;
    const current = latest.get(key);
    if (!current || record.version > current.version) latest.set(key, record);
  }
  return latest;
}

function validateOverride(
  record: QuestionBankOverrideVersion,
  index: number,
  bankById: Map<string, {
    canonicalConditionId: string;
    questionReferences: Array<{ questionId: string }>;
    variants: Array<{ questionReferences: Array<{ questionId: string }> }>;
  }>,
  systemQuestionIds: Set<string>,
  latestCustom: Map<string, ClinicCustomQuestionVersion>,
  customHistory: Map<string, ClinicCustomQuestionVersion>,
  isLatestVersion: boolean,
  errors: QuestionBankCustomizationValidationError[],
): void {
  const path = `overrides[${index}]`;
  validateScope(record, path, errors);
  if (!STATES.has(record.state)) addError(errors, "invalid_version", `${path}.state`, `Unknown override state ${record.state}.`);
  const bank = bankById.get(record.bankId);
  if (!bank) addError(errors, "orphan_bank", `${path}.bankId`, `Override references unknown bank ${record.bankId}.`);
  if (bank && bank.canonicalConditionId !== record.canonicalConditionId) {
    addError(errors, "orphan_condition", `${path}.canonicalConditionId`, "Override condition does not own the referenced bank.");
  }
  const bankQuestionIds = new Set([
    ...(bank?.questionReferences.map((reference) => reference.questionId) ?? []),
    ...(bank?.variants.flatMap((variant) => variant.questionReferences.map((reference) => reference.questionId)) ?? []),
  ]);
  const seen = new Set<string>();
  record.changes.forEach((change, changeIndex) => {
    const changePath = `${path}.changes[${changeIndex}]`;
    if (seen.has(change.questionId)) {
      addError(errors, "duplicate_change", `${changePath}.questionId`, `Question ${change.questionId} is changed more than once in one override version.`);
    }
    seen.add(change.questionId);
    const customKey = `${record.clinicId}:${change.questionId}`;
    const custom = latestCustom.get(customKey);
    const historicalCustom = customHistory.get(customKey);
    if (!systemQuestionIds.has(change.questionId) && !historicalCustom) {
      addError(errors, change.questionId.startsWith("custom.") ? "orphan_custom_question" : "orphan_question", `${changePath}.questionId`, `Override references unknown question ${change.questionId}.`);
    }
    if (historicalCustom && historicalCustom.canonicalConditionId !== record.canonicalConditionId) {
      addError(errors, "orphan_custom_question", `${changePath}.questionId`, "Custom question must be active, clinic-owned, and assigned to the override condition.");
    }
    if (historicalCustom && isLatestVersion && record.state === "active" &&
      change.included === true && custom?.state !== "active") {
      addError(errors, "orphan_custom_question", `${changePath}.questionId`, "An effective override cannot include a retired custom question.");
    }
    const fieldCount = [
      change.included,
      change.displayOrder,
      change.defaultSelected,
      change.selectionLevel,
      change.applicableContexts,
    ].filter((value) => value !== undefined).length;
    if (fieldCount === 0) addError(errors, "invalid_change", changePath, "A question change must modify at least one property.");
    if (change.displayOrder !== undefined && (!Number.isInteger(change.displayOrder) || change.displayOrder < 0)) {
      addError(errors, "invalid_change", `${changePath}.displayOrder`, "Display order must be a non-negative integer.");
    }
    if (change.included === true && !bankQuestionIds.has(change.questionId) && change.displayOrder === undefined) {
      addError(errors, "invalid_change", `${changePath}.displayOrder`, "A question added outside the system bank requires an explicit display order.");
    }
    if (change.selectionLevel === "required" && change.defaultSelected === false) {
      addError(errors, "invalid_change", changePath, "Required questions cannot be unselected by default.");
    }
    if (change.applicableContexts && (
      change.applicableContexts.length === 0 ||
      new Set(change.applicableContexts).size !== change.applicableContexts.length ||
      change.applicableContexts.some((context) => !CONTEXTS.has(context))
    )) {
      addError(errors, "invalid_change", `${changePath}.applicableContexts`, "Applicable contexts must be a non-empty, unique set of supported contexts.");
    }
  });
}

function validateCustomQuestion(
  record: ClinicCustomQuestionVersion,
  index: number,
  conditionIds: Set<string>,
  errors: QuestionBankCustomizationValidationError[],
): void {
  const path = `customQuestions[${index}]`;
  if (record.scope !== "clinic" || record.ownerId !== record.clinicId || !record.clinicId.trim()) {
    addError(errors, "conflicting_scope", path, "Custom questions must be owned by exactly one clinic.");
  }
  if (!record.questionId.startsWith("custom.") || !record.text.trim() || !record.createdBy.trim()) {
    addError(errors, "invalid_custom_question", path, "Custom questions require a custom.* key, text, and creator.");
  }
  if (!ANSWER_TYPES.has(record.answerType) || !STATES.has(record.state)) {
    addError(errors, "invalid_custom_question", path, "Custom question answer type or lifecycle state is invalid.");
  }
  if (!conditionIds.has(record.canonicalConditionId)) {
    addError(errors, "orphan_condition", `${path}.canonicalConditionId`, `Custom question references unknown condition ${record.canonicalConditionId}.`);
  }
  if (record.contexts.length === 0 || new Set(record.contexts).size !== record.contexts.length ||
    record.contexts.some((context) => !CONTEXTS.has(context))) {
    addError(errors, "invalid_custom_question", `${path}.contexts`, "Custom questions require one or more unique supported contexts.");
  }
}

function validateFavorite(
  record: QuestionBankFavoriteVersion,
  index: number,
  conditionIds: Set<string>,
  errors: QuestionBankCustomizationValidationError[],
): void {
  const path = `favorites[${index}]`;
  validateScope(record, path, errors);
  if (!STATES.has(record.state)) addError(errors, "invalid_version", `${path}.state`, `Unknown favorite state ${record.state}.`);
  if (!conditionIds.has(record.canonicalConditionId)) {
    addError(errors, "orphan_condition", `${path}.canonicalConditionId`, `Favorite references unknown condition ${record.canonicalConditionId}.`);
  }
  if (!Number.isInteger(record.displayOrder) || record.displayOrder < 0) {
    addError(errors, "invalid_favorite", `${path}.displayOrder`, "Favorite display order must be a non-negative integer.");
  }
}

export function validateQuestionBankCustomization(
  input: QuestionBankCustomizationValidationInput,
): QuestionBankCustomizationValidationResult {
  const errors: QuestionBankCustomizationValidationError[] = [];
  const overrides = input.overrides ?? [];
  const customQuestions = input.customQuestions ?? [];
  const favorites = input.favorites ?? [];
  const contributions = input.contributions ?? [];
  const bankById = new Map(input.banks.map((bank) => [bank.id, bank]));
  const conditionIds = new Set(input.banks.map((bank) => bank.canonicalConditionId));
  const systemQuestionIds = new Set<string>(input.questionIds);

  validateVersionedRecords(overrides, (record) => `${ownerKey(record)}:${record.bankId}`, "overrides", errors);
  validateVersionedRecords(customQuestions, (record) => `${record.clinicId}:${record.questionId}`, "customQuestions", errors);
  validateVersionedRecords(favorites, (record) => `${ownerKey(record)}:${record.canonicalConditionId}`, "favorites", errors);

  customQuestions.forEach((record, index) => validateCustomQuestion(record, index, conditionIds, errors));
  const latestCustom = latestCustomByOwner(customQuestions);
  const customHistory = new Map<string, ClinicCustomQuestionVersion>();
  customQuestions.forEach((record) => customHistory.set(`${record.clinicId}:${record.questionId}`, record));
  const latestOverrides = new Map<string, QuestionBankOverrideVersion>();
  overrides.forEach((record) => {
    const key = `${ownerKey(record)}:${record.bankId}`;
    const current = latestOverrides.get(key);
    if (!current || record.version > current.version) latestOverrides.set(key, record);
  });
  overrides.forEach((record, index) =>
    validateOverride(
      record,
      index,
      bankById,
      systemQuestionIds,
      latestCustom,
      customHistory,
      latestOverrides.get(`${ownerKey(record)}:${record.bankId}`)?.id === record.id,
      errors,
    ));
  favorites.forEach((record, index) => validateFavorite(record, index, conditionIds, errors));

  contributions.forEach((candidate, index) => {
    const path = `contributions[${index}]`;
    if (!conditionIds.has(candidate.canonicalConditionId)) {
      addError(errors, "orphan_condition", `${path}.canonicalConditionId`, `Contribution references unknown condition ${candidate.canonicalConditionId}.`);
    }
    if (!candidate.id.trim() || !candidate.question.trim() || !CONTEXTS.has(candidate.context) ||
      !Number.isInteger(candidate.usageCount) || candidate.usageCount < 0 || !candidate.noPhiAttested ||
      !OPT_IN_STATUSES.has(candidate.optInStatus)) {
      addError(errors, "invalid_contribution", path, "Contributions require an ID, question, supported context, non-negative usage count, and no-PHI attestation.");
    }
    if (candidate.anonymous !== (candidate.createdBy === null)) {
      addError(errors, "invalid_contribution", path, "Anonymous contributions must omit createdBy; identified contributions must include it.");
    }
  });

  return { valid: errors.length === 0, errors };
}
