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

  if (loading) return <main className="p-6 text-sm text-gray-600">Preparing secure sign-in...</main>;

  return (
    <main className="p-6 space-y-5 max-w-lg">
      <h1 className="text-xl font-semibold">Secure sign-in</h1>
      {mode === "cancelled" ? (
        <p className="text-sm text-gray-600">Authenticator setup was cancelled.</p>
      ) : qrCode ? (
        <div className="space-y-3 text-sm">
          <p>Scan this code with an authenticator app, then enter the six-digit code.</p>
          <Image alt="Authenticator setup QR code" height={220} src={qrCode.trimEnd()} unoptimized width={220} />
          <p className="break-all text-gray-600">Manual setup key: {secret}</p>
        </div>
      ) : mode === "recovery" ? (
        <p className="text-sm text-gray-600">
          Authenticator setup was already started. Enter a current code, or restart setup to display a new QR code.
        </p>
      ) : (
        <p className="text-sm text-gray-600">Enter the code from your authenticator app.</p>
      )}
      {mode !== "cancelled" ? <form className="space-y-4" onSubmit={verify}>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Authentication code</span>
          <input
            autoComplete="one-time-code"
            className="w-full rounded border px-3 py-2"
            inputMode="numeric"
            maxLength={6}
            minLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            pattern="[0-9]{6}"
            required
            value={code}
          />
        </label>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60" disabled={verifying || updating || !factorId}>
          {verifying ? "Verifying..." : "Verify"}
        </button>
      </form> : null}
      {mode === "cancelled" ? (
        <button className="rounded border px-4 py-2 text-sm disabled:opacity-60" disabled={updating} onClick={restart} type="button">
          {updating ? "Starting..." : "Start setup"}
        </button>
      ) : mode !== "challenge" ? (
        <div className="flex flex-wrap gap-3">
          <button className="rounded border px-4 py-2 text-sm disabled:opacity-60" disabled={updating || verifying} onClick={restart} type="button">
            {updating ? "Updating..." : "Restart setup"}
          </button>
          <button className="px-4 py-2 text-sm text-gray-700 disabled:opacity-60" disabled={updating || verifying} onClick={cancel} type="button">
            Cancel setup
          </button>
        </div>
      ) : null}
    </main>
  );
}
