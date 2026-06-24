"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import type { MonthlyBillability, Patient } from "../../../lib/ccm/types";
import { reasonLabel, statusLabel } from "../../../lib/ccm/labels";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
    name: string;
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

function firstDayOfMonthInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

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
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState("");
  const [billingMonth, setBillingMonth] = useState(firstDayOfMonthInput());
  const [rows, setRows] = useState<BillingResponse["rows"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingPatientId, setWorkingPatientId] = useState<string | null>(null);

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
      setError(result.error ?? "Unable to recalculate billability");
      setWorkingPatientId(null);
      return;
    }

    await loadBilling(practiceId, billingMonth);
    setMessage("Billing recalculated.");
    setWorkingPatientId(null);
  }

  async function recalculateAll() {
    setMessage(null);
    for (const row of rows ?? []) {
      await recalculate(row.patient.id);
    }
    setMessage("Billing recalculated for all patients.");
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
          ? "Marked hold."
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
    setMessage("Hold released and billing recalculated.");
    setWorkingPatientId(null);
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monthly Billing</h1>
          <div className="text-sm text-gray-600">{practiceName || "Practice"}</div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <input
              type="date"
              className="block rounded-md border px-3 py-2"
              value={billingMonth}
              onChange={(event) => setBillingMonth(`${event.target.value.slice(0, 7)}-01`)}
            />
          </label>

          <button
            onClick={recalculateAll}
            disabled={!rows?.length}
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Recalculate all
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

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : !rows?.length ? (
        <div className="rounded-md border border-dashed bg-white p-5 text-sm text-gray-600">
          No patients yet. Add a patient before running monthly billing.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white text-black">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Minutes</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Reasons</th>
                <th className="px-4 py-3 font-semibold">Reviewed</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = workingPatientId === row.patient.id;

                return (
                  <tr key={row.patient.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <Link className="font-medium underline" href={`/patients/${row.patient.id}`}>
                        {row.patient.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {row.billability?.total_minutes ?? 0}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusClass(row.billability?.status)}`}>
                        {statusLabel(row.billability?.status)}
                      </span>
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
                          Recalculate
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
                            Mark hold
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
                          href={`/dashboard/billing/${row.patient.id}/${billingMonth}`}
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
