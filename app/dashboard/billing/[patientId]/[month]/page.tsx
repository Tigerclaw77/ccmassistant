"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "../../../../../components/Breadcrumbs";
import LoadingState from "../../../../../components/ui/LoadingState";
import { getSupabaseAuthHeaders } from "../../../../../lib/supabase";
import { reasonLabel, statusLabel } from "../../../../../lib/ccm/labels";
import { normalizeBillingMonth, withCoordinatorContext } from "../../../../../lib/ccm/month-context";
import { occurrenceDateForDisplay } from "../../../../../lib/ccm/interaction-log-contract";
import {
  completedConsentElementLabels,
  missingConsentElementLabels,
} from "../../../../../lib/ccm/consent";
import {
  missingEligibilityFactLabels,
  missingProviderAttestationLabels,
} from "../../../../../lib/ccm/eligibility";
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
  PatientIntakeSummary,
  Practice,
  Provider,
  Question,
} from "../../../../../lib/ccm/types";

type ActivePracticeResponse = {
  error?: string;
  practice?: {
    id: string;
  };
  membership?: { role: string };
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
  intakeSummary?: PatientIntakeSummary | null;
  patient?: Patient;
  practice?: Practice | null;
  provider?: Provider | null;
  responses?: ResponseWithQuestion[];
};

