"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogOut, PlayCircle } from "lucide-react";
import { getSupabaseAuthHeaders, supabase } from "../lib/supabase";
import type { PracticeRole } from "../lib/ccm/types";
import {
  DEVELOPMENT_AUDIT_ROLE_EVENT,
  DEVELOPMENT_AUDIT_ROLE_KEY,
  type DevelopmentAuditRole,
  auditNavigationRole,
  isDevelopmentAuditEnabled,
  isDevelopmentAuditRole,
} from "../lib/development-audit";
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
  if (role === "owner" || role === "admin") items.push({ href: "/dashboard/management", label: "Management" });
  items.push({ href: "/settings", label: "Settings" });
  return items;
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
  const [auditRole, setAuditRole] = useState<DevelopmentAuditRole | null>(null);

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

  useEffect(() => {
    if (!isDevelopmentAuditEnabled()) return;
    const frame = window.requestAnimationFrame(() => {
      const storedRole = localStorage.getItem(DEVELOPMENT_AUDIT_ROLE_KEY);
      if (isDevelopmentAuditRole(storedRole)) setAuditRole(storedRole);
    });

    function updateAuditRole(event: Event) {
      const nextRole = (event as CustomEvent<unknown>).detail;
      if (isDevelopmentAuditRole(nextRole)) setAuditRole(nextRole);
    }

    window.addEventListener(DEVELOPMENT_AUDIT_ROLE_EVENT, updateAuditRole);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(DEVELOPMENT_AUDIT_ROLE_EVENT, updateAuditRole);
    };
  }, []);

  const navigationRole = auditNavigationRole(role, auditRole);
  const navItems = useMemo(() => navigationForRole(navigationRole), [navigationRole]);
  const homeHref = navigationRole === "provider" ? "/dashboard/provider" : navigationRole === "billing_staff" ? "/dashboard/billing" : "/dashboard/worklist";

  async function signOut() {
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
            <div className="truncate text-xs text-slate-500">{userLabel}</div>
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
