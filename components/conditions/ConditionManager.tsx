"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMMON_CONDITION_LIBRARY,
  normalizeConditionInput,
  searchConditionLibrary,
  type ConditionSuggestion,
} from "../../lib/ccm/conditions";
import type { ConditionNormalizationStatus } from "../../lib/ccm/types";

export type ConditionManagerValue = {
  addedBy?: string | null;
  canonicalName: string;
  ccmQualifying: boolean;
  clientId?: string;
  codeSystem?: string | null;
  dateAdded?: string | null;
  displayName: string;
  icd10Code?: string | null;
  id?: string;
  isActive: boolean;
  normalizationStatus: ConditionNormalizationStatus;
  notes?: string | null;
  userEnteredText: string;
};

type BankState = {
  favorites: boolean;
  recent: boolean;
  search: boolean;
};

type Props = {
  addedByLabel?: string;
  className?: string;
  conditionLibrary?: ConditionSuggestion[];
  description?: string;
  favoriteConditions?: ConditionSuggestion[];
  minimumQualifyingConditions?: number;
  onChange: (conditions: ConditionManagerValue[]) => void;
  readOnly?: boolean;
  storageKey?: string;
  title?: string;
  value: ConditionManagerValue[];
};

const EMPTY_BANK_STATE: BankState = {
  favorites: false,
  recent: false,
  search: false,
};

function conditionKey(condition: ConditionManagerValue, index: number): string {
  return condition.id ?? condition.clientId ?? `${condition.canonicalName}-${index}`;
}

