"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import type { CcmOpportunity, CcmOpportunityDisposition, CcmWorkItem } from "../../lib/ccm/types";
import WorkItemWorkspace from "./WorkItemWorkspace";

type OpportunityRow = CcmOpportunity & { stale: boolean };
type ResponseBody = {
  assignments?: Array<{ id: string; label: string }>;
  dispositions?: CcmOpportunityDisposition[];
  error?: string;
  opportunities?: OpportunityRow[];
  result?: { work_item_id?: string | null };
  workItems?: CcmWorkItem[];
};

export default function OpportunityReviewPanel({
  currentCcmMinutes,
  daysRemaining,
  patientId,
  practiceId,
  practiceTimeZone,
}: {
  currentCcmMinutes: number;
  daysRemaining: number | null;
  patientId: string;
  practiceId: string;
  practiceTimeZone: string;
}) {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [dispositions, setDispositions] = useState<CcmOpportunityDisposition[]>([]);
  const [workItems, setWorkItems] = useState<CcmWorkItem[]>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; label: string }>>([]);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [workingWorkId, setWorkingWorkId] = useState<string | null>(null);
  const [manualPriority, setManualPriority] = useState("normal");
  const [priorityReason, setPriorityReason] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [disposition, setDisposition] = useState("accepted");
  const [note, setNote] = useState("");
  const [timeChoice, setTimeChoice] = useState("none");
  const [customMinutes, setCustomMinutes] = useState("");
  const [affirmed, setAffirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const query = new URLSearchParams({ patientId, practiceId });
    const response = await fetch(`/api/opportunities?${query}`, { headers: await getSupabaseAuthHeaders(), signal });
    const result = await response.json() as ResponseBody;
    if (!response.ok) throw new Error(result.error ?? "Unable to load suggested care activities");
    setOpportunities(result.opportunities ?? []);
    setDispositions(result.dispositions ?? []);
    setWorkItems(result.workItems ?? []);
    setAssignments(result.assignments ?? []);
  }, [patientId, practiceId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((caught) => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load suggested care activities");
    });
    return () => controller.abort();
  }, [load]);

  const disposedIds = new Set(dispositions.map((item) => item.opportunity_id));
  const active = opportunities.filter((item) => !item.stale && !disposedIds.has(item.id));

  async function refresh() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/opportunities", {
        body: JSON.stringify({ patientId, practiceId }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "POST",
      });
      const result = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(result.error ?? "Unable to refresh suggested care activities");
      await load();
      setMessage("Patient evidence reviewed with the current deterministic rule set.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to refresh suggested care activities");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    const reviewMinutes = timeChoice === "none" ? null : timeChoice === "custom" ? Number(customMinutes) : Number(timeChoice);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/opportunities/${selectedId}/disposition`, {
        body: JSON.stringify({ disposition, note, practiceId, reviewMinutes, timeAffirmed: affirmed }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "POST",
      });
      const result = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(result.error ?? "Unable to record the decision");
      setSelectedId(null);
      setNote("");
      setTimeChoice("none");
      setCustomMinutes("");
      setAffirmed(false);
      await load();
      if (result.result?.work_item_id) setWorkingWorkId(result.result.work_item_id);
      setMessage(["accepted", "different_action", "provider_review"].includes(disposition)
        ? "Decision saved. Continue in the task workspace below."
        : "Decision saved. No work was represented as completed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record the decision");
    } finally {
      setBusy(false);
    }
  }

  async function beginWorkItem(item: CcmWorkItem) {
    setBusy(true);
    setError(null);
    try {
      if (item.status !== "in_progress") {
        const response = await fetch(`/api/work-items/${item.id}`, {
          body: JSON.stringify({ practiceId, status: "in_progress" }),
          headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
          method: "PATCH",
        });
        const result = await response.json() as ResponseBody;
        if (!response.ok) throw new Error(result.error ?? "Unable to start this work item");
        await load();
      }
      setWorkingWorkId(item.id);
      setEditingWorkId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start this work item");
    } finally {
      setBusy(false);
    }
  }

  async function updateWorkItem(event: FormEvent) {
    event.preventDefault();
    if (!editingWorkId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/work-items/${editingWorkId}`, {
        body: JSON.stringify({ assignedMemberId: assignedMemberId || null, manualPriority, manualPriorityReason: priorityReason, practiceId }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "PATCH",
      });
      const result = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(result.error ?? "Unable to update work item");
      setEditingWorkId(null);
      setPriorityReason("");
      await load();
      setMessage("Work item assignment and priority were updated with an audit reason.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update work item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md border bg-white p-5 text-black shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Review → Decide → Perform → Document</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Suggested care activities</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">Suggestions come only from patient-specific facts. They are not completed work and never add time automatically.</p>
        </div>
        <button className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-60" disabled={busy} onClick={refresh} type="button">
          {busy ? "Reviewing…" : "Review current evidence"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 rounded-md border bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current CCM time</div><div className="mt-1 text-lg font-semibold text-slate-950">{currentCcmMinutes} minutes</div></div>
        <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Days remaining</div><div className="mt-1 text-lg font-semibold text-slate-950">{daysRemaining ?? "Not current month"}</div></div>
        <p className="text-xs leading-5 text-slate-600 sm:col-span-2">Before this month&apos;s care cycle concludes, consider whether any additional clinically appropriate services would benefit this patient. Time is operational context, never the reason for a suggestion.</p>
      </div>

      {message ? <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div> : null}
      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="mt-4 grid gap-3">
        {active.length === 0 ? (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-700">
            No additional clinically appropriate activity is supported by the available patient evidence.
          </div>
        ) : active.map((item) => (
          <article className="rounded-md border p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{item.condition_or_workflow_item}</h3>
                <p className="mt-1 text-sm text-slate-800">{item.suggested_activity}</p>
                <p className="mt-2 text-xs text-slate-700"><span className="font-semibold">Why am I seeing this?</span> {item.trigger_summary}</p>
                <p className="mt-1 text-xs text-slate-600"><span className="font-semibold">Clinical rationale:</span> {item.benefit_rationale}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">Rule {item.rule_identifier} · Catalog {item.rule_version} · Expires {new Date(item.expires_at).toLocaleDateString()}</p>
              </div>
              <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => setSelectedId(item.id)} type="button">Review suggested next step</button>
            </div>
          </article>
        ))}
      </div>

      {selectedId ? (
        <form className="mt-5 space-y-4 border-t pt-5" onSubmit={submit}>
          <h3 className="font-semibold text-slate-950">Record your decision</h3>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Disposition</span>
            <select className="w-full rounded-md border px-3 py-2" onChange={(event) => setDisposition(event.target.value)} value={disposition}>
              <option value="accepted">Accept suggested activity</option>
              <option value="different_action">Take a different action</option>
              <option value="provider_review">Route for provider review</option>
              <option value="deferred">Defer</option>
              <option value="no_intervention">No intervention appropriate</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Decision note {disposition === "no_intervention" ? "(required)" : "(optional)"}</span>
            <textarea className="min-h-20 w-full rounded-md border px-3 py-2" onChange={(event) => setNote(event.target.value)} value={note} />
          </label>
          <fieldset className="space-y-2 text-sm">
            <legend className="font-medium">Actual review time</legend>
            <div className="flex flex-wrap gap-3">
              {[['none', 'No time'], ['1', '1 minute'], ['2', '2 minutes'], ['custom', 'Custom']].map(([value, label]) => (
                <label className="flex items-center gap-1.5" key={value}><input checked={timeChoice === value} name="review-time" onChange={() => setTimeChoice(value)} type="radio" /> {label}</label>
              ))}
            </div>
            {timeChoice === "custom" ? <input aria-label="Custom actual review minutes" className="w-36 rounded-md border px-3 py-2" min="1" onChange={(event) => setCustomMinutes(event.target.value)} step="1" type="number" value={customMinutes} /> : null}
          </fieldset>
          {timeChoice !== "none" ? (
            <label className="flex items-start gap-2 text-sm"><input checked={affirmed} onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" /><span>I affirm this is the actual time I personally spent reviewing this item.</span></label>
          ) : null}
          <div className="flex gap-2">
            <button className="button-primary" disabled={busy || (timeChoice !== "none" && !affirmed)} type="submit">Save decision</button>
            <button className="rounded-md border px-3 py-2 text-sm font-semibold" onClick={() => setSelectedId(null)} type="button">Cancel</button>
          </div>
        </form>
      ) : null}

      {workItems.length ? (
        <div className="mt-6 border-t pt-5">
          <h3 className="font-semibold text-slate-950">Patient work items</h3>
          <div className="mt-3 space-y-2">
            {workItems.map((item) => <article className="rounded-md border p-3 text-sm" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{item.title}</div><div className="mt-1 text-slate-600">{item.reason}</div><div className="mt-1 text-xs text-slate-500">{item.queue_group.replaceAll("_", " ")} · {item.priority} priority · {item.status.replaceAll("_", " ")}</div></div><div className="flex flex-wrap gap-3">{!["completed", "cancelled"].includes(item.status) ? <button className="font-semibold text-teal-800 underline" disabled={busy} onClick={() => void beginWorkItem(item)} type="button">{item.status === "in_progress" ? "Continue work" : "Start work"}</button> : null}<button className="font-semibold underline" onClick={() => { setEditingWorkId(item.id); setWorkingWorkId(null); setManualPriority(item.manual_priority ?? (item.priority === "none" ? "normal" : item.priority)); setPriorityReason(item.manual_priority_reason ?? ""); setAssignedMemberId(item.assigned_member_id ?? ""); }} type="button">Reassign or reprioritize</button></div></div>
              {workingWorkId === item.id ? <WorkItemWorkspace item={item} onCancel={() => setWorkingWorkId(null)} patientId={patientId} practiceId={practiceId} practiceTimeZone={practiceTimeZone} /> : null}
              {editingWorkId === item.id ? <form className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2" onSubmit={updateWorkItem}>
                <label className="space-y-1"><span className="font-medium">Assignee</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => setAssignedMemberId(event.target.value)} value={assignedMemberId}><option value="">Unassigned</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.label}</option>)}</select></label>
                <label className="space-y-1"><span className="font-medium">Manual priority</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => setManualPriority(event.target.value)} value={manualPriority}><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
                <label className="space-y-1 sm:col-span-2"><span className="font-medium">Reason (required)</span><input className="w-full rounded-md border px-3 py-2" onChange={(event) => setPriorityReason(event.target.value)} value={priorityReason} /></label>
                <div className="flex gap-2 sm:col-span-2"><button className="button-primary" disabled={busy || priorityReason.trim().length < 3} type="submit">Save work item</button><button className="rounded-md border px-3 py-2 font-semibold" onClick={() => setEditingWorkId(null)} type="button">Cancel</button></div>
              </form> : null}
            </article>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
