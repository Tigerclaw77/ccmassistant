import type { SessionState } from "./types";

function at(timestamp?: string): string {
  return timestamp ?? new Date().toISOString();
}

export function pauseQuestionSession(session: SessionState, timestamp?: string): SessionState {
  if (session.status !== "active") throw new Error(`Only an active session can be paused; current status is ${session.status}.`);
  const now = at(timestamp);
  return { ...session, pausedAt: now, status: "paused", updatedAt: now };
}

export function resumeQuestionSession(session: SessionState, timestamp?: string): SessionState {
  if (session.status !== "paused") throw new Error(`Only a paused session can be resumed; current status is ${session.status}.`);
  const now = at(timestamp);
  return {
    ...session,
    lastResumedAt: now,
    resumeCount: session.resumeCount + 1,
    status: "active",
    updatedAt: now,
  };
}

export function cancelQuestionSession(session: SessionState, timestamp?: string): SessionState {
  if (session.status === "completed" || session.status === "cancelled") {
    throw new Error(`Cannot cancel a ${session.status} session.`);
  }
  const now = at(timestamp);
  return { ...session, cancelledAt: now, status: "cancelled", updatedAt: now };
}
