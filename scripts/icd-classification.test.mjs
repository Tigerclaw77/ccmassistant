import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  DEFAULT_CANONICAL_CONDITIONS,
  DEFAULT_CLASSIFICATION_OVERRIDES,
  DEFAULT_CLINICAL_CONTENT_GROUPS,
  DEFAULT_ICD_CLASSIFICATIONS,
  classifyIcdCode,
  createFailDiagnosisOverride,
  createSelectedUnsureGeneration,
  findCanonicalCondition,
  findIcdClassificationByCode,
  findIcdClassificationsByTitle,
  findClinicalContentGroupForIcdCode,
  getDefaultIcdKnowledgeBase,
  getIcdMappingsForCanonicalCondition,
  listFailIcdClassifications,
  listPassIcdClassifications,
  listUnmappedPassIcdClassifications,
  listUnsureIcdClassifications,
  planConditionProfileGeneration,
  validateIcdKnowledgeBase,
} from "../lib/ccm/icd/index.ts";
import { validateArtifacts } from "./icd/validate-icd-artifacts.mjs";

test("classifies representative chronic ICD codes as PASS with canonical mappings", () => {
  const hypertension = classifyIcdCode("i10");
  const diabetes = classifyIcdCode("E119");

  assert.equal(hypertension.classification, "PASS");
  assert.equal(hypertension.canonicalConditionId, "essential_hypertension");
  assert.equal(hypertension.generatedStatus, "mapped_existing");
  assert.match(hypertension.rationale, /chronic/i);

  assert.equal(diabetes.classification, "PASS");
  assert.equal(diabetes.canonicalConditionId, "type_2_diabetes");
});

test("maps many ICD codes to one canonical condition without duplicating profiles", () => {
  const diabetesMappings = getIcdMappingsForCanonicalCondition("type_2_diabetes");
  const diabetesCodes = diabetesMappings.map((mapping) => mapping.code);

  assert.ok(diabetesCodes.includes("E11.9"));
  assert.ok(diabetesCodes.includes("E11.65"));
  assert.ok(diabetesCodes.includes("E11.22"));
  assert.equal(findCanonicalCondition("T2DM")?.id, "type_2_diabetes");
});

test("canonical lookup resolves IDs, names, and aliases", () => {
  assert.equal(findCanonicalCondition("CHF")?.id, "chronic_heart_failure");
  assert.equal(findCanonicalCondition("Chronic obstructive pulmonary disease")?.id, "copd");
  assert.equal(findCanonicalCondition("renal")?.id, "chronic_kidney_disease");
});

test("search supports ICD, title, status lists, and unmapped PASS records", () => {
  const byCode = findIcdClassificationByCode("G20A1");
  const byTitle = findIcdClassificationsByTitle("heart failure");
  const customUnmappedPass = {
    code: "B20",
    title: "Human immunodeficiency virus disease",
    classification: "PASS",
    rationale: "HIV can be a chronic condition requiring longitudinal management.",
    canonicalConditionId: null,
    reviewStatus: "system_reviewed",
    generatedStatus: "pending_generation",
  };

  assert.equal(byCode?.canonicalConditionId, "parkinson_disease");
  assert.ok(byTitle.some((record) => record.code === "I50.9"));
  assert.equal(listPassIcdClassifications().length, 11192);
  assert.ok(listFailIcdClassifications().length < listUnsureIcdClassifications().length);
  assert.ok(listUnsureIcdClassifications().some((record) => record.code === "R53.83"));
  assert.deepEqual(listUnmappedPassIcdClassifications([customUnmappedPass]), [customUnmappedPass]);
});

test("PASS records with existing canonical mappings do not generate duplicate content", () => {
  const classification = classifyIcdCode("J44.9");
  const plan = planConditionProfileGeneration(classification);

  assert.equal(plan.action, "map_existing");
  assert.equal(plan.canonicalCondition?.id, "copd");
  assert.equal(plan.generatedCondition, null);
});