function createClientId(): string {
  return `condition-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "Not saved yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function matchesCondition(
  condition: ConditionManagerValue,
  suggestion: Pick<ConditionSuggestion, "canonicalName" | "code">,
): boolean {
  if (condition.icd10Code && suggestion.code) {
    return condition.icd10Code.toLowerCase() === suggestion.code.toLowerCase();
  }

  return condition.canonicalName.toLowerCase() === suggestion.canonicalName.toLowerCase();
}

function suggestionToValue(
  suggestion: ConditionSuggestion,
  userEnteredText: string,
  addedByLabel: string | null | undefined,
  normalizationStatus: ConditionNormalizationStatus = "normalized",
): ConditionManagerValue {
  return {
    addedBy: addedByLabel ?? null,
    canonicalName: suggestion.canonicalName,
    ccmQualifying: suggestion.ccmQualifying,
    clientId: createClientId(),
    codeSystem: suggestion.codeSystem,
    dateAdded: new Date().toISOString(),
    displayName: suggestion.displayName,
    icd10Code: suggestion.code,
    isActive: true,
    normalizationStatus,
    notes: null,
    userEnteredText,
  };
}

function badgeClass(tone: "good" | "muted" | "warning") {
  if (tone === "good") return "border-green-200 bg-green-50 text-green-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function statusLabel(status: ConditionNormalizationStatus): string {
  if (status === "normalized") return "Normalized";
  if (status === "unverified") return "Unverified";
  return "Manual entry";
}

function storedRecentKey(storageKey: string): string {
  return `${storageKey}:recent`;
}

function storedBankKey(storageKey: string): string {
  return `${storageKey}:banks`;
}

export function ConditionManager({
  addedByLabel,
  className = "",
  conditionLibrary = COMMON_CONDITION_LIBRARY,
  description = "Document qualifying chronic conditions so CCM eligibility can be reviewed.",
  favoriteConditions = [],
  minimumQualifyingConditions = 2,
  onChange,
  readOnly = false,
  storageKey = "ccm-condition-manager",
  title = "Chronic conditions",
  value,
}: Props) {
  const [query, setQuery] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [bankState, setBankState] = useState<BankState>(EMPTY_BANK_STATE);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [recentConditions, setRecentConditions] = useState<ConditionSuggestion[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConditionManagerValue | null>(null);

  const qualifyingCount = value.filter(
    (condition) => condition.isActive && condition.ccmQualifying,
  ).length;
  const activeConditions = value.filter((condition) => condition.isActive);
  const inactiveConditions = value.filter((condition) => !condition.isActive);
  const suggestions = useMemo(
    () => searchConditionLibrary(query, 6, conditionLibrary),
    [conditionLibrary, query],
  );
  const librarySuggestions = useMemo(
    () => searchConditionLibrary(libraryQuery, 12, conditionLibrary),
    [conditionLibrary, libraryQuery],
  );
  const normalizedQuery = query.trim()
    ? normalizeConditionInput(query, conditionLibrary)
    : null;

  useEffect(() => {
    try {
      const bankValue = window.localStorage.getItem(storedBankKey(storageKey));
      if (bankValue) {
        setBankState({ ...EMPTY_BANK_STATE, ...JSON.parse(bankValue) });
      }

      const recentValue = window.localStorage.getItem(storedRecentKey(storageKey));
      if (recentValue) {
        setRecentConditions(JSON.parse(recentValue) as ConditionSuggestion[]);
      }
    } catch {
      setBankState(EMPTY_BANK_STATE);
      setRecentConditions([]);
    } finally {
      setPreferencesLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    window.localStorage.setItem(storedBankKey(storageKey), JSON.stringify(bankState));
  }, [bankState, preferencesLoaded, storageKey]);

  function updateRecent(suggestion: ConditionSuggestion) {
    const next = [
      suggestion,
      ...recentConditions.filter(
        (item) =>
          item.code !== suggestion.code && item.canonicalName !== suggestion.canonicalName,
      ),
    ].slice(0, 8);

    setRecentConditions(next);
    window.localStorage.setItem(storedRecentKey(storageKey), JSON.stringify(next));
  }

  function addSuggestion(suggestion: ConditionSuggestion, userEnteredText = suggestion.displayName) {
    const existingIndex = value.findIndex((condition) =>
      matchesCondition(condition, suggestion),
    );

    if (existingIndex >= 0) {
      const next = value.map((condition, index) =>
        index === existingIndex
          ? {
              ...condition,
              canonicalName: suggestion.canonicalName,
              ccmQualifying: suggestion.ccmQualifying,
              codeSystem: suggestion.codeSystem,
              displayName: suggestion.displayName,
              icd10Code: suggestion.code,
              isActive: true,
              normalizationStatus: "normalized" as const,
              userEnteredText,
            }
          : condition,
      );
      onChange(next);
    } else {
      onChange([
        ...value,
        suggestionToValue(suggestion, userEnteredText, addedByLabel, "normalized"),
      ]);
    }

    updateRecent(suggestion);
    setQuery("");
  }

  function addFromQuery() {
    if (!normalizedQuery || !query.trim()) return;

    const suggestion: ConditionSuggestion = {
      canonicalName: normalizedQuery.canonicalName,
      ccmQualifying: normalizedQuery.ccmQualifying,
      code: normalizedQuery.code,
      codeSystem: normalizedQuery.codeSystem,
      displayName: normalizedQuery.displayName,
      searchTerms: normalizedQuery.searchTerms,
    };

    const existingIndex = value.findIndex((condition) =>
      matchesCondition(condition, suggestion),
    );

    if (existingIndex >= 0) {
      onChange(
        value.map((condition, index) =>
          index === existingIndex
            ? {
                ...condition,
                canonicalName: normalizedQuery.canonicalName,
                ccmQualifying: normalizedQuery.ccmQualifying,
                codeSystem: normalizedQuery.codeSystem,
                displayName: normalizedQuery.displayName,
                icd10Code: normalizedQuery.code,
                isActive: true,
                normalizationStatus: normalizedQuery.normalizationStatus,
                userEnteredText: normalizedQuery.userEnteredText,
              }
            : condition,
        ),
      );
    } else {
      onChange([
        ...value,
        suggestionToValue(
          suggestion,
          normalizedQuery.userEnteredText,
          addedByLabel,
          normalizedQuery.normalizationStatus,
        ),
      ]);
    }

    if (normalizedQuery.normalizationStatus === "normalized") {
      updateRecent(suggestion);
    }

    setQuery("");
  }

  function removeCondition(targetKey: string) {
    onChange(
      value.map((condition, index) =>
        conditionKey(condition, index) === targetKey
          ? { ...condition, isActive: false }
          : condition,
      ),
    );
  }

  function restoreCondition(targetKey: string) {
    onChange(
      value.map((condition, index) =>
        conditionKey(condition, index) === targetKey
          ? { ...condition, isActive: true }
          : condition,
      ),
    );
  }

  function startEdit(condition: ConditionManagerValue, targetKey: string) {
    setEditingKey(targetKey);
    setDraft({ ...condition });
  }

  function saveEdit() {
    if (!editingKey || !draft?.displayName.trim() || !draft.canonicalName.trim()) return;

    onChange(
      value.map((condition, index) =>
        conditionKey(condition, index) === editingKey
          ? {
              ...draft,
              canonicalName: draft.canonicalName.trim(),
              displayName: draft.displayName.trim(),
              icd10Code: draft.icd10Code?.trim() || null,
              userEnteredText: draft.userEnteredText.trim() || draft.displayName.trim(),
            }
          : condition,
      ),
    );
    setEditingKey(null);
    setDraft(null);
  }

  function toggleBank(key: keyof BankState) {
    setBankState((current) => ({ ...current, [key]: !current[key] }));
  }

  function renderConditionCard(condition: ConditionManagerValue, index: number) {
    const key = conditionKey(condition, index);
    const isEditing = editingKey === key && draft;
    const normalizationTone =
      condition.normalizationStatus === "normalized" ? "good" : "warning";

    return (
      <article
        className={`rounded-md border p-3 ${
          condition.isActive ? "bg-white" : "bg-slate-50 opacity-80"
        }`}
        key={key}
      >
        {!isEditing ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{condition.displayName}</h3>
                <p className="mt-1 text-sm text-slate-700">
                  Canonical: {condition.canonicalName}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Entered as: {condition.userEnteredText || condition.displayName}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded border px-2 py-1 text-xs font-semibold ${
                    condition.isActive ? badgeClass("good") : badgeClass("muted")
                  }`}
                >
                  {condition.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`rounded border px-2 py-1 text-xs font-semibold ${
                    condition.ccmQualifying ? badgeClass("good") : badgeClass("muted")
                  }`}
                >
                  {condition.ccmQualifying ? "CCM qualifying" : "Not CCM qualifying"}
                </span>
                <span
                  className={`rounded border px-2 py-1 text-xs font-semibold ${badgeClass(
                    normalizationTone,
                  )}`}
                >
                  {statusLabel(condition.normalizationStatus)}
                </span>
              </div>
            </div>

            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-800">ICD-10</dt>
                <dd className="text-slate-700">{condition.icd10Code || "Not coded"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Date added</dt>
                <dd className="text-slate-700">{displayDate(condition.dateAdded)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Added by</dt>
                <dd className="text-slate-700">{condition.addedBy || "Not recorded"}</dd>
              </div>
            </dl>

            {condition.normalizationStatus !== "normalized" ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This condition was entered manually and should be reviewed when coding
                accuracy matters.
              </div>
            ) : null}

            {!readOnly ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => startEdit(condition, key)}
                  type="button"
                >
                  Edit
                </button>
                {condition.isActive ? (
                  <button
                    className="rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                    onClick={() => removeCondition(key)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                    onClick={() => restoreCondition(key)}
                    type="button"
                  >
                    Restore
                  </button>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-slate-800">Display name</span>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, displayName: event.target.value } : current,
                    )
                  }
                  value={draft.displayName}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-slate-800">Canonical name</span>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, canonicalName: event.target.value } : current,
                    )
                  }
                  value={draft.canonicalName}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-slate-800">ICD-10 code</span>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, icd10Code: event.target.value } : current,
                    )
                  }
                  placeholder="Optional"
                  value={draft.icd10Code ?? ""}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold text-slate-800">Normalization status</span>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            normalizationStatus:
                              event.target.value as ConditionNormalizationStatus,
                          }
                        : current,
                    )
                  }
                  value={draft.normalizationStatus}
                >
                  <option value="normalized">Normalized</option>
                  <option value="manual">Manual entry</option>
                  <option value="unverified">Unverified</option>
                </select>
              </label>
              <label className="flex gap-2 text-sm md:col-span-2">
                <input
                  checked={draft.ccmQualifying}
                  className="mt-1"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, ccmQualifying: event.target.checked } : current,
                    )
                  }
                  type="checkbox"
                />
                <span className="font-semibold text-slate-800">
                  Count this condition toward CCM chronic-condition readiness.
                </span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={!draft.displayName.trim() || !draft.canonicalName.trim()}
                onClick={saveEdit}
                type="button"
              >
                Save
              </button>
              <button
                className="rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                onClick={() => {
                  setEditingKey(null);
                  setDraft(null);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <section className={`rounded-md border bg-white p-4 text-black ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-700">{description}</p>
        </div>
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            qualifyingCount >= minimumQualifyingConditions
              ? badgeClass("good")
              : badgeClass("warning")
          }`}
        >
          {qualifyingCount >= minimumQualifyingConditions
            ? `Two or more qualifying chronic conditions documented`
            : qualifyingCount === 1
              ? "1 qualifying chronic condition documented"
              : "No qualifying chronic conditions documented"}
        </div>
      </div>

      {!readOnly ? (
        <div className="mt-4 rounded-md border bg-slate-50 p-3">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-800">Add condition</span>
            <span className="block text-xs font-medium text-slate-600">
              CCM Assistant keeps the entered text, canonical condition, and ICD-10 code separate for review.
            </span>
            <input
              className="w-full rounded-md border px-3 py-2"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by plain language or ICD-10 code, for example high blood pressure or I10"
              value={query}
            />
          </label>

          {query.trim() ? (
            <div className="mt-3 space-y-2">
              {suggestions.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      className="rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                      key={`${suggestion.canonicalName}-${suggestion.code}`}
                      onClick={() => addSuggestion(suggestion, query.trim())}
                      type="button"
                    >
                      <span className="block font-semibold text-slate-950">
                        {suggestion.displayName}
                      </span>
                      <span className="block text-xs text-slate-700">
                        {suggestion.canonicalName}
                        {suggestion.code ? ` (${suggestion.code})` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {normalizedQuery?.normalizationStatus === "manual" ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="font-semibold">No deterministic match found.</div>
                  <div className="mt-1">
                    You can add this manually, but it will be marked for review because it
                    has not been normalized to a canonical condition or ICD-10 code.
                  </div>
                </div>
              ) : null}

              <button
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={!query.trim()}
                onClick={addFromQuery}
                type="button"
              >
                {normalizedQuery?.normalizationStatus === "manual"
                  ? "Add manual condition"
                  : "Add condition"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-slate-50">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-900"
            onClick={() => toggleBank("recent")}
            type="button"
          >
            Recent
            <span>{bankState.recent ? "Hide" : "Show"}</span>
          </button>
          {bankState.recent ? (
            <div className="space-y-2 border-t p-3">
              {recentConditions.length ? (
                recentConditions.map((suggestion) => (
                  <button
                    className="block w-full rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                    key={`${suggestion.canonicalName}-${suggestion.code}`}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    {suggestion.displayName}
                    {suggestion.code ? (
                      <span className="ml-1 text-xs text-slate-600">({suggestion.code})</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-700">
                  No recent conditions yet. Recently used conditions will appear here after you add them.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-md border bg-slate-50">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-900"
            onClick={() => toggleBank("favorites")}
            type="button"
          >
            Practice Favorites
            <span>{bankState.favorites ? "Hide" : "Show"}</span>
          </button>
          {bankState.favorites ? (
            <div className="space-y-2 border-t p-3">
              {favoriteConditions.length ? (
                favoriteConditions.map((suggestion) => (
                  <button
                    className="block w-full rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                    key={`${suggestion.canonicalName}-${suggestion.code}`}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    {suggestion.displayName}
                    {suggestion.code ? (
                      <span className="ml-1 text-xs text-slate-600">({suggestion.code})</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-700">
                  No practice favorites configured yet. Use Search or type a condition to add one.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-md border bg-slate-50">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-900"
            onClick={() => toggleBank("search")}
            type="button"
          >
            Search Library
            <span>{bankState.search ? "Hide" : "Show"}</span>
          </button>
          {bankState.search ? (
            <div className="space-y-2 border-t p-3">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                onChange={(event) => setLibraryQuery(event.target.value)}
                placeholder="Search condition library"
                value={libraryQuery}
              />
              {libraryQuery.trim() ? (
                librarySuggestions.length ? (
                  librarySuggestions.map((suggestion) => (
                    <button
                      className="block w-full rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                      key={`${suggestion.canonicalName}-${suggestion.code}`}
                      onClick={() => addSuggestion(suggestion, libraryQuery.trim())}
                      type="button"
                    >
                      {suggestion.displayName}
                      {suggestion.code ? (
                        <span className="ml-1 text-xs text-slate-600">
                          ({suggestion.code})
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-slate-700">
                    No library matches. Add a manual condition if this should be reviewed.
                  </div>
                )
              ) : (
                <div className="text-sm text-slate-700">
                  Search by condition name, plain language, or ICD-10 code.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {activeConditions.length || inactiveConditions.length ? (
          <>
            {activeConditions.map(renderConditionCard)}
            {inactiveConditions.length ? (
              <div className="pt-2">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Inactive conditions
                </h3>
                <div className="space-y-3">{inactiveConditions.map(renderConditionCard)}</div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-md border border-dashed bg-slate-50 p-4 text-sm text-slate-700">
            No chronic conditions documented yet. Add qualifying chronic conditions so CCM
            eligibility and billing review can evaluate the list.
          </div>
        )}
      </div>
    </section>
  );
}
