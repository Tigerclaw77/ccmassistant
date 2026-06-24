"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CheckinInstance, Patient, Question } from "../../../lib/ccm/types";

type PublicCheckInResponse = {
  checkIn?: CheckinInstance;
  error?: string;
  patient?: Pick<Patient, "display_name" | "id">;
  questions?: Question[];
};

function inputForQuestion(
  question: Question,
  value: string,
  onChange: (value: string) => void,
) {
  if (question.answer_type === "yes_no") {
    return (
      <select
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    );
  }

  if (question.answer_type === "number" || question.answer_type === "scale") {
    return (
      <input
        type="number"
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.answer_type === "date") {
    return (
      <input
        type="date"
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <textarea
      className="min-h-24 w-full rounded-md border px-3 py-2"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function PublicForm() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [checkIn, setCheckIn] = useState<CheckinInstance | null>(null);
  const [patient, setPatient] = useState<Pick<Patient, "display_name" | "id"> | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/check-ins/public/${token}`);
      const result = (await response.json()) as PublicCheckInResponse;

      if (!response.ok) {
        setError(result.error ?? "Invalid link");
        setLoading(false);
        return;
      }

      setCheckIn(result.checkIn ?? null);
      setPatient(result.patient ?? null);
      setQuestions(result.questions ?? []);
      setLoading(false);
    }

    void load();
  }, [token]);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/check-ins/public/${token}/submit`, {
      body: JSON.stringify({ answers }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to submit response");
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  if (submitted) {
    return (
      <main className="p-6 max-w-xl space-y-3">
        <h1 className="text-xl font-semibold">Response received</h1>
        <p className="text-sm text-gray-600">Your care team can now review this check-in.</p>
      </main>
    );
  }

  if (error || !checkIn) {
    return (
      <main className="p-6 max-w-xl space-y-3">
        <h1 className="text-xl font-semibold">Check-in unavailable</h1>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Invalid link"}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Monthly CCM Check-in</h1>
        <div className="text-sm text-gray-600">{patient?.display_name}</div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-md border bg-white p-4 text-black">
        {questions.map((question) => (
          <label key={question.id} className="block space-y-2 text-sm">
            <span className="font-medium">{question.prompt}</span>
            {inputForQuestion(question, answers[question.id] ?? "", (value) =>
              updateAnswer(question.id, value),
            )}
          </label>
        ))}

        {questions.length === 0 ? (
          <div className="text-sm text-gray-600">No questions are attached to this check-in.</div>
        ) : null}

        <button
          onClick={submit}
          disabled={submitting || questions.length === 0}
          className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </section>
    </main>
  );
}