test("PASS records without canonical mappings generate one placeholder profile", () => {
  const classification = classifyIcdCode({
    code: "B20",
    title: "Human immunodeficiency virus disease",
  }, []);
  const plan = planConditionProfileGeneration(classification);

  assert.equal(classification.classification, "UNSURE");
  assert.equal(plan.action, "defer_until_selected");

  const customPass = {
    ...classification,
    classification: "PASS",
    rationale: "HIV can be managed as a chronic longitudinal condition.",
    generatedStatus: "pending_generation",
  };
  const passPlan = planConditionProfileGeneration(customPass);

  assert.equal(passPlan.action, "generate_profile");
  assert.equal(passPlan.generatedCondition?.profileStatus, "generated_placeholder");
  assert.deepEqual(passPlan.generatedCondition?.content.icdMappings, ["B20"]);
  assert.deepEqual(passPlan.generatedCondition?.content.questionModules, []);
});

test("UNSURE classifications defer automatically but can generate after clinic selection", () => {
  const unsure = classifyIcdCode("R53.83");
  const automaticPlan = planConditionProfileGeneration(unsure);
  const selectedPlan = createSelectedUnsureGeneration(unsure, {
    userId: "user-1",
    reason: "Clinic selected fatigue as a managed diagnosis for this patient.",
    timestamp: "2026-07-14T15:00:00.000Z",
  });

  assert.equal(unsure.classification, "UNSURE");
  assert.equal(automaticPlan.action, "defer_until_selected");
  assert.equal(automaticPlan.generatedCondition, null);
  assert.equal(selectedPlan.action, "generate_after_selection");
  assert.equal(selectedPlan.generatedCondition?.content.icdMappings[0], "R53.83");
});

test("FAIL classifications block generation unless an authorized override records recovery metadata", () => {
  const fail = classifyIcdCode("Z23");
  const automaticPlan = planConditionProfileGeneration(fail);
  const override = createFailDiagnosisOverride(fail, {
    userId: "clinical-admin-1",
    reason: "Clinic explicitly requested a local education workflow for this diagnosis.",
    timestamp: "2026-07-14T16:00:00.000Z",
  });
  const unchangedMaster = classifyIcdCode("Z23");

  assert.equal(fail.classification, "FAIL");
  assert.equal(automaticPlan.action, "block_generation");
  assert.equal(automaticPlan.generatedCondition, null);
  assert.equal(override.originalClassification, "FAIL");
  assert.equal(override.reviewStatus, "authorized_override");
  assert.equal(override.timestamp, "2026-07-14T16:00:00.000Z");
  assert.equal(override.generatedCondition.profileStatus, "generated_placeholder");
  assert.equal(unchangedMaster.classification, "FAIL");
});

