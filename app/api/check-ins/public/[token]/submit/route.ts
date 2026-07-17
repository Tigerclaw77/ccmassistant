import { createServiceRoleSupabaseClient } from "../../../../../../lib/auth";
import { badRequest, readJsonObject } from "../../../../../../lib/api/json";
import { ACTIVE_PUBLIC_CHECKIN_STATUSES } from "../../../../../../lib/ccm/public-checkin";
import { answerSessionQuestion, SessionAnswerValidationError } from "../../../../../../lib/ccm/session-engine/engine.ts";
import { pauseQuestionSession, resumeQuestionSession } from "../../../../../../lib/ccm/session-engine/resume.ts";
import { sessionStateFromJson, responseText, toPublicQuestionSessionPayload } from "../../../../../../lib/ccm/session-integration.ts";
import { findQuestionSessionForCheckIn, saveStoredQuestionSession, SessionStateConflictError } from "../../../../../../lib/ccm/session-store";
import type { AnswerValue } from "../../../../../../lib/ccm/question-bank/types";
import { markLatestCheckinDeliveryCompleted } from "../../../../../../lib/ccm/checkin-delivery-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data: checkIn, error: checkInError } = await supabase
      .from("checkin_instances")
      .select("*")
      .eq("token", token)
      .in("status", [...ACTIVE_PUBLIC_CHECKIN_STATUSES])
      .gt("token_expires_at", new Date().toISOString())
      .maybeSingle();

    if (checkInError || !checkIn) {
      return Response.json({ error: "Invalid link" }, { status: 404 });
    }

    const sessionRecord = await findQuestionSessionForCheckIn(supabase, checkIn.id);
    if (sessionRecord) {
      const expectedStateVersion = body.stateVersion;
      if (typeof expectedStateVersion !== "number" || expectedStateVersion !== sessionRecord.state_version) {
        return Response.json({ error: "The session changed. Reload to continue." }, { status: 409 });
      }
      const action = typeof body.action === "string" ? body.action : "answer";
      const before = sessionStateFromJson(sessionRecord.session_state);
      const now = new Date().toISOString();
      let after = before;
      let answeredQuestionId: string | undefined;

      if (action === "answer") {
        answeredQuestionId = typeof body.questionId === "string" ? body.questionId : undefined;
        if (!answeredQuestionId?.startsWith("ccm.")) return badRequest(new Error("questionId is required"));
        after = answerSessionQuestion(
          before,
          answeredQuestionId as `ccm.${string}`,
          body.answer as AnswerValue,
          now,
        ).session;
      } else if (action === "pause") {
        after = pauseQuestionSession(before, now);
      } else if (action === "resume") {
        after = resumeQuestionSession(before, now);
      } else {
        return badRequest(new Error("Unsupported session action"));
      }

      const saved = await saveStoredQuestionSession(
        supabase,
        null,
        sessionRecord,
        before,
        after,
        answeredQuestionId,
      );

      if (after.status === "completed") {
        await markLatestCheckinDeliveryCompleted(supabase, checkIn.id, checkIn.practice_id);
      }

      if (answeredQuestionId) {
        const storedAnswer = after.answers[answeredQuestionId as `ccm.${string}`];
        if (storedAnswer) {
          const { error: responseError } = await supabase.from("checkin_responses").insert({
            canonical_question_id: storedAnswer.questionId,
            checkin_instance_id: checkIn.id,
            flagged: after.flags.some((flag) => flag.questionId === storedAnswer.questionId),
            patient_id: checkIn.patient_id,
            practice_id: checkIn.practice_id,
            question_id: null,
            question_session_id: sessionRecord.id,
            question_version: storedAnswer.questionVersion,
            response_text: responseText(storedAnswer.answer),
            response_value: storedAnswer.answer,
          });
          if (responseError) {
            return Response.json(
              { error: "The check-in could not be saved. Please try again." },
              { status: 500 },
            );
          }
        }
      }

      return Response.json({
        completed: after.status === "completed",
        ok: true,
        session: toPublicQuestionSessionPayload(saved.record, after),
      });
    }

    const answers = body.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return badRequest(new Error("answers must be an object"));
    }

    const responseRows = Object.entries(answers)
      .map(([questionId, value]) => {
        const responseText = typeof value === "string" ? value.trim() : "";

        return {
          checkin_instance_id: checkIn.id,
          patient_id: checkIn.patient_id,
          practice_id: checkIn.practice_id,
          question_id: questionId,
          response_text: responseText,
          response_value: typeof value === "string" ? value : null,
        };
      })
      .filter((row) => row.response_text.length > 0);

    if (responseRows.length === 0) {
      return badRequest(new Error("Please answer at least one question before submitting."));
    }

    const { data: insertedResponses, error: insertError } = await supabase
      .from("checkin_responses")
      .insert(responseRows)
      .select();

    if (insertError) {
      return Response.json(
        { error: "The check-in could not be saved. Please try again." },
        { status: 500 },
      );
    }

    if (!insertedResponses || insertedResponses.length === 0) {
      return Response.json({ error: "Unable to save check-in responses" }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { data: updatedCheckIn, error: updateError } = await supabase
      .from("checkin_instances")
      .update({
        responded_at: now,
        status: "responded",
        token: null,
        token_expires_at: null,
      })
      .eq("id", checkIn.id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        { error: "The check-in could not be saved. Please try again." },
        { status: 500 },
      );
    }

    await supabase.from("audit_events").insert({
      action: "checkin_response.submitted",
      actor_user_id: null,
      after_data: {
        responseCount: insertedResponses.length,
        status: "responded",
      },
      entity_id: checkIn.id,
      entity_type: "checkin_instance",
      metadata: { submissionMode: "legacy" },
      practice_id: checkIn.practice_id,
    });

    await markLatestCheckinDeliveryCompleted(supabase, checkIn.id, checkIn.practice_id);

    return Response.json({ checkIn: updatedCheckIn, ok: true });
  } catch (error) {
    if (error instanceof SessionAnswerValidationError) {
      return Response.json({ error: "Answer is invalid", validationErrors: error.errors }, { status: 400 });
    }
    if (error instanceof SessionStateConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json(
      { error: "The check-in could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
