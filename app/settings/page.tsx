"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAuthHeaders, supabase } from "../../lib/supabase";
import {
  BILLING_PRACTITIONER_TYPES,
  PROVIDER_MANUAL_REVIEW_STATUSES,
  isSupportedBillingPractitionerType,
  type BillingPractitionerType,
  type ProviderManualReviewStatus,
} from "../../lib/ccm/types";
import { ReceiptText, ShieldCheck, Stethoscope, UserCog, UsersRound } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import StaffManagement from "../../components/settings/StaffManagement";
import type { PracticeRole } from "../../lib/ccm/types";
import { DEFAULT_OPPORTUNITY_EXPIRATION_DAYS, OPPORTUNITY_TYPES, type OpportunityType } from "../../lib/ccm/opportunity-detector";
import { expirationOverridesFromJson } from "../../lib/ccm/workflow-settings";

type Practice = {
  id: string;
  name: string;
  default_timezone: string;
  ccm_monthly_min_minutes: number;
  billing_settings: unknown;
  allow_coordinator_claiming: boolean;
  ccm_month_end_awareness_day: number;
  opportunity_expiration_overrides: import("../../lib/ccm/types").JsonValue;
};

type Provider = {
  id: string;
  full_name: string;
  credentials: string | null;
  npi: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  billing_practitioner_type: BillingPractitionerType;
  manual_review_status: ProviderManualReviewStatus;
  manual_review_reason: string | null;
};

type PracticeForm = {
  name: string;
  address: string;
  phone: string;
  timezone: string;
  threshold: number;
  cmsEligibilityAttested: boolean;
  medicareEnrollmentAttested: boolean;
  allowCoordinatorClaiming: boolean;
  monthEndAwarenessDay: number;
  expirationDays: Record<OpportunityType, number>;
};

const SUGGESTION_TYPE_LABELS: Record<OpportunityType, string> = {
  abnormal_questionnaire: "Abnormal questionnaire",
  care_plan_revision: "Care-plan revision",
  educational_reminder: "Educational reminder",
  home_monitoring: "Home monitoring",
  hospital_discharge: "Hospital discharge",
  medication_follow_up: "Medication follow-up",
  month_end_operational_reminder: "Month-end operational reminder",
  provider_review: "Provider review",
};

type NewProviderForm = {
  fullName: string;
  credentials: string;
  npi: string;
  email: string;
  phone: string;
  billingPractitionerType: BillingPractitionerType;
};

type ProviderEditForm = NewProviderForm & {
  isActive: boolean;
  manualReviewReason: string;
  manualReviewStatus: ProviderManualReviewStatus;
};

const EMPTY_PROVIDER: NewProviderForm = {
  credentials: "",
  email: "",
  fullName: "",
  npi: "",
  phone: "",
  billingPractitionerType: "physician",
};

function billingSettingsObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function billingSetting(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function billingSettingBoolean(value: unknown): boolean {
  return value === true;
}

function roleLabel(role: string): string {
  return role
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function providerToEditForm(provider: Provider): ProviderEditForm {
  return {
    billingPractitionerType: provider.billing_practitioner_type,
    credentials: provider.credentials ?? "",
    email: provider.email ?? "",
    fullName: provider.full_name,
    isActive: provider.is_active,
    manualReviewReason: provider.manual_review_reason ?? "",
    manualReviewStatus: provider.manual_review_status,
    npi: provider.npi ?? "",
    phone: provider.phone ?? "",
  };
}

function statusBadgeClass(tone: "good" | "muted" | "warning") {
  if (tone === "good") return "border-green-200 bg-green-50 text-green-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-sm font-semibold text-slate-800">
      {children}
      {required ? (
        <span className="ml-2 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
          Required
        </span>
      ) : null}
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [practiceId, setPracticeId] = useState<string>("");
  const [practiceForm, setPracticeForm] = useState<PracticeForm>({
    address: "",
    cmsEligibilityAttested: false,
    medicareEnrollmentAttested: false,
    allowCoordinatorClaiming: false,
    monthEndAwarenessDay: 25,
    expirationDays: { ...DEFAULT_OPPORTUNITY_EXPIRATION_DAYS },
    name: "",
    phone: "",
    threshold: 20,
    timezone: "America/Chicago",
  });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentRole, setCurrentRole] = useState<PracticeRole | null>(null);
  const [newProvider, setNewProvider] = useState<NewProviderForm>(EMPTY_PROVIDER);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerDraft, setProviderDraft] = useState<ProviderEditForm | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authedHeaders(): Promise<HeadersInit> {
    const headers = await getSupabaseAuthHeaders();
    return {
      ...headers,
      ...(practiceId ? { "x-active-practice-id": practiceId } : {}),
    };
  }

  const loadSettings = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      setDisplayName(session.user.user_metadata?.display_name ?? "");
      setUserEmail(session.user.email ?? "");

      const activePracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });

      if (!activeResponse.ok) {
        throw new Error("Unable to load active practice.");
      }

      const activeResult = (await activeResponse.json()) as { membership?: { role: PracticeRole }; practice: Practice };
      const practice = activeResult.practice;
      setCurrentRole(activeResult.membership?.role ?? null);
      const settings = billingSettingsObject(practice.billing_settings);
      localStorage.setItem("activePracticeId", practice.id);
      setPracticeId(practice.id);
      setPracticeForm({
        address: billingSetting(settings.address),
        cmsEligibilityAttested: billingSettingBoolean(settings.cms_eligibility_attested),
        medicareEnrollmentAttested: billingSettingBoolean(
          settings.medicare_enrollment_attested,
        ),
        allowCoordinatorClaiming: practice.allow_coordinator_claiming === true,
        monthEndAwarenessDay: practice.ccm_month_end_awareness_day ?? 25,
        expirationDays: {
          ...DEFAULT_OPPORTUNITY_EXPIRATION_DAYS,
          ...expirationOverridesFromJson(practice.opportunity_expiration_overrides),
        },
        name: practice.name,
        phone: billingSetting(settings.phone),
        threshold: practice.ccm_monthly_min_minutes ?? 20,
        timezone: practice.default_timezone ?? "America/Chicago",
      });

      const providersResponse = await fetch(`/api/providers?practiceId=${practice.id}&includeInactive=true`, {
        headers: await getSupabaseAuthHeaders(),
      });

      if (!providersResponse.ok) {
        throw new Error("Unable to load billing practitioners.");
      }

      const providersResult = (await providersResponse.json()) as { providers: Provider[] };

      setProviders(providersResult.providers ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function savePractice() {
    setSaving("practice");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/practices/active", {
        body: JSON.stringify({
          address: practiceForm.address,
          ccmMonthlyMinMinutes: Number(practiceForm.threshold),
          cmsEligibilityAttested: practiceForm.cmsEligibilityAttested,
          defaultTimezone: practiceForm.timezone,
          medicareEnrollmentAttested: practiceForm.medicareEnrollmentAttested,
          allowCoordinatorClaiming: practiceForm.allowCoordinatorClaiming,
          ccmMonthEndAwarenessDay: Number(practiceForm.monthEndAwarenessDay),
          opportunityExpirationOverrides: practiceForm.expirationDays,
          name: practiceForm.name,
          phone: practiceForm.phone,
          practiceId,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "PATCH",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save practice settings.");
      }

      setMessage("Settings saved.");
      await loadSettings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save practice settings.");
    } finally {
      setSaving(null);
    }
  }

  async function addProvider() {
    setSaving("new-provider");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          credentials: newProvider.credentials,
          billingPractitionerType: newProvider.billingPractitionerType,
          email: newProvider.email,
          fullName: newProvider.fullName,
          npi: newProvider.npi,
          phone: newProvider.phone,
          practiceId,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to add billing practitioner.");
      }

      setNewProvider(EMPTY_PROVIDER);
      setMessage("Billing practitioner added.");
      await loadSettings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add billing practitioner.");
    } finally {
      setSaving(null);
    }
  }

  async function saveProvider(provider: Provider) {
    if (!providerDraft || editingProviderId !== provider.id) return;

    setSaving(provider.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          credentials: providerDraft.credentials,
          billingPractitionerType: providerDraft.billingPractitionerType,
          email: providerDraft.email,
          fullName: providerDraft.fullName,
          isActive: providerDraft.isActive,
          manualReviewReason: providerDraft.manualReviewReason,
          manualReviewStatus: providerDraft.manualReviewStatus,
          npi: providerDraft.npi,
          phone: providerDraft.phone,
          practiceId,
          providerId: provider.id,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "PATCH",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save billing practitioner.");
      }

      setMessage("Billing practitioner saved.");
      setProviders((current) =>
        current.map((item) => (item.id === provider.id ? result.provider : item)),
      );
      setEditingProviderId(null);
      setProviderDraft(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save billing practitioner.");
    } finally {
      setSaving(null);
    }
  }

  async function saveAccount() {
    setSaving("account");
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
      },
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Account saved.");
    }

    setSaving(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("activePracticeId");
    router.replace("/login");
  }

  async function openStripeBilling(destination: "checkout" | "portal") {
    setSaving(`stripe-${destination}`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/stripe/${destination}`, {
        body: JSON.stringify({ practiceId }),
        headers: {
          ...(await authedHeaders()),
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        portalUrl?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to open Stripe billing.");

      const destinationUrl = destination === "checkout" ? result.checkoutUrl : result.portalUrl;
      if (!destinationUrl) throw new Error("Stripe did not return a billing URL.");
      window.location.assign(destinationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open Stripe billing.");
      setSaving(null);
    }
  }

  function startProviderEdit(provider: Provider) {
    setMessage(null);
    setError(null);
    setEditingProviderId(provider.id);
    setProviderDraft(providerToEditForm(provider));
  }

  function cancelProviderEdit() {
    setEditingProviderId(null);
    setProviderDraft(null);
  }

  function updateProviderDraft(patch: Partial<ProviderEditForm>) {
    setProviderDraft((current) => (current ? { ...current, ...patch } : current));
  }

  if (loading) {
    return <main className="page-shell"><LoadingState label="Loading practice settings" /></main>;
  }

  return (
    <main className="page-shell max-w-6xl">
      <div>
        <p className="eyebrow">Practice administration</p>
        <h1 className="page-title mt-1">Settings</h1>
        <p className="page-description">Manage practice details, billing practitioners, staff access, and your account.</p>
      </div>

      {message ? (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <nav aria-label="Settings sections" className="grid gap-3 md:grid-cols-5">
        <a className="surface p-4 hover:bg-slate-50" href="#practice">
          <div className="text-sm font-semibold text-slate-900">Practice</div>
          <div className="mt-1 text-xs text-slate-600">Name, phone, address, threshold</div>
        </a>
        <a className="surface p-4 hover:bg-slate-50" href="#providers">
          <div className="text-sm font-semibold text-slate-900">Billing Practitioners</div>
          <div className="mt-1 text-xs text-slate-600">{providers.length} practitioner{providers.length === 1 ? "" : "s"} configured</div>
        </a>
        {currentRole === "owner" || currentRole === "admin" ? <a className="surface p-4 hover:bg-slate-50" href="#staff">
          <div className="text-sm font-semibold text-slate-900">Practice Staff</div>
          <div className="mt-1 text-xs text-slate-600">Invitations, roles, access, and MFA status</div>
        </a> : null}
        <a className="surface p-4 hover:bg-slate-50" href="#account">
          <div className="text-sm font-semibold text-slate-900">Account</div>
          <div className="mt-1 text-xs text-slate-600">{userEmail || "Current user"}</div>
        </a>
        <a className="surface p-4 hover:bg-slate-50" href="#subscription">
          <div className="text-sm font-semibold text-slate-900">Subscription</div>
          <div className="mt-1 text-xs text-slate-600">Stripe Checkout and billing portal</div>
        </a>
      </nav>

      <section aria-labelledby="access-roles-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-950" id="access-roles-title">Workspace roles</h2><p className="mt-1 text-sm text-slate-600">Each role sees the work relevant to its responsibility.</p></div>
          <p className="text-xs font-medium text-slate-500">Owners and administrators manage staff invitations below.</p>
        </div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-md border bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: ShieldCheck, name: "Owner", text: "Practice control and oversight" },
            { icon: UserCog, name: "Administrator", text: "Setup and staff operations" },
            { icon: Stethoscope, name: "Provider", text: "Clinical approvals and review" },
            { icon: UsersRound, name: "Coordinator", text: "Monthly patient workflow" },
            { icon: ReceiptText, name: "Billing", text: "Evidence and billing readiness" },
          ].map(({ icon: Icon, name, text }) => (
            <div className="bg-white p-4" key={name}><Icon aria-hidden="true" className="text-teal-700" size={19} /><h3 className="mt-3 text-sm font-semibold text-slate-950">{name}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>
          ))}
        </div>
      </section>

      <section className="surface p-5" id="practice">
        <div className="mb-5 border-b pb-3">
          <h2 className="text-xl font-semibold text-slate-950">Practice</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit the details shown to staff and used for monthly CCM billing defaults.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <FieldLabel required>Practice name</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, name: event.target.value }))
              }
              value={practiceForm.name}
            />
          </label>
          <label>
            <FieldLabel>Phone</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="Practice phone number"
              value={practiceForm.phone}
            />
          </label>
          <label className="md:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Street, city, state, ZIP"
              value={practiceForm.address}
            />
          </label>
          <label>
            <FieldLabel required>Timezone</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, timezone: event.target.value }))
              }
              value={practiceForm.timezone}
            />
          </label>
          <label>
            <FieldLabel required>Default CCM billing threshold</FieldLabel>
            <p className="mb-1 text-xs font-medium text-slate-600">
              CCM Assistant uses this minute threshold when checking monthly billing readiness.
            </p>
            <input
              className="w-full rounded border px-3 py-2"
              min={1}
              onChange={(event) =>
                setPracticeForm((current) => ({
                  ...current,
                  threshold: Number(event.target.value),
                }))
              }
              type="number"
              value={practiceForm.threshold}
            />
          </label>
        </div>

        <div className="mt-4 rounded border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Coordinator workflow policy</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">These settings control operational awareness and how long evidence-backed suggested care activities remain current. They do not create work or time.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              <FieldLabel>Month-end awareness begins</FieldLabel>
              <p className="mb-1 text-xs text-slate-600">Default is the 25th in the practice timezone.</p>
              <input className="w-full rounded border px-3 py-2" max={28} min={1} onChange={(event) => setPracticeForm((current) => ({ ...current, monthEndAwarenessDay: Number(event.target.value) }))} type="number" value={practiceForm.monthEndAwarenessDay} />
            </label>
            <label className="flex items-start gap-3 rounded border bg-white p-3">
              <input checked={practiceForm.allowCoordinatorClaiming} className="mt-1" onChange={(event) => setPracticeForm((current) => ({ ...current, allowCoordinatorClaiming: event.target.checked }))} type="checkbox" />
              <span><span className="block text-sm font-semibold text-slate-900">Allow coordinators to claim unassigned patients</span><span className="mt-1 block text-xs leading-5 text-slate-600">Disabled by default. When enabled, an active coordinator may claim only a patient who has no coordinator assignment.</span></span>
            </label>
          </div>
          <details className="mt-4 rounded border bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">Suggested care activity expiration</summary>
            <p className="mt-2 text-xs leading-5 text-slate-600">Practice overrides are measured in days. Defaults are restored by entering the default shown for each activity type.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {OPPORTUNITY_TYPES.map((type) => <label className="text-sm" key={type}><span className="mb-1 block font-medium text-slate-800">{SUGGESTION_TYPE_LABELS[type]}</span><input className="w-full rounded border px-3 py-2" max={90} min={1} onChange={(event) => setPracticeForm((current) => ({ ...current, expirationDays: { ...current.expirationDays, [type]: Number(event.target.value) } }))} type="number" value={practiceForm.expirationDays[type]} /><span className="mt-1 block text-[11px] text-slate-500">Default: {DEFAULT_OPPORTUNITY_EXPIRATION_DAYS[type]} day{DEFAULT_OPPORTUNITY_EXPIRATION_DAYS[type] === 1 ? "" : "s"}</span></label>)}
            </div>
          </details>
        </div>

        <div className="mt-4 grid gap-3 rounded border bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
          <label className="flex gap-3">
            <input
              checked={practiceForm.cmsEligibilityAttested}
              className="mt-1"
              onChange={(event) =>
                setPracticeForm((current) => ({
                  ...current,
                  cmsEligibilityAttested: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              Practice will confirm CCM eligibility and retain supporting documentation.
            </span>
          </label>
          <label className="flex gap-3">
            <input
              checked={practiceForm.medicareEnrollmentAttested}
              className="mt-1"
              onChange={(event) =>
                setPracticeForm((current) => ({
                  ...current,
                  medicareEnrollmentAttested: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              Billing practitioner is enrolled or authorized for Medicare billing.
            </span>
          </label>
        </div>

        <button
          className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={saving === "practice"}
          onClick={savePractice}
          type="button"
        >
          {saving === "practice" ? "Saving..." : "Save practice"}
        </button>
      </section>

      <section className="surface p-5" id="subscription">
        <div className="mb-5 border-b pb-3">
          <h2 className="text-xl font-semibold text-slate-950">Subscription</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage the practice&apos;s CCM Assistant subscription through Stripe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!practiceId || saving !== null}
            onClick={() => void openStripeBilling("checkout")}
            type="button"
          >
            {saving === "stripe-checkout" ? "Opening Checkout..." : "Set up billing"}
          </button>
          <button
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
            disabled={!practiceId || saving !== null}
            onClick={() => void openStripeBilling("portal")}
            type="button"
          >
            {saving === "stripe-portal" ? "Opening portal..." : "Open billing portal"}
          </button>
        </div>
      </section>

      <section className="surface p-5" id="providers">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Billing Practitioners</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage billing practitioners used for patient assignment, check-ins, and billing evidence.
            </p>
          </div>
          <a className="rounded border px-3 py-2 text-sm font-semibold hover:bg-slate-50" href="#add-provider">
            Add billing practitioner
          </a>
        </div>

        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="rounded border border-dashed bg-slate-50 p-4 text-sm text-slate-700">
              No billing practitioners yet. Add the supervising practitioner before enrolling patients for CCM.
            </div>
          ) : (
            providers.map((provider) => {
              const isEditing = editingProviderId === provider.id && providerDraft;
              const manualReviewTone =
                provider.manual_review_status === "needs_review" ? "warning" : "good";

              return (
                <article className="rounded border bg-white p-4 shadow-sm" key={provider.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {provider.full_name}
                        {provider.credentials ? `, ${provider.credentials}` : ""}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {roleLabel(provider.billing_practitioner_type)} billing practitioner
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded border px-2.5 py-1 text-xs font-semibold ${
                          provider.is_active
                            ? statusBadgeClass("good")
                            : statusBadgeClass("muted")
                        }`}
                      >
                        {provider.is_active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`rounded border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                          manualReviewTone,
                        )}`}
                      >
                        Manual review: {roleLabel(provider.manual_review_status)}
                      </span>
                    </div>
                  </div>

                  {!isEditing ? (
                    <>
                      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                        <div>
                        <dt className="font-semibold text-slate-800">Billing practitioner type</dt>
                          <dd className="mt-1 text-slate-700">{roleLabel(provider.billing_practitioner_type)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-800">Credentials</dt>
                          <dd className="mt-1 text-slate-700">{provider.credentials || "Not entered"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-800">NPI</dt>
                          <dd className="mt-1 text-slate-700">{provider.npi || "Not entered"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-800">Contact</dt>
                          <dd className="mt-1 text-slate-700">{provider.email || provider.phone || "Not entered"}</dd>
                        </div>
                      </dl>
                      {provider.manual_review_reason ? (
                        <div className="mt-3 rounded border bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          {provider.manual_review_reason}
                        </div>
                      ) : null}
                      <button
                        className="mt-4 rounded border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        onClick={() => startProviderEdit(provider)}
                        type="button"
                      >
                        Edit billing practitioner
                      </button>
                    </>
                  ) : (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-3 rounded bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                        Editing billing practitioner
                      </div>
                      <div className="grid gap-4 md:grid-cols-6">
                        <label className="md:col-span-2">
                          <FieldLabel required>Name</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ fullName: event.target.value })}
                            value={providerDraft.fullName}
                          />
                        </label>
                        <label className="md:col-span-2">
                          <FieldLabel required>Billing practitioner type</FieldLabel>
                          <p className="mb-1 text-xs font-medium text-slate-600">
                            This helps CCM Assistant flag provider types that need manual review before billing.
                          </p>
                          <select
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => {
                              const nextType = event.target.value as BillingPractitionerType;
                              const supported = isSupportedBillingPractitionerType(nextType);
                              updateProviderDraft({
                                billingPractitionerType: nextType,
                                manualReviewReason: supported
                                  ? ""
                                  : providerDraft.manualReviewReason ||
                                    "Billing practitioner type requires manual review before CCM billing readiness.",
                                manualReviewStatus: supported ? "not_required" : "needs_review",
                              });
                            }}
                            value={providerDraft.billingPractitionerType}
                          >
                            {BILLING_PRACTITIONER_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {roleLabel(type)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <FieldLabel>Credentials</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ credentials: event.target.value })}
                            placeholder="MD"
                            value={providerDraft.credentials}
                          />
                        </label>
                        <label>
                          <FieldLabel>NPI</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ npi: event.target.value })}
                            placeholder="10-digit NPI"
                            inputMode="numeric"
                            maxLength={10}
                            pattern="[0-9]{10}"
                            value={providerDraft.npi}
                          />
                        </label>
                        <label className="md:col-span-2">
                          <FieldLabel>Email</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ email: event.target.value })}
                            placeholder="practitioner@example.com"
                            value={providerDraft.email}
                          />
                        </label>
                        <label className="md:col-span-2">
                          <FieldLabel>Phone</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ phone: event.target.value })}
                            placeholder="Practice phone"
                            value={providerDraft.phone}
                          />
                        </label>
                        <label>
                          <FieldLabel>Status</FieldLabel>
                          <select
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ isActive: event.target.value === "active" })}
                            value={providerDraft.isActive ? "active" : "inactive"}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                        <label>
                          <FieldLabel>Manual review status</FieldLabel>
                          <select
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) =>
                              updateProviderDraft({
                                manualReviewStatus: event.target.value as ProviderManualReviewStatus,
                              })
                            }
                            value={providerDraft.manualReviewStatus}
                          >
                            {PROVIDER_MANUAL_REVIEW_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {roleLabel(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="md:col-span-4">
                          <FieldLabel>Manual review reason</FieldLabel>
                          <input
                            className="w-full rounded border px-3 py-2"
                            onChange={(event) => updateProviderDraft({ manualReviewReason: event.target.value })}
                            placeholder="Reason this billing practitioner needs review"
                            value={providerDraft.manualReviewReason}
                          />
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          disabled={saving === provider.id || !providerDraft.fullName.trim()}
                          onClick={() => saveProvider(provider)}
                          type="button"
                        >
                          {saving === provider.id ? "Saving..." : "Save billing practitioner"}
                        </button>
                        <button
                          className="rounded border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                          onClick={cancelProviderEdit}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <div className="mt-5 rounded border border-dashed bg-slate-50 p-4" id="add-provider">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-950">Add billing practitioner</h3>
            <p className="mt-1 text-sm text-slate-600">
              This creates a billing practitioner profile. Existing practitioners are edited from their own cards above.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-6">
            <label className="md:col-span-2">
              <FieldLabel required>Name</FieldLabel>
              <input
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Jane Smith"
                value={newProvider.fullName}
              />
            </label>
            <label className="md:col-span-2">
              <FieldLabel required>Billing practitioner type</FieldLabel>
              <p className="mb-1 text-xs font-medium text-slate-600">
                This helps CCM Assistant flag practitioner types that need manual review before billing.
              </p>
              <select
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({
                    ...current,
                    billingPractitionerType: event.target.value as BillingPractitionerType,
                  }))
                }
                value={newProvider.billingPractitionerType}
              >
                {BILLING_PRACTITIONER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {roleLabel(type)}
                  </option>
                ))}
              </select>
              {!isSupportedBillingPractitionerType(newProvider.billingPractitionerType) ? (
                <span className="mt-1 block text-xs font-medium text-amber-800">
                  This practitioner will be marked for manual review.
                </span>
              ) : null}
            </label>
            <label>
              <FieldLabel>Credentials</FieldLabel>
              <input
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, credentials: event.target.value }))
                }
                placeholder="MD"
                value={newProvider.credentials}
              />
            </label>
            <label>
              <FieldLabel>NPI</FieldLabel>
              <input
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, npi: event.target.value }))
                }
                placeholder="10-digit NPI"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                value={newProvider.npi}
              />
            </label>
            <label className="md:col-span-2">
              <FieldLabel>Email</FieldLabel>
              <input
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="practitioner@example.com"
                value={newProvider.email}
              />
            </label>
            <label className="md:col-span-2">
              <FieldLabel>Phone</FieldLabel>
              <input
                className="w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Practice phone"
                value={newProvider.phone}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={saving === "new-provider" || !newProvider.fullName.trim()}
              onClick={addProvider}
              type="button"
            >
              {saving === "new-provider" ? "Adding..." : "Add billing practitioner"}
            </button>
            <button
              className="rounded border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              onClick={() => setNewProvider(EMPTY_PROVIDER)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>

      {currentRole === "owner" || currentRole === "admin" ? <section className="rounded border bg-white p-5 shadow-sm" id="staff">
        <div className="mb-5 border-b pb-3">
          <h2 className="text-xl font-semibold text-slate-950">Practice Staff</h2>
          <p className="mt-1 text-sm text-slate-600">
            Invite staff, assign roles, and manage practice access without changing the protected owner account.
          </p>
        </div>
        <StaffManagement practiceId={practiceId} />
      </section> : null}

      <section className="rounded border bg-white p-5 shadow-sm" id="account">
        <div className="mb-5 border-b pb-3">
          <h2 className="text-xl font-semibold text-slate-950">Account</h2>
          <p className="mt-1 text-sm text-slate-600">Manage your signed-in user profile.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <FieldLabel>Email</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              disabled
              value={userEmail}
            />
          </label>
          <label>
            <FieldLabel>Display name</FieldLabel>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Name shown inside CCM Assistant"
              value={displayName}
            />
          </label>
        </div>

        <div className="mt-4 rounded border border-dashed bg-slate-50 p-4 text-sm text-slate-700">
          Password changes are handled by the authentication provider for this environment.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving === "account"}
            onClick={saveAccount}
            type="button"
          >
            {saving === "account" ? "Saving..." : "Save account"}
          </button>
          <button
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
