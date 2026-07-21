import { authErrorResponse, PRACTICE_ADMIN_ROLES, requirePracticeMembership } from "../../../../lib/auth";
import { badRequest } from "../../../../lib/api/json";

export async function GET(request: Request) {
  const practiceId = new URL(request.url).searchParams.get("practiceId");
  if (!practiceId) return badRequest(new Error("practiceId is required"));
  try {
    const { supabase } = await requirePracticeMembership(request, practiceId, PRACTICE_ADMIN_ROLES);
    const [events, opportunities, dispositions, reports] = await Promise.all([
      supabase.from("ccm_work_item_events").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }).limit(100),
      supabase.from("ccm_opportunities").select("id, detector_version, rule_identifier, rule_version, trigger_code, trigger_summary, generated_at, created_at").eq("practice_id", practiceId).order("generated_at", { ascending: false }).limit(100),
      supabase.from("ccm_opportunity_dispositions").select("id, opportunity_id, disposition, actual_review_minutes, actual_time_affirmed, created_at").eq("practice_id", practiceId).order("created_at", { ascending: false }).limit(100),
      supabase.from("ccm_clinical_reports").select("id, recipient_type, delivery_method, delivery_status, contains_phi, created_at").eq("practice_id", practiceId).order("created_at", { ascending: false }).limit(100),
    ]);
    for (const result of [events, opportunities, dispositions, reports]) if (result.error) throw new Error(result.error.message);
    return Response.json({ events: events.data ?? [], opportunities: opportunities.data ?? [], dispositions: dispositions.data ?? [], reports: reports.data ?? [] });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return Response.json({ error: error.message }, { status: 500 });
    return authErrorResponse(error);
  }
}
