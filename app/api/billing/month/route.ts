import {
  authErrorResponse,
  requirePracticeMembership,
  type PracticeMembership,
} from "../../../../lib/auth";
import { badRequest, firstDayOfMonth, readJsonObject, requiredString } from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import type { JsonValue } from "../../../../lib/ccm/types";

const MVP_BILLING_ROLES = [
  "owner",
  "admin",
  "provider",
  "coordinator",
  "billing_staff",
] as const;

function canUseMvpBilling(membership: PracticeMembership) {
  return MVP_BILLING_ROLES.includes(membership.role);
}

async function createBillingEvidenceSnapshot(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  patientId: string,
  billingMonth: string,
  billability: Record<string, unknown>,
  userId: string,
) {
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("id", patientId)
    .maybeSingle();

  const { data: enrollments } = await supabase
    .from("ccm_enrollments")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const enrollment =
    (enrollments ?? []).find((row) => row.status === "active") ??
    enrollments?.[0] ??
    null;

  const providerId = enrollment?.assigned_provider_id ?? patient?.primary_provider_id ?? null;
  const { data: provider } = providerId
    ? await supabase
        .from("providers")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("id", providerId)
        .maybeSingle()
    : { data: null };

  const { data: conditions } = await supabase
    .from("patient_conditions")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .eq("is_active", true)
    .order("condition_name", { ascending: true });

  const { data: carePlans } = await supabase
    .from("care_plans")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const carePlan =
    (carePlans ?? []).find((row) => row.status === "active") ??
    carePlans?.[0] ??
    null;

  const { data: checkIn } = await supabase
    .from("checkin_instances")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  const { data: responses } = checkIn
    ? await supabase
        .from("checkin_responses")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("checkin_instance_id", checkIn.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const questionIds = Array.from(
    new Set((responses ?? []).map((response) => response.question_id).filter(Boolean)),
  ) as string[];
  const { data: questions } = questionIds.length
    ? await supabase.from("questions").select("*").in("id", questionIds)
    : { data: [] };
  const questionsById = Object.fromEntries((questions ?? []).map((question) => [question.id, question]));

  const { data: interactionLogs } = await supabase
    .from("interaction_logs")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .eq("billing_month", billingMonth)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false });

  const snapshot = {
    assigned_provider: provider,
    billability,
    billing_month: billingMonth,
    care_plan: carePlan,
    check_in: checkIn,
    check_in_responses: (responses ?? []).map((response) => ({
      ...response,
      question: response.question_id ? questionsById[response.question_id] ?? null : null,
    })),
    chronic_conditions: conditions ?? [],
    created_at: new Date().toISOString(),
    enrollment,
    interaction_logs: interactionLogs ?? [],
    patient,
  };

  const { error } = await supabase
    .from("billing_evidence_snapshots")
    .upsert(
      {
        billing_month: billingMonth,
        created_by: userId,
        monthly_billability_id: typeof billability.id === "string" ? billability.id : null,
        patient_id: patientId,
        practice_id: practiceId,
        snapshot: snapshot as unknown as JsonValue,
      },
      { onConflict: "practice_id,patient_id,billing_month" },
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const billingMonth = firstDayOfMonth(searchParams.get("billingMonth") ?? new Date());

  if (!practiceId) {
    return badRequest(new Error("practiceId is required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .order("display_name", { ascending: true });

    if (patientsError) {
      return Response.json({ error: patientsError.message }, { status: 500 });
    }

    const { data: billability, error: billabilityError } = await supabase
      .from("monthly_billability")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("billing_month", billingMonth);

    if (billabilityError) {
      return Response.json({ error: billabilityError.message }, { status: 500 });
    }

    const billabilityByPatientId = Object.fromEntries(
      (billability ?? []).map((row) => [row.patient_id, row]),
    );

    const rows = (patients ?? []).map((patient) => ({
      billability: billabilityByPatientId[patient.id] ?? null,
      patient,
    }));

    return Response.json({ billingMonth, rows });
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
  let patientId: string;
  let action: string;

  try {
    practiceId = requiredString(body, "practiceId");
    patientId = requiredString(body, "patientId");
    action = requiredString(body, "action");
  } catch (error) {
    return badRequest(error);
  }

  const billingMonth =
    typeof body.billingMonth === "string" && body.billingMonth
      ? firstDayOfMonth(body.billingMonth)
      : firstDayOfMonth();

  if (!["reviewed", "billed", "hold"].includes(action)) {
    return badRequest(new Error("action must be reviewed, billed, or hold"));
  }

  try {
    const { membership, supabase, user } = await requirePracticeMembership(request, practiceId);

    if (!canUseMvpBilling(membership)) {
      return Response.json({ error: "Practice role is not permitted for this action" }, { status: 403 });
    }

    const { data: beforeData, error: beforeError } = await supabase
      .from("monthly_billability")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    if (beforeError) {
      return Response.json({ error: beforeError.message }, { status: 500 });
    }

    if (!beforeData) {
      return Response.json({ error: "Billability row not found. Recalculate first." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const patch =
      action === "billed"
        ? {
            billed_at: now,
            reviewed_at: beforeData.reviewed_at ?? now,
            reviewed_by: beforeData.reviewed_by ?? user.id,
            status: "billed" as const,
            updated_by: user.id,
          }
        : action === "hold"
          ? {
              reason_codes: Array.from(new Set([...(beforeData.reason_codes ?? []), "manual_hold"])),
              status: "hold" as const,
              updated_by: user.id,
            }
          : {
              reviewed_at: now,
              reviewed_by: user.id,
              updated_by: user.id,
            };

    const { data, error } = await supabase
      .from("monthly_billability")
      .update(patch)
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (action === "reviewed" || action === "billed") {
      try {
        await createBillingEvidenceSnapshot(
          supabase,
          practiceId,
          patientId,
          billingMonth,
          data,
          user.id,
        );
      } catch (snapshotError) {
        const message = snapshotError instanceof Error ? snapshotError.message : "Unable to snapshot billing evidence";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    await recordAuditEvent(supabase, {
      action: `monthly_billability.${action}`,
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "monthly_billability",
      metadata: { billingMonth, patientId },
      practiceId,
    });

    return Response.json({ billability: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
