import {
  DEFAULT_CANONICAL_CONDITIONS,
  cloneCanonicalCondition,
} from "./mappings.ts";
import {
  buildCanonicalConditionId,
  findCanonicalCondition,
} from "./canonical.ts";
import type {
  CanonicalCondition,
  ConditionGenerationPlan,
  FailDiagnosisOverride,
  IcdClassificationRecord,
  SelectedDiagnosisGenerationRequest,
} from "./types.ts";
import { normalizeIcdCode } from "./validator.ts";

type GeneratedProfileOptions = {
  existingConditions?: CanonicalCondition[];
  idPrefix?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function assertGenerationRequest(request: SelectedDiagnosisGenerationRequest): void {
  if (!request.userId.trim()) {
    throw new Error("A userId is required to generate a condition profile.");
  }

  if (!request.reason.trim()) {
    throw new Error("A reason is required to generate a condition profile.");
  }
}

function uniqueGeneratedConditionId(
  classification: IcdClassificationRecord,
  existingConditions: CanonicalCondition[],
  idPrefix?: string,
): string {
  const baseId = buildCanonicalConditionId(classification.title || classification.code);
  const candidateId = idPrefix ? `${idPrefix}_${baseId}` : baseId;
  const existingIds = new Set(existingConditions.map((condition) => condition.id.toLowerCase()));

  if (!existingIds.has(candidateId.toLowerCase())) {
    return candidateId;
  }

  return `${candidateId}_${normalizeIcdCode(classification.code).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

export function createPlaceholderConditionProfile(
  classification: IcdClassificationRecord,
  options: GeneratedProfileOptions = {},
): CanonicalCondition {
  const existingConditions = options.existingConditions ?? DEFAULT_CANONICAL_CONDITIONS;
  const code = normalizeIcdCode(classification.code);

  return {
    id: uniqueGeneratedConditionId(classification, existingConditions, options.idPrefix),
    name: classification.title,
    description: `Generated placeholder profile for ICD-10-CM ${code}. Clinical content has not been authored.`,
    aliases: [code],
    clinicalDomain: "unassigned",
    profileStatus: "generated_placeholder",
    content: {
      questionModules: [],
      carePlanTemplateId: null,
      commonGoals: [],
      monitoringConcepts: [],
      educationTopics: [],
      commonInterventions: [],
      relatedConditionIds: [],
      clinicalNotes: [],
      icdMappings: [code],
    },
  };
}

export function planConditionProfileGeneration(
  classification: IcdClassificationRecord,
  options: {
    clinicSelected?: boolean;
    existingConditions?: CanonicalCondition[];
  } = {},
): ConditionGenerationPlan {
  const existingConditions = options.existingConditions ?? DEFAULT_CANONICAL_CONDITIONS;

  if (classification.classification === "PASS" && classification.canonicalConditionId) {
    const canonicalCondition = findCanonicalCondition(
      classification.canonicalConditionId,
      existingConditions,
    );

    return {
      action: "map_existing",
      classification,
      reason: "PASS diagnosis already maps to an existing canonical condition; no new content is generated.",
      canonicalCondition: canonicalCondition ? cloneCanonicalCondition(canonicalCondition) : null,
      generatedCondition: null,
    };
  }

  if (classification.classification === "PASS") {
    return {
      action: "generate_profile",
      classification,
      reason: "PASS diagnosis has no canonical condition, so one reusable placeholder profile should be generated.",
      canonicalCondition: null,
      generatedCondition: createPlaceholderConditionProfile(classification, { existingConditions }),
    };
  }

  if (classification.classification === "UNSURE" && options.clinicSelected) {
    return {
      action: "generate_after_selection",
      classification,
      reason: "UNSURE diagnosis was selected by a clinic, so generation can proceed with local review context.",
      canonicalCondition: null,
      generatedCondition: createPlaceholderConditionProfile(classification, { existingConditions }),
    };
  }

  if (classification.classification === "UNSURE") {
    return {
      action: "defer_until_selected",
      classification,
      reason: "UNSURE diagnoses do not generate automatically.",
      canonicalCondition: null,
      generatedCondition: null,
    };
  }

  return {
    action: "block_generation",
    classification,
    reason: "FAIL diagnoses never generate automatically.",
    canonicalCondition: null,
    generatedCondition: null,
  };
}

export function createSelectedUnsureGeneration(
  classification: IcdClassificationRecord,
  request: SelectedDiagnosisGenerationRequest,
  existingConditions: CanonicalCondition[] = DEFAULT_CANONICAL_CONDITIONS,
): ConditionGenerationPlan {
  assertGenerationRequest(request);

  if (classification.classification !== "UNSURE") {
    throw new Error("Only UNSURE classifications use the selected-diagnosis generation path.");
  }

  return planConditionProfileGeneration(classification, {
    clinicSelected: true,
    existingConditions,
  });
}

export function createFailDiagnosisOverride(
  classification: IcdClassificationRecord,
  request: SelectedDiagnosisGenerationRequest,
  existingConditions: CanonicalCondition[] = DEFAULT_CANONICAL_CONDITIONS,
): FailDiagnosisOverride {
  assertGenerationRequest(request);

  if (classification.classification !== "FAIL") {
    throw new Error("Authorized overrides are reserved for FAIL classifications.");
  }

  return {
    icd: {
      code: normalizeIcdCode(classification.code),
      title: classification.title,
    },
    timestamp: request.timestamp ?? nowIso(),
    userId: request.userId,
    reason: request.reason,
    originalClassification: classification.classification,
    originalRationale: classification.rationale,
    reviewStatus: "authorized_override",
    generatedCondition: createPlaceholderConditionProfile(classification, {
      existingConditions,
      idPrefix: "override",
    }),
  };
}
