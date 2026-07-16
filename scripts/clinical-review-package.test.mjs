import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { buildClinicalReviewPackage } from "./generate-clinical-review-package.mjs";
import { buildClinicianFeedbackImport, parseCsv } from "./import-clinician-feedback.mjs";

const REVIEW_PACKAGE_PATH = "data/clinical-review/review-package.json";

async function reviewPackage() {
  return JSON.parse(await readFile(REVIEW_PACKAGE_PATH, "utf8"));
}

test("review package contains one complete packet for every canonical condition", async () => {
  const canonical = JSON.parse(await readFile("data/icd/canonical-conditions.json", "utf8"));
  const review = await reviewPackage();
  assert.equal(review.packetCount, 81);
  assert.equal(review.packets.length, canonical.conditions.length);
  assert.deepEqual(
    new Set(review.packets.map((packet) => packet.canonicalConditionId)),
    new Set(canonical.conditions.map((condition) => condition.id)),
  );
  for (const packet of review.packets) {
    assert.ok(packet.canonicalCondition);
    assert.ok(packet.bankId);
    assert.ok(Array.isArray(packet.icdFamilies));
    assert.ok(Array.isArray(packet.questions));
    assert.ok(Array.isArray(packet.reusedQuestions));
    assert.ok(Array.isArray(packet.newQuestions));
    assert.ok(Array.isArray(packet.intakeOnlyQuestions));
    assert.ok(Array.isArray(packet.monthlyQuestions));
    assert.ok(Array.isArray(packet.carePlanQuestions));
    assert.ok(Array.isArray(packet.redFlagQuestions));
    assert.ok(Array.isArray(packet.variants));
    assert.ok(packet.outstandingReviewConcerns.length > 0);
  }
});

test("81 condition packet files contain every required review section", async () => {
  const files = (await readdir("docs/clinical/review-packets"))
    .filter((file) => file.endsWith(".md") && file !== "index.md");
  assert.equal(files.length, 81);
  const headings = [
    "ICD Families Mapped",
    "Suggested Question Bank",
    "Reused Questions",
    "New Questions",
    "Intake-Only Questions",
    "Monthly Questions",
    "Care-Plan Questions",
    "Red-Flag Questions",
    "Variants",
    "Clinical Rationale",
    "Outstanding Review Concerns",
  ];
  for (const file of files) {
    const packet = await readFile(`docs/clinical/review-packets/${file}`, "utf8");
    headings.forEach((heading) => assert.match(packet, new RegExp(`## ${heading}`), `${file} missing ${heading}`));
    assert.doesNotMatch(packet, /`undefined`/);
  }
});

test("priority order is deterministic by prevalence, impact, uncertainty, and reuse", async () => {
  const review = await reviewPackage();
  const packets = review.packets;
  assert.deepEqual(packets.map((packet) => packet.priority.rank), Array.from({ length: 81 }, (_, index) => index + 1));
  for (let index = 1; index < packets.length; index += 1) {
    const previous = packets[index - 1].priority;
    const current = packets[index].priority;
    const previousKey = [previous.prevalenceScore, previous.impactScore, previous.uncertaintyScore, previous.reuseScore];
    const currentKey = [current.prevalenceScore, current.impactScore, current.uncertaintyScore, current.reuseScore];
    assert.ok(previousKey.some((value, keyIndex) => value > currentKey[keyIndex]) ||
      previousKey.every((value, keyIndex) => value === currentKey[keyIndex]));
  }
});

test("CSV markup files expose all clinician feedback actions and audit columns", async () => {
  const schema = JSON.parse(await readFile("data/clinical-review/feedback-schema.json", "utf8"));
  assert.deepEqual(schema.feedbackActions, [
    "approve",
    "reject",
    "rewrite",
    "optional",
    "missing_question",
    "unnecessary_question",
    "incorrect_branching",
    "incorrect_urgency",
  ]);
  for (const file of ["bank-review.csv", "question-review.csv"]) {
    const rows = parseCsv(await readFile(`data/clinical-review/${file}`, "utf8"));
    assert.ok(rows.length > 0);
    for (const header of ["reviewer", "reviewed_at", "rationale", "disposition", "accepted_by", "accepted_at"]) {
      assert.ok(Object.hasOwn(rows[0], header), `${file} missing ${header}`);
    }
  }
});

