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
import type { AnswerType } from "../../../lib/ccm/types";

const DEFAULT_TEMPLATE_NAME = "Monthly CCM Check-in";
const DEFAULT_QUESTIONS: Array<{ answerType: AnswerType; prompt: string }> = [
  {
    answerType: "yes_no",
    prompt: "Have you had any new or worsening symptoms since your last check-in?",
  },
  {
    answerType: "yes_no",
    prompt: "Have you had any medication problems or missed doses?",
  },
  {
    answerType: "text",
    prompt: "What would you like your care team to know this month?",
  },
];

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
      questions: [],
      responses: [],
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

  return {
    checkIn,
    questions: sortedQuestions,
    responses: responses ?? [],
    template,
  };
}

async function ensureDefaultQuestion(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  userId: string,
  prompt: string,
  answerType: AnswerType,
) {
  const { data: existing, error: existingError } = await supabase
    .from("questions")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("prompt", prompt)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) return existing;

  const { data, error } = await supabase
    .from("questions")
    .insert({
      answer_type: answerType,
      approved_at: new Date().toISOString(),
      approved_by: userId,
      created_by: userId,
      monthly_soft_cap: 12,
      practice_id: practiceId,
      prompt,
      source: "practice",
      status: "active",
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function ensureDefaultTemplate(
  supabase: Awaited<ReturnType<typeof requirePracticeMembership>>["supabase"],
  practiceId: string,
  userId: string,
  questionIds: string[],
) {
  const { data: existing, error: existingError } = await supabase
    .from("checkin_templates")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("name", DEFAULT_TEMPLATE_NAME)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) return existing;

  const { data, error } = await supabase
    .from("checkin_templates")
    .insert({
      cadence: "monthly",
      created_by: userId,
      default_question_ids: questionIds,
      description: "Default first billable month check-in",
      name: DEFAULT_TEMPLATE_NAME,
      practice_id: practiceId,
      status: "active",
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
      return Response.json({ ...existingBundle, billingMonth });
    }

    const questions = [];
    for (const question of DEFAULT_QUESTIONS) {
      questions.push(
        await ensureDefaultQuestion(
          supabase,
          practiceId,
          user.id,
          question.prompt,
          question.answerType,
        ),
      );
    }

    const template = await ensureDefaultTemplate(
      supabase,
      practiceId,
      user.id,
      questions.map((question) => question.id),
    );

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
        sent_at: now,
        status: "sent",
        template_id: template.id,
        token,
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

    return Response.json(
      {
        billingMonth,
        checkIn,
        questions,
        responses: [],
        template,
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
