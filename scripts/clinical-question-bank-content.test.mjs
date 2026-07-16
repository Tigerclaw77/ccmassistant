import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  SUGGESTED_QUESTION_BANK_OVERRIDES,
  buildSuggestedQuestionBank,
  buildSuggestedQuestionBankForIcdCode,
  validateDefaultSuggestedQuestionBankCatalog,
  validateSuggestedQuestionBankCatalog,
} from "../lib/ccm/question-banks/index.ts";
import {
  DEFAULT_CANONICAL_CONDITIONS,
  DEFAULT_CLINICAL_CONTENT_GROUPS,
  DEFAULT_ICD_CLASSIFICATIONS,
} from "../lib/ccm/icd/mappings.ts";
import { SUGGESTED_QUESTION_REGISTRY } from "../lib/ccm/question-bank/questions.ts";

function ids(bank) {
  return bank?.questions.map((question) => question.questionId) ?? [];
}

function validationInput(banks = CANONICAL_SUGGESTED_QUESTION_BANKS, canonicalConditions = DEFAULT_CANONICAL_CONDITIONS) {
  return {
    banks,
    overrides: SUGGESTED_QUESTION_BANK_OVERRIDES,
    canonicalConditions,
    clinicalContentGroups: DEFAULT_CLINICAL_CONTENT_GROUPS,
    classifications: DEFAULT_ICD_CLASSIFICATIONS,
    questions: SUGGESTED_QUESTION_REGISTRY,
  };
}

test("lumbar spinal stenosis maps deterministically and activates neurogenic claudication", () => {
  const without = buildSuggestedQuestionBankForIcdCode("M48.061");
  const withClaudication = buildSuggestedQuestionBankForIcdCode("M48.062");
  assert.equal(without?.bankId, "ccm-bank.lumbar_spinal_stenosis");
  assert.equal(without?.variantId, null);
  assert.equal(withClaudication?.bankId, without?.bankId);
  assert.equal(withClaudication?.variantId, "neurogenic_claudication");
  assert.ok(ids(withClaudication).includes("ccm.spine.relief_with_flexion"));
  assert.match(withClaudication?.heading ?? "", /with neurogenic claudication/i);
});

test("laterality collapses to one bank while exact ICD identity remains visible", () => {
  const right = buildSuggestedQuestionBankForIcdCode("M1A.0110");
  const left = buildSuggestedQuestionBankForIcdCode("M1A.0120");
  assert.ok(right && left);
  assert.equal(right.bankId, "ccm-bank.chronic_gout");
  assert.equal(left.bankId, right.bankId);
  assert.equal(right.variantId, left.variantId);
  assert.notEqual(right.diagnosisCode, left.diagnosisCode);
  assert.match(right.heading, /right shoulder/i);
  assert.match(left.heading, /left shoulder/i);
});

test("populated banks reuse stable questions and carry include-exclude metadata", () => {
  const users = CANONICAL_SUGGESTED_QUESTION_BANKS.filter((bank) =>
    bank.questionReferences.some((reference) => reference.questionId === "ccm.treatment.plan_barrier"));
  assert.ok(users.length >= 50);
  const lumbar = CANONICAL_SUGGESTED_QUESTION_BANKS.find((bank) => bank.canonicalConditionId === "lumbar_spinal_stenosis");
  assert.ok(lumbar);
  assert.ok(lumbar.questionReferences.every((reference) =>
    typeof reference.defaultSelected === "boolean" &&
    ["required", "recommended", "optional"].includes(reference.selectionLevel) &&
    reference.applicableContexts.length > 0));
  assert.ok(lumbar.questionReferences.some((reference) => !reference.defaultSelected && reference.optional));
});

test("new question text is unique and draft metadata is complete", () => {
  const draft = SUGGESTED_QUESTION_REGISTRY.filter((question) => question.reviewStatus === "DRAFT_CLINICAL_REVIEW");
  assert.equal(draft.length, 103);
  const normalized = draft.map((question) => question.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  assert.equal(new Set(normalized).size, normalized.length);
  assert.ok(draft.every((question) =>
    question.sourceCanonicalConditionIds?.length &&
    question.contexts.length &&
    question.clinicalRationale &&
    question.followUpBehavior &&
    question.contentVersion === 1));
});

test("branching and urgent red-flag behavior resolve to existing questions", () => {
  const bowel = SUGGESTED_QUESTION_REGISTRY.find((question) => question.id === "ccm.spine.bowel_bladder_change");
  const saddle = SUGGESTED_QUESTION_REGISTRY.find((question) => question.id === "ccm.spine.saddle_numbness");
  assert.ok(bowel && saddle);
  assert.ok(bowel.followUpTriggers.some((trigger) => trigger.actions.some((action) =>
    action.type === "show_questions" && action.questionIds.includes(saddle.id))));
  assert.ok(bowel.followUpTriggers.some((trigger) => trigger.actions.some((action) =>
    action.type === "flag_for_review" && action.urgency === "urgent" && action.providerNotification)));
  assert.ok(saddle.displayWhen.some((rule) => rule.questionId === bowel.id));
});

test("context filtering returns only questions applicable to the requested context", () => {
  const all = buildSuggestedQuestionBank({ canonicalConditionId: "lumbar_spinal_stenosis" });
  const annual = buildSuggestedQuestionBank({ canonicalConditionId: "lumbar_spinal_stenosis", context: "annual_review" });
  assert.ok(all && annual);
  assert.ok(annual.questions.length < all.questions.length);
  assert.ok(annual.questions.every((question) => question.applicableContexts.includes("annual_review")));
});

test("default catalog validation covers metadata, branching, and bank size", () => {
  const result = validateDefaultSuggestedQuestionBankCatalog();
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join("\n"));
  assert.equal(result.metrics.populatedBankCount, 66);
  assert.ok(result.metrics.averageDefaultQuestionCount >= 6);
  assert.ok(result.metrics.maximumDefaultQuestionCount <= 20);
});

test("validation rejects vague canonical identities and excessive default banks", () => {
  const vagueBanks = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS);
  const vagueConditions = structuredClone(DEFAULT_CANONICAL_CONDITIONS);
  vagueBanks[0].canonicalConditionId = "fatigue";
  vagueBanks[0].sourceCanonicalConditionId = "fatigue";
  vagueConditions[0].id = "fatigue";
  const vague = validateSuggestedQuestionBankCatalog(validationInput(vagueBanks, vagueConditions));
  assert.ok(vague.errors.some((error) => error.code === "vague_canonical_condition"));

  const excessiveBanks = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS);
  const template = excessiveBanks[0].questionReferences[0];
  excessiveBanks[0].questionReferences = SUGGESTED_QUESTION_REGISTRY.slice(0, 21).map((question, index) => ({
    ...template,
    questionId: question.id,
    displayOrder: index * 10,
    defaultSelected: true,
    optional: true,
    recommended: true,
    required: false,
    selectionLevel: "recommended",
  }));
  const excessive = validateSuggestedQuestionBankCatalog(validationInput(excessiveBanks));
  assert.ok(excessive.errors.some((error) => error.code === "excessive_default_questions"));
});

test("generation is byte-deterministic", () => {
  const result = spawnSync(process.execPath, ["scripts/generate-question-bank-catalog.mjs", "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
