import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../../lib/auth";
import {
  badRequest,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredString,
} from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import { CHECKIN_STATUSES, type CheckinStatus } from "../../../../lib/ccm/types";

function statusTimestampPatch(status: CheckinStatus): {
  closed_at?: string;
  no_response_at?: string;
  responded_at?: string;
  sent_at?: string;
} {
  const now = new Date().toISOString();

  if (status === "sent") return { sent_at: now };
  if (status === "responded") return { responded_at: now };
  if (status === "no_response") return { no_response_at: now };
  if (status === "closed") return { closed_at: now };

  return {};
}

export async function PATCH(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let checkinInstanceId: string;
  let status: CheckinStatus | null;

  try {
    practiceId = requiredString(body, "practiceId");
    checkinInstanceId = requiredString(body, "checkinInstanceId");
    status = optionalEnum(body, "status", CHECKIN_STATUSES);
  } catch (error) {
    return badRequest(error);
  }

  if (!status) {
    return badRequest(new Error("status is required"));
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData } = await supabase
      .from("checkin_instances")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", checkinInstanceId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("checkin_instances")
      .update({
        followup_due_at: optionalString(body, "followupDueAt"),
        status,
        updated_by: user.id,
        ...statusTimestampPatch(status),
      })
      .eq("practice_id", practiceId)
      .eq("id", checkinInstanceId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "checkin_instance.status_updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "checkin_instance",
      metadata: { status },
      practiceId,
    });

    return Response.json({ checkinInstance: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
