import type { AccessRole, PracticeMember, PracticeRole, UUID } from "./ccm/types";
import { isDevelopmentAuditEnabled } from "./development-audit.ts";

export const DEVELOPMENT_PERSONA_HEADER = "x-ccm-development-persona";
export const DEVELOPMENT_PERSONA_SESSION_KEY = "ccmDevelopmentPersona";
export const DEVELOPMENT_PERSONA_EVENT = "ccm-development-persona-change";

export const DEVELOPMENT_PERSONA_IDS = [
  "organization-owner",
  "practice-administrator",
  "compliance-administrator",
  "billing-administrator",
  "provider-paul",
  "clinical-staff",
  "coordinator-mary",
  "coordinator-polly",
  "front-desk",
  "read-only",
  "patient",
  "developer",
] as const;

export type DevelopmentPersonaId = (typeof DEVELOPMENT_PERSONA_IDS)[number];
export type DevelopmentPersonaRole = AccessRole | "developer";
export type DevelopmentAuthorizationRole =
  | PracticeRole
  | "clinical_staff"
  | "front_desk"
  | "read_only"
  | "patient";

export type DevelopmentPersonaDefinition = {
  authorizationRole: DevelopmentAuthorizationRole;
  description: string;
  home: string;
  id: DevelopmentPersonaId;
  name: string;
  role: DevelopmentPersonaRole;
  roleLabel: string;
};

export const DEVELOPMENT_PERSONAS: readonly DevelopmentPersonaDefinition[] = [
  {
    authorizationRole: "owner",
    description: "Organization-wide administration, practice governance, and full owner navigation.",
    home: "/dashboard/management",
    id: "organization-owner",
    name: "Dr. Paul",
    role: "organization_owner",
    roleLabel: "Organization Owner",
  },
  {
    authorizationRole: "admin",
    description: "Practice operations, staffing, configuration, and management oversight.",
    home: "/dashboard/management",
    id: "practice-administrator",
    name: "Practice Administrator",
    role: "practice_administrator",
    roleLabel: "Practice Administrator",
  },
  {
    authorizationRole: "admin",
    description: "Read-only workflow evidence, rule versions, dispositions, and immutable history.",
    home: "/dashboard/compliance",
    id: "compliance-administrator",
    name: "Chris",
    role: "compliance_administrator",
    roleLabel: "Compliance Administrator",
  },
  {
    authorizationRole: "billing_staff",
    description: "Monthly billing readiness and supporting evidence review.",
    home: "/dashboard/billing",
    id: "billing-administrator",
    name: "Nancy",
    role: "billing_administrator",
    roleLabel: "Billing Administrator",
  },
  {
    authorizationRole: "provider",
    description: "Provider attention queue, care-plan review, and patient clinical context.",
    home: "/dashboard/provider",
    id: "provider-paul",
    name: "Dr. Paul",
    role: "provider",
    roleLabel: "Provider",
  },
  {
    authorizationRole: "clinical_staff",
    description: "Clinical support work without administrative or billing ownership.",
    home: "/dashboard/worklist",
    id: "clinical-staff",
    name: "Clinical Staff",
    role: "clinical_staff",
    roleLabel: "Clinical Staff",
  },
  {
    authorizationRole: "coordinator",
    description: "Remote coordinator queue, assigned patient work, and documentation continuity.",
    home: "/dashboard/worklist",
    id: "coordinator-mary",
    name: "Mary",
    role: "coordinator",
    roleLabel: "Remote Coordinator",
  },
  {
    authorizationRole: "coordinator",
    description: "Clinic-based coordination, patient follow-up, and shared provider support.",
    home: "/dashboard/worklist",
    id: "coordinator-polly",
    name: "Polly",
    role: "coordinator",
    roleLabel: "Clinic Coordinator",
  },
  {
    authorizationRole: "front_desk",
    description: "Patient registry and administrative intake without clinical permissions.",
    home: "/patients",
    id: "front-desk",
    name: "Front Desk",
    role: "front_desk",
    roleLabel: "Front Desk",
  },
  {
    authorizationRole: "read_only",
    description: "Read-only navigation with no simulated write-capable practice role.",
    home: "/patients",
    id: "read-only",
    name: "Read Only",
    role: "read_only",
    roleLabel: "Read Only",
  },
  {
    authorizationRole: "patient",
    description: "Patient-centered context for the selected patient; portal authorization remains separate.",
    home: "/dev/personas",
    id: "patient",
    name: "Patient",
    role: "patient",
    roleLabel: "Patient",
  },
  {
    authorizationRole: "owner",
    description: "Full development visibility while the real authenticated session remains intact.",
    home: "/dashboard/worklist",
    id: "developer",
    name: "Developer",
    role: "developer",
    roleLabel: "Developer (full visibility)",
  },
] as const;

