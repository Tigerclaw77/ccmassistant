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
import { CARE_PLAN_STATUSES, type JsonValue } from "../../../lib/ccm/types";

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
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data, error } = await supabase
      .from("care_plans")
      .insert({
        barriers: optionalJsonArray(body, "barriers"),
        created_by: user.id,
        enrollment_id: optionalString(body, "enrollmentId"),
        goals: optionalJsonArray(body, "goals"),
        interventions: optionalJsonArray(body, "interventions"),
        last_reviewed_at: optionalString(body, "lastReviewedAt"),
        notes: optionalString(body, "notes"),
        patient_condition_id: optionalString(body, "patientConditionId"),
        patient_id: requiredString(body, "patientId"),
        practice_id: practiceId,
        provider_id: optionalString(body, "providerId"),
        status: optionalEnum(body, "status", CARE_PLAN_STATUSES) ?? "draft",
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
    const { supabase, user } = await requirePracticeMembership(
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

    const { data, error } = await supabase
      .from("care_plans")
      .update({
        barriers: jsonArrayUpdate(body, "barriers"),
        enrollment_id: stringUpdate(body, "enrollmentId"),
        goals: jsonArrayUpdate(body, "goals"),
        interventions: jsonArrayUpdate(body, "interventions"),
        last_reviewed_at: stringUpdate(body, "lastReviewedAt"),
        notes: stringUpdate(body, "notes"),
        patient_condition_id: stringUpdate(body, "patientConditionId"),
        provider_id: stringUpdate(body, "providerId"),
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

    return Response.json({ carePlan: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
