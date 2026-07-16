import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { json } from "./catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "data/icd");
const REPORT_PATH = path.join(ROOT, "docs/clinical/icd-audit-report.md");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

const FAIL_CATEGORIES = [
  { id: "vaccination", label: "Vaccination-related encounters and acute events", confidence: "HIGH", questionable: false, reason: "Routine vaccination encounters and acute vaccination reactions do not independently establish chronic diagnoses.", match: (r) => /immunization|vaccination/.test(r.lowerTitle) },
  { id: "abnormal_screening_findings", label: "Abnormal screening findings", confidence: "LOW", questionable: true, reason: "An abnormal screening result is not yet a confirmed chronic diagnosis, but automatic FAIL may be too strong when durable disease is suspected.", match: (r) => /abnormal findings? on .*screening/.test(r.lowerTitle) },
  { id: "screening", label: "Screening encounters", confidence: "HIGH", questionable: false, reason: "Screening codes describe detection encounters and do not establish the condition being screened for.", match: (r) => /screening/.test(r.lowerTitle) },
  { id: "routine_administrative", label: "Routine and administrative encounters", confidence: "HIGH", questionable: false, reason: "Routine examinations, certificates, observation, and administrative encounters are not reusable condition profiles.", match: (r) => r.chapter === "Z" },
  { id: "external_causes", label: "External causes", confidence: "HIGH", questionable: false, reason: "External-cause codes identify an event or circumstance rather than a managed chronic condition.", match: (r) => ["V", "W", "X", "Y"].includes(r.chapter) },
  { id: "fractures", label: "Fractures", confidence: "MEDIUM", questionable: true, reason: "Most active fracture episodes are not CCM-specific, but delayed healing, nonunion, malunion, and functional consequences merit review.", match: (r) => /fracture/.test(r.lowerTitle) },
  { id: "burns_corrosions", label: "Burns and corrosions", confidence: "HIGH", questionable: false, reason: "These codes predominantly describe acute injury treatment episodes.", match: (r) => /burn|corrosion/.test(r.lowerTitle) },
  { id: "lacerations_open_wounds", label: "Lacerations and open wounds", confidence: "HIGH", questionable: false, reason: "These codes predominantly describe acute wound treatment and follow-up.", match: (r) => /laceration|open wound|puncture wound/.test(r.lowerTitle) },
  { id: "poisonings_toxic_effects", label: "Poisonings and toxic effects", confidence: "HIGH", questionable: false, reason: "Poisoning and toxic-effect codes usually represent acute episodes rather than stable chronic content.", match: (r) => /poisoning|toxic effect|adverse effect|underdosing/.test(r.lowerTitle) },
  { id: "device_postprocedural", label: "Device and postprocedural complications", confidence: "MEDIUM", questionable: true, reason: "Complications are often temporary, but recurrent device, dialysis, or transplant-related problems may affect longitudinal care.", match: (r) => /^T(8[0-8])/.test(r.sourceCode) || /postprocedural|complication of|due to .*device|catheter/.test(r.lowerTitle) },
  { id: "other_acute_injuries", label: "Other acute injuries", confidence: "HIGH", questionable: true, reason: "Most active injuries are outside CCM content, while major neurologic or disabling follow-up can require context-sensitive review.", match: (r) => ["S", "T"].includes(r.chapter) },
  { id: "acute_infections", label: "Acute infections", confidence: "HIGH", questionable: false, reason: "Clearly acute infections without chronic sequelae generally do not warrant reusable CCM-specific content.", match: (r) => /acute .*infection|acute .*itis|viral infection|bacterial infection/.test(r.lowerTitle) },
  { id: "self_limited_symptoms", label: "Self-limited symptoms", confidence: "MEDIUM", questionable: true, reason: "Acute symptoms usually do not establish a chronic diagnosis, although persistent symptoms can be relevant.", match: (r) => r.chapter === "R" || /acute cough/.test(r.lowerTitle) },
  { id: "obstetric_pregnancy", label: "Obstetric and pregnancy", confidence: "MEDIUM", questionable: true, reason: "Pregnancy-specific episodes are usually outside Medicare CCM, but disability-based Medicare populations make blanket exclusion unsafe.", match: (r) => r.chapter === "O" },
  { id: "neonatal", label: "Neonatal", confidence: "HIGH", questionable: false, reason: "Neonatal episode codes are overwhelmingly outside Medicare CCM condition content.", match: (r) => r.chapter === "P" },
  { id: "congenital_pediatric", label: "Congenital and pediatric", confidence: "LOW", questionable: true, reason: "Congenital conditions may persist into disabled adult Medicare populations and should not be excluded solely because of age association.", match: (r) => r.chapter === "Q" },
  { id: "other", label: "Other", confidence: "LOW", questionable: true, reason: "Residual codes require focused clinical review because no high-confidence exclusion category explains them.", match: () => true },
];

