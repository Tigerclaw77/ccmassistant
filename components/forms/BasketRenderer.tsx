"use client";

import { useState } from "react";
import FieldRenderer from "./FieldRenderer";

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

type Props = {
  basket: Basket;
};

export default function BasketRenderer({ basket }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function submit() {
    const token = window.location.pathname.split("/").pop();

    if (!token) {
      alert("Invalid link");
      return;
    }

    const response = await fetch(`/api/submit/${token}`, {
      body: JSON.stringify({ answers }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Submit failed");
      return;
    }

    alert("Submitted!");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {basket.questions.map((q: Question) => (
        <div key={q.id}>
          <label style={{ display: "block", marginBottom: 6 }}>{q.label}</label>

          <FieldRenderer
            field={q}
            onChange={(value: string) => updateAnswer(q.id, value)}
          />
        </div>
      ))}

      <button
        onClick={submit}
        style={{
          padding: "10px 16px",
          background: "#1f1f23",
          color: "#fff",
          border: "1px solid #333",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Submit
      </button>
    </div>
  );
}
