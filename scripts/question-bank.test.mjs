import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAnswerCondition,
  resolveVisibleQuestions,
} from "../lib/ccm/question-bank/branching.ts";
import { CONDITION_MODULES, findConditionModule } from "../lib/ccm/question-bank/conditions.ts";
import {
  QUESTION_BANK,
  deserializeQuestionResponse,
  getQuestion,
  resolveQuestionVersion,
  searchQuestions,
  serializeQuestionResponse,
} from "../lib/ccm/question-bank/questions.ts";
import { validateQuestionAnswer } from "../lib/ccm/question-bank/validation.ts";

test("shortness-of-breath branch reveals detail questions only after a yes answer", () => {
  const seed = ["ccm.symptom.shortness_of_breath"];
  assert.deepEqual(resolveVisibleQuestions(seed, {}, QUESTION_BANK).map((question) => question.id), seed);

  const visible = resolveVisibleQuestions(
    seed,
    { "ccm.symptom.shortness_of_breath": true },
    QUESTION_BANK,
  ).map((question) => question.id);
  assert.ok(visible.includes("ccm.symptom.sob_onset"));
  assert.ok(visible.includes("ccm.symptom.sob_provider_notified"));
});
test("medication reasons support nested branching", () => {
  const visible = resolveVisibleQuestions(
    ["ccm.medication.has_issue"],
    {
      "ccm.medication.has_issue": true,
      "ccm.medication.issue_reasons": ["side_effects", "cost"],
    },
    QUESTION_BANK,
  ).map((question) => question.id);
  assert.ok(visible.includes("ccm.medication.issue_reasons"));
  assert.ok(visible.includes("ccm.medication.side_effect_detail"));
  assert.equal(evaluateAnswerCondition(["side_effects"], { operator: "contains", value: "side_effects" }), true);
});

test("validation normalizes values and enforces answer constraints", () => {
  const bloodPressure = getQuestion("ccm.bp.latest_systolic");
  const medicationIssue = getQuestion("ccm.medication.has_issue");
  assert.ok(bloodPressure && medicationIssue);
  assert.deepEqual(validateQuestionAnswer(bloodPressure, "142"), {
    valid: true,
    errors: [],
    normalizedValue: 142,
  });
  assert.equal(validateQuestionAnswer(bloodPressure, 400).valid, false);
  assert.equal(validateQuestionAnswer(medicationIssue, "yes").normalizedValue, true);
});

test("historical question versions remain resolvable", () => {
  const current = resolveQuestionVersion("ccm.general.self_rated_health");
  const historical = resolveQuestionVersion("ccm.general.self_rated_health", 1);
  assert.equal(current?.version, 2);
  assert.equal(historical?.version, 1);
  assert.equal(historical?.text, "In general, how is your health?");
  assert.equal(resolveQuestionVersion("ccm.general.self_rated_health", 99), undefined);
});

test("response serialization preserves stable id and answered version", () => {
  const response = {
    questionId: "ccm.general.self_rated_health",
    questionVersion: 1,
    answer: "good",
    answeredAt: "2026-07-14T12:00:00.000Z",
  };
  const serialized = serializeQuestionResponse(response);
  assert.deepEqual(deserializeQuestionResponse(serialized), response);
  assert.match(serialized, /"questionVersion":1/);
});

test("search and condition modules compose shared questions", () => {
  const sharedMedicationQuestions = searchQuestions("medication", {
    conditionIds: ["diabetes", "hypertension"],
    contexts: ["monthly_checkin"],
  });
  assert.ok(sharedMedicationQuestions.some((question) => question.id === "ccm.medication.has_issue"));
  assert.equal(CONDITION_MODULES.length, 9);
  assert.equal(findConditionModule("HTN")?.id, "hypertension");
  assert.ok(findConditionModule("CHF")?.monthlyQuestionIds.includes("ccm.symptom.shortness_of_breath"));
});
