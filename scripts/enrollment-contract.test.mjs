import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildEnrollmentMutationRequest,
  consentDateFromFormData,
  normalizeConsentDateForStatus,
  resolveConsentUpdate,
} from "../lib/ccm/enrollment-contract.ts";
import {
  calendarDateInTimeZone,
  validateNotFutureCalendarDate,
} from "../lib/ccm/validation.ts";

const baseRequest = {
  patientId: "patient-1",
  practiceId: "practice-1",
};

test("the visible named consent date becomes the canonical outbound property", () => {
  const formData = new FormData();
  formData.set("consentDate", "2026-07-15");

  const request = buildEnrollmentMutationRequest({
    ...baseRequest,
    consentDate: consentDateFromFormData(formData),
    consentStatus: "obtained",
  });
  const serialized = JSON.parse(JSON.stringify(request));

  assert.equal(serialized.consentDate, "2026-07-15");
  assert.equal("consent_date" in serialized, false);
});

test("the submitted form value wins over stale component state", () => {
  const staleComponentState = "";
  const formData = new FormData();
  formData.set("consentDate", "2026-07-15");

  const request = buildEnrollmentMutationRequest({
    ...baseRequest,
    consentDate: consentDateFromFormData(formData),
    consentStatus: "obtained",
  });

  assert.equal(staleComponentState, "");
  assert.equal(request.consentDate, "2026-07-15");
});

test("obtained consent requires a date and preserves valid dates unchanged", () => {
  assert.throws(
    () => normalizeConsentDateForStatus("obtained", ""),
    /Consent date is required/,
  );
  assert.equal(
    normalizeConsentDateForStatus("obtained", " 2026-07-15 "),
    "2026-07-15",
  );
});

test("non-obtained consent explicitly clears any stale date", () => {
  for (const status of ["not_collected", "declined", "revoked"]) {
    assert.equal(normalizeConsentDateForStatus(status, "2026-07-15"), null);
  }
});

test("practice-local today is accepted while tomorrow is rejected", () => {
  const now = new Date("2026-07-16T02:00:00.000Z");

  assert.doesNotThrow(() =>
    validateNotFutureCalendarDate("2026-07-15", "Consent date", "America/Chicago", now),
  );
  assert.throws(
    () => validateNotFutureCalendarDate("2026-07-16", "Consent date", "America/Chicago", now),
    /future/,
  );
  assert.doesNotThrow(() =>
    validateNotFutureCalendarDate("2026-07-16", "Consent date", "Asia/Tokyo", now),
  );

  for (const timeZone of [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/Berlin",
    "Asia/Tokyo",
  ]) {
    assert.doesNotThrow(() =>
      validateNotFutureCalendarDate(
        calendarDateInTimeZone(now, timeZone),
        "Consent date",
        timeZone,
        now,
      ),
    );
  }
});

test("persisted consent dates reload unchanged and partial updates preserve them", () => {
  const unchanged = resolveConsentUpdate({
    currentConsentDate: "2026-07-15",
    currentConsentStatus: "obtained",
    requestedConsentDate: undefined,
    requestedConsentDatePresent: false,
    requestedConsentStatus: undefined,
  });

  assert.deepEqual(unchanged, {
    consentDate: "2026-07-15",
    consentStatus: "obtained",
  });

  const cleared = resolveConsentUpdate({
    currentConsentDate: "2026-07-15",
    currentConsentStatus: "obtained",
    requestedConsentDate: undefined,
    requestedConsentDatePresent: false,
    requestedConsentStatus: "revoked",
  });

  assert.deepEqual(cleared, {
    consentDate: null,
    consentStatus: "revoked",
  });
});

test("the patient form and enrollment API share the canonical contract", async () => {
  const [form, route, eligibilityPage] = await Promise.all([
    readFile(new URL("../components/patients/PatientForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/enroll/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/patients/[patientId]/eligibility/page.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(form, /name="consentDate"/);
  assert.match(form, /consentDateFromFormData\(new FormData\(event\.currentTarget\)\)/);
  assert.match(form, /buildEnrollmentMutationRequest/);
  assert.match(form, /useState\(fieldValue\(enrollment\?\.consent_date\)\)/);
  assert.match(route, /normalizeConsentDateForStatus/);
  assert.match(route, /validateNotFutureCalendarDate/);
  assert.match(route, /getPracticeTimeZone/);
  assert.match(eligibilityPage, /satisfies EnrollmentMutationRequest/);
  assert.doesNotMatch(route, /Enrollment consent contract diagnostic/);
});
