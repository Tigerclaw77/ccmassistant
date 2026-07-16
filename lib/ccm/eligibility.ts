import type { JsonValue } from "./types";

export const REQUIRED_ELIGIBILITY_FACTS = [
  {
    key: "medicare_information_reviewed",
    label: "Medicare or payer information reviewed",
  },
  {
    key: "two_or_more_chronic_conditions",
    label: "Two or more chronic conditions documented",
  },
  {
    key: "conditions_expected_12_months",
    label: "Conditions are expected to last at least 12 months or until death",
  },
  {
    key: "significant_risk",
    label: "Conditions place the patient at significant risk",
  },
  {
    key: "no_known_duplicate_ccm",
    label: "No known duplicate CCM billing for this patient-month",
  },
] as const;

export const REQUIRED_PROVIDER_ATTESTATIONS = [
  {
    key: "provider_reviewed_conditions",
    label: "Billing practitioner reviewed the documented chronic conditions",
  },
  {
    key: "ccm_criteria_met",
    label: "Billing practitioner attests CCM chronic-condition criteria appear met",
  },
  {
    key: "medical_necessity",
    label: "Billing practitioner attests CCM services are medically necessary",
  },
  {
    key: "care_plan_needed",
    label: "Billing practitioner attests an ongoing care plan is needed",
  },
] as const;

export type EligibilityFactKey = (typeof REQUIRED_ELIGIBILITY_FACTS)[number]["key"];
export type ProviderAttestationKey = (typeof REQUIRED_PROVIDER_ATTESTATIONS)[number]["key"];
export type EligibilityFactState = Record<EligibilityFactKey, boolean>;
export type ProviderAttestationState = Record<ProviderAttestationKey, boolean>;

export type EligibilitySystemValidationState = {
  active_condition_count: number;
  has_assigned_provider: boolean;
  has_two_chronic_conditions: boolean;
  last_checked_at: string;
};

export type StructuredEligibilityMetadata = {
  facts: EligibilityFactState;
  provider_attestations: ProviderAttestationState;
  provider_attested_at?: string | null;
  provider_attested_by?: string | null;
  system_validations?: EligibilitySystemValidationState;
  last_updated_at?: string | null;
  last_updated_by?: string | null;
};

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function nestedObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function boolRecordFromMetadata<K extends string>(
  value: JsonValue | null | undefined,
  keys: readonly K[],
): Record<K, boolean> {
  const source = nestedObject(value);
  return Object.fromEntries(keys.map((key) => [key, source[key] === true])) as Record<K, boolean>;
}

function boolRecordToJson<K extends string>(value: Record<K, boolean>): JsonValue {
  return Object.fromEntries(
    Object.entries(value).map(([key, checked]) => [key, checked === true]),
  ) as JsonValue;
}

export function emptyEligibilityFacts(): EligibilityFactState {
  return Object.fromEntries(
    REQUIRED_ELIGIBILITY_FACTS.map((fact) => [fact.key, false]),
  ) as EligibilityFactState;
}

export function emptyProviderAttestations(): ProviderAttestationState {
  return Object.fromEntries(
    REQUIRED_PROVIDER_ATTESTATIONS.map((attestation) => [attestation.key, false]),
  ) as ProviderAttestationState;
}

export function eligibilityFactsFromMetadata(
  metadata: JsonValue | null | undefined,
): EligibilityFactState {
  const source = jsonObject(metadata);
  return boolRecordFromMetadata(
    source.facts,
    REQUIRED_ELIGIBILITY_FACTS.map((fact) => fact.key),
  );
}

export function providerAttestationsFromMetadata(
  metadata: JsonValue | null | undefined,
): ProviderAttestationState {
  const source = jsonObject(metadata);
  return boolRecordFromMetadata(
    source.provider_attestations,
    REQUIRED_PROVIDER_ATTESTATIONS.map((attestation) => attestation.key),
  );
}

export function eligibilityFactsToJson(facts: EligibilityFactState): JsonValue {
  return boolRecordToJson(facts);
}

export function providerAttestationsToJson(attestations: ProviderAttestationState): JsonValue {
  return boolRecordToJson(attestations);
}

export function allEligibilityFactsComplete(metadata: JsonValue | null | undefined): boolean {
  const facts = eligibilityFactsFromMetadata(metadata);
  return REQUIRED_ELIGIBILITY_FACTS.every((fact) => facts[fact.key]);
}

export function allProviderAttestationsComplete(metadata: JsonValue | null | undefined): boolean {
  const attestations = providerAttestationsFromMetadata(metadata);
  return REQUIRED_PROVIDER_ATTESTATIONS.every((attestation) => attestations[attestation.key]);
}

export function missingEligibilityFactLabels(metadata: JsonValue | null | undefined): string[] {
  const facts = eligibilityFactsFromMetadata(metadata);
  return REQUIRED_ELIGIBILITY_FACTS
    .filter((fact) => !facts[fact.key])
    .map((fact) => fact.label);
}

export function missingProviderAttestationLabels(
  metadata: JsonValue | null | undefined,
): string[] {
  const attestations = providerAttestationsFromMetadata(metadata);
  return REQUIRED_PROVIDER_ATTESTATIONS
    .filter((attestation) => !attestations[attestation.key])
    .map((attestation) => attestation.label);
}

export function systemValidationsFromMetadata(
  metadata: JsonValue | null | undefined,
): EligibilitySystemValidationState | null {
  const source = jsonObject(metadata);
  const validations = nestedObject(source.system_validations);

  if (Object.keys(validations).length === 0) {
    return null;
  }

  return {
    active_condition_count:
      typeof validations.active_condition_count === "number"
        ? validations.active_condition_count
        : Number(validations.active_condition_count ?? 0),
    has_assigned_provider: validations.has_assigned_provider === true,
    has_two_chronic_conditions: validations.has_two_chronic_conditions === true,
    last_checked_at:
      typeof validations.last_checked_at === "string" ? validations.last_checked_at : "",
  };
}

export function eligibilitySystemValidationsToJson(
  validations: EligibilitySystemValidationState,
): JsonValue {
  return {
    active_condition_count: validations.active_condition_count,
    has_assigned_provider: validations.has_assigned_provider,
    has_two_chronic_conditions: validations.has_two_chronic_conditions,
    last_checked_at: validations.last_checked_at,
  };
}

export function structuredEligibilityComplete(metadata: JsonValue | null | undefined): boolean {
  return allEligibilityFactsComplete(metadata) && allProviderAttestationsComplete(metadata);
}
