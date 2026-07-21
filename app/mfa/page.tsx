"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell";
import OnboardingProgress from "../../components/onboarding/OnboardingProgress";
import { safeAppPath } from "../../lib/auth-redirect";
import {
  cancelMfaEnrollment,
  prepareMfaEnrollment,
  restartMfaEnrollment,
  verifyMfaEnrollment,
  type MfaEnrollmentState,
} from "../../lib/mfa-enrollment";
import { supabase } from "../../lib/supabase";

const STEPS = ["Authenticator app", "Scan QR code", "Verify code", "Complete"] as const;
const AUTHENTICATOR_APPS = ["Microsoft Authenticator", "Google Authenticator", "2FAS", "Authy", "1Password"];

export default function MfaPage() {
  const router = useRouter();
  const [nextPath] = useState(() => typeof window === "undefined" ? "/patients" : safeAppPath(new URLSearchParams(window.location.search).get("next")));
  const [enrollment, setEnrollment] = useState<MfaEnrollmentState | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  function applyEnrollment(state: MfaEnrollmentState) {
    setEnrollment(state);
    setCancelled(false);
    setWizardStep(state.mode === "challenge" ? 3 : 1);
  }

  useEffect(() => {
    let active = true;
    async function prepare() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const prepared = await prepareMfaEnrollment({ api: supabase.auth.mfa, storage: sessionStorage, userId: data.session.user.id });
        if (!active) return;
        setUserId(data.session.user.id);
        applyEnrollment(prepared);
      } catch (prepareError) {
        if (active) setError(prepareError instanceof Error ? prepareError.message : "Unable to prepare MFA");
      } finally {
        if (active) setLoading(false);
      }
    }
    void prepare();
    return () => { active = false; };
  }, [router]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment || !userId) return;
    setVerifying(true);
    setError(null);
    try {
      await verifyMfaEnrollment({ api: supabase.auth.mfa, code, factorId: enrollment.factorId, storage: sessionStorage, userId });
      setWizardStep(4);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify MFA code");
    } finally {
      setVerifying(false);
    }
  }

  async function restart() {
    if (!userId) return;
    setUpdating(true);
    setError(null);
    try {
      applyEnrollment(await restartMfaEnrollment({ api: supabase.auth.mfa, storage: sessionStorage, userId }));
      setCode("");
    } catch (restartError) {
      setError(restartError instanceof Error ? restartError.message : "Unable to restart MFA setup");
    } finally {
      setUpdating(false);
    }
  }

  async function cancel() {
    if (!userId) return;
    setUpdating(true);
    setError(null);
    try {
      await cancelMfaEnrollment({ api: supabase.auth.mfa, storage: sessionStorage, userId });
      setEnrollment(null);
      setCode("");
      setCancelled(true);
      setWizardStep(1);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel MFA setup");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <AuthShell title="Secure your account" description="Preparing your authenticator enrollment..."><div className="flex items-center gap-3 text-sm text-slate-600" role="status"><span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" aria-hidden="true" />Creating a secure enrollment</div></AuthShell>;
  }

  return (
    <AuthShell title="Set up multi-factor authentication" description="MFA uses a one-time code in addition to your password, helping protect patient data if a password is exposed.">
      <OnboardingProgress currentStep={wizardStep} steps={STEPS} />

      {wizardStep === 1 ? (
        <div className="space-y-4 text-sm">
          <div className="flex gap-3 rounded-md border border-teal-200 bg-teal-50 p-4 text-teal-950"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p>Use an authenticator app on your phone or password manager. CCM Assistant never asks for access to your app.</p></div>
          <div>
            <h2 className="font-semibold text-slate-900">Install or open an authenticator app</h2>
            <p className="mt-1 text-slate-600">Recommended options:</p>
            <ul className="mt-2 grid gap-1 text-slate-700 sm:grid-cols-2">
              {AUTHENTICATOR_APPS.map((app) => <li key={app}>• {app}</li>)}
            </ul>
          </div>

          {enrollment?.interrupted ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="font-semibold">Setup was interrupted</div>
              <p className="mt-1 leading-6">
                {enrollment.qrCode
                  ? "Your unfinished enrollment is still available on this device. Continue with the saved QR code, restart to create a new one, or cancel to remove it."
                  : "Supabase has an unfinished authenticator enrollment, but the original QR code is no longer available. Continue only if you already scanned it; otherwise restart to create a new QR code."}
              </p>
            </div>
          ) : null}

          {cancelled ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">Setup was cancelled and the unfinished factor was removed. Start again when you are ready.</div> : null}

          <div className="flex flex-wrap gap-2">
            {cancelled ? (
              <button className="button-primary" disabled={updating} onClick={restart} type="button">{updating ? "Starting..." : "Start setup"}</button>
            ) : (
              <button className="button-primary" disabled={!enrollment || updating} onClick={() => setWizardStep(enrollment?.qrCode ? 2 : 3)} type="button">{enrollment?.interrupted ? "Continue setup" : "Continue"}</button>
            )}
            {enrollment?.interrupted ? <button className="button-secondary" disabled={updating} onClick={restart} type="button">{updating ? "Restarting..." : "Restart"}</button> : null}
            {enrollment ? <button className="button-quiet" disabled={updating} onClick={cancel} type="button">Cancel</button> : null}
          </div>
        </div>
      ) : null}

      {wizardStep === 2 && enrollment?.qrCode ? (
        <div className="space-y-4 text-sm">
          <div><h2 className="font-semibold text-slate-900">Scan this QR code</h2><p className="mt-1 text-slate-600">In your authenticator app, add an account and scan the code.</p></div>
          <div className="inline-flex rounded-md border bg-white p-3 shadow-sm"><Image alt="Authenticator setup QR code" height={220} src={enrollment.qrCode.trimEnd()} unoptimized width={220} /></div>
          <details className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-600"><summary className="cursor-pointer font-semibold text-slate-700">Use a manual setup key</summary><p className="mt-2 break-all font-mono">{enrollment.secret}</p></details>
          <div className="flex gap-2"><button className="button-secondary" onClick={() => setWizardStep(1)} type="button">Back</button><button className="button-primary" onClick={() => setWizardStep(3)} type="button">I scanned the code</button></div>
        </div>
      ) : null}

      {wizardStep === 3 && enrollment ? (
        <form className="space-y-4" onSubmit={verify}>
          <div><h2 className="font-semibold text-slate-900">Enter the 6-digit code</h2><p className="mt-1 text-sm text-slate-600">Enter the current code shown for CCM Assistant.</p></div>
          <label className="block space-y-1 text-sm"><span className="font-semibold text-slate-800">Authentication code</span><input autoComplete="one-time-code" autoFocus className="w-full rounded-md border px-3 py-2.5 text-center text-lg font-semibold tracking-[0.3em]" inputMode="numeric" maxLength={6} minLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} pattern="[0-9]{6}" required value={code} /></label>
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
          <div className="flex gap-2">{enrollment.mode !== "challenge" ? <button className="button-secondary" disabled={verifying} onClick={() => setWizardStep(enrollment.qrCode ? 2 : 1)} type="button">Back</button> : null}<button className="button-primary flex-1" disabled={verifying || code.length !== 6}>{verifying ? "Verifying code..." : "Verify code"}</button></div>
        </form>
      ) : null}

      {wizardStep === 4 ? (
        <div className="space-y-4 text-center"><CheckCircle2 className="mx-auto text-teal-700" size={44} /><div><h2 className="font-semibold text-slate-950">MFA is configured</h2><p className="mt-1 text-sm text-slate-600">Your account now requires your password and a current authenticator code.</p></div><button className="button-primary w-full" onClick={() => { router.replace(nextPath); router.refresh(); }} type="button">Enter CCM Assistant</button></div>
      ) : null}

      {error && wizardStep !== 3 ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
    </AuthShell>
  );
}
