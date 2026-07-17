import { createServiceRoleSupabaseClient } from "../../../../../lib/auth";
import { ACTIVE_PUBLIC_CHECKIN_STATUSES } from "../../../../../lib/ccm/public-checkin";
import { toPublicQuestionSessionPayload } from "../../../../../lib/ccm/session-integration.ts";
import { findQuestionSessionForCheckIn } from "../../../../../lib/ccm/session-store";
import { markLatestCheckinDeliveryOpened } from "../../../../../lib/ccm/checkin-delivery-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

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

    const { data: patient } = await supabase
      .from("patients")
      .select("id, display_name")
      .eq("id", checkIn.patient_id)
      .maybeSingle();

    const { data: practice } = await supabase
      .from("practices")
      .select("id, name, billing_settings")
      .eq("id", checkIn.practice_id)
      .maybeSingle();

    const { data: provider } = checkIn.provider_id
      ? await supabase
          .from("providers")
          .select("id, full_name, credentials, phone, email")
          .eq("id", checkIn.provider_id)
          .maybeSingle()
      : { data: null };

    const { data: template } = checkIn.template_id
      ? await supabase
          .from("checkin_templates")
          .select("*")
          .eq("id", checkIn.template_id)
          .maybeSingle()
      : { data: null };

    const questionIds = template?.default_question_ids ?? [];
    const { data: questions, error: questionsError } = questionIds.length
      ? await supabase
          .from("questions")
          .select("*")
          .in("id", questionIds)
      : { data: [], error: null };

    if (questionsError) {
      return Response.json(
        { error: "The check-in is temporarily unavailable." },
        { headers: { "Cache-Control": "no-store" }, status: 500 },
      );
    }

    const sortedQuestions = questionIds
      .map((questionId: string) => (questions ?? []).find((question) => question.id === questionId))
      .filter(Boolean);

    const sessionRecord = await findQuestionSessionForCheckIn(supabase, checkIn.id);
    await markLatestCheckinDeliveryOpened(supabase, checkIn.id, checkIn.practice_id);

    return Response.json({
      checkIn: { ...checkIn, token: null },
      mode: sessionRecord ? "engine" : "legacy",
      patient,
      practice,
      provider,
      questions: sortedQuestions,
      session: sessionRecord ? toPublicQuestionSessionPayload(sessionRecord) : null,
      template,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "The check-in is temporarily unavailable." },
      { headers: { "Cache-Control": "no-store" }, status: 500 },
    );
  }
}
