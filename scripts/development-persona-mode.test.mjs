import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEVELOPMENT_PERSONAS,
  applyDevelopmentPersonaMembership,
  developmentPersonaPatientHref,
  isDevelopmentPersonaEnabled,
  parseDevelopmentPersonaHeader,
  sanitizeDevelopmentPersonaContext,
  serializeDevelopmentPersonaContext,
} from "../lib/development-persona.ts";
import { hasAuthorizedPracticeRole } from "../lib/practice-authorization.ts";

const practiceId = "10000000-0000-4000-8000-000000000001";
const patientId = "20000000-0000-4000-8000-000000000001";
const realMembership = {
  created_at: "2026-01-01T00:00:00.000Z",
  disabled_at: null,
  id: "30000000-0000-4000-8000-000000000001",
  invited_email: null,
  last_role_changed_at: null,
  practice_id: practiceId,
  removed_at: null,
  role: "owner",
  status: "active",
  updated_at: "2026-01-01T00:00:00.000Z",
  user_id: "40000000-0000-4000-8000-000000000001",
};

test("persona mode requires both development and the explicit public flag", () => {
  assert.equal(isDevelopmentPersonaEnabled({ nodeEnv: "development", flag: "true" }), true);
  assert.equal(isDevelopmentPersonaEnabled({ nodeEnv: "production", flag: "true" }), false);
  assert.equal(isDevelopmentPersonaEnabled({ nodeEnv: "development", flag: "false" }), false);
  assert.equal(isDevelopmentPersonaEnabled({ nodeEnv: "test", flag: "true" }), false);
});

test("production ignores even a valid, attacker-supplied persona header", () => {
  const header = serializeDevelopmentPersonaContext({ personaId: "developer", practiceId });
  assert.equal(parseDevelopmentPersonaHeader(header, { nodeEnv: "production", flag: "true" }), null);
  assert.equal(parseDevelopmentPersonaHeader(header, { nodeEnv: "development", flag: "false" }), null);
  assert.deepEqual(
    parseDevelopmentPersonaHeader(header, { nodeEnv: "development", flag: "true" }),
    { personaId: "developer", practiceId },
  );
});

test("persona context accepts only known personas and valid UUID scope values", () => {
  assert.equal(sanitizeDevelopmentPersonaContext({ personaId: "superuser" }), null);
  assert.deepEqual(
    sanitizeDevelopmentPersonaContext({ personaId: "provider-paul", patientId: "not-a-uuid", practiceId }),
    { personaId: "provider-paul", practiceId },
  );
});

test("all required perspectives have a stable model and realistic home", () => {
  const roles = new Set(DEVELOPMENT_PERSONAS.map((persona) => persona.role));
  for (const role of [
    "organization_owner",
    "practice_administrator",
    "compliance_administrator",
    "billing_administrator",
    "provider",
    "clinical_staff",
    "coordinator",
    "front_desk",
    "read_only",
    "patient",
    "developer",
  ]) assert.equal(roles.has(role), true, `${role} is available`);
  assert.equal(DEVELOPMENT_PERSONAS.filter((persona) => persona.role === "coordinator").length, 2);
});

test("the overlay changes only the returned copy and a reset restores the real role", () => {
  const overlaid = applyDevelopmentPersonaMembership(
    realMembership,
    { personaId: "provider-paul", practiceId },
  );
  assert.equal(realMembership.role, "owner");
  assert.equal(overlaid.role, "provider");
  assert.notEqual(overlaid, realMembership);
  assert.equal(applyDevelopmentPersonaMembership(realMembership, null), realMembership);
  assert.equal(
    applyDevelopmentPersonaMembership(realMembership, {
      personaId: "provider-paul",
      practiceId: "50000000-0000-4000-8000-000000000001",
    }),
    realMembership,
  );
});

test("restrictive personas do not satisfy existing write-role checks", () => {
  const readOnly = applyDevelopmentPersonaMembership(realMembership, { personaId: "read-only", practiceId });
  const patient = applyDevelopmentPersonaMembership(realMembership, { personaId: "patient", practiceId });
  assert.equal(hasAuthorizedPracticeRole(readOnly, ["owner", "admin", "provider", "coordinator"]), false);
  assert.equal(hasAuthorizedPracticeRole(patient, ["owner", "admin", "provider", "coordinator"]), false);
});

test("selected patients open through persona-specific workflow links", () => {
  assert.equal(developmentPersonaPatientHref("provider-paul", patientId), `/patients/${patientId}/care-plan`);
  assert.match(developmentPersonaPatientHref("billing-administrator", patientId), new RegExp(`^/dashboard/billing/${patientId}/\\d{4}-\\d{2}$`));
  assert.equal(developmentPersonaPatientHref("coordinator-mary", patientId), `/patients/${patientId}`);
});

test("implementation retains real authentication and causes no persona persistence writes", async () => {
  const [auth, layout, personaPage, toolbar, supabaseClient] = await Promise.all([
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dev/personas/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dev/DeveloperPersonaToolbar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase.ts", import.meta.url), "utf8"),
  ]);
  assert.match(auth, /auth\.getUser\(accessToken\)/);
  assert.match(auth, /currentLevel !== "aal2"/);
  assert.match(layout, /isDevelopmentPersonaEnabled\(\) \? <DeveloperPersonaToolbar/);
  assert.match(personaPage, /if \(!isDevelopmentPersonaEnabled\(\)\) notFound\(\)/);
  assert.match(supabaseClient, /sessionStorage\.getItem\(DEVELOPMENT_PERSONA_SESSION_KEY\)/);
  assert.doesNotMatch(toolbar, /recordAuditEvent|\.insert\(|\.update\(|\.delete\(|method:\s*["'](?:POST|PATCH|DELETE)["']/);
});
