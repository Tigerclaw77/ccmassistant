import {
  DEFAULT_CANONICAL_CONDITIONS,
  DEFAULT_ICD_CLASSIFICATIONS,
  cloneCanonicalCondition,
  cloneIcdClassificationRecord,
} from "./mappings.ts";
import type { CanonicalCondition, IcdClassificationRecord } from "./types.ts";

export function normalizeCanonicalLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCanonicalConditionId(title: string): string {
  const normalized = normalizeCanonicalLookup(title).replace(/\s+/g, "_");
  return normalized || "unknown_condition";
}

function canonicalMatches(condition: CanonicalCondition, query: string): boolean {
  const normalizedQuery = normalizeCanonicalLookup(query);
  if (!normalizedQuery) return false;

  const values = [
    condition.id,
    condition.name,
    condition.clinicalDomain,
    ...condition.aliases,
  ].map(normalizeCanonicalLookup);

  return values.some((value) => value === normalizedQuery || value.includes(normalizedQuery));
}

function canonicalSearchScore(condition: CanonicalCondition, query: string): number {
  const normalizedQuery = normalizeCanonicalLookup(query);
  if (!normalizedQuery) return 0;

  const id = normalizeCanonicalLookup(condition.id);
  const name = normalizeCanonicalLookup(condition.name);
  const aliases = condition.aliases.map(normalizeCanonicalLookup);

  if (id === normalizedQuery || name === normalizedQuery) return 100;
  if (aliases.includes(normalizedQuery)) return 95;
  if (id.includes(normalizedQuery) || name.includes(normalizedQuery)) return 80;
  if (aliases.some((alias) => alias.includes(normalizedQuery))) return 75;
  return 0;
}

export function listCanonicalConditions(
  conditions: CanonicalCondition[] = DEFAULT_CANONICAL_CONDITIONS,
): CanonicalCondition[] {
  return conditions.map(cloneCanonicalCondition);
}

export function findCanonicalCondition(
  query: string | null | undefined,
  conditions: CanonicalCondition[] = DEFAULT_CANONICAL_CONDITIONS,
): CanonicalCondition | null {
  if (!query) return null;
  const condition = conditions.find((item) => canonicalMatches(item, query));
  return condition ? cloneCanonicalCondition(condition) : null;
}

export function searchCanonicalConditions(
  query: string,
  limit = 10,
  conditions: CanonicalCondition[] = DEFAULT_CANONICAL_CONDITIONS,
): CanonicalCondition[] {
  return conditions
    .map((condition) => ({ condition, score: canonicalSearchScore(condition, query) }))
    .filter((item) => item.score > 0)
    .sort((left, right) =>
      right.score - left.score || left.condition.name.localeCompare(right.condition.name))
    .slice(0, limit)
    .map((item) => cloneCanonicalCondition(item.condition));
}

export function getIcdMappingsForCanonicalCondition(
  conditionId: string,
  classifications: IcdClassificationRecord[] = DEFAULT_ICD_CLASSIFICATIONS,
): IcdClassificationRecord[] {
  const normalizedConditionId = normalizeCanonicalLookup(conditionId);

  return classifications
    .filter((classification) =>
      classification.canonicalConditionId !== null &&
      normalizeCanonicalLookup(classification.canonicalConditionId) === normalizedConditionId)
    .map(cloneIcdClassificationRecord);
}
