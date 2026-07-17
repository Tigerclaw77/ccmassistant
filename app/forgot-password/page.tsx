"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authRedirectUrl } from "../../lib/auth-redirect";
import { supabase } from "../../lib/supabase";
import AuthShell from "../../components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl("/reset-password"),
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMessage("If the account exists, a password-reset link has been sent.");
  }

  return (
    <AuthShell title="Reset your password" description="Enter the work email associated with your account. We will send a time-limited reset link if the account exists.">
      <form className="max-w-sm space-y-5" onSubmit={submit}>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-800">Work email</span>
          <input
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2.5"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-3 text-sm leading-6 text-teal-900">{message}</div> : null}
        <button className="button-primary w-full" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <Link className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800" href="/login">Back to sign in</Link>
    </AuthShell>
  );
}
