"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogOut, PlayCircle } from "lucide-react";
import { getSupabaseAuthHeaders, supabase } from "../lib/supabase";
import type { PracticeRole } from "../lib/ccm/types";
import {
  developmentPersonaById,
  developmentPersonaPatientHref,
  type DevelopmentPersonaId,
} from "../lib/development-persona";
import { useDevelopmentPersona } from "./dev/useDevelopmentPersona";
import BrandMark from "./ui/BrandMark";

type ActivePracticeResponse = {
  membership?: {
    role: PracticeRole;
  } | null;
  practice?: {
    id: string;
    name: string;
  } | null;
};

type NavItem = {
  exact?: boolean;
  href: string;
  label: string;
  match?: string | null;
};

function navigationForRole(role: PracticeRole | null): NavItem[] {
  if (role === "provider") {
    return [
      { href: "/dashboard/provider", label: "Attention" },
      { href: "/patients", label: "Patients" },
      { href: "/clinical-knowledge", label: "Knowledge" },
      { href: "/settings/question-banks", label: "Question Banks" },
      { href: "/settings", label: "Settings" },
    ];
  }
  if (role === "billing_staff") {
    return [
      { href: "/dashboard/billing", label: "Billing" },
      { href: "/settings", label: "Settings" },
    ];
  }
  const items: NavItem[] = [
    { href: "/dashboard/worklist", label: "Worklist" },
    { href: "/patients", label: "Patients" },
    { href: "/dashboard/provider", label: "Provider" },
    { href: "/dashboard/billing", label: "Billing" },
    { href: "/clinical-knowledge", label: "Knowledge" },
    { href: "/settings/question-banks", label: "Question Banks" },
  ];
  if (role === "owner" || role === "admin") {
    items.push({ href: "/dashboard/management", label: "Management" });
    items.push({ href: "/dashboard/compliance", label: "Compliance" });
  }
  items.push({ href: "/settings", label: "Settings" });
  return items;
}

function navigationForPersona(personaId: DevelopmentPersonaId, patientId?: string): NavItem[] {
  const patientHref = developmentPersonaPatientHref(personaId, patientId);
  if (personaId === "compliance-administrator") {
    return [
      { href: "/dashboard/compliance", label: "Compliance" },
      { href: patientHref, label: "Current patient" },
      { href: "/dashboard/management", label: "Management" },
    ];
  }
  if (personaId === "billing-administrator") {
    return [
      { href: "/dashboard/billing", label: "Billing" },
      { href: patientHref, label: "Current patient" },
    ];
  }
  if (personaId === "provider-paul") {
    return [
      { href: "/dashboard/provider", label: "Attention" },
      { href: patientHref, label: "Current patient" },
      { href: "/patients", label: "Patients" },
      { href: "/clinical-knowledge", label: "Knowledge" },
    ];
  }
  if (personaId === "coordinator-mary" || personaId === "coordinator-polly" || personaId === "clinical-staff") {
    return [
      { href: "/dashboard/worklist", label: "Worklist" },
      { href: patientHref, label: "Current patient" },
      { href: "/patients", label: "Patients" },
      { href: "/clinical-knowledge", label: "Knowledge" },
    ];
  }
  if (personaId === "front-desk") {
    return [
      { href: "/patients", label: "Patients" },
      { href: "/patients/new", label: "Add patient" },
      { href: patientHref, label: "Current patient" },
    ];
  }
  if (personaId === "read-only") {
    return [
      { href: "/patients", label: "Patients" },
      { href: patientHref, label: "Current patient" },
      { href: "/clinical-knowledge", label: "Knowledge" },
    ];
  }
  if (personaId === "patient") {
    return [
      { href: patientHref, label: "My care" },
      { href: "/dev/personas", label: "Persona hub" },
    ];
  }
  return navigationForRole(personaId === "practice-administrator" ? "admin" : "owner");
}

