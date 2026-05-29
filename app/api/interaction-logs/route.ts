import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  firstDayOfMonth,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredNumber,
  requiredString,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { ACTIVITY_TYPES, INTERACTION_SOURCES } from "../../../lib/ccm/types";

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
    const occurredAt = optionalString(body, "occurredAt") ?? new Date().toISOString();

    const { data, error } = await supabase
      .from("interaction_logs")
      .insert({
        activity_type: optionalEnum(body, "activityType", ACTIVITY_TYPES) ?? "other",
        billing_month: optionalString(body, "billingMonth") ?? firstDayOfMonth(occurredAt),
        checkin_instance_id: optionalString(body, "checkinInstanceId"),
        created_by: user.id,
        enrollment_id: optionalString(body, "enrollmentId"),
        minutes: requiredNumber(body, "minutes"),
        notes: optionalString(body, "notes"),
        occurred_at: occurredAt,
        patient_id: requiredString(body, "patientId"),
        practice_id: practiceId,
        provider_id: optionalString(body, "providerId"),
        source: optionalEnum(body, "source", INTERACTION_SOURCES) ?? "manual",
        staff_member_id: optionalString(body, "staffMemberId"),
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "interaction_log.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "interaction_log",
      practiceId,
    });

    return Response.json({ interactionLog: data }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
