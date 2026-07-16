"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { PracticeRole } from "../../../lib/ccm/types";
import { getSupabaseAuthHeaders } from "../../../lib/supabase";

type Scope = "clinic" | "provider" | "coordinator";
type LibraryView = "global" | "clinic" | "provider" | "personal" | "candidates" | "history";
type Bank = { applicableContexts: string[]; canonicalConditionId: string; displayName: string; id: string; questionCount: number; reviewStatus: string; status: string; version: number };
type Favorite = { canonical_condition_id: string; coordinator_member_id: string | null; created_at: string; display_order: number; favorite: boolean; provider_id: string | null; scope: Scope; state: string; version: number };
type CustomQuestion = { answer_type: string; canonical_condition_id: string; contexts: string[]; created_at: string; question_key: string; question_text: string; state: string; version: number };
type Contribution = { anonymous: boolean; canonical_condition_id: string; context: string; created_at: string; opt_in_status: string; question_text: string; usage_count: number };
type Override = { bank_id: string; canonical_condition_id: string; change_note: string | null; created_at: string; scope: Scope; state: string; version: number };
type Member = { id: string; invited_email: string | null; role: PracticeRole };
type Provider = { id: string; full_name: string; member_id: string | null };
type ManagementResponse = {
  banks?: Bank[];
  contributions?: Contribution[];
  coordinators?: Member[];
  customQuestions?: CustomQuestion[];
  error?: string;
  favorites?: Favorite[];
  membership?: Member & { practice_id: string };
  overrides?: Override[];
  providers?: Provider[];
};

const VIEWS: Array<{ key: LibraryView; label: string }> = [
  { key: "global", label: "Global library" },
  { key: "clinic", label: "Clinic library" },
  { key: "provider", label: "Provider library" },
  { key: "personal", label: "Personal library" },
  { key: "candidates", label: "Candidates" },
  { key: "history", label: "Version history" },
];

const EMPTY_DATA: ManagementResponse = { banks: [], contributions: [], coordinators: [], customQuestions: [], favorites: [], overrides: [], providers: [] };

function latestByKey<T>(rows: T[], key: (row: T) => string, version: (row: T) => number): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const existing = latest.get(key(row));
    if (!existing || version(row) > version(existing)) latest.set(key(row), row);
  }
  return [...latest.values()];
}

