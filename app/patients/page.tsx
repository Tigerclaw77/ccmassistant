"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Patient = {
  id: string;
  name: string;
  email: string;
};

type Question = {
  id: string;
  label: string;
  type: "text" | "yes_no";
};

type Basket = {
  id: string;
  name: string;
  questions: Question[];
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<string>("");

  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH PATIENTS
  // =========================
  async function fetchPatients() {
    const { data, error } = await supabase.from("patients").select("*");

    console.log("FETCH PATIENTS:", { data, error });

    if (data) setPatients(data);
    setLoading(false);
  }

  // =========================
  // FETCH BASKETS
  // =========================
  async function fetchBaskets() {
    const { data, error } = await supabase.from("baskets").select("*");

    console.log("FETCH BASKETS:", { data, error });

    if (data) {
      setBaskets(data as Basket[]);
    }
  }

  // =========================
  // ADD PATIENT
  // =========================
  async function addPatient() {
    console.log("CLICKED BUTTON");

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: "Test Patient " + Math.floor(Math.random() * 1000),
        email: "test@test.com",
      })
      .select();

    console.log("INSERT RESULT:", { data, error });

    if (error) {
      alert("Insert failed");
      console.error(error);
    } else {
      alert("Inserted!");
      fetchPatients();
    }
  }

  // =========================
  // ASSIGN FORM
  // =========================
  async function assignForm(patientId: string) {
    if (!selectedBasket) {
      alert("Select a form first");
      return;
    }

    const token = crypto.randomUUID();

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        token,
        patient_id: patientId,
        basket_id: selectedBasket,
      })
      .select();

    console.log("ASSIGN:", { data, error });

    if (!error) {
      alert(`http://localhost:3000/f/${token}`);
    }
  }

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    async function load() {
      await fetchPatients();
      await fetchBaskets();
    }

    load();
  }, []);

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h1>Patients</h1>

      {/* FORM SELECTOR */}
      <select
        value={selectedBasket}
        onChange={(e) => setSelectedBasket(e.target.value)}
        style={{
          marginBottom: 20,
          padding: 8,
          background: "#111",
          color: "#fff",
          border: "1px solid #333",
          borderRadius: 6,
        }}
      >
        <option value="">Select Form</option>
        {baskets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      {/* ADD PATIENT */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={addPatient}>+ Add Test Patient</button>
      </div>

      {/* PATIENT LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {patients.map((p) => (
            <li key={p.id} style={{ marginBottom: 10 }}>
              <strong>{p.name}</strong> — {p.email}

              <button
                onClick={() => assignForm(p.id)}
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