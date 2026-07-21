import { createHash } from "node:crypto";
import { authErrorResponse, createServiceRoleSupabaseClient, PATIENT_WRITE_ROLES, requirePracticeMembership } from "../../../lib/auth";
import { badRequest } from "../../../lib/api/json";
import { detectClinicalOpportunities, isStaleOpportunity, type EvidenceFact } from "../../../lib/ccm/opportunity-detector";
import { sessionStateFromJson } from "../../../lib/ccm/session-integration";
import { assertClinicalWorkAccess } from "../../../lib/ccm/work-authorization";
import type { CarePlan, CcmOpportunity, CheckinResponse, PatientCondition, QuestionSessionRecord } from "../../../lib/ccm/types";
import { clinicalWorkflowSettings, isMonthEndAwarenessActive, practiceDateParts } from "../../../lib/ccm/workflow-settings";

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function patientScope(request: Request, practiceId: string, patientId: string, write = false) {
  const context = await requirePracticeMembership(request, practiceId, write ? PATIENT_WRITE_ROLES : undefined);
  const { data: patient, error } = await context.supabase
    .from("patients")
    .select("id, primary_provider_id, care_coordinator_member_id")
    .eq("practice_id", practiceId)
    .eq("id", patientId)
    .single();
  if (error || !patient) throw new Error(error?.message ?? "Patient not found");
  if (write) {
    assertClinicalWorkAccess({
      assignedCoordinatorId: patient.care_coordinator_member_id,
      membershipId: context.membership.id,
      role: context.membership.role,
    });
  }
  return { ...context, patient };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  if (!practiceId || !patientId) return badRequest(new Error("practiceId and patientId are required"));
  try {
    const { supabase } = await patientScope(request, practiceId, patientId);
    const [opportunities, dispositions, workItems, assignments] = await Promise.all([
      supabase.from("ccm_opportunities").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).order("generated_at", { ascending: false }),
      supabase.from("ccm_opportunity_dispositions").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      supabase.from("ccm_work_items").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).order("priority_score", { ascending: false }),
      supabase.from("practice_members").select("id, invited_email, role").eq("practice_id", practiceId).eq("status", "active").in("role", ["owner", "admin", "provider", "coordinator"]),
    ]);
    for (const result of [opportunities, dispositions, workItems, assignments]) if (result.error) throw new Error(result.error.message);
    const now = new Date().toISOString();
    const opportunityIds = new Set((opportunities.data ?? []).map((item) => item.id));
    return Response.json({
      opportunities: (opportunities.data ?? []).map((item) => ({ ...item, stale: isStaleOpportunity(item.generated_at, item.expires_at, now) })),
      dispositions: (dispositions.data ?? []).filter((item) => opportunityIds.has(item.opportunity_id)),
      workItems: workItems.data ?? [],
      assignments: (assignments.data ?? []).map((member) => ({ id: member.id, label: member.invited_email ?? `${member.role} staff` })),
    });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return Response.json({ error: error.message }, { status: 500 });
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const practiceId = required(body.practiceId, "practiceId");
    const patientId = required(body.patientId, "patientId");
    const { supabase, user } = await patientScope(request, practiceId, patientId, true);
    const [responsesResult, plansResult, sessionsResult, conditionsResult, practiceResult] = await Promise.all([
      supabase.from("checkin_responses").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).eq("flagged", true),
      supabase.from("care_plans").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).order("updated_at", { ascending: false }).limit(1),
      supabase.from("question_sessions").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).in("status", ["draft", "paused", "completed"]),
      supabase.from("patient_conditions").select("*").eq("practice_id", practiceId).eq("patient_id", patientId).eq("is_active", true),
      supabase.from("practices").select("allow_coordinator_claiming, ccm_month_end_awareness_day, default_timezone, opportunity_expiration_overrides").eq("id", practiceId).single(),
    ]);
    for (const result of [responsesResult, plansResult, sessionsResult, conditionsResult, practiceResult]) if (result.error) throw new Error(result.error.message);
    const responses = (responsesResult.data ?? []) as CheckinResponse[];
    const plans = (plansResult.data ?? []) as CarePlan[];
    const sessions = (sessionsResult.data ?? []) as QuestionSessionRecord[];
    const conditions = (conditionsResult.data ?? []) as PatientCondition[];
    const abnormalResponses: EvidenceFact[] = responses.map((response) => ({
      observedAt: response.created_at,
      sourceId: response.id,
      sourceType: "checkin_response",
      summary: `Abnormal questionnaire response: ${response.canonical_question_id ?? response.question_id ?? "question"}`,
    }));
    const openWorkflowTasks = sessions.flatMap((record) => sessionStateFromJson(record.session_state).tasks)
      .filter((task) => task.status === "open")
      .map((task) => ({
        code: `${task.type}:${task.reason}:${task.questionId}`,
        observedAt: task.createdAt,
        priority: task.priority,
        reviewTarget: task.reviewTarget,
        sourceId: task.id,
        sourceType: "question_session_task" as const,
        summary: task.reason,
      }));
    const plan = plans[0];
    const generatedAt = new Date().toISOString();
    const settings = clinicalWorkflowSettings(practiceResult.data ?? {});
    const practiceDate = practiceDateParts(practiceResult.data?.default_timezone ?? "UTC");
    const currentBillingMonth = `${practiceDate.year}-${String(practiceDate.month).padStart(2, "0")}-01`;
    const monthEndActive = isMonthEndAwarenessActive(
      currentBillingMonth,
      practiceResult.data?.default_timezone ?? "UTC",
      settings.monthEndAwarenessDay,
    );
    const detected = detectClinicalOpportunities({
      abnormalResponses,
      carePlanRevisionRequested: plan?.review_status === "revision_requested" ? {
        observedAt: plan.revision_requested_at ?? plan.updated_at,
        sourceId: plan.id,
        sourceType: "care_plan",
        summary: plan.review_comments ?? "Provider requested a care-plan revision",
      } : undefined,
      conditionName: conditions[0]?.condition_name ?? null,
      expirationDays: settings.expirationDays,
      generatedAt,
      monthEndUnresolvedCare: monthEndActive && openWorkflowTasks[0] ? {
        observedAt: openWorkflowTasks[0].observedAt,
        sourceId: openWorkflowTasks[0].sourceId,
        sourceType: openWorkflowTasks[0].sourceType,
        summary: `Upcoming month-end with unresolved care activity: ${openWorkflowTasks[0].summary}`,
      } : undefined,
      openWorkflowTasks,
      patientId,
      practiceId,
    });

    const service = createServiceRoleSupabaseClient();
    const saved: CcmOpportunity[] = [];
    for (const opportunity of detected) {
      const evidenceFingerprint = fingerprint({
        benefitRationale: opportunity.benefitRationale,
        conditionOrWorkflowItem: opportunity.conditionOrWorkflowItem,
        detectorVersion: opportunity.detectorVersion,
        eligiblePerformers: opportunity.eligiblePerformers,
        evidence: opportunity.evidence,
        inputFacts: opportunity.inputFacts,
        opportunityType: opportunity.opportunityType,
        patientId: opportunity.patientId,
        practiceId: opportunity.practiceId,
        providerInvolvement: opportunity.providerInvolvement,
        ruleIdentifier: opportunity.ruleIdentifier,
        ruleVersion: opportunity.ruleVersion,
        suggestedActivity: opportunity.suggestedActivity,
        triggerCode: opportunity.triggerCode,
        triggerSummary: opportunity.triggerSummary,
      });
      const { data, error } = await service.rpc("store_ccm_opportunity", {
        evidence_records: opportunity.evidence.map((evidence) => ({
          facts: opportunity.inputFacts,
          observed_at: evidence.observedAt,
          source_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evidence.sourceId) ? evidence.sourceId : null,
          source_type: evidence.sourceType,
          summary: evidence.summary,
        })),
        opportunity_record: {
          benefit_rationale: opportunity.benefitRationale,
          condition_or_workflow_item: opportunity.conditionOrWorkflowItem,
          detector_version: opportunity.detectorVersion,
          eligible_performers: opportunity.eligiblePerformers,
          evidence_fingerprint: evidenceFingerprint,
          expires_at: opportunity.expiresAt,
          generated_at: generatedAt,
          generated_by: user.id,
          input_facts: opportunity.inputFacts,
          opportunity_type: opportunity.opportunityType,
          patient_id: patientId,
          practice_id: practiceId,
          provider_involvement: opportunity.providerInvolvement,
          rule_identifier: opportunity.ruleIdentifier,
          rule_version: opportunity.ruleVersion,
          suggested_activity: opportunity.suggestedActivity,
          trigger_code: opportunity.triggerCode,
          trigger_summary: opportunity.triggerSummary,
        },
      });
      if (error) throw new Error(error.message);
      const stored = data as { opportunity?: CcmOpportunity } | null;
      if (!stored?.opportunity) throw new Error("Opportunity storage returned no record");
      saved.push(stored.opportunity);
    }
    return Response.json({ detectorVersion: detected[0]?.detectorVersion ?? "ccm-opportunity-rules-v1", ruleVersion: detected[0]?.ruleVersion ?? "ccm-clinical-trigger-catalog-v1", suggestions: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return badRequest(error);
    return authErrorResponse(error);
  }
}