export default function QuestionBankManagementPage() {
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [data, setData] = useState<ManagementResponse>(EMPTY_DATA);
  const [view, setView] = useState<LibraryView>("global");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("clinic");
  const [providerId, setProviderId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answerType, setAnswerType] = useState("yes_no");
  const [context, setContext] = useState("monthly_checkin");
  const [noPhiAttested, setNoPhiAttested] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (activePracticeId: string) => {
    const response = await fetch(`/api/question-bank-management?practiceId=${encodeURIComponent(activePracticeId)}`, { headers: await getSupabaseAuthHeaders() });
    const result = (await response.json()) as ManagementResponse;
    if (!response.ok) throw new Error(result.error ?? "Unable to load question libraries");
    setData(result);
    if (result.banks?.[0]) setSelectedCondition((current) => current || result.banks![0].canonicalConditionId);
    const membership = result.membership;
    if (membership?.role === "provider") {
      setScope("provider");
      setProviderId(result.providers?.find((provider) => provider.member_id === membership.id)?.id ?? "");
    } else if (membership?.role === "coordinator") {
      setScope("coordinator");
      setCoordinatorId(membership.id);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const storedPracticeId = localStorage.getItem("activePracticeId");
        const response = await fetch("/api/practices/active", { headers: { ...(await getSupabaseAuthHeaders()), ...(storedPracticeId ? { "x-active-practice-id": storedPracticeId } : {}) } });
        const result = await response.json() as { error?: string; practice?: { id: string } };
        if (!response.ok || !result.practice) throw new Error(result.error ?? "No active practice found");
        if (!active) return;
        localStorage.setItem("activePracticeId", result.practice.id);
        setPracticeId(result.practice.id);
        await load(result.practice.id);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load question libraries");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    if (view === "provider") setScope("provider");
    if (view === "personal") setScope("coordinator");
  }, [view]);

  const banks = data.banks ?? [];
  const latestFavorites = useMemo(() => latestByKey(data.favorites ?? [], (row) => `${row.scope}:${row.provider_id ?? ""}:${row.coordinator_member_id ?? ""}:${row.canonical_condition_id}`, (row) => row.version), [data.favorites]);
  const activeOwnerFavorites = useMemo(() => latestFavorites.filter((row) =>
    row.favorite && row.state === "active" && row.scope === scope &&
    row.provider_id === (scope === "clinic" ? null : providerId || null) &&
    row.coordinator_member_id === (scope === "coordinator" ? coordinatorId || null : null),
  ), [coordinatorId, latestFavorites, providerId, scope]);
  const favoriteConditions = useMemo(() => new Set(activeOwnerFavorites.map((row) => row.canonical_condition_id)), [activeOwnerFavorites]);
  const favoriteBanks = banks.filter((bank) => favoriteConditions.has(bank.canonicalConditionId));
  const filteredBanks = banks.filter((bank) => `${bank.displayName} ${bank.status} ${bank.reviewStatus} ${bank.applicableContexts.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const latestCustomQuestions = useMemo(() => latestByKey(data.customQuestions ?? [], (row) => row.question_key, (row) => row.version), [data.customQuestions]);
  const canAdministerClinic = ["owner", "admin"].includes(data.membership?.role ?? "");

  async function post(payload: Record<string, unknown>) {
    if (!practiceId) return;
    setWorking(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/question-bank-management", { body: JSON.stringify({ ...payload, practiceId }), headers: { "Content-Type": "application/json", ...(await getSupabaseAuthHeaders()) }, method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save question-library change");
      await load(practiceId);
      setMessage("Question library updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save question-library change");
    } finally { setWorking(false); }
  }

  function favoriteOwner() {
    return { coordinatorId: scope === "coordinator" ? coordinatorId : null, providerId: scope === "clinic" ? null : providerId || null, scope };
  }

  async function toggleFavorite(bank: Bank) {
    const current = latestFavorites.find((row) => row.scope === scope && row.provider_id === (scope === "clinic" ? null : providerId || null) && row.coordinator_member_id === (scope === "coordinator" ? coordinatorId || null : null) && row.canonical_condition_id === bank.canonicalConditionId);
    await post({ operation: "favorite", canonicalConditionId: bank.canonicalConditionId, favorite: !(current?.favorite && current.state === "active"), ...favoriteOwner() });
  }

  async function createCustomQuestion(event: FormEvent) {
    event.preventDefault();
    await post({ operation: "custom_question", answerType, canonicalConditionId: selectedCondition, contexts: [context], questionText });
    setQuestionText("");
  }

  async function createCandidate(event: FormEvent) {
    event.preventDefault();
    await post({ operation: "contribution", anonymous, canonicalConditionId: selectedCondition, context, noPhiAttested, optIn, questionText });
    setQuestionText(""); setNoPhiAttested(false); setOptIn(false);
  }

  if (loading) return <main className="p-6 text-sm text-slate-600">Loading question libraries...</main>;

  return (
    <main className="space-y-5 p-6">
      <div><p className="text-sm font-medium text-slate-600">Administration</p><h1 className="text-xl font-semibold">Question Bank Management</h1></div>
      <div className="flex flex-wrap gap-2" role="tablist">{VIEWS.map((item) => <button aria-selected={view === item.key} className={`border px-3 py-2 text-sm font-medium ${view === item.key ? "bg-slate-900 text-white" : "bg-white"}`} key={item.key} onClick={() => setView(item.key)} role="tab" type="button">{item.label}</button>)}</div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div> : null}

      {view === "global" ? <>
        <section className="border-y bg-white py-4"><h2 className="font-semibold">Favorites</h2><div className="mt-3 flex flex-wrap gap-2">{favoriteBanks.length ? favoriteBanks.map((bank) => <button className="border bg-amber-50 px-3 py-2 text-sm font-medium" key={bank.canonicalConditionId} onClick={() => setSearch(bank.displayName)} type="button">{bank.displayName}</button>) : <span className="text-sm text-slate-600">No favorites in the active libraries.</span>}</div></section>
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3"><label className="w-full max-w-md text-sm font-medium">Search library<input className="mt-1 block w-full border px-3 py-2" onChange={(event) => setSearch(event.target.value)} placeholder="Condition, context, or review status" value={search} /></label><ScopeControls coordinatorId={coordinatorId} coordinators={data.coordinators ?? []} onCoordinator={setCoordinatorId} onProvider={setProviderId} onScope={setScope} providerId={providerId} providers={data.providers ?? []} scope={scope} /></div>
          <BankTable banks={filteredBanks} disabled={working} favoriteConditions={favoriteConditions} onFavorite={toggleFavorite} />
        </section>
      </> : null}

      {view === "clinic" ? <section className="grid gap-5 lg:grid-cols-[minmax(20rem,0.8fr)_1.2fr]">
        {canAdministerClinic ? <form className="space-y-3 border bg-white p-4" onSubmit={createCustomQuestion}><h2 className="font-semibold">New clinic question</h2><QuestionFields answerType={answerType} banks={banks} context={context} onAnswerType={setAnswerType} onCondition={setSelectedCondition} onContext={setContext} onText={setQuestionText} questionText={questionText} selectedCondition={selectedCondition} /><button className="border bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={working || !questionText.trim()} type="submit">Create question</button></form> : null}
        <section className="border bg-white p-4"><h2 className="font-semibold">Clinic questions</h2><div className="mt-3 divide-y">{latestCustomQuestions.length ? latestCustomQuestions.map((question) => <div className="flex items-start justify-between gap-4 py-3" key={question.question_key}><div><div className="text-sm font-medium">{question.question_text}</div><div className="mt-1 text-xs text-slate-600">{banks.find((bank) => bank.canonicalConditionId === question.canonical_condition_id)?.displayName ?? "Condition"} - {question.answer_type.replaceAll("_", " ")} - version {question.version} - {question.state}</div></div>{canAdministerClinic && question.state === "active" ? <button className="border px-2 py-1 text-xs" disabled={working} onClick={() => post({ operation: "retire_custom_question", questionKey: question.question_key })} type="button">Retire</button> : null}</div>) : <p className="mt-3 text-sm text-slate-600">No clinic questions.</p>}</div></section>
      </section> : null}

      {view === "provider" || view === "personal" ? <section className="space-y-4"><ScopeControls coordinatorId={coordinatorId} coordinators={data.coordinators ?? []} onCoordinator={setCoordinatorId} onProvider={setProviderId} onScope={setScope} providerId={providerId} providers={data.providers ?? []} scope={scope} /><BankTable banks={banks.filter((bank) => favoriteConditions.has(bank.canonicalConditionId))} disabled={working} favoriteConditions={favoriteConditions} onFavorite={toggleFavorite} /></section> : null}

      {view === "candidates" ? <section className="grid gap-5 lg:grid-cols-[minmax(20rem,0.8fr)_1.2fr]"><form className="space-y-3 border bg-white p-4" onSubmit={createCandidate}><h2 className="font-semibold">New candidate question</h2><QuestionFields answerType={answerType} banks={banks} context={context} hideAnswerType onAnswerType={setAnswerType} onCondition={setSelectedCondition} onContext={setContext} onText={setQuestionText} questionText={questionText} selectedCondition={selectedCondition} /><label className="flex gap-2 text-sm"><input checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} type="checkbox" /> Anonymous candidate</label><label className="flex gap-2 text-sm"><input checked={noPhiAttested} onChange={(event) => setNoPhiAttested(event.target.checked)} type="checkbox" /> I confirm this question contains no patient information.</label><label className="flex gap-2 text-sm"><input checked={optIn} onChange={(event) => setOptIn(event.target.checked)} type="checkbox" /> Opt in for anonymous contribution review.</label><button className="border bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={working || !questionText.trim() || !noPhiAttested} type="submit">Save candidate</button></form><section className="border bg-white p-4"><h2 className="font-semibold">Contribution queue</h2><div className="mt-3 divide-y">{(data.contributions ?? []).map((candidate, index) => <div className="py-3" key={`${candidate.created_at}-${index}`}><div className="text-sm font-medium">{candidate.question_text}</div><div className="mt-1 text-xs text-slate-600">{candidate.context.replaceAll("_", " ")} - {candidate.opt_in_status.replaceAll("_", " ")} - used {candidate.usage_count} times - {candidate.anonymous ? "anonymous" : "identified"}</div></div>)}</div></section></section> : null}

      {view === "history" ? <section className="grid gap-5 lg:grid-cols-3"><HistoryPanel rows={(data.favorites ?? []).map((row) => ({ date: row.created_at, label: `${banks.find((bank) => bank.canonicalConditionId === row.canonical_condition_id)?.displayName ?? "Bank"} - ${row.scope} favorite ${row.favorite ? "added" : "removed"}`, version: row.version }))} title="Favorite history" /><HistoryPanel rows={(data.customQuestions ?? []).map((row) => ({ date: row.created_at, label: `${row.question_text} - ${row.state}`, version: row.version }))} title="Custom-question history" /><HistoryPanel rows={(data.overrides ?? []).map((row) => ({ date: row.created_at, label: `${banks.find((bank) => bank.canonicalConditionId === row.canonical_condition_id)?.displayName ?? "Bank"} - ${row.scope} ${row.state}`, version: row.version }))} title="Override history" /></section> : null}
    </main>
  );
}

function ScopeControls({ coordinatorId, coordinators, onCoordinator, onProvider, onScope, providerId, providers, scope }: { coordinatorId: string; coordinators: Member[]; onCoordinator: (value: string) => void; onProvider: (value: string) => void; onScope: (scope: Scope) => void; providerId: string; providers: Provider[]; scope: Scope }) {
  return <div className="flex flex-wrap gap-2"><label className="text-sm font-medium">Library<select className="mt-1 block border px-3 py-2" onChange={(event) => onScope(event.target.value as Scope)} value={scope}><option value="clinic">Clinic</option><option value="provider">Provider</option><option value="coordinator">Personal</option></select></label>{scope !== "clinic" ? <label className="text-sm font-medium">Provider<select className="mt-1 block border px-3 py-2" onChange={(event) => onProvider(event.target.value)} value={providerId}><option value="">Select provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.full_name}</option>)}</select></label> : null}{scope === "coordinator" ? <label className="text-sm font-medium">Coordinator<select className="mt-1 block border px-3 py-2" onChange={(event) => onCoordinator(event.target.value)} value={coordinatorId}><option value="">Select coordinator</option>{coordinators.map((member) => <option key={member.id} value={member.id}>{member.invited_email ?? member.role}</option>)}</select></label> : null}</div>;
}

function BankTable({ banks, disabled, favoriteConditions, onFavorite }: { banks: Bank[]; disabled: boolean; favoriteConditions: Set<string>; onFavorite: (bank: Bank) => void }) {
  if (!banks.length) return <div className="border border-dashed bg-white p-5 text-sm text-slate-600">No question banks match.</div>;
  return <div className="overflow-x-auto border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Question bank</th><th className="px-4 py-3">Contexts</th><th className="px-4 py-3">Questions</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Favorite</th></tr></thead><tbody>{banks.map((bank) => <tr className="border-b last:border-0" key={bank.canonicalConditionId}><td className="px-4 py-3"><div className="font-medium">{bank.displayName}</div><div className="text-xs text-slate-600">Version {bank.version}</div></td><td className="px-4 py-3 text-xs text-slate-600">{bank.applicableContexts.map((item) => item.replaceAll("_", " ")).join(", ")}</td><td className="px-4 py-3">{bank.questionCount}</td><td className="px-4 py-3 text-xs">{bank.reviewStatus.replaceAll("_", " ")}</td><td className="px-4 py-3"><button aria-label={`${favoriteConditions.has(bank.canonicalConditionId) ? "Remove" : "Add"} ${bank.displayName} favorite`} className={`border px-3 py-1.5 text-xs font-medium ${favoriteConditions.has(bank.canonicalConditionId) ? "bg-amber-50" : "bg-white"}`} disabled={disabled} onClick={() => onFavorite(bank)} type="button">{favoriteConditions.has(bank.canonicalConditionId) ? "Favorited" : "Favorite"}</button></td></tr>)}</tbody></table></div>;
}

function QuestionFields({ answerType, banks, context, hideAnswerType = false, onAnswerType, onCondition, onContext, onText, questionText, selectedCondition }: { answerType: string; banks: Bank[]; context: string; hideAnswerType?: boolean; onAnswerType: (value: string) => void; onCondition: (value: string) => void; onContext: (value: string) => void; onText: (value: string) => void; questionText: string; selectedCondition: string }) {
  return <><label className="block text-sm font-medium">Condition<select className="mt-1 block w-full border px-3 py-2" onChange={(event) => onCondition(event.target.value)} value={selectedCondition}>{banks.map((bank) => <option key={bank.canonicalConditionId} value={bank.canonicalConditionId}>{bank.displayName}</option>)}</select></label><label className="block text-sm font-medium">Question<textarea className="mt-1 min-h-24 w-full border px-3 py-2" onChange={(event) => onText(event.target.value)} value={questionText} /></label><label className="block text-sm font-medium">Context<select className="mt-1 block w-full border px-3 py-2" onChange={(event) => onContext(event.target.value)} value={context}><option value="intake">Intake</option><option value="monthly_checkin">Monthly check-in</option><option value="annual_review">Annual review</option><option value="care_plan_review">Care-plan review</option></select></label>{!hideAnswerType ? <label className="block text-sm font-medium">Answer type<select className="mt-1 block w-full border px-3 py-2" onChange={(event) => onAnswerType(event.target.value)} value={answerType}><option value="yes_no">Yes / no</option><option value="number">Number</option><option value="text">Text</option><option value="date">Date</option><option value="single_select">Single select</option><option value="multi_select">Multiple select</option></select></label> : null}</>;
}

function HistoryPanel({ rows, title }: { rows: Array<{ date: string; label: string; version: number }>; title: string }) {
  return <section className="border bg-white p-4"><h2 className="font-semibold">{title}</h2><div className="mt-3 divide-y">{rows.length ? rows.map((row, index) => <div className="py-3 text-sm" key={`${row.date}-${index}`}><div className="font-medium">{row.label}</div><div className="mt-1 text-xs text-slate-600">Version {row.version} - {new Date(row.date).toLocaleDateString()}</div></div>) : <p className="text-sm text-slate-600">No history.</p>}</div></section>;
}
