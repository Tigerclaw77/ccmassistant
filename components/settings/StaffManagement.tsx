"use client";

import { Clock3, MailPlus, RefreshCw, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import type { PracticeRole, StaffInvitationStatus } from "../../lib/ccm/types";
import type { AssignableStaffRole } from "../../lib/ccm/staff-management";
import LoadingState from "../ui/LoadingState";

type DirectoryMember = {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  invited_email: string | null;
  role: PracticeRole;
  status: "invited" | "active" | "inactive";
  removed_at: string | null;
  last_login_at?: string | null;
  mfa_status?: "verified" | "not_enrolled";
};

type Invitation = {
  id: string;
  member_id: string;
  email: string;
  role: PracticeRole;
  status: StaffInvitationStatus;
  expires_at: string;
  sent_at: string | null;
  resend_count: number;
};

type DirectoryResponse = {
  canManage: boolean;
  error?: string;
  invitations: Invitation[];
  members: DirectoryMember[];
};

const ROLES: Array<{ label: string; value: AssignableStaffRole }> = [
  { label: "Practice Administrator", value: "admin" },
  { label: "Coordinator", value: "coordinator" },
  { label: "Provider", value: "provider" },
];

function roleLabel(role: PracticeRole): string {
  if (role === "owner") return "Practice Owner";
  if (role === "admin") return "Practice Administrator";
  if (role === "billing_staff") return "Billing Staff";
  return role.slice(0, 1).toUpperCase() + role.slice(1);
}

function invitationLabel(status: StaffInvitationStatus): string {
  if (status === "delivery_failed") return "Delivery failed";
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}

export default function StaffManagement({ practiceId }: { practiceId: string }) {
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableStaffRole>("coordinator");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!practiceId) return;
    setLoading(true);
    const response = await fetch(`/api/practice-members?practiceId=${encodeURIComponent(practiceId)}`, { headers: await getSupabaseAuthHeaders() });
    const result = (await response.json()) as DirectoryResponse;
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to load staff");
      return;
    }
    setMembers(result.members ?? []);
    setInvitations(result.invitations ?? []);
  }, [practiceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking("invite");
    setError(null);
    setMessage(null);
    const response = await fetch("/api/practice-members", {
      body: JSON.stringify({ email, practiceId, role }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "POST",
    });
    const result = await response.json();
    setWorking(null);
    if (!response.ok) {
      setError(result.error ?? "Unable to invite staff member");
      await load();
      return;
    }
    setEmail("");
    setMessage("Invitation sent.");
    await load();
  }

  async function updateMember(member: DirectoryMember, action: string, nextRole?: AssignableStaffRole, invitationId?: string) {
    setWorking(`${action}-${member.id}`);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/practice-members", {
      body: JSON.stringify({ action, invitationId, memberId: member.id, practiceId, role: nextRole }),
      headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) },
      method: "PATCH",
    });
    const result = await response.json();
    setWorking(null);
    if (!response.ok) {
      setError(result.error ?? "Unable to update staff member");
      return;
    }
    setMessage(action === "resend" ? "Invitation resent." : action === "cancel" ? "Invitation cancelled." : "Staff access updated.");
    await load();
  }

  if (loading) return <LoadingState label="Loading practice staff" />;

  return (
    <div className="space-y-5">
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div> : null}
      {message ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">{message}</div> : null}

      <form className="grid gap-3 rounded-md border bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)_auto] sm:items-end" onSubmit={invite}>
        <label className="text-sm"><span className="mb-1 block font-semibold">Staff email</span><input autoComplete="email" className="w-full rounded-md border bg-white px-3 py-2" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
        <label className="text-sm"><span className="mb-1 block font-semibold">Role</span><select className="w-full rounded-md border bg-white px-3 py-2" onChange={(event) => setRole(event.target.value as AssignableStaffRole)} value={role}>{ROLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <button className="button-primary" disabled={working === "invite"} type="submit"><MailPlus aria-hidden="true" size={16} /> {working === "invite" ? "Sending..." : "Invite staff"}</button>
      </form>

      <div className="grid gap-3">
        {members.filter((member) => !member.removed_at).map((member) => {
          const pending = invitations.find((invitation) => invitation.member_id === member.id && ["pending", "delivery_failed", "expired"].includes(invitation.status));
          const busy = Boolean(working?.endsWith(member.id));
          return (
            <article className="rounded-md border bg-white p-4" key={member.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-950">{member.user_email || member.invited_email || "Staff account"}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>{roleLabel(member.role)}</span><span>Status: {pending ? invitationLabel(pending.status) : member.status}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" size={13} /> Last login: {member.last_login_at ? new Date(member.last_login_at).toLocaleString() : "Never"}</span>
                    <span className="inline-flex items-center gap-1"><ShieldCheck aria-hidden="true" size={13} /> MFA: {member.mfa_status === "verified" ? "Verified" : "Not enrolled"}</span>
                  </div>
                </div>
                {member.role !== "owner" && !pending ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                    <select aria-label={`Role for ${member.user_email || member.invited_email}`} className="min-h-10 rounded-md border px-3 text-sm" disabled={busy} onChange={(event) => updateMember(member, "change_role", event.target.value as AssignableStaffRole)} value={member.role}>{member.role === "billing_staff" ? <option disabled value="billing_staff">Billing Staff (legacy)</option> : null}{ROLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    {member.status === "active" ? <button className="button-secondary" disabled={busy} onClick={() => updateMember(member, "disable")} type="button"><UserRoundX aria-hidden="true" size={16} /> Disable</button> : <button className="button-secondary" disabled={busy} onClick={() => updateMember(member, "enable")} type="button"><UserRoundCheck aria-hidden="true" size={16} /> Re-enable</button>}
                    <button className="button-secondary text-red-700" disabled={busy} onClick={() => window.confirm("Remove this staff member from the practice?") && updateMember(member, "remove")} type="button">Remove</button>
                  </div>
                ) : pending ? (
                  <div className="flex flex-wrap gap-2">
                    <button className="button-secondary" disabled={busy} onClick={() => updateMember(member, "resend", undefined, pending.id)} type="button"><RefreshCw aria-hidden="true" size={16} /> Resend</button>
                    <button className="button-secondary" disabled={busy} onClick={() => updateMember(member, "cancel", undefined, pending.id)} type="button">Cancel invitation</button>
                  </div>
                ) : <span className="text-xs font-medium text-slate-500">Owner access is protected</span>}
              </div>
              {pending ? <div className="mt-3 text-xs text-slate-600">Expires {new Date(pending.expires_at).toLocaleString()} | Resent {pending.resend_count} time{pending.resend_count === 1 ? "" : "s"}</div> : null}
            </article>
          );
        })}
      </div>

      {invitations.some((invitation) => ["accepted", "cancelled", "expired"].includes(invitation.status)) ? <details className="rounded-md border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Invitation history</summary><div className="mt-3 space-y-2 text-sm">{invitations.filter((invitation) => ["accepted", "cancelled", "expired"].includes(invitation.status)).map((invitation) => <div className="flex flex-wrap justify-between gap-2 border-t pt-2" key={invitation.id}><span>{invitation.email} | {roleLabel(invitation.role)}</span><span>{invitationLabel(invitation.status)}</span></div>)}</div></details> : null}
    </div>
  );
}
