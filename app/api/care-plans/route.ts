import {
  authErrorResponse,
  createServiceRoleSupabaseClient,
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
import { CARE_PLAN_STATUSES, type JsonValue } from "../../../lib/ccm/types";
import {
  calendarDateToUtcTimestamp,
  timestampToCalendarDate,
  validateNotFutureCalendarDate,
} from "../../../lib/ccm/validation";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";

async function validateCarePlanActivation(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  patientId: string,
  status: string,
  providerId: string | null,
  lastReviewedDate: string | null,
): Promise<void> {
  const { data: practice, error: practiceError } = await supabase
    .from("practices")
    .select("default_timezone")
    .eq("id", practiceId)
    .single();

  if (practiceError || !practice) {
    throw new Error("Practice timezone could not be loaded");
  }

  validateNotFutureCalendarDate(
    lastReviewedDate,
    "Care-plan review date",
    practice.default_timezone,
  );
  if (status !== "active") return;
  if (!providerId) throw new Error("An assigned provider is required before a care plan can be active");
  if (!lastReviewedDate) throw new Error("A provider review date is required before a care plan can be active");

  const [{ data: enrollment }, { data: conditions }] = await Promise.all([
    supabase
      .from("ccm_enrollments")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("status", "active")
      .eq("consent_status", "obtained")
      .not("consent_date", "is", null)
      .maybeSingle(),
    supabase
      .from("patient_conditions")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .eq("ccm_qualifying", true),
  ]);

  if (!enrollment) throw new Error("Active enrollment and documented consent are required before activating a care plan");
  if ((conditions ?? []).length < 2) {
    throw new Error("At least two active qualifying conditions are required before activating a care plan");
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");

  if (!practiceId || !patientId) {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("care_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ carePlans: data ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

function optionalJsonArray(body: Record<string, unknown>, key: string): JsonValue[] {
  const value = body[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array`);
  }

  return value as JsonValue[];
}

function jsonArrayUpdate(body: Record<string, unknown>, key: string): JsonValue[] | undefined {
  if (!(key in body)) {
    return undefined;
  }

  return optionalJsonArray(body, key);
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

    const patientId = requiredString(body, "patientId");
    const status = optionalEnum(body, "status", CARE_PLAN_STATUSES) ?? "draft";
    if (status === "active" && !["owner", "provider"].includes(membership.role)) {
      return Response.json({ error: "Only a provider can approve and activate a care plan" }, { status: 403 });
    }
    const providerId = optionalString(body, "providerId");
    const lastReviewedDate = optionalString(body, "lastReviewedDate");
    try {
      await validateCarePlanActivation(
        supabase,
        practiceId,
        patientId,
        status,
        providerId,
        lastReviewedDate,
      );
    } catch (error) {
      return badRequest(error);
    }

    const { data, error } = await supabase
      .from("care_plans")
      .insert({
        barriers: optionalJsonArray(body, "barriers"),
        created_by: user.id,
        enrollment_id: optionalString(body, "enrollmentId"),
        goals: optionalJsonArray(body, "goals"),
        interventions: optionalJsonArray(body, "interventions"),
        last_reviewed_at: calendarDateToUtcTimestamp(lastReviewedDate),
        notes: optionalString(body, "notes"),
        patient_condition_id: optionalString(body, "patientConditionId"),
        patient_id: patientId,
        practice_id: practiceId,
        provider_id: providerId,
        approved_at: status === "active" ? calendarDateToUtcTimestamp(lastReviewedDate) : null,
        approved_by: status === "active" ? user.id : null,
        review_status: status === "active" ? "approved" : "draft",
        status,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "care_plan.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "care_plan",
      practiceId,
    });

    if (status === "active") {
      const service = createServiceRoleSupabaseClient();
      await service.from("care_plan_reviews").insert({
        care_plan_id: data.id,
        care_plan_version: data.version,
        decision: "approved",
        practice_id: practiceId,
        reviewer_user_id: user.id,
        snapshot: { barriers: data.barriers, goals: data.goals, interventions: data.interventions, notes: data.notes, provider_id: data.provider_id },
      });
    }

    await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId, practiceId });

    return Response.json({ carePlan: data }, { status: 201 });
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
  let carePlanId: string;

  try {
    practiceId = requiredString(body, "practiceId");
    carePlanId = requiredString(body, "carePlanId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { membership, supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData } = await supabase
      .from("care_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", carePlanId)
      .maybeSingle();

    if (!beforeData) {
      return Response.json({ error: "Care plan not found" }, { status: 404 });
    }

    const status = enumUpdate(body, "status", CARE_PLAN_STATUSES) ?? beforeData.status;
    const legacyApproval = status === "active" && beforeData.review_status !== "approved";
    if (legacyApproval && !["owner", "provider"].includes(membership.role)) {
      return Response.json({ error: "Only a provider can approve and activate a care plan" }, { status: 403 });
    }
    const providerId =
      "providerId" in body ? stringUpdate(body, "providerId") ?? null : beforeData.provider_id;
    const lastReviewedDate =
      "lastReviewedDate" in body
        ? stringUpdate(body, "lastReviewedDate") ?? null
        : timestampToCalendarDate(beforeData.last_reviewed_at);
    try {
      await validateCarePlanActivation(
        supabase,
        practiceId,
        beforeData.patient_id,
        status,
        providerId,
        lastReviewedDate,
      );
    } catch (error) {
      return badRequest(error);
    }

    const { data, error } = await supabase
      .from("care_plans")
      .update({
        barriers: jsonArrayUpdate(body, "barriers"),
        enrollment_id: stringUpdate(body, "enrollmentId"),
        goals: jsonArrayUpdate(body, "goals"),
        interventions: jsonArrayUpdate(body, "interventions"),
        last_reviewed_at:
          "lastReviewedDate" in body
            ? calendarDateToUtcTimestamp(stringUpdate(body, "lastReviewedDate"))
            : undefined,
        notes: stringUpdate(body, "notes"),
        patient_condition_id: stringUpdate(body, "patientConditionId"),
        provider_id: stringUpdate(body, "providerId"),
        approved_at: legacyApproval ? calendarDateToUtcTimestamp(lastReviewedDate) : undefined,
        approved_by: legacyApproval ? user.id : undefined,
        review_status: legacyApproval ? "approved" : undefined,
        status: enumUpdate(body, "status", CARE_PLAN_STATUSES),
        updated_by: user.id,
      })
      .eq("practice_id", practiceId)
      .eq("id", carePlanId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "care_plan.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "care_plan",
      practiceId,
    });

    if (legacyApproval) {
      const service = createServiceRoleSupabaseClient();
      await service.from("care_plan_reviews").insert({
        care_plan_id: data.id,
        care_plan_version: data.version,
        decision: "approved",
        practice_id: practiceId,
        reviewer_user_id: user.id,
        snapshot: { barriers: data.barriers, goals: data.goals, interventions: data.interventions, notes: data.notes, provider_id: data.provider_id },
      });
    }

    await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId: data.patient_id, practiceId });

    return Response.json({ carePlan: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
