import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  optionalEnum,
  optionalString,
  readJsonObject,
  requiredNumber,
  requiredString,
} from "../../../lib/api/json";
import {
  answerSessionQuestion,
  correctSessionAnswer,
  SessionAnswerValidationError,
} from "../../../lib/ccm/session-engine/engine.ts";
import {
  cancelQuestionSession,
  pauseQuestionSession,
  resumeQuestionSession,
} from "../../../lib/ccm/session-engine/resume.ts";
import type { SessionWorkflow } from "../../../lib/ccm/session-engine/types";
import {
  createStoredQuestionSession,
  findLatestQuestionSession,
  findQuestionSessionById,
  saveStoredQuestionSession,
  SessionStateConflictError,
} from "../../../lib/ccm/session-store";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import type { JsonValue } from "../../../lib/ccm/types";
import {
  sessionStateFromJson,
  toQuestionSessionPayload,
} from "../../../lib/ccm/session-integration.ts";

const WORKFLOWS = ["intake", "monthly_checkin", "annual_review", "care_plan_review"] as const;
const ACTIONS = ["answer", "pause", "resume", "cancel", "correct"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  const workflow = searchParams.get("workflow") as SessionWorkflow | null;
  const carePlanId = searchParams.get("carePlanId");
  if (!practiceId || !patientId || !workflow || !WORKFLOWS.includes(workflow)) {
    return badRequest(new Error("practiceId, patientId, and workflow are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const record = await findLatestQuestionSession(supabase, practiceId, patientId, workflow, carePlanId);
    return Response.json({ session: record ? toQuestionSessionPayload(record) : null });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const practiceId = requiredString(body, "practiceId");
    const patientId = requiredString(body, "patientId");
    const workflow = optionalEnum(body, "workflow", WORKFLOWS);
    if (!workflow) return badRequest(new Error("workflow is required"));
    const carePlanId = optionalString(body, "carePlanId");
    const { supabase, user } = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    const existing = await findLatestQuestionSession(supabase, practiceId, patientId, workflow, carePlanId);
    if (existing && (existing.status === "draft" || existing.status === "paused")) {
      return Response.json({ session: toQuestionSessionPayload(existing) });
    }
    const created = await createStoredQuestionSession(supabase, user.id, {
      carePlanId,
      patientId,
      practiceId,
      workflow,
    });
    return Response.json({ session: created.payload }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const practiceId = requiredString(body, "practiceId");
    const recordId = requiredString(body, "recordId");
    const action = optionalEnum(body, "action", ACTIONS);
    const expectedStateVersion = requiredNumber(body, "stateVersion");
    if (!action) return badRequest(new Error("action is required"));
    const { supabase, user } = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    const record = await findQuestionSessionById(supabase, practiceId, recordId);
    if (!record) return Response.json({ error: "Question session not found" }, { status: 404 });
    if (record.state_version !== expectedStateVersion) {
      return Response.json({ error: "The session changed. Reload to continue." }, { status: 409 });
    }

    const before = sessionStateFromJson(record.session_state);
    const now = new Date().toISOString();
    let after = before;
    let answeredQuestionId: string | undefined;
    if (action === "answer") {
      answeredQuestionId = requiredString(body, "questionId");
      if (!answeredQuestionId.startsWith("ccm.")) return badRequest(new Error("Invalid questionId"));
      after = answerSessionQuestion(before, answeredQuestionId as `ccm.${string}`, body.answer as never, now).session;
    } else if (action === "correct") {
      answeredQuestionId = requiredString(body, "questionId");
      const correctionReason = requiredString(body, "correctionReason");
      if (correctionReason.length < 8) return badRequest(new Error("Correction reason must be at least 8 characters"));
      if (!answeredQuestionId.startsWith("ccm.")) return badRequest(new Error("Invalid questionId"));
      const original = before.answers[answeredQuestionId as `ccm.${string}`];
      if (!original) return badRequest(new Error("Only completed answers can be corrected"));
      after = correctSessionAnswer(before, answeredQuestionId as `ccm.${string}`, body.answer as never, now);
      const saved = await saveStoredQuestionSession(supabase, user.id, record, before, after);
      await recordAuditEvent(supabase, {
        action: "question_session.answer_corrected",
        actorUserId: user.id,
        afterData: { answer: (after.answers[answeredQuestionId as `ccm.${string}`]?.answer ?? null) as JsonValue },
        beforeData: { answer: original.answer },
        entityId: record.id,
        entityType: "question_session",
        metadata: {
          correctionReason,
          correctedAt: now,
          questionId: answeredQuestionId,
          questionVersion: original.questionVersion,
        },
        practiceId,
      });
      return Response.json({ session: saved.payload });
    } else if (action === "pause") {
      after = pauseQuestionSession(before, now);
    } else if (action === "resume") {
      after = resumeQuestionSession(before, now);
    } else {
      after = cancelQuestionSession(before, now);
    }

    const saved = await saveStoredQuestionSession(supabase, user.id, record, before, after, answeredQuestionId);
    return Response.json({ session: saved.payload });
  } catch (error) {
    if (error instanceof SessionAnswerValidationError) {
      return Response.json({ error: "Answer is invalid", validationErrors: error.errors }, { status: 400 });
    }
    if (error instanceof SessionStateConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.name !== "AuthError") {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
