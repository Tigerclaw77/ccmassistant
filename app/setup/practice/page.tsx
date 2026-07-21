"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Settings2, UserRoundCheck } from "lucide-react";
import OnboardingProgress from "../../../components/onboarding/OnboardingProgress";
import { getSupabaseAuthHeaders, supabase } from "../../../lib/supabase";
import { SUPPORTED_BILLING_PRACTITIONER_TYPES } from "../../../lib/ccm/types";
import type { FirstProviderMode } from "../../../lib/ccm/first-provider-bootstrap";

const STEPS = ["Practice", "Profile", "Provider", "Defaults", "Review"] as const;
const PROVIDER_ONLY_STEPS = ["Provider"] as const;
const ORGANIZATION_TYPES = [
  ["independent_practice", "Independent practice"],
  ["group_practice", "Group practice"],
  ["health_system", "Health system"],
  ["fqhc", "Federally Qualified Health Center"],
  ["other", "Other"],
] as const;
const PRACTITIONER_LABELS: Record<(typeof SUPPORTED_BILLING_PRACTITIONER_TYPES)[number], string> = {
  certified_nurse_midwife: "Certified nurse-midwife",
  clinical_nurse_specialist: "Clinical nurse specialist",
  nurse_practitioner: "Nurse practitioner",
  physician: "Physician",
  physician_assistant: "Physician assistant",
};

type BootstrapResponse = {
  error?: string;
  practice?: { id: string };
  provider?: { id: string };
};
type ActivePracticeResponse = {
  hasActiveProvider?: boolean;
  practice?: { id: string };
};

