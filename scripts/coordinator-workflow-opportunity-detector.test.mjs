import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CLINICAL_TRIGGER_CATALOG_VERSION,
  DEFAULT_OPPORTUNITY_EXPIRATION_DAYS,
  detectClinicalOpportunities,
  dispositionCreatesTask,
  isStaleOpportunity,
  ordinaryEmailNotification,
  opportunityExpirationDays,
  prioritizeWork,
  validateActualReviewTime,
} from "../lib/ccm/opportunity-detector.ts";
import { canExecuteClinicalWork } from "../lib/ccm/work-authorization.ts";

const ROOT = new URL("../", import.meta.url);
const NOW = "2026-07-20T12:00:00.000Z";

test("urgent clinical evidence outranks threshold proximity", () => {
  const urgent = prioritizeWork({ urgent: true, thresholdProximity: true });
  const supportedThresholdContext = prioritizeWork({ documentationIncomplete: true, thresholdProximity: true });
  assert.equal(urgent.priority, "urgent");
  assert.ok(urgent.score > supportedThresholdContext.score);
});

test("month end increases an existing work item's priority but does not invent work", () => {
  const normal = prioritizeWork({ openCarePlanTask: true });
  const monthEnd = prioritizeWork({ monthEnd: true, openCarePlanTask: true });
  assert.ok(monthEnd.score > normal.score);
  assert.equal(prioritizeWork({ monthEnd: true }).priority, "none");
});

test("threshold alone produces neither a priority nor an opportunity", () => {
  const priority = prioritizeWork({ thresholdProximity: true });
  assert.equal(priority.priority, "none");
  assert.equal(priority.factors.length, 0);
  assert.deepEqual(detectClinicalOpportunities({ generatedAt: NOW, patientId: "p", practiceId: "practice" }), []);
});

test("abnormal response produces an explainable patient-specific opportunity", () => {
  const [opportunity] = detectClinicalOpportunities({
    abnormalResponses: [{ observedAt: NOW, sourceId: "response-1", sourceType: "checkin_response", summary: "Flagged shortness-of-breath response" }],
    conditionName: "Heart failure",
    generatedAt: NOW,
    patientId: "patient-1",
    practiceId: "practice-1",
  });
  assert.equal(opportunity.triggerCode, "abnormal_patient_response");
  assert.equal(opportunity.patientId, "patient-1");
  assert.match(opportunity.benefitRationale, /patient-reported abnormal response/i);
  assert.equal(opportunity.evidence[0].sourceId, "response-1");
  assert.equal(opportunity.ruleVersion, CLINICAL_TRIGGER_CATALOG_VERSION);
  assert.equal(opportunity.ruleIdentifier, "CCM-ABNORMAL-QUESTIONNAIRE-001");
  assert.equal(opportunity.triggerSummary, "Flagged shortness-of-breath response");
  assert.equal(opportunity.expiresAt, "2026-07-21T12:00:00.000Z");
});

test("suggestion expiration uses type defaults and validated practice overrides", () => {
  assert.equal(opportunityExpirationDays("hospital_discharge"), 2);
  assert.equal(opportunityExpirationDays("medication_follow_up"), 7);
  assert.equal(opportunityExpirationDays("educational_reminder"), 14);
  assert.equal(opportunityExpirationDays("abnormal_questionnaire", { abnormal_questionnaire: 3 }), 3);
  assert.equal(opportunityExpirationDays("provider_review", { provider_review: 0 }), DEFAULT_OPPORTUNITY_EXPIRATION_DAYS.provider_review);
});

test("accepted opportunity creates a task while no-intervention does not", async () => {
  assert.equal(dispositionCreatesTask("accepted"), true);
  assert.equal(dispositionCreatesTask("provider_review"), true);
  assert.equal(dispositionCreatesTask("no_intervention"), false);
  const migration = await readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8");
  assert.match(migration, /disposition_value in \('accepted','different_action','provider_review'\)[\s\S]*insert into public\.ccm_work_items/);
  assert.match(migration, /ccm_disposition_task_semantics/);
});

