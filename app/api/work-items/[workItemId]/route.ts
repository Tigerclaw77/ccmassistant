import { authErrorResponse, PATIENT_WRITE_ROLES, requirePracticeMembership } from "../../../../lib/auth";
import { badRequest } from "../../../../lib/api/json";
import { assertClinicalWorkAccess } from "../../../../lib/ccm/work-authorization";
import type { CcmWorkItem } from "../../../../lib/ccm/types";

const PRIORITIES = new Set(["urgent", "high", "normal", "low"]);
const STATUSES = new Set(["open", "in_progress", "deferred", "awaiting_patient", "awaiting_provider", "completed", "cancelled"]);
const FINAL_COORDINATOR_STATUSES = new Set(["deferred", "awaiting_provider", "completed"]);

export async function PATCH(request: Request, context: { params: Promise<{ workItemId: string }> }) {
  try {
    const { workItemId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const practiceId = typeof body.practiceId === "string" ? body.practiceId : "";
    if (!practiceId) throw new Error("practiceId is required");
    const auth = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    const { data: item, error: itemError } = await auth.supabase.from("ccm_work_items").select("*").eq("practice_id", practiceId).eq("id", workItemId).single();
    if (itemError || !item) throw new Error(itemError?.message ?? "Work item not found");
    if (["completed", "cancelled"].includes(item.status) && body.status !== undefined && body.status !== item.status) {
      throw new Error("Completed or cancelled work cannot be reopened");
    }
    const { data: patient, error: patientError } = await auth.supabase.from("patients").select("care_coordinator_member_id").eq("practice_id", practiceId).eq("id", item.patient_id).single();
    if (patientError || !patient) throw new Error(patientError?.message ?? "Patient not found");
    assertClinicalWorkAccess({ assignedCoordinatorId: patient.care_coordinator_member_id, membershipId: auth.membership.id, role: auth.membership.role });

    const update: Partial<Omit<CcmWorkItem, "id" | "created_at">> = { updated_by: auth.user.id };
    if (body.manualPriority !== undefined) {
      if (body.manualPriority === null) {
        update.manual_priority = null;
        update.manual_priority_reason = null;
      } else {
        if (typeof body.manualPriority !== "string" || !PRIORITIES.has(body.manualPriority)) throw new Error("Invalid manual priority");
        if (typeof body.manualPriorityReason !== "string" || body.manualPriorityReason.trim().length < 3) throw new Error("Manual priority requires a reason");
        update.manual_priority = body.manualPriority as NonNullable<CcmWorkItem["manual_priority"]>;
        update.manual_priority_reason = body.manualPriorityReason.trim();
        update.priority = body.manualPriority as CcmWorkItem["priority"];
      }
    }
    const nextAssignee = typeof body.assignedMemberId === "string" ? body.assignedMemberId : null;
    if (body.assignedMemberId !== undefined && nextAssignee !== item.assigned_member_id) {
      if (!["owner", "admin"].includes(auth.membership.role)) throw new Error("Practice administration is required to reassign work");
      update.assigned_member_id = nextAssignee;
    }
    if (typeof body.status === "string") {
      if (!STATUSES.has(body.status)) throw new Error("Invalid work-item status");
      const outcome = typeof body.outcome === "string" ? body.outcome.trim() : "";
      if (FINAL_COORDINATOR_STATUSES.has(body.status) && outcome.length < 8) {
        throw new Error("Document the work outcome using at least 8 characters");
      }
      update.status = body.status as CcmWorkItem["status"];
      if (outcome) update.outcome = outcome;
      if (body.status === "completed") {
        update.completed_at = new Date().toISOString();
        update.queue_group = "completed_today";
        update.escalation_status = "resolved";
      } else if (body.status === "awaiting_provider") {
        update.queue_group = "awaiting_provider";
        update.escalation_status = "requested";
      } else if (body.status === "deferred") {
        if (typeof body.dueAt !== "string" || Number.isNaN(new Date(body.dueAt).valueOf())) {
          throw new Error("Deferring work requires a valid follow-up date");
        }
        update.due_at = body.dueAt;
        update.queue_group = "needs_attention";
      } else if (body.status === "in_progress") {
        update.queue_group = "needs_attention";
      }
    }
    const { data, error } = await auth.supabase.from("ccm_work_items").update(update).eq("id", workItemId).eq("practice_id", practiceId).select("*").single();
    if (error) throw new Error(error.message);
    return Response.json({ workItem: data });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return badRequest(error);
    return authErrorResponse(error);
  }
}
