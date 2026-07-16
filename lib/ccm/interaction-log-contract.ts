import type { ActivityType, InteractionLog } from "./types.ts";
import { ACTIVITY_TYPES } from "./types.ts";
import { billingMonthFromOccurredDate } from "./month-context.ts";
import { timestampToCalendarDate } from "./validation.ts";

export type TimeEntryCreateRequest = {
  activityType: ActivityType;
  minutes: number;
  notes: string;
  occurrenceDate: string;
  patientId: string;
  practiceId: string;
  requestId: string;
};

function requiredFormString(formData: FormData, key: string, label: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}

export function buildTimeEntryCreateRequest(
  formData: FormData,
  context: Pick<TimeEntryCreateRequest, "patientId" | "practiceId" | "requestId">,
): TimeEntryCreateRequest {
  const activityType = requiredFormString(formData, "activityType", "Activity type");
  const minutesValue = requiredFormString(formData, "minutes", "Minutes");
  const minutes = Number(minutesValue);
  const notes = requiredFormString(formData, "notes", "Notes");
  const occurrenceDate = requiredFormString(formData, "occurrenceDate", "Occurrence date");

  if (!ACTIVITY_TYPES.includes(activityType as ActivityType)) {
    throw new Error("Activity type is invalid");
  }
  if (!Number.isFinite(minutes)) throw new Error("Minutes must be a number");

  return {
    ...context,
    activityType: activityType as ActivityType,
    minutes,
    notes,
    occurrenceDate,
  };
}

export function billingMonthForOccurrenceDate(occurrenceDate: string): string {
  return billingMonthFromOccurredDate(occurrenceDate);
}

export function occurrenceDateForDisplay(
  log: Pick<InteractionLog, "occurred_at" | "occurrence_date">,
): string {
  return log.occurrence_date ?? timestampToCalendarDate(log.occurred_at) ?? "";
}
