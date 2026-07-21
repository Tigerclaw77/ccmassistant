import { authErrorResponse, PATIENT_WRITE_ROLES, requirePracticeMembership } from "../../../lib/auth";
import { badRequest } from "../../../lib/api/json";
import { assertClinicalWorkAccess } from "../../../lib/ccm/work-authorization";

const RECIPIENTS = new Set(["primary_responsible_provider", "supervising_provider", "specialist", "compliance", "billing", "coordinator"]);
const SECURE_METHODS = new Set(["secure_workspace", "secure_link", "approved_secure_message", "export"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const practiceId = typeof body.practiceId === "string" ? body.practiceId : "";
    const patientId = typeof body.patientId === "string" ? body.patientId : "";
    const recipientType = typeof body.recipientType === "string" ? body.recipientType : "";
    const deliveryMethod = typeof body.deliveryMethod === "string" ? body.deliveryMethod : "";
    if (!practiceId || !patientId || !RECIPIENTS.has(recipientType) || !SECURE_METHODS.has(deliveryMethod)) throw new Error("Practice, patient, supported recipient, and secure delivery method are required");
    const secureDeliveryMethod = deliveryMethod as "secure_workspace" | "secure_link" | "approved_secure_message" | "export";
    if (typeof body.purpose !== "string" || !body.purpose.trim() || typeof body.conditionOrWorkflowItem !== "string" || !body.conditionOrWorkflowItem.trim()) throw new Error("Report purpose and related condition/workflow item are required");
    const auth = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    const { data: patient, error: patientError } = await auth.supabase.from("patients").select("primary_provider_id, care_coordinator_member_id").eq("practice_id", practiceId).eq("id", patientId).single();
    if (patientError || !patient?.primary_provider_id) throw new Error(patientError?.message ?? "Primary Responsible Provider is required");
    assertClinicalWorkAccess({ assignedCoordinatorId: patient.care_coordinator_member_id, membershipId: auth.membership.id, role: auth.membership.role });
    const recipientProviderId = typeof body.recipientProviderId === "string" ? body.recipientProviderId : recipientType === "primary_responsible_provider" ? patient.primary_provider_id : null;
    const recipientMemberId = typeof body.recipientMemberId === "string" ? body.recipientMemberId : null;
    const workItemId = typeof body.workItemId === "string" ? body.workItemId : null;
    if (!recipientProviderId && !recipientMemberId) throw new Error("A secure recipient record is required");
    if (workItemId) {
      const { data: existing, error: existingError } = await auth.supabase
        .from("ccm_clinical_reports")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("patient_id", patientId)
        .eq("work_item_id", workItemId)
        .eq("recipient_type", recipientType)
        .eq("delivery_method", secureDeliveryMethod)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existing) return Response.json({ duplicate: true, report: existing });
    }
    const { data, error } = await auth.supabase.from("ccm_clinical_reports").insert({
      condition_or_workflow_item: body.conditionOrWorkflowItem.trim(),
      contains_phi: true,
      delivery_method: secureDeliveryMethod,
      delivery_status: "draft",
      patient_id: patientId,
      practice_id: practiceId,
      primary_provider_id: patient.primary_provider_id,
      purpose: body.purpose.trim(),
      recipient_member_id: recipientMemberId,
      recipient_provider_id: recipientProviderId,
      recipient_type: recipientType,
      work_item_id: workItemId,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return Response.json({ report: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return badRequest(error);
    return authErrorResponse(error);
  }
}