test("accepted rewrite imports exact clinician text with reviewer and version history", async () => {
  const review = await reviewPackage();
  const [source] = parseCsv(await readFile("data/clinical-review/question-review.csv", "utf8"));
  const row = {
    ...source,
    feedback_action: "rewrite",
    proposed_text: "Reviewer-provided replacement text?",
    reviewer: "Clinical Reviewer",
    reviewed_at: "2026-07-15T18:00:00Z",
    rationale: "Reviewer rationale retained verbatim.",
    disposition: "accepted",
    accepted_by: "Clinical Steward",
    accepted_at: "2026-07-15T19:00:00Z",
  };
  const imported = buildClinicianFeedbackImport([row], review);
  assert.equal(imported.acceptedChangeCount, 1);
  assert.equal(imported.canonicalContentModified, false);
  assert.equal(imported.appliesAutomatically, false);
  assert.equal(imported.changes[0].after.text, row.proposed_text);
  assert.equal(imported.changes[0].reviewer, row.reviewer);
  assert.equal(imported.changes[0].rationale, row.rationale);
  assert.equal(imported.changes[0].proposedQuestionVersion, Number(row.current_question_version) + 1);
  assert.equal(imported.changes[0].versionHistory[0].text, row.question_text);
  assert.equal(imported.changes[0].transformation, "exact_clinician_input_no_ai");
});

test("import rejects stale, orphan, incomplete, and malformed accepted feedback", async () => {
  const review = await reviewPackage();
  const [source] = parseCsv(await readFile("data/clinical-review/question-review.csv", "utf8"));
  const base = {
    ...source,
    feedback_action: "incorrect_urgency",
    proposed_urgency: "later",
    reviewer: "Clinical Reviewer",
    reviewed_at: "2026-07-15T18:00:00Z",
    rationale: "Test rationale.",
    disposition: "accepted",
    accepted_by: "Clinical Steward",
    accepted_at: "2026-07-15T19:00:00Z",
    current_bank_version: "999",
    question_id: "ccm.missing.question",
  };
  assert.throws(() => buildClinicianFeedbackImport([base], review), /bank version is stale|orphan question|supported proposed_urgency/i);
});

test("CSV parser preserves quoted commas, quotes, and line breaks", () => {
  const rows = parseCsv('id,rationale\r\n1,"A comma, quote ""and"" line\nbreak"\r\n');
  assert.deepEqual(rows, [{ id: "1", rationale: 'A comma, quote "and" line\nbreak' }]);
});

test("generation is byte-deterministic and source clinical hashes remain unchanged", async () => {
  const manifest = JSON.parse(await readFile("data/clinical-review/source-integrity.json", "utf8"));
  const generated = await buildClinicalReviewPackage();
  assert.equal(generated.packets.length, 81);
  for (const source of manifest.sourceFiles) {
    const hash = createHash("sha256").update(await readFile(source.relativePath)).digest("hex");
    assert.equal(hash, source.hash, `${source.relativePath} changed`);
  }
  for (const [relativePath, expected] of generated.output) {
    assert.equal(await readFile(relativePath, "utf8"), expected, `${relativePath} is not deterministic`);
  }
});

test("review guide documents timing, approval, import, versioning, and no-AI behavior", async () => {
  const guide = await readFile("docs/clinical/clinical-review-guide.md", "utf8");
  for (const phrase of ["Expected Time", "Approval Workflow", "Import Format", "Versioning", "never calls an AI model"]) {
    assert.match(guide, new RegExp(phrase, "i"));
  }
});