export type DevelopmentPersonaContext = {
  coordinatorMemberId?: UUID;
  organizationId?: UUID;
  originalPracticeId?: UUID;
  patientId?: UUID;
  personaId: DevelopmentPersonaId;
  practiceId?: UUID;
  providerId?: UUID;
};

type DevelopmentPersonaEnvironment = {
  flag?: string;
  nodeEnv?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDevelopmentPersonaEnabled(
  environment: DevelopmentPersonaEnvironment = {
    flag: process.env.NEXT_PUBLIC_CCM_AUDIT_MODE,
    nodeEnv: process.env.NODE_ENV,
  },
): boolean {
  return isDevelopmentAuditEnabled(environment);
}

export function isDevelopmentPersonaId(value: unknown): value is DevelopmentPersonaId {
  return typeof value === "string" && DEVELOPMENT_PERSONA_IDS.includes(value as DevelopmentPersonaId);
}

export function developmentPersonaById(id: DevelopmentPersonaId): DevelopmentPersonaDefinition {
  return DEVELOPMENT_PERSONAS.find((persona) => persona.id === id)!;
}

function optionalUuid(value: unknown): UUID | undefined {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : undefined;
}

export function sanitizeDevelopmentPersonaContext(value: unknown): DevelopmentPersonaContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (!isDevelopmentPersonaId(candidate.personaId)) return null;

  return {
    personaId: candidate.personaId,
    ...(optionalUuid(candidate.practiceId) ? { practiceId: optionalUuid(candidate.practiceId) } : {}),
    ...(optionalUuid(candidate.originalPracticeId) ? { originalPracticeId: optionalUuid(candidate.originalPracticeId) } : {}),
    ...(optionalUuid(candidate.organizationId) ? { organizationId: optionalUuid(candidate.organizationId) } : {}),
    ...(optionalUuid(candidate.providerId) ? { providerId: optionalUuid(candidate.providerId) } : {}),
    ...(optionalUuid(candidate.coordinatorMemberId) ? { coordinatorMemberId: optionalUuid(candidate.coordinatorMemberId) } : {}),
    ...(optionalUuid(candidate.patientId) ? { patientId: optionalUuid(candidate.patientId) } : {}),
  };
}

export function serializeDevelopmentPersonaContext(context: DevelopmentPersonaContext): string {
  const sanitized = sanitizeDevelopmentPersonaContext(context);
  if (!sanitized) throw new Error("Development persona context is invalid");
  return encodeURIComponent(JSON.stringify(sanitized));
}

export function parseDevelopmentPersonaHeader(
  value: string | null | undefined,
  environment?: DevelopmentPersonaEnvironment,
): DevelopmentPersonaContext | null {
  if (!isDevelopmentPersonaEnabled(environment) || !value) return null;
  try {
    return sanitizeDevelopmentPersonaContext(JSON.parse(decodeURIComponent(value)));
  } catch {
    return null;
  }
}

export function applyDevelopmentPersonaMembership(
  membership: PracticeMember & { status: "active"; user_id: UUID },
  context: DevelopmentPersonaContext | null,
): PracticeMember & { status: "active"; user_id: UUID } {
  if (!context || (context.practiceId && context.practiceId !== membership.practice_id)) return membership;
  const persona = developmentPersonaById(context.personaId);
  return { ...membership, role: persona.authorizationRole as PracticeRole };
}

export function developmentPersonaPatientHref(
  personaId: DevelopmentPersonaId,
  patientId?: UUID,
): string {
  if (!patientId) return developmentPersonaById(personaId).home;
  if (personaId === "provider-paul") return `/patients/${patientId}/care-plan`;
  if (personaId === "billing-administrator") return `/dashboard/billing/${patientId}/${new Date().toISOString().slice(0, 7)}`;
  if (personaId === "compliance-administrator") return `/dashboard/compliance?patientId=${encodeURIComponent(patientId)}`;
  return `/patients/${patientId}`;
}
