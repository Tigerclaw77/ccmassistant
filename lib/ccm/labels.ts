const REASON_LABELS: Record<string, string> = {
  incomplete_care_plan: "Care plan needs goals, interventions, and review date",
  ineligible_enrollment: "Enrollment is not eligible",
  incomplete_practice_attestation: "Practice setup attestations are incomplete",
  insufficient_chronic_conditions: "Two qualifying chronic conditions are required",
  insufficient_minutes: "Not enough CCM minutes logged",
  manual_hold: "Manually placed on hold",
  missing_care_plan: "Active care plan is missing",
  missing_checkin: "Monthly check-in is missing",
  missing_checkin_response: "Check-in response or closure is missing",
  missing_condition: "Chronic condition is missing",
  missing_consent: "Consent has not been obtained",
  missing_consent_date: "Consent date is missing",
  missing_consent_elements: "Required consent elements are incomplete",
  missing_consent_method: "Consent method is missing",
  missing_enrollment: "Active CCM enrollment is missing",
  missing_eligibility_facts: "Structured eligibility facts are incomplete",
  missing_provider: "Billing practitioner is not assigned",
  missing_provider_attestation: "Billing practitioner eligibility attestation is incomplete",
  missing_reviewed_intake: "Reviewed AI intake summary is missing",
  provider_manual_review_required: "Billing practitioner type requires manual review",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  billed: "Billed",
  closed: "Closed",
  draft: "Draft",
  eligible: "Eligible",
  hold: "On Hold",
  ineligible: "Ineligible",
  needs_review: "Needs Review",
  no_response: "No Response",
  not_required: "Not Required",
  not_collected: "Missing",
  not_ready: "Blocked",
  obtained: "Complete",
  pending: "Pending",
  ready: "Ready",
  ready_to_bill: "Ready for Billing",
  responded: "Complete",
  reviewed: "Reviewed",
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
