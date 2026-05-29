"use client";

import { useEffect, useState } from "react";
import { getSupabaseAuthHeaders } from "../../lib/supabase";

type Patient = {
  id: string;
  display_name: string;
  email: string | null;
};

type Basket = {
  id: string;
  name: string;
  questions: Array<{
    id: string;
    label: string;
    type: "text" | "yes_no";
  }>;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<string>("");
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchPatients(activePracticeId: string) {
    const response = await fetch(`/api/patients?practiceId=${activePracticeId}`, {
      headers: await getSupabaseAuthHeaders(),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Unable to load patients");
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients(result.patients ?? []);
    setLoading(false);
  }

  async function fetchBaskets() {
    // TODO Phase 3: replace legacy basket reads with server-owned question bank/template API.
    setBaskets([]);
  }

  async function addPatient() {
    alert("TODO Phase 2: connect this button to the server-owned /api/patients create flow.");
  }

  async function assignForm(patientId: string) {
    if (!selectedBasket) {
      alert("Question templates are not wired yet");
      return;
    }

    const response = await fetch("/api/assign", {
      body: JSON.stringify({
        legacyBasketId: selectedBasket,
        patientId,
        practiceId,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Assignment is not implemented yet");
      return;
    }

    alert(result.url ?? "Check-in assigned");
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
      const result = await response.json();

      if (!response.ok || !result.practice?.id) {
        setError(result.error ?? "No active practice found");
        setLoading(false);
        return;
      }

      localStorage.setItem("activePracticeId", result.practice.id);
      setPracticeId(result.practice.id);
      await fetchPatients(result.practice.id);
      await fetchBaskets();
    }

    void load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Patients</h1>

      {practiceId ? (
        <div className="text-xs text-gray-500 mb-4">Practice scoped</div>
      ) : null}

      {error ? <div className="text-sm text-red-600 mb-4">{error}</div> : null}

      <select
        value={selectedBasket}
        onChange={(event) => setSelectedBasket(event.target.value)}
        style={{
          marginBottom: 20,
          padding: 8,
          background: "#111",
          color: "#fff",
          border: "1px solid #333",
          borderRadius: 6,
        }}
      >
        <option value="">Question templates coming in Phase 3</option>
        {baskets.map((basket) => (
          <option key={basket.id} value={basket.id}>
            {basket.name}
          </option>
        ))}
      </select>

      <div style={{ marginBottom: 20 }}>
        <button onClick={addPatient}>+ Add Patient</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {patients.map((patient) => (
            <li key={patient.id} style={{ marginBottom: 10 }}>
              <strong>{patient.display_name}</strong>
              {patient.email ? ` - ${patient.email}` : ""}

              <button
                onClick={() => assignForm(patient.id)}
                style={{ marginLeft: 10 }}
              >
                Send Form
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
