"use client";

import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { patientAuditUrl } from "../../lib/development-audit";

const AUDIT_AREAS = [
  {
    title: "Administrator",
    links: [
      ["Management", "/dashboard/management"],
      ["Practice settings", "/settings#practice"],
      ["Subscription", "/settings#subscription"],
      ["Practitioners", "/settings#providers"],
      ["Coordinators", "/settings#coordinators"],
      ["Question banks", "/settings/question-banks"],
    ],
  },
  {
    title: "Coordinator",
    links: [
      ["Today's work", "/dashboard/worklist"],
      ["Patient registry", "/patients"],
      ["Add patient", "/patients/new"],
      ["Billing review", "/dashboard/billing"],
      ["Clinical knowledge", "/clinical-knowledge"],
    ],
  },
  {
    title: "Provider",
    links: [
      ["Items requiring attention", "/dashboard/provider"],
      ["Patient registry", "/patients"],
      ["Clinical knowledge", "/clinical-knowledge"],
      ["Question banks", "/settings/question-banks"],
    ],
  },
] as const;

export default function DevelopmentAuditHub() {
  const [patientLink, setPatientLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openPatientExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = patientAuditUrl(patientLink, window.location.origin);
    if (!url) {
      setError("Enter a generated secure patient link whose path begins with /f/.");
      return;
    }
    setError(null);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="page-shell">
      <div>
        <p className="eyebrow">Development only</p>
        <h1 className="page-title mt-1">UX audit hub</h1>
        <p className="page-description">Move between existing workspaces while the real signed-in session, MFA, and server authorization remain active.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Role workspaces">
        {AUDIT_AREAS.map((area) => (
          <div className="surface p-4" key={area.title}>
            <h2 className="font-semibold text-slate-950">{area.title}</h2>
            <div className="mt-3 grid gap-2">
              {area.links.map(([label, href]) => (
                <Link className="flex min-h-10 items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50" href={href} key={href}>
                  {label}<ExternalLink aria-hidden="true" size={15} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="surface max-w-2xl p-5">
        <h2 className="font-semibold text-slate-950">Patient secure-link experience</h2>
        <p className="mt-1 text-sm text-slate-600">Open a generated check-in link in a separate tab without changing its token or destination.</p>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={openPatientExperience}>
          <label className="flex-1 text-sm">
            <span className="sr-only">Generated patient secure link</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              onChange={(event) => setPatientLink(event.target.value)}
              placeholder="https://.../f/secure-token"
              value={patientLink}
            />
          </label>
          <button className="button-primary" type="submit"><Search aria-hidden="true" size={16} /> Open patient view</button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
