import {
  authErrorResponse,
  requirePracticeMembership,
  type PracticeMembership,
} from "../../../../lib/auth";
import { badRequest, firstDayOfMonth, readJsonObject, requiredString } from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import type { MonthlyBillability } from "../../../../lib/ccm/types";

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

function sumMinutes(logs: Array<{ minutes: number | string | null }>): number {
  return logs.reduce((total, log) => total + Number(log.minutes ?? 0), 0);
}

function hasMeaningfulText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMeaningfulArrayValue(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => hasMeaningfulText(item));
}

function hasCompleteCarePlan(
  carePlan: { goals: unknown; interventions: unknown; last_reviewed_at: string | null } | null,
): boolean {
  if (!carePlan?.last_reviewed_at) return false;

  return hasMeaningfulArrayValue(carePlan.goals) || hasMeaningfulArrayValue(carePlan.interventions);
}

function normalizedReasonCodes(codes: string[]): string[] {
  return Array.from(new Set(codes));
}

function billabilityChanged(
  existing: MonthlyBillability | null,
  next: Partial<MonthlyBillability>,
): boolean {
  if (!existing) return true;

  const fields: Array<keyof MonthlyBillability> = [
    "care_plan_current",
    "checkin_instance_id",
    "consent_valid",
    "eligibility_valid",
    "enrollment_id",
    "qualifying_interaction_count",
    "status",
    "total_minutes",
  ];

  for (const field of fields) {
    if (String(existing[field] ?? "") !== String(next[field] ?? "")) {
      return true;
    }
  }

  return (existing.reason_codes ?? []).join("|") !== (next.reason_codes ?? []).join("|");
}

