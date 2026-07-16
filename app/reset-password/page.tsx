"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <form className="max-w-sm space-y-4" onSubmit={submit}>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">New password</span>
          <input
            autoComplete="new-password"
            className="w-full rounded border px-3 py-2"
            minLength={12}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
