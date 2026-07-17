import {
  authErrorResponse,
  createServiceRoleSupabaseClient,
  requirePracticeMembership,
} from "../../../lib/auth";
import { badRequest, optionalString, readJsonObject, requiredString } from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  canPerformCarePlanReviewAction,
  carePlanAuditSnapshot,
  carePlanReviewDecision,
  nextCarePlanReviewStatus,
  type CarePlanReviewAction,
} from "../../../lib/ccm/care-plan-workflow";
import type { CarePlan, JsonValue } from "../../../lib/ccm/types";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";
import { firstDayOfMonth } from "../../../lib/api/json";

const ACTIONS = ["coordinator_ready", "submit", "approve", "request_changes"] as const;

function reviewAction(value: unknown): CarePlanReviewAction {
  if (typeof value !== "string" || !ACTIONS.includes(value as CarePlanReviewAction)) {
    throw new Error("Unsupported care-plan review action");
  }
  return value as CarePlanReviewAction;
}

async function providerCanReview(
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  memberId: string,
  plan: CarePlan,
): Promise<boolean> {
  const { data: provider } = await service
    .from("providers")
    .select("id")
    .eq("practice_id", plan.practice_id)
    .eq("member_id", memberId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(provider && provider.id === plan.provider_id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  if (!practiceId) return badRequest(new Error("practiceId is required"));

  try {
    const context = await requirePracticeMembership(request, practiceId);
    const service = createServiceRoleSupabaseClient();
    let query = service.from("care_plans").select("*").eq("practice_id", practiceId);
    const patientId = searchParams.get("patientId");
    if (patientId) query = query.eq("patient_id", patientId);
    if (searchParams.get("pending") === "true") query = query.eq("review_status", "provider_review_required");
    const { data: plans, error } = await query.order("updated_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    let visiblePlans = plans ?? [];
    if (context.membership.role === "provider") {
      const { data: provider } = await service.from("providers").select("id").eq("practice_id", practiceId).eq("member_id", context.membership.id).eq("is_active", true).maybeSingle();
      visiblePlans = provider ? visiblePlans.filter((plan) => plan.provider_id === provider.id) : [];
    }
    const patientIds = [...new Set(visiblePlans.map((plan) => plan.patient_id))];
    const { data: patients } = patientIds.length
      ? await service.from("patients").select("id, display_name").eq("practice_id", practiceId).in("id", patientIds)
      : { data: [] };
    const names = new Map((patients ?? []).map((patient) => [patient.id, patient.display_name]));
    const planIds = visiblePlans.map((plan) => plan.id);
    const { data: reviews } = planIds.length
      ? await service.from("care_plan_reviews").select("*").eq("practice_id", practiceId).in("care_plan_id", planIds).order("created_at", { ascending: false })
      : { data: [] };
    return Response.json({ carePlans: visiblePlans.map((plan) => ({ ...plan, patient_name: names.get(plan.patient_id) ?? "Patient" })), reviews: reviews ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }
  let practiceId: string;
  let carePlanId: string;
  let action: CarePlanReviewAction;
  try {
    practiceId = requiredString(body, "practiceId");
    carePlanId = requiredString(body, "carePlanId");
    action = reviewAction(body.action);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const context = await requirePracticeMembership(request, practiceId);
    if (!canPerformCarePlanReviewAction(context.membership.role, action)) {
      return Response.json({ error: "Your role cannot perform this care-plan review action" }, { status: 403 });
    }
    const service = createServiceRoleSupabaseClient();
    const { data: plan } = await service.from("care_plans").select("*").eq("practice_id", practiceId).eq("id", carePlanId).maybeSingle();
    if (!plan) return Response.json({ error: "Care plan not found" }, { status: 404 });
    if (context.membership.role === "provider" && !(await providerCanReview(service, context.membership.id, plan))) {
      return Response.json({ error: "This care plan is not assigned to the signed-in provider" }, { status: 403 });
    }
    let nextStatus;
    try {
      nextStatus = nextCarePlanReviewStatus(plan.review_status, action);
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Invalid review transition" }, { status: 409 });
    }
    const comments = optionalString(body, "comments");
    if (action === "request_changes" && (!comments || comments.length < 3)) {
      return badRequest(new Error("Comments are required when requesting changes"));
    }
    if (action === "approve") {
      if (!plan.provider_id) return Response.json({ error: "An assigned provider is required before approval" }, { status: 409 });
    }

    const decision = carePlanReviewDecision(action);
    const { data: saved, error: transitionError } = await service.rpc("transition_care_plan_review", {
      expected_review_status: plan.review_status,
      next_review_status: nextStatus,
      review_comment_text: comments,
      review_decision: decision,
      reviewer_user_id: context.user.id,
      target_care_plan_id: plan.id,
    });
    if (transitionError || !saved) return Response.json({ error: transitionError?.message ?? "Unable to update review" }, { status: 409 });
    const savedPlan = saved as CarePlan;
    await recordAuditEvent(service, {
      action: `care_plan.review_${decision}`,
      actorUserId: context.user.id,
      afterData: carePlanAuditSnapshot(savedPlan),
      beforeData: carePlanAuditSnapshot(plan),
      entityId: plan.id,
      entityType: "care_plan",
      metadata: { commentsPresent: Boolean(comments), version: plan.version } as JsonValue,
      practiceId,
    });
    if (action === "approve") await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId: plan.patient_id, practiceId });
    return Response.json({ carePlan: savedPlan });
  } catch (error) {
    return authErrorResponse(error);
  }
}
