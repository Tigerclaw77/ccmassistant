import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACTIONS = new Set([
  "approve",
  "reject",
  "rewrite",
  "optional",
  "missing_question",
  "unnecessary_question",
  "incorrect_branching",
  "incorrect_urgency",
]);
const URGENCIES = new Set(["routine", "soon", "same_day", "urgent"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }
    if (character === '"' && value === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error("CSV ends inside a quoted field.");
  if (value || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...values] = rows;
  if (!headers?.length) return [];
  if (new Set(headers).size !== headers.length) throw new Error("CSV contains duplicate headers.");
  return values
    .filter((candidate) => candidate.some((cell) => cell !== ""))
    .map((candidate, rowIndex) => {
      if (candidate.length !== headers.length) {
        throw new Error(`CSV row ${rowIndex + 2} has ${candidate.length} columns; expected ${headers.length}.`);
      }
      return Object.fromEntries(headers.map((header, index) => [header, candidate[index]]));
    });
}

function isIsoTimestamp(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function questionTarget(packet, row) {
  const questions = row.variant_id
    ? packet.variants.find((variant) => variant.id === row.variant_id)?.questions ?? []
    : packet.questions;
  return questions.find((question) => question.reference.questionId === row.question_id) ?? null;
}

function required(value, field, rowNumber, errors) {
  if (!String(value ?? "").trim()) errors.push(`Row ${rowNumber}: ${field} is required.`);
}

function proposedAfter(row, target) {
  const current = target ? {
    text: target.definition.text,
    selectionLevel: target.reference.selectionLevel,
    urgency: row.current_urgency,
    branching: JSON.parse(row.current_branching || "{}"),
  } : null;
  if (row.feedback_action === "rewrite") return { ...current, text: row.proposed_text };
  if (row.feedback_action === "optional") return { ...current, selectionLevel: "optional" };
  if (row.feedback_action === "incorrect_urgency") return { ...current, urgency: row.proposed_urgency };
  if (row.feedback_action === "incorrect_branching") {
    return { ...current, branching: JSON.parse(row.proposed_branching) };
  }
  if (row.feedback_action === "missing_question") {
    return { text: row.proposed_text, selectionLevel: row.proposed_selection_level || "optional" };
  }
  if (row.feedback_action === "unnecessary_question") return { ...current, included: false };
  return current;
}

export function buildClinicianFeedbackImport(rows, reviewPackage) {
  const errors = [];
  const packetByCondition = new Map(reviewPackage.packets.map((packet) => [packet.canonicalConditionId, packet]));
  const seenFeedback = new Set();
  const acceptedRows = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.disposition !== "accepted") return;
    if (seenFeedback.has(row.feedback_id)) errors.push(`Row ${rowNumber}: duplicate feedback_id ${row.feedback_id}.`);
    seenFeedback.add(row.feedback_id);
    required(row.feedback_id, "feedback_id", rowNumber, errors);
    required(row.feedback_action, "feedback_action", rowNumber, errors);
    required(row.reviewer, "reviewer", rowNumber, errors);
    required(row.reviewed_at, "reviewed_at", rowNumber, errors);
    required(row.rationale, "rationale", rowNumber, errors);
    required(row.accepted_by, "accepted_by", rowNumber, errors);
    required(row.accepted_at, "accepted_at", rowNumber, errors);
    if (!ACTIONS.has(row.feedback_action)) errors.push(`Row ${rowNumber}: unsupported feedback_action ${row.feedback_action}.`);
    if (!isIsoTimestamp(row.reviewed_at)) errors.push(`Row ${rowNumber}: reviewed_at must be an ISO-8601 UTC timestamp.`);
    if (!isIsoTimestamp(row.accepted_at)) errors.push(`Row ${rowNumber}: accepted_at must be an ISO-8601 UTC timestamp.`);

    const packet = packetByCondition.get(row.canonical_condition_id);
    if (!packet || packet.bankId !== row.bank_id) {
      errors.push(`Row ${rowNumber}: orphan condition or bank target.`);
      return;
    }
    if (Number(row.current_bank_version) !== packet.contentVersion) {
      errors.push(`Row ${rowNumber}: bank version is stale; expected ${packet.contentVersion}.`);
    }
    const target = row.row_type === "question" ? questionTarget(packet, row) : null;
    if (row.row_type === "question" && !target) {
      errors.push(`Row ${rowNumber}: orphan question or variant target.`);
      return;
    }
    if (target && Number(row.current_question_version) !== target.definition.version) {
      errors.push(`Row ${rowNumber}: question version is stale; expected ${target.definition.version}.`);
    }
    if (row.feedback_action === "missing_question" && row.row_type !== "bank") {
      errors.push(`Row ${rowNumber}: missing_question feedback must use a bank row.`);
    }
    if (row.feedback_action !== "missing_question" && row.row_type !== "question" &&
      !["approve", "reject"].includes(row.feedback_action)) {
      errors.push(`Row ${rowNumber}: ${row.feedback_action} feedback requires a question row.`);
    }
    if (["rewrite", "missing_question"].includes(row.feedback_action)) required(row.proposed_text, "proposed_text", rowNumber, errors);
    if (row.feedback_action === "optional" && row.proposed_selection_level && row.proposed_selection_level !== "optional") {
      errors.push(`Row ${rowNumber}: optional feedback can only propose the optional selection level.`);
    }
    if (row.feedback_action === "incorrect_urgency" && !URGENCIES.has(row.proposed_urgency)) {
      errors.push(`Row ${rowNumber}: incorrect_urgency requires a supported proposed_urgency.`);
    }
    if (row.feedback_action === "incorrect_branching") {
      try {
        const branching = JSON.parse(row.proposed_branching);
        if (!branching || typeof branching !== "object" || Array.isArray(branching)) throw new Error("not an object");
      } catch {
        errors.push(`Row ${rowNumber}: incorrect_branching requires proposed_branching as a JSON object.`);
      }
    }
    acceptedRows.push({ row, packet, target });
  });

  if (errors.length) throw new Error(`Clinician feedback import rejected:\n${errors.join("\n")}`);
  const changes = acceptedRows.map(({ row, packet, target }) => {
    const changesContent = !["approve", "reject"].includes(row.feedback_action);
    const sourceQuestionVersion = target?.definition.version ?? null;
    return {
      feedbackId: row.feedback_id,
      target: {
        rowType: row.row_type,
        canonicalConditionId: packet.canonicalConditionId,
        bankId: packet.bankId,
        variantId: row.variant_id || null,
        questionId: row.question_id || null,
      },
      decision: row.feedback_action,
      reviewer: row.reviewer,
      reviewedAt: row.reviewed_at,
      rationale: row.rationale,
      acceptedBy: row.accepted_by,
      acceptedAt: row.accepted_at,
      sourceBankVersion: packet.contentVersion,
      proposedBankVersion: changesContent ? packet.contentVersion + 1 : packet.contentVersion,
      sourceQuestionVersion,
      proposedQuestionVersion: changesContent ? (sourceQuestionVersion ?? 0) + 1 : sourceQuestionVersion,
      versionHistory: target ? [{
        version: target.definition.version,
        text: target.definition.text,
        selectionLevel: target.reference.selectionLevel,
        urgency: row.current_urgency || null,
        branching: JSON.parse(row.current_branching || "{}"),
      }] : [],
      before: target ? {
        text: target.definition.text,
        selectionLevel: target.reference.selectionLevel,
        urgency: row.current_urgency || null,
        branching: JSON.parse(row.current_branching || "{}"),
      } : null,
      after: proposedAfter(row, target),
      transformation: "exact_clinician_input_no_ai",
    };
  });
  const importId = sha256(JSON.stringify(changes)).slice(0, 24);
  return {
    schemaVersion: 1,
    importId,
    importedAt: changes.map((change) => change.acceptedAt).sort().at(-1) ?? null,
    sourceReviewPackageSchemaVersion: reviewPackage.schemaVersion,
    acceptedChangeCount: changes.length,
    appliesAutomatically: false,
    canonicalContentModified: false,
    changes,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

async function run() {
  const inputPath = option("--input");
  if (!inputPath) throw new Error("Usage: npm run clinical-review:import -- --input <feedback.csv> [--output <changes.json>] [--check]");
  const resolvedInput = path.resolve(ROOT, inputPath);
  const rows = parseCsv(await readFile(resolvedInput, "utf8"));
  const reviewPackage = JSON.parse(await readFile(path.join(ROOT, "data", "clinical-review", "review-package.json"), "utf8"));
  const result = buildClinicianFeedbackImport(rows, reviewPackage);
  if (process.argv.includes("--check")) {
    console.log(`Clinician feedback is valid; ${result.acceptedChangeCount} accepted changes are ready to stage.`);
    return;
  }
  const outputOption = option("--output");
  const outputPath = outputOption
    ? path.resolve(ROOT, outputOption)
    : path.join(ROOT, "data", "clinical-review", "imports", `${result.importId}.json`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(`Staged ${result.acceptedChangeCount} accepted clinician changes in ${path.relative(ROOT, outputPath)}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}
