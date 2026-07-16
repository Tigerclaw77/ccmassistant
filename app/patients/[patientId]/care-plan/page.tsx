"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import QuestionSessionPanel from "../../../../components/ccm/QuestionSessionPanel";
import type { QuestionSessionPayload } from "../../../../lib/ccm/session-integration";
import { buildCarePlanSuggestions, mergeCarePlanText } from "../../../../lib/ccm/care-plan-review";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import { calendarDateInTimeZone } from "../../../../lib/ccm/validation";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type {
  CarePlan,
  CcmEnrollment,
  JsonValue,
  Patient,
  PatientIntakeSummary,
} from "../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    default_timezone: string;
    id: string;
  };
};

type PatientResponse = {
  enrollment?: CcmEnrollment | null;
  error?: string;
  patient?: Patient;
};

type CarePlansResponse = {
  carePlan?: CarePlan;
  carePlans?: CarePlan[];
  error?: string;
};

type IntakeResponse = {
  latestAccepted?: PatientIntakeSummary | null;
};

function listToText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map(String).join("\n");
}

function textToList(value: string): string[] {
  return value
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isoToDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function intakeSummaryText(intake: PatientIntakeSummary | null): string {
  const summary = jsonObject(intake?.reviewed_summary ?? intake?.draft_summary);
  const values = [
    summary.patient_overview,
    summary.chronic_conditions,
    summary.medications,
    summary.care_needs,
    summary.documentation_notes,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return values.join("\n");
}

export default function PatientCarePlanPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<CcmEnrollment | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [intakeSummary, setIntakeSummary] = useState<PatientIntakeSummary | null>(null);
  const [status, setStatus] = useState("active");
  const [goals, setGoals] = useState("");
  const [interventions, setInterventions] = useState("");
  const [barriers, setBarriers] = useState("");
  const [notes, setNotes] = useState("");
  const [lastReviewedDate, setLastReviewedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const month = searchParams.get("month") ?? currentMonthValue();
  const context = useMemo(() => ({ month: normalizeBillingMonth(month), source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [month, searchParams]);
  const handleSessionChange = useCallback((payload: QuestionSessionPayload | null) => {
    if (payload?.session.status !== "completed") return;
    const suggestions = buildCarePlanSuggestions(intakeSummary, payload.session);
    setGoals((current) => mergeCarePlanText(current, suggestions.goals));
    setInterventions((current) => mergeCarePlanText(current, suggestions.interventions));
    setBarriers((current) => mergeCarePlanText(current, suggestions.barriers));
    setNotes((current) => mergeCarePlanText(current, suggestions.notes));
  }, [intakeSummary]);

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

      const [patientResponse, carePlansResponse, intakeResponse] = await Promise.all([
        fetch(
          `/api/patients?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
        fetch(
          `/api/care-plans?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
        fetch(
          `/api/patient-intake?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
      ]);

      const patientResult = (await patientResponse.json()) as PatientResponse;
      const carePlansResult = (await carePlansResponse.json()) as CarePlansResponse;
      const intakeResult = (await intakeResponse.json()) as IntakeResponse;

      if (!patientResponse.ok || !patientResult.patient) {
        setError(patientResult.error ?? "Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientResult.patient);
      setEnrollment(patientResult.enrollment ?? null);
      setIntakeSummary(intakeResult.latestAccepted ?? null);

      const selectedCarePlan =
        (carePlansResult.carePlans ?? []).find((plan) => plan.status === "active") ??
        carePlansResult.carePlans?.[0] ??
        null;

      if (selectedCarePlan) {
        setCarePlan(selectedCarePlan);
        setStatus(selectedCarePlan.status);
        setGoals(listToText(selectedCarePlan.goals));
        setInterventions(listToText(selectedCarePlan.interventions));
        setBarriers(listToText(selectedCarePlan.barriers));
        setNotes(selectedCarePlan.notes ?? "");
        setLastReviewedDate(
          isoToDateInput(selectedCarePlan.last_reviewed_at) || practiceToday,
        );
      } else {
        setLastReviewedDate(practiceToday);
        const suggestions = buildCarePlanSuggestions(intakeResult.latestAccepted ?? null, null);
        setNotes(mergeCarePlanText("", suggestions.notes));
      }

      setLoading(false);
    }

    void load();
  }, [patientId]);

  async function saveCarePlan() {
    if (!practiceId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      barriers: textToList(barriers),
      carePlanId: carePlan?.id,
      enrollmentId: enrollment?.id,
      goals: textToList(goals),
      interventions: textToList(interventions),
      lastReviewedDate: lastReviewedDate || null,
      notes,
      patientId,
      practiceId,
      providerId: enrollment?.assigned_provider_id ?? patient?.primary_provider_id,
      status,
    };

    const response = await fetch("/api/care-plans", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: carePlan ? "PATCH" : "POST",
    });
    const result = (await response.json()) as CarePlansResponse;
    setSaving(false);

    if (!response.ok || !result.carePlan) {
      setError(result.error ?? "Unable to save care plan");
      return;
    }

    setCarePlan(result.carePlan);
    setMessage("Care plan updated for billing review.");
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { href: withCoordinatorContext(`/patients/${patientId}`, context), label: patient?.display_name ?? "Patient" },
          { label: "Care plan" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Care Plan</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name} - an active, reviewed care plan supports monthly CCM billing evidence.
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
        <div className="mb-3">
          <h2 className="text-base font-semibold">Reviewed intake context</h2>
          <p className="mt-1 text-sm text-gray-600">
            Accepted intake content can help staff draft care-plan notes, but the care plan remains editable.
          </p>
        </div>
        {intakeSummary ? (
          <div className="space-y-3 text-sm">
            <div className="whitespace-pre-wrap text-gray-700">
              {intakeSummaryText(intakeSummary)}
            </div>
            <div className="text-xs text-gray-600">Relevant intake findings are included in the editable care-plan draft without overwriting the saved plan.</div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No accepted intake summary yet. Complete AI intake before using it as care-plan context.
          </div>
        )}
      </section>

      {practiceId && carePlan ? (
        <QuestionSessionPanel
          carePlanId={carePlan.id}
          patientId={patientId}
          practiceId={practiceId}
          title="Care plan review"
          workflow="care_plan_review"
          onSessionChange={handleSessionChange}
        />
      ) : null}

      <section className="rounded-md border bg-white p-4 text-black">
        {!carePlan ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            No care plan exists yet. Add goals, interventions, barriers, and a reviewed date to make this patient-month eligible for billing.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Status</span>
            <span className="block text-xs text-gray-600">
              Active care plans can support monthly billing review.
            </span>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Last reviewed date</span>
            <span className="block text-xs text-gray-600">
              This documents when the plan was reviewed for the current care-management workflow.
            </span>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={lastReviewedDate}
              onChange={(event) => setLastReviewedDate(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Goals</span>
            <span className="block text-xs text-gray-600">
              Goals explain what the care team is working toward.
            </span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder="One goal per line"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Interventions</span>
            <span className="block text-xs text-gray-600">
              Interventions document the care-management actions planned for this patient.
            </span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              value={interventions}
              onChange={(event) => setInterventions(event.target.value)}
              placeholder="One intervention per line"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Barriers</span>
            <span className="block text-xs text-gray-600">
              Barriers help explain risks, follow-up needs, and patient support needs.
            </span>
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2"
              value={barriers}
              onChange={(event) => setBarriers(event.target.value)}
              placeholder="One barrier per line"
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
            onClick={saveCarePlan}
            disabled={saving}
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Review and save care plan"}
          </button>
          <Link className="text-sm underline" href={withCoordinatorContext(`/patients/${patientId}/checkin`, context)}>
            Monthly check-in
          </Link>
          <Link className="text-sm underline" href={withCoordinatorContext(`/dashboard/log/${patientId}?activity=care_review`, context)}>
            Log time
          </Link>
        </div>
      </section>
    </main>
  );
}
