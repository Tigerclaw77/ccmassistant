"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../Breadcrumbs";
import {
  ConditionManager,
  type ConditionManagerValue,
} from "../conditions/ConditionManager";
import {
  conditionPayload,
  managerConditionFromPatient,
} from "../conditions/patientConditionAdapters";
import {
  REQUIRED_CONSENT_ELEMENTS,
  consentElementsFromMetadata,
  type ConsentElementKey,
  type ConsentElementState,
} from "../../lib/ccm/consent";
import {
  allEligibilityFactsComplete,
  allProviderAttestationsComplete,
} from "../../lib/ccm/eligibility";
import {
  buildEnrollmentMutationRequest,
  consentDateFromFormData,
  normalizeConsentDateForStatus,
} from "../../lib/ccm/enrollment-contract";
import {
  CONSENT_METHODS,
  CONSENT_STATUSES,
  CONTACT_METHODS,
  ENROLLMENT_STATUSES,
  type AuditEvent,
  type CcmEnrollment,
  type PatientCondition,
  type Patient,
  type Provider,
} from "../../lib/ccm/types";
import { statusLabel } from "../../lib/ccm/labels";
import { calendarDateInTimeZone } from "../../lib/ccm/validation";
import { getSupabaseAuthHeaders } from "../../lib/supabase";

type Props = {
  consentAuditEvents?: AuditEvent[];
  enrollment?: CcmEnrollment | null;
  initialMessage?: string | null;
  mode: "create" | "edit";
  patient?: Patient | null;
  practiceId: string;
};

type PatientResponse = {
  code?: string;
  error?: string;
  patient?: Patient;
};

type EnrollmentResponse = {
  enrollment?: CcmEnrollment;
  error?: string;
};

type ActivePracticeResponse = {
  membership?: {
    id: string;
    role: string;
  };
  practice?: {
    default_timezone: string;
  };
};

type ProvidersResponse = {
  error?: string;
  providers?: Provider[];
};

type ConditionsResponse = {
  conditions?: PatientCondition[];
  error?: string;
};

type IntakeResponse = {
  latestAccepted?: {
    id: string;
  } | null;
};

function fieldValue(value: string | null | undefined): string {
  return value ?? "";
}

function displayLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ChecklistItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          complete ? "bg-green-600" : "bg-gray-300"
        }`}
      />
      <span className={complete ? "text-gray-900" : "text-gray-600"}>{label}</span>
    </div>
  );
}

export default function PatientForm({
  consentAuditEvents = [],
  enrollment,
  initialMessage,
  mode,
  patient,
  practiceId,
}: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(fieldValue(patient?.first_name));
  const [lastName, setLastName] = useState(fieldValue(patient?.last_name));
  const [displayName, setDisplayName] = useState(fieldValue(patient?.display_name));
  const [dob, setDob] = useState(fieldValue(patient?.dob));
  const [phone, setPhone] = useState(fieldValue(patient?.phone));
  const [email, setEmail] = useState(fieldValue(patient?.email));
  const [externalId, setExternalId] = useState(fieldValue(patient?.external_id));
  const [preferredContactMethod, setPreferredContactMethod] = useState<string>(
    patient?.preferred_contact_method ?? "phone",
  );
  const [patientStatus, setPatientStatus] = useState(patient?.status ?? "active");
  const [primaryProviderId, setPrimaryProviderId] = useState(
    fieldValue(patient?.primary_provider_id),
  );
  const [careCoordinatorMemberId, setCareCoordinatorMemberId] = useState(
    fieldValue(patient?.care_coordinator_member_id ?? enrollment?.care_coordinator_member_id),
  );
  const [providers, setProviders] = useState<Provider[]>([]);
  const [conditions, setConditions] = useState<ConditionManagerValue[]>([]);
  const [reviewedIntakeAccepted, setReviewedIntakeAccepted] = useState(false);
  const [maximumCalendarDate, setMaximumCalendarDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [enrollmentStatus, setEnrollmentStatus] = useState<string>(
    enrollment?.status ?? "pending",
  );
  const [eligibilityStatus] = useState<string>(
    enrollment?.eligibility_status ?? "needs_review",
  );
  const [eligibilityNotes, setEligibilityNotes] = useState(
    fieldValue(enrollment?.eligibility_notes),
  );
  const [consentStatus, setConsentStatus] = useState<string>(
    enrollment?.consent_status ?? "not_collected",
  );
  const [consentDate, setConsentDate] = useState(fieldValue(enrollment?.consent_date));
  const [consentMethod, setConsentMethod] = useState<string>(
    enrollment?.consent_method ?? "unknown",
  );
  const [consentElements, setConsentElements] = useState<ConsentElementState>(() =>
    consentElementsFromMetadata(enrollment?.consent_metadata),
  );
  const [initiatingVisitDate, setInitiatingVisitDate] = useState(
    fieldValue(enrollment?.initiating_visit_date),
  );
  const [assignedProviderId, setAssignedProviderId] = useState(
    fieldValue(enrollment?.assigned_provider_id ?? patient?.primary_provider_id),
  );

  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(initialMessage ?? null);
  const [saving, setSaving] = useState(false);
  const [allowPotentialDuplicate, setAllowPotentialDuplicate] = useState(false);

  const resolvedDisplayName =
    displayName.trim() || [firstName, lastName].filter(Boolean).join(" ").trim();
  const soleProvider = providers.length === 1 ? providers[0] : null;
  const showSeparateProviderChoices = !soleProvider || Boolean(
    primaryProviderId && assignedProviderId && primaryProviderId !== assignedProviderId,
  );
  const consentElementsComplete = REQUIRED_CONSENT_ELEMENTS.every(
    (element) => consentElements[element.key],
  );
  const eligibilityFactsComplete = allEligibilityFactsComplete(enrollment?.eligibility_metadata);
  const providerAttestationsComplete = allProviderAttestationsComplete(
    enrollment?.eligibility_metadata,
  );
  const qualifyingConditionCount = conditions.filter(
    (condition) => condition.isActive && condition.ccmQualifying,
  ).length;

  useEffect(() => {
    let active = true;

    async function loadMvpContext() {
      const activePracticeId = localStorage.getItem("activePracticeId");
      const [activeResponse, providersResponse] = await Promise.all([
        fetch("/api/practices/active", {
          headers: {
            ...(await getSupabaseAuthHeaders()),
            ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
          },
        }),
        fetch(`/api/providers?practiceId=${encodeURIComponent(practiceId)}`, {
          headers: await getSupabaseAuthHeaders(),
        }),
      ]);

      const activeResult = (await activeResponse.json()) as ActivePracticeResponse;
      const providersResult = (await providersResponse.json()) as ProvidersResponse;

      if (!active) return;

      if (activeResult.membership?.id && ["owner", "admin", "coordinator"].includes(activeResult.membership.role)) {
        setCareCoordinatorMemberId((current) => current || activeResult.membership!.id);
      }
      if (activeResult.practice?.default_timezone) {
        setMaximumCalendarDate(
          calendarDateInTimeZone(new Date(), activeResult.practice.default_timezone),
        );
      }

      const providerRows = providersResult.providers ?? [];
      setProviders(providerRows);

      if (providerRows.length === 1) {
        setPrimaryProviderId((current) => current || providerRows[0].id);
        setAssignedProviderId((current) => current || providerRows[0].id);
      }
    }

    void loadMvpContext();

    return () => {
      active = false;
    };
  }, [practiceId]);

  useEffect(() => {
    let active = true;

    async function loadConditions() {
      if (!patient?.id) return;

      const [conditionsResponse, intakeResponse] = await Promise.all([
        fetch(
          `/api/patient-conditions?practiceId=${encodeURIComponent(
            practiceId,
          )}&patientId=${encodeURIComponent(patient.id)}&includeInactive=true`,
          { headers: await getSupabaseAuthHeaders() },
        ),
        fetch(
          `/api/patient-intake?practiceId=${encodeURIComponent(
            practiceId,
          )}&patientId=${encodeURIComponent(patient.id)}`,
          { headers: await getSupabaseAuthHeaders() },
        ),
      ]);
      const conditionsResult = (await conditionsResponse.json()) as ConditionsResponse;
      const intakeResult = (await intakeResponse.json()) as IntakeResponse;

      if (!active) return;

      setConditions((conditionsResult.conditions ?? []).map(managerConditionFromPatient));
      setReviewedIntakeAccepted(Boolean(intakeResult.latestAccepted));
    }

    void loadConditions();

    return () => {
      active = false;
    };
  }, [patient?.id, practiceId]);

  function updateConsentElement(key: ConsentElementKey, value: boolean) {
    setConsentElements((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);

    let submittedConsentDate: string | null;

    try {
      submittedConsentDate = normalizeConsentDateForStatus(
        consentStatus,
        consentDateFromFormData(new FormData(event.currentTarget)),
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Consent date is invalid");
      return;
    }

    if (!resolvedDisplayName) {
      setError("Display name or first and last name is required");
      return;
    }

    setSaving(true);

    const patientPayload = {
      displayName: resolvedDisplayName,
      dob,
      email,
      externalId,
      firstName,
      lastName,
      patientId: patient?.id,
      phone,
      practiceId,
      preferredContactMethod,
      primaryProviderId,
      careCoordinatorMemberId,
      allowPotentialDuplicate,
      status: patientStatus,
    };

    const patientResponse = await fetch("/api/patients", {
      body: JSON.stringify(patientPayload),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: mode === "edit" ? "PATCH" : "POST",
    });
    const patientResult = (await patientResponse.json()) as PatientResponse;

    if (!patientResponse.ok || !patientResult.patient) {
      setSaving(false);
      if (patientResult.code === "potential_duplicate") {
        setAllowPotentialDuplicate(true);
      }
      setError(patientResult.error ?? "Unable to save patient");
      return;
    }

    const savedPatient = patientResult.patient;
    setAllowPotentialDuplicate(false);

    const conditionsResponse = await fetch("/api/patient-conditions", {
      body: JSON.stringify({
        conditionItems: conditionPayload(conditions),
        patientId: savedPatient.id,
        practiceId,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "PUT",
    });
    const conditionsResult = (await conditionsResponse.json()) as ConditionsResponse;

    if (!conditionsResponse.ok) {
      setSaving(false);
      setError(conditionsResult.error ?? "Patient saved, but conditions were not saved");
      return;
    }

    const shouldStampEnrollment =
      enrollmentStatus === "active" && !enrollment?.enrolled_at;
    const enrollmentPayload = buildEnrollmentMutationRequest({
      consentDate: submittedConsentDate,
      consentMethod,
      consentStatus,
      eligibilityNotes,
      eligibilityStatus,
      enrolledAt: shouldStampEnrollment ? new Date().toISOString() : undefined,
      enrollmentId: enrollment?.id,
      initiatingVisitDate,
      patientId: savedPatient.id,
      practiceId,
      assignedProviderId,
      careCoordinatorMemberId,
      status: enrollmentStatus,
      consentElements,
    });

    const enrollmentResponse = await fetch("/api/enroll", {
      body: JSON.stringify(enrollmentPayload),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: mode === "edit" && enrollment?.id ? "PATCH" : "POST",
    });
    const enrollmentResult = (await enrollmentResponse.json()) as EnrollmentResponse;

    setSaving(false);

    if (!enrollmentResponse.ok || !enrollmentResult.enrollment) {
      setError(enrollmentResult.error ?? "Patient saved, but enrollment was not saved");
      return;
    }

    if (mode === "create") {
      router.replace(`/patients/${savedPatient.id}?created=1`);
      return;
    }

    setSavedMessage("Patient saved. Review any remaining billing readiness items in the workspace.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-5xl space-y-6">
      <Breadcrumbs
        items={[
          { href: "/patients", label: "Patients" },
          { label: mode === "create" ? "New patient" : resolvedDisplayName || "Patient" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {mode === "create" ? "New Patient" : resolvedDisplayName}
          </h1>
          <div className="text-sm text-gray-600">
            Capture the patient details needed for enrollment, consent, care planning, and billing review.
          </div>
        </div>
        <Link className="text-sm underline" href="/patients">
          Patients
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {savedMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {savedMessage}
        </div>
      ) : null}

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Patient</h2>
          <p className="mt-1 text-sm text-gray-600">
            Demographics identify the patient in care-management records and billing evidence.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">First name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              autoComplete="given-name"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Last name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              autoComplete="family-name"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Date of birth</span>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={dob}
              onChange={(event) => setDob(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              autoComplete="tel"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              autoComplete="email"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">External ID</span>
            <input
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Preferred contact</span>
            <select
              value={preferredContactMethod}
              onChange={(event) => setPreferredContactMethod(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              {CONTACT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {displayLabel(method)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Patient status</span>
            <select
              value={patientStatus}
              onChange={(event) => setPatientStatus(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          {showSeparateProviderChoices ? <label className="space-y-1 text-sm">
            <span className="font-medium">Primary billing practitioner</span>
            <select
              value={primaryProviderId}
              onChange={(event) => {
                setPrimaryProviderId(event.target.value);
                if (!assignedProviderId) setAssignedProviderId(event.target.value);
              }}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select billing practitioner</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.full_name}
                </option>
              ))}
            </select>
          </label> : <div className="space-y-1 text-sm"><span className="font-medium">Billing practitioner</span><div className="rounded-md border bg-gray-50 px-3 py-2 text-gray-700">{soleProvider?.full_name}</div></div>}

        </div>
      </section>

      <ConditionManager
        addedByLabel="Current user"
        description="Document qualifying chronic conditions so CCM eligibility and care planning use the same reviewed list."
        onChange={setConditions}
        storageKey={`ccm-condition-manager:${practiceId}`}
        value={conditions}
      />

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Enrollment</h2>
          <p className="mt-1 text-sm text-gray-600">
            Enrollment, consent, and assignment determine whether this patient can enter CCM billing review.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Enrollment status</span>
            <select
              value={enrollmentStatus}
              onChange={(event) => setEnrollmentStatus(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              {ENROLLMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1 text-sm">
            <span className="font-medium">Eligibility</span>
            <div className="rounded-md border bg-gray-50 px-3 py-2 text-gray-700">
              {statusLabel(eligibilityStatus)}
            </div>
            {patient?.id ? (
              <Link className="text-xs underline" href={`/patients/${patient.id}/eligibility`}>
                Open structured eligibility review
              </Link>
            ) : (
              <div className="text-xs text-gray-600">
                Save the patient before completing structured eligibility.
              </div>
            )}
          </div>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Consent status</span>
            <select
              value={consentStatus}
              onChange={(event) => {
                const nextStatus = event.target.value;
                setConsentStatus(nextStatus);
                if (nextStatus !== "obtained") setConsentDate("");
              }}
              className="w-full rounded-md border px-3 py-2"
            >
              {CONSENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Consent method</span>
            <select
              value={consentMethod}
              onChange={(event) => setConsentMethod(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              {CONSENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {displayLabel(method)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Consent date</span>
            <input
              name="consentDate"
              type="date"
              max={maximumCalendarDate}
              value={consentDate}
              onChange={(event) => setConsentDate(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          <div className="space-y-3 rounded-md border bg-gray-50 p-3 text-sm md:col-span-2">
            <div>
              <div className="font-medium">Required CMS consent elements</div>
              <div className="text-xs text-gray-600">
                These items document why consent supports CCM billing review.
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {REQUIRED_CONSENT_ELEMENTS.map((element) => (
                <label className="flex gap-2" key={element.key}>
                  <input
                    checked={consentElements[element.key]}
                    className="mt-1"
                    onChange={(event) =>
                      updateConsentElement(element.key, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>{element.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Initiating visit date</span>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={initiatingVisitDate}
              onChange={(event) => setInitiatingVisitDate(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>

          {showSeparateProviderChoices ? <label className="space-y-1 text-sm">
            <span className="font-medium">Assigned billing practitioner</span>
            <select
              value={assignedProviderId}
              onChange={(event) => setAssignedProviderId(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select billing practitioner</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.full_name}
                </option>
              ))}
            </select>
          </label> : null}

          <label className="space-y-1 text-sm">
            <span className="font-medium">Care coordinator</span>
            <input
              value={careCoordinatorMemberId ? "Current user" : "Not resolved"}
              readOnly
              className="w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-700"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Eligibility notes</span>
            <textarea
              value={eligibilityNotes}
              onChange={(event) => setEligibilityNotes(event.target.value)}
              className="min-h-24 w-full rounded-md border px-3 py-2"
            />
          </label>

          <div className="rounded-md border bg-gray-50 p-3 text-sm md:col-span-2">
            <div className="font-medium">Consent audit history</div>
            {consentAuditEvents.length === 0 ? (
              <div className="mt-1 text-gray-600">
                No consent history yet. Save consent details to create an audit trail.
              </div>
            ) : (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {consentAuditEvents.map((event) => (
                  <div key={event.id}>
                    Consent updated {new Date(event.created_at).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 text-black">
        <div className="mb-4">
          <h2 className="text-base font-semibold">First billable month checklist</h2>
          <p className="mt-1 text-sm text-gray-600">
            This checklist explains why the patient-month is or is not ready for billing review.
          </p>
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <ChecklistItem complete={enrollmentStatus === "active"} label="Enrollment active" />
          <ChecklistItem
            complete={
              eligibilityStatus === "eligible" &&
              eligibilityFactsComplete &&
              providerAttestationsComplete
            }
            label="Eligibility facts and provider attestation complete"
          />
          <ChecklistItem
            complete={
              consentStatus === "obtained" &&
              consentMethod !== "unknown" &&
              Boolean(consentDate) &&
              consentElementsComplete
            }
            label="Consent obtained, dated, and complete"
          />
          <ChecklistItem
            complete={qualifyingConditionCount >= 2}
            label="Two qualifying chronic conditions captured"
          />
          <ChecklistItem complete={Boolean(assignedProviderId || primaryProviderId)} label="Billing practitioner assigned" />
          <ChecklistItem complete={Boolean(careCoordinatorMemberId)} label="Coordinator assigned" />
          <ChecklistItem complete={reviewedIntakeAccepted} label="Reviewed AI intake accepted" />
        </div>

        {patient?.id ? (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link className="underline" href={`/patients/${patient.id}/care-plan`}>
              Care plan
            </Link>
            <Link className="underline" href={`/patients/${patient.id}/eligibility`}>
              Eligibility
            </Link>
            <Link className="underline" href={`/patients/${patient.id}/intake`}>
              AI intake
            </Link>
            <Link className="underline" href={`/patients/${patient.id}/checkin`}>
              Monthly check-in
            </Link>
            <Link className="underline" href={`/dashboard/log/${patient.id}`}>
              Log time
            </Link>
            <Link className="underline" href="/dashboard/billing">
              Billing
            </Link>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-600">
            Save the patient to continue to care plan, monthly check-in, time logs, and billing.
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md border bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <Link className="text-sm underline" href="/patients">
          Cancel
        </Link>
      </div>
    </form>
  );
}
