"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

export default function PracticeSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerNpi, setProviderNpi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/practices/bootstrap", {
      body: JSON.stringify({ name }),
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
    <main className="p-6 space-y-4 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Set up your practice</h1>
        <p className="text-sm text-gray-600">
          Create the first practice workspace. You will be the owner.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="practice-name">
            Practice name
          </label>
          <input
            id="practice-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-black"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="provider-name">
            First provider name
          </label>
          <input
            id="provider-name"
            required
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-black"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="provider-npi">
            Provider NPI
          </label>
          <input
            id="provider-npi"
            value={providerNpi}
            onChange={(event) => setProviderNpi(event.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-black"
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create practice"}
        </button>
      </form>
    </main>
  );
}
