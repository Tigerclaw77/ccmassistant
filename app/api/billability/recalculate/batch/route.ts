import { authErrorResponse, requirePracticeMembership } from "../../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../../lib/api/json";
import { recordAuditEvent } from "../../../../../lib/ccm/audit";
import { normalizeBillingMonth } from "../../../../../lib/ccm/month-context";
import { recalculateBillabilityForMutation } from "../route";

const activeBatches = new Set<string>();

async function runWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  async function consume() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let practiceId: string;
  let billingMonth: string;
  try {
    practiceId = requiredString(body, "practiceId");
    billingMonth = normalizeBillingMonth(requiredString(body, "billingMonth"));
  } catch (error) {
    return badRequest(error);
  }

  const batchKey = `${practiceId}:${billingMonth}`;
  if (activeBatches.has(batchKey)) {
    return Response.json({ error: "A recalculation for this practice-month is already running" }, { status: 409 });
  }

  try {
    const { supabase, user } = await requirePracticeMembership(request, practiceId);
    const { data: patients, error } = await supabase
      .from("patients")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("status", "active")
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);

    activeBatches.add(batchKey);
    const outcomes = await runWithConcurrency(patients ?? [], 6, async (patient) => {
      const response = await recalculateBillabilityForMutation(request, { billingMonth, patientId: patient.id, practiceId });
      const result = await response.json() as { error?: string };
      return { error: response.ok ? null : result.error ?? "Recalculation failed", patientId: patient.id, success: response.ok };
    });
    const failures = outcomes.filter((item) => !item.success);
    const result = {
      affectedPatients: outcomes.map((item) => item.patientId),
      failures,
      succeeded: outcomes.length - failures.length,
      total: outcomes.length,
    };
    await recordAuditEvent(supabase, {
      action: "monthly_billability.batch_recalculated",
      actorUserId: user.id,
      afterData: result,
      entityType: "monthly_billability_batch",
      metadata: { billingMonth },
      practiceId,
    });
    return Response.json(result, { status: failures.length ? 207 : 200 });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") return Response.json({ error: error.message }, { status: 500 });
    return authErrorResponse(error);
  } finally {
    activeBatches.delete(batchKey);
  }
}
