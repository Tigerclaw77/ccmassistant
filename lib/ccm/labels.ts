const REASON_LABELS: Record<string, string> = {
  incomplete_care_plan: "Care plan needs goals, interventions, and review date",
  ineligible_enrollment: "Enrollment is not eligible",
  insufficient_minutes: "Not enough CCM minutes logged",
  manual_hold: "Manually placed on hold",
  missing_care_plan: "Active care plan is missing",
  missing_checkin: "Monthly check-in is missing",
  missing_checkin_response: "Check-in response or closure is missing",
  missing_condition: "Chronic condition is missing",
  missing_consent: "Consent has not been obtained",
  missing_consent_date: "Consent date is missing",
  missing_enrollment: "Active CCM enrollment is missing",
  missing_provider: "Provider is not assigned",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  billed: "Billed",
  closed: "Closed",
  draft: "Draft",
  eligible: "Eligible",
  hold: "On hold",
  ineligible: "Ineligible",
  needs_review: "Needs review",
  no_response: "No response",
  not_collected: "Not collected",
  not_ready: "Not ready",
  obtained: "Obtained",
  pending: "Pending",
  ready: "Ready",
  ready_to_bill: "Ready to bill",
  responded: "Responded",
  sent: "Sent",
};

export function reasonLabel(code: string): string {
  return REASON_LABELS[code] ?? humanize(code);
}

export function statusLabel(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return STATUS_LABELS[value] ?? humanize(value);
}

export function humanize(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
