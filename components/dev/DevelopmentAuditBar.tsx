"use client";

import { ClipboardList, FlaskConical, Settings, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEVELOPMENT_AUDIT_ROLE_EVENT,
  DEVELOPMENT_AUDIT_ROLE_KEY,
  type DevelopmentAuditRole,
  isDevelopmentAuditEnabled,
  isDevelopmentAuditRole,
} from "../../lib/development-audit";

const ROLE_OPTIONS: Array<{
  home: string;
  icon: typeof ShieldCheck;
  label: string;
  value: DevelopmentAuditRole;
}> = [
  { home: "/dashboard/management", icon: ShieldCheck, label: "Administrator", value: "admin" },
  { home: "/dashboard/worklist", icon: ClipboardList, label: "Coordinator", value: "coordinator" },
  { home: "/dashboard/provider", icon: Stethoscope, label: "Provider", value: "provider" },
];

export default function DevelopmentAuditBar() {
  const router = useRouter();
  const enabled = isDevelopmentAuditEnabled();
  const [role, setRole] = useState<DevelopmentAuditRole>("admin");

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(() => {
      const storedRole = localStorage.getItem(DEVELOPMENT_AUDIT_ROLE_KEY);
      if (isDevelopmentAuditRole(storedRole)) setRole(storedRole);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [enabled]);

  if (!enabled) return null;

  function assumeRole(nextRole: DevelopmentAuditRole, home: string) {
    localStorage.setItem(DEVELOPMENT_AUDIT_ROLE_KEY, nextRole);
    setRole(nextRole);
    window.dispatchEvent(new CustomEvent(DEVELOPMENT_AUDIT_ROLE_EVENT, { detail: nextRole }));
    router.push(home);
  }

  return (
    <aside className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-950" aria-label="Development audit mode">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <FlaskConical aria-hidden="true" size={15} /> Development / Audit Mode
        </span>
        <span className="text-amber-800">Navigation preview only. Signed-in permissions and MFA remain enforced.</span>
        <div className="ml-auto flex flex-wrap items-center gap-1" aria-label="Preview role">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium ${
                  role === option.value
                    ? "border-amber-600 bg-amber-200"
                    : "border-amber-300 bg-white hover:bg-amber-100"
                }`}
                key={option.value}
                onClick={() => assumeRole(option.value, option.home)}
                type="button"
              >
                <Icon aria-hidden="true" size={14} /> {option.label}
              </button>
            );
          })}
          <Link className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 font-medium hover:bg-amber-100" href="/dev/audit">
            <Settings aria-hidden="true" size={14} /> Audit hub
          </Link>
        </div>
      </div>
    </aside>
  );
}