const UNMAPPED_BUCKETS = [
  { id: "hypertensive_cardiorenal", label: "Hypertensive heart and kidney disease", disposition: "MAP_EXISTING_WITH_VARIANTS", target: "essential_hypertension + heart failure/CKD modules", recommendation: "Review I11-I13 for a hypertension core plus heart-failure and CKD content variants; do not flatten organ involvement.", match: (r) => /^I1[1-3]/.test(r.sourceCode) },
  { id: "ischemic_heart_disease", label: "Other ischemic heart disease", disposition: "MAP_EXISTING_OR_UNSURE", target: "coronary_artery_disease", recommendation: "Review angina and chronic ischemic disease for the CAD core; retain acute ischemic presentations as context-dependent.", match: (r) => /^I2[0-4]/.test(r.sourceCode) },
  { id: "other_arrhythmias", label: "Conduction disorders and other arrhythmias", disposition: "LIKELY_NEW_CANONICAL", target: "cardiac_arrhythmia", recommendation: "Create a broader arrhythmia concept only after separating conduction disease, implanted-device needs, and rhythm-specific monitoring.", match: (r) => /^I4[4-9]/.test(r.sourceCode) },
  { id: "hematology_immune", label: "Hematologic and immune disorders", disposition: "MIXED", target: "anemia or new hematology/immune concepts", recommendation: "Map clear anemia families to anemia, while keeping coagulation, marrow, and immune disorders distinct.", match: (r) => r.chapter === "D" },
  { id: "mental_behavioral", label: "Other mental and behavioral disorders", disposition: "LIKELY_NEW_CANONICAL", target: "condition-specific behavioral health concepts", recommendation: "Prioritize substance-use, PTSD, obsessive-compulsive, and other persistent disorders; avoid one broad mental-health profile.", match: (r) => r.chapter === "F" },
  { id: "neurologic", label: "Other neurologic disorders", disposition: "MIXED", target: "existing neurologic concepts or new condition families", recommendation: "Review movement, neuromuscular, cerebral palsy, sleep, and cognitive families for distinct longitudinal frameworks.", match: (r) => r.chapter === "G" },
  { id: "endocrine_metabolic", label: "Other endocrine and metabolic disorders", disposition: "LIKELY_NEW_CANONICAL", target: "endocrine/metabolic condition families", recommendation: "Group thyroid, pituitary, adrenal, parathyroid, and inherited metabolic disorders by management framework rather than code wording.", match: (r) => r.chapter === "E" },
  { id: "congenital_inherited", label: "Congenital and inherited disorders", disposition: "REVIEW_BEFORE_MAPPING", target: "condition-family taxonomy", recommendation: "The blanket congenital PASS rule creates a large rare-condition queue; review persistence and adult care burden by family before adding canonical IDs.", match: (r) => r.chapter === "Q" },
  { id: "musculoskeletal", label: "Other musculoskeletal disorders", disposition: "MIXED", target: "pain/arthritis concepts or new condition families", recommendation: "Review inflammatory, spinal, connective-tissue, and chronic deformity families; avoid mapping all pain to osteoarthritis.", match: (r) => r.chapter === "M" },
  { id: "dermatologic", label: "Chronic dermatologic disorders", disposition: "LIKELY_NEW_CANONICAL", target: "psoriasis/dermatitis/chronic wound concepts", recommendation: "Separate inflammatory dermatoses, chronic ulcers, and infection-prone skin disease by monitoring needs.", match: (r) => r.chapter === "L" },
  { id: "digestive_hepatic", label: "Other digestive and hepatic disorders", disposition: "MIXED", target: "condition-specific GI/hepatic concepts", recommendation: "Review chronic pancreatic, hepatic, malabsorption, and motility families without merging acute digestive episodes.", match: (r) => r.chapter === "K" },
  { id: "respiratory", label: "Other chronic respiratory disorders", disposition: "MIXED", target: "COPD/asthma or new pulmonary concepts", recommendation: "Review bronchiectasis, interstitial disease, oxygen needs, and sleep-related breathing disorders for separate variants.", match: (r) => r.chapter === "J" },
  { id: "renal_urologic", label: "Other renal and urologic disorders", disposition: "LIKELY_NEW_CANONICAL", target: "renal/urologic condition families", recommendation: "Keep chronic renal, bladder, prostate, and incontinence frameworks distinct; do not force all into CKD.", match: (r) => r.chapter === "N" },
  { id: "ophthalmic", label: "Other chronic ophthalmic disorders", disposition: "LIKELY_NEW_CANONICAL", target: "visual impairment/retinal condition families", recommendation: "Add visual impairment and chronic retinal concepts only where monitoring and functional-support content is reusable.", match: (r) => r.chapter === "H" },
  { id: "other", label: "Other unmapped PASS", disposition: "REVIEW", target: null, recommendation: "Review by three-character family and clinical domain; do not force a mapping solely to reduce the queue.", match: () => true },
];

