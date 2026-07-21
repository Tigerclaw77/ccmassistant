import {
  AuthError,
  type AuthContext,
  type PracticeMembership,
} from "./auth";
import type { Practice, UUID } from "./ccm/types";
import { resolvePracticeAuthorization } from "./practice-authorization";

export const ACTIVE_PRACTICE_HEADER = "x-active-practice-id";

export type ActivePracticeContext = AuthContext & {
  membership: PracticeMembership;
  practice: Practice;
  practiceId: UUID;
};

export type OptionalPracticeContext = AuthContext & {
  membership: PracticeMembership | null;
  practice: Practice | null;
  practiceId: UUID | null;
};

export async function resolveActivePractice(
  context: AuthContext,
  requestedPracticeId?: UUID | null,
): Promise<OptionalPracticeContext> {
  const authorization = await resolvePracticeAuthorization(
    context.supabase,
    requestedPracticeId,
    context.developmentPersona,
  );

  if (authorization.state === "bootstrap") {
    return {
      ...context,
      membership: null,
      practice: null,
      practiceId: null,
    };
  }

  return {
    ...context,
    membership: authorization.membership,
    practice: authorization.practice,
    practiceId: authorization.practiceId,
  };
}

export async function requireActivePractice(
  context: AuthContext,
  requestedPracticeId?: UUID | null,
): Promise<ActivePracticeContext> {
  const active = await resolveActivePractice(context, requestedPracticeId);

  if (!active.practice || !active.membership || !active.practiceId) {
    throw new AuthError(404, "No active practice found");
  }

  return {
    ...context,
    membership: active.membership,
    practice: active.practice,
    practiceId: active.practiceId,
  };
}
