import { evaluateAnswerCondition } from "../question-bank/branching.ts";
import type {
  AnswerValue,
  FollowUpUrgency,
  QuestionDefinition,
} from "../question-bank/types";
import type {
  ReviewTarget,
  SessionPriority,
  SessionReviewFlag,
  SessionTask,
  SessionTaskType,
} from "./types";

const PRIORITY_RANK: Record<SessionPriority, number> = {
  NONE: 0,
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
};

const URGENCY_PRIORITY: Record<FollowUpUrgency, SessionPriority> = {
  routine: "LOW",
  same_day: "HIGH",
  soon: "NORMAL",
  urgent: "URGENT",
};

export function priorityFromUrgency(urgency: FollowUpUrgency): SessionPriority {
  return URGENCY_PRIORITY[urgency];
}

export function highestPriority(priorities: SessionPriority[]): SessionPriority {
  return priorities.reduce<SessionPriority>(
    (highest, priority) => PRIORITY_RANK[priority] > PRIORITY_RANK[highest] ? priority : highest,
    "NONE",
  );
}

function taskTypeForCode(code: string, reviewTarget: ReviewTarget): SessionTaskType {
  if (code.includes("medication")) return "medication_reconciliation";
  if (code.includes("hospital") || code.includes("discharge")) return "obtain_discharge_summary";
  if (code.includes("followup") || code.includes("follow_up")) return "schedule_follow_up";
  if (reviewTarget === "provider") return "notify_provider";
  if (code.includes("care_plan") || code.includes("goal")) return "care_plan_review";
  return "contact_patient";
}

function taskId(
  sessionId: string,
  question: QuestionDefinition,
  triggerId: string,
  code: string,
  index: number,
): string {
  return `${sessionId}:${question.id}:v${question.version}:${triggerId}:${code}:${index}`;
}

export function deriveAnswerConsequences(
  sessionId: string,
  patientId: string,
  question: QuestionDefinition,
  answer: AnswerValue,
  createdAt: string,
): { flags: SessionReviewFlag[]; tasks: SessionTask[] } {
  const flags: SessionReviewFlag[] = [];
  const tasks: SessionTask[] = [];

  for (const trigger of question.followUpTriggers) {
    if (!evaluateAnswerCondition(answer, trigger.when)) continue;
    trigger.actions.forEach((action, index) => {
      if (action.type === "show_questions") return;
      const priority = priorityFromUrgency(action.urgency);
      const reviewTarget: ReviewTarget = action.type === "flag_for_review" && action.providerNotification
        ? "provider"
        : "coordinator";

      if (action.type === "flag_for_review") {
        flags.push({
          code: action.code,
          createdAt,
          priority,
          questionId: question.id,
          questionVersion: question.version,
          reviewTarget,
        });
      }

      const code = action.code;
      tasks.push({
        assignedTo: "coordinator",
        createdAt,
        id: taskId(sessionId, question, trigger.id, code, index),
        patientId,
        priority,
        questionId: question.id,
        questionVersion: question.version,
        reason: code,
        reviewTarget,
        status: "open",
        type: taskTypeForCode(code, reviewTarget),
      });
    });
  }

  return { flags, tasks };
}