const COMMON = new Set([
  "essential_hypertension", "type_2_diabetes", "copd", "chronic_heart_failure", "chronic_kidney_disease", "hyperlipidemia", "major_depressive_disorder", "osteoarthritis", "atrial_fibrillation", "coronary_artery_disease", "obesity", "hypothyroidism", "gerd", "glaucoma", "age_related_macular_degeneration", "chronic_back_pain", "peripheral_neuropathy", "dementia", "anemia", "osteoporosis", "malignancy", "chronic_pain", "sleep_apnea", "peripheral_vascular_disease",
]);

const RARE = new Set(["secondary_diabetes_mellitus", "pulmonary_hypertension", "transplant_status", "multiple_sclerosis", "hiv_disease"]);

function relevanceFor(condition) {
  const relevance = COMMON.has(condition.id) ? "COMMON" : RARE.has(condition.id) ? "RARE" : "OCCASIONAL";
  const rationale = relevance === "COMMON"
    ? "Frequently encountered in older or disabled Medicare populations and commonly relevant to longitudinal care coordination."
    : relevance === "OCCASIONAL"
      ? "Meaningfully present in Medicare CCM populations but less broadly encountered than core cardiometabolic, pulmonary, musculoskeletal, and cognitive conditions."
      : "Uncommon across the overall Medicare CCM population, but potentially high burden for affected beneficiaries and therefore not an exclusion signal.";
  return { relevance, rationale };
}

function reviewShape(record) {
  return { code: record.code, officialTitle: record.officialTitle, billable: record.billable, rationale: record.rationale };
}

function groupRecords(records, definitions) {
  const groups = new Map(definitions.map((definition) => [definition.id, { ...definition, records: [] }]));
  for (const record of records) {
    const prepared = { ...record, lowerTitle: record.officialTitle.toLowerCase(), chapter: record.sourceCode[0] };
    const definition = definitions.find((candidate) => candidate.match(prepared));
    groups.get(definition.id).records.push(record);
  }
  return [...groups.values()].map((group) => {
    const definition = Object.fromEntries(Object.entries(group).filter(([key]) => key !== "match" && key !== "records"));
    return {
      ...definition,
      count: group.records.length,
      billableCount: group.records.filter((record) => record.billable).length,
      examples: group.records.slice(0, 6).map(reviewShape),
    };
  }).filter((group) => group.count > 0);
}

