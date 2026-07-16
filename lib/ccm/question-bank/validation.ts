import type {
  AnswerValue,
  QuestionDefinition,
  ValidationResult,
} from "./types";

function isEmpty(value: AnswerValue | undefined): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function normalizedYesNo(value: AnswerValue | undefined): AnswerValue | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return value;
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateQuestionAnswer(
  question: QuestionDefinition,
  rawValue: AnswerValue | undefined,
): ValidationResult {
  const errors: string[] = [];
  let value = question.answerType === "yes_no" ? normalizedYesNo(rawValue) : rawValue;

  if (question.required && isEmpty(value)) {
    return { valid: false, errors: ["An answer is required."], normalizedValue: null };
  }
  if (isEmpty(value)) return { valid: true, errors: [], normalizedValue: null };

  if (question.answerType === "yes_no" && typeof value !== "boolean") {
    errors.push("Answer must be yes or no.");
  }

  if (question.answerType === "number") {
    if (typeof value === "string" && value.trim() !== "") value = Number(value);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push("Answer must be a number.");
    } else {
      if (question.validation.integer && !Number.isInteger(value)) errors.push("Answer must be a whole number.");
      if (question.validation.min !== undefined && value < question.validation.min) {
        errors.push(`Answer must be at least ${question.validation.min}.`);
      }
      if (question.validation.max !== undefined && value > question.validation.max) {
        errors.push(`Answer must be at most ${question.validation.max}.`);
      }
    }
  }

  if (question.answerType === "date" && (typeof value !== "string" || !validIsoDate(value))) {
    errors.push("Answer must be a valid date in YYYY-MM-DD format.");
  }

  if (question.answerType === "text") {
    if (typeof value !== "string") {
      errors.push("Answer must be text.");
    } else {
      value = value.trim();
      if (question.validation.minLength !== undefined && value.length < question.validation.minLength) {
        errors.push(`Answer must contain at least ${question.validation.minLength} characters.`);
      }
      if (question.validation.maxLength !== undefined && value.length > question.validation.maxLength) {
        errors.push(`Answer must contain no more than ${question.validation.maxLength} characters.`);
      }
      if (question.validation.pattern && !new RegExp(question.validation.pattern).test(value)) {
        errors.push("Answer does not match the required format.");
      }
    }
  }

  const allowed = new Set((question.validation.options ?? []).map((option) => option.value));
  if (question.answerType === "single_select") {
    if (typeof value !== "string" || !allowed.has(value)) errors.push("Select one of the available options.");
  }
  if (question.answerType === "multi_select") {
    if (!Array.isArray(value) || value.some((entry) => !allowed.has(entry))) {
      errors.push("Select only available options.");
    } else {
      value = Array.from(new Set(value));
    }
  }

  return { valid: errors.length === 0, errors, normalizedValue: (value ?? null) as AnswerValue };
}
