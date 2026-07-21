"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  calendarDateValue,
  parseCalendarDateValue,
  resolveCalendarInitialView,
  type CalendarDefaultStrategy,
} from "../../lib/calendar-defaults";

type Props = {
  describedBy?: string;
  id: string;
  initialView: CalendarDefaultStrategy;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);
}

function addMonthsClamped(date: Date, amount: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay), 12);
}

function compareDate(left: Date, right: Date): number {
  return calendarDateValue(left).localeCompare(calendarDateValue(right));
}

export default function ContextualDateInput({
  describedBy,
  id,
  initialView,
  max,
  min,
  onChange,
  required,
  value,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerId = `${id}-calendar`;
  const [defaultView] = useState(() => resolveCalendarInitialView(initialView));
  const selectedDate = parseCalendarDateValue(value);
  const maximumDate = parseCalendarDateValue(max);
  const minimumDate = parseCalendarDateValue(min);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthStart(selectedDate ?? defaultView));
  const [activeDate, setActiveDate] = useState(() => selectedDate ?? defaultView);

  const maximumYear = maximumDate?.getFullYear() ?? new Date().getFullYear();
  const minimumYear = minimumDate?.getFullYear() ?? maximumYear - 130;
  const years = Array.from(
    { length: maximumYear - minimumYear + 1 },
    (_, index) => maximumYear - index,
  );
  const days = (() => {
    const firstWeekday = viewMonth.getDay();
    const count = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: count }, (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1, 12)),
    ];
  })();

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector<HTMLButtonElement>(`[data-calendar-date="${calendarDateValue(activeDate)}"]`)
        ?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [activeDate, open, viewMonth]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function isUnavailable(date: Date): boolean {
    return Boolean(
      (maximumDate && compareDate(date, maximumDate) > 0) ||
      (minimumDate && compareDate(date, minimumDate) < 0),
    );
  }

  function openCalendar() {
    const start = selectedDate ?? defaultView;
    setActiveDate(start);
    setViewMonth(monthStart(start));
    setOpen(true);
  }

  function moveActiveDate(date: Date) {
    if (isUnavailable(date)) return;
    setActiveDate(date);
    setViewMonth(monthStart(date));
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const movements: Partial<Record<string, number>> = {
      ArrowDown: 7,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
    };
    const amount = movements[event.key];
    if (amount !== undefined) {
      event.preventDefault();
      moveActiveDate(addDays(date, amount));
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const offset = event.key === "Home" ? -date.getDay() : 6 - date.getDay();
      moveActiveDate(addDays(date, offset));
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const monthOffset = event.key === "PageUp" ? -1 : 1;
      moveActiveDate(addMonthsClamped(date, monthOffset));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      inputRef.current?.focus();
    }
  }

  function changeMonth(month: number) {
    const next = new Date(viewMonth.getFullYear(), month, 1, 12);
    setViewMonth(next);
    setActiveDate(next);
  }

  function changeYear(year: number) {
    const next = new Date(year, viewMonth.getMonth(), 1, 12);
    setViewMonth(next);
    setActiveDate(next);
  }

  const previousMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1, 12);
  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1, 12);
  const previousDisabled = Boolean(minimumDate && compareDate(new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 12), minimumDate) < 0);
  const nextDisabled = Boolean(maximumDate && compareDate(nextMonth, maximumDate) > 0);

  return (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto]">
        <input
          aria-describedby={describedBy}
          className="contextual-date-input w-full rounded-l-md border border-r-0 px-3 py-2"
          id={id}
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          ref={inputRef}
          required={required}
          type="date"
          value={value}
        />
        <button
          aria-controls={pickerId}
          aria-expanded={open}
          aria-label="Choose date from calendar"
          className="inline-flex min-h-10 min-w-11 items-center justify-center rounded-r-md border bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => open ? setOpen(false) : openCalendar()}
          type="button"
        >
          <CalendarDays aria-hidden="true" size={18} />
        </button>
      </div>

      {open ? (
        <div aria-label="Choose date" className="absolute left-0 z-30 mt-2 w-[20rem] rounded-md border bg-white p-3 shadow-xl" id={pickerId} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); inputRef.current?.focus(); } }} role="dialog">
          <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
            <button aria-label="Previous month" className="rounded border p-2 disabled:opacity-40" disabled={previousDisabled} onClick={() => changeMonth(viewMonth.getMonth() - 1)} type="button"><ChevronLeft aria-hidden="true" size={16} /></button>
            <select aria-label="Calendar month" className="rounded border px-2 py-2 text-sm" onChange={(event) => changeMonth(Number(event.target.value))} value={viewMonth.getMonth()}>
              {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <select aria-label="Calendar year" className="rounded border px-2 py-2 text-sm" onChange={(event) => changeYear(Number(event.target.value))} value={viewMonth.getFullYear()}>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <button aria-label="Next month" className="rounded border p-2 disabled:opacity-40" disabled={nextDisabled} onClick={() => changeMonth(viewMonth.getMonth() + 1)} type="button"><ChevronRight aria-hidden="true" size={16} /></button>
          </div>
          <div aria-hidden="true" className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
            {WEEKDAYS.map((weekday) => <span className="py-1" key={weekday}>{weekday}</span>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date, index) => date ? (
              <button
                aria-label={date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                aria-pressed={calendarDateValue(date) === value}
                className={`m-0.5 rounded p-2 text-sm disabled:text-slate-300 ${calendarDateValue(date) === value ? "bg-teal-700 text-white" : "hover:bg-teal-50"}`}
                data-calendar-date={calendarDateValue(date)}
                disabled={isUnavailable(date)}
                key={calendarDateValue(date)}
                onClick={() => { onChange(calendarDateValue(date)); setOpen(false); inputRef.current?.focus(); }}
                onKeyDown={(event) => handleDayKeyDown(event, date)}
                tabIndex={calendarDateValue(date) === calendarDateValue(activeDate) ? 0 : -1}
                type="button"
              >
                {date.getDate()}
              </button>
            ) : <span aria-hidden="true" key={`empty-${index}`} />)}
          </div>
          <p className="mt-2 text-xs text-slate-500">Use arrow keys to move between dates. You can also type a date directly.</p>
        </div>
      ) : null}
    </div>
  );
}
