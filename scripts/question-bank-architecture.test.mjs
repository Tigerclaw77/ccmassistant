import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

function validationInput(banks = CANONICAL_SUGGESTED_QUESTION_BANKS) {
  return {
    banks,
    overrides: SUGGESTED_QUESTION_BANK_OVERRIDES,
    canonicalConditions: DEFAULT_CANONICAL_CONDITIONS,
    clinicalContentGroups: DEFAULT_CLINICAL_CONTENT_GROUPS,
    classifications: DEFAULT_ICD_CLASSIFICATIONS,
    questions: SUGGESTED_QUESTION_REGISTRY,
  };
}

function questionIds(bank) {
  return bank.questions.map((question) => question.questionId);
}

test("one bank per canonical condition validates without duplicated question definitions", async () => {
  const result = validateDefaultSuggestedQuestionBankCatalog();
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join("\n"));
  assert.equal(result.metrics.bankCount, 81);
  assert.equal(result.metrics.canonicalConditionCount, 81);
  assert.equal(result.metrics.variantCount, 38);
  assert.equal(result.metrics.populatedBankCount, 66);
  assert.ok(result.metrics.maximumDefaultQuestionCount <= 20);
  assert.ok(result.metrics.reusedQuestionCount > 20);

  const rawCatalog = await readFile("data/question-banks/canonical-question-banks.json", "utf8");
  assert.doesNotMatch(rawCatalog, /"text"\s*:/);
});

test("right, left, and bilateral knee osteoarthritis resolve to one suggested bank", () => {
  const right = buildSuggestedQuestionBankForIcdCode("M17.11");
  const left = buildSuggestedQuestionBankForIcdCode("M17.12");
  const bilateral = buildSuggestedQuestionBankForIcdCode("M17.0");
  assert.ok(right && left && bilateral);
  assert.equal(right.bankId, "ccm-bank.osteoarthritis");
  assert.equal(left.bankId, right.bankId);
  assert.equal(bilateral.bankId, right.bankId);
  assert.deepEqual(questionIds(left), questionIds(right));
  assert.deepEqual(questionIds(bilateral), questionIds(right));
  assert.match(right.heading, /right knee/i);
});

test("glaucoma laterality collapses while severity changes the resolved variant", () => {
  const rightMild = buildSuggestedQuestionBankForIcdCode("H40.1111");
  const leftMild = buildSuggestedQuestionBankForIcdCode("H40.1121");
  const rightSevere = buildSuggestedQuestionBankForIcdCode("H40.1113");
  assert.ok(rightMild && leftMild && rightSevere);
  assert.equal(rightMild.bankId, leftMild.bankId);
  assert.equal(rightMild.variantId, null);
  assert.equal(leftMild.variantId, null);
  assert.equal(rightSevere.variantId, "severe");
  assert.ok(questionIds(rightSevere).includes("ccm.transportation.barrier"));
});

test("CKD and diabetes preserve management-changing stage and complication variants", () => {
  const stage3 = buildSuggestedQuestionBankForIcdCode("N18.31");
  const stage5 = buildSuggestedQuestionBankForIcdCode("N18.5");
  const dialysis = buildSuggestedQuestionBankForIcdCode("N18.6");
  assert.equal(stage3?.variantId, null);
  assert.equal(stage5?.variantId, "advanced_stage");
  assert.equal(dialysis?.variantId, "dialysis");
  assert.equal(stage3?.bankId, stage5?.bankId);
  assert.equal(stage5?.bankId, dialysis?.bankId);
  assert.ok(questionIds(dialysis).includes("ccm.transportation.barrier"));

  assert.equal(buildSuggestedQuestionBankForIcdCode("E11.9")?.variantId, null);
  assert.equal(buildSuggestedQuestionBankForIcdCode("E11.22")?.variantId, "kidney_complication");
});

test("many condition banks reuse the same stable question IDs", () => {
  const medicationUsers = CANONICAL_SUGGESTED_QUESTION_BANKS.filter((bank) =>
    bank.questionReferences.some((reference) => reference.questionId === "ccm.medication.has_issue"));
  assert.ok(medicationUsers.length > 35);
  assert.equal(new Set(SUGGESTED_QUESTION_REGISTRY.map((question) => question.id)).size, SUGGESTED_QUESTION_REGISTRY.length);
});

test("builder output is deterministic and sorted by display order", () => {
  const input = {
    canonicalConditionId: "malignancy",
    diagnosisTitle: "Active malignancy",
    variantId: "metastatic",
  };
  const first = buildSuggestedQuestionBank(input);
  const second = buildSuggestedQuestionBank(input);
  assert.deepEqual(first, second);
  assert.equal(first?.variantId, "metastatic");
  const orders = first?.questions.map((question) => question.displayOrder) ?? [];
  assert.deepEqual(orders, [...orders].sort((left, right) => left - right));
});

test("validation detects duplicates, empty banks, laterality IDs, and order conflicts", () => {
  const banks = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS);
  banks.push(structuredClone(banks[0]));
  banks[0].displayName = "Right hypertension";
  banks[0].questionReferences[1].displayOrder = banks[0].questionReferences[0].displayOrder;
  banks[1].questionReferences = [];
  const result = validateSuggestedQuestionBankCatalog(validationInput(banks));
  const codes = new Set(result.errors.map((error) => error.code));
  assert.ok(codes.has("duplicate_bank_id"));
  assert.ok(codes.has("duplicate_canonical_bank"));
  assert.ok(codes.has("empty_bank"));
  assert.ok(codes.has("laterality_generated_duplicate"));
  assert.ok(codes.has("question_order_conflict"));
});

test("validation detects orphan question, canonical, and content-group IDs", () => {
  const banks = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS);
  banks[0].questionReferences[0].questionId = "ccm.missing.question";
  banks[0].canonicalConditionId = "missing_condition";
  banks.find((bank) => bank.canonicalConditionId === "chronic_kidney_disease")
    .variants[0].clinicalContentGroupIds[0] = "missing_group";
  const result = validateSuggestedQuestionBankCatalog(validationInput(banks));
  const codes = new Set(result.errors.map((error) => error.code));
  assert.ok(codes.has("orphan_question_id"));
  assert.ok(codes.has("orphan_canonical_condition"));
  assert.ok(codes.has("orphan_clinical_content_group"));
  assert.ok(codes.has("missing_suggested_bank"));
});

test("validation rejects duplicate question references within a resolved variant", () => {
  const banks = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS);
  const ckd = banks.find((bank) => bank.canonicalConditionId === "chronic_kidney_disease");
  ckd.variants[0].questionReferences.push({ ...ckd.questionReferences[0], displayOrder: 999 });
  const result = validateSuggestedQuestionBankCatalog(validationInput(banks));
  assert.ok(result.errors.some((error) => error.code === "duplicate_question_reference"));
});
