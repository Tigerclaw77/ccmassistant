import { randomUUID } from "node:crypto";
import type { ServerSupabaseClient } from "../auth";
import { recordAuditEvent } from "./audit";
import {
  buildIntegratedSessionInput,
  deriveSessionTelemetry,
  persistenceStatus,
  sessionStateFromJson,
  sessionStateToJson,
  toQuestionSessionPayload,
} from "./session-integration.ts";
import { createQuestionSession } from "./session-engine/engine.ts";
import type { SessionState, SessionWorkflow } from "./session-engine/types";
import type { QuestionSessionRecord } from "./types";

export class SessionStateConflictError extends Error {
  constructor() {
    super("The session changed in another request. Reload and continue from the saved answer.");
    this.name = "SessionStateConflictError";
  }
}

export async function findQuestionSessionById(
  supabase: ServerSupabaseClient,
  practiceId: string,
  recordId: string,
): Promise<QuestionSessionRecord | null> {
  const { data, error } = await supabase
    .from("question_sessions")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function findQuestionSessionForCheckIn(
  supabase: ServerSupabaseClient,
  checkinInstanceId: string,
): Promise<QuestionSessionRecord | null> {
  const { data, error } = await supabase
    .from("question_sessions")
    .select("*")
    .eq("checkin_instance_id", checkinInstanceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function findLatestQuestionSession(
  supabase: ServerSupabaseClient,
  practiceId: string,
  patientId: string,
  workflow: SessionWorkflow,
  carePlanId?: string | null,
): Promise<QuestionSessionRecord | null> {
  let query = supabase
    .from("question_sessions")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .eq("workflow", workflow)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (carePlanId) query = query.eq("care_plan_id", carePlanId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function loadCarePlan(
  supabase: ServerSupabaseClient,
  practiceId: string,
  patientId: string,
  carePlanId?: string | null,
) {
  let query = supabase
    .from("care_plans")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId);
  if (carePlanId) query = query.eq("id", carePlanId);
  else query = query.eq("status", "active").order("updated_at", { ascending: false }).limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createStoredQuestionSession(
  supabase: ServerSupabaseClient,
  actorUserId: string,
  args: {
    carePlanId?: string | null;
    checkinInstanceId?: string | null;
    now?: string;
    patientId: string;
    practiceId: string;
    workflow: SessionWorkflow;
  },
) {
  const sessionId = randomUUID();
  const now = args.now ?? new Date().toISOString();
  const [{ data: patient, error: patientError }, { data: conditions, error: conditionsError }, carePlan, previousRows] = await Promise.all([
    supabase.from("patients").select("*").eq("practice_id", args.practiceId).eq("id", args.patientId).maybeSingle(),
    supabase.from("patient_conditions").select("*").eq("practice_id", args.practiceId).eq("patient_id", args.patientId).eq("is_active", true),
    loadCarePlan(supabase, args.practiceId, args.patientId, args.carePlanId),
    supabase.from("question_sessions").select("session_state").eq("practice_id", args.practiceId).eq("patient_id", args.patientId).eq("workflow", args.workflow).eq("status", "completed").order("completed_at", { ascending: false }).limit(1),
  ]);
  if (patientError) throw new Error(patientError.message);
  if (!patient) throw new Error("Patient not found");
  if (conditionsError) throw new Error(conditionsError.message);
  if (previousRows.error) throw new Error(previousRows.error.message);

  const previousSessions = (previousRows.data ?? []).map((row) => sessionStateFromJson(row.session_state));
  const session = createQuestionSession(buildIntegratedSessionInput({
    carePlan,
    conditions: conditions ?? [],
    patient,
    previousSessions,
    sessionId,
    workflow: args.workflow,
  }), { now });

  const { data: record, error } = await supabase
    .from("question_sessions")
    .insert({
      cancelled_at: session.cancelledAt,
      care_plan_id: args.carePlanId ?? carePlan?.id ?? null,
      checkin_instance_id: args.checkinInstanceId ?? null,
      completed_at: session.completedAt,
      created_by: actorUserId,
      id: sessionId,
      patient_id: args.patientId,
      paused_at: session.pausedAt,
      practice_id: args.practiceId,
      session_state: sessionStateToJson(session),
      started_at: session.startedAt,
      state_version: 1,
      status: persistenceStatus(session),
      updated_by: actorUserId,
      workflow: args.workflow,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await recordAuditEvent(supabase, {
    action: "question_session.started",
    actorUserId,
    afterData: { status: record.status, workflow: record.workflow },
    entityId: record.id,
    entityType: "question_session",
    metadata: { patientId: args.patientId },
    practiceId: args.practiceId,
  });
  for (const skipped of session.skippedQuestions) {
    await recordAuditEvent(supabase, {
      action: "question_session.question_skipped",
      actorUserId,
      afterData: { stateVersion: record.state_version, status: record.status },
      entityId: record.id,
      entityType: "question_session",
      metadata: { questionId: skipped.questionId, reason: skipped.reason },
      practiceId: args.practiceId,
    });
  }
  for (const branch of session.branchState.filter((item) => item.status === "active")) {
    await recordAuditEvent(supabase, {
      action: "question_session.branch_activated",
      actorUserId,
      afterData: { stateVersion: record.state_version, status: record.status },
      entityId: record.id,
      entityType: "question_session",
      metadata: { questionId: branch.questionId },
      practiceId: args.practiceId,
    });
  }
  if (session.status === "completed") {
    await recordAuditEvent(supabase, {
      action: "question_session.completed",
      actorUserId,
      afterData: { stateVersion: record.state_version, status: record.status },
      entityId: record.id,
      entityType: "question_session",
      metadata: { answered: session.progress.answeredQuestions },
      practiceId: args.practiceId,
    });
  }
  return { payload: toQuestionSessionPayload(record, session), record, session };
}

export async function saveStoredQuestionSession(
  supabase: ServerSupabaseClient,
  actorUserId: string | null,
  record: QuestionSessionRecord,
  before: SessionState,
  after: SessionState,
  answeredQuestionId?: string,
) {
  const patch = {
    cancelled_at: after.cancelledAt,
    completed_at: after.completedAt,
    paused_at: after.pausedAt,
    session_state: sessionStateToJson(after),
    state_version: record.state_version + 1,
    status: persistenceStatus(after),
    ...(actorUserId ? { updated_by: actorUserId } : {}),
  };
  const { data: updated, error } = await supabase
    .from("question_sessions")
    .update(patch)
    .eq("id", record.id)
    .eq("state_version", record.state_version)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new SessionStateConflictError();

  if (after.status === "completed" && record.checkin_instance_id) {
    const completedAt = after.completedAt ?? after.updatedAt;
    const { error: checkinError } = await supabase
      .from("checkin_instances")
      .update({
        responded_at: completedAt,
        status: "responded",
        ...(actorUserId === null
          ? { token: null, token_expires_at: null }
          : {}),
      })
      .eq("id", record.checkin_instance_id);
    if (checkinError) throw new Error(checkinError.message);
  } else if (before.status === "completed" && after.status === "active" && record.checkin_instance_id) {
    const { error: checkinError } = await supabase
      .from("checkin_instances")
      .update({ responded_at: null, status: "sent" })
      .eq("id", record.checkin_instance_id);
    if (checkinError) throw new Error(checkinError.message);
  }

  for (const event of deriveSessionTelemetry(before, after, answeredQuestionId)) {
    await recordAuditEvent(supabase, {
      action: event.action,
      actorUserId,
      afterData: { stateVersion: updated.state_version, status: updated.status },
      entityId: updated.id,
      entityType: "question_session",
      metadata: event.metadata,
      practiceId: updated.practice_id,
    });
  }
  return { payload: toQuestionSessionPayload(updated, after), record: updated, session: after };
}
