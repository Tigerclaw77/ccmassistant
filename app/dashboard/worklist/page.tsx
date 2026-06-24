"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import type {
  CarePlan,
  CcmEnrollment,
  CheckinInstance,
  InteractionLog,
  MonthlyBillability,
  Patient,
} from "../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    ccm_monthly_min_minutes: number;
    id: string;
    name: string;
  };
};

type PatientsResponse = {
  enrollmentsByPatientId?: Record<string, CcmEnrollment>;
  error?: string;
  patients?: Patient[];
};

type CarePlansResponse = {
  carePlans?: CarePlan[];
};

type CheckInResponse = {
  checkIn?: CheckinInstance | null;
};

type LogsResponse = {
  interactionLogs?: InteractionLog[];
};

type BillingResponse = {
  rows?: Array<{
    billability: MonthlyBillability | null;
    patient: Patient;
  }>;
};

type WorklistRow = {
  billability: MonthlyBillability | null;
  blockers: string[];
  carePlan: CarePlan | null;
  checkIn: CheckinInstance | null;
  enrollment: CcmEnrollment | null;
  minutes: number;
  patient: Patient;
};

function firstDayOfMonthInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function label(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ") : "missing";
}

function statusClass(ok: boolean) {
  return ok ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-700";
}

export default function WorklistPage() {
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState("");
  const [threshold, setThreshold] = useState(20);
  const [billingMonth, setBillingMonth] = useState(firstDayOfMonthInput());
  const [rows, setRows] = useState<WorklistRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const readyCount = useMemo(
    () => rows.filter((row) => row.billability?.status === "ready_to_bill" || row.billability?.status === "billed").length,
    [rows],
  );

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
      const monthlyThreshold = activeResult.practice.ccm_monthly_min_minutes ?? 20;
      setThreshold(monthlyThreshold);

      const [patientsResponse, billingResponse] = await Promise.all([
        fetch(`/api/patients?practiceId=${encodeURIComponent(activeResult.practice.id)}`, {
          headers: await getSupabaseAuthHeaders(),
        }),
        fetch(
          `/api/billing/month?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&billingMonth=${encodeURIComponent(billingMonth)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
      ]);

      const patientsResult = (await patientsResponse.json()) as PatientsResponse;
      const billingResult = (await billingResponse.json()) as BillingResponse;

      if (!patientsResponse.ok) {
        setError(patientsResult.error ?? "Unable to load patients");
        setLoading(false);
        return;
      }

      const billabilityByPatientId = Object.fromEntries(
        (billingResult.rows ?? []).map((row) => [row.patient.id, row.billability]),
      );

      const worklistRows = await Promise.all(
        (patientsResult.patients ?? []).map(async (patient) => {
          const [carePlansResponse, checkInResponse, logsResponse] = await Promise.all([
            fetch(
              `/api/care-plans?practiceId=${encodeURIComponent(
                activeResult.practice!.id,
              )}&patientId=${encodeURIComponent(patient.id)}`,
              { headers: await getSupabaseAuthHeaders() },
            ),
            fetch(
              `/api/check-ins?practiceId=${encodeURIComponent(
                activeResult.practice!.id,
              )}&patientId=${encodeURIComponent(patient.id)}&billingMonth=${encodeURIComponent(
                billingMonth,
              )}`,
              { headers: await getSupabaseAuthHeaders() },
            ),
            fetch(
              `/api/interaction-logs?practiceId=${encodeURIComponent(
                activeResult.practice!.id,
              )}&patientId=${encodeURIComponent(patient.id)}&billingMonth=${encodeURIComponent(
                billingMonth,
              )}`,
              { headers: await getSupabaseAuthHeaders() },
            ),
          ]);

          const carePlans = ((await carePlansResponse.json()) as CarePlansResponse).carePlans ?? [];
          const checkIn = ((await checkInResponse.json()) as CheckInResponse).checkIn ?? null;
          const logs = ((await logsResponse.json()) as LogsResponse).interactionLogs ?? [];
          const enrollment = patientsResult.enrollmentsByPatientId?.[patient.id] ?? null;
          const carePlan = carePlans.find((plan) => plan.status === "active") ?? null;
          const minutes = logs.reduce((total, log) => total + Number(log.minutes ?? 0), 0);
          const blockers: string[] = [];

          if (enrollment?.status !== "active") blockers.push("Enrollment not active");
          if (enrollment?.eligibility_status !== "eligible") blockers.push("Eligibility not eligible");
          if (enrollment?.consent_status !== "obtained") blockers.push("Consent not obtained");
          if (!carePlan) blockers.push("Active care plan missing");
          if (checkIn?.status !== "responded" && checkIn?.status !== "closed") {
            blockers.push("Check-in not responded or closed");
          }
          if (minutes < monthlyThreshold) blockers.push(`${monthlyThreshold - minutes} more minutes needed`);

          return {
            billability: billabilityByPatientId[patient.id] ?? null,
            blockers,
            carePlan,
            checkIn,
            enrollment,
            minutes,
            patient,
          };
        }),
      );

      worklistRows.sort((a, b) => a.blockers.length - b.blockers.length || a.patient.display_name.localeCompare(b.patient.display_name));
      setRows(worklistRows);
      setLoading(false);
    }

    void load();
  }, [billingMonth, threshold]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Patient Worklist</h1>
          <div className="text-sm text-gray-600">
            {practiceName || "Practice"} · {readyCount} ready
          </div>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Billing month</span>
          <input
            type="date"
            className="block rounded-md border px-3 py-2"
            value={billingMonth}
            onChange={(event) => setBillingMonth(`${event.target.value.slice(0, 7)}-01`)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-white p-5 text-sm text-gray-600">No patients yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <section key={row.patient.id} className="rounded-md border bg-white p-4 text-black">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link className="font-semibold underline" href={`/patients/${row.patient.id}`}>
                    {row.patient.display_name}
                  </Link>
                  <div className="mt-1 text-sm text-gray-600">
                    {row.minutes} of {threshold} min · billing {label(row.billability?.status)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs capitalize">
                  <span className={`rounded-md border px-2 py-1 ${statusClass(row.enrollment?.status === "active")}`}>
                    enrollment {label(row.enrollment?.status)}
                  </span>
                  <span className={`rounded-md border px-2 py-1 ${statusClass(row.enrollment?.consent_status === "obtained")}`}>
                    consent {label(row.enrollment?.consent_status)}
                  </span>
                  <span className={`rounded-md border px-2 py-1 ${statusClass(Boolean(row.carePlan))}`}>
                    care plan {row.carePlan ? "active" : "missing"}
                  </span>
                  <span className={`rounded-md border px-2 py-1 ${statusClass(row.checkIn?.status === "responded" || row.checkIn?.status === "closed")}`}>
                    check-in {label(row.checkIn?.status)}
                  </span>
                </div>
              </div>

              {row.blockers.length > 0 ? (
                <div className="mt-3 text-sm text-gray-700">
                  Blockers: {row.blockers.join(", ")}
                </div>
              ) : (
                <div className="mt-3 text-sm font-medium text-green-700">
                  Ready for billability recalculation.
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link className="underline" href={`/patients/${row.patient.id}/care-plan`}>
                  Care plan
                </Link>
                <Link className="underline" href={`/patients/${row.patient.id}/checkin`}>
                  Check-in
                </Link>
                <Link className="underline" href={`/dashboard/log/${row.patient.id}`}>
                  Log time
                </Link>
                {practiceId ? (
                  <Link
                    className="underline"
                    href={`/dashboard/billing/${row.patient.id}/${billingMonth}`}
                  >
                    Evidence
                  </Link>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
