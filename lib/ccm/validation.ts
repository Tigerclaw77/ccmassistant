const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NPI_PATTERN = /^\d{10}$/;

function validDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
  } catch {
    throw new Error("Timezone must be a valid IANA timezone");
  }
}

export function calendarDateInTimeZone(
  value: Date,
  timeZone: string,
): string {
  validateTimeZone(timeZone);

  if (Number.isNaN(value.valueOf())) {
    throw new Error("Date must be valid");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function calendarDateToUtcTimestamp(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (!validDate(value)) throw new Error("Date must be a valid calendar date");
  return `${value}T00:00:00.000Z`;
}

export function timestampToCalendarDate(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const date = value.slice(0, 10);
  if (!validDate(date)) throw new Error("Timestamp must contain a valid calendar date");
  return date;
}

export function validateNotFutureCalendarDate(
  value: string | null | undefined,
  label: string,
  timeZone: string,
  now = new Date(),
): void {
  if (!value) return;
  if (!validDate(value)) throw new Error(`${label} must be a valid date`);
  if (value > calendarDateInTimeZone(now, timeZone)) {
    throw new Error(`${label} cannot be in the future`);
  }
}

export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function validateNotFutureDate(
  value: string | null | undefined,
  label: string,
  now = new Date(),
): void {
  if (!value) return;
  if (!validDate(value)) throw new Error(`${label} must be a valid date`);
  if (value > todayIsoDate(now)) throw new Error(`${label} cannot be in the future`);
}

export function validateNotFutureTimestamp(
  value: string | null | undefined,
  label: string,
  now = new Date(),
): void {
  if (!value) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${label} must be a valid date and time`);
  if (parsed.valueOf() > now.valueOf() + 5 * 60 * 1000) {
    throw new Error(`${label} cannot be in the future`);
  }
}

export function validateDateOrder(
  start: string | null | undefined,
  end: string | null | undefined,
  startLabel: string,
  endLabel: string,
): void {
  if (start && end && new Date(end).valueOf() < new Date(start).valueOf()) {
    throw new Error(`${endLabel} cannot be before ${startLabel}`);
  }
}

export function validateNpi(value: string | null | undefined): void {
  if (!value) return;
  if (!NPI_PATTERN.test(value)) throw new Error("NPI must contain exactly 10 digits");

  const digits = `80840${value.slice(0, 9)}`.split("").map(Number);
  const sum = digits.reduce((total, digit, index) => {
    const doubled = index % 2 === 1 ? digit * 2 : digit;
    return total + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  if (checkDigit !== Number(value[9])) throw new Error("NPI check digit is invalid");
}

export function firstDayForTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("occurredAt must be a valid date and time");
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function validateBillingMonth(value: string, occurredAt: string): void {
  if (!/^\d{4}-\d{2}-01$/.test(value) || !validDate(value)) {
    throw new Error("billingMonth must be the first day of a valid month");
  }
  if (value !== firstDayForTimestamp(occurredAt)) {
    throw new Error("billingMonth must match the month of occurredAt");
  }
}

export function validateInteraction(minutes: number, notes: string | null | undefined): void {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("minutes must be greater than 0");
  }
  if (minutes > 480) throw new Error("minutes cannot exceed 480 for one interaction");
  if (!notes || notes.trim().length < 8) {
    throw new Error("notes must meaningfully describe the CCM work (at least 8 characters)");
  }
}
