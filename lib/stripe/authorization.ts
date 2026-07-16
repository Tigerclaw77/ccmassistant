import type { PracticeAuthContext } from "../auth";
import { PRACTICE_ADMIN_ROLES, requirePracticeMembership } from "../auth";
import { PracticeAuthorizationError } from "../practice-authorization";
import type { UUID } from "../ccm/types";
import { assertPracticeBillingScope, StripeBillingScopeError } from "./scope";

type PracticeAuthorizer = typeof requirePracticeMembership;

export async function requirePracticeBillingAdmin(
  request: Request,
  practiceId: UUID,
  authorize: PracticeAuthorizer = requirePracticeMembership,
): Promise<PracticeAuthContext> {
  const context = await authorize(request, practiceId, PRACTICE_ADMIN_ROLES);
  try {
    assertPracticeBillingScope(context.practiceId, practiceId);
  } catch (error) {
    if (error instanceof StripeBillingScopeError) {
      throw new PracticeAuthorizationError(error.status, error.message);
    }
    throw error;
  }
  return context;
}
