"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ActivityType, CcmWorkItem } from "../../lib/ccm/types";
import { calendarDateInTimeZone } from "../../lib/ccm/validation";
import { getSupabaseAuthHeaders } from "../../lib/supabase";

type CoordinatorAction = "complete" | "defer" | "route_provider";

type WorkItemWorkspaceProps = {
  item: CcmWorkItem;
  onCancel: () => void;
  patientId: string;
  practiceId: string;
  practiceTimeZone: string;
};

const ACTIVITY_OPTIONS: Array<{ label: string; value: ActivityType }> = [
  { label: "Call", value: "call" },
  { label: "Voicemail", value: "voicemail" },
  { label: "Failed attempt", value: "failed_attempt" },
  { label: "Care review", value: "care_review" },
  { label: "Care coordination", value: "care_coordination" },
  { label: "Check-in review", value: "checkin_review" },
  { label: "Portal message", value: "portal_message" },
  { label: "Documentation", value: "documentation" },
  { label: "Other", value: "other" },
];

const TIME_OPTIONS = [["none", "No time to record"], ["1", "1 minute"], ["2", "2 minutes"], ["custom", "Custom"]] as const;

export default function WorkItemWorkspace({ item, onCancel, patientId, practiceId, practiceTimeZone }: WorkItemWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const practiceToday = calendarDateInTimeZone(new Date(), practiceTimeZone);
  const [action, setAction] = useState<CoordinatorAction>("complete");
  const [activityType, setActivityType] = useState<ActivityType>("care_coordination");
  const [affirmed, setAffirmed] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState(practiceToday);
  const [outcome, setOutcome] = useState("");
  const [timeChoice, setTimeChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const documentedOutcome = outcome.trim();
    const actualMinutes = timeChoice === "none" ? null : timeChoice === "custom" ? Number(customMinutes) : Number(timeChoice);
    if (documentedOutcome.length < 8) {
      setError("Document the work outcome using at least 8 characters.");
      return;
    }
    if (!timeChoice) {
      setError("Confirm whether any actual time should be documented.");
      return;
    }
    if (actualMinutes !== null && (!Number.isInteger(actualMinutes) || actualMinutes < 1 || actualMinutes > 480)) {
      setError("Actual time must be a whole number from 1 to 480 minutes.");
      return;
    }
    if (actualMinutes !== null && !affirmed) {
      setError("Affirm that the entered minutes are actual time you personally spent.");
      return;
    }
    if (action === "defer" && !followUpDate) {
      setError("Choose the follow-up date for deferred work.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (actualMinutes !== null) {
        requestIdRef.current ??= crypto.randomUUID();
        const timeResponse = await fetch("/api/interaction-logs", {
          body: JSON.stringify({
            activityType,
            actualTimeAffirmed: true,
            minutes: actualMinutes,
            notes: documentedOutcome,
            occurrenceDate,
            patientId,
            practiceId,
            requestId: requestIdRef.current,
            source: "care_coordination",
            workItemId: item.id,
          }),
          headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
          method: "POST",
        });
        const timeResult = await timeResponse.json() as { error?: string };
        if (!timeResponse.ok) throw new Error(timeResult.error ?? "Unable to document actual time");
      }

      if (action === "route_provider") {
        const routeResponse = await fetch("/api/clinical-reports", {
          body: JSON.stringify({
            conditionOrWorkflowItem: item.title,
            deliveryMethod: "secure_workspace",
            patientId,
            practiceId,
            purpose: documentedOutcome,
            recipientType: "primary_responsible_provider",
            workItemId: item.id,
          }),
          headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
          method: "POST",
        });
        const routeResult = await routeResponse.json() as { error?: string };
        if (!routeResponse.ok) throw new Error(routeResult.error ?? "Unable to route work to the Primary Responsible Provider");
      }

      const status = action === "complete" ? "completed" : action === "route_provider" ? "awaiting_provider" : "deferred";
      const workResponse = await fetch(`/api/work-items/${item.id}`, {
        body: JSON.stringify({
          dueAt: action === "defer" ? `${followUpDate}T12:00:00.000Z` : undefined,
          outcome: documentedOutcome,
          practiceId,
          status,
        }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "PATCH",
      });
      const workResult = await workResponse.json() as { error?: string };
      if (!workResponse.ok) throw new Error(workResult.error ?? "Unable to update the work item");

      requestIdRef.current = null;
      const next = new URLSearchParams(searchParams.toString());
      next.set("completedPatient", patientId);
      next.set("completedWorkItem", item.id);
      next.set("workTransition", action);
      router.replace(`/dashboard/worklist?${next.toString()}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish this coordinator step");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 space-y-4 border-t pt-4" onSubmit={submit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Perform → Document → Route or complete</p>
        <h4 className="mt-1 font-semibold text-slate-950">Work this task here</h4>
        <p className="mt-1 text-xs leading-5 text-slate-600">Complete the appropriate care activity, document what actually happened, and record only actual time personally spent.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div> : null}

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Outcome</span>
        <textarea className="min-h-24 w-full rounded-md border px-3 py-2" minLength={8} onChange={(event) => setOutcome(event.target.value)} placeholder="Describe the work performed and the patient or care-team outcome." required value={outcome} />
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Actual time</legend>
        <p className="text-xs text-slate-600">Select “No time to record” when this step did not involve separately documentable CCM work.</p>
        <div className="flex flex-wrap gap-3">
          {TIME_OPTIONS.map(([value, label]) => (
            <label className="flex items-center gap-1.5" key={value}><input checked={timeChoice === value} name={`work-time-${item.id}`} onChange={() => { setTimeChoice(value); if (value === "none") setAffirmed(false); }} type="radio" /> {label}</label>
          ))}
        </div>
      </fieldset>

      {timeChoice && timeChoice !== "none" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {timeChoice === "custom" ? <label className="space-y-1 text-sm"><span className="font-medium">Actual minutes</span><input className="w-full rounded-md border px-3 py-2" max="480" min="1" onChange={(event) => setCustomMinutes(event.target.value)} required step="1" type="number" value={customMinutes} /></label> : <div className="text-sm"><span className="font-medium">Actual minutes</span><div className="mt-1 rounded-md border bg-slate-50 px-3 py-2">{timeChoice}</div></div>}
          <label className="space-y-1 text-sm"><span className="font-medium">Activity</span><select className="w-full rounded-md border px-3 py-2" onChange={(event) => setActivityType(event.target.value as ActivityType)} value={activityType}>{ACTIVITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span className="font-medium">Date performed</span><input className="w-full rounded-md border px-3 py-2" max={practiceToday} onChange={(event) => setOccurrenceDate(event.target.value)} required type="date" value={occurrenceDate} /></label>
          <label className="flex items-start gap-2 text-sm sm:col-span-3"><input checked={affirmed} className="mt-1" onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" /><span>I affirm these are the actual minutes I personally spent performing and documenting this work.</span></label>
        </div>
      ) : null}

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Finish this coordinator step</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className={`border p-3 ${action === "complete" ? "border-teal-700 bg-teal-50" : "bg-white"}`}><input checked={action === "complete"} className="mr-2" name={`work-action-${item.id}`} onChange={() => setAction("complete")} type="radio" />Complete task</label>
          <label className={`border p-3 ${action === "route_provider" ? "border-teal-700 bg-teal-50" : "bg-white"}`}><input checked={action === "route_provider"} className="mr-2" name={`work-action-${item.id}`} onChange={() => setAction("route_provider")} type="radio" />Route to PRP</label>
          <label className={`border p-3 ${action === "defer" ? "border-teal-700 bg-teal-50" : "bg-white"}`}><input checked={action === "defer"} className="mr-2" name={`work-action-${item.id}`} onChange={() => setAction("defer")} type="radio" />Defer with follow-up</label>
        </div>
      </fieldset>

      {action === "route_provider" ? <p className="rounded-md border bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">This creates a secure workspace report for the task&apos;s Primary Responsible Provider and moves the task to Awaiting Provider. Patient ownership does not change.</p> : null}
      {action === "defer" ? <label className="block max-w-xs space-y-1 text-sm"><span className="font-medium">Follow-up date</span><input className="w-full rounded-md border px-3 py-2" min={practiceToday} onChange={(event) => setFollowUpDate(event.target.value)} required type="date" value={followUpDate} /></label> : null}

      <div className="flex flex-wrap gap-2">
        <button className="button-primary" disabled={busy} type="submit">{busy ? "Saving…" : action === "complete" ? "Complete and return to My Work Today" : "Save and return to My Work Today"}</button>
        <button className="button-secondary" disabled={busy} onClick={onCancel} type="button">Cancel</button>
      </div>
    </form>
  );
}
