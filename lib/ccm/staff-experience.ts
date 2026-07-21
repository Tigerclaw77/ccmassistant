import type { MonthlyBillability } from "./types.ts";

export const STAFF_QUEUE_KEYS = [
  "urgent",
  "near_threshold",
  "one_more_interaction",
  "blocked",
  "overdue",
  "provider_review",
  "ready_to_bill",
  "billed",
] as const;

export type StaffQueueKey = (typeof STAFF_QUEUE_KEYS)[number];

export type StaffWorklistInput = {
  documentedMinutes: number;
  owner: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  readinessStatus: string;
  reasonCodes: readonly string[];
};

export const STAFF_QUEUE_LABELS: Record<StaffQueueKey, string> = {
  urgent: "Urgent",
  near_threshold: "Within 5 minutes",
  one_more_interaction: "One more interaction",
  blocked: "Blocked",
  overdue: "Contact overdue",
  provider_review: "Provider review",
  ready_to_bill: "Ready to bill",
  billed: "Billed",
};

const PROVIDER_REASONS = new Set([
  "missing_provider_attestation",
  "incomplete_care_plan",
  "provider_manual_review_required",
]);

const CONTACT_REASONS = new Set(["missing_checkin", "missing_checkin_response"]);

export function remainingMinutes(documentedMinutes: number, threshold: number): number {
  return Math.max(0, Math.ceil(threshold - documentedMinutes));
}

export function classifyStaffQueues(
  row: StaffWorklistInput,
  threshold: number,
): StaffQueueKey[] {
  const queues = new Set<StaffQueueKey>();
  const remaining = remainingMinutes(row.documentedMinutes, threshold);
  const nonMinuteBlockers = row.reasonCodes.filter((code) => code !== "insufficient_minutes");

  if (row.priority === "urgent") queues.add("urgent");
  // Threshold proximity is secondary context only; it never creates work by itself.
  if (remaining > 0 && remaining <= 5 && nonMinuteBlockers.length > 0) queues.add("near_threshold");
  if (nonMinuteBlockers.length > 0) queues.add("blocked");
  if (row.reasonCodes.some((code) => CONTACT_REASONS.has(code))) queues.add("overdue");
  if (row.owner === "Provider" || row.reasonCodes.some((code) => PROVIDER_REASONS.has(code))) {
    queues.add("provider_review");
  }
  if (row.readinessStatus === "ready_to_bill") queues.add("ready_to_bill");
  if (row.readinessStatus === "billed") queues.add("billed");

  return STAFF_QUEUE_KEYS.filter((key) => queues.has(key));
}

export type BillingReviewCategory =
  | "ready_to_bill"
  | "ready_after_small_action"
  | "missing_evidence"
  | "missing_minutes"
  | "provider_review_pending"
  | "consent_issue"
  | "eligibility_issue"
  | "billed"
  | "hold";

export const BILLING_REVIEW_LABELS: Record<BillingReviewCategory, string> = {
  ready_to_bill: "Ready to bill",
  ready_after_small_action: "Ready after one small action",
  missing_evidence: "Missing evidence",
  missing_minutes: "Missing minutes",
  provider_review_pending: "Provider review pending",
  consent_issue: "Consent issue",
  eligibility_issue: "Eligibility issue",
  billed: "Billed",
  hold: "On hold",
};

export function billingReviewCategory(
  billability: MonthlyBillability | null,
  threshold: number,
): BillingReviewCategory {
  void threshold; // Retained for the stable presentation API; thresholds never create work.
  if (billability?.status === "billed") return "billed";
  if (billability?.status === "hold") return "hold";
  if (billability?.status === "ready_to_bill") return "ready_to_bill";

  const reasons = billability?.reason_codes ?? [];
  if (reasons.some((code) => code.includes("consent"))) return "consent_issue";
  if (reasons.some((code) => code.includes("eligibility") || code === "missing_condition" || code === "insufficient_chronic_conditions")) {
    return "eligibility_issue";
  }
  if (reasons.some((code) => PROVIDER_REASONS.has(code))) return "provider_review_pending";

  if (reasons.includes("insufficient_minutes")) return "missing_minutes";
  return "missing_evidence";
}

export type SuggestedCptReview = {
  codes: Array<{ code: "99490" | "99439"; units: number }>;
  note: string;
};

export function suggestCptReview(
  billability: MonthlyBillability | null,
): SuggestedCptReview | null {
  if (!billability || !["ready_to_bill", "billed"].includes(billability.status)) return null;
  if (billability.total_minutes < 20) return null;

  const additionalUnits = Math.floor((billability.total_minutes - 20) / 20);
  return {
    codes: [
      { code: "99490", units: 1 },
      ...(additionalUnits > 0
        ? [{ code: "99439" as const, units: additionalUnits }]
        : []),
    ],
    note: "Coding suggestion only. Confirm payer, practitioner, time, consent, care-plan, and documentation requirements before billing.",
  };
}

export function countStaffQueues<T extends StaffWorklistInput>(
  rows: readonly T[],
  threshold: number,
): Record<StaffQueueKey, number> {
  const counts = Object.fromEntries(STAFF_QUEUE_KEYS.map((key) => [key, 0])) as Record<StaffQueueKey, number>;
  for (const row of rows) {
    for (const key of classifyStaffQueues(row, threshold)) counts[key] += 1;
  }
  return counts;
}
