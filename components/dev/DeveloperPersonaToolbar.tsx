"use client";

import {
  ChevronDown,
  ExternalLink,
  FlaskConical,
  RotateCcw,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEVELOPMENT_PERSONAS,
  developmentPersonaById,
  developmentPersonaPatientHref,
  type DevelopmentPersonaContext,
  type DevelopmentPersonaId,
} from "../../lib/development-persona";
import { getSupabaseAuthHeaders, supabase } from "../../lib/supabase";
import { useDevelopmentPersona } from "./useDevelopmentPersona";

type PracticeOption = { id: string; name: string; organization_id: string | null };
type ProviderOption = { id: string; full_name: string };
type PatientOption = { id: string; display_name: string };
type CoordinatorOption = { id: string; invited_email: string | null; role: string };

type ScopeCatalog = {
  coordinators: CoordinatorOption[];
  patients: PatientOption[];
  practices: PracticeOption[];
  providers: ProviderOption[];
};

const EMPTY_CATALOG: ScopeCatalog = { coordinators: [], patients: [], practices: [], providers: [] };

export default function DeveloperPersonaToolbar() {
  const { context, enabled, reset, setContext } = useDevelopmentPersona();
  const [expanded, setExpanded] = useState(false);
  const [catalog, setCatalog] = useState<ScopeCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !expanded) return;
    let active = true;
    void (async () => {
      setLoading(true);
      const { data: sessionResult } = await supabase.auth.getSession();
      const userId = sessionResult.session?.user.id;
      if (!userId) return;

      const { data: memberships } = await supabase
        .from("practice_members")
        .select("practice_id")
        .eq("user_id", userId)
        .eq("status", "active");
      const practiceIds = [...new Set((memberships ?? []).map((membership) => membership.practice_id))];
      const { data: practices } = practiceIds.length
        ? await supabase.from("practices").select("id,name,organization_id").in("id", practiceIds).order("name")
        : { data: [] as PracticeOption[] };
      if (!active) return;

      const selectedPracticeId =
        context?.practiceId ?? localStorage.getItem("activePracticeId") ?? practices?.[0]?.id;
      if (!selectedPracticeId) {
        setCatalog({ ...EMPTY_CATALOG, practices: practices ?? [] });
        return;
      }

      const headers = await getSupabaseAuthHeaders({ includeDevelopmentPersona: false });
      const [providersResponse, patientsResponse, membersResponse] = await Promise.all([
        fetch(`/api/providers?practiceId=${encodeURIComponent(selectedPracticeId)}`, { headers }),
        fetch(`/api/patients?practiceId=${encodeURIComponent(selectedPracticeId)}&pageSize=250`, { headers }),
        fetch(`/api/practice-members?practiceId=${encodeURIComponent(selectedPracticeId)}`, { headers }),
      ]);
      const [providersResult, patientsResult, membersResult] = await Promise.all([
        providersResponse.ok ? providersResponse.json() : Promise.resolve({ providers: [] }),
        patientsResponse.ok ? patientsResponse.json() : Promise.resolve({ patients: [] }),
        membersResponse.ok ? membersResponse.json() : Promise.resolve({ members: [] }),
      ]) as [
        { providers?: ProviderOption[] },
        { patients?: PatientOption[] },
        { members?: CoordinatorOption[] },
      ];
      if (!active) return;
      setCatalog({
        coordinators: (membersResult.members ?? []).filter((member) => member.role === "coordinator"),
        patients: patientsResult.patients ?? [],
        practices: practices ?? [],
        providers: providersResult.providers ?? [],
      });
    })().finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [context?.practiceId, enabled, expanded]);

  const persona = context ? developmentPersonaById(context.personaId) : null;
  const selectedPractice = catalog.practices.find((practice) => practice.id === context?.practiceId);
  const patientHref = context
    ? developmentPersonaPatientHref(context.personaId, context.patientId)
    : "/patients";
  const currentPatient = catalog.patients.find((patient) => patient.id === context?.patientId);
  const currentProvider = catalog.providers.find((provider) => provider.id === context?.providerId);
  const currentCoordinator = catalog.coordinators.find((coordinator) => coordinator.id === context?.coordinatorMemberId);

  function patchContext(patch: Partial<DevelopmentPersonaContext>) {
    const personaId = context?.personaId ?? "developer";
    setContext({ ...context, personaId, ...patch });
  }

  function choosePersona(personaId: DevelopmentPersonaId) {
    const coordinatorIndex = personaId === "coordinator-polly" ? 1 : 0;
    const nextCoordinator = personaId.startsWith("coordinator-")
      ? catalog.coordinators[coordinatorIndex] ?? catalog.coordinators[0]
      : currentCoordinator;
    setContext({
      ...context,
      personaId,
      practiceId: context?.practiceId ?? localStorage.getItem("activePracticeId") ?? catalog.practices[0]?.id,
      providerId: context?.providerId ?? catalog.providers[0]?.id,
      coordinatorMemberId: nextCoordinator?.id ?? context?.coordinatorMemberId,
      patientId: context?.patientId ?? catalog.patients[0]?.id,
    });
  }

  if (!enabled) return null;

  if (!expanded) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400 bg-amber-100 px-4 text-sm font-semibold text-amber-950 shadow-lg hover:bg-amber-200"
        onClick={() => setExpanded(true)}
        type="button"
      >
        <FlaskConical aria-hidden="true" size={17} />
        {persona ? `${persona.name} · ${persona.roleLabel}` : "Development personas"}
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-6xl rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-950 shadow-2xl" aria-label="Development persona controls">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-52 flex-1">
          <div className="flex items-center gap-2 font-semibold"><UserRoundCog aria-hidden="true" size={18} /> Development Persona Mode</div>
          <p className="mt-1 text-xs text-amber-800">Session-only overlay. Real Supabase authentication, AAL2, RLS, and active-practice resolution remain enforced.</p>
        </div>
        <Link className="button-secondary min-h-9" href="/dev/personas">Persona hub</Link>
        <button className="button-secondary min-h-9" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={15} /> Reset persona</button>
        <button className="inline-flex size-9 items-center justify-center rounded-md border border-amber-300 bg-white" onClick={() => setExpanded(false)} title="Collapse developer controls" type="button"><ChevronDown aria-hidden="true" size={17} /></button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium">Current persona
          <select className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm" onChange={(event) => event.target.value ? choosePersona(event.target.value as DevelopmentPersonaId) : reset()} value={context?.personaId ?? ""}>
            <option value="">Real authorization</option>
            {DEVELOPMENT_PERSONAS.map((option) => <option key={option.id} value={option.id}>{option.name} · {option.roleLabel}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium">Current practice
          <select className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm" disabled={loading} onChange={(event) => {
            const practice = catalog.practices.find((option) => option.id === event.target.value);
            patchContext({ practiceId: practice?.id, organizationId: practice?.organization_id ?? undefined, providerId: undefined, coordinatorMemberId: undefined, patientId: undefined });
          }} value={context?.practiceId ?? ""}>
            <option value="">Select practice</option>
            {catalog.practices.map((practice) => <option key={practice.id} value={practice.id}>{practice.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium">Current patient
          <select className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm" disabled={loading} onChange={(event) => patchContext({ patientId: event.target.value || undefined })} value={context?.patientId ?? ""}>
            <option value="">All authorized patients</option>
            {catalog.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.display_name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium">Current provider
          <select className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm" disabled={loading} onChange={(event) => patchContext({ providerId: event.target.value || undefined })} value={context?.providerId ?? ""}>
            <option value="">No provider selected</option>
            {catalog.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.full_name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium">Current coordinator
          <select className="mt-1 w-full rounded-md border bg-white px-2 py-2 text-sm" disabled={loading} onChange={(event) => patchContext({ coordinatorMemberId: event.target.value || undefined })} value={context?.coordinatorMemberId ?? ""}>
            <option value="">No coordinator selected</option>
            {catalog.coordinators.map((coordinator, index) => <option key={coordinator.id} value={coordinator.id}>{coordinator.invited_email ?? `Coordinator ${index + 1}`}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-white px-2 py-1"><strong>Organization:</strong> {context?.organizationId ?? selectedPractice?.organization_id ?? "Current practice organization"}</span>
        <span className="rounded bg-white px-2 py-1"><strong>Patient scope:</strong> {currentPatient?.display_name ?? "Real authorized scope"}</span>
        <span className="rounded bg-white px-2 py-1"><strong>Provider:</strong> {currentProvider?.full_name ?? "Not selected"}</span>
        <span className="rounded bg-white px-2 py-1"><strong>Coordinator:</strong> {currentCoordinator?.invited_email ?? "Not selected"}</span>
      </div>

      <nav className="mt-3 flex flex-wrap gap-2 text-xs" aria-label="Persona quick links">
        <Link className="button-secondary min-h-8" href="/settings"><ExternalLink aria-hidden="true" size={13} /> Current user</Link>
        <Link className="button-secondary min-h-8" href={patientHref}><ExternalLink aria-hidden="true" size={13} /> Current patient</Link>
        <Link className="button-secondary min-h-8" href="/dashboard/worklist">Current queue</Link>
        <Link className="button-secondary min-h-8" href="/dashboard/worklist">Coordinator queue</Link>
        <Link className="button-secondary min-h-8" href="/dashboard/provider">Provider review</Link>
        <Link className="button-secondary min-h-8" href="/dashboard/billing">Billing</Link>
        <Link className="button-secondary min-h-8" href="/dashboard/compliance">Compliance</Link>
        <Link className="button-secondary min-h-8" href="/settings">Settings</Link>
      </nav>
    </aside>
  );
}
