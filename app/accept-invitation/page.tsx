"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { getSupabaseAuthHeaders, supabase } from "../../lib/supabase";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [invitationId] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("invitation") ?? "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function accept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitationId) {
      setError("The invitation link is incomplete. Ask the practice administrator to resend it.");
      return;
    }
    setWorking(true);
    setError(null);
    const passwordResult = await supabase.auth.updateUser({ password });
    if (passwordResult.error) {
      setWorking(false);
      setError(passwordResult.error.message);
      return;
    }
    const response = await fetch("/api/staff-invitations/accept", {
      body: JSON.stringify({ invitationId }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = await response.json();
    setWorking(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to accept invitation");
      return;
    }
    localStorage.setItem("activePracticeId", result.practiceId);
    router.replace("/patients");
    router.refresh();
  }

  return (
    <AuthShell title="Join your practice workspace" description="Finish securing your invited account before entering CCM Assistant.">
      <form className="space-y-5" onSubmit={accept}>
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">Invited account: {email || "Loading..."}</div>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold text-slate-800">Create password</span>
          <input autoComplete="new-password" className="w-full rounded-md border px-3 py-2.5" minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          <span className="block text-xs leading-5 text-slate-500">Use at least 12 characters. Your verified authenticator remains required at sign-in.</span>
        </label>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div> : null}
        <button className="button-primary w-full" disabled={working} type="submit">{working ? "Joining practice..." : "Accept invitation"}</button>
      </form>
    </AuthShell>
  );
}
