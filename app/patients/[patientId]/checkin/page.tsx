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
import type { CheckinDelivery, CheckinInstance, CheckinResponse, Patient, Question } from "../../../../lib/ccm/types";
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

type DeliveriesResponse = {
  deliveries?: CheckinDelivery[];
  delivery?: CheckinDelivery;
  error?: string;
  publicUrl?: string;
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
  const [deliveries, setDeliveries] = useState<CheckinDelivery[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "link">("email");

  const questionsById = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, question])),
    [questions],
  );

  const publicLink = checkIn?.token
    ? authRedirectUrl(`/f/${checkIn.token}`)
    : "";
  const context = useMemo(() => ({ month: billingMonth, source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [billingMonth, searchParams]);

  const loadDeliveries = useCallback(async (activePracticeId: string, checkinInstanceId: string) => {
    const response = await fetch(`/api/check-in-deliveries?practiceId=${encodeURIComponent(activePracticeId)}&checkinInstanceId=${encodeURIComponent(checkinInstanceId)}`, { headers: await getSupabaseAuthHeaders() });
    const result = (await response.json()) as DeliveriesResponse;
    if (response.ok) setDeliveries(result.deliveries ?? []);
  }, []);

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
    if (result.checkIn) await loadDeliveries(activePracticeId, result.checkIn.id);
    else setDeliveries([]);
  }, [loadDeliveries, patientId]);

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
        createOnly: true,
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
    setMessage("Check-in created. Choose a delivery method when you are ready to send it.");
    if (result.checkIn) await loadDeliveries(practiceId, result.checkIn.id);
  }

  async function deliverCheckIn(action: "send" | "resend" | "regenerate", method = deliveryMethod) {
    if (!practiceId || !checkIn) return;
    setWorking(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/check-in-deliveries", {
      body: JSON.stringify({ action, checkinInstanceId: checkIn.id, method, practiceId, requestKey: crypto.randomUUID() }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = (await response.json()) as DeliveriesResponse;
    setWorking(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to deliver check-in");
      return;
    }
    if (result.publicUrl) {
      await copyPatientMessage(action === "resend" ? "checkin_reminder" : "checkin_invitation", result.publicUrl);
      setMessage(action === "regenerate" ? "A new secure link was generated and copied." : "Secure check-in invitation copied.");
    } else {
      setMessage(action === "resend" ? "Monthly check-in resent." : action === "regenerate" ? "Secure link regenerated and delivered." : "Monthly check-in sent.");
    }
    await loadCheckIn(practiceId, billingMonth);
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
            No check-in exists for this month. Create it, then send a secure link from the delivery panel.
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
                Create check-in
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
              This secure link is attached to this billing month and expires automatically.
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

      {checkIn ? <section className="rounded-md border bg-white p-4 text-black">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">Monthly check-in delivery</h2><p className="mt-1 text-sm text-slate-600">Send a secure mobile link and track its lifecycle.</p></div>{deliveries[0] ? <span className="rounded border bg-slate-50 px-2 py-1 text-xs font-semibold capitalize">{deliveries[0].status}</span> : null}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="text-sm"><span className="font-medium">Delivery method</span><select className="mt-1 block w-full rounded-md border px-3 py-2" onChange={(event) => setDeliveryMethod(event.target.value as "email" | "link")} value={deliveryMethod}><option value="email">Email{patient?.email ? ` to ${patient.email}` : " (email required)"}</option><option disabled value="sms">SMS (provider not configured)</option><option value="link">Secure link for manual delivery</option></select></label>
          <button className="button-primary" disabled={working || checkIn.status === "closed" || checkIn.status === "responded" || (deliveryMethod === "email" && !patient?.email)} onClick={() => deliverCheckIn(deliveries.length ? "resend" : "send")} type="button">{deliveries.length ? "Resend check-in" : "Send Monthly Check-In"}</button>
        </div>
        {deliveries[0] ? <div className="mt-4 flex flex-wrap gap-2"><button className="button-secondary" disabled={working || ["completed", "expired", "cancelled"].includes(deliveries[0].status)} onClick={() => deliverCheckIn("resend", deliveries[0].method === "sms" ? "link" : deliveries[0].method)} type="button">Resend</button><button className="button-secondary" disabled={working || ["completed", "cancelled"].includes(deliveries[0].status)} onClick={() => deliverCheckIn("regenerate", deliveries[0].method === "sms" ? "link" : deliveries[0].method)} type="button">Regenerate link</button></div> : null}
        <div className="mt-5"><h3 className="text-sm font-semibold">Delivery history</h3>{deliveries.length ? <div className="mt-2 divide-y border-y">{deliveries.map((delivery) => <div className="grid gap-1 py-3 text-sm sm:grid-cols-[7rem_8rem_1fr_auto] sm:items-center" key={delivery.id}><span className="capitalize">{delivery.status}</span><span className="capitalize text-slate-600">{delivery.method}</span><span className="text-slate-600">{delivery.destination_masked ?? "Secure link"}</span><span className="text-xs text-slate-500">{new Date(delivery.created_at).toLocaleString()}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-600">Not sent yet.</p>}</div>
      </section> : null}

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