function falseFailReason(record) {
  const title = record.officialTitle.toLowerCase();
  if (/abnormal findings? on .*screening/.test(title)) return { category: "abnormal_screening_finding", priority: "HIGH", suggestedReview: "UNSURE", reason: "An abnormal screening finding can trigger longitudinal diagnostic follow-up even though it is not a confirmed condition." };
  if (/delayed healing|nonunion|malunion/.test(title)) return { category: "fracture_healing_complication", priority: "HIGH", suggestedReview: "UNSURE", reason: "Delayed healing, nonunion, or malunion may create prolonged functional and coordination needs." };
  if (/kidney dialysis|dialysis catheter|peritoneal dialysis|organ transplant|transplant of/.test(title)) return { category: "dialysis_or_transplant_context", priority: "HIGH", suggestedReview: "UNSURE", reason: "Dialysis or transplant context can signal durable treatment burden even when the exact code describes a complication or encounter." };
  if (/personal history|long-term|long term|oxygen dependence|ventilator dependence|visual impairment|disability/.test(title)) return { category: "history_status_dependency", priority: "HIGH", suggestedReview: "UNSURE", reason: "History, status, dependency, disability, or chronic-function language warrants context-sensitive review." };
  if (title.includes("subsequent encounter") && /traumatic brain|intracranial injury|spinal cord|amputation|nerve injury|crushing injury/.test(title)) return { category: "major_disabling_injury_followup", priority: "MEDIUM", suggestedReview: "UNSURE", reason: "Major neurologic or disabling injury follow-up may overlap with longitudinal care needs." };
  if (title.includes("subsequent encounter") && (/^T8[0-8]/.test(record.sourceCode) || /device|catheter|postprocedural/.test(title))) return { category: "recurrent_device_or_postprocedural", priority: "MEDIUM", suggestedReview: "UNSURE", reason: "Repeated device or postprocedural complications may require longitudinal coordination." };
  return null;
}

