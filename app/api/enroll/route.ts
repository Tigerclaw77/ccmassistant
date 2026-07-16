import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  enumUpdate,
  firstDayOfMonth,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredString,
  stringUpdate,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";
import {
  allConsentElementsComplete,
  consentElementsToJson,
  emptyConsentElements,
  type ConsentElementState,
} from "../../../lib/ccm/consent";
import {
  eligibilityFactsToJson,
  eligibilitySystemValidationsToJson,
  emptyEligibilityFacts,
  emptyProviderAttestations,
  providerAttestationsToJson,
  REQUIRED_ELIGIBILITY_FACTS,
  REQUIRED_PROVIDER_ATTESTATIONS,
  type EligibilityFactState,
  type EligibilitySystemValidationState,
  type ProviderAttestationState,
} from "../../../lib/ccm/eligibility";
import {
  validateDateOrder,
  validateNotFutureCalendarDate,
  validateNotFutureDate,
  validateNotFutureTimestamp,
} from "../../../lib/ccm/validation";
import {
  normalizeConsentDateForStatus,
  resolveConsentUpdate,
} from "../../../lib/ccm/enrollment-contract";
import {
  CONSENT_METHODS,
  CONSENT_STATUSES,
  ELIGIBILITY_STATUSES,
  ENROLLMENT_STATUSES,
  type JsonValue,
} from "../../../lib/ccm/types";

const CONSENT_FIELD_KEYS = [
  "consentDate",
  "consentDocumentUrl",
  "consentElements",
  "consentMethod",
  "consentStatus",
] as const;

const ELIGIBILITY_FIELD_KEYS = [
  "eligibilityFacts",
  "providerAttestations",
  "eligibilityNotes",
  "eligibilityStatus",
] as const;

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function consentTouched(body: Record<string, unknown>): boolean {
  return CONSENT_FIELD_KEYS.some((key) => key in body);
}

function eligibilityTouched(body: Record<string, unknown>): boolean {
  return ELIGIBILITY_FIELD_KEYS.some((key) => key in body);
}

function parseConsentElements(body: Record<string, unknown>): ConsentElementState | null {
  if (!("consentElements" in body)) {
    return null;
  }

  const value = body.consentElements;
  const elements = emptyConsentElements();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("consentElements must be an object");
  }

  const rawElements = value as Record<string, unknown>;

  for (const key of Object.keys(elements) as Array<keyof ConsentElementState>) {
    elements[key] = rawElements[key] === true;
  }

  return elements;
}

function parseEligibilityFacts(body: Record<string, unknown>): EligibilityFactState | null {
  if (!("eligibilityFacts" in body)) {
    return null;
  }

  const value = body.eligibilityFacts;
  const facts = emptyEligibilityFacts();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("eligibilityFacts must be an object");
  }

  const rawFacts = value as Record<string, unknown>;

  for (const fact of REQUIRED_ELIGIBILITY_FACTS) {
    facts[fact.key] = rawFacts[fact.key] === true;
  }

  return facts;
}

function parseProviderAttestations(
  body: Record<string, unknown>,
): ProviderAttestationState | null {
  if (!("providerAttestations" in body)) {
    return null;
  }

  const value = body.providerAttestations;
  const attestations = emptyProviderAttestations();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("providerAttestations must be an object");
  }

  const rawAttestations = value as Record<string, unknown>;

  for (const attestation of REQUIRED_PROVIDER_ATTESTATIONS) {
    attestations[attestation.key] = rawAttestations[attestation.key] === true;
  }

  return attestations;
}

function buildConsentMetadata(
  body: Record<string, unknown>,
  existingMetadata: JsonValue | null | undefined,
  userId: string,
): JsonValue {
  const metadata = jsonObject(existingMetadata);
  const elements = parseConsentElements(body);

  if (elements) {
    metadata.required_elements = consentElementsToJson(elements);
  }

  if (consentTouched(body)) {
    metadata.last_updated_at = new Date().toISOString();
    metadata.last_updated_by = userId;
  }

  return metadata;
}

function buildEligibilityMetadata(
  body: Record<string, unknown>,
  existingMetadata: JsonValue | null | undefined,
  userId: string,
  systemValidations: EligibilitySystemValidationState,
): JsonValue {
  const metadata = jsonObject(existingMetadata);
  const facts = parseEligibilityFacts(body);
  const providerAttestations = parseProviderAttestations(body);

  if (facts) {
    metadata.facts = eligibilityFactsToJson(facts);
  }

  if (providerAttestations) {
    metadata.provider_attestations = providerAttestationsToJson(providerAttestations);
    metadata.provider_attested_at = new Date().toISOString();
    metadata.provider_attested_by = userId;
  }

  metadata.system_validations = eligibilitySystemValidationsToJson(systemValidations);

  if (eligibilityTouched(body)) {
    metadata.last_updated_at = new Date().toISOString();
    metadata.last_updated_by = userId;
  }

  return metadata;
}

