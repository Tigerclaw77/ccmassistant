"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConditionManager, type ConditionManagerValue } from "../conditions/ConditionManager";
import {
  conditionPayload,
  managerConditionFromPatient,
} from "../conditions/patientConditionAdapters";
import {
  allConsentElementsComplete,
  missingConsentElementLabels,
} from "../../lib/ccm/consent";
import {
  allEligibilityFactsComplete,
  allProviderAttestationsComplete,
  eligibilityFactsFromMetadata,
  missingEligibilityFactLabels,
  missingProviderAttestationLabels,
} from "../../lib/ccm/eligibility";
import { reasonLabel, statusLabel } from "../../lib/ccm/labels";
import { occurrenceDateForDisplay } from "../../lib/ccm/interaction-log-contract";
import type {
  AuditEvent,
  BillingEvidenceSnapshot,
  CarePlan,
  CcmEnrollment,
  CheckinInstance,
  CheckinResponse,
  InteractionLog,
  JsonValue,
  MonthlyBillability,
  Patient,
  PatientCondition,
  PatientIntakeSummary,
  Practice,
  Provider,
  Question,
} from "../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import { currentMonthValue, normalizeBillingMonth, withCoordinatorContext } from "../../lib/ccm/month-context";

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

type ConditionsResponse = {
  conditions?: PatientCondition[];
  error?: string;
};

type IntakeResponse = {
  error?: string;
  intakes?: PatientIntakeSummary[];
  latest?: PatientIntakeSummary | null;
  latestAccepted?: PatientIntakeSummary | null;
};

