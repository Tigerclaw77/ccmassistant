import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SUGGESTED_QUESTION_REGISTRY } from "../lib/ccm/question-bank/questions.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data", "clinical-review");
const PACKET_DIR = path.join(ROOT, "docs", "clinical", "review-packets");
const CHECK_ONLY = process.argv.includes("--check");

const SOURCE_PATHS = [
  "data/icd/canonical-conditions.json",
  "data/icd/canonical-audit.json",
  "data/icd/icd-classifications.json",
  "data/question-banks/canonical-question-banks.json",
  "data/question-banks/clinical-questions.json",
  "data/question-banks/review/new-questions.json",
  "data/question-banks/review/quality-review-summary.json",
  "data/question-banks/review/urgent-red-flag-logic.json",
];

const FEEDBACK_ACTIONS = [
  "approve",
  "reject",
  "rewrite",
  "optional",
  "missing_question",
  "unnecessary_question",
  "incorrect_branching",
  "incorrect_urgency",
];
const FEEDBACK_DISPOSITIONS = ["pending", "accepted", "declined"];
const URGENCIES = ["routine", "soon", "same_day", "urgent"];
const SELECTION_LEVELS = ["required", "recommended", "optional"];

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sourceHashes() {
  return Object.fromEntries(await Promise.all(SOURCE_PATHS.map(async (relativePath) => [
    relativePath,
    sha256(await readFile(path.join(ROOT, relativePath))),
  ])));
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers, rows) {
  return `${[headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;
}

function markdownText(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function listOrNone(items, display = (item) => String(item)) {
  return items.length ? items.map((item) => `- ${display(item)}`).join("\n") : "- None";
}

function questionUrgency(question) {
  const rank = new Map(URGENCIES.map((urgency, index) => [urgency, index]));
  const values = question.followUpTriggers.flatMap((trigger) =>
    trigger.actions.flatMap((action) => "urgency" in action ? [action.urgency] : []));
  return values.sort((left, right) => (rank.get(right) ?? -1) - (rank.get(left) ?? -1))[0] ?? "";
}

function categoryForCode(code) {
  return code.replace(".", "").slice(0, 3);
}

function referenceRows(bank) {
  return [
    ...bank.questionReferences.map((reference) => ({ reference, variantId: "" })),
    ...bank.variants.flatMap((variant) =>
      variant.questionReferences.map((reference) => ({ reference, variantId: variant.id }))),
  ];
}

function uniqueBy(items, keyFor) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function concernList(bank, conditionId, qualityByCondition, splitByCondition, merges) {
  const concerns = [];
  if (bank.status === "architecture_seed") {
    concerns.push("Architecture seed only; condition-specific question selection remains outstanding.");
  }
  concerns.push("Bank and question content remain DRAFT_CLINICAL_REVIEW until clinician approval.");
  for (const concern of qualityByCondition.get(conditionId)?.remainingConcerns ?? []) {
    if (!/no structural concern/i.test(concern)) concerns.push(concern);
  }
  const split = splitByCondition.get(conditionId);
  if (split) concerns.push(`Existing canonical audit split concern (${split.priority}): ${split.recommendation}`);
  for (const merge of merges.filter((candidate) => candidate.ids.includes(conditionId))) {
    concerns.push(`Existing canonical audit reuse/merge concern (${merge.confidence}): ${merge.recommendation}`);
  }
  if (bank.variants.length) {
    concerns.push(`${bank.variants.length} variant(s) require confirmation that activation criteria materially change CCM questioning.`);
  }
  return [...new Set(concerns)];
}

function renderQuestionTable(rows) {
  if (!rows.length) return "_No questions in this section._";
  const header = "| Order | Question ID | Question | Level | Default | Contexts | New | Reuse banks | Red flag | Clinical rationale |\n| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |";
  const body = rows.map((item) => {
    const { reference, definition } = item;
    return `| ${reference.displayOrder} | \`${reference.questionId}\` | ${markdownText(definition.text)} | ${reference.selectionLevel} | ${reference.defaultSelected ? "yes" : "no"} | ${reference.applicableContexts.join(", ")} | ${item.isNew ? "yes" : "no"} | ${item.reuseBankCount} | ${item.isRedFlag ? "yes" : "no"} | ${markdownText(reference.clinicalRationale || definition.clinicalRationale)} |`;
  }).join("\n");
  return `${header}\n${body}`;
}