async function getEligibilitySystemValidations(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  patientId: string,
  assignedProviderId: string | null,
): Promise<EligibilitySystemValidationState> {
  const [{ data: patient }, { data: conditions }] = await Promise.all([
    supabase
      .from("patients")
      .select("primary_provider_id")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("patient_conditions")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .eq("ccm_qualifying", true),
  ]);
  const activeConditionCount = conditions?.length ?? 0;
  const hasAssignedProvider = Boolean(assignedProviderId || patient?.primary_provider_id);

  return {
    active_condition_count: activeConditionCount,
    has_assigned_provider: hasAssignedProvider,
    has_two_chronic_conditions: activeConditionCount >= 2,
    last_checked_at: new Date().toISOString(),
  };
}

function validateEnrollmentState(input: {
  assignedProviderId: string | null;
  consentDate: string | null;
  consentMetadata: JsonValue;
  consentMethod: string;
  consentStatus: string;
  eligibilityStatus: string;
  endedAt: string | null;
  enrolledAt: string | null;
  initiatingVisitDate: string | null;
  status: string;
  systemValidations: EligibilitySystemValidationState;
  timeZone: string;
}): void {
  validateNotFutureCalendarDate(input.consentDate, "Consent date", input.timeZone);
  validateNotFutureDate(input.initiatingVisitDate, "Initiating visit date");
  validateNotFutureTimestamp(input.enrolledAt, "Enrollment date");
  validateNotFutureTimestamp(input.endedAt, "Enrollment end date");
  validateDateOrder(input.enrolledAt, input.endedAt, "enrollment date", "enrollment end date");

  if (input.consentStatus === "obtained") {
    if (!input.consentDate) throw new Error("Consent date is required when consent is obtained");
    if (!["verbal", "written", "electronic"].includes(input.consentMethod)) {
      throw new Error("A valid consent method is required when consent is obtained");
    }
    if (!allConsentElementsComplete(input.consentMetadata)) {
      throw new Error("All required consent elements must be documented when consent is obtained");
    }
  }

  if (input.status === "active") {
    if (input.eligibilityStatus !== "eligible") {
      throw new Error("Eligibility must be marked eligible before enrollment can be active");
    }
    if (input.consentStatus !== "obtained") {
      throw new Error("Consent must be obtained before enrollment can be active");
    }
    if (!input.assignedProviderId || !input.systemValidations.has_assigned_provider) {
      throw new Error("An assigned provider is required before enrollment can be active");
    }
    if (!input.systemValidations.has_two_chronic_conditions) {
      throw new Error("At least two active qualifying chronic conditions are required before enrollment can be active");
    }
  }
}

async function getPracticeTimeZone(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
): Promise<string> {
  const { data: practice, error } = await supabase
    .from("practices")
    .select("default_timezone")
    .eq("id", practiceId)
    .single();

  if (error || !practice) throw new Error("Practice timezone could not be loaded");

  return practice.default_timezone;
}

