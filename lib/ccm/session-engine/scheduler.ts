import type { AnswerValue, QuestionId } from "../question-bank/types";
import type {
  HistoricalQuestionResponse,
  SessionContextSnapshot,
  SessionPlan,
  SessionSchedulingPolicy,
} from "./types";

export const DEFAULT_SCHEDULING_POLICY: SessionSchedulingPolicy = {
  allowVersionMismatch: false,
  defaultReuseDays: { existing_vital: 1 },
  optionalQuestionSeconds: 30,
  requiredQuestionSeconds: 45,
};

function addDays(isoTimestamp: string, days: number): number {
  return new Date(isoTimestamp).getTime() + days * 24 * 60 * 60 * 1000;
}

export function isHistoricalResponseValid(
  response: HistoricalQuestionResponse,
  now: string,
  policy: SessionSchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
): boolean {
  const nowTime = new Date(now).getTime();
  if (!Number.isFinite(nowTime)) throw new Error("Session time must be a valid ISO timestamp.");
  if (response.validUntil) return new Date(response.validUntil).getTime() >= nowTime;

  const reuseDays = response.reuseForDays ?? policy.defaultReuseDays[response.source] ?? 0;
  return reuseDays > 0 && addDays(response.answeredAt, reuseDays) >= nowTime;
}

export function collectHistoricalResponses(
  context: SessionContextSnapshot,
): HistoricalQuestionResponse[] {
  const vitals = context.existingVitals.map((vital) => ({
    answer: vital.answer,
    answeredAt: vital.observedAt,
    questionId: vital.questionId,
    questionVersion: vital.questionVersion,
    reuseForDays: vital.reuseForDays,
    source: "existing_vital" as const,
    validUntil: vital.validUntil,
  }));
  return [
    ...context.previousAnswers,
    ...context.priorMonthResponses,
    ...context.intakeResponses,
    ...vitals,
  ];
}

export function resolveReusableResponses(
  plan: SessionPlan,
  context: SessionContextSnapshot,
  now: string,
  policy: SessionSchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
): Partial<Record<QuestionId, HistoricalQuestionResponse>> {
  const byQuestion = new Map<QuestionId, HistoricalQuestionResponse[]>();
  for (const response of collectHistoricalResponses(context)) {
    const existing = byQuestion.get(response.questionId) ?? [];
    existing.push(response);
    byQuestion.set(response.questionId, existing);
  }

  const reusable: Partial<Record<QuestionId, HistoricalQuestionResponse>> = {};
  for (const item of plan.items) {
    const candidates = (byQuestion.get(item.questionId) ?? [])
      .filter((response) =>
        (policy.allowVersionMismatch || response.questionVersion === item.questionVersion) &&
        isHistoricalResponseValid(response, now, policy),
      )
      .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt));
    if (candidates[0]) reusable[item.questionId] = candidates[0];
  }
  return reusable;
}

export function buildEffectiveResponseMap(
  reusable: Partial<Record<QuestionId, HistoricalQuestionResponse>>,
  current: Partial<Record<QuestionId, { answer: AnswerValue }>>,
): Partial<Record<QuestionId, AnswerValue>> {
  const responses: Partial<Record<QuestionId, AnswerValue>> = {};
  for (const [questionId, response] of Object.entries(reusable)) {
    if (response) responses[questionId as QuestionId] = response.answer;
  }
  for (const [questionId, response] of Object.entries(current)) {
    if (response) responses[questionId as QuestionId] = response.answer;
  }
  return responses;
}