function isStaffPath(pathname: string): boolean {
  return !(
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/accept-invitation" ||
    pathname === "/mfa" ||
    pathname === "/setup/practice" ||
    pathname === "/demo" ||
    pathname === "/request-demo" ||
    pathname.startsWith("/f/")
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [practiceName, setPracticeName] = useState<string>("Practice setup");
  const [userLabel, setUserLabel] = useState<string>("Signed in");
  const [role, setRole] = useState<PracticeRole | null>(null);
  const { context: developmentPersona, reset: resetDevelopmentPersona } = useDevelopmentPersona();

  const staffPath = useMemo(() => isStaffPath(pathname), [pathname]);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!active || !session) {
        return;
      }

      setUserLabel(
        session.user.user_metadata?.display_name ||
          session.user.email ||
          "Signed in",
      );

      if (!staffPath) {
        return;
      }

      const activePracticeId = localStorage.getItem("activePracticeId");
      const response = await fetch("/api/practices/active", {
        headers: {
          ...(await getSupabaseAuthHeaders()),
          ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
        },
      });

      if (!active || !response.ok) {
        return;
      }

      const result = (await response.json()) as ActivePracticeResponse;
      if (result.practice?.id) {
        localStorage.setItem("activePracticeId", result.practice.id);
      }

      if (result.practice?.name) {
        setPracticeName(result.practice.name);
      }
      setRole(result.membership?.role ?? null);
    }

    void loadContext();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadContext();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [staffPath]);

  const personaDefinition = developmentPersona ? developmentPersonaById(developmentPersona.personaId) : null;
  const navItems = useMemo(
    () => developmentPersona
      ? navigationForPersona(developmentPersona.personaId, developmentPersona.patientId)
      : navigationForRole(role),
    [developmentPersona, role],
  );
  const homeHref = developmentPersona
    ? developmentPersona.personaId === "patient"
      ? developmentPersonaPatientHref(developmentPersona.personaId, developmentPersona.patientId)
      : personaDefinition?.home ?? "/dev/personas"
    : role === "provider"
      ? "/dashboard/provider"
      : role === "billing_staff"
        ? "/dashboard/billing"
        : "/dashboard/worklist";

  async function signOut() {
    resetDevelopmentPersona();
    await supabase.auth.signOut();
    localStorage.removeItem("activePracticeId");
    router.replace("/login");
  }

  if (!staffPath) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="shrink-0" href="/" aria-label="CCM Assistant home">
            <BrandMark />
          </Link>
          {!pathname.startsWith("/f/") ? (
            <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
                <Link className="button-quiet" href="/#how-it-works">How it works</Link>
                <Link className="button-quiet" href="/#security">Security</Link>
                <Link className="button-quiet" href="/demo"><PlayCircle aria-hidden="true" size={16} /> Demo</Link>
              </nav>
              <Link className="button-secondary" href="/login">
                Sign in
              </Link>
              <Link className="button-primary hidden sm:inline-flex" href="/request-demo">
                Request demo
              </Link>
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <Link href={homeHref} aria-label="CCM Assistant dashboard">
            <BrandMark />
          </Link>
          <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-sm font-semibold text-slate-800">{practiceName}</div>
            <div className="truncate text-xs text-slate-500">{personaDefinition ? `${personaDefinition.name} · ${personaDefinition.roleLabel}` : userLabel}</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto text-sm" aria-label="Practice navigation">
          {navItems.map((item) => {
            const normalizedHref = item.href.split("#")[0];
            const matchPath = item.match === undefined ? normalizedHref : item.match;
            const active = matchPath
              ? item.exact
                ? pathname === matchPath
                : pathname === matchPath || pathname.startsWith(`${matchPath}/`)
              : false;

            return (
              <Link
                className={`whitespace-nowrap rounded-md px-3 py-2 font-medium ${
                  active ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-100"
                }`}
                href={item.href}
                key={`${item.href}-${item.label}`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            aria-label="Sign out"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            onClick={signOut}
            type="button"
            title="Sign out"
          >
            <LogOut aria-hidden="true" size={17} />
          </button>
        </nav>
      </div>
    </header>
  );
}
