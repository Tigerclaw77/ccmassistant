import type { ConditionManagerValue } from "./ConditionManager";
import type { PatientCondition } from "../../lib/ccm/types";

export function managerConditionFromPatient(
  condition: PatientCondition,
): ConditionManagerValue {
  return {
    addedBy: condition.created_by,
    canonicalName: condition.canonical_name ?? condition.condition_name,
    ccmQualifying: condition.ccm_qualifying ?? true,
    codeSystem: condition.code_system,
    dateAdded: condition.created_at,
    displayName: condition.display_name ?? condition.condition_name,
    icd10Code: condition.code,
    id: condition.id,
    isActive: condition.is_active,
    normalizationStatus: condition.normalization_status ?? "manual",
    notes: condition.notes,
    userEnteredText:
      condition.user_entered_text ??
      condition.display_name ??
      condition.condition_name,
  };
}

export function conditionPayload(conditions: ConditionManagerValue[]) {
  return conditions.map((condition) => ({
    canonicalName: condition.canonicalName,
    ccmQualifying: condition.ccmQualifying,
    codeSystem: condition.codeSystem ?? (condition.icd10Code ? "ICD-10" : null),
    displayName: condition.displayName,
    icd10Code: condition.icd10Code ?? null,
    id: condition.id ?? null,
    isActive: condition.isActive,
    normalizationStatus: condition.normalizationStatus,
    notes: condition.notes ?? null,
    userEnteredText: condition.userEnteredText,
  }));
}
