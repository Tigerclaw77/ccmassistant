import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(import.meta.dirname, "..");
const appOrigin = "http://127.0.0.1:3011";
const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
const runId = Date.now().toString(36);
const email = `gate3-runtime-${runId}@example.test`;
const password = `${randomBytes(24).toString("base64url")}aA1!`;
const serverOutput = [];
let server;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
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

async function startApplication() {
  const nextBin = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
  server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3011"], {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const remember = (chunk) => {
    serverOutput.push(...String(chunk).split(/\r?\n/).filter(Boolean));
    if (serverOutput.length > 40) serverOutput.splice(0, serverOutput.length - 40);
  };
  server.stdout.on("data", remember);
  server.stderr.on("data", remember);

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js exited: ${serverOutput.slice(-8).join(" | ")}`);
    try {
      const response = await fetch(appOrigin);
      if (response.ok) return;
    } catch {
      // Listener is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Next.js did not become ready: ${serverOutput.slice(-8).join(" | ")}`);
}

async function stopApplication() {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    new Promise((resolveExit) => server.once("exit", resolveExit)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
  ]);
}

async function api(path, token, options = {}) {
  const response = await fetch(`${appOrigin}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    method: options.method ?? "GET",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  assert.equal(response.status, options.expectedStatus ?? 200, `${path}: ${text}`);
  return payload;
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let createdUserId;
try {
  const createdUser = await admin.auth.admin.createUser({ email, email_confirm: true, password });
  assert.ifError(createdUser.error);
  assert.ok(createdUser.data.user);
  createdUserId = createdUser.data.user.id;

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await userClient.auth.signInWithPassword({ email, password });
  assert.ifError(signIn.error);

  const enrollment = await userClient.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Gate 3 ${runId}`,
  });
  assert.ifError(enrollment.error);
  assert.ok(enrollment.data?.totp?.secret);

  const verification = await userClient.auth.mfa.challengeAndVerify({
    code: totpCode(enrollment.data.totp.secret),
    factorId: enrollment.data.id,
  });
  assert.ifError(verification.error);
  const session = verification.data.session ?? (await userClient.auth.getSession()).data.session;
  assert.ok(session?.access_token);

  await startApplication();

  const bootstrap = await api("/api/practices/bootstrap", session.access_token, {
    body: {
      coordinatorAssignmentMode: "manual",
      defaultTimezone: "America/Chicago",
      name: `Gate 3 Runtime ${runId}`,
      organizationType: "independent_practice",
      patientReminderNotifications: false,
      phone: "555-0100",
      providerCredentials: "MD",
      providerFullName: "Gate 3 Treating Provider",
      providerMode: "treating_provider",
      providerType: "physician",
      staffEmailNotifications: true,
    },
    expectedStatus: 201,
    method: "POST",
  });
  assert.equal(bootstrap.membership.status, "active");
  assert.equal(bootstrap.membership.role, "owner");
  assert.equal(bootstrap.provider.member_id, bootstrap.membership.id);

  const patientResult = await api("/api/patients", session.access_token, {
    body: {
      displayName: "Gate 3 First Patient",
      dob: "1950-01-01",
      practiceId: bootstrap.practice.id,
      primaryProviderId: bootstrap.provider.id,
    },
    expectedStatus: 201,
    method: "POST",
  });
  assert.equal(patientResult.patient.primary_provider_id, bootstrap.provider.id);

  const compliance = await api(`/api/compliance/workflow?practiceId=${bootstrap.practice.id}`, session.access_token);
  assert.deepEqual(compliance.events, []);
  assert.deepEqual(compliance.opportunities, []);

  const providerReview = await api(`/api/care-plan-reviews?practiceId=${bootstrap.practice.id}&pending=true`, session.access_token);
  assert.deepEqual(providerReview.carePlans, []);

  const { data: roleAssignments, error: roleError } = await userClient
    .from("practice_member_role_assignments")
    .select("role,status")
    .eq("practice_id", bootstrap.practice.id)
    .eq("user_id", createdUserId);
  assert.ifError(roleError);
  assert.deepEqual(roleAssignments, [{ role: "practice_administrator", status: "active" }, { role: "provider", status: "active" }]);

  const { count: historyCount, error: historyError } = await userClient
    .from("patient_primary_provider_history")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientResult.patient.id);
  assert.ifError(historyError);
  assert.equal(historyCount, 1);

  console.log(JSON.stringify({
    checks: {
      aal2: true,
      complianceRoute: true,
      firstPatient: true,
      ownerMembership: true,
      practiceBootstrap: true,
      providerBootstrap: true,
      providerReviewRoute: true,
      roleAssignments: true,
    },
    cleanup: { email, practiceId: bootstrap.practice.id, userId: createdUserId },
  }));
} finally {
  await stopApplication();
}
