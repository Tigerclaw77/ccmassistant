"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PatientForm from "../../../components/patients/PatientForm";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
};

export default function NewPatientPage() {
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPractice() {
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
      setPracticeId(result.practice.id);
      setLoading(false);
    }

    void loadPractice();
  }, []);

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  if (!practiceId) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">New Patient</h1>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "No active practice found"}
        </div>
        <Link className="text-sm underline" href="/setup/practice">
          Practice setup
        </Link>
      </main>
    );
  }

  return (
    <main className="p-6">
      <PatientForm mode="create" practiceId={practiceId} />
    </main>
  );
}
