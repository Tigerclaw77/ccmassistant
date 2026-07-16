import { authErrorResponse, PRACTICE_ADMIN_ROLES, requirePracticeMembership } from "../../../../lib/auth";
import { badRequest } from "../../../../lib/api/json";
import { normalizeBillingMonth } from "../../../../lib/ccm/month-context";
import { QUESTION_BANK } from "../../../../lib/ccm/question-bank/questions";
import type { CcmEnrollment } from "../../../../lib/ccm/types";

type CountItem = { label: string; count: number };

function nextMonth(month: string): string {
  const [year, monthNumber] = month.slice(0, 7).split("-").map(Number);
  return monthNumber === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
}

function increment(map: Map<string, number>, key: string | null | undefined) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topCounts(map: Map<string, number>, limit = 8): CountItem[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId, PRACTICE_ADMIN_ROLES);
    const monthEnd = nextMonth(billingMonth);
    const [patientsResult, enrollmentsResult, checkInsResult, billabilityResult, membersResult, providersResult, conditionsResult, sessionsResult, customQuestionsResult] = await Promise.all([
      supabase.from("patients").select("id, care_coordinator_member_id, primary_provider_id, status").eq("practice_id", practiceId),
      supabase.from("ccm_enrollments").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      supabase.from("checkin_instances").select("id, patient_id, status").eq("practice_id", practiceId).eq("billing_month", billingMonth),
      supabase.from("monthly_billability").select("patient_id, status, total_minutes, reason_codes").eq("practice_id", practiceId).eq("billing_month", billingMonth),
      supabase.from("practice_members").select("id, invited_email, role").eq("practice_id", practiceId).eq("status", "active"),
      supabase.from("providers").select("id, full_name").eq("practice_id", practiceId).eq("is_active", true),
      supabase.from("patient_conditions").select("patient_id, display_name, canonical_name, condition_name").eq("practice_id", practiceId).eq("is_active", true),
      supabase.from("question_sessions").select("session_state").eq("practice_id", practiceId).gte("started_at", billingMonth).lt("started_at", monthEnd),
      supabase.from("question_bank_custom_question_versions").select("question_key, question_text, version, state").eq("practice_id", practiceId).order("version", { ascending: false }),
    ]);
    for (const result of [patientsResult, enrollmentsResult, checkInsResult, billabilityResult, membersResult, providersResult, conditionsResult, sessionsResult, customQuestionsResult]) {
      if (result.error) throw new Error(result.error.message);
    }

    const latestEnrollmentByPatient = new Map<string, CcmEnrollment>();
    for (const enrollment of enrollmentsResult.data ?? []) {
      if (!latestEnrollmentByPatient.has(enrollment.patient_id)) latestEnrollmentByPatient.set(enrollment.patient_id, enrollment);
    }
    const activeEnrollments = [...latestEnrollmentByPatient.values()].filter((row) => row.status === "active");
    const activePatientIds = new Set(activeEnrollments.map((row) => row.patient_id));
    const completeCheckInPatientIds = new Set((checkInsResult.data ?? []).filter((row) => ["responded", "closed"].includes(row.status)).map((row) => row.patient_id));

    const memberLabels = new Map((membersResult.data ?? []).map((row) => [row.id, row.invited_email ?? `${row.role} staff`]));
    const providerLabels = new Map((providersResult.data ?? []).map((row) => [row.id, row.full_name]));
    const coordinatorCounts = new Map<string, number>();
    const providerCounts = new Map<string, number>();
    for (const enrollment of activeEnrollments) {
      increment(coordinatorCounts, memberLabels.get(enrollment.care_coordinator_member_id ?? "") ?? "Unassigned");
      increment(providerCounts, providerLabels.get(enrollment.assigned_provider_id ?? "") ?? "Unassigned");
    }

    const statusCounts = new Map<string, number>();
    const bottleneckCounts = new Map<string, number>();
    let totalMinutes = 0;
    let patientsAtRisk = 0;
    for (const row of billabilityResult.data ?? []) {
      increment(statusCounts, row.status);
      totalMinutes += Number(row.total_minutes ?? 0);
      const reasons = row.reason_codes ?? [];
      reasons.forEach((reason) => increment(bottleneckCounts, reason));
      if (["hold", "ineligible"].includes(row.status) || reasons.some((reason) => reason !== "insufficient_minutes")) patientsAtRisk += 1;
    }

    const diagnosisCounts = new Map<string, number>();
    for (const condition of conditionsResult.data ?? []) {
      increment(diagnosisCounts, condition.display_name ?? condition.canonical_name ?? condition.condition_name);
    }

    const canonicalQuestionLabels = new Map(QUESTION_BANK.map((question) => [question.id, question.text]));
    const customQuestionLabels = new Map<string, string>();
    for (const row of customQuestionsResult.data ?? []) {
      if (!customQuestionLabels.has(row.question_key) && row.state === "active") customQuestionLabels.set(row.question_key, row.question_text);
    }
    const questionCounts = new Map<string, number>();
    const customQuestionCounts = new Map<string, number>();
    const bankCounts = new Map<string, number>();
    for (const record of sessionsResult.data ?? []) {
      const state = objectValue(record.session_state);
      const context = objectValue(state.context);
      const diagnoses = Array.isArray(context.diagnoses) ? context.diagnoses : [];
      for (const diagnosis of diagnoses) {
        const item = objectValue(diagnosis);
        if (typeof item.name === "string") increment(bankCounts, item.name);
      }
      const completed = Array.isArray(state.completedQuestionIds) ? state.completedQuestionIds : [];
      for (const questionId of completed) {
        if (typeof questionId !== "string") continue;
        if (questionId.startsWith("custom.")) increment(customQuestionCounts, customQuestionLabels.get(questionId) ?? "Custom question");
        else increment(questionCounts, canonicalQuestionLabels.get(questionId as never) ?? "Question");
      }
    }

    const eligibleNotEnrolled = [...latestEnrollmentByPatient.values()].filter((row) => row.eligibility_status === "eligible" && row.status !== "active").length;
    const enrolledThisMonth = activeEnrollments.filter((row) => row.enrolled_at && row.enrolled_at >= billingMonth && row.enrolled_at < monthEnd).length;

    return Response.json({
      billing: {
        billed: statusCounts.get("billed") ?? 0,
        hold: statusCounts.get("hold") ?? 0,
        notReady: statusCounts.get("not_ready") ?? 0,
        ready: statusCounts.get("ready_to_bill") ?? 0,
        totalMinutes,
      },
      billingMonth,
      bottlenecks: topCounts(bottleneckCounts),
      coordinatorWorkload: topCounts(coordinatorCounts),
      customQuestionUsage: topCounts(customQuestionCounts),
      mostUsedDiagnoses: topCounts(diagnosisCounts),
      mostUsedQuestionBanks: topCounts(bankCounts),
      patientsAtRisk,
      providerWorkload: topCounts(providerCounts),
      questionUsage: topCounts(questionCounts),
      summary: {
        activePatients: activePatientIds.size,
        checkInCompletionRate: activePatientIds.size ? Math.round((completeCheckInPatientIds.size / activePatientIds.size) * 100) : 0,
        eligibleNotEnrolled,
        enrolledThisMonth,
        totalPatients: patientsResult.data?.length ?? 0,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