export async function POST(request: Request) {
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

  const billingMonth =
    typeof body.billingMonth === "string" && body.billingMonth
      ? firstDayOfMonth(body.billingMonth)
      : firstDayOfMonth();

  try {
    const { membership, supabase, user } = await requirePracticeMembership(request, practiceId);

    if (!canUseMvpBilling(membership)) {
      return Response.json({ error: "Practice role is not permitted for this action" }, { status: 403 });
    }

    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .single();

    if (practiceError || !practice) {
      return Response.json({ error: "Practice not found" }, { status: 404 });
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("ccm_enrollments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (enrollmentError) {
      return Response.json({ error: enrollmentError.message }, { status: 500 });
    }

    const enrollment =
      (enrollments ?? []).find((row) => row.status === "active") ??
      enrollments?.[0] ??
      null;

    const { data: conditions, error: conditionsError } = await supabase
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true);

    if (conditionsError) {
      return Response.json({ error: conditionsError.message }, { status: 500 });
    }

    const { data: carePlans, error: carePlanError } = await supabase
      .from("care_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("last_reviewed_at", { ascending: false });

    if (carePlanError) {
      return Response.json({ error: carePlanError.message }, { status: 500 });
    }

    const activeCarePlan = carePlans?.[0] ?? null;

    const { data: checkIn, error: checkInError } = await supabase
      .from("checkin_instances")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    if (checkInError) {
      return Response.json({ error: checkInError.message }, { status: 500 });
    }

    const { data: checkInResponses, error: checkInResponsesError } = checkIn
      ? await supabase
          .from("checkin_responses")
          .select("*")
          .eq("practice_id", practiceId)
          .eq("checkin_instance_id", checkIn.id)
      : { data: [], error: null };

    if (checkInResponsesError) {
      return Response.json({ error: checkInResponsesError.message }, { status: 500 });
    }

    const { data: interactionLogs, error: interactionError } = await supabase
      .from("interaction_logs")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .is("deleted_at", null);

    if (interactionError) {
      return Response.json({ error: interactionError.message }, { status: 500 });
    }

    const totalMinutes = sumMinutes(interactionLogs ?? []);
    const threshold = practice.ccm_monthly_min_minutes ?? 20;
    const enrollmentActive = enrollment?.status === "active";
    const eligibilityValid = enrollment?.eligibility_status === "eligible";
    const consentValid = enrollment?.consent_status === "obtained";
    const hasCondition = (conditions ?? []).length > 0;
    const hasProvider = Boolean(enrollment?.assigned_provider_id ?? patient.primary_provider_id);
    const hasCarePlan = Boolean(activeCarePlan);
    const carePlanCurrent = hasCompleteCarePlan(activeCarePlan);
    const hasCheckIn = Boolean(checkIn);
    const hasNonEmptyCheckInResponse = (checkInResponses ?? []).some((response) =>
      hasMeaningfulText(response.response_text),
    );
    const checkInStatusComplete = checkIn?.status === "responded" || checkIn?.status === "closed";
    const checkInComplete = hasCheckIn && checkInStatusComplete && hasNonEmptyCheckInResponse;
    const enoughMinutes = totalMinutes >= threshold;
    const reasonCodes: string[] = [];

    if (!enrollment || !enrollmentActive) reasonCodes.push("missing_enrollment");
    if (enrollmentActive && !eligibilityValid) reasonCodes.push("ineligible_enrollment");
    if (!consentValid) reasonCodes.push("missing_consent");
    if (enrollment && !enrollment.consent_date) reasonCodes.push("missing_consent_date");
    if (!hasCondition) reasonCodes.push("missing_condition");
    if (!hasProvider) reasonCodes.push("missing_provider");
    if (!hasCarePlan) reasonCodes.push("missing_care_plan");
    if (hasCarePlan && !carePlanCurrent) reasonCodes.push("incomplete_care_plan");
    if (!hasCheckIn) reasonCodes.push("missing_checkin");
    if (hasCheckIn && !checkInComplete) reasonCodes.push("missing_checkin_response");
    if (!enoughMinutes) reasonCodes.push("insufficient_minutes");

    const isBillable =
      enrollmentActive &&
      eligibilityValid &&
      consentValid &&
      Boolean(enrollment?.consent_date) &&
      hasCondition &&
      hasProvider &&
      carePlanCurrent &&
      checkInComplete &&
      enoughMinutes;

    const { data: existing } = await supabase
      .from("monthly_billability")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    const overrideStatus = body.overrideStatus === true;
    const preservedStatus =
      !overrideStatus && (existing?.status === "billed" || existing?.status === "hold")
        ? existing.status
        : null;
    const status: MonthlyBillability["status"] =
      preservedStatus ?? (isBillable ? "ready_to_bill" : "not_ready");
    const nextBillability: Partial<MonthlyBillability> = {
      billing_month: billingMonth,
      care_plan_current: carePlanCurrent,
      checkin_instance_id: checkIn?.id ?? null,
      consent_valid: consentValid && Boolean(enrollment?.consent_date),
      created_by: existing?.created_by ?? user.id,
      eligibility_valid: eligibilityValid,
      enrollment_id: enrollment?.id ?? null,
      patient_id: patientId,
      practice_id: practiceId,
      qualifying_interaction_count: interactionLogs?.length ?? 0,
      reason_codes: normalizedReasonCodes(reasonCodes),
      status,
      total_minutes: totalMinutes,
      updated_by: user.id,
    };

    if (!billabilityChanged(existing as MonthlyBillability | null, nextBillability)) {
      return Response.json({ billability: existing });
    }

    const { data: billability, error: billabilityError } = await supabase
      .from("monthly_billability")
      .upsert(nextBillability, { onConflict: "practice_id,patient_id,billing_month" })
      .select()
      .single();

    if (billabilityError) {
      return Response.json({ error: billabilityError.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "monthly_billability.recalculated",
      actorUserId: user.id,
      afterData: billability,
      beforeData: existing ?? null,
      entityId: billability.id,
      entityType: "monthly_billability",
      metadata: { billingMonth, patientId },
      practiceId,
    });

    return Response.json({ billability });
  } catch (error) {
    return authErrorResponse(error);
  }
}
