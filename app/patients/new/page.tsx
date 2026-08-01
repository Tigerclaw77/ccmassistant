"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PatientForm from "../../../components/patients/PatientForm";
import LoadingState from "../../../components/ui/LoadingState";
import OnboardingProgress from "../../../components/onboarding/OnboardingProgress";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
};

export default function NewPatientPage() {
  const searchParams = useSearchParams();
  const firstPatientOnboarding = searchParams.get("first") === "1";
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
    return <main className="page-shell"><LoadingState label="Preparing patient registration" /></main>;
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
    <main className="space-y-5 p-6">
      {firstPatientOnboarding ? (
        <section className="surface p-4" aria-label="First-run onboarding progress">
          <p className="eyebrow">Final onboarding step</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">Enroll your first patient</h1>
          <p className="mt-1 text-sm text-slate-600">Save the core patient and CCM enrollment below. The guided workspace will show the next clinical prerequisite.</p>
          <div className="mt-4"><OnboardingProgress currentStep={4} steps={["Practice", "Provider", "Starter kits", "First patient"]} /></div>
        </section>
      ) : null}
      <PatientForm
        firstPatientOnboarding={firstPatientOnboarding}
        initialMessage={firstPatientOnboarding ? "Your practice, provider, and starter kits are ready. Add the first patient to begin CCM." : null}
        initialPrimaryProviderId={searchParams.get("primaryProviderId")}
        mode="create"
        practiceId={practiceId}
      />
    </main>
  );
}
