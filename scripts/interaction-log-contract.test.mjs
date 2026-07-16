import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  billingMonthForOccurrenceDate,
  buildTimeEntryCreateRequest,
  occurrenceDateForDisplay,
} from "../lib/ccm/interaction-log-contract.ts";
import {
  calendarDateInTimeZone,
  validateInteraction,
  validateNotFutureCalendarDate,
} from "../lib/ccm/validation.ts";

const context = {
  patientId: "patient-1",
  practiceId: "practice-1",
  requestId: "10000000-0000-4000-8000-000000000001",
};

function timeEntryForm(overrides = {}) {
  const values = {
    activityType: "checkin_review",
    minutes: "20",
    notes: "Documented monthly follow-up work.",
    occurrenceDate: "2026-07-15",
    ...overrides,
  };
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) formData.set(key, value);

  return formData;
}

test("visible named form values become the canonical outbound request", () => {
  const request = buildTimeEntryCreateRequest(timeEntryForm(), context);

  assert.deepEqual(request, {
    activityType: "checkin_review",
    minutes: 20,
    notes: "Documented monthly follow-up work.",
    occurrenceDate: "2026-07-15",
    patientId: "patient-1",
    practiceId: "practice-1",
    requestId: "10000000-0000-4000-8000-000000000001",
  });
  assert.equal("occurredAt" in request, false);
  assert.equal("billingMonth" in request, false);
});

test("submitted form values win over stale date, minutes, and activity state", () => {
  const staleState = { activityType: "call", minutes: "", occurrenceDate: "2026-07-16" };
  const request = buildTimeEntryCreateRequest(timeEntryForm(), context);

  assert.notEqual(request.activityType, staleState.activityType);
  assert.notEqual(request.minutes, staleState.minutes);
  assert.notEqual(request.occurrenceDate, staleState.occurrenceDate);
});

test("practice-local today is accepted across representative offsets", () => {
  const now = new Date("2026-07-16T02:00:00.000Z");
  const timeZones = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/Berlin",
    "Asia/Tokyo",
  ];

  for (const timeZone of timeZones) {
    assert.doesNotThrow(() =>
      validateNotFutureCalendarDate(
        calendarDateInTimeZone(now, timeZone),
        "Occurrence date",
        timeZone,
        now,
      ),
    );
  }
});

test("tomorrow is rejected in the practice timezone", () => {
  assert.throws(
    () =>
      validateNotFutureCalendarDate(
        "2026-07-16",
        "Occurrence date",
        "America/Chicago",
        new Date("2026-07-16T02:00:00.000Z"),
      ),
    /future/,
  );
});

test("billing month is derived only from the occurrence calendar date", () => {
  assert.equal(billingMonthForOccurrenceDate("2026-07-31"), "2026-07-01");
  assert.equal(billingMonthForOccurrenceDate("2026-08-01"), "2026-08-01");
  assert.equal(billingMonthForOccurrenceDate("2027-01-01"), "2027-01-01");
});

test("DST boundaries retain the selected calendar date", () => {
  assert.equal(
    calendarDateInTimeZone(new Date("2026-03-08T07:01:00.000Z"), "America/New_York"),
    "2026-03-08",
  );
  assert.equal(
    calendarDateInTimeZone(new Date("2026-11-01T06:30:00.000Z"), "America/New_York"),
    "2026-11-01",
  );
});

test("blank minutes are rejected while boundary values are accepted", () => {
  assert.throws(() => buildTimeEntryCreateRequest(timeEntryForm({ minutes: "" }), context), /Minutes is required/);

  for (const minutes of [1, 480]) {
    const request = buildTimeEntryCreateRequest(timeEntryForm({ minutes: String(minutes) }), context);
    assert.doesNotThrow(() => validateInteraction(request.minutes, request.notes));
  }

  for (const minutes of [0, 481]) {
    const request = buildTimeEntryCreateRequest(timeEntryForm({ minutes: String(minutes) }), context);
    assert.throws(() => validateInteraction(request.minutes, request.notes), /minutes/i);
  }
});

test("meaningful notes remain required", () => {
  assert.throws(() => buildTimeEntryCreateRequest(timeEntryForm({ notes: "" }), context), /Notes is required/);
  const request = buildTimeEntryCreateRequest(timeEntryForm({ notes: "short" }), context);
  assert.throws(() => validateInteraction(request.minutes, request.notes), /notes/i);
});

test("persisted dates reload unchanged and historical timestamps remain readable", () => {
  assert.equal(
    occurrenceDateForDisplay({ occurred_at: "2026-07-16T13:00:00.000Z", occurrence_date: "2026-07-15" }),
    "2026-07-15",
  );
  assert.equal(
    occurrenceDateForDisplay({ occurred_at: "2026-06-30T12:00:00.000Z", occurrence_date: undefined }),
    "2026-06-30",
  );
});

test("client, API, and migration enforce one date-only contract", async () => {
  const [page, route, migration] = await Promise.all([
    readFile(new URL("../app/dashboard/log/[patientId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interaction-logs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/022_interaction_occurrence_date.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /new FormData\(event\.currentTarget\)/);
  for (const name of ["activityType", "minutes", "occurrenceDate", "notes"]) {
    assert.match(page, new RegExp(`name="${name}"`));
  }
  assert.doesNotMatch(page, /T12:00:00|occurredAt:/);
  assert.match(route, /billingMonthForOccurrenceDate\(occurrenceDate\)/);
  assert.match(route, /billingMonth is derived from occurrenceDate/);
  assert.match(route, /validateNotFutureCalendarDate/);
  assert.match(route, /getPracticeTimeZone/);
  assert.doesNotMatch(route, /optionalString\(body, "billingMonth"\)/);
  assert.match(route, /request_id/);
  assert.match(migration, /occurrence_date date/);
  assert.match(migration, /interaction_logs_practice_request_id_idx/);
  assert.match(migration, /date_trunc\('month', occurrence_date\)/);
});
