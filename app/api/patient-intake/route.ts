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
import {
  generateIntakeDraft,
  intakeInputToJson,
  intakeSummaryToJson,
  stringArrayToJson,
  type IntakeInput,
} from "../../../lib/ccm/ai-intake";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  buildIntakeSessionPreview,
  intakeSessionSummaryToJson,
  type IntakeManualCorrections,
} from "../../../lib/ccm/intake-session-summary";
import { sessionStateFromJson } from "../../../lib/ccm/session-integration";
import type { JsonValue, PatientIntakeSummary } from "../../../lib/ccm/types";
import { recalculateBillabilityForMutation } from "../billability/recalculate/route";

function stringArrayFromBody(body: Record<string, unknown>, key: string): string[] | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${key} must be a string array`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function jsonObjectFromBody(body: Record<string, unknown>, key: string): JsonValue | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${key} must be an object`);
  }

  return value as JsonValue;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const patientId = searchParams.get("patientId");

  if (!practiceId || !patientId) {
    return badRequest(new Error("practiceId and patientId are required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("patient_intake_summaries")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const intakes = (data ?? []) as PatientIntakeSummary[];

    return Response.json({
      intakes,
      latest: intakes[0] ?? null,
      latestAccepted: intakes.find((intake) => intake.status === "accepted") ?? null,
    });
  } catch (error) {
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

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    const requestedEnrollmentId = optionalString(body, "enrollmentId");
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("ccm_enrollments")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (enrollmentError) {
      return Response.json({ error: enrollmentError.message }, { status: 500 });
    }

    const enrollment =
      (enrollments ?? []).find((row) => row.id === requestedEnrollmentId) ??
      (enrollments ?? []).find((row) => row.status === "active") ??
      enrollments?.[0] ??
      null;

    const { data: conditions, error: conditionsError } = await supabase
      .from("patient_conditions")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("condition_name", { ascending: true });

    if (conditionsError) {
      return Response.json({ error: conditionsError.message }, { status: 500 });
    }

    const sourceQuestionSessionId = optionalString(body, "sourceQuestionSessionId");
    if (sourceQuestionSessionId) {
      const { data: sessionRecord, error: sessionError } = await supabase
        .from("question_sessions")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("patient_id", patientId)
        .eq("id", sourceQuestionSessionId)
        .eq("workflow", "intake")
        .maybeSingle();
      if (sessionError) return Response.json({ error: sessionError.message }, { status: 500 });
      if (!sessionRecord) return Response.json({ error: "Completed intake session not found" }, { status: 404 });

      const session = sessionStateFromJson(sessionRecord.session_state);
      if (session.status !== "completed") return badRequest(new Error("Complete the intake questions first"));
      const rawCorrections = body.manualCorrections;
      if (rawCorrections !== undefined && (!rawCorrections || typeof rawCorrections !== "object" || Array.isArray(rawCorrections))) {
        return badRequest(new Error("manualCorrections must be an object"));
      }
      const manualCorrections = (rawCorrections ?? {}) as IntakeManualCorrections;
      const preview = buildIntakeSessionPreview(session, patient, conditions ?? [], manualCorrections);
      const { data: existingAccepted, error: acceptedError } = await supabase
        .from("patient_intake_summaries")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("patient_id", patientId)
        .eq("status", "accepted")
        .maybeSingle();
      if (acceptedError) return Response.json({ error: acceptedError.message }, { status: 500 });
      if (existingAccepted && body.replaceAccepted !== true) {
        return Response.json({
          code: "accepted_intake_exists",
          error: "An accepted intake already exists. Explicitly confirm replacement after reviewing changes.",
        }, { status: 409 });
      }
      if (existingAccepted) {
        const { error: archiveError } = await supabase
          .from("patient_intake_summaries")
          .update({ status: "archived", updated_by: user.id })
          .eq("practice_id", practiceId)
          .eq("id", existingAccepted.id);
        if (archiveError) return Response.json({ error: archiveError.message }, { status: 500 });
      }

      const now = new Date().toISOString();
      const summaryJson = intakeSessionSummaryToJson(preview.summary);
      const inputSnapshot = {
        correction_fields: Object.keys(manualCorrections).filter((key) => manualCorrections[key as keyof IntakeManualCorrections]?.trim()),
        source_question_session_id: sessionRecord.id,
        source_question_versions: preview.summary.source_references.map((item) => ({
          question_id: item.question_id,
          question_version: item.question_version,
        })),
      } as JsonValue;
      const { data, error } = await supabase
        .from("patient_intake_summaries")
        .insert({
          accepted_at: now,
          accepted_by: user.id,
          confidence_score: null,
          created_by: user.id,
          draft_summary: summaryJson,
          enrollment_id: enrollment?.id ?? requestedEnrollmentId,
          follow_up_questions: [],
          generated_by: "session_engine",
          input_snapshot: inputSnapshot,
          missing_information: preview.incompleteFields,
          patient_id: patientId,
          practice_id: practiceId,
          quality_flags: preview.incompleteFields.map((field) => `incomplete_${field}`),
          reviewed_summary: summaryJson,
          status: "accepted",
          updated_by: user.id,
        })
        .select()
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });

      await recordAuditEvent(supabase, {
        action: "patient_intake.completed_from_session",
        actorUserId: user.id,
        afterData: data,
        beforeData: existingAccepted ?? null,
        entityId: data.id,
        entityType: "patient_intake_summary",
        metadata: {
          correctedFields: Object.keys(manualCorrections),
          patientId,
          sourceQuestionSessionId: sessionRecord.id,
        },
        practiceId,
      });
      await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId, practiceId });
      return Response.json({ intake: data }, { status: 201 });
    }

    const input: IntakeInput = {
      chronicConditions: (conditions ?? []).map((condition) => ({
        code: condition.code,
        code_system: condition.code_system,
        condition_name: condition.condition_name,
      })),
      clinicalNotes: optionalString(body, "clinicalNotes") ?? "",
      demographics: {
        dateOfBirth: patient.dob,
        displayName: patient.display_name,
        email: patient.email,
        phone: patient.phone,
        preferredContactMethod: patient.preferred_contact_method,
      },
      medications: optionalString(body, "medications") ?? "",
    };
    const draft = await generateIntakeDraft(input);

    const { data, error } = await supabase
      .from("patient_intake_summaries")
      .insert({
        confidence_score: draft.confidenceScore,
        created_by: user.id,
        draft_summary: intakeSummaryToJson(draft.draftSummary),
        enrollment_id: enrollment?.id ?? requestedEnrollmentId,
        follow_up_questions: stringArrayToJson(draft.followUpQuestions),
        generated_by: draft.generatedBy,
        input_snapshot: intakeInputToJson(input),
        missing_information: stringArrayToJson(draft.missingInformation),
        patient_id: patientId,
        practice_id: practiceId,
        quality_flags: draft.qualityFlags,
        status: "draft",
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "patient_intake.generated",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "patient_intake_summary",
      metadata: { generatedBy: draft.generatedBy, patientId },
      practiceId,
    });

    return Response.json({ intake: data }, { status: 201 });
  } catch (error) {
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

  let practiceId: string;
  let intakeId: string;
  let action: string;

  try {
    practiceId = requiredString(body, "practiceId");
    intakeId = requiredString(body, "intakeId");
    action = requiredString(body, "action");
  } catch (error) {
    return badRequest(error);
  }

  if (!["accept", "update"].includes(action)) {
    return badRequest(new Error("action must be accept or update"));
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PATIENT_WRITE_ROLES,
    );

    const { data: beforeData, error: beforeError } = await supabase
      .from("patient_intake_summaries")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", intakeId)
      .maybeSingle();

    if (beforeError) {
      return Response.json({ error: beforeError.message }, { status: 500 });
    }

    if (!beforeData) {
      return Response.json({ error: "Intake summary not found" }, { status: 404 });
    }

    let reviewedSummary: JsonValue | undefined;
    let missingInformation: JsonValue | undefined;
    let followUpQuestions: JsonValue | undefined;

    try {
      reviewedSummary = jsonObjectFromBody(body, "reviewedSummary");
      const missing = stringArrayFromBody(body, "missingInformation");
      const followUps = stringArrayFromBody(body, "followUpQuestions");
      missingInformation = missing ? stringArrayToJson(missing) : undefined;
      followUpQuestions = followUps ? stringArrayToJson(followUps) : undefined;
    } catch (error) {
      return badRequest(error);
    }

    if (action === "accept") {
      const { error: archiveError } = await supabase
        .from("patient_intake_summaries")
        .update({ status: "archived", updated_by: user.id })
        .eq("practice_id", practiceId)
        .eq("patient_id", beforeData.patient_id)
        .eq("status", "accepted")
        .neq("id", intakeId);

      if (archiveError) {
        return Response.json({ error: archiveError.message }, { status: 500 });
      }
    }

    const patch = {
      accepted_at: action === "accept" ? new Date().toISOString() : undefined,
      accepted_by: action === "accept" ? user.id : undefined,
      follow_up_questions: followUpQuestions,
      missing_information: missingInformation,
      reviewed_summary:
        reviewedSummary ?? beforeData.reviewed_summary ?? beforeData.draft_summary,
      status: action === "accept" ? ("accepted" as const) : undefined,
      updated_by: user.id,
    };

    const { data, error } = await supabase
      .from("patient_intake_summaries")
      .update(patch)
      .eq("practice_id", practiceId)
      .eq("id", intakeId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: action === "accept" ? "patient_intake.accepted" : "patient_intake.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: data.id,
      entityType: "patient_intake_summary",
      metadata: { patientId: data.patient_id },
      practiceId,
    });

    if (action === "accept") {
      await recalculateBillabilityForMutation(request, { billingMonth: firstDayOfMonth(), patientId: data.patient_id, practiceId });
    }

    return Response.json({ intake: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
