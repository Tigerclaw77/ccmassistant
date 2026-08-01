import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { resolveWorklistAssignment, summarizeAndPageWorklistRows } from "../lib/ccm/worklist-scope.ts";

const ROOT = new URL("../", import.meta.url);

function worklistRow(index, overrides = {}) {
  return {
    assignedCoordinatorId: "member-1",
    billingMonth: "2026-08-01",
    carePlanReviewStatus: null,
    documentedMinutes: 0,
    dob: null,
    externalId: null,
    nextAction: "Review",
    nextActionUrl: `/patients/patient-${index}`,
    owner: "Coordinator",
    patientId: `patient-${String(index).padStart(3, "0")}`,
    patientName: `Patient ${String(index).padStart(3, "0")}`,
    phone: null,
    practitioner: "Dr. Pilot",
    priority: "normal",
    priorityReason: "Pilot work",
    queueGroup: "needs_attention",
    queueKeys: [],
    reasonCodes: [],
    readinessStatus: "not_ready",
    remainingMinutes: 20,
    ...overrides,
  };
}

test("coordinators default to their own assignment while practice scope remains explicit", () => {
  assert.equal(resolveWorklistAssignment("", { id: "member-1", role: "coordinator" }), "member-1");
  assert.equal(resolveWorklistAssignment("practice", { id: "member-1", role: "coordinator" }), "");
  assert.equal(resolveWorklistAssignment("", { id: "member-2", role: "provider" }), "");
});

test("queue totals cover the complete scope while detail rows remain paginated", () => {
  const rows = Array.from({ length: 130 }, (_, index) => worklistRow(index, {
    queueGroup: index < 80 ? "needs_attention" : "ready_to_contact",
    queueKeys: index < 110 ? ["provider_review"] : [],
    priority: index < 5 ? "urgent" : "normal",
    reasonCodes: index >= 5 && index < 35 ? ["missing_provider_attestation"] : [],
  }));
  const result = summarizeAndPageWorklistRows(rows, { group: null, page: 5, pageSize: 25, queueKey: "provider_review" });

  assert.equal(result.total, 110);
  assert.equal(result.rows.length, 10);
  assert.equal(result.groupCounts.needs_attention, 80);
  assert.equal(result.groupCounts.ready_to_contact, 50);
  assert.equal(result.providerAttentionCounts.alerts, 5);
  assert.equal(result.providerAttentionCounts.approvals, 30);
});

test("suggestion deferral requires a date and atomically creates deferred work", async () => {
  const migrationNames = await readdir(new URL("supabase/migrations/", ROOT));
  const migrationName = migrationNames.find((name) => name.endsWith("_rc004_durable_opportunity_deferral.sql"));
  assert.ok(migrationName);
  const [migration, route, panel] = await Promise.all([
    readFile(new URL(`supabase/migrations/${migrationName}`, ROOT), "utf8"),
    readFile(new URL("app/api/opportunities/[opportunityId]/disposition/route.ts", ROOT), "utf8"),
    readFile(new URL("components/work/OpportunityReviewPanel.tsx", ROOT), "utf8"),
  ]);

  assert.match(migration, /disposition_value = 'deferred'[\s\S]*task_due_at is null/);
  assert.match(migration, /disposition_value in \('accepted','different_action','provider_review','deferred'\)[\s\S]*insert into public\.ccm_work_items/);
  assert.match(migration, /when disposition_value = 'deferred' then 'deferred'/);
  assert.match(migration, /ccm_disposition_task_semantics[\s\S]*'deferred'\)[\s\S]*resulting_work_item_id is not null/);
  assert.match(migration, /\) not valid;/);
  assert.match(route, /Deferral requires a valid follow-up date/);
  assert.match(panel, /Follow-up date \(required\)/);
  assert.match(panel, /Follow-up work remains scheduled/);
});

test("persona navigation does not advertise forbidden front-desk intake and remains usable on mobile", async () => {
  const [header, toolbar] = await Promise.all([
    readFile(new URL("components/Header.tsx", ROOT), "utf8"),
    readFile(new URL("components/dev/DeveloperPersonaToolbar.tsx", ROOT), "utf8"),
  ]);
  const frontDeskBlock = header.slice(header.indexOf('personaId === "front-desk"'), header.indexOf('personaId === "read-only"'));
  assert.doesNotMatch(frontDeskBlock, /\/patients\/new|Add patient/);
  assert.match(toolbar, /max-h-\[calc\(100dvh-2rem\)\]/);
  assert.match(toolbar, /overflow-y-auto/);
});

test("settings names the remaining operational prerequisites and routes to the next one", async () => {
  const settings = await readFile(new URL("app/settings/page.tsx", ROOT), "utf8");
  assert.match(settings, /Operational readiness/);
  assert.match(settings, /Active billing practitioner/);
  assert.match(settings, /Practitioner NPI/);
  assert.match(settings, /CCM eligibility attestation/);
  assert.match(settings, /Medicare enrollment attestation/);
  assert.match(settings, /Complete next item/);
});
