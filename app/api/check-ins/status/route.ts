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
import { cancelQuestionSession } from "../../../../lib/ccm/session-engine/resume.ts";
import { sessionStateFromJson } from "../../../../lib/ccm/session-integration.ts";
import { findQuestionSessionForCheckIn, saveStoredQuestionSession } from "../../../../lib/ccm/session-store";
import {
  hasMeaningfulCheckinResponse,
} from "../../../../lib/ccm/checkin-completion";
import { CHECKIN_STATUSES, type CheckinStatus, type JsonValue } from "../../../../lib/ccm/types";
import { recalculateBillabilityForMutation } from "../../billability/recalculate/route";

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

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

    if (!beforeData) {
      return Response.json({ error: "Check-in not found" }, { status: 404 });
    }

    let closureMetadata = jsonObject(beforeData.metadata);

    if (status === "closed") {
      const { data: responses, error: responsesError } = await supabase
        .from("checkin_responses")
        .select("id, response_text")
        .eq("practice_id", practiceId)
        .eq("checkin_instance_id", checkinInstanceId);

      if (responsesError) {
        return Response.json({ error: responsesError.message }, { status: 500 });
      }

      const sessionRecord = await findQuestionSessionForCheckIn(supabase, checkinInstanceId);
      const savedSession = sessionRecord ? sessionStateFromJson(sessionRecord.session_state) : null;
      const hasResponse = hasMeaningfulCheckinResponse(responses ?? []) ||
        Boolean(savedSession?.completedQuestionIds.length);

      if (hasResponse && sessionRecord && (sessionRecord.status === "draft" || sessionRecord.status === "paused")) {
        return badRequest(new Error("Complete the patient interview before closing this check-in."));
      }

      if (!hasResponse) {
        const followupNote = optionalString(body, "followupNote");
        if (!followupNote || followupNote.trim().length < 8) {
          return badRequest(
            new Error(
              "Document the follow-up attempt or resolution (at least 8 characters) before closing a non-response.",
            ),
          );
        }

        closureMetadata = {
          ...closureMetadata,
          closed_by: user.id,
          closure_type: "staff_documented_non_response",
          followup_note: followupNote.trim(),
        };

        if (sessionRecord && (sessionRecord.status === "draft" || sessionRecord.status === "paused")) {
          const beforeSession = savedSession ?? sessionStateFromJson(sessionRecord.session_state);
          const cancelledSession = cancelQuestionSession(beforeSession);
          await saveStoredQuestionSession(
            supabase,
            user.id,
            sessionRecord,
            beforeSession,
            cancelledSession,
          );
        }
      } else {
        closureMetadata = {
          ...closureMetadata,
          closed_by: user.id,
          closure_type: "patient_response",
        };
      }
    }

    const { data, error } = await supabase
      .from("checkin_instances")
      .update({
        followup_due_at: optionalString(body, "followupDueAt"),
        metadata: closureMetadata as JsonValue,
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

    if (status === "closed") {
      await recalculateBillabilityForMutation(request, {
        billingMonth: data.billing_month,
        patientId: data.patient_id,
        practiceId,
      });
    }

    return Response.json({ checkinInstance: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
