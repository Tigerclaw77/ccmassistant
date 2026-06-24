"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type { CheckinInstance, CheckinResponse, Patient, Question } from "../../../../lib/ccm/types";

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

type CheckInResponse = {
  billingMonth?: string;
  checkIn?: CheckinInstance | null;
  error?: string;
  questions?: Question[];
  responses?: CheckinResponse[];
};

function firstDayOfMonthInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function label(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ") : "not created";
}

export default function PatientCheckinPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [billingMonth, setBillingMonth] = useState(firstDayOfMonthInput());
  const [checkIn, setCheckIn] = useState<CheckinInstance | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<CheckinResponse[]>([]);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const questionsById = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, question])),
    [questions],
  );

  const publicLink = checkIn?.token && origin ? `${origin}/f/${checkIn.token}` : "";

  const loadCheckIn = useCallback(async (activePracticeId: string, month: string) => {
    const response = await fetch(
      `/api/check-ins?practiceId=${encodeURIComponent(
        activePracticeId,
      )}&patientId=${encodeURIComponent(patientId)}&billingMonth=${encodeURIComponent(month)}`,
      { headers: await getSupabaseAuthHeaders() },
    );
    const result = (await response.json()) as CheckInResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to load check-in");
      return;
    }

    setCheckIn(result.checkIn ?? null);
    setQuestions(result.questions ?? []);
    setResponses(result.responses ?? []);
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

      await loadCheckIn(activeResult.practice.id, billingMonth);
      setLoading(false);
    }

    void load();
  }, [billingMonth, loadCheckIn, patientId]);

  async function createCheckIn() {
    if (!practiceId) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/check-ins", {
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
    const result = (await response.json()) as CheckInResponse;
    setWorking(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to create check-in");
      return;
    }

    setCheckIn(result.checkIn ?? null);
    setQuestions(result.questions ?? []);
    setResponses(result.responses ?? []);
    setMessage("Check-in created");
  }

  async function markClosed() {
    if (!practiceId || !checkIn) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/check-ins/status", {
      body: JSON.stringify({
        checkinInstanceId: checkIn.id,
        practiceId,
        status: "closed",
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "PATCH",
    });
    const result = await response.json();
    setWorking(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to close check-in");
      return;
    }

    setMessage("Check-in closed");
    await loadCheckIn(practiceId, billingMonth);
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monthly Check-in</h1>
          <div className="text-sm text-gray-600">{patient?.display_name}</div>
        </div>
        <Link className="text-sm underline" href={`/patients/${patientId}`}>
          Patient
        </Link>
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

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={billingMonth}
              onChange={(event) => setBillingMonth(`${event.target.value.slice(0, 7)}-01`)}
            />
          </label>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Status</div>
            <div className="rounded-md border bg-gray-50 px-3 py-2 capitalize">
              {label(checkIn?.status)}
            </div>
          </div>

          <div className="flex items-end">
            {checkIn ? (
              <button
                onClick={markClosed}
                disabled={working}
                className="w-full rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Mark reviewed / closed
              </button>
            ) : (
              <button
                onClick={createCheckIn}
                disabled={working}
                className="w-full rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Create monthly check-in
              </button>
            )}
          </div>
        </div>

        {publicLink ? (
          <div className="mt-4 rounded-md border bg-gray-50 p-3 text-sm">
            <div className="font-medium">Public patient link</div>
            <a className="break-all underline" href={publicLink} target="_blank">
              {publicLink}
            </a>
          </div>
        ) : null}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Responses</h2>
        {responses.length === 0 ? (
          <div className="text-sm text-gray-600">No patient response yet.</div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => (
              <div key={response.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">
                  {response.question_id
                    ? questionsById[response.question_id]?.prompt ?? "Question"
                    : "Question"}
                </div>
                <div className="mt-1 text-gray-700">{response.response_text ?? ""}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Questions</h2>
        {questions.length === 0 ? (
          <div className="text-sm text-gray-600">Create the monthly check-in to attach questions.</div>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {questions.map((question) => (
              <li key={question.id}>{question.prompt}</li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
