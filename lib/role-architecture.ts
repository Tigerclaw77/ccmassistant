import type { AccessRole, PracticeRole } from "./ccm/types";

export const ROLE_HIERARCHY: Readonly<Record<AccessRole, number>> = {
  organization_owner: 100,
  practice_administrator: 90,
  department_administrator: 80,
  compliance_administrator: 75,
  billing_administrator: 70,
  provider: 60,
  clinical_staff: 50,
  coordinator: 40,
  front_desk: 30,
  read_only: 20,
  patient: 10,
};

export const LEGACY_ROLE_TO_ACCESS_ROLE: Readonly<Record<PracticeRole, AccessRole>> = {
  owner: "practice_administrator",
  admin: "practice_administrator",
  provider: "provider",
  coordinator: "coordinator",
  billing_staff: "billing_administrator",
};

export const ADMINISTRATIVE_ROLES = [
  "organization_owner",
  "practice_administrator",
  "department_administrator",
  "compliance_administrator",
  "billing_administrator",
] as const satisfies readonly AccessRole[];

export function isAdministrativeRole(role: AccessRole): boolean {
  return ADMINISTRATIVE_ROLES.includes(role as (typeof ADMINISTRATIVE_ROLES)[number]);
}

export function outranks(left: AccessRole, right: AccessRole): boolean {
  return ROLE_HIERARCHY[left] > ROLE_HIERARCHY[right];
}
