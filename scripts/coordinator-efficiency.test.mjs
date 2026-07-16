import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCarePlanSuggestions, mergeCarePlanText } from "../lib/ccm/care-plan-review.ts";
import { buildIntakeSessionPreview } from "../lib/ccm/intake-session-summary.ts";
import { contextSearchParams, normalizeBillingMonth, withCoordinatorContext } from "../lib/ccm/month-context.ts";
import { answerSessionQuestion, correctSessionAnswer, createQuestionSession, getNextQuestion } from "../lib/ccm/session-engine/engine.ts";
import { getQuestion } from "../lib/ccm/question-bank/questions.ts";
import { composeWorklistRows } from "../lib/ccm/worklist.ts";

const ROOT = new URL("../", import.meta.url);
const NOW = "2026-07-14T14:00:00.000Z";

function neutralAnswer(question) {
  switch (question.answerType) {
    case "yes_no": return false;
    case "number": return question.validation.min ?? 0;
    case "text": return "No current concern";
    case "date": return "2026-07-01";
    case "single_select": return question.validation.options?.[0]?.value ?? null;
    case "multi_select": return question.validation.options?.[0] ? [question.validation.options[0].value] : null;
  }
}

function completeSession(diagnoses = [{ name: "CHF" }], workflow = "monthly_checkin") {
  let session = createQuestionSession({ diagnoses, patientId: "patient-1", sessionId: "session-1", workflow }, { now: NOW });
  let minute = 0;
  while (session.status === "active") {
    const next = getNextQuestion(session);
    assert.ok(next);
    session = answerSessionQuestion(session, next.questionId, neutralAnswer(getQuestion(next.questionId)), `2026-07-14T14:${String(++minute).padStart(2, "0")}:00.000Z`).session;
  }
  return session;
}

test("billing month and coordinator context use one canonical representation", () => {
  assert.equal(normalizeBillingMonth("2026-07"), "2026-07-01");
  assert.equal(normalizeBillingMonth("2026-07-01"), "2026-07-01");
  assert.throws(() => normalizeBillingMonth("07/2026"));
  const href = withCoordinatorContext("/patients/p-1/checkin", { month: "2026-07-01", page: 3, search: "Smith", source: "worklist" });
  assert.match(href, /month=2026-07/);
  assert.equal(contextSearchParams({ month: "2026-07" }).get("month"), "2026-07");
});

test("answer correction preserves the original session plan and re-runs branching", () => {
  const completed = completeSession();
  assert.equal(completed.answers["ccm.symptom.shortness_of_breath"].answer, false);
  const corrected = correctSessionAnswer(completed, "ccm.symptom.shortness_of_breath", true, "2026-07-14T16:00:00.000Z");
  assert.equal(corrected.answers["ccm.symptom.shortness_of_breath"].answer, true);
  assert.equal(corrected.status, "active");
  assert.ok(corrected.activeQuestionIds.includes("ccm.symptom.sob_onset"));
  assert.ok(corrected.progress.requiredQuestionsRemaining > 0);
});

test("completed intake sessions populate deterministic summaries with source versions and audited corrections", () => {
  const session = completeSession([{ name: "Hypertension" }], "intake");
  const preview = buildIntakeSessionPreview(session, { display_name: "Ada Patient", dob: "1940-01-02", preferred_contact_method: "phone" }, [{ condition_name: "Hypertension", is_active: true }], { medications: "Lisinopril 10 mg daily" });
  assert.match(preview.summary.patient_overview, /Ada Patient/);
  assert.equal(preview.summary.medications, "Lisinopril 10 mg daily");
  assert.ok(preview.summary.source_references.length > 0);
  assert.ok(preview.summary.source_references.every((item) => item.question_id.startsWith("ccm.") && item.question_version > 0));
});

test("care-plan suggestions merge review findings without overwriting existing text", () => {
  const session = completeSession([{ name: "Arthritis" }], "care_plan_review");
  const intake = { reviewed_summary: { care_needs: "Needs transportation support", documentation_notes: "Uses a cane" } };
  const suggestions = buildCarePlanSuggestions(intake, session);
  assert.ok(suggestions.notes.includes("Needs transportation support"));
  assert.equal(mergeCarePlanText("Existing approved note", suggestions.notes).split("\n")[0], "Existing approved note");
});

