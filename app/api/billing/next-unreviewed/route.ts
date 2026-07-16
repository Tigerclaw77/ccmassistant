import { authErrorResponse, BILLING_WRITE_ROLES, requirePracticeMembership } from "../../../../lib/auth";
import { badRequest } from "../../../../lib/api/json";
import { normalizeBillingMonth } from "../../../../lib/ccm/month-context";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const currentPatientId = searchParams.get("patientId");
  const assignment = searchParams.get("assignment")?.trim() ?? "all";
  const search = searchParams.get("search")?.trim() ?? "";
  if (!practiceId) return badRequest(new Error("practiceId is required"));
  let billingMonth: string;
  try {
    billingMonth = normalizeBillingMonth(searchParams.get("month"));
  } catch (error) {
    return badRequest(error);
  }
  try {
    const { supabase } = await requirePracticeMembership(request, practiceId, BILLING_WRITE_ROLES);
    const pageSize = 200;
    for (let offset = 0; ; offset += pageSize) {
      let patientQuery = supabase
        .from("patients")
        .select("id")
        .eq("practice_id", practiceId)
        .order("display_name", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (assignment === "unassigned") patientQuery = patientQuery.is("care_coordinator_member_id", null);
      else if (assignment !== "all") patientQuery = patientQuery.eq("care_coordinator_member_id", assignment);

      if (search) {
        const normalized = search.replace(/[%(),]/g, "");
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) patientQuery = patientQuery.eq("dob", normalized);
        else patientQuery = patientQuery.or(`display_name.ilike.%${normalized}%,external_id.ilike.%${normalized}%,phone.ilike.%${normalized}%`);
      }

      const { data: patients, error: patientError } = await patientQuery;
      if (patientError) throw new Error(patientError.message);
      if (!patients?.length) return Response.json({ patientId: null });

      let billabilityQuery = supabase
        .from("monthly_billability")
        .select("patient_id")
        .eq("practice_id", practiceId)
        .eq("billing_month", billingMonth)
        .eq("status", "ready_to_bill")
        .is("reviewed_at", null)
        .in("patient_id", patients.map((patient) => patient.id));
      if (currentPatientId) billabilityQuery = billabilityQuery.neq("patient_id", currentPatientId);
      const { data: billabilityRows, error: billabilityError } = await billabilityQuery;
      if (billabilityError) throw new Error(billabilityError.message);

      const readyIds = new Set((billabilityRows ?? []).map((row) => row.patient_id));
      const nextPatient = patients.find((patient) => readyIds.has(patient.id));
      if (nextPatient) return Response.json({ patientId: nextPatient.id });
      if (patients.length < pageSize) return Response.json({ patientId: null });
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
