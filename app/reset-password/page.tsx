"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import AuthShell from "../../components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setLoading(false);
      setError("This reset link is invalid or expired. Request a new link.");
      return;
    }
    const result = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.replace("/patients");
    router.refresh();
  }

  return (
    <AuthShell title="Choose a new password" description="Create a strong password for your CCM Assistant account. Your existing multi-factor authentication remains in place.">
      <form className="max-w-sm space-y-5" onSubmit={submit}>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-800">New password</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2.5"
            minLength={12}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">Use at least 12 characters and avoid passwords used for other services.</p>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
        <button className="button-primary w-full" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
