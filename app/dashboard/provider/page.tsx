"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../lib/ccm/month-context";
import { STAFF_QUEUE_LABELS } from "../../../lib/ccm/staff-experience";
import type { WorklistRow } from "../../../lib/ccm/worklist";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import { CheckCircle2 } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";

type ActivePracticeResponse = {
  error?: string;
  practice?: { id: string; name: string };
};

type WorklistResponse = {
  error?: string;
  rows?: WorklistRow[];
};

function attentionType(row: WorklistRow): string {
  if (row.priority === "urgent") return "Clinical alert";
  if (row.reasonCodes.includes("missing_provider_attestation")) return "Eligibility approval";
  if (row.reasonCodes.includes("incomplete_care_plan")) return "Care-plan review";
  if (row.reasonCodes.includes("provider_manual_review_required")) return "Practitioner review";
  return "Provider attention";
}

export default function ProviderDashboardPage() {
  const [billingMonth, setBillingMonth] = useState(currentMonthValue());
  const [practiceName, setPracticeName] = useState("");
  const [rows, setRows] = useState<WorklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const storedPracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(storedPracticeId ? { "x-active-practice-id": storedPracticeId } : {}),
        },
      });
      const activeResult = (await activeResponse.json()) as ActivePracticeResponse;
      if (!active || !activeResponse.ok || !activeResult.practice) {
        if (active) {
          setError(activeResult.error ?? "No active practice found");
          setLoading(false);
        }
        return;
      }
      localStorage.setItem("activePracticeId", activeResult.practice.id);
      setPracticeName(activeResult.practice.name);
      const query = new URLSearchParams({
        month: normalizeBillingMonth(billingMonth),
        page: "1",
        pageSize: "100",
        practiceId: activeResult.practice.id,
      });
      const response = await fetch(`/api/worklist?${query}`, { headers: await getSupabaseAuthHeaders() });
      const result = (await response.json()) as WorklistResponse;
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load provider attention queue");
      setRows((result.rows ?? []).filter((row) => row.queueKeys.includes("provider_review")));
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [billingMonth]);

  const grouped = useMemo(() => ({
    alerts: rows.filter((row) => row.priority === "urgent"),
    approvals: rows.filter((row) => row.priority !== "urgent" && row.reasonCodes.includes("missing_provider_attestation")),
    carePlans: rows.filter((row) => row.priority !== "urgent" && row.reasonCodes.includes("incomplete_care_plan")),
    other: rows.filter((row) => row.priority !== "urgent" && !row.reasonCodes.includes("missing_provider_attestation") && !row.reasonCodes.includes("incomplete_care_plan")),
  }), [rows]);

  const context = useMemo(() => ({ month: normalizeBillingMonth(billingMonth), source: "worklist" as const }), [billingMonth]);

  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Provider workspace</p>
          <h1 className="page-title mt-1">Items requiring attention</h1>
          <p className="page-description">{practiceName || "Practice"} - clinical alerts first, then approvals and care-plan reviews.</p>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Billing month</span>
          <input className="block border px-3 py-2" onChange={(event) => setBillingMonth(event.target.value)} type="month" value={billingMonth.slice(0, 7)} />
        </label>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProviderStat label="Clinical alerts" tone="alert" value={grouped.alerts.length} />
        <ProviderStat label="Eligibility approvals" value={grouped.approvals.length} />
        <ProviderStat label="Care-plan reviews" value={grouped.carePlans.length} />
        <ProviderStat label="Other reviews" value={grouped.other.length} />
      </section>

      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? <LoadingState label="Loading provider review queue" /> : rows.length === 0 ? (
        <EmptyState description="There are no clinical alerts, eligibility approvals, or care-plan reviews waiting for this month." icon={CheckCircle2} title="Provider review is up to date" />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-600">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Attention</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Action</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className={`border-b last:border-0 ${row.priority === "urgent" ? "bg-red-50" : ""}`} key={row.patientId}>
                  <td className="px-4 py-3"><Link className="font-medium underline" href={withCoordinatorContext(`/patients/${row.patientId}`, context)}>{row.patientName}</Link><div className="text-xs text-slate-600">{row.practitioner ?? "No practitioner assigned"}</div></td>
                  <td className="px-4 py-3"><span className="border bg-white px-2 py-1 text-xs font-medium">{attentionType(row)}</span></td>
                  <td className="px-4 py-3 text-slate-700">{row.nextAction}<div className="mt-1 text-xs text-slate-500">{row.queueKeys.map((key) => STAFF_QUEUE_LABELS[key]).join("; ")}</div></td>
                  <td className="px-4 py-3"><Link className="font-medium underline" href={withCoordinatorContext(row.nextActionUrl, context)}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function ProviderStat({ label, tone = "normal", value }: { label: string; tone?: "alert" | "normal"; value: number }) {
  return <div className={`border p-4 ${tone === "alert" && value ? "border-red-200 bg-red-50" : "bg-white"}`}><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-sm text-slate-600">{label}</div></div>;
}
