import assert from "node:assert/strict";
import test from "node:test";
import {
  answerSessionQuestion,
  createQuestionSession,
  getNextQuestion,
} from "../lib/ccm/session-engine/engine.ts";
import {
  pauseQuestionSession,
  resumeQuestionSession,
} from "../lib/ccm/session-engine/resume.ts";
import { getQuestion } from "../lib/ccm/question-bank/questions.ts";
import {
  buildIntegratedSessionInput,
  deriveSessionTelemetry,
  hasSessionEngineMarker,
  isLegacyCheckIn,
  persistenceStatus,
  sessionStateFromJson,
  sessionStateToJson,
  toQuestionSessionPayload,
} from "../lib/ccm/session-integration.ts";

const NOW = "2026-07-14T15:00:00.000Z";
const patient = {
  id: "patient-1",
  display_name: "Test Patient",
  dob: "1950-01-01",
};
const chfCondition = {
  canonical_name: "Congestive heart failure",
  code: "I50.9",
  condition_name: "CHF",
  is_active: true,
};

function integratedSession(workflow, conditions = [chfCondition]) {
  return createQuestionSession(buildIntegratedSessionInput({
    conditions,
    patient,
    sessionId: `${workflow}-session`,
    workflow,
  }), { now: NOW });
}

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

function complete(session) {
  let current = session;
  let count = 0;
  while (current.status === "active") {
    const next = getNextQuestion(current);
    assert.ok(next);
    const question = getQuestion(next.questionId);
    assert.ok(question);
    current = answerSessionQuestion(
      current,
      next.questionId,
      neutralAnswer(question),
      new Date(Date.parse(NOW) + (++count * 60_000)).toISOString(),
    ).session;
    assert.ok(count < 100);
  }
  return current;
}

test("integrated intake completes through engine-selected questions", () => {
  const completed = complete(integratedSession("intake"));
  assert.equal(completed.status, "completed");
  assert.equal(completed.progress.completionPercentage, 100);
  assert.ok(completed.summary.billingRelevantDocumentation.length > 0);
  assert.equal(persistenceStatus(completed), "completed");
});

test("integrated monthly check-in completes without a template questionnaire", () => {
  const session = integratedSession("monthly_checkin");
  assert.ok(session.activeModuleIds.includes("chf"));
  const completed = complete(session);
  assert.equal(completed.status, "completed");
  assert.equal(completed.progress.requiredQuestionsRemaining, 0);
});

test("pause and resume survive persisted JSON with the exact next question", () => {
  const session = integratedSession("intake");
  const nextId = getNextQuestion(session)?.questionId;
  const paused = pauseQuestionSession(session, "2026-07-14T15:05:00.000Z");
  const restored = sessionStateFromJson(sessionStateToJson(paused));
  const resumed = resumeQuestionSession(restored, "2026-07-14T15:10:00.000Z");
  assert.equal(getNextQuestion(resumed)?.questionId, nextId);
  assert.ok(deriveSessionTelemetry(paused, resumed).some((event) => event.action === "question_session.resumed"));
});

test("branch activation is emitted from engine state changes", () => {
  const before = integratedSession("monthly_checkin");
  const after = answerSessionQuestion(
    before,
    "ccm.symptom.shortness_of_breath",
    true,
    "2026-07-14T15:01:00.000Z",
  ).session;
  const actions = deriveSessionTelemetry(before, after, "ccm.symptom.shortness_of_breath").map((event) => event.action);
  assert.ok(actions.includes("question_session.question_answered"));
  assert.ok(actions.includes("question_session.branch_activated"));
  assert.ok(after.activeQuestionIds.includes("ccm.symptom.sob_severity"));
});

test("summary and coordinator review payload come directly from engine state", () => {
  const before = integratedSession("monthly_checkin");
  const after = answerSessionQuestion(
    before,
    "ccm.chf.rapid_weight_gain",
    true,
    "2026-07-14T15:02:00.000Z",
  ).session;
  assert.equal(after.coordinatorReviewRequired, true);
  assert.equal(after.providerReviewRequired, true);
  assert.ok(after.summary.suggestedCoordinatorActions.some((task) => task.reason === "rapid_weight_gain"));
  assert.ok(after.summary.suggestedProviderReview.some((flag) => flag.code === "rapid_weight_gain"));
});

test("legacy check-ins remain distinguishable from engine sessions", () => {
  assert.equal(isLegacyCheckIn(null), true);
  assert.equal(hasSessionEngineMarker({}), false);
  assert.equal(hasSessionEngineMarker({ question_session_engine_version: 1 }), true);
  assert.equal(isLegacyCheckIn({ id: "session-row" }), false);
});

test("client payload preserves state version and canonical next question", () => {
  const session = integratedSession("monthly_checkin");
  const record = {
    id: "row-1",
    session_state: sessionStateToJson(session),
    state_version: 3,
    status: "draft",
  };
  const payload = toQuestionSessionPayload(record, session);
  assert.equal(payload.stateVersion, 3);
  assert.equal(payload.currentQuestion?.questionId, getNextQuestion(session)?.questionId);
  assert.ok(payload.currentQuestion?.currentSection);
});
