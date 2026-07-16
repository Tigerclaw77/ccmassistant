import type {
  AnswerCondition,
  AnswerValue,
  FollowUpAction,
  QuestionDefinition,
  QuestionId,
} from "./types";

export type ResponseMap = Partial<Record<QuestionId, AnswerValue>>;

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function evaluateAnswerCondition(answer: AnswerValue | undefined, condition: AnswerCondition): boolean {
  if (answer === undefined || answer === null) return false;
  switch (condition.operator) {
    case "equals":
      return equal(answer, condition.value);
    case "not_equals":
      return !equal(answer, condition.value);
    case "contains":
      return Array.isArray(answer)
        ? answer.includes(String(condition.value))
        : String(answer).includes(String(condition.value));
    case "in":
      return Array.isArray(condition.value) && condition.value.some((value) => equal(answer, value));
    case "greater_than":
      return typeof answer === "number" && typeof condition.value === "number" && answer > condition.value;
    case "greater_than_or_equal":
      return typeof answer === "number" && typeof condition.value === "number" && answer >= condition.value;
    case "less_than":
      return typeof answer === "number" && typeof condition.value === "number" && answer < condition.value;
    case "less_than_or_equal":
      return typeof answer === "number" && typeof condition.value === "number" && answer <= condition.value;
  }
}

export function getTriggeredActions(question: QuestionDefinition, answer: AnswerValue): FollowUpAction[] {
  return question.followUpTriggers
    .filter((trigger) => evaluateAnswerCondition(answer, trigger.when))
    .flatMap((trigger) => trigger.actions);
}

export function isDisplayEligible(question: QuestionDefinition, responses: ResponseMap): boolean {
  return question.displayWhen.every((rule) =>
    evaluateAnswerCondition(responses[rule.questionId], rule),
  );
}

export function resolveVisibleQuestions(
  seedQuestionIds: readonly QuestionId[],
  responses: ResponseMap,
  questions: readonly QuestionDefinition[],
): QuestionDefinition[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const visible = new Set<QuestionId>(seedQuestionIds);
  let changed = true;

  while (changed) {
    changed = false;
    for (const questionId of [...visible]) {
      const question = byId.get(questionId);
      const answer = responses[questionId];
      if (!question || answer === undefined || answer === null) continue;

      for (const action of getTriggeredActions(question, answer)) {
        if (action.type !== "show_questions") continue;
        for (const childId of action.questionIds) {
          const child = byId.get(childId);
          if (child && isDisplayEligible(child, responses) && !visible.has(childId)) {
            visible.add(childId);
            changed = true;
          }
        }
      }
    }
  }

  return questions.filter((question) => visible.has(question.id) && isDisplayEligible(question, responses));
}
