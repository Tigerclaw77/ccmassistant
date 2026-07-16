import { authErrorResponse, requirePracticeMembership } from "../../../lib/auth";
import { badRequest, firstDayOfMonth } from "../../../lib/api/json";

function jsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  const billingMonth = firstDayOfMonth(searchParams.get("billingMonth") ?? new Date());

  if (!practiceId || !patientId) {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    const { data: practice } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
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

    const providerId = enrollment?.assigned_provider_id ?? patient.primary_provider_id;
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
      ? await supabase
          .from("questions")
          .select("*")
          .in("id", questionIds)
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

    const { data: intakeSummary } = await supabase
      .from("patient_intake_summaries")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("status", "accepted")
      .maybeSingle();

    const { data: billability } = await supabase
      .from("monthly_billability")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    const { data: evidenceSnapshot } = await supabase
      .from("billing_evidence_snapshots")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("billing_month", billingMonth)
      .maybeSingle();

    const entityIds = [
      patient.id,
      enrollment?.id,
      intakeSummary?.id,
      ...(carePlans ?? []).map((carePlan) => carePlan.id),
      checkIn?.id,
      ...(interactionLogs ?? []).map((log) => log.id),
      billability?.id,
    ].filter(Boolean) as string[];

    const { data: auditEvents } = entityIds.length
      ? await supabase
          .from("audit_events")
          .select("*")
          .eq("practice_id", practiceId)
          .in("entity_id", entityIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const preserved = jsonObject(evidenceSnapshot?.snapshot);
    const preservedCarePlan = preserved ? preserved.care_plan : null;

    return Response.json({
      auditEvents: auditEvents ?? [],
      billability: preserved?.billability ?? billability,
      billingMonth: preserved?.billing_month ?? billingMonth,
      carePlans: preservedCarePlan ? [preservedCarePlan] : carePlans ?? [],
      checkIn: preserved?.check_in ?? checkIn,
      conditions: preserved?.chronic_conditions ?? conditions ?? [],
      enrollment: preserved?.enrollment ?? enrollment,
      evidenceSnapshot,
      interactionLogs: preserved?.interaction_logs ?? interactionLogs ?? [],
      intakeSummary: preserved?.intake_summary ?? intakeSummary,
      patient: preserved?.patient ?? patient,
      practice: preserved?.practice ?? practice,
      provider: preserved?.assigned_provider ?? provider,
      responses:
        preserved?.check_in_responses ??
        (responses ?? []).map((response) => ({
          ...response,
          question: response.question_id ? questionsById[response.question_id] ?? null : null,
        })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
