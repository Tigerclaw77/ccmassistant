export const INITIAL_OWNER_ROLE = "owner";

type OwnerClaimUser = {
  app_metadata?: Record<string, unknown>;
};

export type PracticeAccessState = "bootstrap" | "forbidden" | "member";

export function hasInitialOwnerClaim(user: OwnerClaimUser): boolean {
  return user.app_metadata?.onboarding_role === INITIAL_OWNER_ROLE;
}

export function classifyPracticeAccess(args: {
  membershipExists: boolean;
  practiceExists: boolean;
}): PracticeAccessState {
  if (args.membershipExists) return "member";
  return args.practiceExists ? "forbidden" : "bootstrap";
}
