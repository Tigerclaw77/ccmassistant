import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { getQuestion } from "../lib/ccm/question-bank/questions.ts";

const { loadEnvConfig } = nextEnv;
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const APP_ORIGIN = "http://127.0.0.1:3010";
const VALIDATION_SLUG = "ccm-validation-2026-06-07";
const MONTH_ONE = "2026-06-01";
const MONTH_ONE_DATE = "2026-06-15";
const MONTH_TWO = "2026-07-01";
const MONTH_TWO_DATE = "2026-07-15";
const PRACTICE_TIME_ZONE = "America/Chicago";

loadEnvConfig(PROJECT_ROOT, true);

let phase = "environment validation";
let appServer = null;
const serverOutput = [];

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function cleanEnvironment() {
  const output = {};
  const names = new Set();

  for (const [name, value] of Object.entries(process.env)) {
    const normalized = name.toLowerCase();
    if (names.has(normalized) || value === undefined) continue;
    names.add(normalized);
    output[name] = value;
  }

  return output;
}

function sqlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runLinkedSql(sql) {
  const cli = resolve(
    requiredEnvironment("APPDATA"),
    "npm",
    "node_modules",
    "supabase",
    "dist",
    "supabase.js",
  );
  if (!existsSync(cli)) throw new Error("The authenticated Supabase CLI is unavailable");

  const output = execFileSync(
    process.execPath,
    [cli, "db", "query", "--linked", sql],
    {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      env: cleanEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return JSON.parse(output).rows ?? [];
}

function linkedProjectReference() {
  const path = resolve(PROJECT_ROOT, "supabase", ".temp", "project-ref");
  if (!existsSync(path)) throw new Error("The repository is not linked to a Supabase project");
  return readFileSync(path, "utf8").trim();
}

function calendarDateInTimeZone(timeZone, instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase().replaceAll("=", "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("TOTP secret is invalid");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpCode(secret, now = Date.now()) {
  const counter = Math.floor(now / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

function jwtPayload(token) {
  const payload = token.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

function stripeFingerprint() {
  const [row] = runLinkedSql(`
    select
      count(*)::int as row_count,
      md5(coalesce(string_agg(
        concat_ws('|', practice_id::text, stripe_customer_id, stripe_subscription_id,
          subscription_status, active_price_ids::text, current_patient_quantity::text,
          current_period_end::text, cancel_at_period_end::text, updated_at::text),
        '|' order by practice_id
      ), '')) as fingerprint
    from public.practice_billing_accounts;
  `);
  return row;
}

async function createSyntheticUser(admin, role) {
  const email = `ccm.validation.${role}.20260716@example.com`;
  const password = `${randomBytes(24).toString("base64url")}aA1!`;
  const { data, error } = await admin.auth.admin.createUser({
    app_metadata: { synthetic_validation: true },
    email,
    email_confirm: true,
    password,
    user_metadata: { synthetic_validation_role: role },
  });
  if (error || !data.user) throw new Error(`Unable to create synthetic ${role} identity: ${error?.message ?? "unknown error"}`);
  return { email, id: data.user.id, password };
}

async function resetSyntheticUser(admin, userId, role) {
  const password = `${randomBytes(24).toString("base64url")}aA1!`;
  const current = await admin.auth.admin.getUserById(userId);
  if (current.error || !current.data.user?.email) {
    throw new Error(`Unable to recover synthetic ${role} identity: ${current.error?.message ?? "user not found"}`);
  }
  if (current.data.user.app_metadata?.synthetic_validation !== true) {
    throw new Error(`Existing ${role} identity is not marked for synthetic validation`);
  }
  const factors = await admin.auth.admin.mfa.listFactors({ userId });
  if (factors.error) throw new Error(`Unable to inspect synthetic ${role} MFA factors: ${factors.error.message}`);
  for (const factor of factors.data.factors) {
    const deleted = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
    if (deleted.error) throw new Error(`Unable to rotate synthetic ${role} MFA factor: ${deleted.error.message}`);
  }
  const updated = await admin.auth.admin.updateUserById(userId, {
    password,
  });
  if (updated.error) throw new Error(`Unable to reset synthetic ${role} identity: ${updated.error.message}`);
  return { email: current.data.user.email, id: userId, password };
}

async function authenticateAtAal2(url, anonKey, identity, role) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({
    email: identity.email,
    password: identity.password,
  });
  if (signIn.error) throw new Error(`Synthetic ${role} sign-in failed: ${signIn.error.message}`);

  const enrollment = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `CCM historical validation ${role}`,
  });
  if (enrollment.error || !enrollment.data?.totp?.secret) {
    throw new Error(`Synthetic ${role} MFA enrollment failed: ${enrollment.error?.message ?? "missing TOTP secret"}`);
  }

  const verification = await client.auth.mfa.challengeAndVerify({
    code: totpCode(enrollment.data.totp.secret),
    factorId: enrollment.data.id,
  });
  if (verification.error) throw new Error(`Synthetic ${role} MFA verification failed: ${verification.error.message}`);
  const session = verification.data?.session ?? (await client.auth.getSession()).data.session;
  if (!session?.access_token || jwtPayload(session.access_token).aal !== "aal2") {
    throw new Error(`Synthetic ${role} did not reach AAL2`);
  }
  return { client, token: session.access_token };
}

function rememberServerOutput(chunk) {
  serverOutput.push(...String(chunk).split(/\r?\n/).filter(Boolean));
  if (serverOutput.length > 50) serverOutput.splice(0, serverOutput.length - 50);
}

async function startApplication() {
  const nextBin = resolve(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");
  appServer = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3010"],
    {
      cwd: PROJECT_ROOT,
      env: cleanEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  appServer.stdout.on("data", rememberServerOutput);
  appServer.stderr.on("data", rememberServerOutput);

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (appServer.exitCode !== null) {
      throw new Error(`Application server stopped during startup: ${serverOutput.slice(-8).join(" | ")}`);
    }
    try {
      const response = await fetch(`${APP_ORIGIN}/`);
      if (response.ok) return;
    } catch {
      // The listener is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error("Application server did not become ready");
}

async function stopApplication() {
  if (!appServer || appServer.exitCode !== null) return;
  appServer.kill();
  await Promise.race([
    new Promise((resolveExit) => appServer.once("exit", resolveExit)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
  ]);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${APP_ORIGIN}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    method: options.method ?? "GET",
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  const expected = options.expected ?? [200];
  assert.ok(
    expected.includes(response.status),
    `${options.method ?? "GET"} ${path} returned ${response.status}: ${data?.error ?? "unexpected response"}`,
  );
  return { data, status: response.status };
}

function selectAnswer(questionView, occurrenceDate) {
  const definition = getQuestion(questionView.questionId);
  assert.ok(definition, `Question definition not found: ${questionView.questionId}`);
  if (definition.answerType === "yes_no") return false;
  if (definition.answerType === "date") return occurrenceDate;
  if (definition.answerType === "text") return "No material changes reported.";
  if (definition.answerType === "number") {
    const minimum = definition.validation.min ?? 0;
    const maximum = definition.validation.max ?? Math.max(minimum + 10, 10);
    const candidate = minimum + (maximum - minimum) / 2;
    return definition.validation.integer ? Math.round(candidate) : candidate;
  }

  const values = (definition.validation.options ?? []).map((option) => option.value);
  const preferred = [
    "none",
    "no",
    "not_at_all",
    "about_the_same",
    "stable",
    "good",
    "on_track",
    "better",
    "excellent",
  ].find((value) => values.includes(value));
  const selected = preferred ?? values[0];
  assert.ok(selected, `Question options are unavailable: ${questionView.questionId}`);
  return definition.answerType === "multi_select" ? [selected] : selected;
}

async function completeAuthenticatedSession(session, practiceId, token, occurrenceDate) {
  let current = session;
  let count = 0;
  while (current.currentQuestion) {
    assert.ok(count++ < 100, "Question session exceeded its deterministic answer limit");
    const response = await api("/api/question-sessions", {
      body: {
        action: "answer",
        answer: selectAnswer(current.currentQuestion, occurrenceDate),
        practiceId,
        questionId: current.currentQuestion.questionId,
        recordId: current.recordId,
        stateVersion: current.stateVersion,
      },
      method: "PATCH",
      token,
    });
    current = response.data.session;
  }
  assert.equal(current.status, "completed");
  return current;
}

async function completePublicSession(token, session, occurrenceDate) {
  let current = session;
  let count = 0;
  while (current.currentQuestion) {
    assert.ok(count++ < 100, "Public check-in exceeded its deterministic answer limit");
    const response = await api(`/api/check-ins/public/${token}/submit`, {
      body: {
        action: "answer",
        answer: selectAnswer(current.currentQuestion, occurrenceDate),
        questionId: current.currentQuestion.questionId,
        stateVersion: current.stateVersion,
      },
      method: "POST",
    });
    current = response.data.session;
  }
  assert.equal(current.status, "completed");
  return current;
}

function snapshotHash(snapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

async function executeMonth({
  billingMonth,
  coordinatorToken,
  enrollmentId,
  minutes,
  occurrenceDate,
  ownerToken,
  patientId,
  practiceId,
  providerId,
}) {
  const checkInResponse = await api("/api/check-ins", {
    body: { billingMonth, patientId, practiceId },
    expected: [201],
    method: "POST",
    token: coordinatorToken,
  });
  const checkIn = checkInResponse.data.checkIn;
  assert.equal(checkIn.billing_month, billingMonth);
  assert.ok(checkIn.token);

  const publicResponse = await api(`/api/check-ins/public/${checkIn.token}`);
  assert.equal(publicResponse.data.checkIn.token, null);
  assert.equal(publicResponse.data.mode, "engine");
  await completePublicSession(checkIn.token, publicResponse.data.session, occurrenceDate);

  const closed = await api("/api/check-ins/status", {
    body: { checkinInstanceId: checkIn.id, practiceId, status: "closed" },
    method: "PATCH",
    token: coordinatorToken,
  });
  assert.equal(closed.data.checkinInstance.status, "closed");

  const timePayload = {
    activityType: "care_coordination",
    checkinInstanceId: checkIn.id,
    enrollmentId,
    minutes,
    notes: "Synthetic historical care coordination validation activity.",
    occurrenceDate,
    patientId,
    practiceId,
    providerId,
    requestId: randomUUID(),
  };
  const timeEntry = await api("/api/interaction-logs", {
    body: timePayload,
    expected: [201],
    method: "POST",
    token: coordinatorToken,
  });
  assert.equal(timeEntry.data.interactionLog.billing_month, billingMonth);
  assert.equal(timeEntry.data.interactionLog.occurrence_date, occurrenceDate);

  const retry = await api("/api/interaction-logs", {
    body: timePayload,
    method: "POST",
    token: coordinatorToken,
  });
  assert.equal(retry.data.duplicate, true);

  const recalculated = await api("/api/billability/recalculate", {
    body: { billingMonth, patientId, practiceId },
    method: "POST",
    token: coordinatorToken,
  });
  assert.equal(recalculated.data.billability.status, "ready_to_bill");
  assert.equal(Number(recalculated.data.billability.total_minutes), minutes);
  assert.deepEqual(recalculated.data.billability.reason_codes, []);

  await api("/api/billing/month", {
    body: { action: "reviewed", billingMonth, patientId, practiceId },
    expected: [403],
    method: "PATCH",
    token: coordinatorToken,
  });

  const reviewed = await api("/api/billing/month", {
    body: { action: "reviewed", billingMonth, patientId, practiceId },
    method: "PATCH",
    token: ownerToken,
  });
  assert.ok(reviewed.data.billability.reviewed_at);

  const billed = await api("/api/billing/month", {
    body: { action: "billed", billingMonth, patientId, practiceId },
    method: "PATCH",
    token: ownerToken,
  });
  assert.equal(billed.data.billability.status, "billed");
  assert.ok(billed.data.billability.billed_at);

  const packet = await api(`/api/audit-packet?practiceId=${practiceId}&patientId=${patientId}&billingMonth=${billingMonth}`, {
    token: ownerToken,
  });
  assert.ok(packet.data.evidenceSnapshot?.id);
  assert.equal(packet.data.evidenceSnapshot.billing_month, billingMonth);
  assert.equal(Number(packet.data.billability.total_minutes), minutes);

  return {
    billabilityId: billed.data.billability.id,
    checkInId: checkIn.id,
    evidenceId: packet.data.evidenceSnapshot.id,
    evidenceHash: snapshotHash(packet.data.evidenceSnapshot.snapshot),
    minutes,
  };
}

async function main() {
  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = requiredEnvironment("STRIPE_SECRET_KEY");
  assert.ok(!supabaseUrl.includes("localhost"), "Hosted Supabase is required");
  assert.ok(stripeSecret.startsWith("sk_test_"), "Stripe must remain in test mode");
  assert.ok(!stripeSecret.startsWith("sk_live_"), "Live Stripe credentials are forbidden");
  const projectReference = new URL(supabaseUrl).hostname.split(".")[0];
  assert.equal(projectReference, linkedProjectReference(), "The linked project does not match .env.local");
  assert.equal(calendarDateInTimeZone(PRACTICE_TIME_ZONE), "2026-07-16", "This historical fixture is approved for the July 16, 2026 staging run only");

  const migrations = runLinkedSql("select version from supabase_migrations.schema_migrations order by version;");
  assert.ok(migrations.some((row) => String(row.version).startsWith("023")), "Hosted migration 023 is missing");
  const existingPractices = runLinkedSql(`
    select id from public.practices where slug is distinct from ${sqlQuote(VALIDATION_SLUG)} order by created_at;
  `);
  assert.equal(existingPractices.length, 1, "Expected exactly one unchanged staging practice before validation");
  const originalPracticeId = existingPractices[0].id;
  const fixtureRows = runLinkedSql(`
    select
      practice.id,
      owner.id as owner_member_id,
      owner.user_id as owner_user_id,
      coordinator.id as coordinator_member_id,
      coordinator.user_id as coordinator_user_id
    from public.practices practice
    join public.practice_members owner on owner.practice_id = practice.id and owner.role = 'owner' and owner.status = 'active'
    join public.practice_members coordinator on coordinator.practice_id = practice.id and coordinator.role = 'coordinator' and coordinator.status = 'active'
    where practice.slug = ${sqlQuote(VALIDATION_SLUG)};
  `);
  assert.ok(fixtureRows.length <= 1, "Multiple historical validation practices exist");
  const stripeBefore = stripeFingerprint();

  phase = "synthetic identity creation";
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const resumingFixture = fixtureRows.length === 1;
  let practiceId;
  let ownerMemberId;
  let coordinatorMemberId;
  let ownerIdentity;
  let coordinatorIdentity;

  if (resumingFixture) {
    const fixture = fixtureRows[0];
    practiceId = fixture.id;
    ownerMemberId = fixture.owner_member_id;
    coordinatorMemberId = fixture.coordinator_member_id;
    ownerIdentity = await resetSyntheticUser(admin, fixture.owner_user_id, "owner");
    coordinatorIdentity = await resetSyntheticUser(admin, fixture.coordinator_user_id, "coordinator");
  } else {
    ownerIdentity = await createSyntheticUser(admin, "owner");
    coordinatorIdentity = await createSyntheticUser(admin, "coordinator");
    phase = "validation practice fixture";
    practiceId = randomUUID();
    ownerMemberId = randomUUID();
    coordinatorMemberId = randomUUID();
    runLinkedSql(`
      begin;
      insert into public.practices (
        id, name, slug, default_timezone, ccm_monthly_min_minutes, billing_settings,
        account_status, created_by, updated_by
      ) values (
        ${sqlQuote(practiceId)}, 'CCM Historical Validation', ${sqlQuote(VALIDATION_SLUG)},
        ${sqlQuote(PRACTICE_TIME_ZONE)}, 20,
        '{"cms_eligibility_attested":true,"medicare_enrollment_attested":true,"synthetic_validation":true}'::jsonb,
        'active', ${sqlQuote(ownerIdentity.id)}, ${sqlQuote(ownerIdentity.id)}
      );
      insert into public.practice_members (id, practice_id, user_id, role, status, created_by, updated_by)
      values
        (${sqlQuote(ownerMemberId)}, ${sqlQuote(practiceId)}, ${sqlQuote(ownerIdentity.id)}, 'owner', 'active', ${sqlQuote(ownerIdentity.id)}, ${sqlQuote(ownerIdentity.id)}),
        (${sqlQuote(coordinatorMemberId)}, ${sqlQuote(practiceId)}, ${sqlQuote(coordinatorIdentity.id)}, 'coordinator', 'active', ${sqlQuote(ownerIdentity.id)}, ${sqlQuote(ownerIdentity.id)});
      insert into public.audit_events (practice_id, actor_user_id, entity_type, entity_id, action, after_data, metadata)
      values (${sqlQuote(practiceId)}, ${sqlQuote(ownerIdentity.id)}, 'practice', ${sqlQuote(practiceId)},
        'practice.synthetic_validation_created',
        jsonb_build_object('practice_id', ${sqlQuote(practiceId)}, 'owner_membership_id', ${sqlQuote(ownerMemberId)}, 'coordinator_membership_id', ${sqlQuote(coordinatorMemberId)}),
        '{"contains_phi":false,"timeline":"2026-06/2026-07"}'::jsonb);
      commit;
    `);
  }

  phase = "AAL2 authentication";
  const owner = await authenticateAtAal2(supabaseUrl, anonKey, ownerIdentity, "owner");
  const coordinator = await authenticateAtAal2(supabaseUrl, anonKey, coordinatorIdentity, "coordinator");

  phase = "application startup";
  await startApplication();

  phase = "authorization isolation";
  await api(`/api/providers?practiceId=${practiceId}`, { expected: [401] });
  await api(`/api/providers?practiceId=${originalPracticeId}`, {
    expected: [403],
    token: owner.token,
  });
  await api("/api/stripe/portal", {
    body: { practiceId: originalPracticeId },
    expected: [403],
    method: "POST",
    token: owner.token,
  });

  let providerId;
  let patientId;
  let enrollmentId;

  if (!resumingFixture) {
    phase = "provider and synthetic patient setup";
  const providerResponse = await api("/api/providers", {
    body: {
      billingPractitionerType: "physician",
      credentials: "MD",
      fullName: "Synthetic Validation Provider",
      npi: "1234567893",
      practiceId,
    },
    expected: [201],
    method: "POST",
    token: owner.token,
  });
  providerId = providerResponse.data.provider.id;

  const patientResponse = await api("/api/patients", {
    body: {
      careCoordinatorMemberId: coordinatorMemberId,
      displayName: "Synthetic Historical Patient",
      dob: "1950-01-01",
      externalId: "SYNTH-HIST-2026-01",
      firstName: "Synthetic",
      lastName: "Historical",
      practiceId,
      preferredContactMethod: "phone",
      primaryProviderId: providerId,
      status: "active",
    },
    expected: [201],
    method: "POST",
    token: coordinator.token,
  });
  patientId = patientResponse.data.patient.id;

  await api("/api/patient-conditions", {
    body: {
      conditionItems: [
        {
          canonicalName: "Essential Hypertension",
          ccmQualifying: true,
          code: "I10",
          codeSystem: "ICD-10",
          displayName: "Essential Hypertension",
          isActive: true,
          normalizationStatus: "normalized",
          userEnteredText: "Essential Hypertension",
        },
        {
          canonicalName: "Type 2 Diabetes",
          ccmQualifying: true,
          code: "E11.9",
          codeSystem: "ICD-10",
          displayName: "Type 2 Diabetes",
          isActive: true,
          normalizationStatus: "normalized",
          userEnteredText: "Type 2 Diabetes",
        },
      ],
      patientId,
      practiceId,
    },
    method: "PUT",
    token: coordinator.token,
  });

  phase = "eligibility, consent, and enrollment";
  const trueEligibilityFacts = {
    conditions_expected_12_months: true,
    medicare_information_reviewed: true,
    no_known_duplicate_ccm: true,
    significant_risk: true,
    two_or_more_chronic_conditions: true,
  };
  const trueProviderAttestations = {
    care_plan_needed: true,
    ccm_criteria_met: true,
    medical_necessity: true,
    provider_reviewed_conditions: true,
  };
  const trueConsentElements = {
    cost_sharing_explained: true,
    information_sharing_authorized: true,
    one_practitioner_explained: true,
    right_to_stop_explained: true,
    services_explained: true,
  };
  const enrollmentResponse = await api("/api/enroll", {
    body: {
      assignedProviderId: providerId,
      careCoordinatorMemberId: coordinatorMemberId,
      consentDate: "2026-06-01",
      consentElements: trueConsentElements,
      consentMethod: "written",
      consentStatus: "obtained",
      eligibilityFacts: trueEligibilityFacts,
      eligibilityNotes: "Synthetic historical eligibility validation completed.",
      eligibilityStatus: "eligible",
      enrolledAt: "2026-06-01T15:00:00.000Z",
      patientId,
      practiceId,
      providerAttestations: trueProviderAttestations,
      status: "active",
    },
    expected: [201],
    method: "POST",
    token: owner.token,
  });
  enrollmentId = enrollmentResponse.data.enrollment.id;

  phase = "intake session and accepted intake";
  const intakeSessionResponse = await api("/api/question-sessions", {
    body: { patientId, practiceId, workflow: "intake" },
    expected: [201],
    method: "POST",
    token: coordinator.token,
  });
  const completedIntakeSession = await completeAuthenticatedSession(
    intakeSessionResponse.data.session,
    practiceId,
    coordinator.token,
    MONTH_ONE_DATE,
  );
  const intakeResponse = await api("/api/patient-intake", {
    body: {
      enrollmentId,
      manualCorrections: {},
      patientId,
      practiceId,
      sourceQuestionSessionId: completedIntakeSession.recordId,
    },
    expected: [201],
    method: "POST",
    token: coordinator.token,
  });
  assert.equal(intakeResponse.data.intake.status, "accepted");

  phase = "active care plan";
  const carePlanResponse = await api("/api/care-plans", {
    body: {
      barriers: ["No synthetic barriers identified."],
      enrollmentId,
      goals: ["Maintain the documented synthetic care-plan baseline."],
      interventions: ["Continue synthetic monthly monitoring and coordination."],
      lastReviewedDate: "2026-06-01",
      notes: "Historical synthetic care-plan validation only.",
      patientId,
      practiceId,
      providerId,
      status: "active",
    },
    expected: [201],
    method: "POST",
    token: owner.token,
  });
  assert.equal(carePlanResponse.data.carePlan.status, "active");
  } else {
    phase = "existing validation fixture recovery";
    const [state] = runLinkedSql(`
      select
        (select id from public.providers where practice_id = ${sqlQuote(practiceId)} and is_active order by created_at limit 1) as provider_id,
        (select id from public.patients where practice_id = ${sqlQuote(practiceId)} and external_id = 'SYNTH-HIST-2026-01' limit 1) as patient_id,
        (select id from public.ccm_enrollments where practice_id = ${sqlQuote(practiceId)} and status = 'active' order by created_at desc limit 1) as enrollment_id,
        (select count(*)::int from public.patient_intake_summaries where practice_id = ${sqlQuote(practiceId)} and status = 'accepted') as accepted_intakes,
        (select count(*)::int from public.care_plans where practice_id = ${sqlQuote(practiceId)} and status = 'active') as active_care_plans;
    `);
    assert.equal(state.accepted_intakes, 1, "The resumable fixture must have one accepted intake");
    assert.equal(state.active_care_plans, 1, "The resumable fixture must have one active care plan");
    assert.ok(state.provider_id && state.patient_id && state.enrollment_id, "The resumable fixture is incomplete");
    providerId = state.provider_id;
    patientId = state.patient_id;
    enrollmentId = state.enrollment_id;
  }

  phase = "question-bank customization persistence";
  let customizationBefore = await api(`/api/question-bank-management?practiceId=${practiceId}`, {
    token: coordinator.token,
  });
  if (customizationBefore.data.favorites.length === 0) {
    await api("/api/question-bank-management", {
      body: {
        canonicalConditionId: "essential_hypertension",
        favorite: true,
        operation: "favorite",
        practiceId,
        scope: "clinic",
      },
      method: "POST",
      token: owner.token,
    });
    await api("/api/question-bank-management", {
      body: {
        canonicalConditionId: "type_2_diabetes",
        favorite: true,
        operation: "favorite",
        practiceId,
        providerId,
        scope: "provider",
      },
      method: "POST",
      token: owner.token,
    });
    await api("/api/question-bank-management", {
      body: {
        canonicalConditionId: "essential_hypertension",
        coordinatorId: coordinatorMemberId,
        favorite: true,
        operation: "favorite",
        practiceId,
        providerId,
        scope: "coordinator",
      },
      method: "POST",
      token: owner.token,
    });
    customizationBefore = await api(`/api/question-bank-management?practiceId=${practiceId}`, {
      token: coordinator.token,
    });
  }
  assert.equal(customizationBefore.data.favorites.length, 3);

  const completedMonthRows = runLinkedSql(`
    select mb.id as billability_id, mb.billing_month, mb.total_minutes, mb.status,
      evidence.id as evidence_id, checkin.id as checkin_id
    from public.monthly_billability mb
    join public.billing_evidence_snapshots evidence on evidence.monthly_billability_id = mb.id
    join public.checkin_instances checkin on checkin.id = mb.checkin_instance_id
    where mb.practice_id = ${sqlQuote(practiceId)}
      and mb.patient_id = ${sqlQuote(patientId)}
      and mb.billing_month in (${sqlQuote(MONTH_ONE)}, ${sqlQuote(MONTH_TWO)})
    order by mb.billing_month;
  `);
  let monthOne;
  let monthTwo;
  if (completedMonthRows.length === 0) {
    phase = "Month 1 historical workflow";
    monthOne = await executeMonth({
      billingMonth: MONTH_ONE,
      coordinatorToken: coordinator.token,
      enrollmentId,
      minutes: 25,
      occurrenceDate: MONTH_ONE_DATE,
      ownerToken: owner.token,
      patientId,
      practiceId,
      providerId,
    });

    phase = "Month 2 historical workflow";
    monthTwo = await executeMonth({
      billingMonth: MONTH_TWO,
      coordinatorToken: coordinator.token,
      enrollmentId,
      minutes: 35,
      occurrenceDate: MONTH_TWO_DATE,
      ownerToken: owner.token,
      patientId,
      practiceId,
      providerId,
    });
  } else {
    assert.equal(completedMonthRows.length, 2, "Historical month completion is partial");
    for (const row of completedMonthRows) assert.equal(row.status, "billed");
    const monthOnePacket = await api(`/api/audit-packet?practiceId=${practiceId}&patientId=${patientId}&billingMonth=${MONTH_ONE}`, { token: owner.token });
    const monthTwoPacket = await api(`/api/audit-packet?practiceId=${practiceId}&patientId=${patientId}&billingMonth=${MONTH_TWO}`, { token: owner.token });
    monthOne = {
      billabilityId: completedMonthRows[0].billability_id,
      checkInId: completedMonthRows[0].checkin_id,
      evidenceId: completedMonthRows[0].evidence_id,
      evidenceHash: snapshotHash(monthOnePacket.data.evidenceSnapshot.snapshot),
      minutes: Number(completedMonthRows[0].total_minutes),
    };
    monthTwo = {
      billabilityId: completedMonthRows[1].billability_id,
      checkInId: completedMonthRows[1].checkin_id,
      evidenceId: completedMonthRows[1].evidence_id,
      evidenceHash: snapshotHash(monthTwoPacket.data.evidenceSnapshot.snapshot),
      minutes: Number(completedMonthRows[1].total_minutes),
    };
  }

  phase = "immutability and month independence";
  assert.notEqual(monthOne.evidenceId, monthTwo.evidenceId);
  assert.notEqual(monthOne.billabilityId, monthTwo.billabilityId);
  assert.notEqual(monthOne.checkInId, monthTwo.checkInId);
  const monthOneAfter = await api(`/api/audit-packet?practiceId=${practiceId}&patientId=${patientId}&billingMonth=${MONTH_ONE}`, {
    token: owner.token,
  });
  assert.equal(snapshotHash(monthOneAfter.data.evidenceSnapshot.snapshot), monthOne.evidenceHash);
  assert.equal(Number(monthOneAfter.data.billability.total_minutes), 25);
  assert.equal(monthOneAfter.data.billability.status, "ready_to_bill");
  const monthOneLive = await api(`/api/billing/month?practiceId=${practiceId}&billingMonth=${MONTH_ONE}`, {
    token: owner.token,
  });
  const monthOneLiveRow = monthOneLive.data.rows.find((row) => row.patient.id === patientId);
  assert.equal(monthOneLiveRow.billability.status, "billed");

  const forbiddenUpdate = await owner.client
    .from("billing_evidence_snapshots")
    .update({ snapshot: { tampered: true } })
    .eq("practice_id", practiceId)
    .eq("id", monthOne.evidenceId)
    .select("id");
  assert.ok(forbiddenUpdate.error || forbiddenUpdate.data?.length === 0, "Evidence update unexpectedly succeeded");
  const forbiddenDelete = await owner.client
    .from("billing_evidence_snapshots")
    .delete()
    .eq("practice_id", practiceId)
    .eq("id", monthOne.evidenceId)
    .select("id");
  assert.ok(forbiddenDelete.error || forbiddenDelete.data?.length === 0, "Evidence delete unexpectedly succeeded");
  const monthOneAfterMutationAttempts = await api(`/api/audit-packet?practiceId=${practiceId}&patientId=${patientId}&billingMonth=${MONTH_ONE}`, {
    token: owner.token,
  });
  assert.equal(snapshotHash(monthOneAfterMutationAttempts.data.evidenceSnapshot.snapshot), monthOne.evidenceHash);

  const customizationAfter = await api(`/api/question-bank-management?practiceId=${practiceId}`, {
    token: coordinator.token,
  });
  assert.equal(customizationAfter.data.favorites.length, 3);
  assert.deepEqual(
    customizationAfter.data.favorites.map((favorite) => [favorite.scope, favorite.canonical_condition_id, favorite.version]).sort(),
    customizationBefore.data.favorites.map((favorite) => [favorite.scope, favorite.canonical_condition_id, favorite.version]).sort(),
  );

  phase = "future-date and Stripe isolation";
  const tomorrow = new Date(`${calendarDateInTimeZone(PRACTICE_TIME_ZONE)}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);
  await api("/api/interaction-logs", {
    body: {
      activityType: "care_coordination",
      minutes: 1,
      notes: "Synthetic future-date rejection validation.",
      occurrenceDate: tomorrowDate,
      patientId,
      practiceId,
      requestId: randomUUID(),
    },
    expected: [400],
    method: "POST",
    token: coordinator.token,
  });
  const stripeAfter = stripeFingerprint();
  assert.deepEqual(stripeAfter, stripeBefore, "Stripe billing-account state changed during CCM validation");
  const [validationStripe] = runLinkedSql(`
    select count(*)::int as row_count from public.practice_billing_accounts where practice_id = ${sqlQuote(practiceId)};
  `);
  assert.equal(validationStripe.row_count, 0);

  phase = "final hosted assertions";
  const [counts] = runLinkedSql(`
    select
      (select count(*)::int from public.practices where id = ${sqlQuote(practiceId)}) as practices,
      (select count(*)::int from public.practice_members where practice_id = ${sqlQuote(practiceId)} and status = 'active') as active_members,
      (select count(*)::int from public.providers where practice_id = ${sqlQuote(practiceId)}) as providers,
      (select count(*)::int from public.patients where practice_id = ${sqlQuote(practiceId)}) as patients,
      (select count(*)::int from public.monthly_billability where practice_id = ${sqlQuote(practiceId)} and status = 'billed') as billed_months,
      (select count(*)::int from public.billing_evidence_snapshots where practice_id = ${sqlQuote(practiceId)}) as evidence_snapshots,
      (select count(*)::int from public.practices where id = ${sqlQuote(originalPracticeId)}) as original_practice_present;
  `);
  assert.deepEqual(counts, {
    active_members: 2,
    billed_months: 2,
    evidence_snapshots: 2,
    original_practice_present: 1,
    patients: 1,
    practices: 1,
    providers: 1,
  });

  console.log(JSON.stringify({
    complete: true,
    evidence: {
      monthOneImmutable: true,
      separateSnapshots: true,
    },
    months: {
      "2026-06": { minutes: monthOne.minutes, status: "billed" },
      "2026-07": { minutes: monthTwo.minutes, status: "billed" },
    },
    security: {
      aal2: true,
      crossPracticeDenied: true,
      evidenceMutationDenied: true,
      futureDateRejected: true,
      roleRestrictionDenied: true,
    },
    stripe: {
      billingAccountFingerprintUnchanged: true,
      validationPracticeObjectsCreated: 0,
    },
    syntheticOnly: true,
  }, null, 2));
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown hosted validation failure";
  console.error(JSON.stringify({
    complete: false,
    error: message,
    phase,
    serverTail: serverOutput.slice(-8),
  }));
  process.exitCode = 1;
} finally {
  await stopApplication();
}
