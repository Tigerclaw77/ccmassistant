import assert from "node:assert/strict";
import test from "node:test";
import {
  auditNavigationRole,
  isDevelopmentAuditEnabled,
  isDevelopmentAuditRole,
  patientAuditUrl,
} from "../lib/development-audit.ts";

test("audit mode requires both development runtime and the explicit flag", () => {
  assert.equal(isDevelopmentAuditEnabled({ nodeEnv: "development", flag: "true" }), true);
  assert.equal(isDevelopmentAuditEnabled({ nodeEnv: "production", flag: "true" }), false);
  assert.equal(isDevelopmentAuditEnabled({ nodeEnv: "development", flag: "false" }), false);
  assert.equal(isDevelopmentAuditEnabled({ nodeEnv: "test", flag: "true" }), false);
});

test("role preview accepts only the three audited roles", () => {
  assert.equal(isDevelopmentAuditRole("admin"), true);
  assert.equal(isDevelopmentAuditRole("coordinator"), true);
  assert.equal(isDevelopmentAuditRole("provider"), true);
  assert.equal(isDevelopmentAuditRole("owner"), false);
  assert.equal(isDevelopmentAuditRole("billing_staff"), false);
});

test("navigation role preview never applies when audit mode is disabled", () => {
  assert.equal(auditNavigationRole("owner", "provider", false), "owner");
  assert.equal(auditNavigationRole("owner", "provider", true), "provider");
  assert.equal(auditNavigationRole("coordinator", null, true), "coordinator");
});

test("patient audit opener accepts only secure-link routes", () => {
  assert.equal(patientAuditUrl("/f/token-123", "http://localhost:3000"), "http://localhost:3000/f/token-123");
  assert.equal(patientAuditUrl("https://staging.example/f/token-123", "http://localhost:3000"), "https://staging.example/f/token-123");
  assert.equal(patientAuditUrl("https://staging.example/settings", "http://localhost:3000"), null);
  assert.equal(patientAuditUrl("javascript:alert(1)", "http://localhost:3000"), null);
});
