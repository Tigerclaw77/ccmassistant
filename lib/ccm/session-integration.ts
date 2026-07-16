import { QUESTION_CATEGORIES_BY_ID } from "./question-bank/categories.ts";
import { getQuestion } from "./question-bank/questions.ts";
import type {
  AnswerValue,
  QuestionAnswerType,
  QuestionCategoryId,
  SelectOption,
} from "./question-bank/types";
import { getNextQuestion } from "./session-engine/engine.ts";
import {
  deserializeQuestionSession,
  serializeQuestionSession,
} from "./session-engine/persistence.ts";
import type {
  ExistingVitalInput,
  HistoricalQuestionResponse,
  JsonData,
  SessionInput,
  SessionState,
  SessionWorkflow,
} from "./session-engine/types";
import type {
  CarePlan,
  JsonValue,
  Patient,
  PatientCondition,
  QuestionSessionRecord,
  QuestionSessionStatus,
} from "./types";

export type SessionQuestionView = {
  answerType: QuestionAnswerType;
  category: QuestionCategoryId;
  currentSection: string;
  helperText: string;
  options: SelectOption[];
  position: number;
  questionId: `ccm.${string}`;
  questionVersion: number;
  required: boolean;
  text: string;
  total: number;
};

export type QuestionSessionPayload = {
  currentQuestion: SessionQuestionView | null;
  mode: "engine";
  recordId: string;
  session: SessionState;
  stateVersion: number;
  status: QuestionSessionStatus;
};

export type PublicQuestionSessionPayload = Pick<
  QuestionSessionPayload,
  "currentQuestion" | "mode" | "stateVersion" | "status"
> & {
  progress: SessionState["progress"];
};

export type SessionTelemetryEvent = {
  action: string;
  metadata: JsonValue;
};

function asJsonData(value: JsonValue): JsonData {
  return value as JsonData;
}

export function sessionStateToJson(session: SessionState): JsonValue {
  return JSON.parse(serializeQuestionSession(session)) as JsonValue;
}

export function sessionStateFromJson(value: JsonValue): SessionState {
  return deserializeQuestionSession(JSON.stringify(value));
}

export function persistenceStatus(session: SessionState): QuestionSessionStatus {
  if (session.status === "active") return "draft";
  return session.status;
}

export function getSessionQuestionView(session: SessionState): SessionQuestionView | null {
  const next = getNextQuestion(session);
  if (!next) return null;
  const question = getQuestion(next.questionId);
  if (!question) throw new Error(`Question metadata is unavailable: ${next.questionId}`);
  return {
    ...next,
    answerType: question.answerType,
    category: question.category,
    currentSection: QUESTION_CATEGORIES_BY_ID[question.category]?.label ?? question.category,
    options: question.validation.options ?? [],
  };
}

export function getSessionQuestionViewById(session: SessionState, questionId: `ccm.${string}`): SessionQuestionView | null {
  const question = getQuestion(questionId);
  const item = session.plan.items.find((candidate) => candidate.questionId === questionId);
  if (!question || !item) return null;
  return {
    answerType: question.answerType,
    category: question.category,
    currentSection: QUESTION_CATEGORIES_BY_ID[question.category]?.label ?? question.category,
    helperText: question.helperText,
    options: question.validation.options ?? [],
    position: item.sequence + 1,
    questionId,
    questionVersion: item.questionVersion,
    required: item.required,
    text: question.text,
    total: session.plan.items.length,
  };
}

export function toQuestionSessionPayload(
  record: QuestionSessionRecord,
  session = sessionStateFromJson(record.session_state),
): QuestionSessionPayload {
  return {
    currentQuestion: getSessionQuestionView(session),
    mode: "engine",
    recordId: record.id,
    session,
    stateVersion: record.state_version,
    status: record.status,
  };
}

