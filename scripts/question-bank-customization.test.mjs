import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CANONICAL_SUGGESTED_QUESTION_BANKS,
  favoritesBeforeIcdSearch,
  resolveCustomizedSuggestedQuestionBank,
  resolveQuestionBankFavorites,
  toAnonymousContributionPayload,
  validateQuestionBankCustomization,
} from "../lib/ccm/question-banks/index.ts";
import { SUGGESTED_QUESTION_REGISTRY } from "../lib/ccm/question-bank/questions.ts";

const NOW = "2026-07-15T12:00:00.000Z";
const identity = {
  clinicId: "clinic-1",
  providerId: "provider-1",
  coordinatorId: "coordinator-1",
};

function owner(scope) {
  if (scope === "clinic") {
    return { scope, clinicId: identity.clinicId, providerId: null, coordinatorId: null };
  }
  if (scope === "provider") {
    return { scope, clinicId: identity.clinicId, providerId: identity.providerId, coordinatorId: null };
  }
  return { scope, ...identity };
}

function override(scope, changes, extra = {}) {
  return {
    id: `${scope}-override-${extra.version ?? 1}`,
    ...owner(scope),
    bankId: "ccm-bank.essential_hypertension",
    canonicalConditionId: "essential_hypertension",
    version: 1,
    state: "active",
    changes,
    changeNote: null,
    createdBy: "user-1",
    createdAt: NOW,
    ...extra,
  };
}

function favorite(scope, condition, displayOrder, extra = {}) {
  return {
    id: `${scope}-${condition}-${extra.version ?? 1}`,
    ...owner(scope),
    canonicalConditionId: condition,
    favorite: true,
    displayOrder,
    version: 1,
    state: "active",
    createdBy: "user-1",
    createdAt: NOW,
    ...extra,
  };
}

function validationInput(data = {}) {
  return {
    banks: CANONICAL_SUGGESTED_QUESTION_BANKS,
    questionIds: SUGGESTED_QUESTION_REGISTRY.map((question) => question.id),
    ...data,
  };
}

test("resolver applies System -> Clinic -> Provider -> Coordinator without mutating the canonical bank", () => {
  const original = structuredClone(CANONICAL_SUGGESTED_QUESTION_BANKS.find((bank) =>
    bank.canonicalConditionId === "essential_hypertension"));
  const overrides = [
    override("clinic", [
      { questionId: "ccm.bp.latest_systolic", included: false },
      { questionId: "ccm.medication.has_issue", displayOrder: 38 },
    ]),
    override("provider", [
      {
        questionId: "ccm.bp.latest_systolic",
        included: true,
        displayOrder: 22,
        defaultSelected: false,
        selectionLevel: "optional",
      },
      { questionId: "ccm.medication.has_issue", displayOrder: 36 },
    ]),
    override("coordinator", [
      {
        questionId: "ccm.medication.has_issue",
        displayOrder: 24,
        selectionLevel: "required",
      },
    ]),
  ];

  const resolved = resolveCustomizedSuggestedQuestionBank({
    canonicalConditionId: "essential_hypertension",
    identity,
  }, { overrides });
  assert.ok(resolved);
  assert.deepEqual(resolved.appliedOverrides.map((item) => item.scope), ["clinic", "provider", "coordinator"]);
  const restored = resolved.questions.find((question) => question.questionId === "ccm.bp.latest_systolic");
  assert.equal(restored?.displayOrder, 22);
  assert.equal(restored?.defaultSelected, false);
  const medication = resolved.questions.find((question) => question.questionId === "ccm.medication.has_issue");
  assert.equal(medication?.displayOrder, 24);
  assert.equal(medication?.required, true);
  assert.deepEqual(medication?.appliedScopes, ["clinic", "provider", "coordinator"]);
  assert.deepEqual(
    CANONICAL_SUGGESTED_QUESTION_BANKS.find((bank) => bank.canonicalConditionId === "essential_hypertension"),
    original,
  );
});

test("latest retired override version falls back to the parent scope", () => {
  const records = [
    override("clinic", [{ questionId: "ccm.bp.latest_systolic", included: false }]),
    override("provider", [{ questionId: "ccm.bp.latest_systolic", included: false }]),
    override("provider", [], { id: "provider-override-2", version: 2, state: "retired" }),
  ];
  const resolved = resolveCustomizedSuggestedQuestionBank({
    canonicalConditionId: "essential_hypertension",
    identity,
  }, { overrides: records });
  assert.ok(resolved);
  assert.equal(resolved.questions.some((question) => question.questionId === "ccm.bp.latest_systolic"), false);
  assert.deepEqual(resolved.appliedOverrides.map((item) => item.scope), ["clinic"]);
});

test("clinic-created custom questions remain separate and can be included by override", () => {
  const customQuestions = [{
    id: "custom-row-1",
    questionId: "custom.test-clinic-question",
    ownerId: identity.clinicId,
    scope: "clinic",
    clinicId: identity.clinicId,
    canonicalConditionId: "essential_hypertension",
    text: "Clinic-authored test prompt?",
    helperText: "",
    answerType: "text",
    contexts: ["monthly_checkin"],
    version: 1,
    state: "active",
    createdBy: "user-1",
    createdAt: NOW,
  }];
  const overrides = [override("clinic", [{
    questionId: "custom.test-clinic-question",
    included: true,
    displayOrder: 80,
    defaultSelected: false,
    selectionLevel: "optional",
  }])];
  const monthly = resolveCustomizedSuggestedQuestionBank({
    canonicalConditionId: "essential_hypertension",
    context: "monthly_checkin",
    identity,
  }, { customQuestions, overrides });
  const annual = resolveCustomizedSuggestedQuestionBank({
    canonicalConditionId: "essential_hypertension",
    context: "annual_review",
    identity,
  }, { customQuestions, overrides });
  const custom = monthly?.questions.find((question) => question.questionId === "custom.test-clinic-question");
  assert.equal(custom?.source, "clinic_custom");
  assert.equal(custom?.definition.version, 1);
  assert.equal(annual?.questions.some((question) => question.questionId === custom?.questionId), false);
});

