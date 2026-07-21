"use client";

import { useEffect, useState } from "react";
import LoadingState from "../../../components/ui/LoadingState";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

type AuditRow = { created_at: string; event_type?: string; rule_identifier?: string; rule_version?: string; trigger_summary?: string; disposition?: string; delivery_status?: string };
type WorkflowResponse = { dispositions?: AuditRow[]; error?: string; events?: AuditRow[]; opportunities?: AuditRow[]; reports?: AuditRow[] };

export default function ComplianceWorkflowPage() {
  const [data, setData] = useState<WorkflowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const storedPracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", { headers: { ...(await getSupabaseAuthHeaders()), ...(storedPracticeId ? { "x-active-practice-id": storedPracticeId } : {}) } });
      const activeResult = await activeResponse.json() as { error?: string; practice?: { id: string } };
      if (!activeResponse.ok || !activeResult.practice) throw new Error(activeResult.error ?? "No active practice found");
      const response = await fetch(`/api/compliance/workflow?practiceId=${encodeURIComponent(activeResult.practice.id)}`, { headers: await getSupabaseAuthHeaders() });
      const result = await response.json() as WorkflowResponse;
      if (!response.ok) throw new Error(result.error ?? "Unable to load compliance workflow");
      if (active) setData(result);
    })().catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load compliance workflow"); });
    return () => { active = false; };
  }, []);

  if (!data && !error) return <main className="page-shell"><LoadingState label="Loading compliance workflow" /></main>;
  const rows = [...(data?.events ?? []), ...(data?.opportunities ?? []), ...(data?.dispositions ?? [])].sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 100);
  return (
    <main className="page-shell">
      <div><p className="eyebrow">Compliance administrator</p><h1 className="page-title mt-1">Workflow audit</h1><p className="page-description">Read-only review of clinical rule versions, suggested care decisions, time attestations, routing, and immutable work history.</p></div>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4"><div className="text-2xl font-semibold">{data?.opportunities?.length ?? 0}</div><div className="text-sm text-slate-600">Suggested care activities generated</div></div>
        <div className="surface p-4"><div className="text-2xl font-semibold">{data?.dispositions?.length ?? 0}</div><div className="text-sm text-slate-600">Recorded dispositions</div></div>
        <div className="surface p-4"><div className="text-2xl font-semibold">{data?.reports?.length ?? 0}</div><div className="text-sm text-slate-600">Secure routing records</div></div>
      </section>
      <section className="surface overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Recorded</th><th className="p-3">Event</th><th className="p-3">Rule / decision</th></tr></thead><tbody>{rows.map((row, index) => <tr className="border-b" key={`${row.created_at}-${index}`}><td className="p-3">{new Date(row.created_at).toLocaleString()}</td><td className="p-3">{row.event_type ?? (row.rule_identifier ? "Suggested care activity generated" : "Suggested care decision")}{row.trigger_summary ? <div className="mt-1 text-xs text-slate-500">{row.trigger_summary}</div> : null}</td><td className="p-3 font-mono text-xs">{row.rule_identifier ? `${row.rule_identifier} · ${row.rule_version}` : row.disposition ?? row.delivery_status ?? "Recorded"}</td></tr>)}</tbody></table></section>
    </main>
  );
}
