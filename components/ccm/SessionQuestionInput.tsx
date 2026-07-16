"use client";

import type { SessionQuestionView } from "../../lib/ccm/session-integration";
import type { AnswerValue } from "../../lib/ccm/question-bank/types";

export default function SessionQuestionInput({
  onChange,
  onCommit,
  question,
  value,
}: {
  onChange: (value: AnswerValue) => void;
  onCommit?: (value: AnswerValue) => void;
  question: SessionQuestionView;
  value: AnswerValue;
}) {
  if (question.answerType === "yes_no") {
    return (
      <select
        className="w-full rounded-md border px-3 py-2"
        onChange={(event) => {
          const next = event.target.value === "" ? null : event.target.value === "yes";
          onChange(next);
          if (next !== null) onCommit?.(next);
        }}
        value={value === true ? "yes" : value === false ? "no" : ""}
      >
        <option value="">Select</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    );
  }

  if (question.answerType === "single_select") {
    return (
      <select
        className="w-full rounded-md border px-3 py-2"
        onChange={(event) => {
          const next = event.target.value || null;
          onChange(next);
          if (next !== null) onCommit?.(next);
        }}
        value={typeof value === "string" ? value : ""}
      >
        <option value="">Select</option>
        {question.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }

  if (question.answerType === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <label className="flex items-center gap-2 text-sm" key={option.value}>
            <input
              checked={selected.includes(option.value)}
              onChange={(event) => onChange(
                event.target.checked
                  ? [...selected, option.value]
                  : selected.filter((entry) => entry !== option.value),
              )}
              type="checkbox"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.answerType === "number") {
    return (
      <input
        className="w-full rounded-md border px-3 py-2"
        onChange={(event) => onChange(event.target.value || null)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value !== null && value !== "") {
            event.preventDefault();
            onCommit?.(value);
          }
        }}
        type="number"
        value={typeof value === "number" || typeof value === "string" ? value : ""}
      />
    );
  }

  if (question.answerType === "date") {
    return (
      <input
        className="w-full rounded-md border px-3 py-2"
        onChange={(event) => onChange(event.target.value || null)}
        type="date"
        value={typeof value === "string" ? value : ""}
      />
    );
  }

  return (
    <input
      className="w-full rounded-md border px-3 py-2"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && typeof value === "string" && value.trim()) {
          event.preventDefault();
          onCommit?.(value);
        }
      }}
      type="text"
      value={typeof value === "string" ? value : ""}
    />
  );
}
