"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import type { MonthlyBillability, Patient } from "../../../lib/ccm/types";
import { reasonLabel, statusLabel } from "../../../lib/ccm/labels";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../lib/ccm/month-context";
import {
  BILLING_REVIEW_LABELS,
  billingReviewCategory,
  remainingMinutes,
  suggestCptReview,
  type BillingReviewCategory,
} from "../../../lib/ccm/staff-experience";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
    name: string;
    ccm_monthly_min_minutes: number;
  };
};

type BillingResponse = {
  billingMonth?: string;
  error?: string;
  rows?: Array<{
    billability: MonthlyBillability | null;
    patient: Patient;
  }>;
};

type RecalculateResponse = {
  billability?: MonthlyBillability;
  error?: string;
};

const CATEGORY_ORDER: BillingReviewCategory[] = [
  "ready_to_bill",
  "ready_after_small_action",
  "missing_evidence",
  "missing_minutes",
  "provider_review_pending",
  "consent_issue",
  "eligibility_issue",
  "hold",
  "billed",
];

function statusClass(value: string | null | undefined): string {
  if (value === "ready_to_bill" || value === "billed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (value === "hold" || value === "ineligible") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState("");
  const [billingMonth, setBillingMonth] = useState(() => normalizeBillingMonth(searchParams.get("month") ?? currentMonthValue()));
  const [rows, setRows] = useState<BillingResponse["rows"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingPatientId, setWorkingPatientId] = useState<string | null>(null);
  const [monthlyThreshold, setMonthlyThreshold] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<BillingReviewCategory | "">("");

  async function loadBilling(activePracticeId: string, month: string) {
    const response = await fetch(
      `/api/billing/month?practiceId=${encodeURIComponent(
        activePracticeId,
      )}&billingMonth=${encodeURIComponent(month)}`,
      { headers: await getSupabaseAuthHeaders() },
    );
    const result = (await response.json()) as BillingResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to load billing");
      setRows([]);
      return;
    }

    setRows(result.rows ?? []);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const activePracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });
      const activeResult = (await activeResponse.json()) as ActivePracticeResponse;

      if (!activeResponse.ok || !activeResult.practice?.id) {
        setError(activeResult.error ?? "No active practice found");
        setLoading(false);
        return;
      }

      localStorage.setItem("activePracticeId", activeResult.practice.id);
      setPracticeId(activeResult.practice.id);
      setPracticeName(activeResult.practice.name);
      setMonthlyThreshold(activeResult.practice.ccm_monthly_min_minutes ?? 20);
      await loadBilling(activeResult.practice.id, billingMonth);
      setLoading(false);
    }

    void load();
  }, [billingMonth]);

  async function recalculate(patientId: string) {
    if (!practiceId) return;

    setWorkingPatientId(patientId);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/billability/recalculate", {
      body: JSON.stringify({
        billingMonth,
        patientId,
        practiceId,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = (await response.json()) as RecalculateResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to recalculate billing readiness");
      setWorkingPatientId(null);
      return;
    }

    await loadBilling(practiceId, billingMonth);
    setMessage("Billing readiness recalculated.");
    setWorkingPatientId(null);
  }

  async function recalculateAll() {
    if (!practiceId) return;
    setMessage(null);
    setError(null);
    setWorkingPatientId("batch");
    const response = await fetch("/api/billability/recalculate/batch", {
      body: JSON.stringify({ billingMonth, practiceId }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = await response.json() as { error?: string; failures?: unknown[]; succeeded?: number; total?: number };
    if (!response.ok && response.status !== 207) {
      setError(result.error ?? "Unable to recalculate billing readiness");
      setWorkingPatientId(null);
      return;
    }
    await loadBilling(practiceId, billingMonth);
    setMessage(`${result.succeeded ?? 0} of ${result.total ?? 0} patient-months recalculated${result.failures?.length ? `; ${result.failures.length} require retry` : ""}.`);
    setWorkingPatientId(null);
  }

  async function updateBilling(patientId: string, action: "reviewed" | "billed" | "hold") {
    if (!practiceId) return;

    const confirmation = {
      billed: "Mark this patient-month as billed?",
      hold: "Place this patient-month on hold?",
      reviewed: "Mark this patient-month as reviewed?",
    }[action];

    if (!window.confirm(confirmation)) {
      return;
    }

    setWorkingPatientId(patientId);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/billing/month", {
      body: JSON.stringify({
        action,
        billingMonth,
        patientId,
        practiceId,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "PATCH",
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Unable to update billing row");
      setWorkingPatientId(null);
      return;
    }

    await loadBilling(practiceId, billingMonth);
    setMessage(
      action === "reviewed"
        ? "Marked reviewed."
        : action === "hold"
          ? "Patient-month placed on hold."
          : "Marked billed.",
    );
    setWorkingPatientId(null);
  }

  async function releaseHold(patientId: string) {
    if (!practiceId) return;

    if (!window.confirm("Release hold and recalculate this patient-month?")) {
      return;
    }

    setWorkingPatientId(patientId);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/billability/recalculate", {
      body: JSON.stringify({
        billingMonth,
        overrideStatus: true,
        patientId,
        practiceId,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = (await response.json()) as RecalculateResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to release hold");
      setWorkingPatientId(null);
      return;
    }

    await loadBilling(practiceId, billingMonth);
    setMessage("Hold released and billing readiness recalculated.");
    setWorkingPatientId(null);
  }

  const reviewRows = useMemo(() => (rows ?? []).map((row) => ({
    ...row,
    category: billingReviewCategory(row.billability, monthlyThreshold),
    cptReview: suggestCptReview(row.billability),
    minutesRemaining: remainingMinutes(row.billability?.total_minutes ?? 0, monthlyThreshold),
  })), [monthlyThreshold, rows]);
  const categoryCounts = useMemo(() => Object.fromEntries(CATEGORY_ORDER.map((category) => [
    category,
    reviewRows.filter((row) => row.category === category).length,
  ])) as Record<BillingReviewCategory, number>, [reviewRows]);
  const visibleRows = categoryFilter
    ? reviewRows.filter((row) => row.category === categoryFilter)
    : reviewRows;

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monthly Billing</h1>
          <div className="text-sm text-gray-600">
            {practiceName || "Practice"} - review patient-month readiness and evidence.
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <span className="block text-xs text-gray-600">
              Billing actions apply to this patient-month only.
            </span>
            <input
              type="month"
              className="block rounded-md border px-3 py-2"
              value={billingMonth.slice(0, 7)}
              onChange={(event) => {
                const next = normalizeBillingMonth(event.target.value);
                setBillingMonth(next);
                router.replace(`/dashboard/billing?month=${event.target.value}`);
              }}
            />
          </label>

          <button
            onClick={recalculateAll}
            disabled={!rows?.length || workingPatientId === "batch"}
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {workingPatientId === "batch" ? "Recalculating..." : "Recalculate all"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {!loading && reviewRows.length ? (
        <section aria-label="Billing review queues" className="border-y bg-white py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="font-semibold">Review queues</h2><p className="text-xs text-slate-600">Choose a queue to focus the patient-month list.</p></div>
            {categoryFilter ? <button className="text-sm font-medium underline" onClick={() => setCategoryFilter("")} type="button">Show all</button> : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {CATEGORY_ORDER.map((category) => (
              <button
                aria-pressed={categoryFilter === category}
                className={`min-h-20 border p-3 text-left ${categoryFilter === category ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"}`}
                key={category}
                onClick={() => setCategoryFilter(categoryFilter === category ? "" : category)}
                type="button"
              >
                <span className="block text-xl font-semibold">{categoryCounts[category]}</span>
                <span className={`mt-1 block text-xs ${categoryFilter === category ? "text-slate-200" : "text-slate-600"}`}>{BILLING_REVIEW_LABELS[category]}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : !reviewRows.length ? (
        <div className="rounded-md border border-dashed bg-white p-5 text-sm text-gray-600">
          No patients yet. Add an enrolled patient before running monthly billing readiness.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white text-black">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Minutes</th>
                <th className="px-4 py-3 font-semibold">Review queue</th>
                <th className="px-4 py-3 font-semibold">Missing items</th>
                <th className="px-4 py-3 font-semibold">Suggested CPT</th>
                <th className="px-4 py-3 font-semibold">Reviewed</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const busy = workingPatientId === row.patient.id;

                return (
                  <tr key={row.patient.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <Link className="font-medium underline" href={`/patients/${row.patient.id}`}>
                        {row.patient.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{row.billability?.total_minutes ?? 0} / {monthlyThreshold}</div>
                      <div className="text-xs text-slate-600">{row.minutesRemaining ? `${row.minutesRemaining} remaining` : "Threshold met"}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusClass(row.billability?.status)}`}>
                        {BILLING_REVIEW_LABELS[row.category]}
                      </span>
                      <div className="mt-1 text-xs text-slate-600">{statusLabel(row.billability?.status)}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-700">
                      {row.cptReview ? (
                        <><div className="font-semibold text-slate-900">{row.cptReview.codes.map((item) => `${item.code}${item.units > 1 ? ` x${item.units}` : ""}`).join(" + ")}</div><div className="mt-1 max-w-52">Review only; never billed automatically.</div></>
                      ) : "Not suggested until ready"}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-gray-700">
                      {row.billability?.reason_codes?.length
                        ? row.billability.reason_codes.map(reasonLabel).join("; ")
                        : "None"}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-gray-700">
                      {row.billability?.reviewed_at
                        ? new Date(row.billability.reviewed_at).toLocaleDateString()
                        : "Not reviewed"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => recalculate(row.patient.id)}
                          disabled={busy}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                        >
                          Recalculate readiness
                        </button>
                        <button
                          onClick={() => updateBilling(row.patient.id, "reviewed")}
                          disabled={busy || !row.billability}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                        >
                          Mark reviewed
                        </button>
                        {row.billability?.status === "hold" ? (
                          <button
                            onClick={() => releaseHold(row.patient.id)}
                            disabled={busy || !row.billability}
                            className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                          >
                            Release hold
                          </button>
                        ) : (
                          <button
                            onClick={() => updateBilling(row.patient.id, "hold")}
                            disabled={busy || !row.billability}
                            className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                          >
                            Place hold
                          </button>
                        )}
                        <button
                          onClick={() => updateBilling(row.patient.id, "billed")}
                          disabled={busy || row.billability?.status !== "ready_to_bill"}
                          className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
                        >
                          Mark billed
                        </button>
                        <Link
                          className="rounded-md border px-2 py-1 text-xs underline"
                          href={withCoordinatorContext(`/dashboard/billing/${row.patient.id}/${billingMonth}`, { month: billingMonth, source: "billing" })}
                        >
                          Evidence
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