export default function PracticeSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] = useState("independent_practice");
  const [defaultTimezone, setDefaultTimezone] = useState("America/Chicago");
  const [primaryAddress, setPrimaryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coordinatorAssignmentMode, setCoordinatorAssignmentMode] = useState("manual");
  const [staffEmailNotifications, setStaffEmailNotifications] = useState(true);
  const [patientReminderNotifications, setPatientReminderNotifications] = useState(false);
  const [providerMode, setProviderMode] = useState<FirstProviderMode | null>(null);
  const [providerFullName, setProviderFullName] = useState("");
  const [providerCredentials, setProviderCredentials] = useState("");
  const [providerType, setProviderType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerRecoveryPracticeId, setProviderRecoveryPracticeId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void (async () => {
      if (active && browserTimeZone) setDefaultTimezone(browserTimeZone);
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      const metadataName = typeof data.user.user_metadata?.display_name === "string"
        ? data.user.user_metadata.display_name.trim()
        : "";
      const emailName = data.user.email?.split("@")[0].replace(/[._-]+/g, " ").trim() ?? "";
      setProviderFullName((current) => current || metadataName || emailName);
      const activePracticeId = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });
      if (!active || !response.ok) return;
      const result = await response.json() as ActivePracticeResponse;
      if (result.practice?.id && result.hasActiveProvider === false) {
        setProviderRecoveryPracticeId(result.practice.id);
        setStep(3);
      }
    })();
    return () => { active = false; };
  }, []);

  function continueTo(nextStep: number) {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError("Enter a practice name to continue.");
      return;
    }
    if (step === 2 && !phone.trim()) {
      setError("Enter the practice phone number to continue.");
      return;
    }
    if (step === 3) {
      const validationError = providerValidationError();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setStep(nextStep);
  }

  function providerValidationError(): string | null {
    if (!providerMode) return "Choose whether you will serve as a treating provider.";
    if (!providerFullName.trim()) return "Enter the first provider's name to continue.";
    if (!providerType) return "Choose the first provider's practitioner type.";
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (providerRecoveryPracticeId) {
      const validationError = providerValidationError();
      if (validationError) {
        setError(validationError);
        return;
      }
      setLoading(true);
      setError(null);
      const response = await fetch("/api/practices/first-provider", {
        body: JSON.stringify({
          practiceId: providerRecoveryPracticeId,
          providerCredentials: providerCredentials.trim() || null,
          providerFullName,
          providerMode,
          providerType,
        }),
        headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
        method: "POST",
      });
      const result = await response.json() as BootstrapResponse;
      setLoading(false);
      if (!response.ok || !result.provider?.id) {
        setError(result.error ?? "Unable to add the first provider.");
        return;
      }
      router.replace(`/patients/new?primaryProviderId=${encodeURIComponent(result.provider.id)}&first=1`);
      router.refresh();
      return;
    }
    if (step < STEPS.length) {
      continueTo(step + 1);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await fetch("/api/practices/bootstrap", {
      body: JSON.stringify({
        coordinatorAssignmentMode,
        defaultTimezone,
        logoUrl: logoUrl.trim() || null,
        name,
        organizationType,
        patientReminderNotifications,
        phone,
        primaryAddress: primaryAddress.trim() || null,
        providerCredentials: providerCredentials.trim() || null,
        providerFullName,
        providerMode,
        providerType,
        staffEmailNotifications,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(await getSupabaseAuthHeaders()),
      },
      method: "POST",
    });
    const result = await response.json() as BootstrapResponse;
    setLoading(false);

    if (!response.ok || !result.practice?.id || !result.provider?.id) {
      setError(result.error ?? "Unable to create the practice workspace.");
      return;
    }

    localStorage.setItem("activePracticeId", result.practice.id);
    router.replace(`/patients/new?primaryProviderId=${encodeURIComponent(result.provider.id)}&first=1`);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
        <div>
          <p className="eyebrow">First-run onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{providerRecoveryPracticeId ? "Add your first provider" : "Create your practice workspace"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {providerRecoveryPracticeId ? "Complete this required onboarding step, then create your first patient." : "Add the essentials now. You can complete billing and clinical settings later."}
          </p>
        </div>
        <div className="surface p-4">
          <OnboardingProgress currentStep={providerRecoveryPracticeId ? 1 : step} steps={providerRecoveryPracticeId ? PROVIDER_ONLY_STEPS : STEPS} />
        </div>
      </div>

      <form className="surface space-y-6 p-5 sm:p-7" onSubmit={submit}>
        {step === 1 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-2"><Building2 className="text-teal-700" size={20} /><h2 className="font-semibold">Practice essentials</h2></div>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Practice name</span>
              <input className="w-full rounded-md border px-3 py-2.5" maxLength={200} onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Organization type</span>
              <select className="w-full rounded-md border px-3 py-2.5" onChange={(event) => setOrganizationType(event.target.value)} value={organizationType}>
                {ORGANIZATION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Time zone</span>
              <input className="w-full rounded-md border px-3 py-2.5" onChange={(event) => setDefaultTimezone(event.target.value)} required value={defaultTimezone} />
              <span className="text-xs text-slate-500">Detected from this device. Use an IANA time zone such as America/Chicago.</span>
            </label>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-2"><UserRoundCheck className="text-teal-700" size={20} /><h2 className="font-semibold">Practice profile</h2></div>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Primary address <span className="font-normal text-slate-500">(optional)</span></span>
              <textarea className="min-h-24 w-full rounded-md border px-3 py-2.5" maxLength={500} onChange={(event) => setPrimaryAddress(event.target.value)} value={primaryAddress} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Phone</span>
              <input autoComplete="tel" className="w-full rounded-md border px-3 py-2.5" maxLength={40} onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Logo URL <span className="font-normal text-slate-500">(optional)</span></span>
              <input className="w-full rounded-md border px-3 py-2.5" onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" type="url" value={logoUrl} />
              <span className="text-xs text-slate-500">Logo upload can be added later; no file is sent during setup.</span>
            </label>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-2"><UserRoundCheck className="text-teal-700" size={20} /><h2 className="font-semibold">First provider</h2></div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Will you personally provide CCM services and serve as a Primary Responsible Provider?</legend>
              <label className="flex items-start gap-3 rounded-md border p-4 text-sm">
                <input checked={providerMode === "treating_provider"} className="mt-1" name="provider-mode" onChange={() => setProviderMode("treating_provider")} type="radio" />
                <span><strong>Yes — I am a treating provider</strong><span className="mt-1 block text-slate-600">We will link the provider profile and Provider role to your signed-in account.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4 text-sm">
                <input checked={providerMode === "administrator_only"} className="mt-1" name="provider-mode" onChange={() => setProviderMode("administrator_only")} type="radio" />
                <span><strong>No — I am an administrator only</strong><span className="mt-1 block text-slate-600">Add the practice&apos;s first treating provider before creating a patient.</span></span>
              </label>
            </fieldset>

            {providerMode ? <div className="space-y-4 rounded-md border bg-slate-50 p-4">
              <div>
                <div className="font-semibold">{providerMode === "treating_provider" ? "Your provider profile" : "Add Your First Provider"}</div>
                <p className="mt-1 text-xs text-slate-600">Only the information required to assign the first patient is collected now. NPI and other profile details can be completed later.</p>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-semibold">Provider name</span>
                <input autoComplete="name" className="w-full rounded-md border bg-white px-3 py-2.5" maxLength={200} onChange={(event) => setProviderFullName(event.target.value)} required value={providerFullName} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold">Practitioner type</span>
                  <select className="w-full rounded-md border bg-white px-3 py-2.5" onChange={(event) => setProviderType(event.target.value)} required value={providerType}>
                    <option value="">Select practitioner type</option>
                    {SUPPORTED_BILLING_PRACTITIONER_TYPES.map((type) => <option key={type} value={type}>{PRACTITIONER_LABELS[type]}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold">Credentials <span className="font-normal text-slate-500">(optional)</span></span>
                  <input className="w-full rounded-md border bg-white px-3 py-2.5" maxLength={80} onChange={(event) => setProviderCredentials(event.target.value)} placeholder="MD, DO, NP, PA-C" value={providerCredentials} />
                </label>
              </div>
            </div> : null}
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-2"><Settings2 className="text-teal-700" size={20} /><h2 className="font-semibold">Workspace defaults</h2></div>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Default coordinator assignment</span>
              <select className="w-full rounded-md border px-3 py-2.5" onChange={(event) => setCoordinatorAssignmentMode(event.target.value)} value={coordinatorAssignmentMode}>
                <option value="manual">Assign manually</option>
                <option value="balanced">Balance across coordinators</option>
              </select>
            </label>
            <div className="space-y-3 rounded-md border bg-slate-50 p-4 text-sm">
              <div className="font-semibold">Notification defaults</div>
              <label className="flex gap-3"><input checked={staffEmailNotifications} onChange={(event) => setStaffEmailNotifications(event.target.checked)} type="checkbox" /><span>Email staff about assigned work</span></label>
              <label className="flex gap-3"><input checked={patientReminderNotifications} onChange={(event) => setPatientReminderNotifications(event.target.checked)} type="checkbox" /><span>Enable patient reminder notifications by default</span></label>
              <p className="text-xs text-slate-500">Required security notifications are not disabled by these preferences.</p>
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-2"><CheckCircle2 className="text-teal-700" size={20} /><h2 className="font-semibold">Review and create</h2></div>
            <div className="grid gap-4 rounded-md border bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Practice</div><div className="mt-1 font-medium">{name}</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time zone</div><div className="mt-1 font-medium">{defaultTimezone}</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</div><div className="mt-1 font-medium">{phone}</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coordinator assignment</div><div className="mt-1 font-medium">{coordinatorAssignmentMode === "manual" ? "Manual" : "Balanced"}</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">First provider</div><div className="mt-1 font-medium">{providerFullName}{providerCredentials ? `, ${providerCredentials}` : ""}</div></div>
              <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider relationship</div><div className="mt-1 font-medium">{providerMode === "treating_provider" ? "Linked to your account" : "Administrator-managed profile"}</div></div>
            </div>
            <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
              Your account will become the <strong>Organization Owner</strong> and an active <strong>Practice Administrator</strong>. An active Primary Responsible Provider will be ready before you create the first patient.
            </div>
          </section>
        ) : null}

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div> : null}

        <div className="flex items-center justify-between border-t pt-5">
          <button className="button-secondary" disabled={Boolean(providerRecoveryPracticeId) || step === 1 || loading} onClick={() => { setError(null); setStep((current) => Math.max(1, current - 1)); }} type="button">Back</button>
          <button className="button-primary" disabled={loading} type="submit">
            {loading ? (providerRecoveryPracticeId ? "Adding provider..." : "Creating secure workspace...") : providerRecoveryPracticeId ? "Add provider and create first patient" : step === STEPS.length ? "Create practice workspace" : "Continue"}
          </button>
        </div>
      </form>
    </main>
  );
}
