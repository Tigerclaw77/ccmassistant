import { resolveVisibleQuestions } from "../question-bank/branching.ts";
import { QUESTION_BANK, QUESTIONS_BY_ID } from "../question-bank/questions.ts";
import type { QuestionId } from "../question-bank/types";
import { highestPriority } from "./priorities.ts";
import {
  buildEffectiveResponseMap,
  DEFAULT_SCHEDULING_POLICY,
} from "./scheduler.ts";
import { buildSessionSummary } from "./summary.ts";
import type {
  BranchQuestionState,
  SessionProgress,
  SessionProgressSlice,
  SessionSchedulingPolicy,
  SessionSkippedQuestion,
  SessionState,
} from "./types";

function resolveBranchState(
  session: SessionState,
  activeQuestionIds: Set<QuestionId>,
  responses: ReturnType<typeof buildEffectiveResponseMap>,
): BranchQuestionState[] {
  const states = new Map<QuestionId, BranchQuestionState["status"]>();
  for (const item of session.plan.items) {
    if (item.source !== "follow_up") continue;
    states.set(item.questionId, activeQuestionIds.has(item.questionId) ? "active" : "inactive");
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const item of session.plan.items) {
      if (item.source !== "follow_up" || states.get(item.questionId) !== "inactive") continue;
      const question = QUESTIONS_BY_ID.get(item.questionId);
      if (!question) continue;
      const parentExcluded = question.displayWhen.some((rule) => states.get(rule.questionId) === "excluded");
      const parentsResolved = question.displayWhen.length > 0 && question.displayWhen.every((rule) => {
        const answer = responses[rule.questionId];
        return answer !== undefined && answer !== null;
      });
      if (parentExcluded || parentsResolved) {
        states.set(item.questionId, "excluded");
        changed = true;
      }
    }
  }

  return session.plan.items.flatMap((item) => {
    const status = states.get(item.questionId);
    return status ? [{ questionId: item.questionId, status }] : [];
  });
}

function calculateSlices(
  session: SessionState,
  skippedIds: Set<QuestionId>,
  group: "category" | "module",
): SessionProgressSlice[] {
  const groups = new Map<string, QuestionId[]>();
  for (const item of session.plan.items) {
    const keys = group === "category" ? [item.category] : item.moduleIds;
    for (const key of keys) groups.set(key, [...(groups.get(key) ?? []), item.questionId]);
  }
  return [...groups.entries()].map(([id, questionIds]) => {
    const answered = questionIds.filter((id) => Boolean(session.answers[id])).length;
    const skipped = questionIds.filter((id) => skippedIds.has(id)).length;
    return { answered, complete: answered + skipped === questionIds.length, id, skipped, total: questionIds.length };
  });
}

export function calculateSessionProgress(
  session: SessionState,
  now: string,
  policy: SessionSchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
): SessionProgress {
  const skippedIds = new Set(session.skippedQuestions.map((item) => item.questionId));
  const activeIds = new Set(session.activeQuestionIds);
  const pending = session.plan.items.filter((item) =>
    activeIds.has(item.questionId) && !session.answers[item.questionId] && !skippedIds.has(item.questionId),
  );
  const answeredQuestions = session.completedQuestionIds.length;
  const skippedQuestions = skippedIds.size;
  const totalQuestions = session.plan.items.length;
  const remainingSeconds = pending.reduce(
    (total, item) => total + (item.required ? policy.requiredQuestionSeconds : policy.optionalQuestionSeconds),
    0,
  );
  const estimatedCompletionAt = pending.length === 0
    ? null
    : new Date(new Date(now).getTime() + remainingSeconds * 1000).toISOString();

  return {
    answeredQuestions,
    completionPercentage: totalQuestions === 0
      ? 100
      : Math.round(((answeredQuestions + skippedQuestions) / totalQuestions) * 100),
    estimatedCompletionAt,
    estimatedMinutesRemaining: Math.ceil(remainingSeconds / 60),
    moduleProgress: calculateSlices(session, skippedIds, "module"),
    optionalQuestionsRemaining: pending.filter((item) => !item.required).length,
    requiredQuestionsRemaining: pending.filter((item) => item.required).length,
    sectionProgress: calculateSlices(session, skippedIds, "category"),
    skippedQuestions,
    totalQuestions,
  };
}

