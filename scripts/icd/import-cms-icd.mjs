import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CMS_RELEASE,
  buildContentGroups,
  buildDuplicateGroups,
  buildOverrideMap,
  classifyCatalogRow,
  json,
  parseCmsOrderFile,
  readZipEntry,
  reviewRecord,
  sha256,
} from "./catalog.mjs";
import { NEW_CANONICAL_CONDITIONS } from "../clinical-content-config.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "../..");
const DATA_DIR = path.join(ROOT, "data/icd");
const REVIEW_DIR = path.join(DATA_DIR, "review");
const REPORT_PATH = path.join(ROOT, "docs/clinical/icd-classification-report.md");
const SOURCE_ZIP_PATH = path.join(DATA_DIR, CMS_RELEASE.sourceFileName);
const METADATA_PATH = path.join(DATA_DIR, "import-metadata.json");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function stableImportTimestamp(sourceSha256, refreshTimestamp) {
  if (!refreshTimestamp) {
    try {
      const current = await readJson(METADATA_PATH);
      if (current.source?.sha256 === sourceSha256 && current.importedAt) return current.importedAt;
    } catch {
      // The first import has no metadata to reuse.
    }
  }
  return new Date().toISOString();
}

function topFamilies(rows, limit = 20) {
  const counts = new Map();
  for (const row of rows) {
    const family = row.sourceCode.slice(0, 3);
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((left, right) => right.count - left.count || left.family.localeCompare(right.family))
    .slice(0, limit);
}

function representative(records, classification, limit = 12) {
  return records.filter((record) => record.classification === classification && record.billable).slice(0, limit).map(reviewRecord);
}

function tableRows(records) {
  return records.map((record) => `| ${record.code} | ${record.officialTitle.replaceAll("|", "\\|")} | ${record.classification} | ${record.clinicalContentGroupId ?? "-"} |`).join("\n");
}

function selectCodes(classifications, codes) {
  const wanted = new Set(codes);
  return classifications.filter((record) => wanted.has(record.code));
}

function buildReport(summary, classifications, contentGroups, duplicateGroups, warnings) {
  const collapsed = selectCodes(classifications, ["M17.0", "M17.11", "M17.12", "H40.1111", "H40.1121"]);
  const preserved = selectCodes(classifications, ["N18.31", "N18.5", "N18.6", "E11.9", "E11.22", "H40.1111", "H40.1113"]);
  const falseFailSample = classifications.filter((record) => record.classification === "FAIL" && record.billable).filter((_, index) => index % 251 === 0).slice(0, 25);
  const passSample = representative(classifications, "PASS", 10);
  const failSample = representative(classifications, "FAIL", 10);
  const unsureSample = representative(classifications, "UNSURE", 10);
  const topFamilyRows = summary.topFamilies.map((item) => `| ${item.family} | ${item.count.toLocaleString("en-US")} |`).join("\n");
  const warningRows = warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- None detected by deterministic validation.";

  return `# ICD-10-CM CCM Classification Report

## Release

- Source: Centers for Medicare & Medicaid Services, ${CMS_RELEASE.version} Code Descriptions in Tabular Order
- Effective dates: ${CMS_RELEASE.effectiveFrom} through ${CMS_RELEASE.effectiveThrough}
- Source file: \`${CMS_RELEASE.sourceFileName}\`
- Source entry: \`${CMS_RELEASE.sourceEntryName}\`
- Imported at: ${summary.importedAt}
- Source SHA-256: \`${summary.sourceSha256}\`

CMS has published FY 2027 files, but those codes are not effective until October 1, 2026. This catalog intentionally uses the currently effective April 1, 2026 release.

## Counts

| Metric | Count |
| --- | ---: |
| Total imported records | ${summary.totalCodes.toLocaleString("en-US")} |
| Billable codes | ${summary.billableCodes.toLocaleString("en-US")} |
| Non-billable headers | ${summary.nonBillableCodes.toLocaleString("en-US")} |
| PASS | ${summary.classifications.PASS.toLocaleString("en-US")} |
| FAIL | ${summary.classifications.FAIL.toLocaleString("en-US")} |
| UNSURE | ${summary.classifications.UNSURE.toLocaleString("en-US")} |
| Mapped PASS | ${summary.mappedPass.toLocaleString("en-US")} |
| Unmapped PASS | ${summary.unmappedPass.toLocaleString("en-US")} |
| Canonical conditions | ${summary.canonicalConditionCount.toLocaleString("en-US")} |
| Clinical content groups | ${summary.clinicalContentGroupCount.toLocaleString("en-US")} |
| Duplicate/shared groups | ${summary.duplicateGroupCount.toLocaleString("en-US")} |
| Laterality-collapsed groups | ${summary.lateralityDuplicateGroupCount.toLocaleString("en-US")} |

## Grouping Model

Every CMS row retains its exact diagnosis code, official title, and billable status. A canonical condition is the broad chronic-care concept. A clinical content group is the future reusable question and care-plan unit. Laterality, encounter extensions, anatomical subsite, and coding specificity collapse when they do not change CCM monitoring or interventions. Stage, severity, complication profile, organ involvement, treatment burden, and red-flag state remain separate variants when deterministic rules identify a management difference.

No question banks, goals, interventions, education, or care-plan content were generated in this sprint.

### Collapsed Laterality Examples

| ICD code | Official title | Classification | Shared clinical content group |
| --- | --- | --- | --- |
${tableRows(collapsed)}

### Intentionally Separate Variants

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
${tableRows(preserved)}

CKD general, advanced-stage, and dialysis considerations remain distinct. Diabetes complication modules remain distinct from uncomplicated diabetes. Glaucoma severity stages remain distinct while right/left/bilateral codes at the same stage collapse.

## Top Code Families

| Family | Imported rows |
| --- | ---: |
${topFamilyRows}

## Representative Samples

### PASS

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
${tableRows(passSample)}

### FAIL

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
${tableRows(failSample)}

### UNSURE

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
${tableRows(unsureSample)}

## Potential False-FAIL Review Sample

This deterministic sample is intentionally provided for clinical review. FAIL is recoverable through the existing authorized override path and does not remove a code from exact search.

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
${tableRows(falseFailSample)}

## Data Quality Warnings

${warningRows}

## Clinical Review Risk

The classification is deliberately conservative and is not clinically perfect. Broad chapter and title heuristics may leave many plausible conditions as UNSURE, and some chronic-condition families remain PASS but unmapped. The highest-value review queues are unmapped PASS, low-confidence grouping, stage/severity variants, and the potential false-FAIL sample. Later content generation should run once per \`clinicalContentGroupId\`, never once per exact ICD code.

Generated content groups represented in this report: ${contentGroups.length.toLocaleString("en-US")}. Shared duplicate groups represented: ${duplicateGroups.length.toLocaleString("en-US")}.
`;
}

export async function buildArtifacts({ refreshTimestamp = false } = {}) {
  const zipBuffer = await readFile(SOURCE_ZIP_PATH);
  const sourceSha256 = sha256(zipBuffer);
  if (sourceSha256 !== CMS_RELEASE.expectedSourceSha256) {
    throw new Error(`CMS source checksum mismatch: expected ${CMS_RELEASE.expectedSourceSha256}, received ${sourceSha256}.`);
  }
  const orderBuffer = readZipEntry(zipBuffer, CMS_RELEASE.sourceEntryName);
  const rows = parseCmsOrderFile(orderBuffer.toString("utf8"));
  const billableCodes = rows.filter((row) => row.billable).length;
  if (rows.length !== CMS_RELEASE.expectedRowCount || billableCodes !== CMS_RELEASE.expectedBillableCount) {
    throw new Error(`CMS row-count mismatch: received ${rows.length} rows and ${billableCodes} billable codes.`);
  }

  const [canonicalFile, overrideFile] = await Promise.all([
    readJson(path.join(DATA_DIR, "canonical-conditions.json")),
    readJson(path.join(DATA_DIR, "classification-overrides.json")),
  ]);
  const newCanonicalIds = new Set(NEW_CANONICAL_CONDITIONS.map((condition) => condition.id));
  const canonicalConditions = [
    ...canonicalFile.conditions.filter((condition) => !newCanonicalIds.has(condition.id)),
    ...NEW_CANONICAL_CONDITIONS,
  ];
  const overrideMap = buildOverrideMap(overrideFile.overrides);
  const classifications = rows.map((row) => classifyCatalogRow(row, overrideMap));
  const classificationByCode = new Map(classifications.map((record) => [record.code, record]));
  const contentGroups = buildContentGroups(rows, classifications);
  const duplicateGroups = buildDuplicateGroups(contentGroups, classificationByCode);
  const importedAt = await stableImportTimestamp(sourceSha256, refreshTimestamp);

  const counts = { PASS: 0, FAIL: 0, UNSURE: 0 };
  for (const record of classifications) counts[record.classification] += 1;
  const mappedPass = classifications.filter((record) => record.classification === "PASS" && record.canonicalConditionId).length;
  const unmappedPass = classifications.filter((record) => record.unmappedPass).length;
  const lateralityGroups = duplicateGroups.filter((group) => group.collapseReasons.includes("laterality"));
  const warnings = [];
  if (counts.FAIL > counts.UNSURE) warnings.push("FAIL exceeds UNSURE; review conservative-exclusion rules.");
  if (unmappedPass > 0) warnings.push(`${unmappedPass.toLocaleString("en-US")} PASS records are intentionally unmapped and require canonical review before content generation.`);

  const summary = {
    schemaVersion: 1,
    release: CMS_RELEASE.version,
    importedAt,
    sourceSha256,
    totalCodes: rows.length,
    billableCodes,
    nonBillableCodes: rows.length - billableCodes,
    classifications: counts,
    mappedPass,
    unmappedPass,
    canonicalConditionCount: canonicalConditions.length,
    clinicalContentGroupCount: contentGroups.length,
    duplicateGroupCount: duplicateGroups.length,
    lateralityDuplicateGroupCount: lateralityGroups.length,
    topFamilies: topFamilies(rows),
    warnings,
  };

  const lowConfidence = classifications.filter((record) => record.classification === "PASS" && record.groupingConfidence === "low");
  const severityStage = classifications.filter((record) => record.variantMetadata.stage || record.variantMetadata.severity || record.variantMetadata.complication);
  const lateralityPreserved = classifications.filter((record) => record.variantMetadata.laterality && record.clinicallyMaterialDistinction);
  const artifacts = new Map([
    [path.join(DATA_DIR, "canonical-conditions.json"), json({ conditions: canonicalConditions })],
    [path.join(DATA_DIR, "icd-10-cm-current.json"), json({ schemaVersion: 1, release: CMS_RELEASE, codes: rows })],
    [path.join(DATA_DIR, "icd-classifications.json"), json({ schemaVersion: 2, release: CMS_RELEASE.version, records: classifications })],
    [path.join(DATA_DIR, "duplicate-groups.json"), json({ schemaVersion: 1, contentGroups, duplicateGroups })],
    [path.join(DATA_DIR, "classification-summary.json"), json(summary)],
    [path.join(DATA_DIR, "review/fail-codes.json"), json({ release: CMS_RELEASE.version, records: classifications.filter((record) => record.classification === "FAIL").map(reviewRecord) })],
    [path.join(DATA_DIR, "review/unmapped-pass-codes.json"), json({ release: CMS_RELEASE.version, records: classifications.filter((record) => record.unmappedPass).map(reviewRecord) })],
    [path.join(DATA_DIR, "review/unsure-codes.json"), json({ release: CMS_RELEASE.version, records: classifications.filter((record) => record.classification === "UNSURE").map(reviewRecord) })],
    [path.join(DATA_DIR, "review/low-confidence-grouping.json"), json({ release: CMS_RELEASE.version, records: lowConfidence.map(reviewRecord) })],
    [path.join(DATA_DIR, "review/severity-stage-variants.json"), json({ release: CMS_RELEASE.version, records: severityStage.map(reviewRecord) })],
    [path.join(DATA_DIR, "review/laterality-collapsed.json"), json({ release: CMS_RELEASE.version, groups: lateralityGroups })],
    [path.join(DATA_DIR, "review/laterality-intentionally-preserved.json"), json({ release: CMS_RELEASE.version, rationale: "These laterality-bearing codes remain in material stage, severity, complication, or treatment variants. Laterality itself is not the separating dimension.", records: lateralityPreserved.map(reviewRecord) })],
  ]);

  const metadata = {
    schemaVersion: 1,
    release: CMS_RELEASE,
    importedAt,
    rowCount: rows.length,
    billableCount: billableCodes,
    nonBillableCount: rows.length - billableCodes,
    source: {
      url: CMS_RELEASE.sourceUrl,
      fileName: CMS_RELEASE.sourceFileName,
      entryName: CMS_RELEASE.sourceEntryName,
      sha256: sourceSha256,
      entrySha256: sha256(orderBuffer),
    },
    reproducibility: "The importer reuses importedAt for an unchanged source checksum; npm run icd:check regenerates all artifacts in memory and compares exact bytes.",
  };
  artifacts.set(METADATA_PATH, json(metadata));
  artifacts.set(REPORT_PATH, buildReport(summary, classifications, contentGroups, duplicateGroups, warnings));
  return { artifacts, summary };
}

async function main() {
  const check = process.argv.includes("--check");
  const refreshTimestamp = process.argv.includes("--refresh-timestamp");
  const { artifacts, summary } = await buildArtifacts({ refreshTimestamp });
  if (check) {
    const mismatches = [];
    for (const [filePath, expected] of artifacts) {
      let actual = null;
      try { actual = await readFile(filePath, "utf8"); } catch { /* Report missing files below. */ }
      if (actual !== expected) mismatches.push(path.relative(ROOT, filePath));
    }
    if (mismatches.length) throw new Error(`Generated ICD artifacts are stale or non-reproducible:\n${mismatches.join("\n")}`);
    console.log(`ICD artifact check passed for ${artifacts.size} files and ${summary.totalCodes} CMS rows.`);
    return;
  }

  await Promise.all([mkdir(DATA_DIR, { recursive: true }), mkdir(REVIEW_DIR, { recursive: true }), mkdir(path.dirname(REPORT_PATH), { recursive: true })]);
  for (const [filePath, contents] of artifacts) await writeFile(filePath, contents, "utf8");
  console.log(`Imported ${summary.totalCodes} CMS rows (${summary.billableCodes} billable): PASS ${summary.classifications.PASS}, FAIL ${summary.classifications.FAIL}, UNSURE ${summary.classifications.UNSURE}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
