import { getQuestion, resolveQuestionVersion } from "../question-bank/questions.ts";
import type { AnswerValue, QuestionId } from "../question-bank/types";
import { validateQuestionAnswer } from "../question-bank/validation.ts";
import { buildSessionPlan } from "./planner.ts";
import { deriveAnswerConsequences } from "./priorities.ts";
import {
  DEFAULT_SCHEDULING_POLICY,
  resolveReusableResponses,
} from "./scheduler.ts";
import {
  emptyProgress,
  emptySummary,
  refreshSessionState,
} from "./state.ts";
import type {
  AnswerSessionResult,
  HistoricalQuestionResponse,
  NextSessionQuestion,
  SessionContextSnapshot,
  SessionInput,
  SessionSchedulingPolicy,
  SessionState,
} from "./types";

export class SessionEngineError extends Error {}

export class SessionAnswerValidationError extends SessionEngineError {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join(" "));
    this.name = "SessionAnswerValidationError";
    this.errors = errors;
  }
}

function schedulingPolicy(overrides?: Partial<SessionSchedulingPolicy>): SessionSchedulingPolicy {
  return {
    ...DEFAULT_SCHEDULING_POLICY,
    ...overrides,
    defaultReuseDays: {
      ...DEFAULT_SCHEDULING_POLICY.defaultReuseDays,
      ...overrides?.defaultReuseDays,
    },
  };
}

function forceSource(
  responses: HistoricalQuestionResponse[] | undefined,
  source: HistoricalQuestionResponse["source"],
): HistoricalQuestionResponse[] {
  return (responses ?? []).map((response) => ({ ...response, source }));
}

function contextFromInput(input: SessionInput): SessionContextSnapshot {
  return {
    carePlan: input.carePlan ?? null,
    demographics: input.demographics ?? {},
    diagnoses: input.diagnoses ?? [],
    existingVitals: input.existingVitals ?? [],
    intakeResponses: forceSource(input.intakeResponses, "intake"),
    medications: input.medications ?? [],
    previousAnswers: forceSource(input.previousAnswers, "previous_answer"),
    priorMonthResponses: forceSource(input.priorMonthResponses, "prior_month"),
  };
}

function defaultSessionId(patientId: string, now: string): string {
  return `ccm-session-${patientId}-${now.replace(/[^0-9A-Za-z]/g, "")}`;
}

export function createQuestionSession(
  input: SessionInput,
  options: { now?: string; schedulingPolicy?: Partial<SessionSchedulingPolicy> } = {},
): SessionState {
  const now = options.now ?? new Date().toISOString();
  const policy = schedulingPolicy(options.schedulingPolicy);
  const context = contextFromInput(input);
  const plan = buildSessionPlan(context, input.workflow);
  const reusableResponses = resolveReusableResponses(plan, context, now, policy);
  const questionVersions = Object.fromEntries(
    plan.items.map((item) => [item.questionId, item.questionVersion]),
  ) as SessionState["questionVersions"];

  const session: SessionState = {
    activeModuleIds: plan.activeModuleIds,
    activeQuestionIds: [],
    answers: {},
    branchState: [],
    cancelledAt: null,
    completedAt: null,
    completedQuestionIds: [],
    context,
    coordinatorReviewRequired: false,
    createdAt: now,
    flags: [],
    highestPriority: "NONE",
    id: input.sessionId ?? defaultSessionId(input.patientId, now),
    lastResumedAt: null,
    patientId: input.patientId,
    pausedAt: null,
    plan,
    progress: emptyProgress(),
    providerReviewRequired: false,
    questionVersions,
    resumeCount: 0,
    reusableResponses,
    schemaVersion: 1,
    skippedQuestions: [],
    startedAt: now,
    status: "active",
    summary: emptySummary(),
    tasks: [],
    updatedAt: now,
    workflow: input.workflow,
  };
  return refreshSessionState(session, now, policy);
}

export function getNextQuestion(session: SessionState): NextSessionQuestion | null {
  if (session.status !== "active") return null;
  const skipped = new Set(session.skippedQuestions.map((item) => item.questionId));
  const active = new Set(session.activeQuestionIds);
  const item = session.plan.items.find((candidate) =>
    active.has(candidate.questionId) &&
    !session.answers[candidate.questionId] &&
    !skipped.has(candidate.questionId),
  );
  if (!item) return null;
  const snapshot = resolveQuestionVersion(item.questionId, item.questionVersion);
  if (!snapshot) throw new SessionEngineError(`Question version is unavailable: ${item.questionId} v${item.questionVersion}`);
  return {
    helperText: snapshot.helperText,
    position: session.completedQuestionIds.length + session.skippedQuestions.length + 1,
    questionId: item.questionId,
    questionVersion: item.questionVersion,
    required: item.required,
    text: snapshot.text,
    total: session.plan.items.length,
  };
}

