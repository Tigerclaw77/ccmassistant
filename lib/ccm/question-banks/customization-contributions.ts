import type {
  AnonymousQuestionContributionPayload,
  QuestionContributionCandidate,
} from "./customization-types.ts";

const PHI_PATTERNS = [
  /\b(?:mrn|medical record number|patient id|date of birth|dob)\b/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/,
];

export function containsPotentialPhi(value: string): boolean {
  return PHI_PATTERNS.some((pattern) => pattern.test(value));
}

export function toAnonymousContributionPayload(
  candidate: QuestionContributionCandidate,
): AnonymousQuestionContributionPayload {
  if (candidate.optInStatus !== "opted_in") {
    throw new Error("A contribution candidate must be explicitly opted in before upload.");
  }
  if (!candidate.anonymous || candidate.createdBy !== null) {
    throw new Error("Anonymous contribution payloads cannot contain a creator identity.");
  }
  if (!candidate.noPhiAttested || containsPotentialPhi(candidate.question)) {
    throw new Error("Contribution candidates containing potential PHI cannot be uploaded.");
  }
  return {
    id: candidate.id,
    canonicalConditionId: candidate.canonicalConditionId,
    question: candidate.question,
    context: candidate.context,
    usageCount: candidate.usageCount,
  };
}
