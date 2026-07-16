import {
  CONDITION_MODULES,
  CONDITION_MODULES_BY_ID,
  findConditionModule,
} from "../question-bank/conditions.ts";
import { QUESTION_BANK, QUESTIONS_BY_ID } from "../question-bank/questions.ts";
import type {
  ConditionModuleId,
  ConditionQuestionModule,
  QuestionDefinition,
  QuestionId,
} from "../question-bank/types";
import type { SessionContextSnapshot, SessionPlan, SessionWorkflow } from "./types";

const WORKFLOW_LIST: Record<SessionWorkflow, keyof Pick<
  ConditionQuestionModule,
  "annualQuestionIds" | "carePlanQuestionIds" | "intakeQuestionIds" | "monthlyQuestionIds"
>> = {
  annual_review: "annualQuestionIds",
  care_plan_review: "carePlanQuestionIds",
  intake: "intakeQuestionIds",
  monthly_checkin: "monthlyQuestionIds",
};

function addModuleId(target: Set<ConditionModuleId>, value: string | null | undefined): void {
  if (!value) return;
  const conditionModule = findConditionModule(value);
  if (conditionModule) target.add(conditionModule.id);
}

export function resolveActiveModuleIds(context: SessionContextSnapshot): ConditionModuleId[] {
  const ids = new Set<ConditionModuleId>();
  for (const diagnosis of context.diagnoses) {
    if (diagnosis.active === false) continue;
    if (diagnosis.conditionId && CONDITION_MODULES_BY_ID.has(diagnosis.conditionId)) {
      ids.add(diagnosis.conditionId);
      continue;
    }
    addModuleId(ids, diagnosis.canonicalName);
    addModuleId(ids, diagnosis.name);
  }
  for (const conditionId of context.carePlan?.conditionIds ?? []) {
    if (CONDITION_MODULES_BY_ID.has(conditionId)) ids.add(conditionId);
  }
  return CONDITION_MODULES.map((module) => module.id).filter((id) => ids.has(id));
}

function getModuleSeedIds(moduleId: ConditionModuleId, workflow: SessionWorkflow): QuestionId[] {
  const conditionModule = CONDITION_MODULES_BY_ID.get(moduleId);
  return conditionModule ? [...conditionModule[WORKFLOW_LIST[workflow]]] : [];
}

function getDeclaredFollowUpIds(question: QuestionDefinition): QuestionId[] {
  return question.followUpTriggers.flatMap((trigger) =>
    trigger.actions.flatMap((action) => action.type === "show_questions" ? action.questionIds : []),
  );
}

function collectClosure(seedIds: Iterable<QuestionId>, workflow: SessionWorkflow): Set<QuestionId> {
  const ids = new Set(seedIds);
  const pending = [...ids];
  while (pending.length > 0) {
    const questionId = pending.shift();
    if (!questionId) continue;
    const question = QUESTIONS_BY_ID.get(questionId);
    if (!question) throw new Error(`Question module references unknown question: ${questionId}`);
    for (const childId of getDeclaredFollowUpIds(question)) {
      const child = QUESTIONS_BY_ID.get(childId);
      if (!child) throw new Error(`Branch references unknown question: ${childId}`);
      if (!child.contexts.includes(workflow) || ids.has(childId)) continue;
      ids.add(childId);
      pending.push(childId);
    }
  }
  return ids;
}

export function buildSessionPlan(
  context: SessionContextSnapshot,
  workflow: SessionWorkflow,
): SessionPlan {
  const activeModuleIds = resolveActiveModuleIds(context);
  const conditionSeeds = new Set<QuestionId>();
  const moduleClosures = new Map<ConditionModuleId, Set<QuestionId>>();

  for (const moduleId of activeModuleIds) {
    const seeds = getModuleSeedIds(moduleId, workflow);
    seeds.forEach((id) => conditionSeeds.add(id));
    moduleClosures.set(moduleId, collectClosure(seeds, workflow));
  }

  const workflowSeeds = QUESTION_BANK.filter((question) =>
    question.contexts.includes(workflow) &&
    question.displayWhen.length === 0 &&
    (
      question.conditionIds.length === 0 ||
      question.conditionIds.some((id) => activeModuleIds.includes(id))
    ),
  ).map((question) => question.id);

  const seedSet = new Set<QuestionId>([...workflowSeeds, ...conditionSeeds]);
  const candidateSet = collectClosure(seedSet, workflow);
  const seedQuestionIds = QUESTION_BANK.filter((question) => seedSet.has(question.id)).map((question) => question.id);
  const candidateQuestionIds = QUESTION_BANK.filter((question) => candidateSet.has(question.id)).map((question) => question.id);

  const items = candidateQuestionIds.map((questionId, sequence) => {
    const question = QUESTIONS_BY_ID.get(questionId);
    if (!question) throw new Error(`Unable to plan unknown question: ${questionId}`);
    const moduleIds = activeModuleIds.filter((moduleId) => moduleClosures.get(moduleId)?.has(questionId));
    return {
      category: question.category,
      moduleIds,
      questionId,
      questionVersion: question.version,
      required: question.required,
      sequence,
      source: !seedSet.has(questionId)
        ? "follow_up" as const
        : conditionSeeds.has(questionId)
          ? "condition" as const
          : "workflow" as const,
    };
  });

  return { activeModuleIds, candidateQuestionIds, items, seedQuestionIds };
}
