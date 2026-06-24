"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PatientTable from "../../components/patients/PatientTable";
import type { CcmEnrollment, Patient } from "../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../lib/supabase";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
    name: string;
  };
};

type PatientsResponse = {
  enrollmentsByPatientId?: Record<string, CcmEnrollment>;
  error?: string;
  patients?: Patient[];
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [enrollmentsByPatientId, setEnrollmentsByPatientId] = useState<
    Record<string, CcmEnrollment>
  >({});
  const [practiceName, setPracticeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchPatients(activePracticeId: string) {
    const response = await fetch(
      `/api/patients?practiceId=${encodeURIComponent(activePracticeId)}`,
      {
        headers: await getSupabaseAuthHeaders(),
      },
    );
    const result = (await response.json()) as PatientsResponse;

    if (!response.ok) {
      setError(result.error ?? "Unable to load patients");
      setPatients([]);
      setEnrollmentsByPatientId({});
      setLoading(false);
      return;
    }

    setPatients(result.patients ?? []);
    setEnrollmentsByPatientId(result.enrollmentsByPatientId ?? {});
    setLoading(false);
  }

  useEffect(() => {
    async function load() {
      const activePracticeId = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });
      const result = (await response.json()) as ActivePracticeResponse;

      if (!response.ok || !result.practice?.id) {
        setError(result.error ?? "No active practice found");
        setLoading(false);
        return;
      }

      localStorage.setItem("activePracticeId", result.practice.id);
      setPracticeName(result.practice.name);
      await fetchPatients(result.practice.id);
    }

    void load();
  }, []);

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Patients</h1>
          <div className="text-sm text-gray-600">
            {practiceName ?? "Practice scoped"}
          </div>
        </div>

        <Link
          href="/patients/new"
          className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Add Patient
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : (
        <PatientTable
          enrollmentsByPatientId={enrollmentsByPatientId}
          patients={patients}
        />
      )}
    </main>
  );
}
