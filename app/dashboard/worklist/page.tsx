"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../lib/ccm/month-context";
import type { WorklistRow } from "../../../lib/ccm/worklist";
import { statusLabel } from "../../../lib/ccm/labels";
import { STAFF_QUEUE_LABELS } from "../../../lib/ccm/staff-experience";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import { Search, SearchX, UsersRound } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";
import { CARE_PLAN_REVIEW_LABELS } from "../../../lib/ccm/care-plan-workflow";
import { WORK_QUEUE_GROUPS, type WorkQueueGroup } from "../../../lib/ccm/opportunity-detector";

type ActivePracticeResponse = { error?: string; practice?: { id: string; name: string } };
type WorklistResponse = {
  canClaimUnassigned?: boolean;
  daysRemaining?: number | null;
  assignments?: Array<{ id: string; label: string }>;
  error?: string;
  monthlyThreshold?: number;
  page?: number;
  pageSize?: number;
  providers?: Array<{ id: string; label: string }>;
  rows?: WorklistRow[];
  total?: number;
};

const PAGE_SIZE = 25;
const GROUP_LABELS: Record<WorkQueueGroup, string> = {
  needs_attention: "Needs Attention",
  ready_to_contact: "Ready to Contact",
  awaiting_patient: "Awaiting Patient",
  awaiting_provider: "Awaiting Provider",
  documentation_needed: "Documentation Needed",
  completed_today: "Completed Today",
};

