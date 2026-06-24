"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseAuthHeaders, supabase } from "../lib/supabase";

type ActivePracticeResponse = {
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

const NAV_ITEMS: NavItem[] = [
  { exact: true, href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/dashboard/worklist", label: "Worklist" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/clinical-knowledge", label: "Knowledge" },
  { href: "/settings#practice", label: "Practice", match: null },
  { href: "/settings", label: "Settings" },
  { href: "/settings#account", label: "Account", match: null },
];

function isStaffPath(pathname: string): boolean {
  return !(
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/f/")
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [practiceName, setPracticeName] = useState<string>("Practice setup");
  const [userLabel, setUserLabel] = useState<string>("Signed in");

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

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem("activePracticeId");
    router.replace("/login");
  }

  if (!staffPath) {
    return (
      <header className="w-full border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-slate-900">
            CCM Assistant
          </Link>
          {!pathname.startsWith("/f/") ? (
            <div className="flex items-center gap-4 text-sm">
              <Link className="text-slate-700 hover:text-slate-950" href="/login">
                Login
              </Link>
              <Link className="rounded border px-3 py-1 text-slate-800 hover:bg-slate-50" href="/signup">
                Sign up
              </Link>
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="w-full border-b bg-white px-6 py-3">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/dashboard/worklist" className="font-semibold text-lg text-slate-950">
            CCM Assistant
          </Link>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span>Practice: {practiceName}</span>
            <span>User: {userLabel}</span>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const normalizedHref = item.href.split("#")[0];
            const matchPath = item.match === undefined ? normalizedHref : item.match;
            const active = matchPath
              ? item.exact
                ? pathname === matchPath
                : pathname === matchPath || pathname.startsWith(`${matchPath}/`)
              : false;

            return (
              <Link
                className={`rounded px-3 py-2 ${
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
                href={item.href}
                key={`${item.href}-${item.label}`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            className="rounded border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
            onClick={signOut}
            type="button"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
