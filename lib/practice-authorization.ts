import type { SupabaseClient } from "@supabase/supabase-js";
import type { Practice, PracticeMember, PracticeRole, UUID } from "./ccm/types";
import type { Database } from "./supabase/database.types";
import {
  applyDevelopmentPersonaMembership,
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
      state: "bootstrap";
    }
  | {
      membership: PracticeMember & { status: "active"; user_id: UUID };
      actualMembership: PracticeMember & { status: "active"; user_id: UUID };
      developmentPersona: DevelopmentPersonaContext | null;
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

  return {
    actualMembership,
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

  if (allowedRoles && !hasAuthorizedPracticeRole(authorization.membership, allowedRoles)) {
    throw new PracticeAuthorizationError(403, "Practice role is not permitted for this action");
  }

  return authorization;
}