type Props = {
  initialEnrollment?: CcmEnrollment | null;
  initialMessage?: string | null;
  initialPatient: Patient;
  patientId: string;
  practiceId: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function jsonArrayLength(value: JsonValue): number {
  return Array.isArray(value) ? value.length : 0;
}

function hasCarePlanContent(plan: CarePlan | null): boolean {
  if (!plan) return false;
  return jsonArrayLength(plan.goals) > 0 && jsonArrayLength(plan.interventions) > 0;
}

function hasMeaningfulResponse(response: ResponseWithQuestion): boolean {
  if (typeof response.response_text === "string" && response.response_text.trim()) {
    return true;
  }

  if (response.response_value === null || response.response_value === undefined) {
    return false;
  }

  if (typeof response.response_value === "string") {
    return response.response_value.trim().length > 0;
  }

  return true;
}

function statusTone(complete: boolean, warning = false): string {
  if (complete) return "border-green-200 bg-green-50 text-green-800";
  if (warning) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function billabilityTone(status: string | null | undefined): string {
  if (status === "ready_to_bill" || status === "billed") {
    return "border-green-200 bg-green-50 text-green-800";
  }
  if (status === "hold") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function WorkspaceCard({
  action,
  children,
  description,
  status,
  title,
  tone,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  status?: string;
  title: string;
  tone?: string;
}) {
  return (
    <section className="rounded-md border bg-white p-4 text-black shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-700">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status ? (
            <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${tone ?? ""}`}>
              {status}
            </span>
          ) : null}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

function MissingList({ items, emptyLabel }: { emptyLabel: string; items: string[] }) {
  if (items.length === 0) {
    return <div className="text-sm font-medium text-green-800">{emptyLabel}</div>;
  }

  return (
    <ul className="space-y-1 text-sm text-slate-800">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-slate-50" href={href}>
      {label}
    </Link>
  );
}

export default function PatientWorkspace({
  initialEnrollment,
  initialMessage,
  initialPatient,
  patientId,
  practiceId,
}: Props) {
  const searchParams = useSearchParams();
  const [billingMonth, setBillingMonth] = useState(() => normalizeBillingMonth(searchParams.get("month") ?? currentMonthValue()));
  const context = useMemo(() => ({ month: billingMonth, source: searchParams.get("source") === "billing" ? "billing" as const : "worklist" as const }), [billingMonth, searchParams]);
  const [patient, setPatient] = useState(initialPatient);
  const [enrollment, setEnrollment] = useState<CcmEnrollment | null>(initialEnrollment ?? null);
  const [packet, setPacket] = useState<AuditPacketResponse | null>(null);
  const [conditions, setConditions] = useState<ConditionManagerValue[]>([]);
  const [latestIntake, setLatestIntake] = useState<PatientIntakeSummary | null>(null);
  const [latestAcceptedIntake, setLatestAcceptedIntake] =
    useState<PatientIntakeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingConditions, setSavingConditions] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getSupabaseAuthHeaders();
      const [packetResponse, conditionsResponse, intakeResponse] = await Promise.all([
        fetch(
          `/api/audit-packet?practiceId=${encodeURIComponent(
            practiceId,
          )}&patientId=${encodeURIComponent(patientId)}&billingMonth=${encodeURIComponent(
            billingMonth,
          )}`,
          { headers },
        ),
        fetch(
          `/api/patient-conditions?practiceId=${encodeURIComponent(
            practiceId,
          )}&patientId=${encodeURIComponent(patientId)}&includeInactive=true`,
          { headers },
        ),
        fetch(
          `/api/patient-intake?practiceId=${encodeURIComponent(
            practiceId,
          )}&patientId=${encodeURIComponent(patientId)}`,
          { headers },
        ),
      ]);

      const packetResult = (await packetResponse.json()) as AuditPacketResponse;
      const conditionsResult = (await conditionsResponse.json()) as ConditionsResponse;
      const intakeResult = (await intakeResponse.json()) as IntakeResponse;

      if (!packetResponse.ok || !packetResult.patient) {
        throw new Error(packetResult.error ?? "Unable to load patient workspace.");
      }

      if (!conditionsResponse.ok) {
        throw new Error(conditionsResult.error ?? "Unable to load conditions.");
      }

      if (!intakeResponse.ok) {
        throw new Error(intakeResult.error ?? "Unable to load intake status.");
      }

      setPacket(packetResult);
      setPatient(packetResult.patient);
      setEnrollment(packetResult.enrollment ?? null);
      setConditions((conditionsResult.conditions ?? []).map(managerConditionFromPatient));
      setLatestIntake(intakeResult.latest ?? null);
      setLatestAcceptedIntake(intakeResult.latestAccepted ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [billingMonth, patientId, practiceId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function saveConditions() {
    setSavingConditions(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/patient-conditions", {
        body: JSON.stringify({
          conditionItems: conditionPayload(conditions),
          patientId,
          practiceId,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await getSupabaseAuthHeaders()),
        },
        method: "PUT",
      });
      const result = (await response.json()) as ConditionsResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save conditions.");
      }

      setMessage("Conditions saved.");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save conditions.");
    } finally {
      setSavingConditions(false);
    }
  }

  const practice = packet?.practice ?? null;
  const provider = packet?.provider ?? null;
  const activeCarePlan = (packet?.carePlans ?? []).find((plan) => plan.status === "active") ?? null;
  const checkIn = packet?.checkIn ?? null;
  const responses = packet?.responses ?? [];
  const logs = packet?.interactionLogs ?? [];
  const billability = packet?.billability ?? null;
  const evidenceSnapshot = packet?.evidenceSnapshot ?? null;
  const threshold = practice?.ccm_monthly_min_minutes ?? 20;
  const totalMinutes = logs.reduce((total, log) => total + Number(log.minutes ?? 0), 0);
  const remainingMinutes = Math.max(threshold - totalMinutes, 0);
  const qualifyingConditionCount = conditions.filter(
    (condition) => condition.isActive && condition.ccmQualifying,
  ).length;
  const eligibilityFactsComplete = allEligibilityFactsComplete(enrollment?.eligibility_metadata);
  const providerAttestationsComplete = allProviderAttestationsComplete(
    enrollment?.eligibility_metadata,
  );
  const eligibilityMissing = [
    ...(enrollment?.status === "active" ? [] : ["Active CCM enrollment is missing"]),
    ...(enrollment?.eligibility_status === "eligible" ? [] : ["Eligibility is not marked eligible"]),
    ...missingEligibilityFactLabels(enrollment?.eligibility_metadata),
    ...missingProviderAttestationLabels(enrollment?.eligibility_metadata),
    ...(qualifyingConditionCount >= 2
      ? []
      : [`${2 - qualifyingConditionCount} more qualifying chronic condition${2 - qualifyingConditionCount === 1 ? "" : "s"} needed`]),
    ...(provider ? [] : ["Billing practitioner is missing"]),
    ...(provider?.manual_review_status === "needs_review"
      ? ["Billing practitioner manual review is still required"]
      : []),
  ];
  const missingConsentElements = missingConsentElementLabels(enrollment?.consent_metadata);
  const consentMissing = [
    ...(enrollment?.consent_status === "obtained" ? [] : ["Consent has not been obtained"]),
    ...(enrollment?.consent_date ? [] : ["Consent date is missing"]),
    ...(enrollment?.consent_method &&
    ["verbal", "written", "electronic"].includes(enrollment.consent_method)
      ? []
      : ["Consent method is missing"]),
    ...missingConsentElements,
  ];
  const carePlanMissing = [
    ...(activeCarePlan ? [] : ["Active care plan is missing"]),
    ...(activeCarePlan && !hasCarePlanContent(activeCarePlan)
      ? ["Care plan needs goals and interventions"]
      : []),
    ...(activeCarePlan?.last_reviewed_at ? [] : ["Care plan review date is missing"]),
  ];
  const hasCompleteCheckIn =
    Boolean(checkIn) &&
    (checkIn?.status === "responded" || checkIn?.status === "closed") &&
    responses.some(hasMeaningfulResponse);
  const monthlyMissing = [
    ...(checkIn ? [] : ["Monthly check-in has not been created"]),
    ...(checkIn && !hasCompleteCheckIn
      ? ["Check-in needs a response or documented closure"]
      : []),
    ...(remainingMinutes === 0 ? [] : [`${remainingMinutes} more CCM minute${remainingMinutes === 1 ? "" : "s"} needed`]),
  ];
  const billingMissing = [
    ...eligibilityMissing,
    ...consentMissing,
    ...(latestAcceptedIntake ? [] : ["Reviewed AI intake summary is missing"]),
    ...carePlanMissing,
    ...monthlyMissing,
  ];
  const medicareReviewed =
    eligibilityFactsFromMetadata(enrollment?.eligibility_metadata)
      .medicare_information_reviewed === true;
  const currentStatus =
    billability?.status ?? enrollment?.status ?? patient.status ?? "not_ready";

  const timeline = [
    checkIn
      ? `Check-in ${statusLabel(checkIn.status).toLowerCase()} ${formatDateTime(
          checkIn.responded_at ?? checkIn.closed_at ?? checkIn.sent_at,
        )}`
      : null,
    ...logs.slice(0, 3).map(
      (log) =>
        `${log.minutes} min ${statusLabel(log.activity_type).toLowerCase()} on ${occurrenceDateForDisplay(log)}`,
    ),
  ].filter(Boolean) as string[];

  if (loading && !packet) {
    return <main className="p-6 text-sm text-slate-700">Loading workspace...</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <div className="rounded-md border bg-white p-5 text-black shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-700">Patient Workspace</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {patient.display_name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
              <span>DOB: {formatDate(patient.dob)}</span>
              <span>Medicare: {medicareReviewed ? "Reviewed" : "Needs review"}</span>
              <span>Billing practitioner: {provider?.full_name ?? "Not assigned"}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${billabilityTone(currentStatus)}`}>
              Billing readiness: {statusLabel(currentStatus)}
            </div>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-slate-800">Billing month</span>
              <input
                className="block rounded-md border px-3 py-2"
                onChange={(event) => setBillingMonth(normalizeBillingMonth(event.target.value))}
                type="month"
                value={billingMonth.slice(0, 7)}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <QuickLink href={withCoordinatorContext(`/patients/${patientId}?edit=1`, context)} label="Edit patient" />
          <QuickLink href={withCoordinatorContext(`/patients/${patientId}/eligibility`, context)} label="Eligibility" />
          <QuickLink href={withCoordinatorContext(`/patients/${patientId}/intake`, context)} label="Patient intake" />
          <QuickLink href={withCoordinatorContext(`/patients/${patientId}/care-plan`, context)} label="Care plan" />
          <QuickLink href={withCoordinatorContext(`/patients/${patientId}/checkin`, context)} label="Check-in" />
          <QuickLink href={withCoordinatorContext(`/dashboard/log/${patientId}`, context)} label="Log time" />
          <QuickLink href={withCoordinatorContext(`/dashboard/billing/${patientId}/${billingMonth}`, { ...context, source: "billing" })} label="Billing evidence" />
        </div>
      </div>

      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <WorkspaceCard
          description="CCM requires documented eligibility facts and provider attestation before billing review."
          status={eligibilityMissing.length ? "Needs Review" : "Complete"}
          title="Eligibility"
          tone={statusTone(eligibilityMissing.length === 0, true)}
          action={<QuickLink href={withCoordinatorContext(`/patients/${patientId}/eligibility`, context)} label="Open" />}
        >
          <div className="space-y-3">
            <div className="grid gap-2 text-sm">
              <div>Status: {statusLabel(enrollment?.eligibility_status)}</div>
              <div>Facts: {eligibilityFactsComplete ? "Complete" : "Incomplete"}</div>
              <div>
                Billing practitioner attestation: {providerAttestationsComplete ? "Complete" : "Incomplete"}
              </div>
            </div>
            <MissingList emptyLabel="Eligibility is complete." items={eligibilityMissing} />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          description="CCM billing requires documented patient consent, including method, date, and required elements."
          status={consentMissing.length ? "Needs Review" : "Complete"}
          title="Consent"
          tone={statusTone(consentMissing.length === 0, true)}
          action={<QuickLink href={withCoordinatorContext(`/patients/${patientId}?edit=1`, context)} label="Edit" />}
        >
          <div className="space-y-3 text-sm">
            <div>Status: {statusLabel(enrollment?.consent_status)}</div>
            <div>Date: {formatDate(enrollment?.consent_date)}</div>
            <div>Type: {statusLabel(enrollment?.consent_method)}</div>
            <div>
              Required elements:{" "}
              {allConsentElementsComplete(enrollment?.consent_metadata)
                ? "Complete"
                : `${missingConsentElements.length} missing`}
            </div>
            <MissingList emptyLabel="Consent is complete." items={consentMissing} />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          description="Shows whether this patient-month has enough reviewed documentation for billing review."
          status={billingMissing.length ? "Blocked" : "Ready"}
          title="Billing Readiness"
          tone={statusTone(billingMissing.length === 0)}
          action={<QuickLink href={withCoordinatorContext(`/dashboard/billing/${patientId}/${billingMonth}`, { ...context, source: "billing" })} label="Evidence" />}
        >
          <div className="space-y-3">
            <div className="text-sm">
              Billing calculation: {billability ? statusLabel(billability.status) : "Not calculated yet"}
            </div>
            {billability?.reason_codes?.length ? (
              <MissingList
                emptyLabel="No billing blockers."
                items={billability.reason_codes.map(reasonLabel)}
              />
            ) : (
              <MissingList emptyLabel="No blocking requirements detected." items={billingMissing} />
            )}
          </div>
        </WorkspaceCard>
      </section>

      <ConditionManager
        addedByLabel="Current user"
        description="Document qualifying chronic conditions so eligibility, care planning, and billing review use the same list."
        onChange={setConditions}
        storageKey={`ccm-condition-manager:${practiceId}`}
        value={conditions}
      />
      <div className="-mt-3 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={savingConditions}
          onClick={saveConditions}
          type="button"
        >
          {savingConditions ? "Saving..." : "Save condition changes"}
        </button>
        <span className="text-sm text-slate-700">
          {qualifyingConditionCount >= 2
            ? "Condition readiness satisfied."
            : `${Math.max(2 - qualifyingConditionCount, 0)} more qualifying condition needed for CCM readiness.`}
        </span>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <WorkspaceCard
          description="AI intake can draft clinical documentation, but staff must review and accept it before use."
          status={latestAcceptedIntake ? "Complete" : latestIntake ? "Needs Review" : "Missing"}
          title="AI Intake"
          tone={statusTone(Boolean(latestAcceptedIntake), Boolean(latestIntake))}
          action={<QuickLink href={withCoordinatorContext(`/patients/${patientId}/intake`, context)} label="Open" />}
        >
          <div className="grid gap-2 text-sm">
            <div>AI draft: {latestIntake ? statusLabel(latestIntake.status) : "Not started"}</div>
            <div>Reviewed summary: {latestAcceptedIntake ? "Complete" : "Missing"}</div>
            <div>
              Last reviewed:{" "}
              {formatDateTime(latestAcceptedIntake?.accepted_at ?? latestAcceptedIntake?.updated_at)}
            </div>
            {latestIntake?.missing_information && jsonArrayLength(latestIntake.missing_information) > 0 ? (
              <div>{jsonArrayLength(latestIntake.missing_information)} missing information item(s)</div>
            ) : null}
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          description="An active, reviewed care plan anchors monthly CCM work and billing evidence."
          status={activeCarePlan ? statusLabel(activeCarePlan.status) : "Missing"}
          title="Care Plan"
          tone={statusTone(Boolean(activeCarePlan && hasCarePlanContent(activeCarePlan)), true)}
          action={<QuickLink href={withCoordinatorContext(`/patients/${patientId}/care-plan`, context)} label="Open" />}
        >
          <div className="space-y-3 text-sm">
            <div>Current status: {statusLabel(activeCarePlan?.status)}</div>
            <div>Last updated: {formatDateTime(activeCarePlan?.updated_at)}</div>
            <div>Provider review: {activeCarePlan?.last_reviewed_at ? "Reviewed" : "Missing"}</div>
            <MissingList emptyLabel="Care plan is ready for billing review." items={carePlanMissing} />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          description="Monthly contact and documented minutes show what CCM work was completed this billing month."
          status={remainingMinutes === 0 && hasCompleteCheckIn ? "Complete" : "Needs Review"}
          title="Monthly Progress"
          tone={statusTone(remainingMinutes === 0 && hasCompleteCheckIn, true)}
          action={<QuickLink href={withCoordinatorContext(`/dashboard/log/${patientId}`, context)} label="Log time" />}
        >
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border bg-slate-50 p-3">
                <div className="font-semibold text-slate-950">{totalMinutes}</div>
                <div className="text-slate-700">Minutes logged</div>
              </div>
              <div className="rounded-md border bg-slate-50 p-3">
                <div className="font-semibold text-slate-950">{remainingMinutes}</div>
                <div className="text-slate-700">Minutes remaining</div>
              </div>
              <div className="rounded-md border bg-slate-50 p-3">
                <div className="font-semibold text-slate-950">{statusLabel(checkIn?.status)}</div>
                <div className="text-slate-700">Check-in status</div>
              </div>
            </div>
            {timeline.length ? (
              <ul className="space-y-1">
                {timeline.map((item) => (
                  <li className="text-slate-700" key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-dashed bg-slate-50 p-3 text-slate-700">
                No monthly activity yet. Create or close a check-in and log CCM time for this billing month.
              </div>
            )}
            <MissingList emptyLabel="Monthly contact and minutes are complete." items={monthlyMissing} />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          description="Evidence links help the practice explain what supported the billing decision."
          status={evidenceSnapshot ? "Snapshot Available" : billability ? "Live Evidence" : "Blocked"}
          title="Audit"
          tone={statusTone(Boolean(evidenceSnapshot || billability), true)}
          action={
            <QuickLink
              href={withCoordinatorContext(`/dashboard/billing/${patientId}/${billingMonth}`, { ...context, source: "billing" })}
              label="Evidence"
            />
          }
        >
          <div className="grid gap-2 text-sm">
            <div>Evidence view: {evidenceSnapshot || billability ? "Available" : "Not available yet"}</div>
            <div>Last snapshot: {formatDateTime(evidenceSnapshot?.created_at)}</div>
            <div>Audit events: {packet?.auditEvents?.length ?? 0}</div>
            <div>Export: HTML evidence view available</div>
          </div>
        </WorkspaceCard>
      </section>
    </main>
  );
}
