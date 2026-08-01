import type { AccessRole, PracticeRole } from "./ccm/types.ts";

export const ASSIGNABLE_OPERATIONAL_ROLES = [
  "practice_administrator",
  "compliance_administrator",
  "billing_administrator",
  "provider",
  "clinical_staff",
  "coordinator",
  "front_desk",
  "read_only",
] as const satisfies readonly AccessRole[];

export type AssignableOperationalRole = (typeof ASSIGNABLE_OPERATIONAL_ROLES)[number];

export const OPERATIONAL_ROLE_LABELS: Record<AssignableOperationalRole | "organization_owner", string> = {
  organization_owner: "Founder / Organization Owner",
  practice_administrator: "Practice Administrator",
  compliance_administrator: "Compliance Administrator",
  billing_administrator: "Billing Administrator",
  provider: "Provider",
  clinical_staff: "Clinical Staff",
  coordinator: "Coordinator",
  front_desk: "Front Desk",
  read_only: "Read Only",
};

export const LEGACY_ROLE_TO_ACCESS_ROLE: Record<PracticeRole, AssignableOperationalRole> = {
  owner: "practice_administrator",
  admin: "practice_administrator",
  provider: "provider",
  coordinator: "coordinator",
  billing_staff: "billing_administrator",
};

export const ACCESS_ROLE_TO_LEGACY_ROLE: Record<AssignableOperationalRole, PracticeRole> = {
  practice_administrator: "admin",
  compliance_administrator: "billing_staff",
  billing_administrator: "billing_staff",
  provider: "provider",
  clinical_staff: "coordinator",
  coordinator: "coordinator",
  front_desk: "billing_staff",
  read_only: "billing_staff",
};

export function isAssignableOperationalRole(value: unknown): value is AssignableOperationalRole {
  return typeof value === "string" && ASSIGNABLE_OPERATIONAL_ROLES.includes(value as AssignableOperationalRole);
}

export function hasAnyAccessRole(actual: readonly AccessRole[], allowed: readonly AccessRole[]): boolean {
  return actual.some((role) => allowed.includes(role));
}