test("resolution is deterministic for identical inputs", () => {
  const data = { overrides: [override("clinic", [{ questionId: "ccm.bp.monitoring_barrier", displayOrder: 25 }])] };
  const input = { canonicalConditionId: "essential_hypertension", identity };
  assert.deepEqual(
    resolveCustomizedSuggestedQuestionBank(input, data),
    resolveCustomizedSuggestedQuestionBank(input, data),
  );
});

test("favorites merge by precedence and appear before ICD search results", () => {
  const favorites = [
    favorite("clinic", "essential_hypertension", 20),
    favorite("provider", "type_2_diabetes", 10),
    favorite("coordinator", "essential_hypertension", 20, { favorite: false }),
    favorite("coordinator", "copd", 5),
  ];
  const resolved = resolveQuestionBankFavorites(identity, favorites);
  assert.deepEqual(resolved.map((item) => item.canonicalConditionId), ["copd", "type_2_diabetes"]);
  const search = ["essential_hypertension", "copd", "chronic_kidney_disease"]
    .map((condition) => CANONICAL_SUGGESTED_QUESTION_BANKS.find((bank) => bank.canonicalConditionId === condition));
  const discovery = favoritesBeforeIcdSearch(resolved, search);
  assert.deepEqual(discovery.slice(0, 2).map((item) => item.source), ["favorite", "favorite"]);
  assert.equal(discovery.filter((item) => item.canonicalConditionId === "copd").length, 1);
  assert.equal(discovery.at(-1)?.source, "icd_search");
});

test("validation rejects orphan override targets and conflicting scope owners", () => {
  const result = validateQuestionBankCustomization(validationInput({ overrides: [
    override("provider", [{ questionId: "ccm.missing.question", included: false }], {
      providerId: null,
      coordinatorId: "wrong-owner",
    }),
    override("clinic", [], { id: "orphan-bank", bankId: "ccm-bank.missing" }),
  ] }));
  const codes = new Set(result.errors.map((error) => error.code));
  assert.equal(result.valid, false);
  assert.ok(codes.has("conflicting_scope"));
  assert.ok(codes.has("orphan_question"));
  assert.ok(codes.has("orphan_bank"));
});

test("validation rejects duplicate versions and invalid final display-order conflicts", () => {
  const duplicate = override("clinic", [{ questionId: "ccm.bp.latest_systolic", displayOrder: 30 }], { id: "duplicate-id" });
  const result = validateQuestionBankCustomization(validationInput({
    overrides: [duplicate, { ...duplicate, id: "duplicate-id-2" }],
  }));
  assert.ok(result.errors.some((error) => error.code === "duplicate_version"));
  assert.throws(() => resolveCustomizedSuggestedQuestionBank({
    canonicalConditionId: "essential_hypertension",
    identity,
  }, { overrides: [duplicate] }), /conflicting display order 30/i);
});

test("anonymous contribution payload includes only aggregate opted-in metadata", () => {
  const candidate = {
    id: "candidate-1",
    canonicalConditionId: "essential_hypertension",
    question: "Clinic-authored test prompt?",
    context: "monthly_checkin",
    usageCount: 12,
    optInStatus: "opted_in",
    anonymous: true,
    noPhiAttested: true,
    createdBy: null,
    createdAt: NOW,
  };
  assert.deepEqual(toAnonymousContributionPayload(candidate), {
    id: "candidate-1",
    canonicalConditionId: "essential_hypertension",
    question: "Clinic-authored test prompt?",
    context: "monthly_checkin",
    usageCount: 12,
  });
  assert.equal(validateQuestionBankCustomization(validationInput({ contributions: [candidate] })).valid, true);
});

test("anonymous contribution upload requires opt-in, no-PHI attestation, and PHI screening", () => {
  const base = {
    id: "candidate-2",
    canonicalConditionId: "essential_hypertension",
    question: "Clinic-authored test prompt?",
    context: "monthly_checkin",
    usageCount: 1,
    optInStatus: "not_opted_in",
    anonymous: true,
    noPhiAttested: true,
    createdBy: null,
    createdAt: NOW,
  };
  assert.throws(() => toAnonymousContributionPayload(base), /explicitly opted in/i);
  assert.throws(() => toAnonymousContributionPayload({
    ...base,
    optInStatus: "opted_in",
    question: "Contact test@example.com?",
  }), /potential PHI/i);
});

test("persistence schema isolates candidates and preserves customization history", async () => {
  const sql = await readFile("supabase/migrations/015_question_bank_customization.sql", "utf8");
  assert.match(sql, /create table if not exists public\.question_bank_override_versions/i);
  assert.match(sql, /create table if not exists public\.question_bank_custom_question_versions/i);
  assert.match(sql, /create table if not exists public\.question_bank_favorite_versions/i);
  assert.match(sql, /create table if not exists public\.question_contribution_candidates/i);
  assert.match(sql, /question_bank_override_immutable/i);
  assert.match(sql, /No policy permits canonical question or canonical bank writes/i);
});