export function toPublicQuestionSessionPayload(
  record: QuestionSessionRecord,
  session = sessionStateFromJson(record.session_state),
): PublicQuestionSessionPayload {
  return {
    currentQuestion: getSessionQuestionView(session),
    mode: "engine",
    progress: session.progress,
    stateVersion: record.state_version,
    status: record.status,
  };
}

function priorResponses(previousSessions: SessionState[]): HistoricalQuestionResponse[] {
  return previousSessions.flatMap((session) =>
    Object.values(session.answers).flatMap((response) => response
      ? [{ ...response, source: "prior_month" as const }]
      : []),
  );
}

export function buildIntegratedSessionInput(args: {
  carePlan?: CarePlan | null;
  conditions: PatientCondition[];
  existingVitals?: ExistingVitalInput[];
  patient: Patient;
  previousSessions?: SessionState[];
  sessionId: string;
  workflow: SessionWorkflow;
}): SessionInput {
  return {
    carePlan: args.carePlan ? {
      barriers: asJsonData(args.carePlan.barriers),
      goals: asJsonData(args.carePlan.goals),
      lastReviewedAt: args.carePlan.last_reviewed_at,
      status: args.carePlan.status,
    } : null,
    demographics: { dob: args.patient.dob },
    diagnoses: args.conditions.map((condition) => ({
      active: condition.is_active,
      canonicalName: condition.canonical_name,
      code: condition.code,
      name: condition.condition_name,
    })),
    existingVitals: args.existingVitals ?? [],
    patientId: args.patient.id,
    priorMonthResponses: priorResponses(args.previousSessions ?? []),
    sessionId: args.sessionId,
    workflow: args.workflow,
  };
}

function idSet(values: Array<{ id?: string; questionId?: string }>): Set<string> {
  return new Set(values.map((value) => value.id ?? value.questionId ?? ""));
}

export function deriveSessionTelemetry(
  before: SessionState,
  after: SessionState,
  answeredQuestionId?: string,
): SessionTelemetryEvent[] {
  const events: SessionTelemetryEvent[] = [];
  if (answeredQuestionId && !before.answers[answeredQuestionId as `ccm.${string}`] && after.answers[answeredQuestionId as `ccm.${string}`]) {
    events.push({ action: "question_session.question_answered", metadata: { questionId: answeredQuestionId } });
  }

  const previousSkips = idSet(before.skippedQuestions.map((item) => ({ questionId: item.questionId })));
  for (const skipped of after.skippedQuestions) {
    if (!previousSkips.has(skipped.questionId)) {
      events.push({
        action: "question_session.question_skipped",
        metadata: { questionId: skipped.questionId, reason: skipped.reason },
      });
    }
  }

  const previousActiveBranches = new Set(
    before.branchState.filter((item) => item.status === "active").map((item) => item.questionId),
  );
  for (const branch of after.branchState) {
    if (branch.status === "active" && !previousActiveBranches.has(branch.questionId)) {
      events.push({ action: "question_session.branch_activated", metadata: { questionId: branch.questionId } });
    }
  }

  const previousTasks = idSet(before.tasks);
  for (const task of after.tasks) {
    if (!previousTasks.has(task.id)) {
      events.push({
        action: "question_session.task_created",
        metadata: { priority: task.priority, questionId: task.questionId, reason: task.reason, taskId: task.id },
      });
    }
  }

  if (before.status === "paused" && after.status === "active") {
    events.push({ action: "question_session.resumed", metadata: { resumeCount: after.resumeCount } });
  }
  if (before.status !== "completed" && after.status === "completed") {
    events.push({ action: "question_session.completed", metadata: { answered: after.progress.answeredQuestions } });
  }
  return events;
}

export function isLegacyCheckIn(sessionRecord: QuestionSessionRecord | null | undefined): boolean {
  return !sessionRecord;
}

export function hasSessionEngineMarker(metadata: JsonValue): boolean {
  return Boolean(
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    metadata.question_session_engine_version === 1,
  );
}

export function responseText(value: AnswerValue): string {
  if (value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