function renderPacket(packet) {
  const familyRows = packet.icdFamilies.length
    ? packet.icdFamilies.map((family) => `| ${family.family} | ${family.codeCount} |`).join("\n")
    : "| None | 0 |";
  const variantSections = packet.variants.length
    ? packet.variants.map((variant) => `### ${variant.label} (\`${variant.id}\`)

- Activation: ${variant.activation}
- Clinical content groups: ${variant.clinicalContentGroupIds.join(", ") || "None"}

${renderQuestionTable(variant.questions)}`).join("\n\n")
    : "_No variants._";

  return `# ${packet.canonicalCondition}

## Review Metadata

- Canonical ID: \`${packet.canonicalConditionId}\`
- Bank ID: \`${packet.bankId}\`
- Bank content version: ${packet.contentVersion}
- Review status: ${packet.reviewStatus}
- Priority rank: ${packet.priority.rank}
- Estimated review time: ${packet.estimatedReviewMinutes} minutes
- Medicare relevance: ${packet.priority.medicareRelevance}

## ICD Families Mapped

| ICD family | Mapped code count |
| --- | ---: |
${familyRows}

Total mapped codes: ${packet.mappedCodeCount}

## Suggested Question Bank

${renderQuestionTable(packet.questions)}

## Reused Questions

${listOrNone(packet.reusedQuestions, (question) => `\`${question.questionId}\` (${question.reuseBankCount} banks): ${question.text}`)}

## New Questions

${listOrNone(packet.newQuestions, (question) => `\`${question.questionId}\`: ${question.text}`)}

## Intake-Only Questions

${listOrNone(packet.intakeOnlyQuestions, (question) => `\`${question.questionId}\`: ${question.text}`)}

## Monthly Questions

${listOrNone(packet.monthlyQuestions, (question) => `\`${question.questionId}\`: ${question.text}`)}

## Care-Plan Questions

${listOrNone(packet.carePlanQuestions, (question) => `\`${question.questionId}\`: ${question.text}`)}

## Red-Flag Questions

${listOrNone(packet.redFlagQuestions, (question) => `\`${question.questionId}\` (${question.urgency}): ${question.text}`)}

## Variants

${variantSections}

## Clinical Rationale

${listOrNone(packet.questions, (question) => `\`${question.reference.questionId}\`: ${question.reference.clinicalRationale || question.definition.clinicalRationale}`)}

## Outstanding Review Concerns