function statusClass(value: string): string {
  if (value === "ready_to_bill" || value === "billed") return "border-green-200 bg-green-50 text-green-800";
  if (value === "hold" || value === "ineligible") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function WorklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState("");
  const [rows, setRows] = useState<WorklistRow[]>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; label: string }>>([]);
  const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthlyThreshold, setMonthlyThreshold] = useState(20);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [canClaimUnassigned, setCanClaimUnassigned] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [claimingPatientId, setClaimingPatientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");

  const month = searchParams.get("month") ?? currentMonthValue();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const search = searchParams.get("search") ?? "";
  const assignment = searchParams.get("assignment") ?? "";
  const readiness = searchParams.get("readiness") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const group = (searchParams.get("group") ?? "") as WorkQueueGroup | "";
  const completedPatient = searchParams.get("completedPatient") ?? "";
  const workTransition = searchParams.get("workTransition") ?? "";
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setFilters = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/dashboard/worklist?${next.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    let active = true;
    async function loadPractice() {
      const storedPracticeId = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(storedPracticeId ? { "x-active-practice-id": storedPracticeId } : {}),
        },
      });
      const result = (await response.json()) as ActivePracticeResponse;
      if (!active) return;
      if (!response.ok || !result.practice) {
        setError(result.error ?? "No active practice found");
        setLoading(false);
        return;
      }
      localStorage.setItem("activePracticeId", result.practice.id);
      setPracticeId(result.practice.id);
      setPracticeName(result.practice.name);
    }
    void loadPractice();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!practiceId) return;
    const activePracticeId = practiceId;
    let active = true;
    async function loadRows() {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        month,
        page: String(page),
        pageSize: String(PAGE_SIZE),
        practiceId: activePracticeId,
      });
      if (search) query.set("search", search);
      if (assignment) query.set("assignment", assignment);
      if (provider) query.set("provider", provider);
      if (readiness) query.set("readiness", readiness);
      const response = await fetch(`/api/worklist?${query}`, { headers: await getSupabaseAuthHeaders() });
      const result = (await response.json()) as WorklistResponse;
      if (!active) return;
      if (!response.ok) {
        setError(result.error ?? "Unable to load worklist");
        setRows([]);
        setTotal(0);
      } else {
        setRows(result.rows ?? []);
        setAssignments(result.assignments ?? []);
        setProviders(result.providers ?? []);
        setMonthlyThreshold(result.monthlyThreshold ?? 20);
        setDaysRemaining(result.daysRemaining ?? null);
        setCanClaimUnassigned(result.canClaimUnassigned === true);
        setTotal(result.total ?? 0);
      }
      setLoading(false);
    }
    void loadRows();
    return () => { active = false; };
  }, [assignment, month, page, practiceId, provider, readiness, refreshVersion, search]);

  const context = useMemo(() => ({ assignment, month: normalizeBillingMonth(month), page, provider, readiness, search, source: "worklist" as const }), [assignment, month, page, provider, readiness, search]);
  const groupCounts = useMemo(() => Object.fromEntries(
    WORK_QUEUE_GROUPS.map((key) => [key, rows.filter((row) => row.queueGroup === key).length]),
  ) as Record<WorkQueueGroup, number>, [rows]);
  const visibleRows = useMemo(() => {
    const filtered = group ? rows.filter((row) => row.queueGroup === group) : rows;
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
    return [...filtered].sort((left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority] ||
      left.patientName.localeCompare(right.patientName),
    );
  }, [group, rows]);
  const nextPatientRow = visibleRows.find((row) => row.patientId !== completedPatient) ?? visibleRows[0];

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setFilters({ page: null, search: searchDraft.trim() || null });
  }

  async function claimPatient(patientId: string) {
    if (!practiceId) return;
    setClaimingPatientId(patientId);
    setError(null);
    try {
      const response = await fetch("/api/patients/claim", {
        body: JSON.stringify({ patientId, practiceId }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "POST",
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to claim this patient");
      setRefreshVersion((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to claim this patient");
    } finally {
      setClaimingPatientId(null);
    }
  }

  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Coordinator workspace</p>
          <h1 className="page-title mt-1">My Work Today</h1>
          <div className="page-description">{practiceName || "Practice"} — one evidence-backed next action at a time.</div>
        </div>
        <div className="flex items-end gap-3">
          {nextPatientRow ? <Link className="button-primary" href={withCoordinatorContext(nextPatientRow.nextActionUrl, context)}>Next patient</Link> : null}
          <label className="space-y-1 text-sm">
            <span className="font-medium">Monthly context</span>
            <input className="block rounded-md border px-3 py-2" type="month" value={month} onChange={(event) => setFilters({ month: event.target.value, page: null })} />
          </label>
        </div>
      </div>

      {workTransition ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">
          <span>{workTransition === "complete" ? "Task completed and outcome documented." : workTransition === "route_provider" ? "Task routed securely to the Primary Responsible Provider." : "Task deferred with a documented follow-up date."} You are back in My Work Today.</span>
          <div className="flex gap-3">{nextPatientRow ? <Link className="font-semibold underline" href={withCoordinatorContext(nextPatientRow.nextActionUrl, context)}>Open next patient</Link> : null}<button className="font-semibold underline" onClick={() => setFilters({ completedPatient: null, completedWorkItem: null, workTransition: null })} type="button">Dismiss</button></div>
        </div>
      ) : null}

      <section aria-label="Today's work" className="border-y bg-white py-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-950">Today&apos;s work</h2>
            <p className="text-xs text-slate-600">Counts reflect the {rows.length} patients loaded on this page.</p>
          </div>
          {group ? (
            <button className="text-sm font-medium underline" onClick={() => setFilters({ group: null })} type="button">
              Clear focus
            </button>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {WORK_QUEUE_GROUPS.map((key) => (
            <button
              aria-pressed={group === key}
              className={`min-h-20 border p-3 text-left ${group === key ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50"}`}
              key={key}
              onClick={() => setFilters({ group: group === key ? null : key, page: null })}
              type="button"
            >
              <span className="block text-xl font-semibold">{groupCounts[key]}</span>
              <span className={`mt-1 block text-xs ${group === key ? "text-slate-200" : "text-slate-600"}`}>{GROUP_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </section>

      <form className="grid gap-3 border-y bg-white py-4 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_10rem_auto]" onSubmit={submitSearch}>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Find patient</span>
          <input className="w-full rounded-md border px-3 py-2" onChange={(event) => setSearchDraft(event.target.value)} placeholder="Name, DOB, external ID, or phone" value={searchDraft} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Provider scope</span>
          <select className="w-full rounded-md border px-3 py-2" onChange={(event) => setFilters({ page: null, provider: event.target.value || null })} value={provider}>
            <option value="">All providers</option>
            {providers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Scope</span>
          <select className="w-full rounded-md border px-3 py-2" onChange={(event) => setFilters({ assignment: event.target.value || null, page: null })} value={assignment}>
            <option value="">Practice scope</option>
            <option value="unassigned">Unassigned</option>
            {assignments.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Readiness</span>
          <select className="w-full rounded-md border px-3 py-2" onChange={(event) => setFilters({ page: null, readiness: event.target.value || null })} value={readiness}>
            <option value="">All statuses</option>
            <option value="not_ready">Not ready</option>
            <option value="ready_to_bill">Ready to bill</option>
            <option value="hold">Hold</option>
            <option value="billed">Billed</option>
          </select>
        </label>
        <button className="button-primary self-end" type="submit"><Search aria-hidden="true" size={16} /> Search</button>
      </form>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? <LoadingState label="Loading coordinator worklist" /> : visibleRows.length === 0 ? (
        search || assignment || provider || readiness || group ? (
          <EmptyState description="Adjust or clear the current filters to return to the full patient worklist." icon={SearchX} title="No patients match this view" />
        ) : (
          <EmptyState actionHref="/patients/new" actionLabel="Add first patient" description="Add a patient and complete enrollment before monthly CCM work appears here." icon={UsersRound} title="Your worklist is ready for its first patient" />
        )
      ) : (
        <div className="surface overflow-x-auto text-black">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Monthly context</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Next required action</th><th className="px-4 py-3">Owner</th></tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr className={`border-b last:border-b-0 ${row.priority === "urgent" ? "bg-red-50" : ""}`} key={row.patientId}>
                  <td className="px-4 py-3 align-top">
                    <Link className="font-medium underline" href={withCoordinatorContext(`/patients/${row.patientId}`, context)}>{row.patientName}</Link>
                    <div className="text-xs text-gray-500">{row.dob ?? "DOB missing"}{row.externalId ? ` - ${row.externalId}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{row.documentedMinutes} min documented</div>
                    <div className="mt-1 text-xs text-slate-600">{daysRemaining === null ? "Historical month" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}</div>
                    <div className="mt-1 text-[11px] text-slate-500">Operational threshold: {monthlyThreshold} min</div>
                  </td>
                  <td className="px-4 py-3 align-top"><span className={`inline-flex rounded-md border px-2 py-1 text-xs ${statusClass(row.readinessStatus)}`}>{statusLabel(row.readinessStatus)}</span></td>
                  <td className="px-4 py-3 align-top">
                    <Link className="font-medium underline" href={withCoordinatorContext(row.nextActionUrl, context)}>{row.nextAction}</Link>
                    <div className="mt-1 text-xs text-slate-600">Why now: {row.priorityReason}</div>
                    {row.carePlanReviewStatus ? <div className="mt-1 text-xs font-medium text-slate-600">Care plan: {CARE_PLAN_REVIEW_LABELS[row.carePlanReviewStatus]}</div> : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {row.queueKeys.slice(0, 3).map((key) => <span className="border bg-white px-1.5 py-0.5 text-[11px] text-slate-600" key={key}>{STAFF_QUEUE_LABELS[key]}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{row.owner}</div>
                    {canClaimUnassigned && !row.assignedCoordinatorId ? <button className="mt-2 text-xs font-semibold underline disabled:opacity-50" disabled={claimingPatientId === row.patientId} onClick={() => void claimPatient(row.patientId)} type="button">{claimingPatientId === row.patientId ? "Claiming…" : "Claim unassigned patient"}</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span>Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => setFilters({ page: String(page - 1) })}>Previous</button>
          <button className="rounded-md border px-3 py-2 disabled:opacity-50" disabled={page >= pageCount} onClick={() => setFilters({ page: String(page + 1) })}>Next</button>
        </div>
      </div>
    </main>
  );
}
