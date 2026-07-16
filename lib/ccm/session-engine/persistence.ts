import { resolveQuestionVersion } from "../question-bank/questions.ts";
import type { SessionState } from "./types";

export function serializeQuestionSession(session: SessionState): string {
  return JSON.stringify(session);
}

function assertSessionShape(value: unknown): asserts value is SessionState {
  if (!value || typeof value !== "object") throw new Error("Serialized session must contain an object.");
  const candidate = value as Partial<SessionState>;
  if (candidate.schemaVersion !== 1) throw new Error("Unsupported question session schema version.");
  if (!candidate.id || !candidate.patientId || !candidate.workflow || !candidate.status) {
    throw new Error("Serialized session is missing required identity fields.");
  }
  if (!candidate.plan || !Array.isArray(candidate.plan.items) || !candidate.answers) {
    throw new Error("Serialized session is missing plan or answer state.");
  }
  for (const item of candidate.plan.items) {
    if (!resolveQuestionVersion(item.questionId, item.questionVersion)) {
      throw new Error(`Serialized session references unavailable question version: ${item.questionId} v${item.questionVersion}`);
    }
  }
}

export function deserializeQuestionSession(serialized: string): SessionState {
  const value: unknown = JSON.parse(serialized);
  assertSessionShape(value);
  return value;
}
