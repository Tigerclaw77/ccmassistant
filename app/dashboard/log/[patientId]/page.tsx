"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function LogInteractionPage() {
  const router = useRouter();
  const params = useParams();

  const patientId = params.patientId;

  const [type, setType] = useState("call");
  const [minutes, setMinutes] = useState(5);
  const [note, setNote] = useState("");

  async function handleSave() {
    await supabase.from("interactions").insert({
      patient_id: patientId,
      type,
      minutes,
      note,
      created_by: "staff",
    });

    router.push("/dashboard/worklist");
  }

  return (
    <div className="p-6 space-y-4 max-w-md">
      <h1 className="text-lg font-semibold">Log Interaction</h1>

      <div>
        <label className="text-sm">Type</label>
        <select
          className="w-full border p-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="call">Call</option>
          <option value="voicemail">Voicemail</option>
          <option value="failed">Failed Attempt</option>
          <option value="review">Care Review</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Minutes</label>
        <input
          type="number"
          className="w-full border p-2 rounded"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="text-sm">Note (optional)</label>
        <textarea
          className="w-full border p-2 rounded"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 border rounded"
      >
        Save
      </button>
    </div>
  );
}