function buildSkippedQuestions(
  session: SessionState,
  branchState: BranchQuestionState[],
  activeIds: Set<QuestionId>,
  now: string,
): SessionSkippedQuestion[] {
  const branchById = new Map(branchState.map((item) => [item.questionId, item.status]));
  const previousSkips = new Map(
    session.skippedQuestions.map((item) => [`${item.questionId}:${item.reason}`, item]),
  );
  const skipped: SessionSkippedQuestion[] = [];
  for (const item of session.plan.items) {
    if (session.answers[item.questionId]) continue;
    if (activeIds.has(item.questionId) && session.reusableResponses[item.questionId]) {
      skipped.push({
        questionId: item.questionId,
        questionVersion: item.questionVersion,
        reason: "recent_valid_response",
        skippedAt: previousSkips.get(`${item.questionId}:recent_valid_response`)?.skippedAt ?? now,
      });
      continue;
    }
    if (branchById.get(item.questionId) === "excluded") {
      const question = QUESTIONS_BY_ID.get(item.questionId);
      skipped.push({
        questionId: item.questionId,
        questionVersion: item.questionVersion,
        reason: "branch_excluded",
        skippedAt: previousSkips.get(`${item.questionId}:branch_excluded`)?.skippedAt ?? now,
        sourceQuestionId: question?.displayWhen[0]?.questionId,
      });
    }
  }
  return skipped;
}

export function refreshSessionState(
  session: SessionState,
  now: string,
  policy: SessionSchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
): SessionState {
  const responses = buildEffectiveResponseMap(session.reusableResponses, session.answers);
  const activeQuestionIds = resolveVisibleQuestions(
    session.plan.seedQuestionIds,
    responses,
    QUESTION_BANK,
  ).filter((question) => session.plan.candidateQuestionIds.includes(question.id)).map((question) => question.id);
  const activeIds = new Set(activeQuestionIds);
  const branchState = resolveBranchState(session, activeIds, responses);
  const skippedQuestions = buildSkippedQuestions(session, branchState, activeIds, now);
  const completedQuestionIds = session.plan.items
    .filter((item) => Boolean(session.answers[item.questionId]))
    .map((item) => item.questionId);

  let next: SessionState = {
    ...session,
    activeQuestionIds,
    branchState,
    completedQuestionIds,
    coordinatorReviewRequired: session.flags.some((flag) => flag.reviewTarget === "coordinator") ||
      session.tasks.length > 0,
    highestPriority: highestPriority([
      ...session.flags.map((flag) => flag.priority),
      ...session.tasks.map((task) => task.priority),
    ]),
    providerReviewRequired: session.flags.some((flag) => flag.reviewTarget === "provider") ||
      session.tasks.some((task) => task.reviewTarget === "provider"),
    skippedQuestions,
    updatedAt: now,
  };
  next = { ...next, progress: calculateSessionProgress(next, now, policy) };

  if (
    next.status === "active" &&
    next.progress.answeredQuestions + next.progress.skippedQuestions === next.progress.totalQuestions
  ) {
    next = { ...next, completedAt: now, status: "completed" };
  }
  return { ...next, summary: buildSessionSummary(next) };
}

export function emptySummary(): SessionState["summary"] {
  return {
    billingRelevantDocumentation: [],
    functionalConcerns: [],
    hospitalizations: [],
    missedMedications: [],
    negativeFindings: [],
    patientConcerns: [],
    positiveFindings: [],
    socialBarriers: [],
    suggestedCoordinatorActions: [],
    suggestedProviderReview: [],
  };
}

export function emptyProgress(): SessionProgress {
  return {
    answeredQuestions: 0,
    completionPercentage: 0,
    estimatedCompletionAt: null,
    estimatedMinutesRemaining: 0,
    moduleProgress: [],
    optionalQuestionsRemaining: 0,
    requiredQuestionsRemaining: 0,
    sectionProgress: [],
    skippedQuestions: 0,
    totalQuestions: 0,
  };
}
