import type { JsonValue } from "./types";

export const REQUIRED_CONSENT_ELEMENTS = [
  {
    key: "services_explained",
    label: "CCM services were explained",
  },
  {
    key: "cost_sharing_explained",
    label: "Possible cost sharing was explained",
  },
  {
    key: "one_practitioner_explained",
    label: "Only one practitioner can bill CCM for the month",
  },
  {
    key: "right_to_stop_explained",
    label: "Patient can stop CCM services at any time",
  },
  {
    key: "information_sharing_authorized",
    label: "Patient authorized care coordination and information sharing",
  },
] as const;

export type ConsentElementKey = (typeof REQUIRED_CONSENT_ELEMENTS)[number]["key"];
export type ConsentElementState = Record<ConsentElementKey, boolean>;

export function emptyConsentElements(): ConsentElementState {
  return Object.fromEntries(
    REQUIRED_CONSENT_ELEMENTS.map((element) => [element.key, false]),
  ) as ConsentElementState;
}

function asRecord(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

export function consentElementsFromMetadata(
  metadata: JsonValue | null | undefined,
): ConsentElementState {
  const root = asRecord(metadata);
  const elements = asRecord(root.required_elements);
  const fallbackElements = asRecord(root.elements);

  return Object.fromEntries(
    REQUIRED_CONSENT_ELEMENTS.map((element) => [
      element.key,
      elements[element.key] === true || fallbackElements[element.key] === true,
    ]),
  ) as ConsentElementState;
}

export function completedConsentElementLabels(
  metadata: JsonValue | null | undefined,
): string[] {
  const elements = consentElementsFromMetadata(metadata);

  return REQUIRED_CONSENT_ELEMENTS.filter((element) => elements[element.key]).map(
    (element) => element.label,
  );
}

export function missingConsentElementLabels(
  metadata: JsonValue | null | undefined,
): string[] {
  const elements = consentElementsFromMetadata(metadata);

  return REQUIRED_CONSENT_ELEMENTS.filter((element) => !elements[element.key]).map(
    (element) => element.label,
  );
}

export function allConsentElementsComplete(metadata: JsonValue | null | undefined): boolean {
  const elements = consentElementsFromMetadata(metadata);
  return REQUIRED_CONSENT_ELEMENTS.every((element) => elements[element.key]);
}

export function consentElementsToJson(elements: ConsentElementState): Record<string, JsonValue> {
  return Object.fromEntries(
    REQUIRED_CONSENT_ELEMENTS.map((element) => [element.key, elements[element.key] === true]),
  );
}
