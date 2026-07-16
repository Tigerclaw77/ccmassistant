import { getQuestion } from "./question-bank/questions.ts";
import type { SessionState, SessionSummaryFinding } from "./session-engine/types.ts";
import type { PatientIntakeSummary } from "./types.ts";

export type CarePlanSuggestions = {
  barriers: string[];
  goals: string[];
  interventions: string[];
  notes: string[];
};

function answerLabel(answer: SessionSummaryFinding["answer"]): string {
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "Yes" : "No";
  return answer === null ? "No answer" : String(answer).replaceAll("_", " ");
}

function findingLine(item: SessionSummaryFinding): string {
  return `${getQuestion(item.questionId)?.text ?? item.questionId}: ${answerLabel(item.answer)}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function intakeValue(intake: PatientIntakeSummary | null, key: string): string {
  const value = intake?.reviewed_summary ?? intake?.draft_summary;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const field = value[key];
  return typeof field === "string" ? field.trim() : "";
}

export function buildCarePlanSuggestions(
  intake: PatientIntakeSummary | null,
  session: SessionState | null,
): CarePlanSuggestions {
  const goalFindings = session
    ? [...session.summary.patientConcerns, ...session.summary.positiveFindings].filter((item) => item.category === "patient_goals")
    : [];
  return {
    barriers: unique(session ? [
      ...session.summary.functionalConcerns.map(findingLine),
      ...session.summary.socialBarriers.map(findingLine),
    ] : []),
    goals: unique(goalFindings.map(findingLine)),
    interventions: unique(session?.summary.suggestedCoordinatorActions.map((task) => task.type.replaceAll("_", " ")) ?? []),
    notes: unique([
      intakeValue(intake, "care_needs"),
      intakeValue(intake, "documentation_notes"),
      ...(session?.summary.patientConcerns.map(findingLine) ?? []),
    ]),
  };
}

export function mergeCarePlanText(current: string, suggestions: string[]): string {
  const existing = current.split(/\n/).map((item) => item.trim()).filter(Boolean);
  return unique([...existing, ...suggestions]).join("\n");
}
