import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  enumUpdate,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredString,
  stringUpdate,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  CONSENT_METHODS,
  CONSENT_STATUSES,
  ELIGIBILITY_STATUSES,
  ENROLLMENT_STATUSES,
} from "../../../lib/ccm/types";

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
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data, error } = await supabase
      .from("ccm_enrollments")
      .insert({
        assigned_provider_id: optionalString(body, "assignedProviderId"),
        care_coordinator_member_id: optionalString(body, "careCoordinatorMemberId"),
        consent_date: optionalString(body, "consentDate"),
        consent_document_url: optionalString(body, "consentDocumentUrl"),
        consent_method: optionalEnum(body, "consentMethod", CONSENT_METHODS) ?? "unknown",
        consent_status: optionalEnum(body, "consentStatus", CONSENT_STATUSES) ?? "not_collected",
        created_by: user.id,
        eligibility_notes: optionalString(body, "eligibilityNotes"),
        eligibility_status: optionalEnum(body, "eligibilityStatus", ELIGIBILITY_STATUSES) ?? "needs_review",
        enrolled_at: optionalString(body, "enrolledAt"),
        ended_at: optionalString(body, "endedAt"),
        initiating_visit_date: optionalString(body, "initiatingVisitDate"),
        patient_id: requiredString(body, "patientId"),
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
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData } = await supabase
      .from("ccm_enrollments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", enrollmentId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("ccm_enrollments")
      .update({
        assigned_provider_id: stringUpdate(body, "assignedProviderId"),
        care_coordinator_member_id: stringUpdate(body, "careCoordinatorMemberId"),
        consent_date: stringUpdate(body, "consentDate"),
        consent_document_url: stringUpdate(body, "consentDocumentUrl"),
        consent_method: enumUpdate(body, "consentMethod", CONSENT_METHODS),
        consent_status: enumUpdate(body, "consentStatus", CONSENT_STATUSES),
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

    return Response.json({ enrollment: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
