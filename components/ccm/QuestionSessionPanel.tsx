"use client";

import { useEffect, useState } from "react";
import type { AnswerValue } from "../../lib/ccm/question-bank/types";
import { getSessionQuestionViewById, type QuestionSessionPayload } from "../../lib/ccm/session-integration";
import type { SessionWorkflow } from "../../lib/ccm/session-engine/types";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import SessionQuestionInput from "./SessionQuestionInput";
import SessionReviewSummary from "./SessionReviewSummary";

type ApiResponse = {
  error?: string;
  session?: QuestionSessionPayload | null;
  validationErrors?: string[];
};

export default function QuestionSessionPanel({
  carePlanId,
  patientId,
  practiceId,
  title,
  workflow,
  onSessionChange,
}: {
  carePlanId?: string;
  patientId: string;
  practiceId: string;
  title: string;
  workflow: SessionWorkflow;
  onSessionChange?: (payload: QuestionSessionPayload | null) => void;
}) {
  const [payload, setPayload] = useState<QuestionSessionPayload | null>(null);
  const [answer, setAnswer] = useState<AnswerValue>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [correctionQuestionId, setCorrectionQuestionId] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  function sessionUrl() {
    const query = new URLSearchParams({ patientId, practiceId, workflow });
    if (carePlanId) query.set("carePlanId", carePlanId);
    return `/api/question-sessions?${query}`;
  }

  async function reloadSession() {
    const response = await fetch(sessionUrl(), { headers: await getSupabaseAuthHeaders() });
    const result = (await response.json()) as ApiResponse;
    if (!response.ok) setError(result.error ?? "Unable to load question session");
    else {
      setPayload(result.session ?? null);
      onSessionChange?.(result.session ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialSession() {
      const query = new URLSearchParams({ patientId, practiceId, workflow });
      if (carePlanId) query.set("carePlanId", carePlanId);
      const response = await fetch(`/api/question-sessions?${query}`, { headers: await getSupabaseAuthHeaders() });
      const result = (await response.json()) as ApiResponse;
      if (!active) return;
      if (!response.ok) setError(result.error ?? "Unable to load question session");
      else {
        setPayload(result.session ?? null);
        onSessionChange?.(result.session ?? null);
      }
      setLoading(false);
    }
    void loadInitialSession();
    return () => { active = false; };
  }, [carePlanId, onSessionChange, patientId, practiceId, workflow]);

  async function start() {
    setWorking(true); setError(null);
    const response = await fetch("/api/question-sessions", {
      body: JSON.stringify({ carePlanId, patientId, practiceId, workflow }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = (await response.json()) as ApiResponse;
    setWorking(false);
    if (!response.ok || !result.session) setError(result.error ?? "Unable to start question session");
    else {
      setPayload(result.session);
      onSessionChange?.(result.session);
    }
  }

  async function update(action: "answer" | "cancel" | "pause" | "resume" | "correct", answerOverride?: AnswerValue) {
    if (!payload) return;
    setWorking(true); setError(null);
    const response = await fetch("/api/question-sessions", {
      body: JSON.stringify({
        action,
        answer: action === "answer" || action === "correct" ? answerOverride ?? answer : undefined,
        correctionReason: action === "correct" ? correctionReason : undefined,
        practiceId,
        questionId: action === "answer" ? payload.currentQuestion?.questionId : action === "correct" ? correctionQuestionId : undefined,
        recordId: payload.recordId,
        stateVersion: payload.stateVersion,
      }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "PATCH",
    });
    const result = (await response.json()) as ApiResponse;
    setWorking(false);
    if (!response.ok || !result.session) {
      setError(result.validationErrors?.join(" ") ?? result.error ?? "Unable to update question session");
      if (response.status === 409) await reloadSession();
      return;
    }
    setPayload(result.session);
    onSessionChange?.(result.session);
    setAnswer(null);
    if (action === "correct") {
      setCorrectionQuestionId("");
      setCorrectionReason("");
    }
  }

  if (loading) return <section className="rounded-md border bg-white p-4 text-sm text-gray-600">Loading {title.toLowerCase()}...</section>;

  return (
    <section className="rounded-md border bg-white p-4 text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {payload ? <span className="text-sm capitalize text-gray-600">{payload.status}</span> : null}
      </div>
      {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {!payload ? (
        <button className="mt-4 rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={working} onClick={start}>
          {working ? "Starting..." : `Start ${title.toLowerCase()}`}
        </button>
      ) : payload.status === "completed" ? (
        <div className="mt-4 space-y-5">
          <SessionReviewSummary session={payload.session} />
          <div className="border-t pt-4">
            <label className="block space-y-1 text-sm"><span className="font-medium">Correct a completed answer</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => { setCorrectionQuestionId(event.target.value); setAnswer(null); }} value={correctionQuestionId}><option value="">Select question</option>{payload.session.completedQuestionIds.map((questionId) => <option key={questionId} value={questionId}>{getSessionQuestionViewById(payload.session, questionId)?.text ?? questionId}</option>)}</select></label>
            {correctionQuestionId && getSessionQuestionViewById(payload.session, correctionQuestionId as `ccm.${string}`) ? <div className="mt-3 space-y-3"><SessionQuestionInput onChange={setAnswer} question={getSessionQuestionViewById(payload.session, correctionQuestionId as `ccm.${string}`)!} value={answer} /><label className="block space-y-1 text-sm"><span className="font-medium">Correction reason</span><input className="w-full rounded-md border px-3 py-2" onChange={(event) => setCorrectionReason(event.target.value)} value={correctionReason} /></label><button className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60" disabled={working || correctionReason.trim().length < 8 || answer === null} onClick={() => update("correct")}>Save correction</button></div> : null}
          </div>
        </div>
      ) : payload.status === "cancelled" ? (
        <p className="mt-3 text-sm text-gray-600">Session cancelled.</p>
      ) : payload.status === "paused" ? (
        <button className="mt-4 rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={working} onClick={() => update("resume")}>Resume</button>
      ) : payload.currentQuestion ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <div><div className="text-xs text-gray-600">Overall progress</div><div className="font-medium">{payload.session.progress.completionPercentage}%</div></div>
            <div><div className="text-xs text-gray-600">Current section</div><div className="font-medium">{payload.currentQuestion.currentSection}</div></div>
            <div><div className="text-xs text-gray-600">Questions remaining</div><div className="font-medium">{payload.session.progress.requiredQuestionsRemaining + payload.session.progress.optionalQuestionsRemaining}</div></div>
            <div><div className="text-xs text-gray-600">Estimated completion</div><div className="font-medium">{payload.session.progress.estimatedMinutesRemaining} min</div></div>
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">{payload.currentQuestion.text}{payload.currentQuestion.required ? " *" : ""}</span>
            <span className="block text-xs text-gray-600">{payload.currentQuestion.helperText}</span>
            <SessionQuestionInput onChange={setAnswer} onCommit={(value) => update("answer", value)} question={payload.currentQuestion} value={answer} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={working} onClick={() => update("answer")}>{working ? "Saving..." : "Continue"}</button>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={working} onClick={() => update("pause")}>Pause</button>
            <button className="text-sm underline" disabled={working} onClick={() => update("cancel")}>Cancel</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
