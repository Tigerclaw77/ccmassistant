"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  cancelMfaEnrollment,
  prepareMfaEnrollment,
  restartMfaEnrollment,
  verifyMfaEnrollment,
  type MfaEnrollmentState,
} from "../../lib/mfa-enrollment";
import AuthShell from "../../components/auth/AuthShell";

export default function MfaPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MfaEnrollmentState["mode"] | "cancelled">("enrollment");
  const [userId, setUserId] = useState<string | null>(null);

  function applyEnrollment(state: MfaEnrollmentState) {
    setFactorId(state.factorId);
    setQrCode(state.qrCode);
    setSecret(state.secret);
    setMode(state.mode);
  }

  useEffect(() => {
    let active = true;

    async function prepare() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      if (!session) {
        router.replace("/login");
        return;
      }

      try {
        const enrollment = await prepareMfaEnrollment({
          api: supabase.auth.mfa,
          storage: sessionStorage,
          userId: session.user.id,
        });
        if (!active) return;
        setUserId(session.user.id);
        applyEnrollment(enrollment);
      } catch (prepareError) {
        if (active) {
          setError(prepareError instanceof Error ? prepareError.message : "Unable to prepare MFA");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void prepare();
    return () => {
      active = false;
    };
  }, [router]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !userId) return;
    setVerifying(true);
    setError(null);
    try {
      await verifyMfaEnrollment({
        api: supabase.auth.mfa,
        code,
        factorId,
        storage: sessionStorage,
        userId,
      });
      router.replace("/patients");
      router.refresh();
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
      applyEnrollment(
        await restartMfaEnrollment({
          api: supabase.auth.mfa,
          storage: sessionStorage,
          userId,
        }),
      );
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
      await cancelMfaEnrollment({
        api: supabase.auth.mfa,
        storage: sessionStorage,
        userId,
      });
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setCode("");
      setMode("cancelled");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel MFA setup");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <AuthShell title="Secure your account" description="Preparing your authenticator enrollment...">
      <div className="flex items-center gap-3 text-sm text-slate-600" role="status">
        <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" aria-hidden="true" />
        Creating a secure enrollment
      </div>
    </AuthShell>
  );

  return (
    <AuthShell title="Set up multi-factor authentication" description="Use an authenticator app to add a second layer of protection before entering your practice workspace.">
      {mode === "cancelled" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Authenticator setup was cancelled. Start again when you are ready.</div>
      ) : qrCode ? (
        <div className="space-y-3 text-sm">
          <ol className="space-y-2 text-slate-700">
            <li><span className="font-semibold">1.</span> Open your authenticator app and scan the code.</li>
            <li><span className="font-semibold">2.</span> Enter the current six-digit code below.</li>
          </ol>
          <div className="inline-flex rounded-md border bg-white p-3 shadow-sm">
            <Image alt="Authenticator setup QR code" height={220} src={qrCode.trimEnd()} unoptimized width={220} />
          </div>
          <details className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700">Use a manual setup key</summary>
            <p className="mt-2 break-all font-mono">{secret}</p>
          </details>
        </div>
      ) : mode === "recovery" ? (
        <p className="rounded-md border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Authenticator setup was already started. Enter a current code, or restart setup to display a new QR code.
        </p>
      ) : (
        <p className="text-sm text-slate-600">Enter the current code from your authenticator app.</p>
      )}
      {mode !== "cancelled" ? <form className="space-y-4" onSubmit={verify}>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-800">Authentication code</span>
          <input
            autoComplete="one-time-code"
            className="w-full rounded-md border px-3 py-2.5 text-center text-lg font-semibold"
            inputMode="numeric"
            maxLength={6}
            minLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            pattern="[0-9]{6}"
            required
            value={code}
          />
        </label>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
        <button className="button-primary w-full" disabled={verifying || updating || !factorId}>
          {verifying ? "Verifying code..." : "Verify and continue"}
        </button>
      </form> : null}
      {mode === "cancelled" ? (
        <button className="button-primary mt-5" disabled={updating} onClick={restart} type="button">
          {updating ? "Starting..." : "Start setup"}
        </button>
      ) : mode !== "challenge" ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <button className="button-secondary" disabled={updating || verifying} onClick={restart} type="button">
            {updating ? "Updating..." : "Restart setup"}
          </button>
          <button className="button-quiet" disabled={updating || verifying} onClick={cancel} type="button">
            Cancel setup
          </button>
        </div>
      ) : null}
    </AuthShell>
  );
}
