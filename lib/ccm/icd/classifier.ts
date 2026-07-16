import {
  DEFAULT_ICD_CLASSIFICATIONS,
  cloneIcdClassificationRecord,
} from "./mappings.ts";
import type {
  IcdClassification,
  IcdClassificationRecord,
  IcdCodeInput,
  IcdGeneratedStatus,
} from "./types.ts";
import { compactIcdCode, normalizeIcdCode } from "./validator.ts";

type CodeFamilyRule = {
  prefix: string;
  title: string;
  classification: IcdClassification;
  rationale: string;
  canonicalConditionId: string | null;
};

const PASS_CODE_FAMILY_RULES: CodeFamilyRule[] = [
  {
    prefix: "E11",
    title: "Type 2 diabetes mellitus",
    classification: "PASS",
    rationale: "E11 codes represent type 2 diabetes, a chronic CCM condition.",
    canonicalConditionId: "type_2_diabetes",
  },
  {
    prefix: "I10",
    title: "Essential hypertension",
    classification: "PASS",
    rationale: "I10 codes represent hypertension, a chronic CCM condition.",
    canonicalConditionId: "essential_hypertension",
  },
  {
    prefix: "I50",
    title: "Heart failure",
    classification: "PASS",
    rationale: "I50 codes represent heart failure, a chronic CCM condition.",
    canonicalConditionId: "chronic_heart_failure",
  },
  {
    prefix: "N18",
    title: "Chronic kidney disease",
    classification: "PASS",
    rationale: "N18 codes represent chronic kidney disease.",
    canonicalConditionId: "chronic_kidney_disease",
  },
  {
    prefix: "J44",
    title: "Chronic obstructive pulmonary disease",
    classification: "PASS",
    rationale: "J44 codes represent COPD, a chronic CCM condition.",
    canonicalConditionId: "copd",
  },
  {
    prefix: "J45",
    title: "Asthma",
    classification: "PASS",
    rationale: "J45 codes represent asthma, which commonly requires longitudinal management.",
    canonicalConditionId: "asthma",
  },
  {
    prefix: "I48",
    title: "Atrial fibrillation",
    classification: "PASS",
    rationale: "I48 codes represent atrial fibrillation, a chronic cardiovascular condition.",
    canonicalConditionId: "atrial_fibrillation",
  },
  {
    prefix: "I25",
    title: "Coronary artery disease",
    classification: "PASS",
    rationale: "I25 codes commonly represent chronic coronary artery disease.",
    canonicalConditionId: "coronary_artery_disease",
  },
  {
    prefix: "G20",
    title: "Parkinson disease",
    classification: "PASS",
    rationale: "G20 codes represent Parkinson disease, a chronic neurologic condition.",
    canonicalConditionId: "parkinson_disease",
  },
];

const FAIL_CODE_FAMILY_RULES: CodeFamilyRule[] = [
  {
    prefix: "Z23",
    title: "Encounter for immunization",
    classification: "FAIL",
    rationale: "Immunization encounters are preventive services, not chronic condition content.",
    canonicalConditionId: null,
  },
  {
    prefix: "Z00",
    title: "Routine examination",
    classification: "FAIL",
    rationale: "Routine examination codes do not represent chronic condition profiles.",
    canonicalConditionId: null,
  },
];

const CODE_FAMILY_RULES = [...PASS_CODE_FAMILY_RULES, ...FAIL_CODE_FAMILY_RULES];

function toIcdInput(input: string | IcdCodeInput): IcdCodeInput {
  return typeof input === "string" ? { code: input } : input;
}

export function resolveGeneratedStatus(
  classification: IcdClassification,
  canonicalConditionId: string | null,
): IcdGeneratedStatus {
  if (classification === "PASS") {
    return canonicalConditionId ? "mapped_existing" : "pending_generation";
  }

  if (classification === "UNSURE") {
    return "deferred";
  }

  return "blocked";
}

