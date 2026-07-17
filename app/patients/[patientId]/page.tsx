"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import PatientForm from "../../../components/patients/PatientForm";
import PatientWorkspace from "../../../components/patients/PatientWorkspace";
import LoadingState from "../../../components/ui/LoadingState";
import type { AuditEvent, CcmEnrollment, Patient } from "../../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
};

type PatientResponse = {
  consentAuditEvents?: AuditEvent[];
  enrollment?: CcmEnrollment | null;
  error?: string;
  patient?: Patient;
};

export default function PatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();
  const patientId = params.patientId;
  const editing = searchParams.get("edit") === "1";
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [enrollment, setEnrollment] = useState<CcmEnrollment | null>(null);
  const [consentAuditEvents, setConsentAuditEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
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

      const patientResponse = await fetch(
        `/api/patients?practiceId=${encodeURIComponent(
          activeResult.practice.id,
        )}&patientId=${encodeURIComponent(patientId)}`,
        {
          headers: await getSupabaseAuthHeaders(),
        },
      );
      const patientResult = (await patientResponse.json()) as PatientResponse;

      if (!patientResponse.ok || !patientResult.patient) {
        setError(patientResult.error ?? "Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientResult.patient);
      setEnrollment(patientResult.enrollment ?? null);
      setConsentAuditEvents(patientResult.consentAuditEvents ?? []);
      setLoading(false);
    }

    void loadPatient();
  }, [patientId]);

  if (loading) {
    return <main className="page-shell"><LoadingState label="Loading patient workspace" /></main>;
  }

  if (error || !practiceId || !patient) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Patient Detail</h1>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Patient not found"}
        </div>
        <Link className="text-sm underline" href="/patients">
          Patients
        </Link>
      </main>
    );
  }

  if (editing) {
    return (
      <main className="space-y-4 p-6">
        <Link className="text-sm underline" href={`/patients/${patientId}`}>
          Back to patient workspace
        </Link>
        <PatientForm
          consentAuditEvents={consentAuditEvents}
          enrollment={enrollment}
          initialMessage="Editing patient demographics, enrollment, consent, and assignment."
          mode="edit"
          patient={patient}
          practiceId={practiceId}
        />
      </main>
    );
  }

  return (
    <PatientWorkspace
      initialEnrollment={enrollment}
      initialMessage={
        searchParams.get("created")
          ? "Patient saved. Use the workspace to complete this month's CCM requirements."
          : null
      }
      initialPatient={patient}
      patientId={patientId}
      practiceId={practiceId}
    />
  );
}
