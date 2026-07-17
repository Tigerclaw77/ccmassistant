import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  invitationExpiration,
  isAssignableStaffRole,
  normalizedStaffEmail,
  wouldRemoveFinalAdministrator,
} from "../lib/ccm/staff-management.ts";
import {
  canPerformCarePlanReviewAction,
  carePlanReviewDecision,
  nextCarePlanReviewStatus,
} from "../lib/ccm/care-plan-workflow.ts";
import {
  deliveryCanBeResent,
  effectiveDeliveryStatus,
  genericCheckinEmail,
  maskDeliveryDestination,
} from "../lib/ccm/checkin-delivery.ts";

const member = (id, role, status = "active") => ({ id, removed_at: null, role, status });

test("staff invitations normalize identity, expire deterministically, and accept only pilot roles", () => {
  assert.equal(normalizedStaffEmail(" Admin@Example.COM "), "admin@example.com");
  assert.throws(() => normalizedStaffEmail("not-an-email"));
  assert.equal(invitationExpiration(new Date("2026-07-17T12:00:00.000Z"), 60), "2026-07-17T13:00:00.000Z");
  assert.throws(() => invitationExpiration(new Date(), 2));
  assert.equal(isAssignableStaffRole("admin"), true);
  assert.equal(isAssignableStaffRole("coordinator"), true);
  assert.equal(isAssignableStaffRole("provider"), true);
  assert.equal(isAssignableStaffRole("owner"), false);
});

test("the final administrator cannot be reassigned, disabled, or removed", () => {
  const singleAdmin = [member("admin-1", "admin")];
  assert.equal(wouldRemoveFinalAdministrator(singleAdmin, "admin-1", "provider"), true);
  assert.equal(wouldRemoveFinalAdministrator(singleAdmin, "admin-1", undefined, "inactive"), true);
  assert.equal(wouldRemoveFinalAdministrator([member("owner", "owner"), member("admin", "admin")], "admin", "provider"), false);
  assert.equal(wouldRemoveFinalAdministrator([member("owner", "owner")], "owner", "owner", "active"), false);
});

test("care-plan review state and role boundaries are explicit", () => {
  assert.equal(nextCarePlanReviewStatus("draft", "coordinator_ready"), "coordinator_ready");
  assert.equal(nextCarePlanReviewStatus("coordinator_ready", "submit"), "provider_review_required");
  assert.equal(nextCarePlanReviewStatus("provider_review_required", "approve"), "approved");
  assert.equal(nextCarePlanReviewStatus("provider_review_required", "request_changes"), "revision_requested");
  assert.throws(() => nextCarePlanReviewStatus("draft", "approve"));
  assert.equal(carePlanReviewDecision("approve"), "approved");
  assert.equal(canPerformCarePlanReviewAction("provider", "approve"), true);
  assert.equal(canPerformCarePlanReviewAction("coordinator", "approve"), false);
  assert.equal(canPerformCarePlanReviewAction("coordinator", "submit"), true);
  assert.equal(canPerformCarePlanReviewAction("billing_staff", "submit"), false);
});

test("delivery status, expiry, resend, and destination masking are deterministic", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");
  assert.equal(effectiveDeliveryStatus({ status: "delivered", token_expires_at: "2026-07-17T11:59:59.000Z" }, now), "expired");
  assert.equal(effectiveDeliveryStatus({ status: "completed", token_expires_at: "2026-07-17T11:59:59.000Z" }, now), "completed");
  assert.equal(deliveryCanBeResent({ status: "opened", token_expires_at: "2026-07-18T12:00:00.000Z" }, now), true);
  assert.equal(deliveryCanBeResent({ status: "delivered", token_expires_at: "2026-07-17T11:59:59.000Z" }, now), false);
  assert.equal(maskDeliveryDestination("email", "patient@example.com"), "p***@example.com");
  assert.equal(maskDeliveryDestination("sms", "+1 (312) 555-0198"), "***-***-0198");
  assert.equal(maskDeliveryDestination("link"), null);
});

test("patient email content is generic and carries no patient or clinical data", () => {
  const email = genericCheckinEmail("Pilot Practice", "https://staging.example/f/secure-token");
  assert.match(email.subject, /Secure monthly check-in/);
  assert.match(email.text, /secure-token/);
  assert.doesNotMatch(JSON.stringify(email), /patient name|diagnosis|date of birth|medication/i);
});

test("migration preserves immutable approval history, scoped reads, and idempotent delivery requests", async () => {
  const migration = await readFile(new URL("../supabase/migrations/024_pilot_readiness_sprint_1.sql", import.meta.url), "utf8");
  assert.match(migration, /care_plan_versions_immutable[\s\S]*before update or delete/i);
  assert.match(migration, /care_plan_reviews_immutable[\s\S]*before update or delete/i);
  assert.match(migration, /decision in \('coordinator_ready', 'submitted', 'approved', 'changes_requested', 'superseded'\)/i);
  assert.match(migration, /checkin_deliveries_practice_request_idx[\s\S]*\(practice_id, request_key\)/i);
  assert.match(migration, /checkin_deliveries_member_select[\s\S]*is_practice_member\(practice_id\)/i);
  assert.doesNotMatch(migration, /grant update .*practice_members to authenticated/i);
});

test("administrative, review, and delivery routes retain canonical authorization and audit logging", async () => {
  const [staff, reviews, deliveries, acceptance] = await Promise.all([
    readFile(new URL("../app/api/practice-members/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/care-plan-reviews/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/check-in-deliveries/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/staff-invitations/accept/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(staff, /requirePracticeMembership[\s\S]*PRACTICE_ADMIN_ROLES/);
  assert.match(staff, /final active administrator cannot/i);
  assert.match(staff, /practice_member\.role_changed/);
  assert.match(reviews, /requirePracticeMembership/);
  assert.match(reviews, /This care plan is not assigned to the signed-in provider/);
  assert.match(reviews, /care_plan\.review_/);
  assert.match(deliveries, /requirePracticeMembership\(request, practiceId, PATIENT_WRITE_ROLES\)/);
  assert.match(deliveries, /eq\("practice_id", practiceId\)/);
  assert.match(deliveries, /duplicate: true/);
  assert.match(acceptance, /currentLevel|requireAuthenticatedUser/);
  assert.match(acceptance, /expires_at/);
});
