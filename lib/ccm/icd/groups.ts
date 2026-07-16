import {
  DEFAULT_CLINICAL_CONTENT_GROUPS,
  DEFAULT_ICD_CLASSIFICATIONS,
  cloneClinicalContentGroup,
  cloneIcdClassificationRecord,
} from "./mappings.ts";
import type { ClinicalContentGroup, IcdClassificationRecord } from "./types.ts";
import { compactIcdCode } from "./validator.ts";

export function listClinicalContentGroups(
  groups: ClinicalContentGroup[] = DEFAULT_CLINICAL_CONTENT_GROUPS,
): ClinicalContentGroup[] {
  return groups.map(cloneClinicalContentGroup);
}

export function findClinicalContentGroup(
  id: string | null | undefined,
  groups: ClinicalContentGroup[] = DEFAULT_CLINICAL_CONTENT_GROUPS,
): ClinicalContentGroup | null {
  if (!id) return null;
  const normalized = id.trim().toLowerCase();
  const group = groups.find((item) => item.id.toLowerCase() === normalized);
  return group ? cloneClinicalContentGroup(group) : null;
}

export function findClinicalContentGroupForIcdCode(
  code: string,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
  groups: ClinicalContentGroup[] = DEFAULT_CLINICAL_CONTENT_GROUPS,
): ClinicalContentGroup | null {
  const compact = compactIcdCode(code);
  const record = classifications.find((item) => compactIcdCode(item.code) === compact);
  return findClinicalContentGroup(record?.clinicalContentGroupId, groups);
}

export function listIcdCodesForClinicalContentGroup(
  groupId: string,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  return classifications
    .filter((record) => record.clinicalContentGroupId === groupId)
    .map(cloneIcdClassificationRecord);
}
