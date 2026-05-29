import { AuthError, type AuthContext, type PracticeMembership } from "./auth";
import type { Practice, UUID } from "./ccm/types";

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
  let membershipQuery = context.supabase
    .from("practice_members")
    .select("id, practice_id, role, status, user_id")
    .eq("user_id", context.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (requestedPracticeId) {
    membershipQuery = membershipQuery.eq("practice_id", requestedPracticeId);
  }

  const { data: memberships, error: membershipError } = await membershipQuery;

  if (membershipError) {
    throw new AuthError(403, "Unable to resolve practice membership");
  }

  const row = memberships?.[0];

  if (!row?.user_id) {
    return {
      ...context,
      membership: null,
      practice: null,
      practiceId: null,
    };
  }

  const membership: PracticeMembership = {
    id: row.id,
    practice_id: row.practice_id,
    role: row.role,
    status: "active",
    user_id: row.user_id,
  };

  const { data: practice, error: practiceError } = await context.supabase
    .from("practices")
    .select("*")
    .eq("id", membership.practice_id)
    .single();

  if (practiceError || !practice) {
    throw new AuthError(403, "Unable to load active practice");
  }

  return {
    ...context,
    membership,
    practice,
    practiceId: membership.practice_id,
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

