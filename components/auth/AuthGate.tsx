"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseAuthHeaders, supabase } from "../../lib/supabase";

const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/accept-invitation", "/f/"];
const PUBLIC_PATHS = ["/", "/demo", "/request-demo"];
const SETUP_PATH = "/setup/practice";
const MFA_PATH = "/mfa";

type ActivePracticeResponse = {
  membership?: {
    role: string;
  } | null;
  practice?: {
    id: string;
    name: string;
  } | null;
};

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isPublic = useMemo(
    () => PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname],
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        if (!isPublic) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        setReady(true);
        return;
      }

      if (pathname === "/login" || pathname === "/signup") {
        router.replace("/patients");
        return;
      }

      if (pathname !== MFA_PATH) {
        const [{ data: factors, error: factorsError }, { data: assurance, error: assuranceError }] =
          await Promise.all([
            supabase.auth.mfa.listFactors(),
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          ]);

        if (factorsError || assuranceError || !factors?.totp?.length || assurance?.currentLevel !== "aal2") {
          const query = window.location.search.replace(/^\?/, "");
          const nextPath = `${pathname}${query ? `?${query}` : ""}`;
          router.replace(`${MFA_PATH}?next=${encodeURIComponent(nextPath)}`);
          return;
        }
      }

      if ((!isPublic || pathname === SETUP_PATH) && pathname !== MFA_PATH) {
        const activePracticeId = localStorage.getItem("activePracticeId");
        const response = await fetch("/api/practices/active", {
          headers: {
            ...(await getSupabaseAuthHeaders()),
            ...(activePracticeId ? { "x-active-practice-id": activePracticeId } : {}),
          },
        });

        if (response.status === 404) {
          if (pathname !== SETUP_PATH) {
            router.replace(SETUP_PATH);
            return;
          }
        } else if (response.ok) {
          const result = (await response.json()) as ActivePracticeResponse;
          if (result.practice?.id) {
            localStorage.setItem("activePracticeId", result.practice.id);
          }

          if (pathname === SETUP_PATH) {
            router.replace("/patients");
            return;
          }
        }
      }

      if (active) setReady(true);
    }

    void checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkAccess();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isPublic, pathname, router]);

  if (!ready && !isPublic) {
    return (
      <main className="flex min-h-[calc(100svh-65px)] items-center justify-center bg-[#f4f7f7] px-6 text-sm text-slate-600" role="status">
        <span className="mr-3 size-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" aria-hidden="true" />
        Verifying secure access...
      </main>
    );
  }

  return <>{children}</>;
}
