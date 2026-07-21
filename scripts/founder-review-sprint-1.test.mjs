import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  careCycleDaysRemaining,
  clinicalWorkflowSettings,
  isMonthEndAwarenessActive,
  validateExpirationOverrides,
} from "../lib/ccm/workflow-settings.ts";

const ROOT = new URL("../", import.meta.url);

test("founder defaults are clinical, configurable, and conservative", () => {
  const settings = clinicalWorkflowSettings({});
  assert.equal(settings.monthEndAwarenessDay, 25);
  assert.equal(settings.allowCoordinatorClaiming, false);
  assert.equal(settings.expirationDays.abnormal_questionnaire, 1);
  assert.equal(settings.expirationDays.hospital_discharge, 2);
  assert.equal(settings.expirationDays.educational_reminder, 14);
  assert.deepEqual(validateExpirationOverrides({ medication_follow_up: 5 }), { medication_follow_up: 5 });
  assert.throws(() => validateExpirationOverrides({ medication_follow_up: 0 }), /1 to 90/);
  assert.throws(() => validateExpirationOverrides({ unknown_rule: 5 }), /Unsupported suggestion type/);
});

test("month-end awareness and days remaining use the practice timezone", () => {
  const date = new Date("2026-07-25T05:30:00.000Z");
  assert.equal(isMonthEndAwarenessActive("2026-07-01", "America/Chicago", 25, date), true);
  assert.equal(isMonthEndAwarenessActive("2026-07-01", "America/Los_Angeles", 25, date), false);
  assert.equal(careCycleDaysRemaining("2026-07-01", "America/Chicago", date), 6);
  assert.equal(careCycleDaysRemaining("2026-06-01", "America/Chicago", date), null);
});

test("clinical UI uses suggested-care language and exact explainability", async () => {
  const [panel, compliance] = await Promise.all([
    readFile(new URL("components/work/OpportunityReviewPanel.tsx", ROOT), "utf8"),
    readFile(new URL("app/dashboard/compliance/page.tsx", ROOT), "utf8"),
  ]);
  assert.match(panel, /Suggested care activities/);
  assert.match(panel, /Why am I seeing this\?/);
  assert.match(panel, /trigger_summary/);
  assert.match(panel, /rule_identifier/);
  assert.doesNotMatch(panel, /<(?:p|h[1-6]|button|option|span|div)\b[^>]*>[^<>{}]*opportunit/i);
  assert.doesNotMatch(compliance, /<(?:p|h[1-6]|button|option|span|div)\b[^>]*>[^<>{}]*opportunit/i);
});

test("threshold is operational context rather than the primary worklist reason", async () => {
  const [worklist, panel] = await Promise.all([
    readFile(new URL("app/dashboard/worklist/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/work/OpportunityReviewPanel.tsx", ROOT), "utf8"),
  ]);
  assert.match(worklist, /Monthly context/);
  assert.doesNotMatch(worklist, /h-full bg-emerald-600/);
  assert.match(panel, /Time is operational context, never the reason for a suggestion/);
  assert.match(panel, /Days remaining/);
});

test("claiming remains disabled by default and is narrowly authorized", async () => {
  const [migration, route] = await Promise.all([
    readFile(new URL("supabase/migrations/027_task_driven_coordinator_workflow.sql", ROOT), "utf8"),
    readFile(new URL("app/api/patients/claim/route.ts", ROOT), "utf8"),
  ]);
  assert.match(migration, /allow_coordinator_claiming boolean not null default false/);
  assert.match(migration, /claim_unassigned_ccm_patient/);
  assert.match(migration, /auth\.jwt\(\) ->> 'aal'\) <> 'aal2'/);
  assert.match(migration, /role = 'coordinator'/);
  assert.match(migration, /care_coordinator_member_id is null/);
  assert.match(migration, /patient\.coordinator_claimed/);
  assert.match(route, /requirePracticeMembership\(request, practiceId, \["coordinator"\]\)/);
});

test("production integrations are contracts without selected vendors", async () => {
  const adapters = await readFile(new URL("lib/integrations/clinical-workflow.ts", ROOT), "utf8");
  assert.match(adapters, /interface NotificationProvider/);
  assert.match(adapters, /interface ClinicalReportExporter/);
  assert.match(adapters, /interface SecureMessageProvider/);
  assert.doesNotMatch(adapters, /resend|sendgrid|twilio|faxage/i);
});

test("documentation distinguishes suggestion, task, completed work, and billable work", async () => {
  const [documentation, notes] = await Promise.all([
    readFile(new URL("docs/product/coordinator-workflow-and-opportunity-detector.md", ROOT), "utf8"),
    readFile(new URL("docs/product/founder-review-notes.md", ROOT), "utf8"),
  ]);
  for (const term of ["Suggestion", "Task", "Completed work", "Billable work"]) assert.match(documentation, new RegExp(term));
  assert.match(documentation, /Time is never automatic/i);
  assert.match(notes, /Current workflow/);
  assert.match(notes, /Estimated impact/);
  assert.match(notes, /Estimated impact \| Engineering effort/);
});

test("the founder coordinator loop returns to prioritized work after documentation", async () => {
  const [workspace, worklist] = await Promise.all([
    readFile(new URL("components/work/WorkItemWorkspace.tsx", ROOT), "utf8"),
    readFile(new URL("app/dashboard/worklist/page.tsx", ROOT), "utf8"),
  ]);
  for (const step of ["Perform", "Outcome", "Actual time", "Route to PRP", "Complete task"]) {
    assert.match(workspace, new RegExp(step, "i"));
  }
  assert.match(workspace, /return to My Work Today/i);
  assert.match(worklist, /Next patient/);
});
