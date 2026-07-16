import { getTriggeredActions } from "../question-bank/branching.ts";
import { QUESTIONS_BY_ID } from "../question-bank/questions.ts";
import type { QuestionCategoryId, QuestionResponse } from "../question-bank/types";
import type {
  SessionState,
  SessionSummary,
  SessionSummaryFinding,
} from "./types";

const FUNCTIONAL_CATEGORIES = new Set<QuestionCategoryId>(["falls", "functional_status", "pain"]);
const SOCIAL_CATEGORIES = new Set<QuestionCategoryId>([
  "care_coordination",
  "nutrition",
  "social_determinants",
  "transportation",
]);
const CONCERN_CATEGORIES = new Set<QuestionCategoryId>([
  ...FUNCTIONAL_CATEGORIES,
  ...SOCIAL_CATEGORIES,
  "emergency_visits",
  "hospitalizations",
  "medication_adherence",
  "symptoms",
]);

function findingFor(response: QuestionResponse): SessionSummaryFinding | null {
  const question = QUESTIONS_BY_ID.get(response.questionId);
  if (!question) return null;
  const triggerCodes = getTriggeredActions(question, response.answer)
    .filter((action) => action.type !== "show_questions")
    .map((action) => action.code);
  return {
    answer: response.answer,
    category: question.category,
    questionId: response.questionId,
    questionVersion: response.questionVersion,
    triggerCodes,
  };
}

function isPositive(finding: SessionSummaryFinding): boolean {
  if (typeof finding.answer === "boolean") return finding.answer;
  return finding.triggerCodes.length > 0;
}

export function buildSessionSummary(session: SessionState): SessionSummary {
  const responses = session.plan.items
    .map((item) => session.answers[item.questionId])
    .filter((response): response is QuestionResponse => Boolean(response));
  const findings = responses
    .map(findingFor)
    .filter((finding): finding is SessionSummaryFinding => Boolean(finding));
  const byId = new Map(findings.map((finding) => [finding.questionId, finding]));
  const hadHospitalization = byId.get("ccm.hospital.had_admission")?.answer === true;

  return {
    billingRelevantDocumentation: responses.flatMap((response) => {
      const question = QUESTIONS_BY_ID.get(response.questionId);
      const finding = byId.get(response.questionId);
      if (!question || !finding || !question.billingRelevance) return [];
      return [{ ...finding, answeredAt: response.answeredAt, billingRelevance: question.billingRelevance }];
    }),
    functionalConcerns: findings.filter((finding) =>
      FUNCTIONAL_CATEGORIES.has(finding.category) && isPositive(finding),
    ),
    hospitalizations: hadHospitalization
      ? findings.filter((finding) => finding.category === "hospitalizations")
      : [],
    missedMedications: findings.filter((finding) =>
      finding.questionId === "ccm.medication.issue_reasons" &&
      Array.isArray(finding.answer) &&
      finding.answer.includes("forgot"),
    ),
    negativeFindings: findings.filter((finding) => finding.answer === false),
    patientConcerns: findings.filter((finding) =>
      CONCERN_CATEGORIES.has(finding.category) && isPositive(finding),
    ),
    positiveFindings: findings.filter(isPositive),
    socialBarriers: findings.filter((finding) =>
      SOCIAL_CATEGORIES.has(finding.category) && isPositive(finding),
    ),
    suggestedCoordinatorActions: [...session.tasks],
    suggestedProviderReview: session.flags.filter((flag) => flag.reviewTarget === "provider"),
  };
}