test("validates the default knowledge base", () => {
  const result = validateIcdKnowledgeBase(getDefaultIcdKnowledgeBase());

  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("imports the complete current CMS catalog with exact code identity and complete classification", () => {
  assert.equal(DEFAULT_ICD_CLASSIFICATIONS.length, 98186);
  assert.equal(DEFAULT_ICD_CLASSIFICATIONS.filter((record) => record.billable).length, 74719);
  assert.ok(DEFAULT_ICD_CLASSIFICATIONS.every((record) => record.code && record.officialTitle && record.rationale));
  assert.ok(DEFAULT_ICD_CLASSIFICATIONS.every((record) => ["PASS", "FAIL", "UNSURE"].includes(record.classification)));

  const knee = findIcdClassificationByCode("M1711");
  const fail = findIcdClassificationByCode("Z23");
  assert.equal(knee?.code, "M17.11");
  assert.equal(knee?.officialTitle, "Unilateral primary osteoarthritis, right knee");
  assert.equal(fail?.classification, "FAIL");
});

test("collapses laterality while preserving stage, severity, and complication variants", () => {
  const rightKnee = findClinicalContentGroupForIcdCode("M17.11");
  const leftKnee = findClinicalContentGroupForIcdCode("M17.12");
  const bilateralKnee = findClinicalContentGroupForIcdCode("M17.0");
  assert.equal(rightKnee?.id, "osteoarthritis__general");
  assert.equal(leftKnee?.id, rightKnee?.id);
  assert.equal(bilateralKnee?.id, rightKnee?.id);

  assert.equal(findClinicalContentGroupForIcdCode("H40.1111")?.id, findClinicalContentGroupForIcdCode("H40.1121")?.id);
  assert.notEqual(findClinicalContentGroupForIcdCode("H40.1111")?.id, findClinicalContentGroupForIcdCode("H40.1113")?.id);
  assert.notEqual(findClinicalContentGroupForIcdCode("N18.31")?.id, findClinicalContentGroupForIcdCode("N18.5")?.id);
  assert.notEqual(findClinicalContentGroupForIcdCode("N18.5")?.id, findClinicalContentGroupForIcdCode("N18.6")?.id);
  assert.notEqual(findClinicalContentGroupForIcdCode("E11.9")?.id, findClinicalContentGroupForIcdCode("E11.22")?.id);
});

test("prevents one-code-per-profile expansion", () => {
  const mapped = DEFAULT_ICD_CLASSIFICATIONS.filter((record) => record.clinicalContentGroupId);
  assert.equal(DEFAULT_CLINICAL_CONTENT_GROUPS.length, 301);
  assert.ok(DEFAULT_CLINICAL_CONTENT_GROUPS.length / mapped.length < 0.05);

  const condition = DEFAULT_CANONICAL_CONDITIONS[0];
  const clinicalContentGroups = Array.from({ length: 12 }, (_, index) => ({
    id: `one_code_${index}`,
    canonicalConditionId: condition.id,
    name: `One code ${index}`,
    variant: "general",
    materialDimensions: [],
    codes: [`A00.${index}`],
  }));
  const classifications = clinicalContentGroups.map((group, index) => ({
    code: `A${String(index).padStart(2, "0")}`,
    title: `Synthetic chronic condition ${index}`,
    classification: "PASS",
    rationale: "Synthetic validation fixture.",
    canonicalConditionId: condition.id,
    clinicalContentGroupId: group.id,
    reviewStatus: "system_reviewed",
    generatedStatus: "mapped_existing",
  }));
  const result = validateIcdKnowledgeBase({ canonicalConditions: [condition], classifications, clinicalContentGroups });
  assert.ok(result.errors.some((error) => error.code === "profile_explosion"));
});

test("validates generated artifacts and reproduces them byte-for-byte", async () => {
  const validation = await validateArtifacts();
  assert.equal(validation.valid, true, validation.errors.join("\n"));

  const check = spawnSync(process.execPath, ["scripts/icd/import-cms-icd.mjs", "--check"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(check.status, 0, check.stderr || check.stdout);
  assert.match(check.stdout, /98186 CMS rows/);
});

test("validation catches duplicate IDs, duplicate mappings, invalid classifications, missing rationales, and orphans", () => {
  const validCondition = DEFAULT_CANONICAL_CONDITIONS[0];
  const duplicateCondition = { ...validCondition };
  const baseRecord = DEFAULT_CLASSIFICATION_OVERRIDES[0];
  const invalidKnowledgeBase = {
    canonicalConditions: [validCondition, duplicateCondition],
    classifications: [
      baseRecord,
      {
        ...baseRecord,
        title: "",
        classification: "MAYBE",
        rationale: "",
        canonicalConditionId: "missing_condition",
      },
    ],
  };
  const result = validateIcdKnowledgeBase(invalidKnowledgeBase);
  const codes = result.errors.map((error) => error.code);

  assert.equal(result.valid, false);
  assert.ok(codes.includes("duplicate_canonical_id"));
  assert.ok(codes.includes("duplicate_icd_code"));
  assert.ok(codes.includes("duplicate_icd_mapping"));
  assert.ok(codes.includes("invalid_classification"));
  assert.ok(codes.includes("missing_rationale"));
  assert.ok(codes.includes("missing_title"));
  assert.ok(codes.includes("orphan_mapping"));
});
