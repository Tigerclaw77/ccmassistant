import assert from "node:assert/strict";
import test from "node:test";
import {
  answerSessionQuestion,
  createQuestionSession,
  getNextQuestion,
} from "../lib/ccm/session-engine/engine.ts";
import {
  deserializeQuestionSession,
  serializeQuestionSession,
} from "../lib/ccm/session-engine/persistence.ts";
import {
  pauseQuestionSession,
  resumeQuestionSession,
} from "../lib/ccm/session-engine/resume.ts";
import { buildSessionSummary } from "../lib/ccm/session-engine/summary.ts";
import { getQuestion } from "../lib/ccm/question-bank/questions.ts";

const NOW = "2026-07-14T14:00:00.000Z";

function monthlySession(diagnoses = [{ name: "CHF" }], extra = {}) {
  return createQuestionSession({
    diagnoses,
    patientId: "patient-1",
    sessionId: "session-1",
    workflow: "monthly_checkin",
    ...extra,
  }, { now: NOW });
}

function answer(session, questionId, value, minute = 1) {
  return answerSessionQuestion(
    session,
    questionId,
    value,
    `2026-07-14T14:${String(minute).padStart(2, "0")}:00.000Z`,
  ).session;
}

function neutralAnswer(question) {
  switch (question.answerType) {
    case "yes_no": return false;
    case "number": return question.validation.min ?? 0;
    case "text": return "No current concern";
    case "date": return "2026-07-01";
    case "single_select": return question.validation.options?.[0]?.value ?? null;
    case "multi_select": return question.validation.options?.[0]
      ? [question.validation.options[0].value]
      : null;
  }
}

test("skip logic reuses only explicitly valid, same-version responses", () => {
  const session = monthlySession([{ name: "Hypertension" }], {
    previousAnswers: [{
      answer: "about_the_same",
      answeredAt: "2026-07-13T12:00:00.000Z",
      questionId: "ccm.general.health_change",
      questionVersion: 1,
      source: "previous_answer",
      validUntil: "2026-07-15T00:00:00.000Z",
    }],
  });

  assert.ok(session.skippedQuestions.some((item) =>
    item.questionId === "ccm.general.health_change" && item.reason === "recent_valid_response"));
  assert.notEqual(getNextQuestion(session)?.questionId, "ccm.general.health_change");
  assert.ok(!session.plan.candidateQuestionIds.includes("ccm.diabetes.latest_glucose"));
});

test("existing branching engine activates shortness-of-breath follow-ups", () => {
  let session = monthlySession();
  assert.ok(!session.activeQuestionIds.includes("ccm.symptom.sob_severity"));

  session = answer(session, "ccm.symptom.shortness_of_breath", true);
  assert.ok(session.activeQuestionIds.includes("ccm.symptom.sob_onset"));
  assert.ok(session.activeQuestionIds.includes("ccm.symptom.sob_severity"));
  assert.equal(
    session.branchState.find((item) => item.questionId === "ccm.symptom.sob_severity")?.status,
    "active",
  );
});

test("urgent provider-review answers create auditable coordinator work", () => {
  let session = monthlySession();
  session = answer(session, "ccm.symptom.shortness_of_breath", true);
  session = answer(session, "ccm.symptom.sob_severity", "severe", 2);

  assert.equal(session.highestPriority, "URGENT");
  assert.equal(session.providerReviewRequired, true);
  assert.ok(session.flags.some((flag) => flag.code === "severe_shortness_of_breath"));
  assert.ok(session.tasks.some((task) =>
    task.reason === "severe_shortness_of_breath" &&
    task.assignedTo === "coordinator" &&
    task.priority === "URGENT" &&
    task.type === "notify_provider"));
});

test("care-coordination actions generate structured medication tasks", () => {
  let session = monthlySession([{ name: "Hypertension" }]);
  session = answer(session, "ccm.medication.has_issue", true);
  session = answer(session, "ccm.medication.issue_reasons", ["cost"], 2);

  const task = session.tasks.find((item) => item.reason === "medication_cost_barrier");
  assert.equal(task?.patientId, "patient-1");
  assert.equal(task?.questionId, "ccm.medication.issue_reasons");
  assert.equal(task?.priority, "NORMAL");
  assert.equal(task?.type, "medication_reconciliation");
  assert.equal(session.coordinatorReviewRequired, true);
});

test("paused sessions serialize and resume without losing interview position", () => {
  let session = monthlySession([{ name: "Hypertension" }]);
  const first = getNextQuestion(session);
  assert.ok(first);
  session = answer(session, first.questionId, neutralAnswer(getQuestion(first.questionId)));
  const nextId = getNextQuestion(session)?.questionId;

  const paused = pauseQuestionSession(session, "2026-07-14T14:10:00.000Z");
  const stored = serializeQuestionSession(paused);
  const restored = deserializeQuestionSession(stored);
  const resumed = resumeQuestionSession(restored, "2026-07-14T14:20:00.000Z");

  assert.equal(resumed.status, "active");
  assert.equal(resumed.resumeCount, 1);
  assert.equal(getNextQuestion(resumed)?.questionId, nextId);
  assert.deepEqual(restored, paused);
});

test("interview completes when active questions are answered and branches are excluded", () => {
  let session = monthlySession([{ name: "Hypertension" }]);
  let iterations = 0;
  while (session.status === "active") {
    const next = getNextQuestion(session);
    assert.ok(next, "an active session must have a next question");
    const question = getQuestion(next.questionId);
    assert.ok(question);
    session = answerSessionQuestion(
      session,
      next.questionId,
      neutralAnswer(question),
      new Date(Date.parse(NOW) + (++iterations * 60_000)).toISOString(),
    ).session;
    assert.ok(iterations < 100, "session should converge");
  }

  assert.equal(session.status, "completed");
  assert.equal(session.progress.completionPercentage, 100);
  assert.equal(session.progress.requiredQuestionsRemaining, 0);
  assert.equal(session.progress.optionalQuestionsRemaining, 0);
  assert.ok(session.progress.sectionProgress.every((section) => section.complete));
  assert.ok(session.progress.moduleProgress.every((module) => module.complete));
});

test("summary generation is deterministic and structured", () => {
  let session = monthlySession([{ name: "Hypertension" }]);
  session = answer(session, "ccm.medication.has_issue", true);
  session = answer(session, "ccm.medication.issue_reasons", ["forgot"], 2);
  session = answer(session, "ccm.hospital.had_admission", true, 3);
  session = answer(session, "ccm.hospital.reason", "Heart failure observation", 4);

  assert.ok(session.summary.missedMedications.some((item) =>
    item.questionId === "ccm.medication.issue_reasons"));
  assert.ok(session.summary.hospitalizations.some((item) =>
    item.questionId === "ccm.hospital.had_admission"));
  assert.ok(session.summary.billingRelevantDocumentation.every((item) =>
    item.questionVersion > 0 && item.billingRelevance.length > 0));
  assert.deepEqual(buildSessionSummary(session), session.summary);
  assert.equal(
    JSON.stringify(buildSessionSummary(session)),
    JSON.stringify(buildSessionSummary(session)),
  );
});

test("session serialization preserves question versions, tasks, flags, and summary", () => {
  let session = monthlySession();
  session = answer(session, "ccm.chf.rapid_weight_gain", true);
  const serialized = serializeQuestionSession(session);
  const restored = deserializeQuestionSession(serialized);

  assert.deepEqual(restored, session);
  assert.match(serialized, /"questionVersions"/);
  assert.match(serialized, /"rapid_weight_gain"/);
  assert.equal(restored.tasks[0]?.questionVersion, 1);
});
