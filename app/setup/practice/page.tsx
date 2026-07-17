"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";
import {
  BILLING_PRACTITIONER_TYPES,
  isSupportedBillingPractitionerType,
  type BillingPractitionerType,
} from "../../../lib/ccm/types";
import { Building2, CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";

function displayLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PracticeSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerNpi, setProviderNpi] = useState("");
  const [providerType, setProviderType] = useState<BillingPractitionerType>("physician");
  const [cmsEligibilityAttested, setCmsEligibilityAttested] = useState(false);
  const [medicareEnrollmentAttested, setMedicareEnrollmentAttested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/practices/bootstrap", {
      body: JSON.stringify({
        cmsEligibilityAttested,
        medicareEnrollmentAttested,
        name,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to create practice");
      return;
    }

    if (result.practice?.id) {
      localStorage.setItem("activePracticeId", result.practice.id);

      const existingProvidersResponse = await fetch(
        `/api/providers?practiceId=${encodeURIComponent(result.practice.id)}`,
        { headers: await getSupabaseAuthHeaders() },
      );
      const existingProvidersResult = await existingProvidersResponse.json();

      if ((existingProvidersResult.providers ?? []).length === 0) {
        const providerResponse = await fetch("/api/providers", {
          body: JSON.stringify({
            billingPractitionerType: providerType,
            fullName: providerName,
            npi: providerNpi,
            practiceId: result.practice.id,
          }),
          headers: {
            "Content-Type": "application/json",
            ...(await getSupabaseAuthHeaders()),
          },
          method: "POST",
        });
        const providerResult = await providerResponse.json();

        if (!providerResponse.ok) {
          setError(providerResult.error ?? "Practice created, but provider was not created");
          return;
        }
      }
    }

    router.replace("/patients");
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <p className="eyebrow">Practice setup - step 1 of 1</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Create your practice workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Add the practice and first billing practitioner. Your account becomes the practice owner and administrator.
          </p>
        </div>
        <div className="surface grid grid-cols-3 gap-2 p-3 text-center text-xs text-slate-600">
          <span><Building2 aria-hidden="true" className="mx-auto mb-1 text-teal-700" size={18} />Practice</span>
          <span><UsersRound aria-hidden="true" className="mx-auto mb-1 text-teal-700" size={18} />Care team</span>
          <span><ShieldCheck aria-hidden="true" className="mx-auto mb-1 text-teal-700" size={18} />Attestation</span>
        </div>
      </div>

      <form onSubmit={submit} className="surface space-y-5 p-5 sm:p-7">
        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="practice-name">
            Practice name
          </label>
          <p className="text-xs font-medium text-gray-600">
            This name appears throughout staff screens and patient check-ins.
          </p>
          <input
            id="practice-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border px-3 py-2.5"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="provider-name">
            First billing practitioner name
          </label>
          <p className="text-xs font-medium text-gray-600">
            The billing practitioner is used for patient assignment, care review, and evidence.
          </p>
          <input
            id="provider-name"
            required
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            className="w-full rounded-md border px-3 py-2.5"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="provider-npi">
            Billing practitioner NPI
          </label>
          <p className="text-xs font-medium text-gray-600">
            NPI helps make billing evidence understandable during practice review.
          </p>
          <input
            id="provider-npi"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            placeholder="10-digit NPI"
            value={providerNpi}
            onChange={(event) => setProviderNpi(event.target.value)}
            className="w-full rounded-md border px-3 py-2.5"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="provider-type">
            Billing practitioner type
          </label>
          <p className="text-xs font-medium text-gray-600">
            CCM Assistant uses this to flag practitioner types that need manual review.
          </p>
          <select
            id="provider-type"
            value={providerType}
            onChange={(event) => setProviderType(event.target.value as BillingPractitionerType)}
            className="w-full rounded-md border px-3 py-2.5"
          >
            {BILLING_PRACTITIONER_TYPES.map((type) => (
              <option key={type} value={type}>
                {displayLabel(type)}
              </option>
            ))}
          </select>
          {!isSupportedBillingPractitionerType(providerType) ? (
            <p className="text-xs text-amber-700">
              This practitioner type will be marked for manual review before billing readiness.
            </p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-md border bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><CheckCircle2 aria-hidden="true" className="text-teal-700" size={18} />Required practice attestations</div>
          <label className="flex gap-3">
            <input
              required
              type="checkbox"
              checked={cmsEligibilityAttested}
              onChange={(event) => setCmsEligibilityAttested(event.target.checked)}
              className="mt-1"
            />
            <span>
              I attest that this practice will confirm CCM clinical eligibility and retain
              supporting documentation before billing.
            </span>
          </label>

          <label className="flex gap-3">
            <input
              required
              type="checkbox"
              checked={medicareEnrollmentAttested}
              onChange={(event) => setMedicareEnrollmentAttested(event.target.checked)}
              className="mt-1"
            />
            <span>
              I attest that the billing practitioner is enrolled or otherwise authorized for
              Medicare billing under the practice&apos;s process.
            </span>
          </label>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="button-primary"
        >
          {loading ? "Creating secure workspace..." : "Create practice workspace"}
        </button>
      </form>
    </main>
  );
}
