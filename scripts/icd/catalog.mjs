import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { CLINICAL_MAPPING_RULES } from "../clinical-content-config.mjs";

export const CMS_RELEASE = Object.freeze({
  releaseYear: 2026,
  version: "FY 2026 April 1, 2026",
  effectiveFrom: "2026-04-01",
  effectiveThrough: "2026-09-30",
  sourceUrl: "https://www.cms.gov/files/zip/april-1-2026-code-descriptions-tabular-order.zip",
  sourceFileName: "april-1-2026-code-descriptions-tabular-order.zip",
  sourceEntryName: "Code Descriptions/icd10cm_order_2026.txt",
  expectedSourceSha256: "4fd9d8b37f02ab42827c7e7be30595c005b0cc3a6bae7a515e3f4c86b6918688",
  expectedRowCount: 98186,
  expectedBillableCount: 74719,
});

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function dottedIcdCode(sourceCode) {
  const compact = sourceCode.trim().toUpperCase();
  return compact.length > 3 ? `${compact.slice(0, 3)}.${compact.slice(3)}` : compact;
}

export function compactIcdCode(code) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function readZipEntry(zipBuffer, wantedName) {
  let eocd = -1;
  for (let offset = zipBuffer.length - 22; offset >= Math.max(0, zipBuffer.length - 65557); offset -= 1) {
    if (zipBuffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP end-of-central-directory record was not found.");

  const entryCount = zipBuffer.readUInt16LE(eocd + 10);
  let offset = zipBuffer.readUInt32LE(eocd + 16);
  for (let index = 0; index < entryCount; index += 1) {
    if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Invalid ZIP central directory entry at offset ${offset}.`);
    }
    const method = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize = zipBuffer.readUInt32LE(offset + 20);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
    const extraLength = zipBuffer.readUInt16LE(offset + 30);
    const commentLength = zipBuffer.readUInt16LE(offset + 32);
    const localOffset = zipBuffer.readUInt32LE(offset + 42);
    const fileName = zipBuffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    if (fileName === wantedName) {
      if (zipBuffer.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`Invalid local ZIP header for ${wantedName}.`);
      }
      const localNameLength = zipBuffer.readUInt16LE(localOffset + 26);
      const localExtraLength = zipBuffer.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);
      if (method === 0) return Buffer.from(compressed);
      if (method === 8) return inflateRawSync(compressed);
      throw new Error(`Unsupported ZIP compression method ${method}.`);
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`ZIP entry ${wantedName} was not found.`);
}

export function parseCmsOrderFile(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const orderNumber = Number.parseInt(line.slice(0, 5), 10);
      const sourceCode = line.slice(6, 13).trim();
      const status = line.slice(14, 15);
      const shortTitle = line.slice(16, 76).trim();
      const officialTitle = line.slice(77).trim();
      if (!Number.isInteger(orderNumber) || !sourceCode || !officialTitle || !/^[01]$/.test(status)) {
        throw new Error(`Invalid CMS order row ${index + 1}: ${line}`);
      }
      return {
        order: orderNumber,
        code: dottedIcdCode(sourceCode),
        sourceCode,
        officialTitle,
        shortTitle,
        billable: status === "1",
      };
    });
}

const CANONICAL_RULES = [
  ["H0412", "dry_eye_syndrome"],
  ["H353", "age_related_macular_degeneration"],
  ["G892", "chronic_pain"],
  ["J961", "chronic_respiratory_failure"],
  ["I272", "pulmonary_hypertension"],
  ["Z992", "chronic_kidney_disease"],
  ["Z94", "transplant_status"],
  ["E08", "secondary_diabetes_mellitus"],
  ["E09", "secondary_diabetes_mellitus"],
  ["E10", "type_1_diabetes"],
  ["E11", "type_2_diabetes"],
  ["E13", "secondary_diabetes_mellitus"],
  ["I10", "essential_hypertension"],
  ["I25", "coronary_artery_disease"],
  ["I42", "cardiomyopathy"],
  ["I48", "atrial_fibrillation"],
  ["I50", "chronic_heart_failure"],
  ["I69", "cerebrovascular_disease"],
  ["I70", "peripheral_vascular_disease"],
  ["I73", "peripheral_vascular_disease"],
  ["N18", "chronic_kidney_disease"],
  ["J44", "copd"],
  ["J45", "asthma"],
  ["J43", "copd"],
  ["I34", "valvular_heart_disease"],
  ["I35", "valvular_heart_disease"],
  ["I36", "valvular_heart_disease"],
  ["I37", "valvular_heart_disease"],
  ["I38", "valvular_heart_disease"],
  ["G20", "parkinson_disease"],
  ["G35", "multiple_sclerosis"],
  ["G40", "epilepsy"],
  ["G43", "chronic_migraine"],
  ["G62", "peripheral_neuropathy"],
  ["G30", "dementia"],
  ["F01", "dementia"],
  ["F02", "dementia"],
  ["F03", "dementia"],
  ["F20", "schizophrenia"],
  ["F31", "bipolar_disorder"],
  ["F32", "major_depressive_disorder"],
  ["F33", "major_depressive_disorder"],
  ["F41", "generalized_anxiety_disorder"],
  ["G473", "sleep_apnea"],
  ["E78", "hyperlipidemia"],
  ["E66", "obesity"],
  ["E03", "hypothyroidism"],
  ["K21", "gerd"],
  ["K50", "inflammatory_bowel_disease"],
  ["K51", "inflammatory_bowel_disease"],
  ["B18", "chronic_viral_hepatitis"],
  ["B20", "hiv_disease"],
  ["H40", "glaucoma"],
  ["H42", "glaucoma"],
  ["M05", "rheumatoid_arthritis"],
  ["M06", "rheumatoid_arthritis"],
  ["M15", "osteoarthritis"],
  ["M16", "osteoarthritis"],
  ["M17", "osteoarthritis"],
  ["M18", "osteoarthritis"],
  ["M19", "osteoarthritis"],
  ["M80", "osteoporosis"],
  ["M81", "osteoporosis"],
  ["L89", "pressure_ulcer"],
  ["C", "malignancy"],
];

const ANATOMIC_SITES = [
  "eye", "eyelid", "ear", "shoulder", "elbow", "wrist", "hand", "finger", "hip", "knee",
  "ankle", "foot", "toe", "arm", "forearm", "thigh", "leg", "spine", "kidney", "lung",
  "breast", "colon", "rectum", "liver", "pancreas", "prostate", "bladder", "skin",
];

function firstMatch(title, values) {
  return values.find((value) => title.includes(value)) ?? null;
}

export function detectVariantMetadata(row) {
  const title = row.officialTitle.toLowerCase();
  const laterality = title.includes("bilateral")
    ? "bilateral"
    : title.includes("right")
      ? "right"
      : title.includes("left")
        ? "left"
        : title.includes("unspecified eye") || title.includes("unspecified side")
          ? "unspecified"
          : null;
  const encounter = title.includes("initial encounter")
    ? "initial"
    : title.includes("subsequent encounter")
      ? "subsequent"
      : title.includes("sequela")
        ? "sequela"
        : null;
  const stageMatch = title.match(/\bstage (?:[ivx]+|[0-9][a-z]?)\b|\bend stage\b/);
  const severity = firstMatch(title, [
    "mild intermittent", "mild persistent", "moderate persistent", "severe persistent",
    "mild", "moderate", "severe", "in remission", "intractable",
  ]);
  const complication = firstMatch(title, [
    "with diabetic chronic kidney disease", "with nephropathy", "with kidney complications",
    "with retinopathy", "with ophthalmic complications", "with neuropathy",
    "with neurological complications", "with circulatory complications", "with hyperglycemia",
    "with hypoglycemia", "with ketoacidosis", "with hyperosmolarity", "with foot ulcer",
    "with macular edema", "with behavioral disturbance", "with psychotic disturbance",
    "with mood disturbance", "with anxiety", "with exacerbation", "with acute lower respiratory infection",
    "with status asthmaticus", "with current pathological fracture", "dialysis",
  ]);
  return {
    laterality,
    anatomicSite: firstMatch(title, ANATOMIC_SITES),
    encounter,
    stage: stageMatch?.[0] ?? null,
    severity,
    complication,
  };
}

export function resolveCanonicalCondition(row) {
  const lowerTitle = row.officialTitle.toLowerCase();
  const clinicalMatch = CLINICAL_MAPPING_RULES.find((rule) =>
    (!rule.billableOnly || row.billable) &&
    rule.prefixes.some((prefix) => row.sourceCode.startsWith(prefix)) &&
    (!rule.titleIncludesAny || rule.titleIncludesAny.some((value) => lowerTitle.includes(value))) &&
    (!rule.titleExcludesAny || rule.titleExcludesAny.every((value) => !lowerTitle.includes(value))));
  if (clinicalMatch) return clinicalMatch.canonicalConditionId;
  const compact = row.sourceCode;
  const match = CANONICAL_RULES.find(([prefix]) => compact.startsWith(prefix));
  return match?.[1] ?? null;
}

function diabetesVariant(title) {
  if (/ketoacidosis/.test(title)) return "ketoacidosis";
  if (/hyperosmolar/.test(title)) return "hyperosmolarity";
  if (/hypoglycemia/.test(title)) return "hypoglycemia";
  if (/hyperglycemia/.test(title)) return "hyperglycemia";
  if (/kidney|nephropathy/.test(title)) return "kidney_complication";
  if (/proliferative.*retinopathy/.test(title)) return title.includes("macular edema") ? "proliferative_retinopathy_macular_edema" : "proliferative_retinopathy";
  if (/nonproliferative.*retinopathy/.test(title)) return title.includes("macular edema") ? "nonproliferative_retinopathy_macular_edema" : "nonproliferative_retinopathy";
  if (/retinopathy|ophthalmic/.test(title)) return "ophthalmic_complication";
  if (/neuropathy|neurological/.test(title)) return "neurologic_complication";
  if (/circulatory/.test(title)) return "circulatory_complication";
  if (/foot ulcer/.test(title)) return "foot_ulcer";
  if (/other specified complication|other complication/.test(title)) return "other_complication";
  return "general";
}

function glaucomaVariant(title) {
  const type = title.includes("angle-closure") ? "angle_closure" : title.includes("open-angle") ? "open_angle" : "general";
  const stage = title.includes("mild stage") ? "mild" : title.includes("moderate stage") ? "moderate" : title.includes("severe stage") ? "severe" : title.includes("indeterminate stage") ? "indeterminate" : "unspecified";
  return `${type}_${stage}`;
}

function asthmaVariant(title) {
  const severity = title.includes("mild intermittent") ? "mild_intermittent" : title.includes("mild persistent") ? "mild_persistent" : title.includes("moderate persistent") ? "moderate_persistent" : title.includes("severe persistent") ? "severe_persistent" : "unspecified";
  const state = title.includes("status asthmaticus") ? "status" : title.includes("exacerbation") ? "exacerbation" : "baseline";
  return `${severity}_${state}`;
}

export function resolveClinicalContentGroup(row, canonicalConditionId) {
  if (!canonicalConditionId) return null;
  const title = row.officialTitle.toLowerCase();
  let variant = "general";
  if (["type_1_diabetes", "type_2_diabetes", "secondary_diabetes_mellitus"].includes(canonicalConditionId)) variant = diabetesVariant(title);
  else if (canonicalConditionId === "chronic_kidney_disease") variant = /end stage|dialysis/.test(title) ? "dialysis_considerations" : /stage (4|5|iv|v)/.test(title) ? "advanced_stage" : "general";
  else if (canonicalConditionId === "glaucoma") variant = glaucomaVariant(title);
  else if (canonicalConditionId === "chronic_heart_failure") {
    const type = title.includes("systolic") ? "systolic" : title.includes("diastolic") ? "diastolic" : title.includes("combined") ? "combined" : "general";
    const state = title.includes("acute on chronic") ? "acute_on_chronic" : title.includes("acute") ? "acute" : title.includes("chronic") ? "chronic" : "unspecified";
    variant = `${type}_${state}`;
  } else if (canonicalConditionId === "copd") variant = title.includes("exacerbation") ? "exacerbation" : title.includes("acute lower respiratory infection") ? "with_infection" : "general";
  else if (canonicalConditionId === "asthma") variant = asthmaVariant(title);
  else if (canonicalConditionId === "malignancy") variant = `site_${row.sourceCode.slice(0, 3).toLowerCase()}`;
  else if (canonicalConditionId === "dementia") {
    const severity = title.includes("mild") ? "mild" : title.includes("moderate") ? "moderate" : title.includes("severe") ? "severe" : "unspecified";
    const behavior = /behavioral|psychotic|mood|anxiety|agitation/.test(title) ? "behavioral_features" : "without_behavioral_features";
    variant = `${severity}_${behavior}`;
  } else if (canonicalConditionId === "pressure_ulcer") {
    const stage = title.match(/stage ([1-4])/)?.[1] ?? (title.includes("unstageable") ? "unstageable" : title.includes("deep tissue") ? "deep_tissue" : "unspecified");
    variant = `stage_${stage}`;
  } else if (canonicalConditionId === "osteoporosis") variant = title.includes("current pathological fracture") ? "with_current_fracture" : "without_current_fracture";
  else if (canonicalConditionId === "transplant_status") variant = firstMatch(title, ["heart", "lung", "liver", "kidney", "bone marrow", "corneal", "organ"])?.replace(/\s+/g, "_") ?? "general";
  else if (canonicalConditionId === "chronic_pain") variant = title.includes("neoplasm related") ? "neoplasm_related" : "general";
  else if (canonicalConditionId === "lumbar_spinal_stenosis") variant = title.includes("with neurogenic claudication") ? "neurogenic_claudication" : "without_neurogenic_claudication";
  else if (["cervical_disc_disease", "lumbar_disc_disease"].includes(canonicalConditionId)) variant = title.includes("myelopathy") ? "with_myelopathy" : title.includes("radiculopathy") ? "with_radiculopathy" : "general";
  else if (canonicalConditionId === "chronic_gout") variant = title.includes("with tophus") ? "with_tophus" : "without_tophus";
  else if (canonicalConditionId === "non_pressure_chronic_ulcer") variant = /necrosis of muscle|necrosis of bone|muscle involvement|bone involvement/.test(title) ? "deep_tissue_involvement" : "skin_or_fat_layer";
  else if (canonicalConditionId === "bronchiectasis") variant = title.includes("exacerbation") ? "exacerbation" : title.includes("acute lower respiratory infection") ? "with_infection" : "general";
  else if (canonicalConditionId === "sickle_cell_disease") variant = title.includes("acute chest syndrome") ? "acute_chest_syndrome" : title.includes("with crisis") ? "with_crisis" : "without_crisis";
  else if (["alcohol_use_disorder", "opioid_use_disorder", "nicotine_dependence"].includes(canonicalConditionId)) variant = title.includes("in remission") ? "in_remission" : title.includes("withdrawal") ? "with_withdrawal" : /intoxication|induced disorder/.test(title) ? "with_complication" : "general";
  else if (canonicalConditionId === "aortic_aneurysm") variant = title.includes("ruptured") ? "rupture_recorded" : "without_rupture";
  else if (canonicalConditionId === "benign_prostatic_hyperplasia") variant = title.includes("lower urinary tract symptoms") ? "with_lower_urinary_tract_symptoms" : "without_lower_urinary_tract_symptoms";
  else if (canonicalConditionId === "myasthenia_gravis") variant = title.includes("exacerbation") && !title.includes("without") ? "acute_exacerbation" : "general";
  else if (canonicalConditionId === "hyperthyroidism") variant = /crisis|storm/.test(title) ? "thyroid_crisis_or_storm" : "general";
  else if (canonicalConditionId === "adrenal_insufficiency") variant = title.includes("addisonian crisis") ? "adrenal_crisis" : "general";
  else if (canonicalConditionId === "peripheral_vascular_disease") variant = /gangrene|ulcer/.test(title) ? "tissue_loss" : title.includes("rest pain") ? "rest_pain" : title.includes("intermittent claudication") ? "claudication" : "general";
  else if (canonicalConditionId === "valvular_heart_disease") variant = title.includes("aortic") ? "aortic_valve" : title.includes("mitral") ? "mitral_valve" : title.includes("tricuspid") ? "tricuspid_valve" : title.includes("pulmonary valve") ? "pulmonary_valve" : "general";

  return {
    id: `${canonicalConditionId}__${variant}`,
    canonicalConditionId,
    name: `${canonicalConditionId.replaceAll("_", " ")} - ${variant.replaceAll("_", " ")}`,
    variant,
    materialDimensions: variant === "general" ? [] : ["stage/severity/complication or treatment burden"],
  };
}

const FAIL_TITLE_PATTERNS = [
  /encounter for immunization/, /encounter for screening/, /screening for/, /routine .* examination/,
  /encounter for administrative examination/, /encounter for issue of medical certificate/,
  /observation for suspected.*ruled out/, /encounter for fitting and adjustment/,
];

const ACUTE_FAIL_PATTERNS = [
  /acute cough/, /acute upper respiratory infection/, /common cold/, /acute nasopharyngitis/,
  /laceration/, /puncture wound/, /abrasion/, /contusion/, /foreign body/, /burn of/,
  /poisoning by/, /toxic effect of/, /insect bite/,
];

function titleClassification(row) {
  const title = row.officialTitle.toLowerCase();
  const chapter = row.sourceCode[0];
  if (title.includes("chronic") || title.includes("long term") || title.includes("long-term") || title.includes("recurrent") || title.includes("persistent")) {
    return ["PASS", "The official title explicitly indicates a chronic, recurrent, persistent, or long-term condition."];
  }
  if (FAIL_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return ["FAIL", "The code is limited to routine screening, immunization, observation, fitting, or administrative encounter content."];
  }
  if ((chapter === "S" || chapter === "T") && /initial encounter|subsequent encounter/.test(title)) {
    return ["FAIL", "The code represents active treatment or routine follow-up of an acute injury, poisoning, or external-cause event."];
  }
  if (["V", "W", "X", "Y"].includes(chapter)) {
    return title.includes("sequela")
      ? ["UNSURE", "An external-cause sequela may matter to care context but does not itself establish chronic CCM content."]
      : ["FAIL", "The external-cause code describes an event rather than a chronic condition profile."];
  }
  if (ACUTE_FAIL_PATTERNS.some((pattern) => pattern.test(title)) && !title.includes("sequela")) {
    return ["FAIL", "The title describes clearly acute injury, infection, symptom, poisoning, or exposure content."];
  }
  if (chapter === "R") return ["UNSURE", "A symptom or abnormal finding may reflect chronic disease, but its CCM relevance depends on clinical context."];
  if (chapter === "Z") return ["UNSURE", "A status, history, social-context, or encounter code may be relevant but does not reliably identify a CCM condition by itself."];
  if (chapter === "Q") return ["PASS", "Congenital conditions are commonly persistent and remain available for longitudinal care management."];
  if (chapter === "C") return ["PASS", "Active malignancy commonly requires longitudinal coordination and monitoring."];
  if (chapter === "E" && !/^E8[67]/.test(row.sourceCode)) return ["PASS", "Endocrine, nutritional, and metabolic diagnoses are commonly longitudinal conditions."];
  if (chapter === "F" && !row.sourceCode.startsWith("F05")) return ["PASS", "Mental and behavioral diagnoses commonly require longitudinal management."];
  if (chapter === "G" && !/^G0[0-9]/.test(row.sourceCode)) return ["PASS", "This neurologic diagnosis is reasonably likely to require longitudinal management."];
  if (chapter === "I" && !/^I(2[126]|30|33|40)/.test(row.sourceCode)) return ["PASS", "This circulatory diagnosis is reasonably likely to require longitudinal monitoring."];
  if (/^D(5|6[0-4]|8[0-9])/.test(row.sourceCode)) return ["PASS", "This hematologic or immune diagnosis is reasonably likely to require longitudinal monitoring."];
  if (/^J(3[0-9]|4[0-9]|6[0-9]|8[0-9])/.test(row.sourceCode)) return ["PASS", "This respiratory diagnosis is reasonably likely to require longitudinal management."];
  if (/^K(5[0-2]|7[0-7]|86)/.test(row.sourceCode)) return ["PASS", "This digestive diagnosis is reasonably likely to require longitudinal management."];
  if (/^L(20|30|40|89)/.test(row.sourceCode)) return ["PASS", "This dermatologic diagnosis is reasonably likely to require longitudinal management."];
  if (/^M(0[5-6]|1[5-9]|3[0-6]|4[0-5]|4[78]|5[0-4]|8[0-1])/.test(row.sourceCode)) return ["PASS", "This musculoskeletal diagnosis is reasonably likely to require longitudinal management."];
  if (/^N(0[2-5]|1[1-3]|18|25|4[0-6])/.test(row.sourceCode)) return ["PASS", "This genitourinary diagnosis is reasonably likely to require longitudinal management."];
  return ["UNSURE", "The code may be relevant to chronic care, but deterministic catalog rules cannot establish CCM suitability without clinical context."];
}

export function classifyCatalogRow(row, overrideMap = new Map()) {
  const override = overrideMap.get(row.sourceCode);
  const canonicalConditionId = override?.canonicalConditionId ?? resolveCanonicalCondition(row);
  let classification;
  let rationale;
  if (override) {
    classification = override.classification;
    rationale = override.rationale;
  } else if (canonicalConditionId) {
    classification = "PASS";
    rationale = `The code maps deterministically to the ${canonicalConditionId.replaceAll("_", " ")} canonical chronic-care concept.`;
  } else if (!row.billable) {
    classification = "UNSURE";
    rationale = "This non-billable category header is retained for complete CMS hierarchy coverage but is not excluded as if it were a selectable acute diagnosis.";
  } else {
    [classification, rationale] = titleClassification(row);
  }

  const contentGroup = classification === "PASS" ? resolveClinicalContentGroup(row, canonicalConditionId) : null;
  const variantMetadata = detectVariantMetadata(row);
  const materialVariant = Boolean(contentGroup && contentGroup.variant !== "general");
  return {
    code: row.code,
    sourceCode: row.sourceCode,
    title: row.officialTitle,
    officialTitle: row.officialTitle,
    billable: row.billable,
    classification,
    canonicalConditionId: classification === "PASS" ? canonicalConditionId : null,
    clinicalContentGroupId: contentGroup?.id ?? null,
    variantMetadata,
    clinicallyMaterialDistinction: materialVariant,
    groupingConfidence: contentGroup ? "high" : classification === "PASS" ? "low" : "not_grouped",
    unmappedPass: classification === "PASS" && !canonicalConditionId,
    rationale,
    reviewStatus: classification === "UNSURE" || (classification === "PASS" && !canonicalConditionId) ? "needs_clinical_review" : "system_reviewed",
    generatedStatus: classification === "PASS" ? (canonicalConditionId ? "mapped_existing" : "pending_generation") : classification === "FAIL" ? "blocked" : "deferred",
  };
}

export function buildOverrideMap(overrides) {
  return new Map(overrides.map((override) => [compactIcdCode(override.code), override]));
}

export function buildContentGroups(rows, classifications) {
  const groups = new Map();
  for (let index = 0; index < classifications.length; index += 1) {
    const record = classifications[index];
    if (!record.clinicalContentGroupId || !record.canonicalConditionId) continue;
    const definition = resolveClinicalContentGroup(rows[index], record.canonicalConditionId);
    const current = groups.get(record.clinicalContentGroupId) ?? { ...definition, codes: [] };
    current.codes.push(record.code);
    groups.set(record.clinicalContentGroupId, current);
  }
  return [...groups.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function buildDuplicateGroups(contentGroups, classificationByCode) {
  return contentGroups
    .filter((group) => group.codes.length > 1)
    .map((group) => {
      const records = group.codes.map((code) => classificationByCode.get(code));
      const lateralities = [...new Set(records.map((record) => record.variantMetadata.laterality).filter(Boolean))];
      const anatomy = [...new Set(records.map((record) => record.variantMetadata.anatomicSite).filter(Boolean))];
      const encounters = [...new Set(records.map((record) => record.variantMetadata.encounter).filter(Boolean))];
      const collapseReasons = [];
      if (lateralities.length > 1) collapseReasons.push("laterality");
      if (anatomy.length > 1) collapseReasons.push("anatomic_subsite");
      if (encounters.length > 1) collapseReasons.push("encounter_extension");
      if (collapseReasons.length === 0) collapseReasons.push("coding_specificity");
      return {
        id: `duplicate__${group.id}`,
        clinicalContentGroupId: group.id,
        canonicalConditionId: group.canonicalConditionId,
        codes: group.codes,
        collapseReasons,
        clinicallyMaterial: false,
        rationale: "These exact ICD identities share one reusable CCM content unit; coding distinctions do not independently justify duplicate content.",
      };
    });
}

export function reviewRecord(record) {
  return {
    code: record.code,
    officialTitle: record.officialTitle,
    billable: record.billable,
    classification: record.classification,
    canonicalConditionId: record.canonicalConditionId,
    clinicalContentGroupId: record.clinicalContentGroupId,
    variantMetadata: record.variantMetadata,
    rationale: record.rationale,
  };
}

export function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
