import type { PracticeRole } from "./ccm/types";

export const DEVELOPMENT_AUDIT_FLAG = "NEXT_PUBLIC_CCM_AUDIT_MODE";
export const DEVELOPMENT_AUDIT_ROLE_KEY = "ccmDevelopmentAuditRole";
export const DEVELOPMENT_AUDIT_ROLE_EVENT = "ccm-development-audit-role";

export const DEVELOPMENT_AUDIT_ROLES = ["admin", "coordinator", "provider"] as const;

export type DevelopmentAuditRole = (typeof DEVELOPMENT_AUDIT_ROLES)[number];

type DevelopmentAuditEnvironment = {
  flag?: string;
  nodeEnv?: string;
};

export function isDevelopmentAuditEnabled(
  environment: DevelopmentAuditEnvironment = {
    flag: process.env.NEXT_PUBLIC_CCM_AUDIT_MODE,
    nodeEnv: process.env.NODE_ENV,
  },
): boolean {
  return environment.nodeEnv === "development" && environment.flag === "true";
}

export function isDevelopmentAuditRole(value: unknown): value is DevelopmentAuditRole {
  return typeof value === "string" && DEVELOPMENT_AUDIT_ROLES.includes(value as DevelopmentAuditRole);
}

export function auditNavigationRole(
  actualRole: PracticeRole | null,
  auditRole: DevelopmentAuditRole | null,
  enabled = isDevelopmentAuditEnabled(),
): PracticeRole | null {
  return enabled && auditRole ? auditRole : actualRole;
}

export function patientAuditUrl(value: string, currentOrigin: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, currentOrigin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!/^\/f\/[^/]+\/?$/.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