test("no intervention may record only actual affirmed review time and time is never automatic", async () => {
  assert.doesNotThrow(() => validateActualReviewTime(null, false));
  assert.doesNotThrow(() => validateActualReviewTime(2, true));
  assert.throws(() => validateActualReviewTime(2, false), /affirmative attestation/);
  const panel = await readFile(new URL("components/work/OpportunityReviewPanel.tsx", ROOT), "utf8");
  assert.match(panel, /\['none', 'No time'\]/);
  assert.match(panel, /\['1', '1 minute'\]/);
  assert.match(panel, /\['2', '2 minutes'\]/);
  assert.match(panel, /I affirm this is the actual time/);
  assert.doesNotMatch(panel, /useState\([^)]*(?:minute|time)[^)]*[1-9]/i);
});

test("billing cannot execute clinical work", () => {
  assert.equal(canExecuteClinicalWork({ assignedCoordinatorId: "m-1", membershipId: "m-1", role: "billing_staff" }), false);
});

test("coordinator execution remains inside assigned scope", () => {
  assert.equal(canExecuteClinicalWork({ assignedCoordinatorId: "m-1", membershipId: "m-1", role: "coordinator" }), true);
  assert.equal(canExecuteClinicalWork({ assignedCoordinatorId: "m-2", membershipId: "m-1", role: "coordinator" }), false);
  assert.equal(canExecuteClinicalWork({ assignedCoordinatorId: null, membershipId: "m-1", role: "coordinator" }), false);
});

test("remote and in-office coordinators use identical authorization", () => {
  const base = { assignedCoordinatorId: "m-1", membershipId: "m-1", role: "coordinator" };
  assert.equal(canExecuteClinicalWork({ ...base, workLocation: "remote" }), canExecuteClinicalWork({ ...base, workLocation: "in_office" }));
});

test("specialist reports preserve the Primary Responsible Provider", async () => {
  const migration = await readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8");
  const reportBlock = migration.slice(migration.indexOf("create table public.ccm_clinical_reports"), migration.indexOf("create table public.ccm_work_item_events"));
  assert.match(reportBlock, /primary_provider_id uuid not null/);
  assert.match(reportBlock, /recipient_type/);
  assert.doesNotMatch(reportBlock, /update public\.patients/);
});

test("detector version and disposition are retained in immutable audit history", async () => {
  const migration = await readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8");
  assert.match(migration, /ccm_work_item_events_immutable/);
  assert.match(migration, /'detector_version', opportunity_row\.detector_version/);
  assert.match(migration, /'disposition', disposition_value/);
});

test("ordinary email notification contains no PHI", () => {
  const notification = ordinaryEmailNotification();
  assert.equal(notification.containsPhi, false);
  assert.doesNotMatch(`${notification.subject} ${notification.body}`, /patient|diagnosis|condition|medication|dob/i);
  assert.match(notification.body, /secure workspace/i);
});

test("stale opportunities fail closed", () => {
  assert.equal(isStaleOpportunity("2026-07-01T00:00:00.000Z", "2026-07-08T00:00:00.000Z", "2026-07-08T00:00:00.000Z"), true);
  assert.equal(isStaleOpportunity("2026-07-18T00:00:00.000Z", null, NOW), false);
});

