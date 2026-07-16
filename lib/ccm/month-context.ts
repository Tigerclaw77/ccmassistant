const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const CANONICAL_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-01$/;

export function currentMonthValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeBillingMonth(value: string | null | undefined): string {
  const input = value?.trim() ?? "";
  if (MONTH_PATTERN.test(input)) return `${input}-01`;
  if (CANONICAL_MONTH_PATTERN.test(input)) return input;
  throw new Error("Billing month must use YYYY-MM");
}

export function monthInputValue(value: string): string {
  return normalizeBillingMonth(value).slice(0, 7);
}

export function billingMonthFromOccurredDate(value: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])-([0-2]\d|3[01])/.exec(value);
  if (!match) throw new Error("Occurred date is invalid");
  return `${match[1]}-${match[2]}-01`;
}

export type CoordinatorContext = {
  month: string;
  page?: number;
  readiness?: string;
  search?: string;
  assignment?: string;
  source?: "billing" | "worklist";
};

export function contextSearchParams(context: CoordinatorContext): URLSearchParams {
  const params = new URLSearchParams({ month: monthInputValue(context.month) });
  if (context.page && context.page > 1) params.set("page", String(context.page));
  if (context.readiness) params.set("readiness", context.readiness);
  if (context.search) params.set("search", context.search);
  if (context.assignment) params.set("assignment", context.assignment);
  if (context.source) params.set("source", context.source);
  return params;
}

export function withCoordinatorContext(path: string, context: CoordinatorContext): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${contextSearchParams(context).toString()}`;
}