function appendUnique<T>(existing: T[], additions: T[], key: (item: T) => string): T[] {
  const seen = new Set(existing.map(key));
  return [...existing, ...additions.filter((item) => !seen.has(key(item)))];
}

export function answerSessionQuestion(
  session: SessionState,
  questionId: QuestionId,
  answer: AnswerValue,
  answeredAt = new Date().toISOString(),
  options: { schedulingPolicy?: Partial<SessionSchedulingPolicy> } = {},
): AnswerSessionResult {
  if (session.status !== "active") throw new SessionEngineError(`Cannot answer a ${session.status} session.`);
  const planItem = session.plan.items.find((item) => item.questionId === questionId);
  if (!planItem) throw new SessionEngineError(`Question is not part of this session: ${questionId}`);
  if (!session.activeQuestionIds.includes(questionId)) throw new SessionEngineError(`Question is not active: ${questionId}`);
  if (session.answers[questionId]) throw new SessionEngineError(`Question was already answered: ${questionId}`);
  if (session.skippedQuestions.some((item) => item.questionId === questionId)) {
    throw new SessionEngineError(`Question was skipped by the session plan: ${questionId}`);
  }

  const question = getQuestion(questionId);
  if (!question || question.version !== planItem.questionVersion) {
    throw new SessionEngineError(`Active question metadata changed for ${questionId}; start a new session.`);
  }
  const validation = validateQuestionAnswer(question, answer);
  if (!validation.valid) throw new SessionAnswerValidationError(validation.errors);

  const consequences = deriveAnswerConsequences(
    session.id,
    session.patientId,
    question,
    validation.normalizedValue,
    answeredAt,
  );
  const next = refreshSessionState({
    ...session,
    answers: {
      ...session.answers,
      [questionId]: {
        answer: validation.normalizedValue,
        answeredAt,
        questionId,
        questionVersion: planItem.questionVersion,
      },
    },
    flags: appendUnique(
      session.flags,
      consequences.flags,
      (flag) => `${flag.questionId}:${flag.questionVersion}:${flag.code}`,
    ),
    tasks: appendUnique(session.tasks, consequences.tasks, (task) => task.id),
  }, answeredAt, schedulingPolicy(options.schedulingPolicy));

  return { nextQuestion: getNextQuestion(next), session: next };
}

export function correctSessionAnswer(
  session: SessionState,
  questionId: QuestionId,
  correctedAnswer: AnswerValue,
  correctedAt = new Date().toISOString(),
): SessionState {
  if (!session.answers[questionId]) throw new SessionEngineError(`Question has no completed answer: ${questionId}`);

  const rebuilt = createQuestionSession({
    carePlan: session.context.carePlan,
    demographics: session.context.demographics,
    diagnoses: session.context.diagnoses,
    existingVitals: session.context.existingVitals,
    intakeResponses: session.context.intakeResponses,
    medications: session.context.medications,
    patientId: session.patientId,
    previousAnswers: session.context.previousAnswers,
    priorMonthResponses: session.context.priorMonthResponses,
    sessionId: session.id,
    workflow: session.workflow,
  }, { now: session.createdAt });
  let replayed: SessionState = {
    ...rebuilt,
    createdAt: session.createdAt,
    lastResumedAt: session.lastResumedAt,
    resumeCount: session.resumeCount,
    startedAt: session.startedAt,
  };

  while (replayed.status === "active") {
    const next = getNextQuestion(replayed);
    if (!next) break;
    const previous = session.answers[next.questionId];
    if (!previous && next.questionId !== questionId) break;
    const answer = next.questionId === questionId ? correctedAnswer : previous?.answer;
    if (answer === undefined) break;
    replayed = answerSessionQuestion(
      replayed,
      next.questionId,
      answer,
      next.questionId === questionId ? correctedAt : previous?.answeredAt ?? correctedAt,
    ).session;
  }

  return { ...replayed, updatedAt: correctedAt };
}
