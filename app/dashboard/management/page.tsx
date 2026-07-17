"use client";

import { useEffect, useState } from "react";
import { currentMonthValue, normalizeBillingMonth } from "../../../lib/ccm/month-context";
import { reasonLabel, statusLabel } from "../../../lib/ccm/labels";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import { AlertTriangle, ArrowRight, CheckCircle2, Printer } from "lucide-react";
import Link from "next/link";
import LoadingState from "../../../components/ui/LoadingState";

type CountItem = { label: string; count: number };
type ManagementResponse = {
  billing?: { billed: number; hold: number; notReady: number; ready: number; totalMinutes: number };
  bottlenecks?: CountItem[];
  coordinatorWorkload?: CountItem[];
  customQuestionUsage?: CountItem[];
  error?: string;
  mostUsedDiagnoses?: CountItem[];
  mostUsedQuestionBanks?: CountItem[];
  patientsAtRisk?: number;
  providerWorkload?: CountItem[];
  questionUsage?: CountItem[];
  summary?: { activePatients: number; checkInCompletionRate: number; eligibleNotEnrolled: number; enrolledThisMonth: number; totalPatients: number };
};

type ActivePracticeResponse = { error?: string; practice?: { id: string; name: string } };

export default function ManagementDashboardPage() {
  const [billingMonth, setBillingMonth] = useState(currentMonthValue());
  const [practiceName, setPracticeName] = useState("");
  const [data, setData] = useState<ManagementResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const storedPracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: { ...(await getSupabaseAuthHeaders()), ...(storedPracticeId ? { "x-active-practice-id": storedPracticeId } : {}) },
      });
      const activeResult = (await activeResponse.json()) as ActivePracticeResponse;
      if (!active || !activeResponse.ok || !activeResult.practice) {
        if (active) { setError(activeResult.error ?? "No active practice found"); setLoading(false); }
        return;
      }
      localStorage.setItem("activePracticeId", activeResult.practice.id);
      setPracticeName(activeResult.practice.name);
      const query = new URLSearchParams({ month: normalizeBillingMonth(billingMonth), practiceId: activeResult.practice.id });
      const response = await fetch(`/api/management/summary?${query}`, { headers: await getSupabaseAuthHeaders() });
      const result = (await response.json()) as ManagementResponse;
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load management dashboard");
      else setData(result);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [billingMonth]);

  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Management workspace</p>
          <h1 className="page-title mt-1">Practice operations</h1>
          <p className="page-description">{practiceName || "Practice"} - see what needs attention now, then review workload and monthly flow.</p>
        </div>
        <div className="flex items-end gap-2 print:hidden">
          <label className="space-y-1 text-sm"><span className="font-medium">Reporting month</span><input className="block border px-3 py-2" onChange={(event) => setBillingMonth(event.target.value)} type="month" value={billingMonth.slice(0, 7)} /></label>
          <button className="button-secondary" onClick={() => window.print()} type="button"><Printer aria-hidden="true" size={16} /> Print report</button>
        </div>
      </div>

      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? <LoadingState label="Loading practice operations" /> : (
        <>
          <section className={`surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${data.patientsAtRisk ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="flex items-start gap-3">
              {data.patientsAtRisk ? <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" size={21} /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={21} />}
              <div><h2 className="font-semibold text-slate-950">{data.patientsAtRisk ? `${data.patientsAtRisk} patients need attention` : "No elevated patient risk in this view"}</h2><p className="mt-1 text-sm text-slate-600">{data.patientsAtRisk ? "Open the worklist to review urgent, overdue, and blocked patient work." : "Continue with enrollment, workload, and billing-flow review below."}</p></div>
            </div>
            <Link className="button-secondary shrink-0" href="/dashboard/worklist">Open worklist <ArrowRight aria-hidden="true" size={16} /></Link>
          </section>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Active CCM patients" value={data.summary?.activePatients ?? 0} />
            <Metric label="Eligible, not enrolled" value={data.summary?.eligibleNotEnrolled ?? 0} />
            <Metric label="Enrolled this month" value={data.summary?.enrolledThisMonth ?? 0} />
            <Metric label="Check-in completion" suffix="%" value={data.summary?.checkInCompletionRate ?? 0} />
            <Metric label="Patients at risk" tone="warning" value={data.patientsAtRisk ?? 0} />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Panel title="Coordinator workload"><RankedList empty="No active assignments." items={data.coordinatorWorkload ?? []} /></Panel>
            <Panel title="Provider workload"><RankedList empty="No active assignments." items={data.providerWorkload ?? []} /></Panel>
          </section>

          <section className="border-y bg-white py-5">
            <h2 className="font-semibold">Monthly billing flow</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Ready" value={data.billing?.ready ?? 0} />
              <Metric label="Billed" value={data.billing?.billed ?? 0} />
              <Metric label="Not ready" value={data.billing?.notReady ?? 0} />
              <Metric label="On hold" value={data.billing?.hold ?? 0} />
              <Metric label="Documented minutes" value={data.billing?.totalMinutes ?? 0} />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <Panel title="Documentation bottlenecks"><RankedList empty="No current bottlenecks." items={(data.bottlenecks ?? []).map((item) => ({ ...item, label: reasonLabel(item.label) }))} /></Panel>
            <Panel title="Most-used diagnoses"><RankedList empty="No active diagnoses." items={data.mostUsedDiagnoses ?? []} /></Panel>
            <Panel title="Most-used question banks"><RankedList empty="No session usage this month." items={data.mostUsedQuestionBanks ?? []} /></Panel>
            <Panel title="Most-used questions"><RankedList empty="No completed question usage this month." items={data.questionUsage ?? []} /></Panel>
            <Panel title="Custom question usage"><RankedList empty="No custom question usage this month." items={data.customQuestionUsage ?? []} /></Panel>
            <Panel title="Report scope"><div className="space-y-2 text-sm text-slate-700"><p>Operational counts use the selected practice and month.</p><p>Billing totals show workflow status and documented minutes, not charges, claims, or payments.</p><p>Question usage counts completed session questions only.</p></div></Panel>
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, suffix = "", tone = "normal", value }: { label: string; suffix?: string; tone?: "normal" | "warning"; value: number }) {
  return <div className={`surface p-4 ${tone === "warning" && value ? "border-amber-300 bg-amber-50" : ""}`}><div className="text-2xl font-semibold text-slate-950">{value}{suffix}</div><div className="mt-1 text-sm text-slate-600">{label}</div></div>;
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="surface p-4"><h2 className="mb-3 font-semibold text-slate-950">{title}</h2>{children}</section>;
}

function RankedList({ empty, items }: { empty: string; items: CountItem[] }) {
  if (!items.length) return <p className="text-sm text-slate-600">{empty}</p>;
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return <ol className="space-y-3">{items.map((item) => <li className="text-sm" key={item.label}><div className="flex justify-between gap-3"><span className="truncate" title={item.label}>{statusLabel(item.label)}</span><span className="font-semibold">{item.count}</span></div><div className="mt-1 h-1.5 bg-slate-100"><div className="h-full bg-teal-600" style={{ width: `${Math.max(4, (item.count / maximum) * 100)}%` }} /></div></li>)}</ol>;
}
