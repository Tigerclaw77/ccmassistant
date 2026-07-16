import type { ConsentElementState } from "./consent";

export type EnrollmentMutationRequest = {
  assignedProviderId?: string | null;
  careCoordinatorMemberId?: string | null;
  consentDate?: string | null;
  consentDocumentUrl?: string | null;
  consentElements?: ConsentElementState;
  consentMethod?: string;
  consentStatus?: string;
  eligibilityFacts?: Record<string, boolean>;
  eligibilityNotes?: string | null;
  eligibilityStatus?: string;
  enrolledAt?: string;
  endedAt?: string | null;
  enrollmentId?: string;
  initiatingVisitDate?: string | null;
  patientId: string;
  practiceId: string;
  providerAttestations?: Record<string, boolean>;
  status?: string;
};

export function consentDateFromFormData(formData: FormData): string | null {
  const value = formData.get("consentDate");

  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Consent date must be a calendar date");

  return value.trim() || null;
}

export function normalizeConsentDateForStatus(
  consentStatus: string,
  consentDate: string | null | undefined,
): string | null {
  const normalizedDate = consentDate?.trim() || null;

  if (consentStatus === "obtained" && !normalizedDate) {
    throw new Error("Consent date is required when consent is obtained");
  }

  return consentStatus === "obtained" ? normalizedDate : null;
}

export function resolveConsentUpdate(input: {
  currentConsentDate: string | null;
  currentConsentStatus: string;
  requestedConsentDate: string | null | undefined;
  requestedConsentDatePresent: boolean;
  requestedConsentStatus: string | undefined;
}): { consentDate: string | null; consentStatus: string } {
  const consentStatus = input.requestedConsentStatus ?? input.currentConsentStatus;
  const requestedDate = input.requestedConsentDatePresent
    ? input.requestedConsentDate
    : input.currentConsentDate;

  return {
    consentDate: normalizeConsentDateForStatus(consentStatus, requestedDate),
    consentStatus,
  };
}

export function buildEnrollmentMutationRequest(
  input: EnrollmentMutationRequest,
): EnrollmentMutationRequest {
  const consentStatus = input.consentStatus ?? "not_collected";

  return {
    ...input,
    consentDate: normalizeConsentDateForStatus(consentStatus, input.consentDate),
  };
}