${listOrNone(packet.outstandingReviewConcerns)}
`;
}

function impactScore(packet) {
  const required = packet.questions.filter((question) => question.reference.required).length;
  const defaults = packet.questions.filter((question) => question.reference.defaultSelected).length;
  return Math.min(100, required * 14 + defaults * 3 + packet.redFlagQuestions.length * 12 + packet.variants.length * 5);
}

function uncertaintyScore(packet, splitByCondition, merges) {
  let score = packet.status === "architecture_seed" ? 65 : 20;
  if (splitByCondition.has(packet.canonicalConditionId)) score += 20;
  if (merges.some((merge) => merge.ids.includes(packet.canonicalConditionId))) score += 10;
  if (packet.variants.length) score += 5;
  return Math.min(100, score);
}

function feedbackBase(packet, rowType, question = null, variantId = "") {
  const definition = question?.definition;
  return {
    feedback_id: rowType === "bank"
      ? `bank:${packet.canonicalConditionId}`
      : `question:${packet.canonicalConditionId}:${variantId || "base"}:${question.reference.questionId}`,
    row_type: rowType,
    priority_rank: packet.priority.rank,
    canonical_condition_id: packet.canonicalConditionId,
    bank_id: packet.bankId,
    variant_id: variantId,
    question_id: question?.reference.questionId ?? "",
    current_bank_version: packet.contentVersion,
    current_question_version: definition?.version ?? "",
    question_text: definition?.text ?? "",
    current_selection_level: question?.reference.selectionLevel ?? "",
    current_urgency: definition ? questionUrgency(definition) : "",
    current_branching: definition ? JSON.stringify({
      displayWhen: definition.displayWhen,
      followUpTriggers: definition.followUpTriggers,
    }) : "",
    feedback_action: "",
    proposed_text: "",
    proposed_selection_level: "",
    proposed_urgency: "",
    proposed_branching: "",
    reviewer: "",
    reviewed_at: "",
    rationale: "",
    disposition: "pending",
    accepted_by: "",
    accepted_at: "",
  };
}

export async function buildClinicalReviewPackage() {
  const beforeHashes = await sourceHashes();
  const canonical = await readJson("data/icd/canonical-conditions.json");
  const audit = await readJson("data/icd/canonical-audit.json");
  const classifications = await readJson("data/icd/icd-classifications.json");
  const bankCatalog = await readJson("data/question-banks/canonical-question-banks.json");
  const newQuestions = await readJson("data/question-banks/review/new-questions.json");
  const quality = await readJson("data/question-banks/review/quality-review-summary.json");
  const urgent = await readJson("data/question-banks/review/urgent-red-flag-logic.json");

  const definitionById = new Map(SUGGESTED_QUESTION_REGISTRY.map((question) => [question.id, question]));
  const newIds = new Set(newQuestions.questions.map((question) => question.id));
  const redFlagIds = new Set(urgent.questions.map((question) => question.id));
  const auditByCondition = new Map(audit.conditions.map((condition) => [condition.id, condition]));
  const qualityByCondition = new Map(quality.conditions.map((condition) => [condition.canonicalConditionId, condition]));
  const splitByCondition = new Map(audit.splitOpportunities.map((item) => [item.id, item]));
  const bankByCondition = new Map(bankCatalog.banks.map((bank) => [bank.canonicalConditionId, bank]));
  const familyCounts = new Map();
  for (const record of classifications.records.filter((record) => record.canonicalConditionId)) {
    const condition = familyCounts.get(record.canonicalConditionId) ?? new Map();
    const family = categoryForCode(record.code);
    condition.set(family, (condition.get(family) ?? 0) + 1);
    familyCounts.set(record.canonicalConditionId, condition);
  }

  const reuseBanks = new Map();
  for (const bank of bankCatalog.banks) {
    for (const questionId of new Set(referenceRows(bank).map((item) => item.reference.questionId))) {
      const owners = reuseBanks.get(questionId) ?? new Set();
      owners.add(bank.canonicalConditionId);
      reuseBanks.set(questionId, owners);
    }
  }

  const packets = canonical.conditions.map((condition) => {
    const bank = bankByCondition.get(condition.id);
    if (!bank) throw new Error(`Missing question bank for ${condition.id}.`);
    const attach = ({ reference, variantId }) => {
      const definition = definitionById.get(reference.questionId);
      if (!definition) throw new Error(`Missing question definition ${reference.questionId}.`);
      return {
        reference,
        definition,
        variantId,
        isNew: newIds.has(reference.questionId),
        isRedFlag: redFlagIds.has(reference.questionId),
        reuseBankCount: reuseBanks.get(reference.questionId)?.size ?? 0,
        urgency: questionUrgency(definition),
      };
    };
    const questions = bank.questionReferences.map((reference) => attach({ reference, variantId: "" }));
    const variants = bank.variants.map((variant) => ({
      ...variant,
      questions: variant.questionReferences.map((reference) => attach({ reference, variantId: variant.id })),
    }));
    const all = [...questions, ...variants.flatMap((variant) => variant.questions)];
    const families = [...(familyCounts.get(condition.id) ?? new Map()).entries()]
      .map(([family, codeCount]) => ({ family, codeCount }))
      .sort((left, right) => left.family.localeCompare(right.family));
    const auditCondition = auditByCondition.get(condition.id);
    const packet = {
      canonicalConditionId: condition.id,
      canonicalCondition: condition.name,
      clinicalDomain: condition.clinicalDomain,
      bankId: bank.id,
      status: bank.status,
      reviewStatus: bank.reviewStatus,
      contentVersion: bank.contentVersion,
      mappedCodeCount: families.reduce((sum, family) => sum + family.codeCount, 0),
      icdFamilies: families,
      questions,
      reusedQuestions: uniqueBy(all.filter((question) => question.reuseBankCount > 1), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text, reuseBankCount: question.reuseBankCount })),
      newQuestions: uniqueBy(all.filter((question) => question.isNew), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text })),
      intakeOnlyQuestions: uniqueBy(all.filter((question) =>
        question.reference.applicableContexts.length === 1 && question.reference.applicableContexts[0] === "intake"), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text })),
      monthlyQuestions: uniqueBy(all.filter((question) =>
        question.reference.applicableContexts.includes("monthly_checkin")), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text })),
      carePlanQuestions: uniqueBy(all.filter((question) =>
        question.reference.applicableContexts.includes("care_plan_review")), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text })),
      redFlagQuestions: uniqueBy(all.filter((question) => question.isRedFlag), (question) => question.reference.questionId)
        .map((question) => ({ questionId: question.reference.questionId, text: question.definition.text, urgency: question.urgency })),
      variants,
      outstandingReviewConcerns: concernList(bank, condition.id, qualityByCondition, splitByCondition, audit.mergeOpportunities),
      estimatedReviewMinutes: Math.min(30, 8 + Math.ceil(all.length / 2) + variants.length * 2),
      priority: {
        rank: 0,
        medicareRelevance: auditCondition?.medicareRelevance ?? "UNRATED",
        prevalenceScore: ({ COMMON: 100, OCCASIONAL: 60, RARE: 30 })[auditCondition?.medicareRelevance] ?? 0,
        impactScore: 0,
        uncertaintyScore: 0,
        reuseScore: 0,
        overallScore: 0,
      },
    };
    packet.priority.impactScore = impactScore(packet);
    packet.priority.uncertaintyScore = uncertaintyScore(packet, splitByCondition, audit.mergeOpportunities);
    packet.reuseRaw = packet.reusedQuestions.reduce((sum, question) => sum + question.reuseBankCount, 0);
    return packet;
  });

  const maxReuse = Math.max(...packets.map((packet) => packet.reuseRaw), 1);
  for (const packet of packets) {
    packet.priority.reuseScore = Math.round(packet.reuseRaw / maxReuse * 100);
    packet.priority.overallScore = Math.round((
      packet.priority.prevalenceScore * 0.35 +
      packet.priority.impactScore * 0.30 +
      packet.priority.uncertaintyScore * 0.25 +
      packet.priority.reuseScore * 0.10
    ) * 10) / 10;
    delete packet.reuseRaw;
  }
  packets.sort((left, right) =>
    right.priority.prevalenceScore - left.priority.prevalenceScore ||
    right.priority.impactScore - left.priority.impactScore ||
    right.priority.uncertaintyScore - left.priority.uncertaintyScore ||
    right.priority.reuseScore - left.priority.reuseScore ||
    right.priority.overallScore - left.priority.overallScore ||
    left.canonicalCondition.localeCompare(right.canonicalCondition));
  packets.forEach((packet, index) => { packet.priority.rank = index + 1; });

  const priorityRows = packets.map((packet) => ({
    priority_rank: packet.priority.rank,
    canonical_condition_id: packet.canonicalConditionId,
    canonical_condition: packet.canonicalCondition,
    clinical_domain: packet.clinicalDomain,
    medicare_relevance: packet.priority.medicareRelevance,
    prevalence_score: packet.priority.prevalenceScore,
    ccm_impact_score: packet.priority.impactScore,
    uncertainty_score: packet.priority.uncertaintyScore,
    reuse_score: packet.priority.reuseScore,
    overall_priority_score: packet.priority.overallScore,
    mapped_code_count: packet.mappedCodeCount,
    question_count: packet.questions.length,
    variant_count: packet.variants.length,
    red_flag_count: packet.redFlagQuestions.length,
    estimated_review_minutes: packet.estimatedReviewMinutes,
    packet_file: `docs/clinical/review-packets/${packet.canonicalConditionId}.md`,
  }));
  const bankRows = packets.map((packet) => ({
    ...feedbackBase(packet, "bank"),
    canonical_condition: packet.canonicalCondition,
    icd_families: packet.icdFamilies.map((family) => family.family).join("; "),
    base_question_count: packet.questions.length,
    reused_question_count: packet.reusedQuestions.length,
    new_question_count: packet.newQuestions.length,
    monthly_question_count: packet.monthlyQuestions.length,
    red_flag_count: packet.redFlagQuestions.length,
    variant_count: packet.variants.length,
    outstanding_review_concerns: packet.outstandingReviewConcerns.join(" | "),
  }));
  const questionRows = packets.flatMap((packet) => [
    ...packet.questions.map((question) => ({
      ...feedbackBase(packet, "question", question),
      canonical_condition: packet.canonicalCondition,
      source: question.isNew ? "new" : "existing",
      reuse_bank_count: question.reuseBankCount,
      contexts: question.reference.applicableContexts.join("; "),
      default_selected: question.reference.defaultSelected,
      required: question.reference.required,
      red_flag: question.isRedFlag,
      clinical_rationale: question.reference.clinicalRationale || question.definition.clinicalRationale,
      follow_up_behavior: question.reference.followUpBehavior || question.definition.followUpBehavior || "",
    })),
    ...packet.variants.flatMap((variant) => variant.questions.map((question) => ({
      ...feedbackBase(packet, "question", question, variant.id),
      canonical_condition: packet.canonicalCondition,
      source: question.isNew ? "new" : "existing",
      reuse_bank_count: question.reuseBankCount,
      contexts: question.reference.applicableContexts.join("; "),
      default_selected: question.reference.defaultSelected,
      required: question.reference.required,
      red_flag: question.isRedFlag,
      clinical_rationale: question.reference.clinicalRationale || question.definition.clinicalRationale,
      follow_up_behavior: question.reference.followUpBehavior || question.definition.followUpBehavior || "",
    }))),
  ]);
  const variantRows = packets.flatMap((packet) => packet.variants.map((variant) => ({
    priority_rank: packet.priority.rank,
    canonical_condition_id: packet.canonicalConditionId,
    canonical_condition: packet.canonicalCondition,
    bank_id: packet.bankId,
    current_bank_version: packet.contentVersion,
    variant_id: variant.id,
    variant_label: variant.label,
    activation: variant.activation,
    clinical_content_group_ids: variant.clinicalContentGroupIds.join("; "),
    question_count: variant.questions.length,
    question_ids: variant.questions.map((question) => question.reference.questionId).join("; "),
    feedback_action: "",
    reviewer: "",
    reviewed_at: "",
    rationale: "",
    disposition: "pending",
    accepted_by: "",
    accepted_at: "",
  })));

  const priorityHeaders = Object.keys(priorityRows[0]);
  const bankHeaders = [
    "priority_rank", "canonical_condition", "canonical_condition_id", "bank_id", "current_bank_version",
    "icd_families", "base_question_count", "reused_question_count", "new_question_count",
    "monthly_question_count", "red_flag_count", "variant_count", "outstanding_review_concerns",
    "feedback_action", "proposed_text", "reviewer", "reviewed_at", "rationale", "disposition",
    "accepted_by", "accepted_at", "feedback_id", "row_type", "variant_id", "question_id",
    "current_question_version", "question_text", "current_selection_level", "current_urgency",
    "current_branching", "proposed_selection_level", "proposed_urgency", "proposed_branching",
  ];
  const questionHeaders = [
    "priority_rank", "canonical_condition", "canonical_condition_id", "variant_id", "question_id",
    "question_text", "contexts", "source", "reuse_bank_count", "current_selection_level",
    "current_urgency", "default_selected", "required", "red_flag", "clinical_rationale",
    "follow_up_behavior", "current_branching", "feedback_action", "proposed_text",
    "proposed_selection_level", "proposed_urgency", "proposed_branching", "reviewer", "reviewed_at",
    "rationale", "disposition", "accepted_by", "accepted_at", "feedback_id", "row_type", "bank_id",
    "current_bank_version", "current_question_version",
  ];
  const variantHeaders = variantRows.length ? Object.keys(variantRows[0]) : [];
  const output = new Map();
  output.set("data/clinical-review/review-priority.csv", toCsv(priorityHeaders, priorityRows));
  output.set("data/clinical-review/bank-review.csv", toCsv(bankHeaders, bankRows));
  output.set("data/clinical-review/question-review.csv", toCsv(questionHeaders, questionRows));
  output.set("data/clinical-review/variant-review.csv", toCsv(variantHeaders, variantRows));
  output.set("data/clinical-review/feedback-schema.json", `${JSON.stringify({
    schemaVersion: 1,
    feedbackActions: FEEDBACK_ACTIONS,
    dispositions: FEEDBACK_DISPOSITIONS,
    selectionLevels: SELECTION_LEVELS,
    urgencies: URGENCIES,
    importRules: {
      acceptedRowsRequire: ["reviewer", "reviewed_at", "rationale", "accepted_by", "accepted_at"],
      rewriteRequires: ["proposed_text"],
      missingQuestionRequires: ["proposed_text"],
      incorrectBranchingRequires: ["proposed_branching"],
      incorrectUrgencyRequires: ["proposed_urgency"],
      noAiRewriting: true,
      automaticCanonicalMerge: false,
    },
  }, null, 2)}\n`);
  output.set("data/clinical-review/review-package.json", `${JSON.stringify({
    schemaVersion: 1,
    reviewStatus: "DRAFT_CLINICAL_REVIEW",
    priorityMethod: {
      prevalenceWeight: 0.35,
      ccmImpactWeight: 0.30,
      uncertaintyWeight: 0.25,
      reuseWeight: 0.10,
      note: "Operational review-priority proxy derived only from existing catalog metadata; not a clinical severity score.",
    },
    packetCount: packets.length,
    packets,
  }, null, 2)}\n`);
  output.set("docs/clinical/review-packets/index.md", `# Clinical Review Packet Index\n\n${packets.map((packet) =>
    `${packet.priority.rank}. [${packet.canonicalCondition}](./${packet.canonicalConditionId}.md) - score ${packet.priority.overallScore}, ${packet.estimatedReviewMinutes} min`).join("\n")}\n`);
  for (const packet of packets) {
    output.set(`docs/clinical/review-packets/${packet.canonicalConditionId}.md`, renderPacket(packet));
  }

  const afterHashes = await sourceHashes();
  if (JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes)) {
    throw new Error("Clinical source content changed while generating the review package.");
  }
  output.set("data/clinical-review/source-integrity.json", `${JSON.stringify({
    schemaVersion: 1,
    algorithm: "sha256",
    sourceFiles: Object.entries(beforeHashes).map(([relativePath, hash]) => ({ relativePath, hash })),
    verifiedUnchangedDuringGeneration: true,
  }, null, 2)}\n`);
  return { output, packets, priorityRows, bankRows, questionRows, variantRows };
}

async function run() {
  const generated = await buildClinicalReviewPackage();
  if (CHECK_ONLY) {
    const mismatches = [];
    for (const [relativePath, expected] of generated.output) {
      let actual = null;
      try {
        actual = await readFile(path.join(ROOT, relativePath), "utf8");
      } catch {
        mismatches.push(`${relativePath} is missing`);
        continue;
      }
      if (actual !== expected) mismatches.push(`${relativePath} differs`);
    }
    if (mismatches.length) throw new Error(`Clinical review package check failed:\n${mismatches.join("\n")}`);
    console.log(`Clinical review package check passed for ${generated.packets.length} packets and ${generated.output.size} files.`);
    return;
  }

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(PACKET_DIR, { recursive: true });
  for (const [relativePath, content] of generated.output) {
    const target = path.join(ROOT, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  console.log(`Generated ${generated.packets.length} clinical review packets, ${generated.questionRows.length} question rows, and ${generated.variantRows.length} variant rows.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}
