"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authRedirectUrl } from "../../lib/auth-redirect";
import { supabase } from "../../lib/supabase";

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
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>
      <form className="max-w-sm space-y-4" onSubmit={submit}>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            autoComplete="email"
            className="w-full rounded border px-3 py-2"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {message ? <div className="text-sm text-green-700">{message}</div> : null}
        <button className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <Link className="text-sm underline" href="/login">Back to login</Link>
    </main>
  );
}
