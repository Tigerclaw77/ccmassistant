import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessRole, Practice, PracticeMember, PracticeRole, UUID } from "./ccm/types";
import { LEGACY_ROLE_TO_ACCESS_ROLE, hasAnyAccessRole } from "./access-roles.ts";
import type { Database } from "./supabase/database.types";
import {
  applyDevelopmentPersonaMembership,
  developmentPersonaById,
  type DevelopmentPersonaContext,
} from "./development-persona.ts";

export class PracticeAuthorizationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PracticeAuthorizationError";
    this.status = status;
  }
}

export type PracticeAuthorization =
  | {
      membership: null;
      practice: null;
      practiceId: null;
      developmentPersona: null;
      accessRoles: [];
      state: "bootstrap";
    }
  | {
      membership: PracticeMember & { status: "active"; user_id: UUID };
      actualMembership: PracticeMember & { status: "active"; user_id: UUID };
      developmentPersona: DevelopmentPersonaContext | null;
      accessRoles: AccessRole[];
      practice: Practice;
      practiceId: UUID;
      state: "member";
    };

type AuthorizationPayload = {
  membership?: PracticeMember;
  practice?: Practice;
  state?: string;
};

export function hasAuthorizedPracticeRole(
  membership: Pick<PracticeMember, "role">,
  allowedRoles: readonly PracticeRole[],
): boolean {
  return allowedRoles.includes(membership.role);
}

function personaAccessRoles(context: DevelopmentPersonaContext | null): AccessRole[] | null {
  if (!context) return null;
  const persona = developmentPersonaById(context.personaId);
  if (persona.role === "developer") return ["organization_owner", "practice_administrator"];
  return [persona.role];
}

export async function resolvePracticeAuthorization(
  supabase: SupabaseClient<Database>,
  requestedPracticeId?: UUID | null,
  developmentPersona: DevelopmentPersonaContext | null = null,
): Promise<PracticeAuthorization> {
  const { data, error } = await supabase.rpc("resolve_practice_access", {
    requested_practice_id: requestedPracticeId ?? null,
  });

  if (error) {
    throw new PracticeAuthorizationError(
      error.code === "42501" ? 403 : 500,
      error.code === "42501" ? error.message : "Unable to resolve practice membership",
    );
  }

  const payload = data as AuthorizationPayload | null;
  if (payload?.state === "bootstrap") {
    return {
      membership: null,
      practice: null,
      practiceId: null,
      developmentPersona: null,
      accessRoles: [],
      state: "bootstrap",
    };
  }

  if (
    payload?.state !== "member" ||
    !payload.membership?.id ||
    !payload.membership.practice_id ||
    !payload.membership.user_id ||
    payload.membership.status !== "active" ||
    !payload.practice?.id ||
    payload.practice.id !== payload.membership.practice_id
  ) {
    throw new PracticeAuthorizationError(500, "Practice access response is invalid");
  }

  const actualMembership = payload.membership as PracticeMember & { status: "active"; user_id: UUID };
  const effectivePersona =
    !developmentPersona?.practiceId || developmentPersona.practiceId === actualMembership.practice_id
      ? developmentPersona
      : null;

  const { data: assignments, error: assignmentError } = await supabase
    .from("practice_member_role_assignments")
    .select("role")
    .eq("practice_id", actualMembership.practice_id)
    .eq("member_id", actualMembership.id)
    .eq("status", "active")
    .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);
  if (assignmentError) {
    throw new PracticeAuthorizationError(500, "Unable to resolve operational roles");
  }
  let accessRoles = (assignments ?? []).map((assignment) => assignment.role as AccessRole);
  if (!accessRoles.length) accessRoles = [LEGACY_ROLE_TO_ACCESS_ROLE[actualMembership.role]];
  if (actualMembership.role === "owner") {
    const { data: organizationOwner, error: ownerError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", payload.practice.organization_id)
      .eq("user_id", actualMembership.user_id)
      .eq("role", "organization_owner")
      .eq("status", "active")
      .maybeSingle();
    if (ownerError) throw new PracticeAuthorizationError(500, "Unable to resolve organization ownership");
    if (organizationOwner) accessRoles.unshift("organization_owner");
  }
  accessRoles = personaAccessRoles(effectivePersona) ?? [...new Set(accessRoles)];

  return {
    actualMembership,
    accessRoles,
    developmentPersona: effectivePersona,
    membership: applyDevelopmentPersonaMembership(actualMembership, effectivePersona),
    practice: payload.practice,
    practiceId: payload.membership.practice_id,
    state: "member",
  };
}

export async function requirePracticeAuthorization(
  supabase: SupabaseClient<Database>,
  practiceId: UUID,
  allowedRoles?: readonly PracticeRole[],
  developmentPersona: DevelopmentPersonaContext | null = null,
): Promise<Extract<PracticeAuthorization, { state: "member" }>> {
  const authorization = await resolvePracticeAuthorization(supabase, practiceId, developmentPersona);

  if (authorization.state !== "member") {
    throw new PracticeAuthorizationError(404, "No active practice found");
  }

  if (allowedRoles) {
    const translated = allowedRoles.flatMap((role): AccessRole[] => {
      if (role === "owner" || role === "admin") return ["organization_owner", "practice_administrator"];
      if (role === "provider") return ["provider"];
      if (role === "coordinator") return ["coordinator", "clinical_staff"];
      return ["billing_administrator"];
    });
    if (!hasAnyAccessRole(authorization.accessRoles, translated)) {
      throw new PracticeAuthorizationError(403, "Practice role is not permitted for this action");
    }
  }

  return authorization;
}

export function hasAuthorizedAccessRole(
  authorization: Extract<PracticeAuthorization, { state: "member" }>,
  allowedRoles: readonly AccessRole[],
): boolean {
  return hasAnyAccessRole(authorization.accessRoles, allowedRoles);
}
