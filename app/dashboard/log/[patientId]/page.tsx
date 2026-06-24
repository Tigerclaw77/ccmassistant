"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type { InteractionLog, Patient } from "../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
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

function firstDayOfMonthInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export default function LogInteractionPage() {
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [activityType, setActivityType] = useState("call");
  const [minutes, setMinutes] = useState(20);
  const [occurredDate, setOccurredDate] = useState(todayInput());
  const [billingMonth, setBillingMonth] = useState(firstDayOfMonthInput());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  }, [billingMonth, loadLogs, patientId]);

  async function handleSave() {
    if (!practiceId) return;

    setSaving(true);
    setError(null);

    const response = await fetch("/api/interaction-logs", {
      body: JSON.stringify({
        activityType,
        billingMonth,
        minutes,
        notes,
        occurredAt: new Date(`${occurredDate}T12:00:00`).toISOString(),
        patientId,
        practiceId,
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
    await loadLogs(practiceId, billingMonth);
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Log CCM Time</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name ?? "Patient"} · {totalMinutes} min this month
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

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Activity type</span>
            <select
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
            <input
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2"
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Occurred date</span>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={occurredDate}
              onChange={(event) => setOccurredDate(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={billingMonth}
              onChange={(event) => setBillingMonth(`${event.target.value.slice(0, 7)}-01`)}
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Notes</span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save time"}
          </button>
          <Link className="text-sm underline" href="/dashboard/worklist">
            Worklist
          </Link>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Monthly logs</h2>
        {logs.length === 0 ? (
          <div className="text-sm text-gray-600">No time logged for this month.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">
                  {log.activity_type.replaceAll("_", " ")} · {log.minutes} min
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.occurred_at).toLocaleDateString()}
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
