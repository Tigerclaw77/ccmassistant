import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  firstDayOfMonth,
  optionalStringArray,
  readJsonObject,
  requiredString,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";
import {
  CONDITION_NORMALIZATION_STATUSES,
  type ConditionNormalizationStatus,
  type JsonValue,
} from "../../../lib/ccm/types";

type ConditionItemInput = {
  canonicalName: string;
  ccmQualifying: boolean;
  code: string | null;
  codeSystem: string | null;
  displayName: string;
  id: string | null;
  isActive: boolean;
  normalizationStatus: ConditionNormalizationStatus;
  notes: string | null;
  userEnteredText: string;
};

function stringValue(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Condition fields must be strings");
  return value.trim();
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new Error("Condition boolean fields must be booleans");
  return value;
}

function normalizationStatus(value: unknown): ConditionNormalizationStatus {
  if (typeof value !== "string") return "manual";
  if (!CONDITION_NORMALIZATION_STATUSES.includes(value as ConditionNormalizationStatus)) {
    return "manual";
  }

  return value as ConditionNormalizationStatus;
}

function conditionItems(body: Record<string, unknown>): ConditionItemInput[] | null {
  const rawItems = body.conditionItems;
  if (rawItems === undefined || rawItems === null) return null;

  if (!Array.isArray(rawItems)) {
    throw new Error("conditionItems must be an array");
  }

  return rawItems.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("conditionItems must contain objects");
    }

    const object = item as Record<string, unknown>;
    const displayName =
      stringValue(object.displayName) ??
      stringValue(object.display_name) ??
      stringValue(object.conditionName) ??
      stringValue(object.condition_name);
    const canonicalName =
      stringValue(object.canonicalName) ??
      stringValue(object.canonical_name) ??
      displayName;

    if (!displayName || !canonicalName) {
      throw new Error("Condition displayName and canonicalName are required");
    }

    const code = stringValue(object.icd10Code) ?? stringValue(object.code);
    const codeSystem =
      stringValue(object.codeSystem) ?? stringValue(object.code_system) ?? (code ? "ICD-10" : null);

    return {
      canonicalName,
      ccmQualifying: booleanValue(object.ccmQualifying ?? object.ccm_qualifying, true),
      code,
      codeSystem,
      displayName,
      id: stringValue(object.id),
      isActive: booleanValue(object.isActive ?? object.is_active, true),
      normalizationStatus: normalizationStatus(
        object.normalizationStatus ?? object.normalization_status,
      ),
      notes: stringValue(object.notes),
      userEnteredText:
        stringValue(object.userEnteredText) ??
        stringValue(object.user_entered_text) ??
        displayName,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  const includeInactive = searchParams.get("includeInactive") === "true";

  if (!practiceId || !patientId) {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    let query = supabase
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query
      .order("is_active", { ascending: false })
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

  let structuredConditions: ConditionItemInput[] | null;

  try {
    structuredConditions = conditionItems(body);
  } catch (error) {
    return badRequest(error);
  }

  const conditionNames = structuredConditions
    ? []
    : Array.from(
        new Set(
          optionalStringArray(body, "conditions")
            .map((condition) => condition.trim())
            .filter(Boolean),
        ),
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
      .eq("patient_id", patientId);

    if (structuredConditions) {
      for (const condition of structuredConditions) {
        const payload = {
          canonical_name: condition.canonicalName,
          ccm_qualifying: condition.ccmQualifying,
          code: condition.code,
          code_system: condition.codeSystem,
          condition_name: condition.canonicalName,
          display_name: condition.displayName,
          is_active: condition.isActive,
          normalization_status: condition.normalizationStatus,
          notes: condition.notes,
          patient_id: patientId,
          practice_id: practiceId,
          updated_by: user.id,
          user_entered_text: condition.userEnteredText,
        };

        if (condition.id) {
          const { error: updateError } = await supabase
            .from("patient_conditions")
            .update(payload)
            .eq("id", condition.id)
            .eq("practice_id", practiceId)
            .eq("patient_id", patientId);

          if (updateError) {
            return Response.json({ error: updateError.message }, { status: 500 });
          }
        } else if (condition.isActive) {
          const { error: insertError } = await supabase.from("patient_conditions").insert({
            ...payload,
            created_by: user.id,
          });

          if (insertError) {
            return Response.json({ error: insertError.message }, { status: 500 });
          }
        }
      }
    } else {
      const { error: inactiveError } = await supabase
        .from("patient_conditions")
        .update({ is_active: false, updated_by: user.id })
        .eq("practice_id", practiceId)
        .eq("patient_id", patientId);

      if (inactiveError) {
        return Response.json({ error: inactiveError.message }, { status: 500 });
      }

      if (conditionNames.length > 0) {
        const { error: insertError } = await supabase
          .from("patient_conditions")
          .insert(
            conditionNames.map((conditionName) => ({
              canonical_name: conditionName,
              ccm_qualifying: true,
              condition_name: conditionName,
              created_by: user.id,
              display_name: conditionName,
              is_active: true,
              normalization_status: "manual" as const,
              patient_id: patientId,
              practice_id: practiceId,
              updated_by: user.id,
              user_entered_text: conditionName,
            })),
          );

        if (insertError) {
          return Response.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    const { data, error: reloadError } = await supabase
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("is_active", { ascending: false })
      .order("condition_name", { ascending: true });

    if (reloadError) {
      return Response.json({ error: reloadError.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: structuredConditions
        ? "patient_conditions.structured_updated"
        : "patient_conditions.replaced",
      actorUserId: user.id,
      afterData: (data ?? []) as unknown as JsonValue[],
      beforeData: (beforeData ?? []) as unknown as JsonValue[],
      entityId: patientId,
      entityType: "patient",
      practiceId,
    });

    await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId, practiceId });

    return Response.json({ conditions: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
