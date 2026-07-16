import { getQuestion } from "./question-bank/questions.ts";
import type { AnswerValue } from "./question-bank/types.ts";
import type { SessionState, SessionSummaryFinding } from "./session-engine/types.ts";
import type { JsonValue, Patient, PatientCondition } from "./types.ts";

export const INTAKE_SUMMARY_FIELDS = [
  "patient_overview",
  "chronic_conditions",
  "medications",
  "care_needs",
  "documentation_notes",
] as const;

export type IntakeSummaryField = (typeof INTAKE_SUMMARY_FIELDS)[number];
export type IntakeManualCorrections = Partial<Record<IntakeSummaryField, string>>;

export type DeterministicIntakeSummary = Record<IntakeSummaryField, string> & {
  source_references: Array<{
    answer: AnswerValue;
    question_id: string;
    question_version: number;
  }>;
};

export type IntakeSessionPreview = {
  incompleteFields: IntakeSummaryField[];
  summary: DeterministicIntakeSummary;
};

function answerText(answer: AnswerValue): string {
  if (answer === null) return "No answer";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "Yes" : "No";
  return String(answer).replaceAll("_", " ");
}

function findingLines(items: SessionSummaryFinding[]): string[] {
  return items.map((item) => `${getQuestion(item.questionId)?.text ?? item.questionId}: ${answerText(item.answer)}`);
}

function uniqueLines(lines: string[]): string {
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean))).join("\n");
}

export function buildIntakeSessionPreview(
  session: SessionState,
  patient: Pick<Patient, "display_name" | "dob" | "preferred_contact_method">,
  conditions: Array<Pick<PatientCondition, "condition_name" | "is_active">>,
  corrections: IntakeManualCorrections = {},
): IntakeSessionPreview {
  if (session.status !== "completed") throw new Error("Intake question session must be completed first");

  const concerns = [
    ...session.summary.patientConcerns,
    ...session.summary.functionalConcerns,
    ...session.summary.socialBarriers,
    ...session.summary.hospitalizations,
  ];
  const documentation = [
    ...session.summary.positiveFindings,
    ...session.summary.negativeFindings,
  ];
  const base: DeterministicIntakeSummary = {
    patient_overview: uniqueLines([
      patient.display_name,
      patient.dob ? `DOB: ${patient.dob}` : "",
      `Preferred contact: ${patient.preferred_contact_method}`,
    ]),
    chronic_conditions: uniqueLines(conditions.filter((item) => item.is_active).map((item) => item.condition_name)),
    medications: uniqueLines(findingLines(session.summary.missedMedications)),
    care_needs: uniqueLines(findingLines(concerns)),
    documentation_notes: uniqueLines(findingLines(documentation)),
    source_references: session.completedQuestionIds.flatMap((questionId) => {
      const response = session.answers[questionId];
      return response ? [{ answer: response.answer, question_id: questionId, question_version: response.questionVersion }] : [];
    }),
  };

  const incompleteFields = INTAKE_SUMMARY_FIELDS.filter((field) => !base[field].trim());
  const summary = { ...base };
  for (const field of INTAKE_SUMMARY_FIELDS) {
    const correction = corrections[field]?.trim();
    if (correction) summary[field] = correction;
  }
  return { incompleteFields, summary };
}

export function intakeSessionSummaryToJson(summary: DeterministicIntakeSummary): JsonValue {
  return summary as unknown as JsonValue;
}
