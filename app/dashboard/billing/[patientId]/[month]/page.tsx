"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseAuthHeaders } from "../../../../../lib/supabase";
import type {
  AuditEvent,
  BillingEvidenceSnapshot,
  CarePlan,
  CcmEnrollment,
  CheckinInstance,
  CheckinResponse,
  InteractionLog,
  MonthlyBillability,
  Patient,
  PatientCondition,
  Question,
} from "../../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
};

type ResponseWithQuestion = CheckinResponse & {
  question?: Question | null;
};

type AuditPacketResponse = {
  auditEvents?: AuditEvent[];
  billability?: MonthlyBillability | null;
  billingMonth?: string;
  carePlans?: CarePlan[];
  checkIn?: CheckinInstance | null;
  conditions?: PatientCondition[];
  enrollment?: CcmEnrollment | null;
  error?: string;
  evidenceSnapshot?: BillingEvidenceSnapshot | null;
  interactionLogs?: InteractionLog[];
  patient?: Patient;
  responses?: ResponseWithQuestion[];
};

function label(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ") : "missing";
}

function listItems(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function EvidencePacketPage() {
  const params = useParams<{ month: string; patientId: string }>();
  const patientId = params.patientId;
  const month = params.month;
  const [packet, setPacket] = useState<AuditPacketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const totalMinutes = useMemo(
    () =>
      (packet?.interactionLogs ?? []).reduce(
        (total, log) => total + Number(log.minutes ?? 0),
        0,
      ),
    [packet?.interactionLogs],
  );

  useEffect(() => {
    async function load() {
      const activePracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });
      const activeResult = (await activeResponse.json()) as ActivePracticeResponse;

      if (!activeResponse.ok || !activeResult.practice?.id) {
        setError(activeResult.error ?? "No active practice found");
        setLoading(false);
        return;
      }

      localStorage.setItem("activePracticeId", activeResult.practice.id);

      const response = await fetch(
        `/api/audit-packet?practiceId=${encodeURIComponent(
          activeResult.practice.id,
        )}&patientId=${encodeURIComponent(patientId)}&billingMonth=${encodeURIComponent(month)}`,
        { headers: await getSupabaseAuthHeaders() },
      );
      const result = (await response.json()) as AuditPacketResponse;

      if (!response.ok) {
        setError(result.error ?? "Unable to load evidence packet");
        setLoading(false);
        return;
      }

      setPacket(result);
      setLoading(false);
    }

    void load();
  }, [month, patientId]);

  if (loading) {
    return <main className="p-6 text-sm text-gray-600">Loading...</main>;
  }

  if (error || !packet?.patient) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Evidence Packet</h1>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Evidence packet not found"}
        </div>
        <Link className="text-sm underline" href="/dashboard/billing">
          Billing
        </Link>
      </main>
    );
  }

  const activeCarePlan =
    packet.carePlans?.find((carePlan) => carePlan.status === "active") ??
    packet.carePlans?.[0] ??
    null;

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Evidence Packet</h1>
          <div className="text-sm text-gray-600">
            {packet.patient.display_name} · {packet.billingMonth ?? month}
          </div>
        </div>
        <Link className="text-sm underline" href="/dashboard/billing">
          Billing
        </Link>
      </div>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Billability result</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium capitalize">{label(packet.billability?.status)}</div>
          </div>
          <div>
            <div className="text-gray-500">Minutes</div>
            <div className="font-medium">
              {packet.billability?.total_minutes ?? totalMinutes}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Reason codes</div>
            <div className="font-medium">
              {packet.billability?.reason_codes?.length
                ? packet.billability.reason_codes.join(", ")
                : "None"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Evidence snapshot</h2>
        {packet.evidenceSnapshot ? (
          <div className="text-sm text-gray-700">
            Snapshot captured {new Date(packet.evidenceSnapshot.created_at).toLocaleString()}.
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            No preserved snapshot yet. Mark the patient-month reviewed or billed from Billing.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Enrollment and consent</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-gray-500">Enrollment</div>
            <div className="font-medium capitalize">{label(packet.enrollment?.status)}</div>
          </div>
          <div>
            <div className="text-gray-500">Eligibility</div>
            <div className="font-medium capitalize">
              {label(packet.enrollment?.eligibility_status)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Consent</div>
            <div className="font-medium capitalize">
              {label(packet.enrollment?.consent_status)}
              {packet.enrollment?.consent_date ? ` on ${packet.enrollment.consent_date}` : ""}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Chronic conditions</h2>
        {packet.conditions?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {packet.conditions.map((condition) => (
              <li key={condition.id}>{condition.condition_name}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-600">No active conditions recorded.</div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Care plan</h2>
        {activeCarePlan ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium capitalize">{activeCarePlan.status}</div>
            </div>
            <EvidenceList title="Goals" values={listItems(activeCarePlan.goals)} />
            <EvidenceList title="Interventions" values={listItems(activeCarePlan.interventions)} />
            <EvidenceList title="Barriers" values={listItems(activeCarePlan.barriers)} />
            {activeCarePlan.notes ? <div>{activeCarePlan.notes}</div> : null}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No active care plan.</div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Check-in</h2>
        <div className="mb-3 text-sm capitalize">Status: {label(packet.checkIn?.status)}</div>
        {packet.responses?.length ? (
          <div className="space-y-3">
            {packet.responses.map((response) => (
              <div key={response.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">{response.question?.prompt ?? "Question"}</div>
                <div className="mt-1 text-gray-700">{response.response_text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No check-in responses recorded.</div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Interaction logs</h2>
        {packet.interactionLogs?.length ? (
          <div className="space-y-3">
            {packet.interactionLogs.map((log) => (
              <div key={log.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">
                  {label(log.activity_type)} · {log.minutes} min
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.occurred_at).toLocaleDateString()}
                </div>
                {log.notes ? <div className="mt-1 text-gray-700">{log.notes}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No interaction logs recorded.</div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Audit events</h2>
        {packet.auditEvents?.length ? (
          <div className="space-y-2">
            {packet.auditEvents.map((event) => (
              <div key={event.id} className="text-sm">
                <span className="font-medium">{event.action}</span>{" "}
                <span className="text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No audit events found for this packet.</div>
        )}
      </section>
    </main>
  );
}

function EvidenceList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <div className="text-gray-500">{title}</div>
      {values.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-600">None recorded.</div>
      )}
    </div>
  );
}