test("highest-priority generated session task becomes the worklist next action", () => {
  let session = createQuestionSession({ diagnoses: [{ name: "CHF" }], patientId: "patient-1", sessionId: "session-1", workflow: "monthly_checkin" }, { now: NOW });
  session = answerSessionQuestion(session, "ccm.symptom.shortness_of_breath", true, NOW).session;
  session = answerSessionQuestion(session, "ccm.symptom.sob_severity", "severe", "2026-07-14T14:01:00.000Z").session;
  const patient = { id: "patient-1", display_name: "Ada Patient", dob: "1940-01-02", external_id: "E-1", phone: "5551234567", primary_provider_id: null, care_coordinator_member_id: "member-1", preferred_contact_method: "phone", status: "active", metadata: {}, practice_id: "practice-1", created_at: NOW, updated_at: NOW, created_by: null, updated_by: null, first_name: "Ada", last_name: "Patient", email: null };
  const rows = composeWorklistRows({ billability: [], carePlans: [], checkIns: [], conditions: [], enrollments: [], intakeSummaries: [], minutesByPatientId: {}, patients: [patient], practiceAttestationComplete: true, providers: [], sessions: [{ id: "record-1", patient_id: patient.id, practice_id: "practice-1", session_state: session, status: "draft", workflow: "monthly_checkin", state_version: 2, care_plan_id: null, checkin_instance_id: null, started_at: NOW, paused_at: null, completed_at: null, cancelled_at: null, created_at: NOW, updated_at: NOW, created_by: null, updated_by: null }] }, "2026-07-01", 20);
  assert.equal(rows[0].nextAction, "notify provider");
  assert.equal(rows[0].priority, "urgent");
  assert.equal(rows[0].owner, "Provider");
});

test("worklist uses one browser endpoint with no per-patient fetch fan-out", async () => {
  const page = await readFile(new URL("app/dashboard/worklist/page.tsx", ROOT), "utf8");
  assert.equal((page.match(/fetch\(`/g) ?? []).filter((item) => item).length <= 2, true);
  assert.doesNotMatch(page, /rows\.map\([\s\S]*fetch\(/);
  assert.match(page, /\/api\/worklist/);
});

test("time entry, check-in actions, assignment defaults, and batch recalculation remain explicit", async () => {
  const [timePage, checkinPage, patientForm, billingPage] = await Promise.all([
    readFile(new URL("app/dashboard/log/[patientId]/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/patients/[patientId]/checkin/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
    readFile(new URL("app/dashboard/billing/page.tsx", ROOT), "utf8"),
  ]);
  assert.match(timePage, /useState<number \| "">\(""\)/);
  assert.match(timePage, /billingMonthFromOccurredDate\(occurredDate\)/);
  assert.match(checkinPage, /Create and copy invitation/);
  assert.match(checkinPage, /Document non-response and close/);
  assert.match(patientForm, /providerRows\.length === 1/);
  assert.match(billingPage, /\/api\/billability\/recalculate\/batch/);
});

test("server routes enforce paging, filtering, targeted refresh, and evidence review authorization", async () => {
  const [worklistRoute, patientRoute, interactionRoute, billingRoute, nextRoute] = await Promise.all([
    readFile(new URL("app/api/worklist/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/patients/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/interaction-logs/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/billing/month/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/billing/next-unreviewed/route.ts", ROOT), "utf8"),
  ]);
  assert.match(worklistRoute, /\.range\(start, start \+ pageSize - 1\)/);
  assert.match(worklistRoute, /care_coordinator_member_id/);
  assert.match(worklistRoute, /monthly_billability/);
  assert.match(patientRoute, /select\("\*", \{ count: "exact" \}\)/);
  assert.match(interactionRoute, /recalculateBillabilityForMutation/);
  assert.match(billingRoute, /BILLING_WRITE_ROLES/);
  assert.match(billingRoute, /Resolve billing evidence blockers/);
  assert.match(nextRoute, /reviewed_at/);
});

test("intake corrections retain source versions and immutable audit metadata", async () => {
  const [intakeRoute, correctionRoute, migration] = await Promise.all([
    readFile(new URL("app/api/patient-intake/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/question-sessions/route.ts", ROOT), "utf8"),
    readFile(new URL("supabase/migrations/014_coordinator_efficiency.sql", ROOT), "utf8"),
  ]);
  assert.match(intakeRoute, /source_question_versions/);
  assert.match(intakeRoute, /correctedFields/);
  assert.match(correctionRoute, /question_session\.answer_corrected/);
  assert.match(correctionRoute, /correctionReason/);
  assert.match(correctionRoute, /questionVersion/);
  assert.match(migration, /session_engine/);
  assert.match(migration, /patients_practice_display_name_id_idx/);
});
