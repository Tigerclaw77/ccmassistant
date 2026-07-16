type CheckinLike = {
  metadata?: unknown;
  status?: string | null;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function hasMeaningfulCheckinResponse(
  responses: Array<{ response_text?: string | null }>,
): boolean {
  return responses.some(
    (response) => typeof response.response_text === "string" && response.response_text.trim().length > 0,
  );
}

export function hasDocumentedStaffClosure(checkIn: CheckinLike | null | undefined): boolean {
  if (checkIn?.status !== "closed") return false;
  const metadata = objectValue(checkIn.metadata);
  return (
    metadata.closure_type === "staff_documented_non_response" &&
    typeof metadata.followup_note === "string" &&
    metadata.followup_note.trim().length >= 8 &&
    typeof metadata.closed_by === "string" &&
    metadata.closed_by.length > 0
  );
}

export function isCheckinComplete(
  checkIn: CheckinLike | null | undefined,
  responses: Array<{ response_text?: string | null }>,
): boolean {
  if (!checkIn || (checkIn.status !== "responded" && checkIn.status !== "closed")) return false;
  return hasMeaningfulCheckinResponse(responses) || hasDocumentedStaffClosure(checkIn);
}
