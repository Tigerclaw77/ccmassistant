"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

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

    const { data: interactionsData, error: interactionsError } = await supabase
      .from("interactions")
      .select("patient_id, minutes, created_at")
      .gte("created_at", startOfMonth.toISOString());

    if (patientError) {
      console.error("Error loading patients:", patientError);
      setPatients([]);
      setLoading(false);
      return;
    }

    if (interactionsError) {
      console.error("Error loading interactions:", interactionsError);
      setPatients([]);
      setLoading(false);
      return;
    }

    const safePatients = (patientData ?? []) as PatientWithAssignments[];
    const safeInteractions = (interactionsData ?? []) as InteractionRow[];

    const minutesMap: Record<string, number> = {};

    for (const interaction of safeInteractions) {
      const pid = interaction.patient_id;
      const mins = Number(interaction.minutes ?? 0);

      if (!minutesMap[pid]) {
        minutesMap[pid] = 0;
      }

      minutesMap[pid] += mins;
    }

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

    rows.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.minutes - b.minutes;
    });

    setPatients(rows);
    setLoading(false);
  }

  useEffect(() => {
    const run = async () => {
      await fetchWorklist();
    };

    void run();
  }, []);

  async function confirmNoResponse(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from("assignments")
      .update({ response_status: "no_response_confirmed" })
      .eq("id", assignmentId);

    if (error) {
      console.error("Error confirming no response:", error);
      return;
    }

    await fetchWorklist();
  }

  async function resend(assignmentId: string): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("assignments")
      .update({
        sent_at: now,
        followup_due_at: new Date(
          Date.now() + 72 * 60 * 60 * 1000,
        ).toISOString(),
        response_status: "pending",
      })
      .eq("id", assignmentId);

    if (error) {
      console.error("Error resending assignment:", error);
      return;
    }

    await fetchWorklist();
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
