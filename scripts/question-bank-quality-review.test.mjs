import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  validateDefaultSuggestedQuestionBankCatalog,
} from "../lib/ccm/question-banks/index.ts";
import { SUGGESTED_QUESTION_REGISTRY } from "../lib/ccm/question-bank/questions.ts";
import {
  COMMON_CONDITION_IDS,
  QUALITY_REVIEWED_CONDITION_IDS,
} from "./clinical-content-config.mjs";
import qualitySummary from "../data/question-banks/review/quality-review-summary.json" with { type: "json" };
import urgentReview from "../data/question-banks/review/quality-urgent-review.json" with { type: "json" };

const bankByCondition = new Map(CANONICAL_SUGGESTED_QUESTION_BANKS.map((bank) => [bank.canonicalConditionId, bank]));

function ids(conditionId) {
  return bankByCondition.get(conditionId).questionReferences.map((reference) => reference.questionId);
}

test("quality review covers every COMMON bank and required high-value additions", () => {
  assert.equal(QUALITY_REVIEWED_CONDITION_IDS.length, 29);
  assert.ok(COMMON_CONDITION_IDS.every((conditionId) => QUALITY_REVIEWED_CONDITION_IDS.includes(conditionId)));
  for (const conditionId of ["asthma", "generalized_anxiety_disorder", "parkinson_disease", "lumbar_spinal_stenosis", "fibromyalgia"]) {
    assert.ok(QUALITY_REVIEWED_CONDITION_IDS.includes(conditionId));
  }
  assert.equal(qualitySummary.metrics.banksReviewed, 29);
  assert.equal(qualitySummary.metrics.banksImproved, 29);
});

test("reviewed banks reduce cognitive load without becoming empty or oversized", () => {
  const banks = QUALITY_REVIEWED_CONDITION_IDS.map((conditionId) => bankByCondition.get(conditionId));
  assert.ok(banks.every((bank) => bank.questionReferences.length >= 6 && bank.questionReferences.length <= 12));
  assert.ok(banks.every((bank) => bank.questionReferences.filter((reference) => reference.defaultSelected).length >= 4));
  assert.ok(qualitySummary.metrics.averageBankSizeAfter < qualitySummary.metrics.averageBankSizeBefore);
  assert.equal(qualitySummary.metrics.largestBankAfter, 12);
  assert.equal(qualitySummary.metrics.smallestBankAfter, 6);
});

test("known duplicate and filler concepts are removed from high-value banks", () => {
  assert.ok(!ids("type_2_diabetes").includes("ccm.vascular.foot_wound"));
  assert.ok(!ids("chronic_heart_failure").includes("ccm.ckd.swelling_change"));
  assert.ok(!ids("chronic_kidney_disease").includes("ccm.chf.swelling_change"));
  assert.ok(!ids("copd").includes("ccm.symptom.shortness_of_breath"));
  assert.ok(!ids("obesity").includes("ccm.hospital.had_admission"));
  assert.ok(!ids("obesity").includes("ccm.emergency.had_visit"));
  assert.ok(!ids("sleep_apnea").includes("ccm.sleep.treatment_barrier"));
  assert.equal(qualitySummary.metrics.duplicateConceptsRemoved, 7);
});

test("question order prioritizes disease status before treatment and goals", () => {
  for (const conditionId of QUALITY_REVIEWED_CONDITION_IDS) {
    const bank = bankByCondition.get(conditionId);
    const goalIndex = bank.questionReferences.findIndex((reference) => reference.questionId === "ccm.goal.priority");
    const medicationIndex = bank.questionReferences.findIndex((reference) => reference.questionId === "ccm.medication.has_issue");
    assert.equal(goalIndex, bank.questionReferences.length - 1, `${conditionId} goal should be last`);
    assert.ok(medicationIndex === -1 || medicationIndex > 0, `${conditionId} medication should follow status questions`);
  }
});

test("patient goals are optional and excluded from monthly-only repetition", () => {
  for (const conditionId of QUALITY_REVIEWED_CONDITION_IDS) {
    const goal = bankByCondition.get(conditionId).questionReferences.find((reference) => reference.questionId === "ccm.goal.priority");
    assert.ok(goal);
    assert.equal(goal.selectionLevel, "optional");
    assert.equal(goal.defaultSelected, false);
    assert.ok(!goal.applicableContexts.includes("monthly_checkin"));
    assert.ok(goal.applicableContexts.includes("care_plan_review"));
  }
});

test("Parkinson bank gains only the three clinically necessary new questions", () => {
  const parkinsonIds = ids("parkinson_disease");
  assert.ok(parkinsonIds.includes("ccm.parkinson.mobility_change"));
  assert.ok(parkinsonIds.includes("ccm.parkinson.wearing_off"));
  assert.ok(parkinsonIds.includes("ccm.parkinson.swallowing"));
  assert.equal(qualitySummary.metrics.newReusableQuestions, 3);
  assert.equal(qualitySummary.metrics.newConditionSpecificQuestions, 3);
});

test("related diseases share a monitoring philosophy without identical banks", () => {
  const shared = (left, right) => ids(left).filter((questionId) => ids(right).includes(questionId));
  assert.ok(shared("glaucoma", "age_related_macular_degeneration").includes("ccm.vision.sudden_change"));
  assert.ok(shared("copd", "asthma").includes("ccm.pulmonary.urgent_breathing"));
  assert.ok(shared("major_depressive_disorder", "generalized_anxiety_disorder").includes("ccm.sleep.quality"));
  assert.ok(shared("osteoarthritis", "fibromyalgia").includes("ccm.pain.function_interference"));
  assert.notDeepEqual(ids("glaucoma"), ids("age_related_macular_degeneration"));
  assert.notDeepEqual(ids("copd"), ids("asthma"));
});

test("every red-flag question has monthly context and provider notification", () => {
  assert.equal(urgentReview.questions.length, 28);
  assert.ok(urgentReview.questions.every((item) => item.monthlyAppropriate));
  assert.ok(urgentReview.questions.every((item) => item.providerNotification));
  assert.ok(urgentReview.questions.every((item) => ["same_day", "urgent"].includes(item.urgency)));
});

test("barrier questions generate coordinator tasks and rewritten text remains unique", () => {
  const barrier = SUGGESTED_QUESTION_REGISTRY.find((question) => question.id === "ccm.treatment.plan_barrier");
  assert.ok(barrier.followUpTriggers.some((trigger) => trigger.actions.some((action) => action.type === "create_care_coordination_task")));
  const normalized = SUGGESTED_QUESTION_REGISTRY.map((question) => question.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  assert.equal(new Set(normalized).size, normalized.length);
  assert.ok(SUGGESTED_QUESTION_REGISTRY.filter((question) => question.reviewStatus === "DRAFT_CLINICAL_REVIEW").every((question) => question.text.endsWith("?")));
});

test("quality report contains a complete section for every reviewed condition", async () => {
  const report = await readFile("docs/clinical/question-bank-quality-review.md", "utf8");
  for (const condition of qualitySummary.conditions) {
    assert.match(report, new RegExp(`^## ${condition.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));
  }
  assert.match(report, /Questions generating provider review:/);
  assert.match(report, /Questions generating coordinator action:/);
  assert.match(report, /Remaining concerns:/);
});

test("refined catalog passes complete structural validation", () => {
  const result = validateDefaultSuggestedQuestionBankCatalog();
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join("\n"));
});
