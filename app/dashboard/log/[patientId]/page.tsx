"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type { InteractionLog, Patient } from "../../../../lib/ccm/types";
import { billingMonthFromOccurredDate, currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import {
  buildTimeEntryCreateRequest,
  occurrenceDateForDisplay,
} from "../../../../lib/ccm/interaction-log-contract";
import { calendarDateInTimeZone, validateInteraction } from "../../../../lib/ccm/validation";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    default_timezone: string;
    id: string;
  };
};

type PatientResponse = {
  error?: string;
  patient?: Patient;
};

type LogsResponse = {
  error?: string;
  interactionLogs?: InteractionLog[];
};

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export default function LogInteractionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const requestedActivity = searchParams.get("activity");
  const requestedMonth = searchParams.get("month") ?? currentMonthValue();
  const [activityType, setActivityType] = useState(
    requestedActivity && ["call", "voicemail", "failed_attempt", "care_review", "care_coordination", "checkin_review", "documentation", "other"].includes(requestedActivity)
      ? requestedActivity
      : "call",
  );
  const [minutes, setMinutes] = useState<number | "">("");
  const [occurredDate, setOccurredDate] = useState(() => requestedMonth === currentMonthValue() ? todayInput() : `${requestedMonth}-01`);
  const [maximumOccurrenceDate, setMaximumOccurrenceDate] = useState(todayInput);
  const billingMonth = billingMonthFromOccurredDate(occurredDate);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const requestIdRef = useRef<string | null>(null);

  const totalMinutes = useMemo(
    () => logs.reduce((total, log) => total + Number(log.minutes ?? 0), 0),
    [logs],
  );

  const loadLogs = useCallback(async (activePracticeId: string, month: string) => {
    const response = await fetch(
      `/api/interaction-logs?practiceId=${encodeURIComponent(
        activePracticeId,
      )}&patientId=${encodeURIComponent(patientId)}&billingMonth=${encodeURIComponent(month)}`,
      { headers: await getSupabaseAuthHeaders() },
    );
    const result = (await response.json()) as LogsResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to load logs");
      setLogs([]);
      return;
    }

    setLogs(result.interactionLogs ?? []);
  }, [patientId]);

  useEffect(() => {
    async function load() {
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
      const practiceToday = calendarDateInTimeZone(
        new Date(),
        activeResult.practice.default_timezone,
      );
      setMaximumOccurrenceDate(practiceToday);
      if (!practiceId && requestedMonth === practiceToday.slice(0, 7)) {
        setOccurredDate(practiceToday);
      }

      const patientResponse = await fetch(
        `/api/patients?practiceId=${encodeURIComponent(
          activeResult.practice.id,
        )}&patientId=${encodeURIComponent(patientId)}`,
        { headers: await getSupabaseAuthHeaders() },
      );
      const patientResult = (await patientResponse.json()) as PatientResponse;

      if (patientResponse.ok && patientResult.patient) {
        setPatient(patientResult.patient);
      }

      await loadLogs(activeResult.practice.id, billingMonth);
      setLoading(false);
    }

    void load();
  }, [billingMonth, loadLogs, patientId, practiceId, requestedMonth]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!practiceId) return;

    let payload;

    try {
      requestIdRef.current ??= crypto.randomUUID();
      payload = buildTimeEntryCreateRequest(new FormData(event.currentTarget), {
        patientId,
        practiceId,
        requestId: requestIdRef.current,
      });
      validateInteraction(payload.minutes, payload.notes);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Time entry is invalid");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/interaction-logs", {
      body: JSON.stringify({
        ...payload,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to save interaction");
      return;
    }

    setNotes("");
    setMinutes("");
    requestIdRef.current = null;
    setMessage("Time logged.");
    await loadLogs(practiceId, result.interactionLog.billing_month);
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { href: `/patients/${patientId}`, label: patient?.display_name ?? "Patient" },
          { label: "Log time" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Log CCM Time</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name ?? "Patient"} - {totalMinutes} documented CCM minutes this month
          </div>
        </div>
        <button className="text-sm underline" onClick={() => router.back()}>
          Back
        </button>
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

      <form onSubmit={handleSave} className="rounded-md border bg-white p-4 text-black">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Activity type</span>
            <span className="block text-xs text-gray-600">
              Choose the care-management work performed for the audit trail.
            </span>
            <select
              name="activityType"
              className="w-full rounded-md border px-3 py-2"
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
            >
              <option value="call">Call</option>
              <option value="voicemail">Voicemail</option>
              <option value="failed_attempt">Failed attempt</option>
              <option value="care_review">Care review</option>
              <option value="care_coordination">Care coordination</option>
              <option value="checkin_review">Check-in review</option>
              <option value="documentation">Documentation</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Minutes</span>
            <span className="block text-xs text-gray-600">
              Logged minutes support the monthly CCM billing threshold.
            </span>
            <input
              name="minutes"
              type="number"
              min={1}
              max={480}
              className="w-full rounded-md border px-3 py-2"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Occurred date</span>
            <span className="block text-xs text-gray-600">
              Use the date the care-management work happened.
            </span>
            <input
              name="occurrenceDate"
              type="date"
              max={maximumOccurrenceDate}
              className="w-full rounded-md border px-3 py-2"
              value={occurredDate}
              onChange={(event) => setOccurredDate(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <span className="block text-xs text-gray-600">
              The minutes count toward this patient-month.
            </span>
            <input
              type="month"
              className="w-full rounded-md border px-3 py-2"
              value={billingMonth.slice(0, 7)}
              readOnly
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Notes</span>
            <span className="block text-xs text-gray-600">
              Briefly document what was done so the evidence packet is understandable.
            </span>
            <textarea
              name="notes"
              className="min-h-24 w-full rounded-md border px-3 py-2"
              minLength={8}
              required
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save time"}
          </button>
          <Link className="text-sm underline" href={withCoordinatorContext("/dashboard/worklist", { month: normalizeBillingMonth(requestedMonth), source: "worklist" })}>
            Worklist
          </Link>
        </div>
      </form>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Monthly logs</h2>
        {logs.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
            No monthly time logged yet. Add documented CCM minutes before recalculating billing readiness.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">
                  {log.activity_type.replaceAll("_", " ")} - {log.minutes} min
                </div>
                <div className="text-xs text-gray-500">
                  {occurrenceDateForDisplay(log)}
                </div>
                {log.notes ? <div className="mt-1 text-gray-700">{log.notes}</div> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
