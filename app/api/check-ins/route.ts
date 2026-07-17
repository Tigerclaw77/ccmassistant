import { randomUUID } from "crypto";
import {
  authErrorResponse,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import {
  badRequest,
  firstDayOfMonth,
  optionalString,
  readJsonObject,
  requiredString,
} from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import { publicCheckinTokenExpiresAt } from "../../../lib/ccm/public-checkin";
import { hasSessionEngineMarker, toQuestionSessionPayload } from "../../../lib/ccm/session-integration.ts";
import { createStoredQuestionSession, findQuestionSessionForCheckIn } from "../../../lib/ccm/session-store";

async function loadCheckInBundle(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  patientId: string,
  billingMonth: string,
) {
  const { data: checkIn, error: checkInError } = await supabase
    .from("checkin_instances")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("patient_id", patientId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  if (checkInError) {
    throw new Error(checkInError.message);
  }

  if (!checkIn) {
    return {
      checkIn: null,
      mode: null,
      questions: [],
      responses: [],
      session: null,
      template: null,
    };
  }

  const { data: template, error: templateError } = checkIn.template_id
    ? await supabase
        .from("checkin_templates")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("id", checkIn.template_id)
        .maybeSingle()
    : { data: null, error: null };

  if (templateError) {
    throw new Error(templateError.message);
  }

  const questionIds = template?.default_question_ids ?? [];
  const { data: questions, error: questionsError } = questionIds.length
    ? await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds)
    : { data: [], error: null };

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const sortedQuestions = questionIds
    .map((questionId) => (questions ?? []).find((question) => question.id === questionId))
    .filter(Boolean);

  const { data: responses, error: responsesError } = await supabase
    .from("checkin_responses")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("checkin_instance_id", checkIn.id)
    .order("created_at", { ascending: true });

  if (responsesError) {
    throw new Error(responsesError.message);
  }

  const sessionRecord = await findQuestionSessionForCheckIn(supabase, checkIn.id);

  return {
    checkIn,
    mode: sessionRecord ? "engine" as const : "legacy" as const,
    questions: sortedQuestions,
    responses: responses ?? [],
    session: sessionRecord ? toQuestionSessionPayload(sessionRecord) : null,
    template,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");
  const billingMonth = searchParams.get("billingMonth") ?? firstDayOfMonth();

  if (!practiceId || !patientId) {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const bundle = await loadCheckInBundle(supabase, practiceId, patientId, billingMonth);

    return Response.json({ ...bundle, billingMonth });
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

  let practiceId: string;
  let patientId: string;

  try {
    practiceId = requiredString(body, "practiceId");
    patientId = requiredString(body, "patientId");
  } catch (error) {
    return badRequest(error);
  }

  const billingMonth = optionalString(body, "billingMonth") ?? firstDayOfMonth();

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const existingBundle = await loadCheckInBundle(supabase, practiceId, patientId, billingMonth);
    if (existingBundle.checkIn) {
      if (
        !existingBundle.session &&
        hasSessionEngineMarker(existingBundle.checkIn.metadata)
      ) {
        const created = await createStoredQuestionSession(supabase, user.id, {
          checkinInstanceId: existingBundle.checkIn.id,
          patientId,
          practiceId,
          workflow: "monthly_checkin",
        });
        return Response.json({
          ...existingBundle,
          billingMonth,
          mode: "engine",
          session: created.payload,
        });
      }
      return Response.json({ ...existingBundle, billingMonth });
    }

    const { data: enrollment } = await supabase
      .from("ccm_enrollments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle();

    const token = randomUUID().replace(/-/g, "");
    const now = new Date().toISOString();
    const createOnly = body.createOnly === true;

    const { data: checkIn, error } = await supabase
      .from("checkin_instances")
      .insert({
        billing_month: billingMonth,
        created_by: user.id,
        enrollment_id: enrollment?.id ?? null,
        followup_due_at: optionalString(body, "followupDueAt"),
        patient_id: patientId,
        practice_id: practiceId,
        provider_id: enrollment?.assigned_provider_id ?? patient?.primary_provider_id ?? null,
        metadata: { question_session_engine_version: 1 },
        sent_at: createOnly ? null : now,
        status: createOnly ? "ready" : "sent",
        template_id: null,
        token: createOnly ? null : token,
        token_expires_at: createOnly ? null : publicCheckinTokenExpiresAt(new Date(now)),
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message.toLowerCase().includes("unique")) {
        const bundle = await loadCheckInBundle(supabase, practiceId, patientId, billingMonth);
        if (bundle.checkIn) {
          return Response.json({ ...bundle, billingMonth });
        }
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "checkin_instance.created",
      actorUserId: user.id,
      afterData: checkIn,
      entityId: checkIn.id,
      entityType: "checkin_instance",
      metadata: { billingMonth },
      practiceId,
    });

    const createdSession = await createStoredQuestionSession(supabase, user.id, {
      checkinInstanceId: checkIn.id,
      now,
      patientId,
      practiceId,
      workflow: "monthly_checkin",
    });

    return Response.json(
      {
        billingMonth,
        checkIn,
        mode: "engine",
        questions: [],
        responses: [],
        session: createdSession.payload,
        template: null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name !== "AuthError") {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return authErrorResponse(error);
  }
}
