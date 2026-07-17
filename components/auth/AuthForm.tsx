"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { authRedirectUrl, safeAppPath } from "../../lib/auth-redirect";

type Props = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAppPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: authRedirectUrl("/patients") },
          });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Your account is almost ready. Open the verification email we sent, confirm your address, then return here to sign in.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-800" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border px-3 py-2.5"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          minLength={12}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border px-3 py-2.5"
        />
        {mode === "signup" ? <p className="text-xs leading-5 text-slate-500">Use at least 12 characters. You will secure the account with an authenticator after verification.</p> : null}
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div> : null}
      {message ? <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-3 text-sm leading-6 text-teal-900" role="status">{message}</div> : null}

      <button
        type="submit"
        disabled={loading}
        className="button-primary w-full"
      >
        {loading ? (mode === "login" ? "Signing in..." : "Creating secure account...") : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
