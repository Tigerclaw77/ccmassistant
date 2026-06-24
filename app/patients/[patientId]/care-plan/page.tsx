"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";
import type { CarePlan, CcmEnrollment, Patient } from "../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
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

export default function PatientCarePlanPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<CcmEnrollment | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [status, setStatus] = useState("active");
  const [goals, setGoals] = useState("");
  const [interventions, setInterventions] = useState("");
  const [barriers, setBarriers] = useState("");
  const [notes, setNotes] = useState("");
  const [lastReviewedDate, setLastReviewedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      const [patientResponse, carePlansResponse] = await Promise.all([
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
      ]);

      const patientResult = (await patientResponse.json()) as PatientResponse;
      const carePlansResult = (await carePlansResponse.json()) as CarePlansResponse;

      if (!patientResponse.ok || !patientResult.patient) {
        setError(patientResult.error ?? "Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientResult.patient);
      setEnrollment(patientResult.enrollment ?? null);

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
          isoToDateInput(selectedCarePlan.last_reviewed_at) || new Date().toISOString().slice(0, 10),
        );
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
      lastReviewedAt: lastReviewedDate ? new Date(`${lastReviewedDate}T12:00:00`).toISOString() : null,
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
    setMessage("Care plan updated.");
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { href: `/patients/${patientId}`, label: patient?.display_name ?? "Patient" },
          { label: "Care plan" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Care Plan</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name} - active care plans count toward monthly billability.
          </div>
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
        {!carePlan ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            No care plan exists yet. Add goals, interventions, barriers, and a reviewed date to make this patient-month eligible for billing.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Status</span>
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
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={lastReviewedDate}
              onChange={(event) => setLastReviewedDate(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Goals</span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder="One goal per line"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Interventions</span>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2"
              value={interventions}
              onChange={(event) => setInterventions(event.target.value)}
              placeholder="One intervention per line"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Barriers</span>
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
            {saving ? "Saving..." : "Save care plan"}
          </button>
          <Link className="text-sm underline" href={`/patients/${patientId}/checkin`}>
            Monthly check-in
          </Link>
          <Link className="text-sm underline" href={`/dashboard/log/${patientId}`}>
            Log time
          </Link>
        </div>
      </section>
    </main>
  );
}