function listItems(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function EvidencePacketPage() {
  const params = useParams<{ month: string; patientId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.patientId;
  const month = params.month;
  const [packet, setPacket] = useState<AuditPacketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nextPatientId, setNextPatientId] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const context = useMemo(() => ({
    assignment: searchParams.get("assignment") ?? undefined,
    month: normalizeBillingMonth(month),
    page: Number(searchParams.get("page") ?? "1") || 1,
    readiness: searchParams.get("readiness") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    source: searchParams.get("source") === "worklist" ? "worklist" as const : "billing" as const,
  }), [month, searchParams]);

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
      setPracticeId(activeResult.practice.id);
      setCanReview(["owner", "admin", "billing_staff"].includes(activeResult.membership?.role ?? ""));

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
    return <main className="page-shell"><LoadingState label="Loading billing evidence" /></main>;
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
  const practiceSettings = jsonObject(packet.practice?.billing_settings);
  const completedConsentElements = completedConsentElementLabels(
    packet.enrollment?.consent_metadata,
  );
  const missingConsentElements = missingConsentElementLabels(packet.enrollment?.consent_metadata);
  const missingEligibilityFacts = missingEligibilityFactLabels(
    packet.enrollment?.eligibility_metadata,
  );
  const missingProviderAttestations = missingProviderAttestationLabels(
    packet.enrollment?.eligibility_metadata,
  );
  const intakeSummary = jsonObject(
    packet.intakeSummary?.reviewed_summary ?? packet.intakeSummary?.draft_summary,
  );
  const hasBlockingEvidence = packet.billability?.status !== "ready_to_bill" && packet.billability?.status !== "billed";
  const returnPath = context.source === "worklist" ? "/dashboard/worklist" : "/dashboard/billing";

  async function markReviewed() {
    if (!practiceId) return;
    setWorking(true);
    setError(null);
    const response = await fetch("/api/billing/month", {
      body: JSON.stringify({ action: "reviewed", billingMonth: month, patientId, practiceId }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "PATCH",
    });
    const result = await response.json() as { billability?: MonthlyBillability; error?: string };
    if (!response.ok || !result.billability) {
      setError(result.error ?? "Unable to mark evidence reviewed");
      setWorking(false);
      return;
    }
    setPacket((current) => current ? { ...current, billability: result.billability } : current);
    const nextParams = new URLSearchParams({ practiceId, patientId, month });
    if (context.assignment) nextParams.set("assignment", context.assignment);
    if (context.search) nextParams.set("search", context.search);
    const nextResponse = await fetch(`/api/billing/next-unreviewed?${nextParams.toString()}`, { headers: await getSupabaseAuthHeaders() });
    const nextResult = await nextResponse.json() as { patientId?: string | null };
    setNextPatientId(nextResponse.ok ? nextResult.patientId ?? null : null);
    setMessage("Patient-month reviewed and immutable evidence snapshot preserved.");
    setWorking(false);
  }

  function printPacket() {
    const previousTitle = document.title;
    const safePatient = (packet?.patient?.display_name ?? "").replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "") || patientId.slice(0, 8);
    document.title = `CCM-Evidence-${safePatient}-${month.slice(0, 7)}`;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 500);
  }

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      <Breadcrumbs
        items={[
          { href: withCoordinatorContext(returnPath, context), label: context.source === "worklist" ? "Worklist" : "Billing" },
          { href: withCoordinatorContext(`/patients/${patientId}`, context), label: packet.patient.display_name },
          { label: "Evidence packet" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Evidence Packet</h1>
          <div className="text-sm text-gray-600">
            {packet.patient.display_name} - {packet.billingMonth ?? month}
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            className="rounded-md border bg-white px-3 py-2 text-sm font-medium"
            onClick={printPacket}
            type="button"
          >
            Download / print evidence PDF
          </button>
          <Link className="text-sm underline" href={withCoordinatorContext(returnPath, context)}>
            {context.source === "worklist" ? "Worklist" : "Billing"}
          </Link>
        </div>
      </div>

      <section className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 print:border-slate-300 print:bg-white">
        Retain the immutable monthly evidence snapshot and audit history in CCM Assistant. Save this packet
        to the practice&apos;s approved billing file, and enter or upload clinically required care-plan,
        consent, interaction, and follow-up documentation into the EHR or official patient record under
        the practice&apos;s policy. CCM Assistant does not replace the legal medical record.
      </section>

      {message ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div> : null}

      <section className={`rounded-md border p-4 text-sm ${hasBlockingEvidence ? "border-amber-200 bg-amber-50 text-amber-950" : "border-green-200 bg-green-50 text-green-950"}`}>
        <h2 className="font-semibold">Unresolved exceptions</h2>
        {packet.billability?.reason_codes?.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{packet.billability.reason_codes.map((reason) => <li key={reason}>{reasonLabel(reason)}</li>)}</ul> : <div className="mt-1">No blocking evidence exceptions.</div>}
        <div className="mt-3 flex flex-wrap gap-3 print:hidden">
          {canReview ? <button className="rounded-md border bg-white px-3 py-2 font-medium disabled:opacity-50" disabled={working || hasBlockingEvidence || Boolean(packet.billability?.reviewed_at)} onClick={markReviewed}>{working ? "Saving..." : packet.billability?.reviewed_at ? "Reviewed" : "Mark reviewed"}</button> : null}
          {nextPatientId ? <button className="rounded-md border bg-white px-3 py-2 font-medium" onClick={() => router.push(withCoordinatorContext(`/dashboard/billing/${nextPatientId}/${month}`, context))}>Next unreviewed patient</button> : null}
        </div>
      </section>

      <details className="rounded-md border bg-white text-black" open={hasBlockingEvidence}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Supporting evidence details</summary>
        <div className="space-y-6 border-t p-4">
      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Billing readiness result</h2>
        <p className="mb-3 text-sm text-gray-600">
          This section explains whether the patient-month has enough evidence for billing review.
        </p>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-gray-500">Billing readiness</div>
            <div className="font-medium">{statusLabel(packet.billability?.status)}</div>
          </div>
          <div>
            <div className="text-gray-500">Minutes</div>
            <div className="font-medium">
              {packet.billability?.total_minutes ?? totalMinutes}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Missing items</div>
            <div className="font-medium">
              {packet.billability?.reason_codes?.length
                ? packet.billability.reason_codes.map(reasonLabel).join("; ")
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
            No preserved snapshot yet. Mark the patient-month reviewed or billed from Billing to preserve evidence.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Practice and billing practitioner readiness</h2>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <div className="text-gray-500">CMS eligibility attestation</div>
            <div className="font-medium">
              {practiceSettings.cms_eligibility_attested === true ? "Complete" : "Missing"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Medicare enrollment attestation</div>
            <div className="font-medium">
              {practiceSettings.medicare_enrollment_attested === true ? "Complete" : "Missing"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Billing practitioner</div>
            <div className="font-medium">
              {packet.provider
                ? [packet.provider.full_name, packet.provider.credentials]
                    .filter(Boolean)
                    .join(", ")
                : "Missing"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Billing practitioner manual review</div>
            <div className="font-medium">{statusLabel(packet.provider?.manual_review_status)}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <div className="mb-2 font-medium">Completed consent elements</div>
            {completedConsentElements.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {completedConsentElements.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-600">No consent elements recorded yet.</div>
            )}
          </div>
          <div>
            <div className="mb-2 font-medium">Missing consent elements</div>
            {missingConsentElements.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {missingConsentElements.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <div className="text-green-700">All required elements recorded.</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Enrollment and consent</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-gray-500">Enrollment</div>
            <div className="font-medium">{statusLabel(packet.enrollment?.status)}</div>
          </div>
          <div>
            <div className="text-gray-500">Eligibility</div>
            <div className="font-medium capitalize">
              {statusLabel(packet.enrollment?.eligibility_status)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Consent</div>
            <div className="font-medium capitalize">
              {statusLabel(packet.enrollment?.consent_status)}
              {packet.enrollment?.consent_date ? ` on ${packet.enrollment.consent_date}` : ""}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <div className="mb-2 font-medium">Eligibility facts</div>
            {missingEligibilityFacts.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {missingEligibilityFacts.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <div className="text-green-700">All structured facts recorded.</div>
            )}
          </div>
          <div>
            <div className="mb-2 font-medium">Billing practitioner attestations</div>
            {missingProviderAttestations.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {missingProviderAttestations.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <div className="text-green-700">All billing practitioner attestations recorded.</div>
            )}
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
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No active conditions recorded. Add qualifying chronic conditions before billing review.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Care plan</h2>
        {activeCarePlan ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium capitalize">{statusLabel(activeCarePlan.status)}</div>
            </div>
            <EvidenceList title="Goals" values={listItems(activeCarePlan.goals)} />
            <EvidenceList title="Interventions" values={listItems(activeCarePlan.interventions)} />
            <EvidenceList title="Barriers" values={listItems(activeCarePlan.barriers)} />
            {activeCarePlan.notes ? <div>{activeCarePlan.notes}</div> : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No active care plan. Create and review a care plan before billing readiness can pass.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Reviewed AI intake</h2>
        {packet.intakeSummary ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium">{statusLabel(packet.intakeSummary.status)}</div>
              </div>
              <div>
                <div className="text-gray-500">Accepted</div>
                <div className="font-medium">
                  {packet.intakeSummary.accepted_at
                    ? new Date(packet.intakeSummary.accepted_at).toLocaleString()
                    : "Not accepted"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Quality</div>
                <div className="font-medium">
                  {packet.intakeSummary.confidence_score === null
                    ? "Not scored"
                    : `${Math.round(Number(packet.intakeSummary.confidence_score) * 100)}%`}
                </div>
              </div>
            </div>
            <EvidenceText title="Patient overview" value={intakeSummary.patient_overview} />
            <EvidenceText title="Chronic conditions" value={intakeSummary.chronic_conditions} />
            <EvidenceText title="Medications" value={intakeSummary.medications} />
            <EvidenceText title="Care needs" value={intakeSummary.care_needs} />
            <EvidenceText title="Documentation notes" value={intakeSummary.documentation_notes} />
            <EvidenceList
              title="Missing information"
              values={stringArray(packet.intakeSummary.missing_information)}
            />
            <EvidenceList
              title="Follow-up questions"
              values={stringArray(packet.intakeSummary.follow_up_questions)}
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No accepted AI intake summary. Review and accept the draft before using it as evidence.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Check-in</h2>
        <div className="mb-3 text-sm">Status: {statusLabel(packet.checkIn?.status)}</div>
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
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No check-in responses recorded. Send the public link or close the check-in with documented follow-up.
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <h2 className="mb-3 text-base font-semibold">Interaction logs</h2>
        {packet.interactionLogs?.length ? (
          <div className="space-y-3">
            {packet.interactionLogs.map((log) => (
              <div key={log.id} className="border-b pb-3 text-sm last:border-b-0 last:pb-0">
                <div className="font-medium">
                  {statusLabel(log.activity_type)} - {log.minutes} min
                </div>
                <div className="text-xs text-gray-500">
                  {occurrenceDateForDisplay(log)}
                </div>
                {log.notes ? <div className="mt-1 text-gray-700">{log.notes}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No interaction logs recorded. Log CCM time so the monthly evidence explains where minutes came from.
          </div>
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
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-gray-600">
            No audit events found for this packet. Important saves and billing actions will appear here.
          </div>
        )}
      </section>
        </div>
      </details>
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

function EvidenceText({ title, value }: { title: string; value: unknown }) {
  const text = typeof value === "string" && value.trim() ? value : "None recorded.";

  return (
    <div>
      <div className="text-gray-500">{title}</div>
      <div className="text-gray-700">{text}</div>
    </div>
  );
}
