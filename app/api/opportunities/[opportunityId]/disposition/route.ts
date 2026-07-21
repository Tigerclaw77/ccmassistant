import { authErrorResponse, PATIENT_WRITE_ROLES, requirePracticeMembership } from "../../../../../lib/auth";
import { badRequest } from "../../../../../lib/api/json";
import { validateActualReviewTime, type OpportunityDisposition } from "../../../../../lib/ccm/opportunity-detector";

const DISPOSITIONS = new Set<OpportunityDisposition>(["accepted", "different_action", "provider_review", "deferred", "no_intervention"]);

export async function POST(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  try {
    const { opportunityId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const practiceId = typeof body.practiceId === "string" ? body.practiceId : "";
    const disposition = typeof body.disposition === "string" ? body.disposition as OpportunityDisposition : "" as OpportunityDisposition;
    if (!practiceId || !DISPOSITIONS.has(disposition)) throw new Error("practiceId and a valid disposition are required");
    const minutes = body.reviewMinutes === null || body.reviewMinutes === undefined || body.reviewMinutes === ""
      ? null
      : Number(body.reviewMinutes);
    const affirmed = body.timeAffirmed === true;
    validateActualReviewTime(minutes, affirmed);
    if (disposition === "no_intervention" && (typeof body.note !== "string" || body.note.trim().length < 3)) {
      throw new Error("No intervention requires a concise note");
    }
    const { supabase } = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    const { data, error } = await supabase.rpc("dispose_ccm_opportunity", {
      disposition_note: typeof body.note === "string" ? body.note.trim() || null : null,
      disposition_value: disposition,
      review_minutes: minutes,
      target_opportunity_id: opportunityId,
      task_due_at: typeof body.taskDueAt === "string" ? body.taskDueAt : null,
      task_title: typeof body.taskTitle === "string" ? body.taskTitle.trim() || null : null,
      time_affirmed: affirmed,
    });
    if (error) throw new Error(error.message);
    return Response.json({ result: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return badRequest(error);
    return authErrorResponse(error);
  }
}
