"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseAuthHeaders, supabase } from "../../lib/supabase";

type Practice = {
  id: string;
  name: string;
  default_timezone: string;
  ccm_monthly_min_minutes: number;
  billing_settings: unknown;
};

type Provider = {
  id: string;
  full_name: string;
  credentials: string | null;
  npi: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
};

type PracticeMember = {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  role: string;
  status: "invited" | "active" | "inactive";
};

type PracticeForm = {
  name: string;
  address: string;
  phone: string;
  timezone: string;
  threshold: number;
};

type NewProviderForm = {
  fullName: string;
  credentials: string;
  npi: string;
  email: string;
  phone: string;
};

const EMPTY_PROVIDER: NewProviderForm = {
  credentials: "",
  email: "",
  fullName: "",
  npi: "",
  phone: "",
};

function billingSettingsObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function billingSetting(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function roleLabel(role: string): string {
  return role
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SettingsPage() {
  const router = useRouter();
  const [practiceId, setPracticeId] = useState<string>("");
  const [practiceForm, setPracticeForm] = useState<PracticeForm>({
    address: "",
    name: "",
    phone: "",
    threshold: 20,
    timezone: "America/Chicago",
  });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [members, setMembers] = useState<PracticeMember[]>([]);
  const [newProvider, setNewProvider] = useState<NewProviderForm>(EMPTY_PROVIDER);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coordinatorMembers = useMemo(
    () => members.filter((member) => ["owner", "admin", "coordinator"].includes(member.role)),
    [members],
  );

  async function authedHeaders(): Promise<HeadersInit> {
    const headers = await getSupabaseAuthHeaders();
    return {
      ...headers,
      ...(practiceId ? { "x-active-practice-id": practiceId } : {}),
    };
  }

  const loadSettings = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      setDisplayName(session.user.user_metadata?.display_name ?? "");
      setUserEmail(session.user.email ?? "");
      setCurrentUserId(session.user.id);

      const activePracticeId = localStorage.getItem("activePracticeId");
      const activeResponse = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });

      if (!activeResponse.ok) {
        throw new Error("Unable to load active practice.");
      }

      const activeResult = (await activeResponse.json()) as { practice: Practice };
      const practice = activeResult.practice;
      const settings = billingSettingsObject(practice.billing_settings);
      localStorage.setItem("activePracticeId", practice.id);
      setPracticeId(practice.id);
      setPracticeForm({
        address: billingSetting(settings.address),
        name: practice.name,
        phone: billingSetting(settings.phone),
        threshold: practice.ccm_monthly_min_minutes ?? 20,
        timezone: practice.default_timezone ?? "America/Chicago",
      });

      const [providersResponse, membersResponse] = await Promise.all([
        fetch(`/api/providers?practiceId=${practice.id}&includeInactive=true`, {
          headers: await getSupabaseAuthHeaders(),
        }),
        fetch(`/api/practice-members?practiceId=${practice.id}`, {
          headers: await getSupabaseAuthHeaders(),
        }),
      ]);

      if (!providersResponse.ok) {
        throw new Error("Unable to load providers.");
      }

      if (!membersResponse.ok) {
        throw new Error("Unable to load coordinators.");
      }

      const providersResult = (await providersResponse.json()) as { providers: Provider[] };
      const membersResult = (await membersResponse.json()) as { members: PracticeMember[] };

      setProviders(providersResult.providers ?? []);
      setMembers(membersResult.members ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function savePractice() {
    setSaving("practice");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/practices/active", {
        body: JSON.stringify({
          address: practiceForm.address,
          ccmMonthlyMinMinutes: Number(practiceForm.threshold),
          defaultTimezone: practiceForm.timezone,
          name: practiceForm.name,
          phone: practiceForm.phone,
          practiceId,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "PATCH",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save practice settings.");
      }

      setMessage("Settings saved.");
      await loadSettings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save practice settings.");
    } finally {
      setSaving(null);
    }
  }

  async function addProvider() {
    setSaving("new-provider");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          credentials: newProvider.credentials,
          email: newProvider.email,
          fullName: newProvider.fullName,
          npi: newProvider.npi,
          phone: newProvider.phone,
          practiceId,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to add provider.");
      }

      setNewProvider(EMPTY_PROVIDER);
      setMessage("Provider added.");
      await loadSettings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add provider.");
    } finally {
      setSaving(null);
    }
  }

  async function saveProvider(provider: Provider) {
    setSaving(provider.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          credentials: provider.credentials,
          email: provider.email,
          fullName: provider.full_name,
          isActive: provider.is_active,
          npi: provider.npi,
          phone: provider.phone,
          practiceId,
          providerId: provider.id,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "PATCH",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save provider.");
      }

      setMessage("Provider saved.");
      setProviders((current) =>
        current.map((item) => (item.id === provider.id ? result.provider : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save provider.");
    } finally {
      setSaving(null);
    }
  }

  async function saveMember(member: PracticeMember) {
    setSaving(member.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/practice-members", {
        body: JSON.stringify({
          memberId: member.id,
          practiceId,
          status: member.status,
        }),
        headers: {
          "Content-Type": "application/json",
          ...(await authedHeaders()),
        },
        method: "PATCH",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save coordinator.");
      }

      setMessage("Coordinator saved.");
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? result.member : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save coordinator.");
    } finally {
      setSaving(null);
    }
  }

  async function saveAccount() {
    setSaving("account");
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
      },
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Account saved.");
    }

    setSaving(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("activePracticeId");
    router.replace("/login");
  }

  function updateProvider(providerId: string, patch: Partial<Provider>) {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === providerId ? { ...provider, ...patch } : provider,
      ),
    );
  }

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading settings...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-600">Practice administration</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {message ? (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded border bg-white p-5 shadow-sm" id="practice">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Practice</h2>
          <p className="text-sm text-slate-600">
            Edit the details shown to staff and used for monthly CCM billing defaults.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Practice name
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, name: event.target.value }))
              }
              value={practiceForm.name}
            />
          </label>
          <label className="text-sm font-medium">
            Phone
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, phone: event.target.value }))
              }
              value={practiceForm.phone}
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Address
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, address: event.target.value }))
              }
              value={practiceForm.address}
            />
          </label>
          <label className="text-sm font-medium">
            Timezone
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              onChange={(event) =>
                setPracticeForm((current) => ({ ...current, timezone: event.target.value }))
              }
              value={practiceForm.timezone}
            />
          </label>
          <label className="text-sm font-medium">
            Default CCM billing threshold
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              min={1}
              onChange={(event) =>
                setPracticeForm((current) => ({
                  ...current,
                  threshold: Number(event.target.value),
                }))
              }
              type="number"
              value={practiceForm.threshold}
            />
          </label>
        </div>

        <button
          className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={saving === "practice"}
          onClick={savePractice}
          type="button"
        >
          {saving === "practice" ? "Saving..." : "Save practice"}
        </button>
      </section>

      <section className="rounded border bg-white p-5 shadow-sm" id="providers">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Providers</h2>
          <p className="text-sm text-slate-600">
            Keep provider identity correct for patient assignment, check-ins, and billing evidence.
          </p>
        </div>

        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="rounded border border-dashed p-4 text-sm text-slate-600">
              No providers yet. Add the first provider before enrolling patients.
            </div>
          ) : (
            providers.map((provider) => (
              <div className="rounded border p-4" key={provider.id}>
                <div className="grid gap-3 md:grid-cols-6">
                  <label className="text-sm font-medium md:col-span-2">
                    Name
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) =>
                        updateProvider(provider.id, { full_name: event.target.value })
                      }
                      value={provider.full_name}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Credentials
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) =>
                        updateProvider(provider.id, { credentials: event.target.value })
                      }
                      value={provider.credentials ?? ""}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    NPI
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) => updateProvider(provider.id, { npi: event.target.value })}
                      value={provider.npi ?? ""}
                    />
                  </label>
                  <label className="text-sm font-medium md:col-span-2">
                    Email
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) =>
                        updateProvider(provider.id, { email: event.target.value })
                      }
                      value={provider.email ?? ""}
                    />
                  </label>
                  <label className="text-sm font-medium md:col-span-2">
                    Phone
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) =>
                        updateProvider(provider.id, { phone: event.target.value })
                      }
                      value={provider.phone ?? ""}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Status
                    <select
                      className="mt-1 w-full rounded border px-3 py-2"
                      onChange={(event) =>
                        updateProvider(provider.id, { is_active: event.target.value === "active" })
                      }
                      value={provider.is_active ? "active" : "inactive"}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      className="rounded border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                      disabled={saving === provider.id}
                      onClick={() => saveProvider(provider)}
                      type="button"
                    >
                      {saving === provider.id ? "Saving..." : "Save provider"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 rounded border border-dashed p-4">
          <h3 className="font-medium">Add provider</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <label className="text-sm font-medium md:col-span-2">
              Name
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, fullName: event.target.value }))
                }
                value={newProvider.fullName}
              />
            </label>
            <label className="text-sm font-medium">
              Credentials
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, credentials: event.target.value }))
                }
                value={newProvider.credentials}
              />
            </label>
            <label className="text-sm font-medium">
              NPI
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, npi: event.target.value }))
                }
                value={newProvider.npi}
              />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Email
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, email: event.target.value }))
                }
                value={newProvider.email}
              />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Phone
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                onChange={(event) =>
                  setNewProvider((current) => ({ ...current, phone: event.target.value }))
                }
                value={newProvider.phone}
              />
            </label>
            <div className="flex items-end">
              <button
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={saving === "new-provider" || !newProvider.fullName.trim()}
                onClick={addProvider}
                type="button"
              >
                {saving === "new-provider" ? "Adding..." : "Add provider"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border bg-white p-5 shadow-sm" id="coordinators">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Coordinators</h2>
          <p className="text-sm text-slate-600">
            Review who can operate the CCM workflow for this practice.
          </p>
        </div>

        <div className="space-y-3">
          {coordinatorMembers.length === 0 ? (
            <div className="rounded border border-dashed p-4 text-sm text-slate-600">
              No coordinators are listed for this practice.
            </div>
          ) : (
            coordinatorMembers.map((member) => {
              const editable = member.role === "coordinator" && member.user_id !== currentUserId;
              return (
                <div className="flex flex-col gap-3 rounded border p-4 md:flex-row md:items-center md:justify-between" key={member.id}>
                  <div>
                    <p className="font-medium">
                      {member.invited_email || (member.user_id === currentUserId ? userEmail : member.user_id)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {roleLabel(member.role)} - {roleLabel(member.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded border px-3 py-2 text-sm"
                      disabled={!editable}
                      onChange={(event) =>
                        setMembers((current) =>
                          current.map((item) =>
                            item.id === member.id
                              ? { ...item, status: event.target.value as PracticeMember["status"] }
                              : item,
                          ),
                        )
                      }
                      value={member.status}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button
                      className="rounded border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                      disabled={!editable || saving === member.id}
                      onClick={() => saveMember(member)}
                      type="button"
                    >
                      {saving === member.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded border bg-white p-5 shadow-sm" id="account">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-slate-600">Manage your signed-in user profile.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded border bg-slate-50 px-3 py-2" disabled value={userEmail} />
          </label>
          <label className="text-sm font-medium">
            Display name
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </label>
        </div>

        <div className="mt-4 rounded border border-dashed bg-slate-50 p-4 text-sm text-slate-600">
          Password changes are handled by the authentication provider for this environment.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={saving === "account"}
            onClick={saveAccount}
            type="button"
          >
            {saving === "account" ? "Saving..." : "Save account"}
          </button>
          <button
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
