import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calendarDateInTimeZone,
  calendarDateToUtcTimestamp,
  timestampToCalendarDate,
  validateNotFutureCalendarDate,
  validateTimeZone,
} from "../lib/ccm/validation.ts";

test("one instant resolves to the correct calendar date across supported offsets", () => {
  const nearMidnight = new Date("2026-01-15T23:30:00.000Z");

  assert.equal(calendarDateInTimeZone(nearMidnight, "UTC"), "2026-01-15");
  assert.equal(calendarDateInTimeZone(nearMidnight, "America/New_York"), "2026-01-15");
  assert.equal(calendarDateInTimeZone(nearMidnight, "America/Los_Angeles"), "2026-01-15");
  assert.equal(calendarDateInTimeZone(nearMidnight, "Europe/Berlin"), "2026-01-16");
  assert.equal(calendarDateInTimeZone(nearMidnight, "Asia/Tokyo"), "2026-01-16");
});

test("today is accepted and tomorrow is rejected in the practice timezone", () => {
  const now = new Date("2026-07-16T02:00:00.000Z");

  assert.doesNotThrow(() =>
    validateNotFutureCalendarDate("2026-07-15", "Review date", "America/Chicago", now),
  );
  assert.throws(
    () => validateNotFutureCalendarDate("2026-07-16", "Review date", "America/Chicago", now),
    /future/i,
  );
  assert.doesNotThrow(() =>
    validateNotFutureCalendarDate("2026-07-16", "Review date", "Asia/Tokyo", now),
  );
});

test("month rollover follows the practice calendar rather than UTC", () => {
  const utcMarch = new Date("2026-03-01T00:30:00.000Z");

  assert.equal(calendarDateInTimeZone(utcMarch, "UTC"), "2026-03-01");
  assert.equal(calendarDateInTimeZone(utcMarch, "America/Los_Angeles"), "2026-02-28");
  assert.equal(calendarDateInTimeZone(utcMarch, "Asia/Tokyo"), "2026-03-01");
});

test("DST transitions retain the correct practice calendar date", () => {
  assert.equal(
    calendarDateInTimeZone(new Date("2026-03-08T06:59:00.000Z"), "America/New_York"),
    "2026-03-08",
  );
  assert.equal(
    calendarDateInTimeZone(new Date("2026-03-08T07:01:00.000Z"), "America/New_York"),
    "2026-03-08",
  );
  assert.equal(
    calendarDateInTimeZone(new Date("2026-11-01T05:30:00.000Z"), "America/New_York"),
    "2026-11-01",
  );
  assert.equal(
    calendarDateInTimeZone(new Date("2026-11-01T06:30:00.000Z"), "America/New_York"),
    "2026-11-01",
  );
});

test("calendar dates serialize without browser or server timezone conversion", () => {
  assert.equal(calendarDateToUtcTimestamp("2026-07-15"), "2026-07-15T00:00:00.000Z");
  assert.equal(timestampToCalendarDate("2026-07-15T00:00:00.000Z"), "2026-07-15");
  assert.equal(calendarDateToUtcTimestamp(null), null);
  assert.throws(() => calendarDateToUtcTimestamp("2026-02-30"), /valid calendar date/i);
});

test("invalid practice timezones are rejected", () => {
  assert.doesNotThrow(() => validateTimeZone("America/Chicago"));
  assert.throws(() => validateTimeZone("UTC-5"), /IANA timezone/i);
});

test("care-plan client and API use the calendar-date contract", async () => {
  const page = await readFile(
    new URL("../app/patients/[patientId]/care-plan/page.tsx", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/api/care-plans/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(page, /lastReviewedDate:\s*lastReviewedDate \|\| null/);
  assert.doesNotMatch(page, /T12:00:00|lastReviewedAt:/);
  assert.match(route, /validateNotFutureCalendarDate/);
  assert.match(route, /practice\.default_timezone/);
  assert.match(route, /calendarDateToUtcTimestamp/);
  assert.doesNotMatch(route, /validateNotFutureTimestamp/);
});
