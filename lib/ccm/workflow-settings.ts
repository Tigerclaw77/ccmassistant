import {
  DEFAULT_OPPORTUNITY_EXPIRATION_DAYS,
  OPPORTUNITY_TYPES,
  type OpportunityType,
} from "./opportunity-detector.ts";
import type { JsonValue } from "./types.ts";

export const DEFAULT_MONTH_END_AWARENESS_DAY = 25;

export type ClinicalWorkflowSettings = {
  allowCoordinatorClaiming: boolean;
  expirationDays: Record<OpportunityType, number>;
  monthEndAwarenessDay: number;
};

function jsonObject(value: JsonValue | null | undefined): Record<string, JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function expirationOverridesFromJson(value: JsonValue | null | undefined): Partial<Record<OpportunityType, number>> {
  const object = jsonObject(value);
  const result: Partial<Record<OpportunityType, number>> = {};
  for (const type of OPPORTUNITY_TYPES) {
    const days = object[type];
    if (typeof days === "number" && Number.isInteger(days) && days >= 1 && days <= 90) result[type] = days;
  }
  return result;
}

export function validateExpirationOverrides(value: unknown): Partial<Record<OpportunityType, number>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expiration overrides must be an object");
  const input = value as Record<string, unknown>;
  const unsupported = Object.keys(input).filter((key) => !OPPORTUNITY_TYPES.includes(key as OpportunityType));
  if (unsupported.length) throw new Error(`Unsupported suggestion type: ${unsupported[0]}`);
  const result: Partial<Record<OpportunityType, number>> = {};
  for (const type of OPPORTUNITY_TYPES) {
    if (!(type in input)) continue;
    const days = Number(input[type]);
    if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error(`${type} expiration must be a whole number from 1 to 90 days`);
    result[type] = days;
  }
  return result;
}

export function clinicalWorkflowSettings(input: {
  allow_coordinator_claiming?: boolean;
  ccm_month_end_awareness_day?: number;
  opportunity_expiration_overrides?: JsonValue;
}): ClinicalWorkflowSettings {
  const overrides = expirationOverridesFromJson(input.opportunity_expiration_overrides);
  return {
    allowCoordinatorClaiming: input.allow_coordinator_claiming === true,
    expirationDays: { ...DEFAULT_OPPORTUNITY_EXPIRATION_DAYS, ...overrides },
    monthEndAwarenessDay: Number.isInteger(input.ccm_month_end_awareness_day) && Number(input.ccm_month_end_awareness_day) >= 1 && Number(input.ccm_month_end_awareness_day) <= 28
      ? Number(input.ccm_month_end_awareness_day)
      : DEFAULT_MONTH_END_AWARENESS_DAY,
  };
}

export function practiceDateParts(timeZone: string, date = new Date()): { day: number; month: number; year: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    day: "2-digit", month: "2-digit", timeZone, year: "numeric",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { day: Number(parts.day), month: Number(parts.month), year: Number(parts.year) };
}

export function careCycleDaysRemaining(billingMonth: string, timeZone: string, date = new Date()): number | null {
  const current = practiceDateParts(timeZone, date);
  const [year, month] = billingMonth.slice(0, 7).split("-").map(Number);
  if (current.year !== year || current.month !== month) return null;
  return new Date(Date.UTC(year, month, 0)).getUTCDate() - current.day;
}

export function isMonthEndAwarenessActive(billingMonth: string, timeZone: string, awarenessDay: number, date = new Date()): boolean {
  const current = practiceDateParts(timeZone, date);
  const [year, month] = billingMonth.slice(0, 7).split("-").map(Number);
  return current.year === year && current.month === month && current.day >= awarenessDay;
}
