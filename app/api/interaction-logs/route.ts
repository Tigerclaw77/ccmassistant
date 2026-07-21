import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredNumber,
  requiredString,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  validateInteraction,
  validateNotFutureCalendarDate,
} from "../../../lib/ccm/validation";
import { ACTIVITY_TYPES, INTERACTION_SOURCES } from "../../../lib/ccm/types";
import {
  billingMonthForOccurrenceDate,
  type TimeEntryCreateRequest,
} from "../../../lib/ccm/interaction-log-contract";
import { assertClinicalWorkAccess } from "../../../lib/ccm/work-authorization";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      .order("occurrence_date", { ascending: false })
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
    if ("billingMonth" in body) {
      return badRequest(new Error("billingMonth is derived from occurrenceDate"));
    }

    const occurrenceDate = requiredString(body, "occurrenceDate");
    const minutes = requiredNumber(body, "minutes");
    const notes = optionalString(body, "notes");
    const requestId = requiredString(body, "requestId");
    const patientId = requiredString(body, "patientId");
    const workItemId = optionalString(body, "workItemId");
    const actualTimeAffirmed = body.actualTimeAffirmed === true;
    const activityType = optionalEnum(body, "activityType", ACTIVITY_TYPES) ?? "other";
    const billingMonth = billingMonthForOccurrenceDate(occurrenceDate);

    try {
      if (!UUID_PATTERN.test(requestId)) throw new Error("requestId must be a valid UUID");
      validateNotFutureCalendarDate(
        occurrenceDate,
        "Occurrence date",
        await getPracticeTimeZone(supabase, practiceId),
      );
      validateInteraction(minutes, notes);
    } catch (error) {
      return badRequest(error);
    }

    const requestContract = {
      activityType,
      minutes,
      notes: notes!,
      occurrenceDate,
      patientId,
      practiceId,
      requestId,
    } satisfies TimeEntryCreateRequest;

    const { data: existingEntry } = await supabase
      .from("interaction_logs")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("request_id", requestId)
      .maybeSingle();

    if (existingEntry) {
      const matchesRequest =
        existingEntry.patient_id === requestContract.patientId &&
        existingEntry.activity_type === requestContract.activityType &&
        Number(existingEntry.minutes) === requestContract.minutes &&
        existingEntry.notes === requestContract.notes &&
        existingEntry.occurrence_date === requestContract.occurrenceDate &&
        (existingEntry.work_item_id ?? null) === (workItemId ?? null);

      if (!matchesRequest) {
        return Response.json({ error: "requestId was already used for another time entry" }, { status: 409 });
      }

      return Response.json({ duplicate: true, interactionLog: existingEntry });
    }

    let opportunityDispositionId: string | null = null;
    if (workItemId) {
      if (!actualTimeAffirmed) {
        return badRequest(new Error("Work-item time requires affirmative attestation"));
      }
      const { data: workItem, error: workItemError } = await supabase
        .from("ccm_work_items")
        .select("id, patient_id")
        .eq("practice_id", practiceId)
        .eq("id", workItemId)
        .single();
      if (workItemError || !workItem || workItem.patient_id !== patientId) {
        return badRequest(new Error(workItemError?.message ?? "Work item does not belong to this patient"));
      }
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("care_coordinator_member_id")
        .eq("practice_id", practiceId)
        .eq("id", patientId)
        .single();
      if (patientError || !patient) return badRequest(new Error(patientError?.message ?? "Patient not found"));
      try {
        assertClinicalWorkAccess({
          assignedCoordinatorId: patient.care_coordinator_member_id,
          membershipId: membership.id,
          role: membership.role,
        });
      } catch (scopeError) {
        return Response.json({ error: scopeError instanceof Error ? scopeError.message : "Work item is outside assigned scope" }, { status: 403 });
      }

      const { data: disposition } = await supabase
        .from("ccm_opportunity_dispositions")
        .select("id")
        .eq("practice_id", practiceId)
        .eq("resulting_work_item_id", workItemId)
        .maybeSingle();
      opportunityDispositionId = disposition?.id ?? null;

      const { data: existingWorkTime, error: existingWorkTimeError } = await supabase
        .from("interaction_logs")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("work_item_id", workItemId)
        .is("deleted_at", null)
        .maybeSingle();
      if (existingWorkTimeError) return Response.json({ error: existingWorkTimeError.message }, { status: 500 });
      if (existingWorkTime) {
        const matchesWork =
          existingWorkTime.patient_id === patientId &&
          existingWorkTime.activity_type === activityType &&
          Number(existingWorkTime.minutes) === minutes &&
          existingWorkTime.notes === notes &&
          existingWorkTime.occurrence_date === occurrenceDate &&
          existingWorkTime.actual_time_affirmed === true;
        if (!matchesWork) {
          return Response.json({ error: "This work item already has a different actual-time entry" }, { status: 409 });
        }
        return Response.json({ duplicate: true, interactionLog: existingWorkTime });
      }
    }

    const { data, error } = await supabase
      .from("interaction_logs")
      .insert({
        activity_type: requestContract.activityType,
        billing_month: billingMonth,
        checkin_instance_id: optionalString(body, "checkinInstanceId"),
        created_by: user.id,
        enrollment_id: optionalString(body, "enrollmentId"),
        minutes,
        notes: requestContract.notes,
        actual_time_affirmed: workItemId ? actualTimeAffirmed : false,
        occurrence_date: requestContract.occurrenceDate,
        opportunity_disposition_id: opportunityDispositionId,
        patient_id: requestContract.patientId,
        practice_id: practiceId,
        provider_id: optionalString(body, "providerId"),
        source: optionalEnum(body, "source", INTERACTION_SOURCES) ?? "manual",
        staff_member_id: optionalString(body, "staffMemberId") ?? membership.id,
        request_id: requestContract.requestId,
        work_item_id: workItemId,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: racedEntry } = await supabase
          .from("interaction_logs")
          .select("*")
          .eq("practice_id", practiceId)
          .eq("request_id", requestId)
          .maybeSingle();

        if (racedEntry) {
          return Response.json({ duplicate: true, interactionLog: racedEntry });
        }
      }
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

    await recalculateBillabilityForMutation(request, {
      billingMonth,
      patientId: data.patient_id,
      practiceId,
    });

    return Response.json({ interactionLog: data }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
