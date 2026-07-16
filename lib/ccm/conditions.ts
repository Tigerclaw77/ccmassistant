import type { ConditionNormalizationStatus } from "./types";

export type ConditionSuggestion = {
  canonicalName: string;
  ccmQualifying: boolean;
  code: string | null;
  codeSystem: "ICD-10" | null;
  displayName: string;
  searchTerms: string[];
};

export type NormalizedCondition = ConditionSuggestion & {
  normalizationStatus: ConditionNormalizationStatus;
  userEnteredText: string;
};

export const COMMON_CONDITION_LIBRARY: ConditionSuggestion[] = [
  {
    canonicalName: "Essential Hypertension",
    ccmQualifying: true,
    code: "I10",
    codeSystem: "ICD-10",
    displayName: "Essential Hypertension",
    searchTerms: ["high blood pressure", "hypertension", "htn", "i10"],
  },
  {
    canonicalName: "Type 2 Diabetes Mellitus",
    ccmQualifying: true,
    code: "E11.9",
    codeSystem: "ICD-10",
    displayName: "Type 2 Diabetes Mellitus",
    searchTerms: ["diabetes", "type 2 diabetes", "diabetes mellitus", "t2dm", "e11.9"],
  },
  {
    canonicalName: "Chronic Obstructive Pulmonary Disease",
    ccmQualifying: true,
    code: "J44.9",
    codeSystem: "ICD-10",
    displayName: "COPD",
    searchTerms: ["copd", "chronic obstructive pulmonary disease", "emphysema", "j44.9"],
  },
  {
    canonicalName: "Chronic Heart Failure",
    ccmQualifying: true,
    code: "I50.9",
    codeSystem: "ICD-10",
    displayName: "Chronic Heart Failure",
    searchTerms: ["heart failure", "congestive heart failure", "chf", "i50.9"],
  },
  {
    canonicalName: "Chronic Kidney Disease",
    ccmQualifying: true,
    code: "N18.30",
    codeSystem: "ICD-10",
    displayName: "Chronic Kidney Disease",
    searchTerms: ["ckd", "chronic kidney disease", "renal disease", "n18.30"],
  },
  {
    canonicalName: "Hyperlipidemia",
    ccmQualifying: true,
    code: "E78.5",
    codeSystem: "ICD-10",
    displayName: "Hyperlipidemia",
    searchTerms: ["high cholesterol", "hyperlipidemia", "dyslipidemia", "e78.5"],
  },
  {
    canonicalName: "Asthma",
    ccmQualifying: true,
    code: "J45.909",
    codeSystem: "ICD-10",
    displayName: "Asthma",
    searchTerms: ["asthma", "reactive airway disease", "j45.909"],
  },
  {
    canonicalName: "Major Depressive Disorder",
    ccmQualifying: true,
    code: "F32.9",
    codeSystem: "ICD-10",
    displayName: "Major Depressive Disorder",
    searchTerms: ["depression", "major depression", "mdd", "f32.9"],
  },
  {
    canonicalName: "Generalized Anxiety Disorder",
    ccmQualifying: true,
    code: "F41.1",
    codeSystem: "ICD-10",
    displayName: "Generalized Anxiety Disorder",
    searchTerms: ["anxiety", "gad", "generalized anxiety", "f41.1"],
  },
  {
    canonicalName: "Osteoarthritis",
    ccmQualifying: true,
    code: "M19.90",
    codeSystem: "ICD-10",
    displayName: "Osteoarthritis",
    searchTerms: ["arthritis", "osteoarthritis", "degenerative joint disease", "m19.90"],
  },
  {
    canonicalName: "Atrial Fibrillation",
    ccmQualifying: true,
    code: "I48.91",
    codeSystem: "ICD-10",
    displayName: "Atrial Fibrillation",
    searchTerms: ["atrial fibrillation", "afib", "a fib", "i48.91"],
  },
  {
    canonicalName: "Coronary Artery Disease",
    ccmQualifying: true,
    code: "I25.10",
    codeSystem: "ICD-10",
    displayName: "Coronary Artery Disease",
    searchTerms: ["cad", "coronary artery disease", "heart disease", "i25.10"],
  },
  {
    canonicalName: "Obesity",
    ccmQualifying: true,
    code: "E66.9",
    codeSystem: "ICD-10",
    displayName: "Obesity",
    searchTerms: ["obesity", "obese", "e66.9"],
  },
  {
    canonicalName: "Hypothyroidism",
    ccmQualifying: true,
    code: "E03.9",
    codeSystem: "ICD-10",
    displayName: "Hypothyroidism",
    searchTerms: ["hypothyroidism", "low thyroid", "e03.9"],
  },
  {
    canonicalName: "Gastroesophageal Reflux Disease",
    ccmQualifying: true,
    code: "K21.9",
    codeSystem: "ICD-10",
    displayName: "GERD",
    searchTerms: ["gerd", "acid reflux", "reflux", "k21.9"],
  },
  {
    canonicalName: "Glaucoma",
    ccmQualifying: true,
    code: "H40.9",
    codeSystem: "ICD-10",
    displayName: "Glaucoma",
    searchTerms: ["glaucoma", "h40.9"],
  },
  {
    canonicalName: "Age-related Macular Degeneration",
    ccmQualifying: true,
    code: "H35.30",
    codeSystem: "ICD-10",
    displayName: "Age-related Macular Degeneration",
    searchTerms: ["macular degeneration", "amd", "age related macular degeneration", "h35.30"],
  },
  {
    canonicalName: "Dry Eye Syndrome",
    ccmQualifying: true,
    code: "H04.123",
    codeSystem: "ICD-10",
    displayName: "Dry Eye Syndrome",
    searchTerms: ["dry eye", "dry eyes", "ocular surface disease", "h04.123"],
  },
  {
    canonicalName: "Chronic Back Pain",
    ccmQualifying: true,
    code: "M54.50",
    codeSystem: "ICD-10",
    displayName: "Chronic Back Pain",
    searchTerms: ["back pain", "chronic back pain", "low back pain", "m54.50"],
  },
  {
    canonicalName: "Peripheral Neuropathy",
    ccmQualifying: true,
    code: "G62.9",
    codeSystem: "ICD-10",
    displayName: "Peripheral Neuropathy",
    searchTerms: ["neuropathy", "peripheral neuropathy", "nerve pain", "g62.9"],
  },
  {
    canonicalName: "Dementia",
    ccmQualifying: true,
    code: "F03.90",
    codeSystem: "ICD-10",
    displayName: "Dementia",
    searchTerms: ["dementia", "memory loss", "cognitive decline", "f03.90"],
  },
  {
    canonicalName: "Parkinson Disease",
    ccmQualifying: true,
    code: "G20",
    codeSystem: "ICD-10",
    displayName: "Parkinson Disease",
    searchTerms: ["parkinson", "parkinsons", "parkinson disease", "g20"],
  },
  {
    canonicalName: "Chronic Migraine",
    ccmQualifying: true,
    code: "G43.709",
    codeSystem: "ICD-10",
    displayName: "Chronic Migraine",
    searchTerms: ["migraine", "chronic migraine", "headaches", "g43.709"],
  },
  {
    canonicalName: "Anemia",
    ccmQualifying: true,
    code: "D64.9",
    codeSystem: "ICD-10",
    displayName: "Anemia",
    searchTerms: ["anemia", "low hemoglobin", "d64.9"],
  },
  {
    canonicalName: "Osteoporosis",
    ccmQualifying: true,
    code: "M81.0",
    codeSystem: "ICD-10",
    displayName: "Osteoporosis",
    searchTerms: ["osteoporosis", "bone density", "m81.0"],
  },
];

function normalizedSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) =>
      part.length <= 3 && part === part.toUpperCase()
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

function suggestionScore(suggestion: ConditionSuggestion, query: string): number {
  const normalizedQuery = normalizedSearchText(query);
  if (!normalizedQuery) return 0;

  const code = normalizedSearchText(suggestion.code ?? "");
  const canonical = normalizedSearchText(suggestion.canonicalName);
  const display = normalizedSearchText(suggestion.displayName);
  const terms = suggestion.searchTerms.map(normalizedSearchText);

  if (code && code === normalizedQuery) return 100;
  if (canonical === normalizedQuery || display === normalizedQuery) return 95;
  if (terms.includes(normalizedQuery)) return 90;
  if (code && code.startsWith(normalizedQuery)) return 80;
  if (canonical.includes(normalizedQuery) || display.includes(normalizedQuery)) return 70;
  if (terms.some((term) => term.includes(normalizedQuery))) return 65;
  if (normalizedQuery.split(" ").every((part) => canonical.includes(part))) return 50;
  return 0;
}

export function searchConditionLibrary(
  query: string,
  limit = 8,
  library: ConditionSuggestion[] = COMMON_CONDITION_LIBRARY,
): ConditionSuggestion[] {
  return library
    .map((suggestion) => ({ score: suggestionScore(suggestion, query), suggestion }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.suggestion.canonicalName.localeCompare(right.suggestion.canonicalName))
    .slice(0, limit)
    .map((item) => item.suggestion);
}

export function normalizeConditionInput(
  input: string,
  library: ConditionSuggestion[] = COMMON_CONDITION_LIBRARY,
): NormalizedCondition {
  const trimmed = input.trim();
  const exactMatch = searchConditionLibrary(trimmed, 1, library)[0];

  if (exactMatch && suggestionScore(exactMatch, trimmed) >= 90) {
    return {
      ...exactMatch,
      displayName: exactMatch.displayName,
      normalizationStatus: "normalized",
      userEnteredText: trimmed,
    };
  }

  const manualName = titleCase(trimmed);

  return {
    canonicalName: manualName,
    ccmQualifying: true,
    code: null,
    codeSystem: null,
    displayName: manualName,
    normalizationStatus: "manual",
    searchTerms: [trimmed],
    userEnteredText: trimmed,
  };
}
