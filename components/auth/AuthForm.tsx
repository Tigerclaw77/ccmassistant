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
      setMessage("Check your email to confirm the account, then log in.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border rounded px-3 py-2 bg-white text-black"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="password">
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
          className="w-full border rounded px-3 py-2 bg-white text-black"
        />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {message ? <div className="text-sm text-green-700">{message}</div> : null}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60"
      >
        {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}
