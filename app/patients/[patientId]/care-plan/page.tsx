"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import QuestionSessionPanel from "../../../../components/ccm/QuestionSessionPanel";
import LoadingState from "../../../../components/ui/LoadingState";
import type { QuestionSessionPayload } from "../../../../lib/ccm/session-integration";
import { buildCarePlanSuggestions, mergeCarePlanText } from "../../../../lib/ccm/care-plan-review";
import { CARE_PLAN_REVIEW_LABELS, type CarePlanReviewAction } from "../../../../lib/ccm/care-plan-workflow";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type {
  CarePlan,
  CarePlanReview,
  CcmEnrollment,
  JsonValue,
  Patient,
  PatientIntakeSummary,
  PracticeRole,
} from "../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  membership?: { role: PracticeRole };
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
  const [memberRole, setMemberRole] = useState<PracticeRole | null>(null);
  const [reviewHistory, setReviewHistory] = useState<CarePlanReview[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [goals, setGoals] = useState("");
  const [interventions, setInterventions] = useState("");
  const [barriers, setBarriers] = useState("");
  const [notes, setNotes] = useState("");
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
      setMemberRole(activeResult.membership?.role ?? null);

      const [patientResponse, carePlansResponse, intakeResponse, reviewsResponse] = await Promise.all([
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
        fetch(`/api/care-plan-reviews?practiceId=${encodeURIComponent(activeResult.practice.id)}&patientId=${encodeURIComponent(patientId)}`, { headers: await getSupabaseAuthHeaders() }),
      ]);

      const patientResult = (await patientResponse.json()) as PatientResponse;
      const carePlansResult = (await carePlansResponse.json()) as CarePlansResponse;
      const intakeResult = (await intakeResponse.json()) as IntakeResponse;
      const reviewsResult = (await reviewsResponse.json()) as { reviews?: CarePlanReview[] };

      if (!patientResponse.ok || !patientResult.patient) {
        setError(patientResult.error ?? "Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientResult.patient);
      setEnrollment(patientResult.enrollment ?? null);
      setIntakeSummary(intakeResult.latestAccepted ?? null);
      setReviewHistory(reviewsResult.reviews ?? []);

      const selectedCarePlan = carePlansResult.carePlans?.[0] ?? null;

      if (selectedCarePlan) {
        setCarePlan(selectedCarePlan);
        setGoals(listToText(selectedCarePlan.goals));
        setInterventions(listToText(selectedCarePlan.interventions));
        setBarriers(listToText(selectedCarePlan.barriers));
        setNotes(selectedCarePlan.notes ?? "");
      } else {
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
      notes,
      patientId,
      practiceId,
      providerId: enrollment?.assigned_provider_id ?? patient?.primary_provider_id,
      status: carePlan ? undefined : "draft",
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
    setMessage(result.carePlan.review_status === "draft" ? "Care-plan draft saved." : "Care plan saved.");
  }

  async function updateReview(action: CarePlanReviewAction) {
    if (!practiceId || !carePlan) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/care-plan-reviews", {
      body: JSON.stringify({ action, carePlanId: carePlan.id, comments: reviewComment, practiceId }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = (await response.json()) as CarePlansResponse;
    setSaving(false);
    if (!response.ok || !result.carePlan) {
      setError(result.error ?? "Unable to update provider review");
      return;
    }
    setCarePlan(result.carePlan);
    setReviewComment("");
    setMessage(action === "approve" ? "Care plan approved." : action === "request_changes" ? "Changes requested from the coordinator." : action === "submit" ? "Sent to the provider for review." : "Care plan marked coordinator ready.");
    const historyResponse = await fetch(`/api/care-plan-reviews?practiceId=${encodeURIComponent(practiceId)}&patientId=${encodeURIComponent(patientId)}`, { headers: await getSupabaseAuthHeaders() });
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      setReviewHistory(history.reviews ?? []);
    }
  }

  if (loading) {
    return <main className="page-shell"><LoadingState label="Loading care plan" /></main>;
  }

  const canCoordinateReview = memberRole === "owner" || memberRole === "admin" || memberRole === "coordinator";
  const canProviderReview = memberRole === "owner" || memberRole === "provider";

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
            No care plan exists yet. Save the draft, complete coordinator review, and submit it for provider approval.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border bg-slate-50 p-3 text-sm"><div className="text-xs font-medium text-slate-600">Review status</div><div className="mt-1 font-semibold text-slate-950">{carePlan ? CARE_PLAN_REVIEW_LABELS[carePlan.review_status] : "Draft"}</div>{carePlan?.review_comments ? <div className="mt-2 text-amber-800">{carePlan.review_comments}</div> : null}</div>
          <div className="rounded-md border bg-slate-50 p-3 text-sm"><div className="text-xs font-medium text-slate-600">Version</div><div className="mt-1 font-semibold text-slate-950">{carePlan?.version ?? 1}</div><div className="mt-1 text-xs text-slate-600">{carePlan?.approved_at ? `Approved ${new Date(carePlan.approved_at).toLocaleString()}` : "Not yet approved"}</div></div>

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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={saveCarePlan}
            disabled={saving}
            className="button-primary"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          {carePlan && canCoordinateReview && ["draft", "revision_requested"].includes(carePlan.review_status) ? <button className="button-secondary" disabled={saving} onClick={() => updateReview("coordinator_ready")} type="button">Mark coordinator ready</button> : null}
          {carePlan && canCoordinateReview && carePlan.review_status === "coordinator_ready" ? <button className="button-secondary" disabled={saving} onClick={() => updateReview("submit")} type="button">Submit for provider review</button> : null}
          <Link className="text-sm underline" href={withCoordinatorContext(`/patients/${patientId}/checkin`, context)}>
            Monthly check-in
          </Link>
          <Link className="text-sm underline" href={withCoordinatorContext(`/dashboard/log/${patientId}?activity=care_review`, context)}>
            Log time
          </Link>
        </div>
      </section>

      {carePlan && canProviderReview && carePlan.review_status === "provider_review_required" ? <section className="rounded-md border border-teal-200 bg-teal-50 p-4 text-black"><h2 className="font-semibold">Provider review required</h2><p className="mt-1 text-sm text-slate-700">Review the current care-plan version, then approve it or return it with specific changes.</p><label className="mt-4 block text-sm"><span className="font-medium">Provider comments</span><textarea className="mt-1 min-h-24 w-full rounded-md border bg-white px-3 py-2" onChange={(event) => setReviewComment(event.target.value)} value={reviewComment} /></label><div className="mt-3 flex flex-wrap gap-2"><button className="button-primary" disabled={saving} onClick={() => updateReview("approve")} type="button">Approve care plan</button><button className="button-secondary" disabled={saving || reviewComment.trim().length < 3} onClick={() => updateReview("request_changes")} type="button">Request coordinator changes</button></div></section> : null}

      {reviewHistory.length ? <section className="rounded-md border bg-white p-4 text-black"><h2 className="font-semibold">Approval history</h2><div className="mt-3 space-y-3">{reviewHistory.map((review) => <div className="border-t pt-3 text-sm first:border-t-0 first:pt-0" key={review.id}><div className="flex flex-wrap justify-between gap-2"><span className="font-medium capitalize">{review.decision.replaceAll("_", " ")} · Version {review.care_plan_version}</span><span className="text-slate-600">{new Date(review.created_at).toLocaleString()}</span></div>{review.comments ? <p className="mt-1 text-slate-700">{review.comments}</p> : null}</div>)}</div></section> : null}
    </main>
  );
}
