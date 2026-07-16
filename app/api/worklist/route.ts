import { authErrorResponse, requirePracticeMembership } from "../../../lib/auth";
import { badRequest } from "../../../lib/api/json";
import { normalizeBillingMonth } from "../../../lib/ccm/month-context";
import { composeWorklistRows } from "../../../lib/ccm/worklist";
import type { MonthlyBillability, Patient } from "../../../lib/ccm/types";

const PAGE_SIZE_MAX = 100;
const SORT_FIELDS = new Set(["display_name", "dob", "external_id", "status"]);
const READINESS = new Set(["not_ready", "ready_to_bill", "billed", "hold", "ineligible"]);

function positiveInteger(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function searchExpression(value: string): string {
  const safe = value.replace(/[%,()]/g, " ").trim().slice(0, 80);
  return `display_name.ilike.%${safe}%,external_id.ilike.%${safe}%,phone.ilike.%${safe}%`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  if (!practiceId) return badRequest(new Error("practiceId is required"));

  let billingMonth: string;
  try {
    billingMonth = normalizeBillingMonth(searchParams.get("month"));
  } catch (error) {
    return badRequest(error);
  }

  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = positiveInteger(searchParams.get("pageSize"), 25, PAGE_SIZE_MAX);
  const search = searchParams.get("search")?.trim() ?? "";
  const assignment = searchParams.get("assignment")?.trim() ?? "";
  const readiness = searchParams.get("readiness")?.trim() ?? "";
  const sort = SORT_FIELDS.has(searchParams.get("sort") ?? "") ? searchParams.get("sort")! : "display_name";
  const direction = searchParams.get("direction") === "desc" ? "desc" : "asc";

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    let readinessPatientIds: string[] | null = null;
    if (READINESS.has(readiness)) {
      const { data, error } = await supabase
        .from("monthly_billability")
        .select("patient_id")
        .eq("practice_id", practiceId)
        .eq("billing_month", billingMonth)
        .eq("status", readiness as MonthlyBillability["status"]);
      if (error) throw new Error(error.message);
      readinessPatientIds = (data ?? []).map((row) => row.patient_id);
      if (readinessPatientIds.length === 0) {
        return Response.json({ billingMonth, page, pageSize, rows: [], total: 0 });
      }
    }

    let patientsQuery = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("practice_id", practiceId);
    if (assignment === "unassigned") patientsQuery = patientsQuery.is("care_coordinator_member_id", null);
    else if (assignment) patientsQuery = patientsQuery.eq("care_coordinator_member_id", assignment);
    if (readinessPatientIds) patientsQuery = patientsQuery.in("id", readinessPatientIds);
    if (search) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(search)) patientsQuery = patientsQuery.eq("dob", search);
      else patientsQuery = patientsQuery.or(searchExpression(search));
    }
    const start = (page - 1) * pageSize;
    const { data: patients, count, error: patientsError } = await patientsQuery
      .order(sort, { ascending: direction === "asc", nullsFirst: false })
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);
    if (patientsError) throw new Error(patientsError.message);

    const patientRows = (patients ?? []) as Patient[];
    const patientIds = patientRows.map((row) => row.id);
    if (!patientIds.length) {
      return Response.json({ billingMonth, page, pageSize, rows: [], total: count ?? 0 });
    }

    const [practiceResult, membersResult, enrollmentsResult, logsResult, billabilityResult, carePlansResult, conditionsResult, intakeResult, checkInsResult, sessionsResult] = await Promise.all([
      supabase.from("practices").select("billing_settings, ccm_monthly_min_minutes").eq("id", practiceId).single(),
      supabase.from("practice_members").select("id, invited_email, user_id").eq("practice_id", practiceId).in("role", ["owner", "admin", "coordinator"]).eq("status", "active"),
      supabase.from("ccm_enrollments").select("*").eq("practice_id", practiceId).in("patient_id", patientIds),
      supabase.from("interaction_logs").select("patient_id, minutes").eq("practice_id", practiceId).eq("billing_month", billingMonth).in("patient_id", patientIds).is("deleted_at", null),
      supabase.from("monthly_billability").select("*").eq("practice_id", practiceId).eq("billing_month", billingMonth).in("patient_id", patientIds),
      supabase.from("care_plans").select("*").eq("practice_id", practiceId).in("patient_id", patientIds).eq("status", "active"),
      supabase.from("patient_conditions").select("*").eq("practice_id", practiceId).in("patient_id", patientIds).eq("is_active", true),
      supabase.from("patient_intake_summaries").select("*").eq("practice_id", practiceId).in("patient_id", patientIds).eq("status", "accepted"),
      supabase.from("checkin_instances").select("*").eq("practice_id", practiceId).eq("billing_month", billingMonth).in("patient_id", patientIds),
      supabase.from("question_sessions").select("*").eq("practice_id", practiceId).in("patient_id", patientIds).in("status", ["draft", "paused", "completed"]),
    ]);
    for (const result of [practiceResult, membersResult, enrollmentsResult, logsResult, billabilityResult, carePlansResult, conditionsResult, intakeResult, checkInsResult, sessionsResult]) {
      if (result.error) throw new Error(result.error.message);
    }

    const providerIds = Array.from(new Set([
      ...patientRows.map((row) => row.primary_provider_id),
      ...(enrollmentsResult.data ?? []).map((row) => row.assigned_provider_id),
    ].filter((value): value is string => Boolean(value))));
    const providersResult = providerIds.length
      ? await supabase.from("providers").select("*").eq("practice_id", practiceId).in("id", providerIds)
      : { data: [], error: null };
    if (providersResult.error) throw new Error(providersResult.error.message);

    const minutesByPatientId: Record<string, number> = {};
    for (const log of logsResult.data ?? []) {
      minutesByPatientId[log.patient_id] = (minutesByPatientId[log.patient_id] ?? 0) + Number(log.minutes ?? 0);
    }
    const coordinatorLabels = Object.fromEntries((membersResult.data ?? []).map((member) => [
      member.id,
      member.invited_email ?? `Coordinator ${member.id.slice(0, 8)}`,
    ]));
    const monthlyThreshold = practiceResult.data?.ccm_monthly_min_minutes ?? 20;
    const rows = composeWorklistRows({
      billability: billabilityResult.data ?? [],
      carePlans: carePlansResult.data ?? [],
      checkIns: checkInsResult.data ?? [],
      conditions: conditionsResult.data ?? [],
      enrollments: enrollmentsResult.data ?? [],
      intakeSummaries: intakeResult.data ?? [],
      minutesByPatientId,
      patients: patientRows,
      practiceAttestationComplete: Boolean(
        practiceResult.data?.billing_settings &&
        typeof practiceResult.data.billing_settings === "object" &&
        !Array.isArray(practiceResult.data.billing_settings) &&
        practiceResult.data.billing_settings.cms_eligibility_attested === true &&
        practiceResult.data.billing_settings.medicare_enrollment_attested === true
      ),
      providers: providersResult.data ?? [],
      sessions: sessionsResult.data ?? [],
    }, billingMonth, monthlyThreshold).map((row) => ({
      ...row,
      owner: row.owner === "Provider"
        ? row.owner
        : row.assignedCoordinatorId ? coordinatorLabels[row.assignedCoordinatorId] ?? row.owner : "Unassigned",
    }));

    return Response.json({
      assignments: (membersResult.data ?? []).map((member) => ({ id: member.id, label: coordinatorLabels[member.id] })),
      billingMonth,
      monthlyThreshold,
      page,
      pageSize,
      rows,
      total: count ?? rows.length,
    });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return authErrorResponse(error);
  }
}
