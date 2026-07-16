import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { safeAppPath } from "../lib/auth-redirect.ts";
import {
  hasDocumentedStaffClosure,
  isCheckinComplete,
} from "../lib/ccm/checkin-completion.ts";
import {
  validateBillingMonth,
  validateInteraction,
  validateNotFutureDate,
  validateNpi,
} from "../lib/ccm/validation.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

assert.doesNotThrow(() => validateNpi("1234567893"));
assert.throws(() => validateNpi("1234567890"), /check digit/i);
assert.throws(() => validateNpi("123"), /10 digits/i);
assert.doesNotThrow(() => validateNotFutureDate("2026-07-14", "DOB", new Date("2026-07-14T12:00:00Z")));
assert.throws(
  () => validateNotFutureDate("2026-07-15", "DOB", new Date("2026-07-14T12:00:00Z")),
  /future/i,
);
assert.doesNotThrow(() => validateInteraction(20, "Reviewed care plan and called patient."));
assert.throws(() => validateInteraction(481, "Documented work."), /480/);
assert.throws(() => validateInteraction(20, "short"), /meaningfully/i);
assert.doesNotThrow(() => validateBillingMonth("2026-07-01", "2026-07-14T12:00:00.000Z"));
assert.throws(
  () => validateBillingMonth("2026-06-01", "2026-07-14T12:00:00.000Z"),
  /must match/i,
);

const documentedClosure = {
  status: "closed",
  metadata: {
    closed_by: "user-1",
    closure_type: "staff_documented_non_response",
    followup_note: "Called twice; voicemail left and provider notified.",
  },
};
assert.equal(hasDocumentedStaffClosure(documentedClosure), true);
assert.equal(isCheckinComplete({ status: "closed", metadata: {} }, []), false);
assert.equal(isCheckinComplete(documentedClosure, []), true);
assert.equal(
  isCheckinComplete({ status: "responded" }, [{ response_text: "Patient reports stable symptoms." }]),
  true,
);
assert.equal(isCheckinComplete({ status: "closed" }, [{ response_text: "   " }]), false);

assert.equal(safeAppPath("/patients?month=2026-07"), "/patients?month=2026-07");
assert.equal(safeAppPath("https://example.com"), "/patients");
assert.equal(safeAppPath("//example.com"), "/patients");

const migration = await readFile(
  resolve(root, "supabase/migrations/012_launch_security_and_integrity.sql"),
  "utf8",
);
assert.match(migration, /audit_events_immutable/);
assert.match(migration, /billing_evidence_snapshots_immutable/);
assert.match(migration, /enforce_patient_practice_match/);
assert.doesNotMatch(migration, /billing_evidence_snapshots[^\n]* for update/i);

const billabilityRoute = await readFile(
  resolve(root, "app/api/billability/recalculate/route.ts"),
  "utf8",
);
assert.match(billabilityRoute, /isCheckinComplete\(checkIn, checkInResponses/);

const auditPacketRoute = await readFile(resolve(root, "app/api/audit-packet/route.ts"), "utf8");
assert.match(auditPacketRoute, /preserved\?\.interaction_logs/);
assert.match(auditPacketRoute, /preserved\?\.check_in_responses/);

console.log("Launch regression checks passed (validation, closure, redirects, immutable-policy guards).")
