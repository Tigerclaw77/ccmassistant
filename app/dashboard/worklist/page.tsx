"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase"; // ✅ FIXED PATH

type Assignment = {
  id: string;
  sent_at: string | null;
  response_status: string | null;
  followup_due_at: string | null;
};

type PatientWithAssignments = {
  id: string;
  name: string;
  assignments: Assignment[] | null;
};

type InteractionRow = {
  patient_id: string;
  minutes: number | string | null;
  created_at: string;
};

type PatientRow = {
  id: string;
  name: string;
  minutes: number;
  assignment?: Assignment;
  isOverdue: boolean;
};

export default function WorklistPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchWorklist(): Promise<void> {
    console.log("🔄 fetchWorklist starting...");

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 🔹 FETCH PATIENTS
    const { data: patientData, error: patientError } = await supabase.from(
      "patients",
    ).select(`
        id,
        name,
        assignments (
          id,
          sent_at,
          response_status,
          followup_due_at
        )
      `);

    console.log("patients data:", patientData);
    console.log("patients error:", patientError);

    // 🔹 FETCH INTERACTIONS
    const { data: interactionsData, error: interactionsError } = await supabase
      .from("interactions")
      .select("patient_id, minutes, created_at")
      .gte("created_at", startOfMonth.toISOString());

    console.log("interactions data:", interactionsData);
    console.log("interactions error:", interactionsError);

    // 🔴 HARD FAIL ONLY IF TRUE ERROR
    if (patientError) {
      console.error("❌ Error loading patients:", patientError);
      setPatients([]);
      setLoading(false);
      return;
    }

    if (interactionsError) {
      console.error("❌ Error loading interactions:", interactionsError);
      setPatients([]);
      setLoading(false);
      return;
    }

    // ✅ SAFE DEFAULTS
    const safePatients = (patientData ?? []) as PatientWithAssignments[];
    const safeInteractions = (interactionsData ?? []) as InteractionRow[];

    console.log("safePatients:", safePatients.length);
    console.log("safeInteractions:", safeInteractions.length);

    // 🔹 BUILD MINUTES MAP
    const minutesMap: Record<string, number> = {};

    for (const interaction of safeInteractions) {
      const pid = interaction.patient_id;
      const mins = Number(interaction.minutes ?? 0);

      if (!minutesMap[pid]) {
        minutesMap[pid] = 0;
      }

      minutesMap[pid] += mins;
    }

    console.log("minutesMap:", minutesMap);

    // 🔹 BUILD ROWS
    const rows: PatientRow[] = safePatients.map((patient) => {
      const assignment = patient.assignments?.[0];
      const minutes = minutesMap[patient.id] ?? 0;

      const isOverdue =
        !!assignment &&
        assignment.response_status === "pending" &&
        !!assignment.followup_due_at &&
        new Date() > new Date(assignment.followup_due_at);

      return {
        id: patient.id,
        name: patient.name,
        minutes,
        assignment,
        isOverdue,
      };
    });

    // 🔹 SORT
    rows.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.minutes - b.minutes;
    });

    console.log("final rows:", rows);

    setPatients(rows);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await fetchWorklist();
    })();
  }, []);

  async function confirmNoResponse(assignmentId: string): Promise<void> {
    void assignmentId;
    alert("TODO Phase 4: no-response updates must use server-owned check-in instances.");
  }

  async function resend(assignmentId: string): Promise<void> {
    void assignmentId;
    alert("TODO Phase 4: resend must use the server-owned outreach/check-in flow.");
  }

  function openLogger(patientId: string): void {
    router.push(`/dashboard/log/${patientId}`);
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Patient Worklist</h1>

      {patients.length === 0 && (
        <div className="text-sm text-gray-500">
          No patients found (check console logs)
        </div>
      )}

      {patients.map((patient) => {
        const assignment = patient.assignment;

        return (
          <div
            key={patient.id}
            className={`border rounded p-4 flex justify-between items-center ${
              patient.isOverdue ? "border-red-500 bg-red-50" : ""
            }`}
          >
            <div>
              <div className="font-medium">{patient.name}</div>

              <div className="text-sm text-gray-600">
                {patient.minutes} min this month
              </div>

              <div className="text-sm">
                {assignment?.response_status === "responded" && "Responded"}
                {patient.isOverdue && "Follow-up needed"}
                {assignment?.response_status === "pending" &&
                  !patient.isOverdue &&
                  "Awaiting response"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => openLogger(patient.id)}
              >
                Log Interaction
              </button>

              {patient.isOverdue && assignment ? (
                <>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => confirmNoResponse(assignment.id)}
                  >
                    No Response
                  </button>

                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => resend(assignment.id)}
                  >
                    Resend
                  </button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
