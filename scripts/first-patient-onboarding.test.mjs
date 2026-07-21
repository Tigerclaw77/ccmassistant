import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calendarDateValue,
  parseCalendarDateValue,
  resolveCalendarInitialView,
} from "../lib/calendar-defaults.ts";
import { deterministicBootstrapUuid } from "../lib/ccm/first-provider-bootstrap.ts";

const ROOT = new URL("../", import.meta.url);

test("contextual calendar defaults cover present, Medicare, pediatric, and custom views", () => {
  const now = new Date(2026, 6, 20, 9);
  assert.equal(calendarDateValue(resolveCalendarInitialView({ kind: "today" }, now)), "2026-07-20");
  assert.equal(calendarDateValue(resolveCalendarInitialView({ kind: "currentMonth" }, now)), "2026-07-01");
  assert.equal(calendarDateValue(resolveCalendarInitialView({ kind: "currentYear" }, now)), "2026-01-01");
  assert.equal(calendarDateValue(resolveCalendarInitialView({ kind: "medicareAge" }, now)), "1961-01-01");
  assert.equal(calendarDateValue(resolveCalendarInitialView({ ageYears: 12, kind: "pediatric" }, now)), "2014-01-01");
  assert.equal(calendarDateValue(resolveCalendarInitialView({ kind: "custom", resolve: () => new Date(1999, 8, 9, 12) }, now)), "1999-09-09");
  assert.equal(calendarDateValue(parseCalendarDateValue("1961-01-01")), "1961-01-01");
  assert.equal(parseCalendarDateValue("2026-02-30"), null);
});

test("patient DOB keeps an empty value while opening a Medicare-aware accessible calendar", async () => {
  const [form, picker] = await Promise.all([
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
    readFile(new URL("components/ui/ContextualDateInput.tsx", ROOT), "utf8"),
  ]);
  assert.match(form, /Date of birth[\s\S]*ContextualDateInput/);
  assert.match(form, /initialView=\{MEDICARE_AGE_CALENDAR_DEFAULT\}/);
  assert.match(form, /max=\{maximumCalendarDate\}/);
  assert.doesNotMatch(form, /setDob\([^)]*MEDICARE/i);
  assert.match(picker, /type="date"/);
  assert.match(picker, /value=\{value\}/);
  assert.match(picker, /max=\{max\}/);
  assert.match(picker, /aria-expanded=\{open\}/);
  assert.match(picker, /role="dialog"/);
  assert.match(picker, /ArrowLeft/);
  assert.match(picker, /ArrowRight/);
  assert.match(picker, /Escape/);
  assert.match(picker, /type a date directly/);
});

test("practice onboarding always captures and provisions a first provider", async () => {
  const [page, route, providerBootstrap] = await Promise.all([
    readFile(new URL("app/setup/practice/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/api/practices/bootstrap/route.ts", ROOT), "utf8"),
    readFile(new URL("lib/ccm/first-provider-bootstrap.ts", ROOT), "utf8"),
  ]);
  assert.match(page, /Will you personally provide CCM services and serve as a Primary Responsible Provider\?/);
  assert.match(page, /Yes — I am a treating provider/);
  assert.match(page, /No — I am an administrator only/);
  assert.match(page, /Add Your First Provider/);
  assert.match(page, /providerFullName/);
  assert.match(page, /providerType/);
  assert.match(page, /\/patients\/new\?primaryProviderId=/);
  assert.match(route, /\.rpc\("bootstrap_user_practice"/);
  assert.match(route, /ensureFirstProvider\(supabase/);
  assert.doesNotMatch(route, /createServiceRoleSupabaseClient/);
  assert.match(providerBootstrap, /member_id: input\.mode === "treating_provider" \? input\.membership\.id : null/);
  assert.match(providerBootstrap, /role: "provider"/);
  assert.match(providerBootstrap, /is_active: true/);
});

test("interrupted provisioning returns an owner to provider onboarding instead of the patient form", async () => {
  const [gate, activeRoute, recoveryRoute, setup] = await Promise.all([
    readFile(new URL("components/auth/AuthGate.tsx", ROOT), "utf8"),
    readFile(new URL("app/api/practices/active/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/practices/first-provider/route.ts", ROOT), "utf8"),
    readFile(new URL("app/setup/practice/page.tsx", ROOT), "utf8"),
  ]);
  assert.match(activeRoute, /hasActiveProvider/);
  assert.match(gate, /hasActiveProvider === false/);
  assert.match(gate, /provider=required/);
  assert.match(recoveryRoute, /PRACTICE_ADMIN_ROLES/);
  assert.match(recoveryRoute, /ensureFirstProvider/);
  assert.match(setup, /providerRecoveryPracticeId/);
  assert.match(setup, /Add provider and create first patient/);
});

test("first patient receives the bootstrapped provider as its initial PRP", async () => {
  const [newPatient, form] = await Promise.all([
    readFile(new URL("app/patients/new/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
  ]);
  assert.match(newPatient, /initialPrimaryProviderId=\{searchParams\.get\("primaryProviderId"\)\}/);
  assert.match(form, /patient\?\.primary_provider_id \?\? initialPrimaryProviderId/);
  assert.match(form, /providerRows\.find\(\(provider\) => provider\.id === initialPrimaryProviderId\)/);
  assert.match(form, /providerRows\.length === 1 \? providerRows\[0\]/);
});

test("bootstrap identifiers are deterministic and valid UUIDs for safe retries", () => {
  const first = deterministicBootstrapUuid("practice:user");
  const second = deterministicBootstrapUuid("practice:user");
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
