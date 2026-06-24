import { authErrorResponse, getCurrentUser } from "../../../../lib/auth";
import { ACTIVE_PRACTICE_HEADER, resolveActivePractice } from "../../../../lib/practice-context";

export async function GET(request: Request) {
  try {
    const context = await getCurrentUser(request);

    if (!context) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return Response.json({ error: "code is required" }, { status: 400 });
    }

    const requestedPracticeId =
      request.headers.get(ACTIVE_PRACTICE_HEADER) ?? url.searchParams.get("practiceId");
    const active = await resolveActivePractice(context, requestedPracticeId);

    if (!active.practice || !active.membership) {
      return Response.json({ error: "Active practice membership required" }, { status: 403 });
    }

    const { data: icd10Code, error: icdError } = await context.supabase
      .from("icd10_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (icdError) {
      return Response.json({ error: icdError.message }, { status: 500 });
    }

    if (!icd10Code) {
      return Response.json({ error: "ICD-10 code not found in knowledge seed" }, { status: 404 });
    }

    const { data: clusterMap, error: clusterMapError } = await context.supabase
      .from("cluster_icd10_map")
      .select("*")
      .eq("icd10_code", code);

    if (clusterMapError) {
      return Response.json({ error: clusterMapError.message }, { status: 500 });
    }

    const clusterIds = (clusterMap ?? []).map((row) => row.cluster_id);

    if (clusterIds.length === 0) {
      return Response.json({
        clusters: [],
        families: [],
        icd10Code,
        objectives: [],
        questions: [],
      });
    }

    const [
      clustersResult,
      clusterObjectivesResult,
    ] = await Promise.all([
      context.supabase.from("management_clusters").select("*").in("id", clusterIds),
      context.supabase.from("cluster_objective_map").select("*").in("cluster_id", clusterIds),
    ]);

    const firstError = clustersResult.error ?? clusterObjectivesResult.error;
    if (firstError) {
      return Response.json({ error: firstError.message }, { status: 500 });
    }

    const objectiveIds = Array.from(
      new Set((clusterObjectivesResult.data ?? []).map((row) => row.objective_id)),
    );

    if (objectiveIds.length === 0) {
      return Response.json({
        clusters: clustersResult.data ?? [],
        families: [],
        icd10Code,
        objectives: [],
        questions: [],
      });
    }

    const [objectivesResult, objectiveFamiliesResult] = await Promise.all([
      context.supabase.from("clinical_objectives").select("*").in("id", objectiveIds),
      context.supabase.from("objective_family_map").select("*").in("objective_id", objectiveIds),
    ]);

    const secondError = objectivesResult.error ?? objectiveFamiliesResult.error;
    if (secondError) {
      return Response.json({ error: secondError.message }, { status: 500 });
    }

    const familyIds = Array.from(
      new Set((objectiveFamiliesResult.data ?? []).map((row) => row.family_id)),
    );

    if (familyIds.length === 0) {
      return Response.json({
        clusters: clustersResult.data ?? [],
        families: [],
        icd10Code,
        objectives: objectivesResult.data ?? [],
        questions: [],
      });
    }

    const [familiesResult, familyMembersResult] = await Promise.all([
      context.supabase.from("question_families").select("*").in("id", familyIds),
      context.supabase.from("question_family_members").select("*").in("family_id", familyIds),
    ]);

    const thirdError = familiesResult.error ?? familyMembersResult.error;
    if (thirdError) {
      return Response.json({ error: thirdError.message }, { status: 500 });
    }

    const questionIds = Array.from(
      new Set((familyMembersResult.data ?? []).map((row) => row.question_id)),
    );
    const questionsResult = questionIds.length
      ? await context.supabase.from("clinical_questions").select("*").in("id", questionIds)
      : { data: [], error: null };

    if (questionsResult.error) {
      return Response.json({ error: questionsResult.error.message }, { status: 500 });
    }

    return Response.json({
      clusterIcd10Map: clusterMap ?? [],
      clusterObjectiveMap: clusterObjectivesResult.data ?? [],
      clusters: clustersResult.data ?? [],
      families: familiesResult.data ?? [],
      familyMembers: familyMembersResult.data ?? [],
      icd10Code,
      objectiveFamilyMap: objectiveFamiliesResult.data ?? [],
      objectives: objectivesResult.data ?? [],
      questions: questionsResult.data ?? [],
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
