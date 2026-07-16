import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { buildAuditArtifacts } from "./icd/audit-icd-knowledge.mjs";

test("audit categories cover every FAIL and unmapped PASS record exactly once", async () => {
  const { audit } = await buildAuditArtifacts();
  assert.equal(audit.failCategories.reduce((sum, category) => sum + category.count, 0), audit.classifications.FAIL);
  assert.equal(audit.unmappedPass.groups.reduce((sum, group) => sum + group.count, 0), audit.unmappedPass.total);
  assert.equal(new Set(audit.failCategories.map((category) => category.id)).size, audit.failCategories.length);
  assert.equal(new Set(audit.unmappedPass.groups.map((group) => group.id)).size, audit.unmappedPass.groups.length);
});

test("audit creates conservative review queues without reclassification", async () => {
  const { audit, artifacts } = await buildAuditArtifacts();
  assert.equal(audit.potentialFalseFail.total, 9073);
  assert.equal(audit.potentialPassReview.total, 1058);
  assert.equal(audit.readyForBroadQuestionBankGeneration, false);
  assert.ok(audit.potentialFalseFail.categories.some((item) => item.id === "fracture_healing_complication"));
  assert.ok(audit.potentialPassReview.categories.some((item) => item.id === "blanket_congenital_chapter_pass"));

  const protectedNames = new Set(["icd-classifications.json", "canonical-conditions.json", "duplicate-groups.json"]);
  assert.ok([...artifacts.keys()].every((filePath) => !protectedNames.has(path.basename(filePath))));
});

test("Medicare relevance and stability cover every canonical condition", async () => {
  const { audit } = await buildAuditArtifacts();
  assert.equal(audit.canonicalReview.total, 81);
  assert.equal(audit.medicareRelevance.conditions.length, 81);
  assert.equal(audit.medicareRelevance.summary.reduce((sum, item) => sum + item.count, 0), 81);
  assert.ok(audit.medicareRelevance.conditions.every((item) => ["COMMON", "OCCASIONAL", "RARE"].includes(item.relevance)));
  assert.equal(audit.stability.canonicalIdsUnique, true);
  assert.equal(audit.stability.clinicalContentGroupIdsUnique, true);
});

test("audit identifies major under-fragmentation before content generation", async () => {
  const { audit } = await buildAuditArtifacts();
  const splits = new Set(audit.canonicalReview.splitOpportunities.map((item) => item.id));
  assert.ok(splits.has("peripheral_vascular_disease"));
  assert.ok(splits.has("malignancy"));
  assert.ok(splits.has("rheumatoid_arthritis"));
  assert.ok(audit.stability.score < 80);
  assert.ok(audit.overallConfidence.score < 80);
});
