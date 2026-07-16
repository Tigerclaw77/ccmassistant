export class StripeBillingScopeError extends Error {
  status = 403;

  constructor() {
    super("Cross-practice billing access is forbidden");
    this.name = "StripeBillingScopeError";
  }
}
export function assertPracticeBillingScope(
  authorizedPracticeId: string,
  requestedPracticeId: string,
): void {
  if (authorizedPracticeId !== requestedPracticeId) {
    throw new StripeBillingScopeError();
  }
}