function buildClassificationRecord(
  input: IcdCodeInput,
  classification: IcdClassification,
  rationale: string,
  canonicalConditionId: string | null,
  titleFallback: string,
): IcdClassificationRecord {
  return {
    code: normalizeIcdCode(input.code),
    title: input.title?.trim() || titleFallback,
    classification,
    rationale,
    canonicalConditionId,
    reviewStatus: classification === "UNSURE" ? "needs_clinical_review" : "system_reviewed",
    generatedStatus: resolveGeneratedStatus(classification, canonicalConditionId),
  };
}

function findCodeFamilyRule(code: string): CodeFamilyRule | null {
  const compactCode = compactIcdCode(code);
  return CODE_FAMILY_RULES.find((rule) => compactCode.startsWith(compactIcdCode(rule.prefix))) ?? null;
}

function classifyByTitle(input: IcdCodeInput): IcdClassificationRecord | null {
  const title = input.title?.toLowerCase() ?? "";
  if (!title) return null;

  if (
    title.includes("encounter for immunization") ||
    title.includes("routine") ||
    title.includes("screening for")
  ) {
    return buildClassificationRecord(
      input,
      "FAIL",
      "Administrative, preventive, or screening titles do not represent chronic condition content.",
      null,
      input.title ?? "Administrative encounter",
    );
  }

  if (
    (title.includes("initial encounter") && title.includes("laceration")) ||
    (title.includes("initial encounter") && title.includes("fracture")) ||
    title.includes("acute cough")
  ) {
    return buildClassificationRecord(
      input,
      "FAIL",
      "Acute injury or acute symptom titles are overwhelmingly not CCM-specific content.",
      null,
      input.title ?? "Acute diagnosis",
    );
  }

  if (title.includes("chronic")) {
    return buildClassificationRecord(
      input,
      "PASS",
      "The title explicitly describes a chronic diagnosis and should not be failed automatically.",
      null,
      input.title ?? "Chronic diagnosis",
    );
  }

  return null;
}

export function findIcdClassificationByCode(
  code: string,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord | null {
  const compactQuery = compactIcdCode(code);
  const match = classifications.find((classification) => compactIcdCode(classification.code) === compactQuery);
  return match ? cloneIcdClassificationRecord(match) : null;
}

export function findIcdClassificationsByTitle(
  query: string,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return classifications
    .filter((classification) => classification.title.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => left.code.localeCompare(right.code))
    .map(cloneIcdClassificationRecord);
}

export function classifyIcdCode(
  input: string | IcdCodeInput,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord {
  const icdInput = toIcdInput(input);
  const override = findIcdClassificationByCode(icdInput.code, classifications);

  if (override) {
    return {
      ...override,
      generatedStatus: resolveGeneratedStatus(override.classification, override.canonicalConditionId),
    };
  }

  const familyRule = findCodeFamilyRule(icdInput.code);
  if (familyRule) {
    return buildClassificationRecord(
      icdInput,
      familyRule.classification,
      familyRule.rationale,
      familyRule.canonicalConditionId,
      familyRule.title,
    );
  }

  const titleClassification = classifyByTitle(icdInput);
  if (titleClassification) {
    return titleClassification;
  }

  return buildClassificationRecord(
    icdInput,
    "UNSURE",
    "No deterministic CCM classification exists yet; defer until clinical context or CMS import review is available.",
    null,
    icdInput.title ?? "Unreviewed ICD-10-CM diagnosis",
  );
}

export function listIcdClassifications(
  classification: IcdClassification,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return classifications
    .filter((record) => record.classification === classification)
    .sort((left, right) => left.code.localeCompare(right.code))
    .map(cloneIcdClassificationRecord);
}

export function listPassIcdClassifications(
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return listIcdClassifications("PASS", classifications);
}

export function listFailIcdClassifications(
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return listIcdClassifications("FAIL", classifications);
}

export function listUnsureIcdClassifications(
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return listIcdClassifications("UNSURE", classifications);
}

export function listUnmappedPassIcdClassifications(
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return classifications
    .filter((record) => record.classification === "PASS" && record.canonicalConditionId === null)
    .sort((left, right) => left.code.localeCompare(right.code))
    .map(cloneIcdClassificationRecord);
}
