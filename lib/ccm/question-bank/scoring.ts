import type {
  AnswerValue,
  FollowUpUrgency,
  QuestionDefinition,
  QuestionId,
} from "./types";
import { evaluateAnswerCondition } from "./branching";

const URGENCY_POINTS: Record<FollowUpUrgency, number> = {
  routine: 1,
  soon: 2,
  same_day: 3,
  urgent: 4,
};

export type FollowUpScore = {
  flags: string[];
  maxUrgency: FollowUpUrgency | null;
  points: number;
  taskCodes: string[];
};

export function scoreFollowUps(
  responses: Partial<Record<QuestionId, AnswerValue>>,
  questions: readonly QuestionDefinition[],
): FollowUpScore {
  const result: FollowUpScore = { flags: [], maxUrgency: null, points: 0, taskCodes: [] };
  for (const question of questions) {
    const answer = responses[question.id];
    if (answer === undefined || answer === null) continue;
    for (const trigger of question.followUpTriggers) {
      if (!evaluateAnswerCondition(answer, trigger.when)) continue;
      for (const action of trigger.actions) {
        if (action.type === "show_questions") continue;
        const points = URGENCY_POINTS[action.urgency];
        result.points += points;
        if (!result.maxUrgency || points > URGENCY_POINTS[result.maxUrgency]) result.maxUrgency = action.urgency;
        if (action.type === "flag_for_review") result.flags.push(action.code);
        if (action.type === "create_care_coordination_task") result.taskCodes.push(action.code);
      }
    }
  }
  return result;
}
