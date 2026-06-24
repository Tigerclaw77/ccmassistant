import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  optionalStringArray,
  readJsonObject,
  requiredString,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import type { JsonValue } from "../../../lib/ccm/types";

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
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("condition_name", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ conditions: data ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let patientId: string;

  try {
    practiceId = requiredString(body, "practiceId");
    patientId = requiredString(body, "patientId");
  } catch (error) {
    return badRequest(error);
  }

  const conditionNames = Array.from(
    new Set(optionalStringArray(body, "conditions").map((condition) => condition.trim()).filter(Boolean)),
  );

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData } = await supabase
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true);

    const { error: deleteError } = await supabase
      .from("patient_conditions")
      .delete()
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    let data: JsonValue[] = [];

    if (conditionNames.length > 0) {
      const { data: insertedConditions, error: insertError } = await supabase
        .from("patient_conditions")
        .insert(
          conditionNames.map((conditionName) => ({
            condition_name: conditionName,
            created_by: user.id,
            is_active: true,
            patient_id: patientId,
            practice_id: practiceId,
            updated_by: user.id,
          })),
        )
        .select();

      if (insertError) {
        return Response.json({ error: insertError.message }, { status: 500 });
      }

      data = (insertedConditions ?? []) as unknown as JsonValue[];
    }

    await recordAuditEvent(supabase, {
      action: "patient_conditions.replaced",
      actorUserId: user.id,
      afterData: data,
      beforeData: (beforeData ?? []) as unknown as JsonValue[],
      entityId: patientId,
      entityType: "patient",
      practiceId,
    });

    return Response.json({ conditions: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