test("migration enables RLS and blocks anonymous table access", async () => {
  const migration = await readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8");
  for (const table of ["ccm_opportunities", "ccm_work_items", "ccm_opportunity_dispositions", "ccm_clinical_reports", "ccm_work_item_events"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /revoke all on table[\s\S]*from anon/);
  assert.match(migration, /ccm_user_in_patient_scope/);
});

test("detector evidence can be persisted only by the trusted server transaction", async () => {
  const [migration, route] = await Promise.all([
    readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8"),
    readFile(new URL("app/api/opportunities/route.ts", ROOT), "utf8"),
  ]);
  assert.match(migration, /unique \(practice_id, patient_id, detector_version, rule_version, rule_identifier, evidence_fingerprint\)/);
  assert.match(migration, /function public\.store_ccm_opportunity[\s\S]*security invoker[\s\S]*auth\.role\(\) <> 'service_role'/i);
  assert.match(migration, /revoke all on function public\.store_ccm_opportunity\(jsonb, jsonb\) from public, anon, authenticated, service_role/i);
  assert.match(migration, /grant execute on function public\.store_ccm_opportunity\(jsonb, jsonb\) to service_role/i);
  assert.match(migration, /grant select, insert on table public\.ccm_opportunities, public\.ccm_opportunity_evidence to service_role/i);
  assert.doesNotMatch(migration, /grant[^;]*insert[^;]*ccm_opportunities[^;]*to authenticated/i);
  assert.doesNotMatch(migration, /create policy ccm_opportunities_scoped_insert/i);
  assert.match(route, /createServiceRoleSupabaseClient/);
  assert.match(route, /service\.rpc\("store_ccm_opportunity"/);
  assert.doesNotMatch(route, /from\("ccm_opportunities"\)\.upsert/);
  assert.doesNotMatch(route, /from\("ccm_opportunity_evidence"\)\.insert/);
});

test("immutable fingerprint changes with detector versions and evaluated inputs", async () => {
  const route = await readFile(new URL("app/api/opportunities/route.ts", ROOT), "utf8");
  assert.match(route, /fingerprint\(\{[\s\S]*detectorVersion: opportunity\.detectorVersion/);
  assert.match(route, /inputFacts: opportunity\.inputFacts/);
  assert.match(route, /evidence: opportunity\.evidence/);
  assert.doesNotMatch(route.slice(route.indexOf("const evidenceFingerprint"), route.indexOf("const { data, error }")), /generatedAt/);
});

test("a coordinator can execute and finish a task without leaving the patient workspace", async () => {
  const [workspace, panel, workRoute, timeRoute, reportRoute, worklist] = await Promise.all([
    readFile(new URL("components/work/WorkItemWorkspace.tsx", ROOT), "utf8"),
    readFile(new URL("components/work/OpportunityReviewPanel.tsx", ROOT), "utf8"),
    readFile(new URL("app/api/work-items/[workItemId]/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/interaction-logs/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/clinical-reports/route.ts", ROOT), "utf8"),
    readFile(new URL("app/dashboard/worklist/page.tsx", ROOT), "utf8"),
  ]);

  assert.match(panel, /WorkItemWorkspace/);
  assert.match(panel, /Continue in the task workspace below/);
  assert.match(workspace, /Perform → Document → Route or complete/);
  assert.match(workspace, /No time to record/);
  assert.match(workspace, /actualTimeAffirmed: true/);
  assert.match(workspace, /workItemId: item\.id/);
  assert.match(workspace, /recipientType: "primary_responsible_provider"/);
  assert.match(workspace, /router\.replace\(`\/dashboard\/worklist/);
  assert.doesNotMatch(workspace, /\/dashboard\/log\//);

  assert.match(workRoute, /FINAL_COORDINATOR_STATUSES/);
  assert.match(workRoute, /update\.queue_group = "completed_today"/);
  assert.match(workRoute, /update\.queue_group = "awaiting_provider"/);
  assert.match(workRoute, /Deferring work requires a valid follow-up date/);
  assert.match(timeRoute, /assertClinicalWorkAccess/);
  assert.match(timeRoute, /actual_time_affirmed: workItemId \? actualTimeAffirmed : false/);
  assert.match(timeRoute, /This work item already has a different actual-time entry/);
  assert.match(reportRoute, /duplicate: true, report: existing/);
  assert.match(worklist, /You are back in My Work Today/);
  assert.match(worklist, /Open next patient/);
});
