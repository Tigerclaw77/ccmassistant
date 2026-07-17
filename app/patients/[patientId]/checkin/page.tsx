"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import SessionReviewSummary from "../../../../components/ccm/SessionReviewSummary";
import LoadingState from "../../../../components/ui/LoadingState";
import { authRedirectUrl } from "../../../../lib/auth-redirect";
import { statusLabel } from "../../../../lib/ccm/labels";
import { getQuestion } from "../../../../lib/ccm/question-bank/questions";
import type { QuestionSessionPayload } from "../../../../lib/ccm/session-integration";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type { CheckinInstance, CheckinResponse, Patient, Question } from "../../../../lib/ccm/types";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import { renderPatientCommunicationText, type PatientCommunicationKind } from "../../../../lib/ccm/patient-communications";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
    name: string;
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
  mode?: "engine" | "legacy" | null;
  session?: QuestionSessionPayload | null;
};

export default function PatientCheckinPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState("the practice");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [billingMonth, setBillingMonth] = useState(() => normalizeBillingMonth(searchParams.get("month") ?? currentMonthValue()));
  const [checkIn, setCheckIn] = useState<CheckinInstance | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<CheckinResponse[]>([]);
  const [mode, setMode] = useState<"engine" | "legacy" | null>(null);
  const [engineSession, setEngineSession] = useState<QuestionSessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [followupNote, setFollowupNote] = useState("");

  const questionsById = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, question])),
    [questions],
  );

  const publicLink = checkIn?.token
    ? authRedirectUrl(`/f/${checkIn.token}`)
    : "";
  const context = useMemo(() => ({ month: billingMonth, source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [billingMonth, searchParams]);

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
    setMode(result.mode ?? null);
    setEngineSession(result.session ?? null);
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
      setPracticeName(activeResult.practice.name);

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
    setMode(result.mode ?? null);
    setEngineSession(result.session ?? null);
    setMessage("Check-in created.");
    if (result.checkIn?.token) {
      await copyPatientMessage("checkin_invitation", authRedirectUrl(`/f/${result.checkIn.token}`));
      setMessage("Check-in created and patient invitation copied.");
    }
  }

  async function copyPublicLink() {
    if (!publicLink) return;

    await navigator.clipboard.writeText(publicLink);
    setMessage("Public check-in link copied.");
  }

  async function copyPatientMessage(kind: PatientCommunicationKind, actionUrl = publicLink) {
    if (!actionUrl) return;
    const communication = renderPatientCommunicationText(kind, {
      actionUrl,
      patientFirstName: patient?.first_name,
      practiceName,
    });
    await navigator.clipboard.writeText(`${communication.subject}\n\n${communication.text}`);
    setMessage(`${kind === "checkin_invitation" ? "Invitation" : kind === "checkin_reminder" ? "Reminder" : "Follow-up"} copied for secure sending.`);
  }

  async function markClosed() {
    if (!practiceId || !checkIn) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/check-ins/status", {
      body: JSON.stringify({
        checkinInstanceId: checkIn.id,
        followupNote: responses.length === 0 ? followupNote : undefined,
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

    setMessage(
      responses.length > 0
        ? "Patient response reviewed and check-in closed."
        : "Non-response follow-up documented and check-in closed.",
    );
    setFollowupNote("");
    await loadCheckIn(practiceId, billingMonth);
  }

  if (loading) {
    return <main className="page-shell"><LoadingState label="Loading monthly check-in" /></main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { href: withCoordinatorContext(`/patients/${patientId}`, context), label: patient?.display_name ?? "Patient" },
          { label: "Monthly check-in" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monthly Check-in</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name} - collect or close the monthly patient contact needed for billing review.
          </div>
        </div>
        <Link className="text-sm underline" href={withCoordinatorContext(`/patients/${patientId}`, context)}>
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
        {!checkIn ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            No check-in exists for this month. Create one, copy the public link, and send it to the patient.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Billing month</span>
            <span className="block text-xs text-gray-600">
              The check-in is tied to the patient-month being reviewed.
            </span>
            <input
              type="month"
              className="w-full rounded-md border px-3 py-2"
              value={billingMonth.slice(0, 7)}
              onChange={(event) => setBillingMonth(normalizeBillingMonth(event.target.value))}
            />
          </label>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Status</div>
            <div className="rounded-md border bg-gray-50 px-3 py-2 capitalize">
              {checkIn ? statusLabel(checkIn.status) : "Not Created"}
            </div>
          </div>

          <div className="flex items-end">
            {!checkIn ? (
              <button
                onClick={createCheckIn}
                disabled={working}
                className="w-full rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Create and copy invitation
              </button>
            ) : checkIn.status === "closed" ? (
              <div className="w-full rounded-md border bg-green-50 px-4 py-2 text-center text-sm text-green-800">Closed</div>
            ) : responses.length > 0 && (mode !== "engine" || engineSession?.status === "completed") ? (
              <button
                onClick={markClosed}
                disabled={working}
                className="w-full rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Review response and close
              </button>
            ) : publicLink ? <button className="w-full rounded-md border px-4 py-2 text-sm font-medium" onClick={() => copyPatientMessage("checkin_invitation")}>Copy patient invitation</button> : null}
          </div>
        </div>

        {publicLink ? (
          <div className="mt-4 rounded-md border bg-gray-50 p-3 text-sm">
            <div className="font-medium">Public patient link</div>
            <div className="mt-1 text-gray-600">
              Send this link to the patient so responses are attached to this billing month.
            </div>
            <div className="mt-2 flex flex-col gap-3">
              <a className="break-all underline" href={publicLink} rel="noreferrer" target="_blank">
                {publicLink}
              </a>
              <div className="flex flex-wrap gap-2">
                <button className="rounded border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => copyPatientMessage("checkin_invitation")} type="button">Copy invitation</button>
                <button className="rounded border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => copyPatientMessage("checkin_reminder")} type="button">Copy reminder</button>
                <button className="rounded border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => copyPatientMessage("checkin_followup")} type="button">Copy follow-up</button>
                <button className="rounded border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={copyPublicLink} type="button">Copy link only</button>
              </div>
            </div>
          </div>
        ) : null}

        {engineSession ? (
          <div className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-4">
            <div><div className="text-xs text-gray-600">Overall progress</div><div className="font-medium">{engineSession.session.progress.completionPercentage}%</div></div>
            <div><div className="text-xs text-gray-600">Status</div><div className="font-medium capitalize">{engineSession.status}</div></div>
            <div><div className="text-xs text-gray-600">Questions remaining</div><div className="font-medium">{engineSession.session.progress.requiredQuestionsRemaining + engineSession.session.progress.optionalQuestionsRemaining}</div></div>
            <div><div className="text-xs text-gray-600">Estimated completion</div><div className="font-medium">{engineSession.session.progress.estimatedMinutesRemaining} min</div></div>
          </div>
        ) : null}

        {checkIn && responses.length === 0 && checkIn.status !== "closed" ? (
          <label className="mt-4 block space-y-1 text-sm">
            <span className="font-medium">Follow-up attempt or resolution</span>
            <span className="block text-xs text-gray-600">
              Required to close a check-in without a patient response.
            </span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              onChange={(event) => setFollowupNote(event.target.value)}
              placeholder="Document the attempted contact and outcome."
              value={followupNote}
            />
            <button className="mt-2 rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60" disabled={working || followupNote.trim().length < 8} onClick={markClosed} type="button">Document non-response and close</button>
          </label>
        ) : null}
      </section>

      {checkIn?.status === "closed" ? <div className="flex flex-wrap gap-3 text-sm"><Link className="underline" href={withCoordinatorContext(`/dashboard/log/${patientId}?activity=checkin_review`, context)}>Log check-in time</Link><Link className="underline" href={withCoordinatorContext("/dashboard/worklist", context)}>Return to worklist</Link></div> : null}

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Responses</h2>
        {mode === "engine" && engineSession?.status === "completed" ? (
          <SessionReviewSummary session={engineSession.session} />
        ) : mode === "engine" && engineSession ? (
          engineSession.session.completedQuestionIds.length ? (
            <div className="space-y-3">
              {engineSession.session.completedQuestionIds.map((questionId) => {
                const response = engineSession.session.answers[questionId];
                return response ? (
                  <div className="border-b pb-3 text-sm last:border-b-0 last:pb-0" key={questionId}>
                    <div className="font-medium">{getQuestion(questionId)?.text ?? questionId}</div>
                    <div className="mt-1 text-gray-700">{Array.isArray(response.answer) ? response.answer.join(", ") : String(response.answer)}</div>
                  </div>
                ) : null;
              })}
            </div>
          ) : <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">No patient response yet.</div>
        ) : responses.length === 0 ? (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No patient response yet. Send the public link or close the check-in after documenting the attempted contact.
          </div>
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
        {mode === "engine" ? (
          <div className="text-sm text-gray-700">
            {engineSession?.currentQuestion ? (
              <><div className="text-xs text-gray-600">Current section</div><div className="font-medium">{engineSession.currentQuestion.currentSection}</div><div className="mt-2">{engineSession.currentQuestion.text}</div></>
            ) : <div>{engineSession?.status === "completed" ? "Complete" : "No active question"}</div>}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No questions attached yet. Create the monthly check-in to attach the default patient questions.
          </div>
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
