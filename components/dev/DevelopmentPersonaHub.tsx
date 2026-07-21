"use client";

import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DEVELOPMENT_PERSONAS,
  developmentPersonaById,
  type DevelopmentPersonaId,
} from "../../lib/development-persona";
import { useDevelopmentPersona } from "./useDevelopmentPersona";

export default function DevelopmentPersonaHub() {
  const router = useRouter();
  const { context, reset, selectPersona } = useDevelopmentPersona();

  function activate(personaId: DevelopmentPersonaId) {
    selectPersona(personaId);
    router.push(developmentPersonaById(personaId).home);
  }

  return (
    <main className="page-shell pb-44">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Development only</p>
          <h1 className="page-title mt-1">Developer Persona Hub</h1>
          <p className="page-description">Review the same local application through realistic team perspectives without changing the authenticated user or database membership.</p>
        </div>
        <button className="button-secondary" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={16} /> Restore real authorization</button>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden="true" size={17} /> Security boundary</div>
        <p className="mt-1 text-teal-800">Every request still requires the real authenticated AAL2 session and a real active practice membership. The overlay is accepted only by a development server with the explicit audit flag enabled.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Available development personas">
        {DEVELOPMENT_PERSONAS.map((persona) => {
          const selected = context?.personaId === persona.id;
          return (
            <article className={`surface flex min-h-52 flex-col p-5 ${selected ? "ring-2 ring-teal-600" : ""}`} key={persona.id}>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{persona.roleLabel}</div>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{persona.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{persona.description}</p>
              <button className="button-primary mt-4 w-full" onClick={() => activate(persona.id)} type="button">
                {selected ? "Open persona home" : "Use this persona"}<ArrowRight aria-hidden="true" size={16} />
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
