import canonicalConditionsJson from "../../../data/icd/canonical-conditions.json" with { type: "json" };
import classificationOverridesJson from "../../../data/icd/classification-overrides.json" with { type: "json" };
import classificationsJson from "../../../data/icd/icd-classifications.json" with { type: "json" };
import duplicateGroupsJson from "../../../data/icd/duplicate-groups.json" with { type: "json" };
import type {
  CanonicalCondition,
  CanonicalConditionContent,
  ClinicalContentGroup,
  IcdClassificationRecord,
  IcdKnowledgeBase,
} from "./types.ts";

type CanonicalConditionsFile = {
  conditions: CanonicalCondition[];
};

type ClassificationOverridesFile = {
  overrides: IcdClassificationRecord[];
};

type ClassificationsFile = {
  records: IcdClassificationRecord[];
};

type DuplicateGroupsFile = {
  contentGroups: ClinicalContentGroup[];
};

const canonicalConditionsFile = canonicalConditionsJson as unknown as CanonicalConditionsFile;
const classificationOverridesFile = classificationOverridesJson as unknown as ClassificationOverridesFile;
const classificationsFile = classificationsJson as unknown as ClassificationsFile;
const duplicateGroupsFile = duplicateGroupsJson as unknown as DuplicateGroupsFile;

function cloneContent(content: CanonicalConditionContent): CanonicalConditionContent {
  return {
    questionModules: [...content.questionModules],
    carePlanTemplateId: content.carePlanTemplateId,
    commonGoals: [...content.commonGoals],
    monitoringConcepts: [...content.monitoringConcepts],
    educationTopics: [...content.educationTopics],
    commonInterventions: [...content.commonInterventions],
    relatedConditionIds: [...content.relatedConditionIds],
    clinicalNotes: [...content.clinicalNotes],
    icdMappings: [...content.icdMappings],
  };
}

export function cloneCanonicalCondition(condition: CanonicalCondition): CanonicalCondition {
  return {
    ...condition,
    aliases: [...condition.aliases],
    content: cloneContent(condition.content),
  };
}

export function cloneIcdClassificationRecord(
  classification: IcdClassificationRecord,
): IcdClassificationRecord {
  const clone = { ...classification };
  if (classification.variantMetadata) clone.variantMetadata = { ...classification.variantMetadata };
  return clone;
}

export function cloneClinicalContentGroup(group: ClinicalContentGroup): ClinicalContentGroup {
  return {
    ...group,
    materialDimensions: [...group.materialDimensions],
    codes: [...group.codes],
  };
}

export const DEFAULT_CANONICAL_CONDITIONS: CanonicalCondition[] =
  canonicalConditionsFile.conditions.map(cloneCanonicalCondition);

export const DEFAULT_CLASSIFICATION_OVERRIDES: IcdClassificationRecord[] =
  classificationOverridesFile.overrides.map(cloneIcdClassificationRecord);

export const DEFAULT_ICD_CLASSIFICATIONS: IcdClassificationRecord[] =
  classificationsFile.records.map(cloneIcdClassificationRecord);

export const DEFAULT_CLINICAL_CONTENT_GROUPS: ClinicalContentGroup[] =
  duplicateGroupsFile.contentGroups.map(cloneClinicalContentGroup);

export const DEFAULT_ICD_KNOWLEDGE_BASE: IcdKnowledgeBase = {
  canonicalConditions: DEFAULT_CANONICAL_CONDITIONS,
  classifications: DEFAULT_ICD_CLASSIFICATIONS,
  clinicalContentGroups: DEFAULT_CLINICAL_CONTENT_GROUPS,
};

export function getDefaultIcdKnowledgeBase(): IcdKnowledgeBase {
  return {
    canonicalConditions: DEFAULT_CANONICAL_CONDITIONS.map(cloneCanonicalCondition),
    classifications: DEFAULT_ICD_CLASSIFICATIONS.map(cloneIcdClassificationRecord),
    clinicalContentGroups: DEFAULT_CLINICAL_CONTENT_GROUPS.map(cloneClinicalContentGroup),
  };
}
