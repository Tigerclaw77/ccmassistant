"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import {
  REQUIRED_ELIGIBILITY_FACTS,
  REQUIRED_PROVIDER_ATTESTATIONS,
  eligibilityFactsFromMetadata,
  providerAttestationsFromMetadata,
  type EligibilityFactKey,
  type EligibilityFactState,
  type ProviderAttestationKey,
  type ProviderAttestationState,
} from "../../../../lib/ccm/eligibility";
import type { EnrollmentMutationRequest } from "../../../../lib/ccm/enrollment-contract";
import { statusLabel } from "../../../../lib/ccm/labels";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../../../lib/ccm/month-context";
import type { CcmEnrollment, Patient, PatientCondition } from "../../../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../../../lib/supabase";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
  membership?: { role: string };
};

type PatientResponse = {
  enrollment?: CcmEnrollment | null;
  error?: string;
  patient?: Patient;
};

type ConditionsResponse = {
  conditions?: PatientCondition[];
  error?: string;
};

type EnrollmentResponse = {
  enrollment?: CcmEnrollment;
  error?: string;
};

function statusClass(ok: boolean) {
  return ok
    ? "border-green-200 bg-green-50 text-green-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

export default function PatientEligibilityPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<CcmEnrollment | null>(null);
  const [conditions, setConditions] = useState<PatientCondition[]>([]);
  const [facts, setFacts] = useState<EligibilityFactState>(() =>
    eligibilityFactsFromMetadata(null),
  );
  const [providerAttestations, setProviderAttestations] =
    useState<ProviderAttestationState>(() => providerAttestationsFromMetadata(null));
  const [eligibilityNotes, setEligibilityNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberRole, setMemberRole] = useState("");
  const month = searchParams.get("month") ?? currentMonthValue();
  const context = useMemo(() => ({ month: normalizeBillingMonth(month), source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [month, searchParams]);
  const canAttest = ["owner", "admin", "provider"].includes(memberRole);

  const activeConditionCount = conditions.filter(
    (condition) => condition.is_active && condition.ccm_qualifying,
  ).length;
  const hasAssignedProvider = Boolean(
    enrollment?.assigned_provider_id ?? patient?.primary_provider_id,
  );
  const factsComplete = REQUIRED_ELIGIBILITY_FACTS.every((fact) => facts[fact.key]);
  const attestationsComplete = REQUIRED_PROVIDER_ATTESTATIONS.every(
    (attestation) => providerAttestations[attestation.key],
  );
  const systemComplete = activeConditionCount >= 2 && hasAssignedProvider;
  const completionStatus = factsComplete && attestationsComplete && systemComplete;

  const nextStatus = useMemo(
    () => (completionStatus ? "eligible" : "needs_review"),
    [completionStatus],
  );

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
      setMemberRole(activeResult.membership?.role ?? "");

      const [patientResponse, conditionsResponse] = await Promise.all([
        fetch(
          `/api/patients?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
        fetch(
          `/api/patient-conditions?practiceId=${encodeURIComponent(
            activeResult.practice.id,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
      ]);
      const patientResult = (await patientResponse.json()) as PatientResponse;
      const conditionsResult = (await conditionsResponse.json()) as ConditionsResponse;

      if (!patientResponse.ok || !patientResult.patient) {
        setError(patientResult.error ?? "Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientResult.patient);
      setEnrollment(patientResult.enrollment ?? null);
      setFacts(eligibilityFactsFromMetadata(patientResult.enrollment?.eligibility_metadata));
      setProviderAttestations(
        providerAttestationsFromMetadata(patientResult.enrollment?.eligibility_metadata),
      );
      setEligibilityNotes(patientResult.enrollment?.eligibility_notes ?? "");
      setConditions(conditionsResult.conditions ?? []);
      setLoading(false);
    }

    void load();
  }, [patientId]);

  function updateFact(key: EligibilityFactKey, checked: boolean) {
    setFacts((current) => ({ ...current, [key]: checked }));
  }

  function updateProviderAttestation(key: ProviderAttestationKey, checked: boolean) {
    setProviderAttestations((current) => ({ ...current, [key]: checked }));
  }

  async function saveEligibility(continueToIntake = false) {
    if (!practiceId || !patient) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      assignedProviderId: enrollment?.assigned_provider_id ?? patient.primary_provider_id,
      eligibilityFacts: facts,
      eligibilityNotes,
      eligibilityStatus: nextStatus,
      enrollmentId: enrollment?.id,
      patientId,
      practiceId,
      ...(canAttest ? { providerAttestations } : {}),
      status: enrollment?.status ?? "pending",
    } satisfies EnrollmentMutationRequest;

    const response = await fetch("/api/enroll", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: enrollment?.id ? "PATCH" : "POST",
    });
    const result = (await response.json()) as EnrollmentResponse;
    setSaving(false);

    if (!response.ok || !result.enrollment) {
      setError(result.error ?? "Unable to save eligibility review");
      return;
    }

    setEnrollment(result.enrollment);
    setMessage(
      nextStatus === "eligible"
        ? "Eligibility complete."
        : "Eligibility saved as Needs Review.",
    );
    if (continueToIntake) router.push(withCoordinatorContext(`/patients/${patientId}/intake`, context));
  }

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  if (error && !patient) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Eligibility Review</h1>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
        <Link className="text-sm underline" href="/patients">
          Patients
        </Link>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { href: withCoordinatorContext(`/patients/${patientId}`, context), label: patient?.display_name ?? "Patient" },
          { label: "Eligibility" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Eligibility Review</h1>
          <div className="text-sm text-gray-600">
            {patient?.display_name} - separate patient facts, provider attestations, and system checks.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Completion Status</h2>
            <div className="text-sm text-gray-600">
              Eligibility separates system checks from provider judgment so billing evidence is reviewable.
            </div>
          </div>
          <span className={`rounded-md border px-3 py-2 text-sm ${statusClass(completionStatus)}`}>
            {completionStatus ? "Complete" : statusLabel("needs_review")}
          </span>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-3">
          <h2 className="text-base font-semibold">User-entered facts</h2>
          <p className="mt-1 text-sm text-gray-600">
            These facts document the practice&apos;s basis for considering CCM.
          </p>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {REQUIRED_ELIGIBILITY_FACTS.map((fact) => (
            <label className="flex gap-2" key={fact.key}>
              <input
                checked={facts[fact.key]}
                className="mt-1"
                onChange={(event) => updateFact(fact.key, event.target.checked)}
                type="checkbox"
              />
              <span>{fact.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Provider attestations</h2>
          <p className="mt-1 text-sm text-gray-600">
            Provider attestation confirms clinical eligibility and medical necessity.
            {!canAttest ? " These items are read-only for coordinators." : ""}
          </p>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {REQUIRED_PROVIDER_ATTESTATIONS.map((attestation) => (
            <label className="flex gap-2" key={attestation.key}>
              <input
                checked={providerAttestations[attestation.key]}
                disabled={!canAttest}
                className="mt-1"
                onChange={(event) =>
                  updateProviderAttestation(attestation.key, event.target.checked)
                }
                type="checkbox"
              />
              <span>{attestation.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-3">
          <h2 className="text-base font-semibold">System validations</h2>
          <p className="mt-1 text-sm text-gray-600">
            CCM Assistant checks required records but does not replace provider judgment.
          </p>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className={`rounded-md border px-3 py-2 ${statusClass(activeConditionCount >= 2)}`}>
            Qualifying chronic conditions: {activeConditionCount}/2 recorded
          </div>
          <div className={`rounded-md border px-3 py-2 ${statusClass(hasAssignedProvider)}`}>
            Billing practitioner assignment: {hasAssignedProvider ? "Assigned" : "Missing"}
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Eligibility notes for billing review</span>
          <textarea
            className="min-h-28 w-full rounded-md border px-3 py-2"
            onChange={(event) => setEligibilityNotes(event.target.value)}
            value={eligibilityNotes}
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={saving}
            onClick={() => saveEligibility(false)}
          >
            {saving ? "Saving..." : "Save eligibility review"}
          </button>
          <button className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60" disabled={saving} onClick={() => saveEligibility(true)} type="button">Save and continue</button>
          <Link className="text-sm underline" href={`/patients/${patientId}/care-plan`}>
            Care plan
          </Link>
        </div>
      </section>
    </main>
  );
}
