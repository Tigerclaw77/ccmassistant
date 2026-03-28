"use client";

import { supabase } from "../../../../lib/supabase";

const sampleQuestions = [
  { id: "q1", label: "How are you feeling?", type: "text" },
  { id: "q2", label: "Any pain?", type: "yes_no" },
];

export default function NewFormPage() {
  async function createForm() {
    const { data, error } = await supabase
      .from("baskets")
      .insert({
        name: "Basic Check-in",
        questions: sampleQuestions,
      })
      .select();

    console.log("CREATE FORM:", { data, error });

    if (data) {
      alert("Form created");
    }
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