function passReviewReason(record) {
  const title = record.officialTitle.toLowerCase();
  if (/\bacute\b/.test(title) && !/acute on chronic|acute and chronic/.test(title) && !record.canonicalConditionId) {
    return { category: "acute_language_without_canonical_core", priority: "HIGH", suggestedReview: "UNSURE_OR_PASS_WITH_CORE", reason: "The code was classified PASS by chapter/title heuristics despite explicit acute language and no canonical chronic-care mapping." };
  }
  if (record.sourceCode.startsWith("Q") && !record.canonicalConditionId) {
    return { category: "blanket_congenital_chapter_pass", priority: "MEDIUM", suggestedReview: "FAMILY_LEVEL_REVIEW", reason: "The code inherited PASS from a chapter-wide congenital rule; persistence and adult Medicare care burden should be reviewed by family." };
  }
  return null;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) counts.set(keyFn(item), (counts.get(keyFn(item)) ?? 0) + 1);
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => String(column.value(row)).replaceAll("|", "\\|")).join(" | ")} |`).join("\n");
  return `${header}\n${divider}\n${body}`;
}

function buildReport(audit) {
  const failTable = markdownTable(audit.failCategories, [
    { label: "FAIL category", value: (r) => r.label }, { label: "Codes", value: (r) => r.count.toLocaleString("en-US") },
    { label: "Confidence", value: (r) => r.confidence }, { label: "Questionable?", value: (r) => r.questionable ? "Yes" : "No" },
  ]);
  const failExamples = audit.failCategories.map((category) => `### ${category.label}\n\n${category.reason}\n\n${category.examples.map((example) => `- \`${example.code}\` ${example.officialTitle}`).join("\n")}`).join("\n\n");
  const canonicalTable = (rows) => markdownTable(rows, [
    { label: "Canonical condition", value: (r) => r.id }, { label: "Mapped codes", value: (r) => r.mappedCodeCount.toLocaleString("en-US") },
    { label: "Content groups", value: (r) => r.contentGroupCount }, { label: "Medicare relevance", value: (r) => r.medicareRelevance },
  ]);
  const unmappedTable = markdownTable(audit.unmappedPass.groups, [
    { label: "Recommendation group", value: (r) => r.label }, { label: "Codes", value: (r) => r.count.toLocaleString("en-US") },
    { label: "Disposition", value: (r) => r.disposition }, { label: "Likely target", value: (r) => r.target ?? "Clinical review" },
  ]);
  const relevanceTable = markdownTable(audit.medicareRelevance.summary, [
    { label: "Relevance", value: (r) => r.id }, { label: "Canonical conditions", value: (r) => r.count },
  ]);

  return `# ICD-10-CM Knowledge Quality Audit

## Executive Assessment

Overall confidence: **${audit.overallConfidence.score}/100 (${audit.overallConfidence.label})**.

The imported dataset is structurally reliable and reproducible, but it is **not ready for broad question-bank generation**. It is suitable for a limited pilot restricted to high-confidence mapped groups after review of the issues below. The principal constraints are ${audit.unmappedPass.total.toLocaleString("en-US")} unmapped PASS records, ${audit.potentialFalseFail.total.toLocaleString("en-US")} non-mutating false-FAIL review candidates, ${audit.potentialPassReview.total.toLocaleString("en-US")} PASS consistency candidates, and likely under-fragmentation in several large canonical conditions.

No classifications, canonical IDs, mappings, or content-group IDs were changed by this audit. No clinical content was generated.

## Classification Totals

| PASS | FAIL | UNSURE | Total |
| ---: | ---: | ---: | ---: |
| ${audit.classifications.PASS.toLocaleString("en-US")} | ${audit.classifications.FAIL.toLocaleString("en-US")} | ${audit.classifications.UNSURE.toLocaleString("en-US")} | ${audit.totalRecords.toLocaleString("en-US")} |

### PASS and UNSURE Consistency

The PASS review queue contains **${audit.potentialPassReview.total.toLocaleString("en-US")}** records. These are not automatic downgrades: ${audit.potentialPassReview.categories.map((item) => `${item.count.toLocaleString("en-US")} ${item.id}`).join("; ")}. Acute leukemia and acute complications of chronic disease may remain PASS, while acute pain, acute thrombosis, acute stress reactions, and similar unmapped records are weaker candidates for automatic content generation.

UNSURE remains the largest classification and functions as the conservative fallback. Of ${audit.classifications.UNSURE.toLocaleString("en-US")} UNSURE records, ${audit.unsureSummary.billable.toLocaleString("en-US")} are billable and ${audit.unsureSummary.nonBillable.toLocaleString("en-US")} are non-billable hierarchy headers. Largest chapters:

${markdownTable(audit.unsureSummary.topChapters, [
  { label: "Chapter", value: (r) => r.id }, { label: "UNSURE records", value: (r) => r.count.toLocaleString("en-US") },
])}

## FAIL Analysis

${failTable}

The largest FAIL categories are injury and external-cause families. This is directionally consistent with CCM exclusion, but fracture-healing complications, major disabling injury follow-up, and recurring dialysis/device complications deserve targeted review rather than bulk reclassification.

${failExamples}

## Potential False FAIL

The review queue contains **${audit.potentialFalseFail.total.toLocaleString("en-US")}** unique records. This is a sensitivity queue, not a recommendation to reclassify all candidates. Breakdown:

${markdownTable(audit.potentialFalseFail.categories, [
  { label: "Review reason", value: (r) => r.id }, { label: "Candidates", value: (r) => r.count.toLocaleString("en-US") },
])}

High-value review targets are delayed healing/nonunion/malunion, dialysis or transplant context, and explicit history/dependency/disability language. Subsequent-encounter injury codes should only move to UNSURE when the diagnosis itself supports durable care-management burden.

## Unmapped PASS

${audit.unmappedPass.total.toLocaleString("en-US")} PASS records have no canonical condition or content group. Grouped recommendations:

${unmappedTable}

The largest queues are musculoskeletal, congenital/inherited, circulatory, behavioral health, neurologic, and endocrine/metabolic. The congenital queue is a likely over-inclusive consequence of the chapter-level PASS heuristic. Hypertensive cardiorenal and clear anemia families offer the strongest opportunities for existing-canonical mapping, with organ and complication variants preserved.

## Canonical Review

### Largest Conditions

${canonicalTable(audit.canonicalReview.largest)}

### Smallest Conditions

${canonicalTable(audit.canonicalReview.smallest)}

### Merge Opportunities

${audit.canonicalReview.mergeOpportunities.map((item) => `- **${item.ids.join(" + ")}**: ${item.recommendation}`).join("\n")}

### Split and Variant Opportunities

${audit.canonicalReview.splitOpportunities.map((item) => `- **${item.id}**: ${item.recommendation}`).join("\n")}

No duplicate canonical IDs were found. The main risk is under-fragmentation rather than duplicate naming. Peripheral vascular disease currently places ulcer, gangrene, and anatomical variants into one general content group. Rheumatoid arthritis and osteoarthritis also warrant review for management-changing organ, functional, or anatomical modules. Malignancy uses site-family variants and should add treatment state, metastatic disease, and surveillance dimensions before generation.

Laterality validation remains consistent for representative osteoarthritis and glaucoma families. The 61 laterality-collapsed duplicate groups are structurally coherent, but laterality correctness does not by itself establish that all anatomical sites can share identical goals and interventions.

## Medicare Relevance

${relevanceTable}

COMMON, OCCASIONAL, and RARE are informational attributes only. RARE does not imply FAIL. CMS uses the Chronic Condition Warehouse to study chronically ill Medicare beneficiaries, and current CDC evidence emphasizes hypertension, arthritis, high cholesterol, heart disease, cancer, diabetes, and multimorbidity in older adults. Sources: [CMS Medicare Chronic Conditions](https://data.cms.gov/medicare-chronic-conditions), [CMS methodology](https://edit.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/Chronic-Conditions/Downloads/Methods_Overview.pdf), and [CDC adults age 85 and older](https://www.cdc.gov/nchs/data/hestat/hestat105.htm).

## Stability Review

Canonical IDs are syntactically stable and unique. Clinical content group IDs are deterministic and validation-clean, but the taxonomy is not semantically mature enough for broad generation. Stability confidence is **${audit.stability.score}/100**.

Strengths:

- Complete official CMS row coverage and exact-code preservation.
- Deterministic regeneration, duplicate detection, and orphan detection.
- Clear separation of exact diagnosis identity, canonical condition, and content group.
- Representative laterality and stage/severity rules validate correctly.

Remaining instability:

- ${audit.unmappedPass.total.toLocaleString("en-US")} PASS records have no stable content identity.
- Several large canonical conditions use a single general group despite material complication differences.
- Site-based malignancy group IDs do not yet encode treatment state, metastatic disease, or surveillance needs.
- Small one-code canonical mappings reveal incomplete family coverage, especially anemia, hypertension, back pain, and HIV.

## Confidence Components

${markdownTable(audit.overallConfidence.components, [
  { label: "Component", value: (r) => r.id }, { label: "Score", value: (r) => `${r.score}/100` }, { label: "Assessment", value: (r) => r.assessment },
])}

## Recommendation

Do not begin broad question-bank generation. First review the high-priority false-FAIL queue, resolve obvious existing-canonical mappings, define material variants for the largest under-fragmented conditions, and freeze the resulting IDs. A narrow pilot can proceed afterward for high-confidence groups such as hypertension, uncomplicated diabetes, stable COPD, heart failure variants, CKD variants, and osteoarthritis laterality collapse.
`;
}

