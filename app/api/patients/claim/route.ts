import { authErrorResponse, requirePracticeMembership } from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const practiceId = requiredString(body, "practiceId");
    const patientId = requiredString(body, "patientId");
    const { supabase } = await requirePracticeMembership(request, practiceId, ["coordinator"]);
    const { data, error } = await supabase.rpc("claim_unassigned_ccm_patient", {
      target_patient_id: patientId,
      target_practice_id: practiceId,
    });
    if (error) throw new Error(error.message);
    return Response.json({ claim: data });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return badRequest(error);
    return authErrorResponse(error);
  }
}
