"use client";

import { getSupabaseAuthHeaders } from "../../../lib/supabase";

const sampleQuestions = [
  { id: "q1", label: "How are you feeling?", type: "text" },
  { id: "q2", label: "Any pain?", type: "yes_no" },
];

export default function NewFormPage() {
  async function createForm() {
    const response = await fetch("/api/forms", {
      body: JSON.stringify({
        name: "Basic Check-in",
        questions: sampleQuestions,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Form creation is not implemented yet");
      return;
    }

    alert("Form created");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Form</h1>

      <button onClick={createForm}>
        Create Basic Form
      </button>
    </div>
  );
}
