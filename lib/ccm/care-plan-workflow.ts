import type { CarePlan, CarePlanReviewStatus, JsonValue, PracticeRole } from "./types";

export type CarePlanReviewAction = "coordinator_ready" | "submit" | "approve" | "request_changes";

const TRANSITIONS: Record<CarePlanReviewAction, { from: CarePlanReviewStatus[]; to: CarePlanReviewStatus }> = {
  coordinator_ready: { from: ["draft", "revision_requested"], to: "coordinator_ready" },
  submit: { from: ["coordinator_ready"], to: "provider_review_required" },
  approve: { from: ["provider_review_required"], to: "approved" },
  request_changes: { from: ["provider_review_required"], to: "revision_requested" },
};

export function nextCarePlanReviewStatus(
  current: CarePlanReviewStatus,
  action: CarePlanReviewAction,
): CarePlanReviewStatus {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(current)) {
    throw new Error(`Care plan cannot ${action.replaceAll("_", " ")} from ${current.replaceAll("_", " ")}`);
  }
  return transition.to;
}

export function canPerformCarePlanReviewAction(role: PracticeRole, action: CarePlanReviewAction): boolean {
  if (action === "approve" || action === "request_changes") return role === "provider" || role === "owner";
  return role === "coordinator" || role === "admin" || role === "owner";
}

export function carePlanReviewDecision(action: CarePlanReviewAction): "coordinator_ready" | "submitted" | "approved" | "changes_requested" {
  if (action === "submit") return "submitted";
  if (action === "approve") return "approved";
  if (action === "request_changes") return "changes_requested";
  return action;
}

export function carePlanAuditSnapshot(plan: CarePlan): JsonValue {
  return {
    barriers: plan.barriers,
    goals: plan.goals,
    interventions: plan.interventions,
    notes: plan.notes,
    providerId: plan.provider_id,
    reviewStatus: plan.review_status,
    version: plan.version,
  };
}

export const CARE_PLAN_REVIEW_LABELS: Record<CarePlanReviewStatus, string> = {
  approved: "Approved",
  coordinator_ready: "Coordinator ready",
  draft: "Draft",
  provider_review_required: "Waiting for provider",
  revision_requested: "Revision requested",
};
