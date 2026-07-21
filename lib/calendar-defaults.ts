export const MEDICARE_CONTEXT_AGE = 65;
export const PEDIATRIC_CONTEXT_AGE = 8;

export type CalendarDefaultStrategy =
  | { kind: "today" }
  | { kind: "currentMonth" }
  | { kind: "currentYear" }
  | { ageYears?: number; kind: "medicareAge" }
  | { ageYears?: number; kind: "pediatric" }
  | { kind: "custom"; resolve: (today: Date) => Date };

export const MEDICARE_AGE_CALENDAR_DEFAULT = {
  kind: "medicareAge",
} as const satisfies CalendarDefaultStrategy;

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12);
}

export function resolveCalendarInitialView(
  strategy: CalendarDefaultStrategy,
  now = new Date(),
): Date {
  const today = localDate(now.getFullYear(), now.getMonth(), now.getDate());

  switch (strategy.kind) {
    case "today":
      return today;
    case "currentMonth":
      return localDate(today.getFullYear(), today.getMonth(), 1);
    case "currentYear":
      return localDate(today.getFullYear(), 0, 1);
    case "medicareAge":
      return localDate(
        today.getFullYear() - (strategy.ageYears ?? MEDICARE_CONTEXT_AGE),
        0,
        1,
      );
    case "pediatric":
      return localDate(
        today.getFullYear() - (strategy.ageYears ?? PEDIATRIC_CONTEXT_AGE),
        0,
        1,
      );
    case "custom": {
      const resolved = strategy.resolve(new Date(today));
      if (Number.isNaN(resolved.getTime())) {
        throw new Error("Custom calendar default must return a valid date");
      }
      return localDate(resolved.getFullYear(), resolved.getMonth(), resolved.getDate());
    }
  }
}

export function calendarDateValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseCalendarDateValue(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const date = localDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return calendarDateValue(date) === value ? date : null;
}