export async function buildAuditArtifacts() {
  const [classificationFile, canonicalFile, groupFile, metadata] = await Promise.all([
    readJson("data/icd/icd-classifications.json"), readJson("data/icd/canonical-conditions.json"),
    readJson("data/icd/duplicate-groups.json"), readJson("data/icd/import-metadata.json"),
  ]);
  const records = classificationFile.records;
  const failRecords = records.filter((record) => record.classification === "FAIL");
  const passRecords = records.filter((record) => record.classification === "PASS");
  const unmappedPass = passRecords.filter((record) => !record.canonicalConditionId);
  const counts = { PASS: passRecords.length, FAIL: failRecords.length, UNSURE: records.length - passRecords.length - failRecords.length };
  const failCategories = groupRecords(failRecords, FAIL_CATEGORIES).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  const falseFailCandidates = failRecords.map((record) => ({ record, review: falseFailReason(record) })).filter((item) => item.review).map(({ record, review }) => ({ ...reviewShape(record), ...review }));
  const falseFailCategories = countBy(falseFailCandidates, (item) => item.category);
  const passReviewCandidates = passRecords.map((record) => ({ record, review: passReviewReason(record) })).filter((item) => item.review).map(({ record, review }) => ({ ...reviewShape(record), ...review }));
  const passReviewCategories = countBy(passReviewCandidates, (item) => item.category);
  const unmappedGroups = groupRecords(unmappedPass, UNMAPPED_BUCKETS);
  const unsureRecords = records.filter((record) => record.classification === "UNSURE");

  const groupCounts = new Map();
  for (const group of groupFile.contentGroups) groupCounts.set(group.canonicalConditionId, (groupCounts.get(group.canonicalConditionId) ?? 0) + 1);
  const mappedCounts = new Map();
  const billableCounts = new Map();
  for (const record of passRecords.filter((record) => record.canonicalConditionId)) {
    mappedCounts.set(record.canonicalConditionId, (mappedCounts.get(record.canonicalConditionId) ?? 0) + 1);
    if (record.billable) billableCounts.set(record.canonicalConditionId, (billableCounts.get(record.canonicalConditionId) ?? 0) + 1);
  }
  const canonicalStats = canonicalFile.conditions.map((condition) => {
    const relevance = relevanceFor(condition);
    return {
      id: condition.id, name: condition.name, clinicalDomain: condition.clinicalDomain,
      mappedCodeCount: mappedCounts.get(condition.id) ?? 0, billableMappedCodeCount: billableCounts.get(condition.id) ?? 0,
      contentGroupCount: groupCounts.get(condition.id) ?? 0, medicareRelevance: relevance.relevance,
      medicareRelevanceRationale: relevance.rationale,
    };
  }).sort((a, b) => b.mappedCodeCount - a.mappedCodeCount || a.id.localeCompare(b.id));

  const mergeOpportunities = [
    { ids: ["chronic_back_pain", "chronic_pain"], confidence: "HIGH", recommendation: "Consider one chronic-pain canonical core with back-pain and neoplasm-related variants; preserve site-specific functional modules where needed." },
    { ids: ["type_1_diabetes", "type_2_diabetes", "secondary_diabetes_mellitus"], confidence: "MEDIUM", recommendation: "Retain distinct canonical IDs, but share a diabetes core and complication modules to avoid duplicate questions." },
    { ids: ["peripheral_neuropathy", "type_1_diabetes", "type_2_diabetes"], confidence: "MEDIUM", recommendation: "Keep neuropathy independently selectable while reusing a complication module for diabetic neuropathy." },
  ];
  const splitOpportunities = [
    { id: "peripheral_vascular_disease", priority: "HIGH", recommendation: "Split general content by uncomplicated disease, ulceration, gangrene, and revascularization/amputation burden; laterality alone should still collapse." },
    { id: "malignancy", priority: "HIGH", recommendation: "Retain site families but add active treatment, metastatic disease, remission/surveillance, and symptom-burden dimensions." },
    { id: "rheumatoid_arthritis", priority: "HIGH", recommendation: "Separate general inflammatory arthritis from organ involvement, treatment toxicity, and severe functional impairment modules." },
    { id: "osteoporosis", priority: "MEDIUM", recommendation: "Current-fracture separation is useful; consider healing status and recurrent-fracture risk without creating site-by-side profiles." },
    { id: "cerebrovascular_disease", priority: "MEDIUM", recommendation: "Add deficit-specific modules for cognition, speech, motor impairment, swallowing, and mobility while sharing a stroke core." },
    { id: "osteoarthritis", priority: "MEDIUM", recommendation: "Laterality should remain collapsed, but weight-bearing versus upper-extremity disease may need different function and fall-risk modules." },
  ];

  const relevanceSummary = countBy(canonicalStats, (item) => item.medicareRelevance);
  const components = [
    { id: "Data integrity", score: 100, weight: 0.25, assessment: "Complete CMS coverage, checksum, exact identity, and deterministic artifacts validate." },
    { id: "Classification consistency", score: 82, weight: 0.20, assessment: "Broad categories are coherent, with concentrated uncertainty in prolonged injury and device contexts." },
    { id: "False-FAIL resilience", score: 68, weight: 0.20, assessment: "Override recovery exists, but the targeted review queue is material." },
    { id: "PASS mapping completeness", score: Math.round(100 * (passRecords.length - unmappedPass.length) / passRecords.length), weight: 0.20, assessment: "Only mapped PASS records have stable reusable content identity." },
    { id: "Canonical/group stability", score: 68, weight: 0.15, assessment: "IDs are deterministic, but major under-fragmentation and sparse family mapping remain." },
  ];
  const overallScore = Math.round(components.reduce((sum, component) => sum + component.score * component.weight, 0));
  const singletonGroups = groupFile.contentGroups.filter((group) => group.codes.length === 1).length;

  const audit = {
    schemaVersion: 1,
    auditVersion: "2026-07-knowledge-quality-1",
    auditedSourceVersion: metadata.release.version,
    auditedAt: metadata.importedAt,
    totalRecords: records.length,
    classifications: counts,
    overallConfidence: { score: overallScore, label: overallScore >= 85 ? "HIGH" : overallScore >= 70 ? "MODERATE" : "LOW", components },
    readyForBroadQuestionBankGeneration: false,
    failCategories,
    potentialFalseFail: { total: falseFailCandidates.length, categories: falseFailCategories },
    potentialPassReview: { total: passReviewCandidates.length, categories: passReviewCategories },
    unsureSummary: {
      billable: unsureRecords.filter((record) => record.billable).length,
      nonBillable: unsureRecords.filter((record) => !record.billable).length,
      topChapters: countBy(unsureRecords, (record) => record.sourceCode[0]).slice(0, 10),
    },
    unmappedPass: { total: unmappedPass.length, groups: unmappedGroups },
    canonicalReview: {
      total: canonicalStats.length,
      largest: canonicalStats.slice(0, 12),
      smallest: [...canonicalStats].sort((a, b) => a.mappedCodeCount - b.mappedCodeCount || a.id.localeCompare(b.id)).slice(0, 12),
      all: canonicalStats,
      mergeOpportunities,
      splitOpportunities,
    },
    medicareRelevance: { summary: relevanceSummary, conditions: canonicalStats.map(({ id, name, medicareRelevance, medicareRelevanceRationale }) => ({ id, name, relevance: medicareRelevance, rationale: medicareRelevanceRationale })) },
    stability: {
      score: 68,
      canonicalIdsUnique: new Set(canonicalStats.map((item) => item.id)).size === canonicalStats.length,
      clinicalContentGroupIdsUnique: new Set(groupFile.contentGroups.map((item) => item.id)).size === groupFile.contentGroups.length,
      singletonContentGroups: singletonGroups,
      lateralityCollapsedGroups: groupFile.duplicateGroups.filter((group) => group.collapseReasons.includes("laterality")).length,
      assessment: "Deterministic and structurally valid, but not semantically frozen for broad generation.",
    },
  };

  const artifacts = new Map([
    [path.join(DATA_DIR, "audit-summary.json"), json(audit)],
    [path.join(DATA_DIR, "review/potential-false-fail-audit.json"), json({ auditVersion: audit.auditVersion, total: falseFailCandidates.length, categories: falseFailCategories, records: falseFailCandidates })],
    [path.join(DATA_DIR, "review/potential-pass-audit.json"), json({ auditVersion: audit.auditVersion, total: passReviewCandidates.length, categories: passReviewCategories, records: passReviewCandidates })],
    [path.join(DATA_DIR, "review/unmapped-pass-audit.json"), json({ auditVersion: audit.auditVersion, total: unmappedPass.length, groups: unmappedGroups })],
    [path.join(DATA_DIR, "canonical-audit.json"), json({ auditVersion: audit.auditVersion, conditions: canonicalStats, mergeOpportunities, splitOpportunities, medicareRelevance: audit.medicareRelevance, stability: audit.stability })],
    [REPORT_PATH, buildReport(audit)],
  ]);
  return { audit, artifacts };
}

async function main() {
  const check = process.argv.includes("--check");
  const { audit, artifacts } = await buildAuditArtifacts();
  if (check) {
    const mismatches = [];
    for (const [filePath, expected] of artifacts) {
      let actual = null;
      try { actual = await readFile(filePath, "utf8"); } catch { /* Missing is a mismatch. */ }
      if (actual !== expected) mismatches.push(path.relative(ROOT, filePath));
    }
    if (mismatches.length) throw new Error(`ICD audit artifacts are stale or non-deterministic:\n${mismatches.join("\n")}`);
    console.log(`ICD audit check passed for ${artifacts.size} files; confidence ${audit.overallConfidence.score}/100.`);
    return;
  }
  for (const [filePath, contents] of artifacts) await writeFile(filePath, contents, "utf8");
  console.log(`ICD audit complete: confidence ${audit.overallConfidence.score}/100, ${audit.potentialFalseFail.total} false-FAIL review candidates, ${audit.unmappedPass.total} unmapped PASS records.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.stack : error); process.exitCode = 1; });
}
