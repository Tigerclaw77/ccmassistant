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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  const billingMonth = searchParams.get("billingMonth");

  if (!practiceId || !patientId || !billingMonth) {
    return badRequest(new Error("practiceId, patientId, and billingMonth are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("interaction_logs")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ interactionLogs: data ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
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
    const occurredAt = optionalString(body, "occurredAt") ?? new Date().toISOString();
    const minutes = requiredNumber(body, "minutes");

    if (minutes <= 0) {
      return badRequest(new Error("minutes must be greater than 0"));
    }

    const { data, error } = await supabase
      .from("interaction_logs")
      .insert({
        activity_type: optionalEnum(body, "activityType", ACTIVITY_TYPES) ?? "other",
        billing_month: optionalString(body, "billingMonth") ?? firstDayOfMonth(occurredAt),
        checkin_instance_id: optionalString(body, "checkinInstanceId"),
        created_by: user.id,
        enrollment_id: optionalString(body, "enrollmentId"),
        minutes,
        notes: optionalString(body, "notes"),
        occurred_at: occurredAt,
        patient_id: requiredString(body, "patientId"),
        practice_id: practiceId,
        provider_id: optionalString(body, "providerId"),
        source: optionalEnum(body, "source", INTERACTION_SOURCES) ?? "manual",
        staff_member_id: optionalString(body, "staffMemberId") ?? membership.id,
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