export async function POST(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;

  try {
    practiceId = requiredString(body, "practiceId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { membership, supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );
    if ("providerAttestations" in body && !["owner", "admin", "provider"].includes(membership.role)) {
      return Response.json({ error: "Provider attestations require a provider or practice administrator" }, { status: 403 });
    }
    let consentMetadata: JsonValue;
    let eligibilityMetadata: JsonValue;
    let consentDate: string | null;
    let consentStatus: (typeof CONSENT_STATUSES)[number];
    const patientId = requiredString(body, "patientId");
    const assignedProviderId = optionalString(body, "assignedProviderId");

    try {
      consentStatus = optionalEnum(body, "consentStatus", CONSENT_STATUSES) ?? "not_collected";
      consentDate = normalizeConsentDateForStatus(
        consentStatus,
        optionalString(body, "consentDate"),
      );
      const systemValidations = await getEligibilitySystemValidations(
        supabase,
        practiceId,
        patientId,
        assignedProviderId,
      );
      consentMetadata = buildConsentMetadata(body, null, user.id);
      eligibilityMetadata = buildEligibilityMetadata(
        body,
        null,
        user.id,
        systemValidations,
      );
      validateEnrollmentState({
        assignedProviderId,
        consentDate,
        consentMetadata,
        consentMethod: optionalEnum(body, "consentMethod", CONSENT_METHODS) ?? "unknown",
        consentStatus,
        eligibilityStatus: optionalEnum(body, "eligibilityStatus", ELIGIBILITY_STATUSES) ?? "needs_review",
        endedAt: optionalString(body, "endedAt"),
        enrolledAt: optionalString(body, "enrolledAt"),
        initiatingVisitDate: optionalString(body, "initiatingVisitDate"),
        status: optionalEnum(body, "status", ENROLLMENT_STATUSES) ?? "pending",
        systemValidations,
        timeZone: await getPracticeTimeZone(supabase, practiceId),
      });
    } catch (error) {
      return badRequest(error);
    }

    const { data, error } = await supabase
      .from("ccm_enrollments")
      .insert({
        assigned_provider_id: assignedProviderId,
        care_coordinator_member_id: optionalString(body, "careCoordinatorMemberId"),
        consent_date: consentDate,
        consent_document_url: optionalString(body, "consentDocumentUrl"),
        consent_metadata: consentMetadata,
        consent_method: optionalEnum(body, "consentMethod", CONSENT_METHODS) ?? "unknown",
        consent_status: consentStatus,
        created_by: user.id,
        eligibility_metadata: eligibilityMetadata,
        eligibility_notes: optionalString(body, "eligibilityNotes"),
        eligibility_status: optionalEnum(body, "eligibilityStatus", ELIGIBILITY_STATUSES) ?? "needs_review",
        enrolled_at: optionalString(body, "enrolledAt"),
        ended_at: optionalString(body, "endedAt"),
        initiating_visit_date: optionalString(body, "initiatingVisitDate"),
        patient_id: patientId,
        practice_id: practiceId,
        status: optionalEnum(body, "status", ENROLLMENT_STATUSES) ?? "pending",
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "ccm_enrollment.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "ccm_enrollment",
      practiceId,
    });

    if (consentTouched(body)) {
      await recordAuditEvent(supabase, {
        action: "ccm_enrollment.consent_updated",
        actorUserId: user.id,
        afterData: {
          consent_date: data.consent_date,
          consent_metadata: data.consent_metadata,
          consent_method: data.consent_method,
          consent_status: data.consent_status,
        },
        entityId: data.id,
        entityType: "ccm_enrollment",
        practiceId,
      });
    }

    if (eligibilityTouched(body)) {
      await recordAuditEvent(supabase, {
        action: "ccm_enrollment.eligibility_updated",
        actorUserId: user.id,
        afterData: {
          eligibility_metadata: data.eligibility_metadata,
          eligibility_notes: data.eligibility_notes,
          eligibility_status: data.eligibility_status,
        },
        entityId: data.id,
        entityType: "ccm_enrollment",
        practiceId,
      });
    }

    await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId: data.patient_id, practiceId });
    return Response.json({ enrollment: data }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let enrollmentId: string;

  try {
    practiceId = requiredString(body, "practiceId");
    enrollmentId = requiredString(body, "enrollmentId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { membership, supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );
    if ("providerAttestations" in body && !["owner", "admin", "provider"].includes(membership.role)) {
      return Response.json({ error: "Provider attestations require a provider or practice administrator" }, { status: 403 });
    }

    const { data: beforeData } = await supabase
      .from("ccm_enrollments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", enrollmentId)
      .maybeSingle();

    if (!beforeData) {
      return Response.json({ error: "Enrollment not found" }, { status: 404 });
    }

    let consentMetadata: JsonValue | undefined;
    let eligibilityMetadata: JsonValue | undefined;
    let resolvedConsentDate: string | null;
    let resolvedConsentStatus: (typeof CONSENT_STATUSES)[number];

    if (consentTouched(body)) {
      try {
        consentMetadata = buildConsentMetadata(
          body,
          beforeData?.consent_metadata ?? null,
          user.id,
        );
      } catch (error) {
        return badRequest(error);
      }
    }

    if (eligibilityTouched(body)) {
      try {
        const patientId = beforeData?.patient_id ?? optionalString(body, "patientId");
        if (!patientId) {
          return badRequest(new Error("patientId is required for eligibility updates"));
        }
        const assignedProviderId =
          "assignedProviderId" in body
            ? optionalString(body, "assignedProviderId")
            : beforeData?.assigned_provider_id ?? null;
        eligibilityMetadata = buildEligibilityMetadata(
          body,
          beforeData?.eligibility_metadata ?? null,
          user.id,
          await getEligibilitySystemValidations(
            supabase,
            practiceId,
            patientId,
            assignedProviderId,
          ),
        );
      } catch (error) {
        return badRequest(error);
      }
    }

    try {
      const assignedProviderId =
        "assignedProviderId" in body
          ? optionalString(body, "assignedProviderId")
          : beforeData.assigned_provider_id;
      const systemValidations = await getEligibilitySystemValidations(
        supabase,
        practiceId,
        beforeData.patient_id,
        assignedProviderId,
      );
      const resolvedConsent = resolveConsentUpdate({
        currentConsentDate: beforeData.consent_date,
        currentConsentStatus: beforeData.consent_status,
        requestedConsentDate: stringUpdate(body, "consentDate"),
        requestedConsentDatePresent: "consentDate" in body,
        requestedConsentStatus: enumUpdate(body, "consentStatus", CONSENT_STATUSES),
      });
      resolvedConsentStatus = resolvedConsent.consentStatus as (typeof CONSENT_STATUSES)[number];
      resolvedConsentDate = resolvedConsent.consentDate;
      validateEnrollmentState({
        assignedProviderId,
        consentDate: resolvedConsentDate,
        consentMetadata: consentMetadata ?? beforeData.consent_metadata,
        consentMethod: enumUpdate(body, "consentMethod", CONSENT_METHODS) ?? beforeData.consent_method,
        consentStatus: resolvedConsentStatus,
        eligibilityStatus:
          enumUpdate(body, "eligibilityStatus", ELIGIBILITY_STATUSES) ?? beforeData.eligibility_status,
        endedAt: "endedAt" in body ? stringUpdate(body, "endedAt") ?? null : beforeData.ended_at,
        enrolledAt:
          "enrolledAt" in body ? stringUpdate(body, "enrolledAt") ?? null : beforeData.enrolled_at,
        initiatingVisitDate:
          "initiatingVisitDate" in body
            ? stringUpdate(body, "initiatingVisitDate") ?? null
            : beforeData.initiating_visit_date,
        status: enumUpdate(body, "status", ENROLLMENT_STATUSES) ?? beforeData.status,
        systemValidations,
        timeZone: await getPracticeTimeZone(supabase, practiceId),
      });
    } catch (error) {
      return badRequest(error);
    }

    const { data, error } = await supabase
      .from("ccm_enrollments")
      .update({
        assigned_provider_id: stringUpdate(body, "assignedProviderId"),
        care_coordinator_member_id: stringUpdate(body, "careCoordinatorMemberId"),
        consent_date:
          "consentDate" in body || "consentStatus" in body
            ? resolvedConsentDate
            : undefined,
        consent_document_url: stringUpdate(body, "consentDocumentUrl"),
        consent_metadata: consentMetadata,
        consent_method: enumUpdate(body, "consentMethod", CONSENT_METHODS),
        consent_status: enumUpdate(body, "consentStatus", CONSENT_STATUSES),
        eligibility_metadata: eligibilityMetadata,
        eligibility_notes: stringUpdate(body, "eligibilityNotes"),
        eligibility_status: enumUpdate(body, "eligibilityStatus", ELIGIBILITY_STATUSES),
        enrolled_at: stringUpdate(body, "enrolledAt"),
        ended_at: stringUpdate(body, "endedAt"),
        initiating_visit_date: stringUpdate(body, "initiatingVisitDate"),
        status: enumUpdate(body, "status", ENROLLMENT_STATUSES),
        updated_by: user.id,
      })
      .eq("practice_id", practiceId)
      .eq("id", enrollmentId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "ccm_enrollment.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "ccm_enrollment",
      practiceId,
    });

    if (consentTouched(body)) {
      await recordAuditEvent(supabase, {
        action: "ccm_enrollment.consent_updated",
        actorUserId: user.id,
        afterData: {
          consent_date: data.consent_date,
          consent_metadata: data.consent_metadata,
          consent_method: data.consent_method,
          consent_status: data.consent_status,
        },
        beforeData: beforeData
          ? {
              consent_date: beforeData.consent_date,
              consent_metadata: beforeData.consent_metadata,
              consent_method: beforeData.consent_method,
              consent_status: beforeData.consent_status,
            }
          : null,
        entityId: data.id,
        entityType: "ccm_enrollment",
        practiceId,
      });
    }

    if (eligibilityTouched(body)) {
      await recordAuditEvent(supabase, {
        action: "ccm_enrollment.eligibility_updated",
        actorUserId: user.id,
        afterData: {
          eligibility_metadata: data.eligibility_metadata,
          eligibility_notes: data.eligibility_notes,
          eligibility_status: data.eligibility_status,
        },
        beforeData: beforeData
          ? {
              eligibility_metadata: beforeData.eligibility_metadata,
              eligibility_notes: beforeData.eligibility_notes,
              eligibility_status: beforeData.eligibility_status,
            }
          : null,
        entityId: data.id,
        entityType: "ccm_enrollment",
        practiceId,
      });
    }

    await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId: data.patient_id, practiceId });
    return Response.json({ enrollment: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
