import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  billingReviewCategory,
  classifyStaffQueues,
  countStaffQueues,
  suggestCptReview,
} from "../lib/ccm/staff-experience.ts";
import {
  PATIENT_COMMUNICATION_KINDS,
  PATIENT_COMMUNICATION_TEMPLATES,
  renderPatientCommunicationText,
} from "../lib/ccm/patient-communications.ts";

const ROOT = new URL("../", import.meta.url);
const NOW = "2026-07-16T12:00:00.000Z";

function billability(overrides = {}) {
  return {
    id: "month-1",
    practice_id: "practice-1",
    patient_id: "patient-1",
    enrollment_id: "enrollment-1",
    billing_month: "2026-07-01",
    total_minutes: 0,
    qualifying_interaction_count: 0,
    checkin_instance_id: null,
    consent_valid: false,
    care_plan_current: false,
    eligibility_valid: false,
    status: "not_ready",
    reason_codes: [],
    reviewed_by: null,
    reviewed_at: null,
    billed_at: null,
    exported_at: null,
    created_by: null,
    updated_by: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

test("coordinator queues identify urgency, blockers, overdue contacts, and threshold opportunities", () => {
  const urgent = {
    documentedMinutes: 16,
    owner: "Provider",
    priority: "urgent",
    readinessStatus: "not_ready",
    reasonCodes: ["missing_checkin_response"],
  };
  assert.deepEqual(classifyStaffQueues(urgent, 20), ["urgent", "near_threshold", "blocked", "overdue", "provider_review"]);

  const oneMore = {
    documentedMinutes: 17,
    owner: "Coordinator",
    priority: "normal",
    readinessStatus: "not_ready",
    reasonCodes: ["insufficient_minutes"],
  };
  assert.deepEqual(classifyStaffQueues(oneMore, 20), ["near_threshold", "one_more_interaction"]);
  assert.equal(countStaffQueues([urgent, oneMore], 20).near_threshold, 2);
});

test("billing review categories remain presentation-only and use existing reason codes", () => {
  assert.equal(billingReviewCategory(billability({ total_minutes: 17, reason_codes: ["insufficient_minutes"] }), 20), "ready_after_small_action");
  assert.equal(billingReviewCategory(billability({ reason_codes: ["missing_consent"] }), 20), "consent_issue");
  assert.equal(billingReviewCategory(billability({ reason_codes: ["missing_provider_attestation"] }), 20), "provider_review_pending");
  assert.equal(billingReviewCategory(billability({ status: "ready_to_bill", total_minutes: 20 }), 20), "ready_to_bill");
});

test("CPT review suggestions require billing readiness and never create billing actions", () => {
  assert.equal(suggestCptReview(billability({ total_minutes: 60 })), null);
  assert.deepEqual(suggestCptReview(billability({ status: "ready_to_bill", total_minutes: 20 }))?.codes, [{ code: "99490", units: 1 }]);
  assert.deepEqual(suggestCptReview(billability({ status: "ready_to_bill", total_minutes: 60 }))?.codes, [{ code: "99490", units: 1 }, { code: "99439", units: 2 }]);
});

test("patient communications render complete plain-language copy without unresolved placeholders", () => {
  for (const kind of PATIENT_COMMUNICATION_KINDS) {
    const template = PATIENT_COMMUNICATION_TEMPLATES[kind];
    assert.ok(template.subject.length <= 70);
    assert.ok(template.paragraphs.every((paragraph) => paragraph.length <= 220));
    const rendered = renderPatientCommunicationText(kind, {
      actionUrl: "https://ccm.example.com/secure-action",
      patientFirstName: "Ada",
      practiceName: "Example Clinic",
      supportPhone: "555-0100",
    });
    assert.doesNotMatch(`${rendered.subject}\n${rendered.text}`, /{{[^}]+}}/);
    assert.match(rendered.text, /https:\/\/ccm\.example\.com\/secure-action/);
    assert.match(rendered.text, /Example Clinic/);
  }
});

test("staff pages reuse canonical authorization and do not add automatic billing", async () => {
  const [managementRoute, questionRoute, billingPage, providerPage, header] = await Promise.all([
    readFile(new URL("app/api/management/summary/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/question-bank-management/route.ts", ROOT), "utf8"),
    readFile(new URL("app/dashboard/billing/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/dashboard/provider/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/Header.tsx", ROOT), "utf8"),
  ]);
  assert.match(managementRoute, /requirePracticeMembership\(request, practiceId, PRACTICE_ADMIN_ROLES\)/);
  assert.match(questionRoute, /requirePracticeMembership\(request, practiceId\)/);
  assert.doesNotMatch(questionRoute, /from\("clinical_questions"\)\.(?:insert|update|delete)/);
  assert.match(questionRoute, /containsPotentialPhi/);
  assert.match(billingPage, /Review only; never billed automatically/);
  assert.match(billingPage, /window\.confirm\(confirmation\)/);
  assert.match(providerPage, /queueKeys\.includes\("provider_review"\)/);
  assert.match(header, /navigationForRole/);
});

test("question-library writes remain append-only version records", async () => {
  const route = await readFile(new URL("app/api/question-bank-management/route.ts", ROOT), "utf8");
  assert.match(route, /question_bank_favorite_versions"\)\.insert/);
  assert.match(route, /question_bank_custom_question_versions"\)\.insert/);
  assert.match(route, /question_contribution_candidates"\)\.insert/);
  assert.doesNotMatch(route, /question_bank_(?:favorite|custom_question|override)_versions"\)\.(?:update|delete)/);
  assert.match(route, /question_bank\.custom_question_retired/);
});
