import { authErrorResponse, getCurrentUser } from "../../../lib/auth";
import { ACTIVE_PRACTICE_HEADER, resolveActivePractice } from "../../../lib/practice-context";

export async function GET(request: Request) {
  try {
    const context = await getCurrentUser(request);

    if (!context) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestedPracticeId =
      request.headers.get(ACTIVE_PRACTICE_HEADER) ?? url.searchParams.get("practiceId");
    const active = await resolveActivePractice(context, requestedPracticeId);

    if (!active.practice || !active.membership) {
      return Response.json({ error: "Active practice membership required" }, { status: 403 });
    }

    const [
      clustersResult,
      icd10Result,
      clusterIcd10Result,
      objectivesResult,
      clusterObjectivesResult,
      familiesResult,
      objectiveFamiliesResult,
      questionsResult,
      familyMembersResult,
      tagsResult,
      versionsResult,
      dependenciesResult,
      rotationRulesResult,
    ] = await Promise.all([
      context.supabase.from("management_clusters").select("*").order("name", { ascending: true }),
      context.supabase.from("icd10_codes").select("*").order("code", { ascending: true }),
      context.supabase.from("cluster_icd10_map").select("*"),
      context.supabase.from("clinical_objectives").select("*").order("name", { ascending: true }),
      context.supabase.from("cluster_objective_map").select("*").order("priority", { ascending: true }),
      context.supabase.from("question_families").select("*").order("name", { ascending: true }),
      context.supabase.from("objective_family_map").select("*").order("priority", { ascending: true }),
      context.supabase.from("clinical_questions").select("*").order("question_text", { ascending: true }),
      context.supabase.from("question_family_members").select("*").order("sort_order", { ascending: true }),
      context.supabase.from("clinical_question_tags").select("*").order("tag", { ascending: true }),
      context.supabase.from("question_versions").select("*").order("version", { ascending: false }),
      context.supabase.from("question_dependencies").select("*"),
      context.supabase.from("question_rotation_rules").select("*"),
    ]);

    const error =
      clustersResult.error ??
      icd10Result.error ??
      clusterIcd10Result.error ??
      objectivesResult.error ??
      clusterObjectivesResult.error ??
      familiesResult.error ??
      objectiveFamiliesResult.error ??
      questionsResult.error ??
      familyMembersResult.error ??
      tagsResult.error ??
      versionsResult.error ??
      dependenciesResult.error ??
      rotationRulesResult.error;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      clusterIcd10Map: clusterIcd10Result.data ?? [],
      clusterObjectiveMap: clusterObjectivesResult.data ?? [],
      clusters: clustersResult.data ?? [],
      dependencies: dependenciesResult.data ?? [],
      families: familiesResult.data ?? [],
      familyMembers: familyMembersResult.data ?? [],
      icd10Codes: icd10Result.data ?? [],
      objectiveFamilyMap: objectiveFamiliesResult.data ?? [],
      objectives: objectivesResult.data ?? [],
      questions: questionsResult.data ?? [],
      rotationRules: rotationRulesResult.data ?? [],
      tags: tagsResult.data ?? [],
      versions: versionsResult.data ?? [],
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
