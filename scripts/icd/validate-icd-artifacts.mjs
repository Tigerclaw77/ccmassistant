import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CMS_RELEASE, compactIcdCode } from "./catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "data/icd");

async function readJson(name) {
  return JSON.parse(await readFile(path.join(DATA_DIR, name), "utf8"));
}

function requireValue(condition, message, errors) {
  if (!condition) errors.push(message);
}

function indexByCode(records) {
  return new Map(records.map((record) => [record.code, record]));
}

function assertGroupRelation(byCode, codes, shouldMatch, label, errors) {
  const records = codes.map((code) => byCode.get(code));
  if (records.some((record) => !record)) {
    errors.push(`${label}: representative codes are missing (${codes.join(", ")}).`);
    return;
  }
  const groups = new Set(records.map((record) => record.clinicalContentGroupId));
  if (shouldMatch && groups.size !== 1) errors.push(`${label}: expected one shared content group, found ${[...groups].join(", ")}.`);
  if (!shouldMatch && groups.size === 1) errors.push(`${label}: clinically material variants were collapsed into ${[...groups][0]}.`);
}

export async function validateArtifacts() {
  const [catalog, classificationFile, canonicalFile, groupFile, metadata, summary] = await Promise.all([
    readJson("icd-10-cm-current.json"),
    readJson("icd-classifications.json"),
    readJson("canonical-conditions.json"),
    readJson("duplicate-groups.json"),
    readJson("import-metadata.json"),
    readJson("classification-summary.json"),
  ]);
  const errors = [];
  const warnings = [];
  const codes = catalog.codes;
  const records = classificationFile.records;
  const canonicalIds = new Set();
  const groupIds = new Set();
  const seenCodes = new Map();

  requireValue(metadata.release.version === CMS_RELEASE.version, "Release version is stale or unexpected.", errors);
  requireValue(metadata.rowCount === CMS_RELEASE.expectedRowCount, `Imported row count must equal ${CMS_RELEASE.expectedRowCount}.`, errors);
  requireValue(metadata.billableCount === CMS_RELEASE.expectedBillableCount, `Billable row count must equal ${CMS_RELEASE.expectedBillableCount}.`, errors);
  requireValue(codes.length === metadata.rowCount, "Catalog row count does not match import metadata.", errors);
  requireValue(records.length === codes.length, "Classification completeness failed: record count differs from catalog count.", errors);

  canonicalFile.conditions.forEach((condition, index) => {
    const id = condition.id?.trim().toLowerCase();
    requireValue(Boolean(id), `Canonical condition ${index} has no ID.`, errors);
    if (canonicalIds.has(id)) errors.push(`Duplicate canonical condition ID: ${condition.id}.`);
    canonicalIds.add(id);
  });

  groupFile.contentGroups.forEach((group, index) => {
    requireValue(Boolean(group.id), `Clinical content group ${index} has no ID.`, errors);
    if (groupIds.has(group.id)) errors.push(`Duplicate clinical content group ID: ${group.id}.`);
    groupIds.add(group.id);
    if (!canonicalIds.has(group.canonicalConditionId)) errors.push(`Orphan canonical condition ${group.canonicalConditionId} on content group ${group.id}.`);
  });

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const catalogRow = codes[index];
    const compact = compactIcdCode(record.code);
    if (!/^[A-Z][A-Z0-9]{2,6}$/.test(compact)) errors.push(`Invalid ICD-10-CM format at records[${index}]: ${record.code}.`);
    if (!record.officialTitle?.trim()) errors.push(`Missing official title at records[${index}].`);
    if (!record.rationale?.trim()) errors.push(`Missing rationale at records[${index}].`);
    if (!new Set(["PASS", "FAIL", "UNSURE"]).has(record.classification)) errors.push(`Invalid classification at records[${index}]: ${record.classification}.`);
    if (record.code !== catalogRow.code || record.officialTitle !== catalogRow.officialTitle || record.billable !== catalogRow.billable) errors.push(`Exact catalog identity mismatch at records[${index}] (${record.code}).`);
    if (seenCodes.has(compact)) errors.push(`Duplicate exact ICD code ${record.code} at records[${index}] and records[${seenCodes.get(compact)}].`);
    seenCodes.set(compact, index);
    if (record.canonicalConditionId && !canonicalIds.has(record.canonicalConditionId)) errors.push(`Orphan canonical condition ${record.canonicalConditionId} on ${record.code}.`);
    if (record.clinicalContentGroupId && !groupIds.has(record.clinicalContentGroupId)) errors.push(`Orphan clinical content group ${record.clinicalContentGroupId} on ${record.code}.`);
    if (record.clinicalContentGroupId && !record.canonicalConditionId) errors.push(`Content group without canonical condition on ${record.code}.`);
    if (record.classification !== "PASS" && (record.canonicalConditionId || record.clinicalContentGroupId)) errors.push(`Non-PASS code ${record.code} has automatic canonical content mapping.`);
  }

  const mappedPass = records.filter((record) => record.classification === "PASS" && record.clinicalContentGroupId).length;
  const explosionRatio = mappedPass === 0 ? 1 : groupIds.size / mappedPass;
  if (mappedPass >= 100 && explosionRatio > 0.25) errors.push(`Accidental one-code-per-profile explosion: ${groupIds.size} groups for ${mappedPass} mapped PASS records (${explosionRatio.toFixed(3)}).`);

  const byCode = indexByCode(records);
  assertGroupRelation(byCode, ["M17.11", "M17.12", "M17.0"], true, "Knee osteoarthritis laterality", errors);
  assertGroupRelation(byCode, ["H40.1111", "H40.1121"], true, "Glaucoma right/left at the same stage", errors);
  assertGroupRelation(byCode, ["H40.1111", "H40.1113"], false, "Glaucoma severity preservation", errors);
  assertGroupRelation(byCode, ["N18.31", "N18.5"], false, "CKD stage preservation", errors);
  assertGroupRelation(byCode, ["N18.5", "N18.6"], false, "CKD dialysis preservation", errors);
  assertGroupRelation(byCode, ["E11.9", "E11.22"], false, "Diabetes kidney complication preservation", errors);
  assertGroupRelation(byCode, ["J44.9", "J44.1"], false, "COPD exacerbation preservation", errors);
  assertGroupRelation(byCode, ["J45.20", "J45.21"], false, "Asthma exacerbation preservation", errors);

  const representativePass = ["I10", "E11.9", "I50.32", "J44.9", "F03.90", "G89.29", "C50.911"];
  const representativeUnsure = ["R53.83", "Z79.899"];
  for (const code of representativePass) requireValue(byCode.get(code)?.classification === "PASS", `Representative chronic code ${code} is not PASS.`, errors);
  for (const code of representativeUnsure) requireValue(byCode.get(code)?.classification === "UNSURE", `Context-dependent code ${code} is not UNSURE.`, errors);
  requireValue(byCode.get("Z23")?.classification === "FAIL", "Routine immunization Z23 must remain FAIL and searchable.", errors);
  requireValue(summary.classifications.FAIL < summary.classifications.UNSURE, "Conservative FAIL behavior failed: FAIL must remain below UNSURE.", errors);
  requireValue(summary.totalCodes === records.length, "Machine-readable summary row count mismatch.", errors);
  requireValue(summary.clinicalContentGroupCount === groupIds.size, "Machine-readable content-group count mismatch.", errors);

  if (summary.unmappedPass > 0) warnings.push(`${summary.unmappedPass} PASS records remain unmapped by design.`);
  return { valid: errors.length === 0, errors, warnings, metrics: { rows: records.length, canonicalConditions: canonicalIds.size, clinicalContentGroups: groupIds.size, mappedPass, explosionRatio } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateArtifacts();
  if (!result.valid) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`ICD validation passed: ${result.metrics.rows} rows, ${result.metrics.canonicalConditions} canonical conditions, ${result.metrics.clinicalContentGroups} content groups, profile ratio ${result.metrics.explosionRatio.toFixed(4)}.`);
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  }
}
