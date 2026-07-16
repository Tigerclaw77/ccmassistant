"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import QuestionSessionPanel from "../../../../components/ccm/QuestionSessionPanel";
import type { QuestionSessionPayload } from "../../../../lib/ccm/session-integration";
import {
  buildIntakeSessionPreview,
  INTAKE_SUMMARY_FIELDS,
  type IntakeManualCorrections,
  type IntakeSummaryField,
} from "../../../../lib/ccm/intake-session-summary";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import type { Patient, PatientCondition, PatientIntakeSummary } from "../../../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";

type ActivePracticeResponse = { error?: string; practice?: { id: string } };
type PatientResponse = { error?: string; patient?: Patient };
type ConditionsResponse = { conditions?: PatientCondition[]; error?: string };
type IntakeResponse = { error?: string; intake?: PatientIntakeSummary; latestAccepted?: PatientIntakeSummary | null };

const LABELS: Record<IntakeSummaryField, string> = {
  care_needs: "Care needs or concerns",
  chronic_conditions: "Chronic conditions",
  documentation_notes: "Clinical documentation",
  medications: "Medication information",
  patient_overview: "Patient overview",
};

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default function IntakePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [conditions, setConditions] = useState<PatientCondition[]>([]);
  const [accepted, setAccepted] = useState<PatientIntakeSummary | null>(null);
  const [sessionPayload, setSessionPayload] = useState<QuestionSessionPayload | null>(null);
  const [corrections, setCorrections] = useState<IntakeManualCorrections>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const month = searchParams.get("month") ?? currentMonthValue();
  const context = useMemo(() => ({ month: normalizeBillingMonth(month), source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [month, searchParams]);

  const handleSessionChange = useCallback((payload: QuestionSessionPayload | null) => setSessionPayload(payload), []);
  const preview = useMemo(() => {
    if (!patient || sessionPayload?.session.status !== "completed") return null;
    return buildIntakeSessionPreview(sessionPayload.session, patient, conditions, corrections);
  }, [conditions, corrections, patient, sessionPayload]);

  const loadAccepted = useCallback(async (activePracticeId: string) => {
    const response = await fetch(`/api/patient-intake?practiceId=${encodeURIComponent(activePracticeId)}&patientId=${encodeURIComponent(patientId)}`, { headers: await getSupabaseAuthHeaders() });
    const result = (await response.json()) as IntakeResponse;
    if (!response.ok) throw new Error(result.error ?? "Unable to load intake");
    setAccepted(result.latestAccepted ?? null);
  }, [patientId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = localStorage.getItem("activePracticeId");
        const practiceResponse = await fetch("/api/practices/active", { headers: { ...(await getSupabaseAuthHeaders()), ...(stored ? { "x-active-practice-id": stored } : {}) } });
        const practiceResult = (await practiceResponse.json()) as ActivePracticeResponse;
        if (!practiceResponse.ok || !practiceResult.practice) throw new Error(practiceResult.error ?? "No active practice found");
        const activePracticeId = practiceResult.practice.id;
        const [patientResponse, conditionsResponse] = await Promise.all([
          fetch(`/api/patients?practiceId=${encodeURIComponent(activePracticeId)}&patientId=${encodeURIComponent(patientId)}`, { headers: await getSupabaseAuthHeaders() }),
          fetch(`/api/patient-conditions?practiceId=${encodeURIComponent(activePracticeId)}&patientId=${encodeURIComponent(patientId)}`, { headers: await getSupabaseAuthHeaders() }),
        ]);
        const patientResult = (await patientResponse.json()) as PatientResponse;
        const conditionsResult = (await conditionsResponse.json()) as ConditionsResponse;
        if (!patientResponse.ok || !patientResult.patient) throw new Error(patientResult.error ?? "Patient not found");
        if (!conditionsResponse.ok) throw new Error(conditionsResult.error ?? "Unable to load conditions");
        if (!active) return;
        localStorage.setItem("activePracticeId", activePracticeId);
        setPracticeId(activePracticeId);
        setPatient(patientResult.patient);
        setConditions(conditionsResult.conditions ?? []);
        await loadAccepted(activePracticeId);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load intake");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [loadAccepted, patientId]);

  async function completeIntake() {
    if (!practiceId || !sessionPayload || !preview) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/patient-intake", {
      body: JSON.stringify({ manualCorrections: corrections, patientId, practiceId, sourceQuestionSessionId: sessionPayload.recordId }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = (await response.json()) as IntakeResponse;
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to complete intake");
      return;
    }
    setAccepted(result.intake ?? null);
    setMessage("Intake completed from the reviewed question session.");
  }

  if (loading) return <main className="p-6 text-sm text-gray-600">Loading intake...</main>;

  const acceptedSummary = jsonObject(accepted?.reviewed_summary ?? accepted?.draft_summary);
  return (
    <main className="max-w-4xl space-y-5 p-6">
      <Breadcrumbs items={[{ href: "/patients", label: "Patients" }, { href: withCoordinatorContext(`/patients/${patientId}`, context), label: patient?.display_name ?? "Patient" }, { label: "Intake" }]} />
      <div><h1 className="text-xl font-semibold">Patient Intake</h1><div className="text-sm text-gray-600">{patient?.display_name} - deterministic intake review</div></div>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div> : null}

      {practiceId ? <QuestionSessionPanel onSessionChange={handleSessionChange} patientId={patientId} practiceId={practiceId} title="Intake questions" workflow="intake" /> : null}

      {accepted ? (
        <section className="rounded-md border bg-white p-4 text-black">
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Accepted intake</h2><span className="text-sm text-green-700">Complete</span></div>
          <div className="mt-4 grid gap-4">
            {INTAKE_SUMMARY_FIELDS.map((field) => acceptedSummary[field] ? <div key={field}><div className="text-sm font-medium">{LABELS[field]}</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{String(acceptedSummary[field])}</div></div> : null)}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm"><Link className="underline" href={withCoordinatorContext(`/patients/${patientId}/care-plan`, context)}>Continue to care plan</Link><Link className="underline" href={withCoordinatorContext(`/dashboard/log/${patientId}?activity=care_review`, context)}>Log intake time</Link></div>
        </section>
      ) : preview ? (
        <section className="rounded-md border bg-white p-4 text-black">
          <h2 className="text-base font-semibold">Complete intake</h2>
          <p className="mt-1 text-sm text-gray-600">The session supplies the intake record. Enter only missing or corrected information.</p>
          {preview.incompleteFields.length ? <div className="mt-4 grid gap-4">{preview.incompleteFields.map((field) => <label className="space-y-1 text-sm" key={field}><span className="font-medium">{LABELS[field]}</span><textarea className="min-h-20 w-full rounded-md border px-3 py-2" onChange={(event) => setCorrections((current) => ({ ...current, [field]: event.target.value }))} value={corrections[field] ?? ""} /></label>)}</div> : <div className="mt-4 text-sm text-green-700">No incomplete intake fields.</div>}
          <button className="mt-4 rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={saving} onClick={completeIntake}>{saving ? "Completing..." : "Complete intake"}</button>
        </section>
      ) : null}
    </main>
  );
}
