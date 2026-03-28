"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

/* ================= TYPES ================= */

type Interaction = {
  patient_id: string;
  minutes: number;
  type: string | null;
  created_at: string;
  created_by: string | null;
  note: string | null;
};

type Submission = {
  patient_id: string;
  created_at: string;
};

type Patient = {
  id: string;
  name: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  conditions: string[] | null;
};

type BillingRow = {
  id: string;
  name: string;
  minutes: number;
  interactions: number;
  submissions: number;
  calls: number;
};

type ModalMode =
  | "minutes"
  | "interactions"
  | "calls"
  | "submissions"
  | "patient"
  | null;

/* ================= COMPONENT ================= */

export default function BillingPage() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);

  const [activity, setActivity] = useState<Interaction[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);

  const [pendingModal, setPendingModal] = useState<{
    id: string;
    view: ModalMode;
  } | null>(null);

  /* ================= FETCH ================= */

  async function fetchBilling(): Promise<void> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: patients } = await supabase
      .from("patients")
      .select("id, name");

    const { data: interactions } = await supabase
      .from("interactions")
      .select("patient_id, minutes, type, created_at")
      .gte("created_at", startOfMonth.toISOString());

    const { data: subs } = await supabase
      .from("submissions")
      .select("patient_id, created_at")
      .gte("created_at", startOfMonth.toISOString());

    const map: Record<string, BillingRow> = {};

    (patients || []).forEach((p) => {
      map[p.id] = {
        id: p.id,
        name: p.name,
        minutes: 0,
        interactions: 0,
        submissions: 0,
        calls: 0,
      };
    });

    (interactions || []).forEach((i) => {
      const row = map[i.patient_id];
      if (!row) return;

      row.minutes += i.minutes;
      row.interactions += 1;

      if (i.type === "call" || i.type === "voicemail") {
        row.calls += 1;
      }
    });

    (subs || []).forEach((s) => {
      const row = map[s.patient_id];
      if (!row) return;
      row.submissions += 1;
    });

    const result = Object.values(map);
    result.sort((a, b) => b.minutes - a.minutes);

    setRows(result);
    setLoading(false);
  }

  useEffect(() => {
  async function load() {
    await fetchBilling();
  }

  load();
}, []);

  /* ================= MODAL PRELOAD ================= */

  useEffect(() => {
    if (!pendingModal) return;

    async function run() {
      if (!pendingModal) return;

      const { id, view } = pendingModal;

      setActivity([]);
      setSubmissions([]);
      setPatientInfo(null);

      if (view === "patient") {
        const { data } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .single();

        setPatientInfo(data || null);
      } else if (view === "submissions") {
        const { data } = await supabase
          .from("submissions")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false });

        setSubmissions(data || []);
      } else {
        const { data } = await supabase
          .from("interactions")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false });

        setActivity(data || []);
      }

      // 🔥 smooth open (perceived performance)
      await new Promise((r) => setTimeout(r, 120));

      setSelectedPatient(id);
      setMode(view);
      setPendingModal(null);
    }

    run();
  }, [pendingModal]);

  function closeModal() {
    setSelectedPatient(null);
    setMode(null);
  }

  function getFilteredActivity() {
    if (mode === "calls") {
      return activity.filter(
        (a) => a.type === "call" || a.type === "voicemail",
      );
    }
    return activity;
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Monthly Billing</h1>

      {/* HEADER */}
      <div className="grid grid-cols-5 gap-4 font-semibold border-b border-black/10 dark:border-white/10 pb-2">
        <div>Patient</div>
        <div>Minutes</div>
        <div>Interactions</div>
        <div>Submissions</div>
        <div>Calls</div>
      </div>

      {/* ROWS */}
      {rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-5 gap-4 py-2 px-3 rounded-md border-b border-white/10 hover:bg-white/5 transition"
        >
          <div
            className="cursor-pointer underline"
            onClick={() => setPendingModal({ id: r.id, view: "patient" })}
          >
            {r.name}
          </div>

          <div
            className="cursor-pointer font-semibold text-blue-400"
            onClick={() => setPendingModal({ id: r.id, view: "minutes" })}
          >
            {r.minutes}
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setPendingModal({ id: r.id, view: "interactions" })}
          >
            {r.interactions}
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setPendingModal({ id: r.id, view: "submissions" })}
          >
            {r.submissions}
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setPendingModal({ id: r.id, view: "calls" })}
          >
            {r.calls}
          </div>
        </div>
      ))}

      {/* MODAL */}
      {selectedPatient && mode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 shadow-2xl text-black dark:text-white p-6 rounded max-h-[80vh] overflow-y-auto space-y-4 max-w-2xl w-full animate-[fadeIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {mode === "patient"
                  ? "Patient Info"
                  : mode === "minutes"
                    ? "Minutes Breakdown"
                    : mode === "calls"
                      ? "Calls"
                      : mode === "submissions"
                        ? "Submissions"
                        : "Interactions"}
              </h2>

              <button
                onClick={closeModal}
                className="px-3 py-1.5 border rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>

            {/* PATIENT */}
            {mode === "patient" && patientInfo && (
              <div className="space-y-2">
                <div>Name: {patientInfo.name}</div>
                <div>DOB: {patientInfo.dob || "—"}</div>
                <div>Phone: {patientInfo.phone || "—"}</div>
                <div>Email: {patientInfo.email || "—"}</div>
                <div>
                  Conditions: {patientInfo.conditions?.join(", ") || "—"}
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {(mode === "minutes" ||
              mode === "interactions" ||
              mode === "calls") && (
              <div className="space-y-2">
                {getFilteredActivity().map((a, idx, arr) => (
                  <div
                    key={idx}
                    className={`pb-1.5 text-sm ${
                      idx !== arr.length - 1
                        ? "border-b border-black/10 dark:border-white/10"
                        : ""
                    }`}
                  >
                    <div className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleString()}
                    </div>

                    <div className="font-medium">
                      {a.type || "interaction"} — {a.minutes} min
                    </div>

                    <div className="text-gray-500">
                      By: {a.created_by || "unknown"}
                    </div>
                  </div>
                ))}

                {mode === "minutes" && (
                  <div className="pt-2 font-semibold">
                    Total:{" "}
                    {getFilteredActivity().reduce(
                      (sum, a) => sum + a.minutes,
                      0,
                    )}{" "}
                    min
                  </div>
                )}
              </div>
            )}

            {/* SUBMISSIONS */}
            {mode === "submissions" && (
              <div className="space-y-2">
                {submissions.map((s, idx, arr) => (
                  <div
                    key={idx}
                    className={`pb-1.5 text-sm ${
                      idx !== arr.length - 1
                        ? "border-b border-black/10 dark:border-white/10"
                        : ""
                    }`}
                  >
                    <div className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                    <div>Submission</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
