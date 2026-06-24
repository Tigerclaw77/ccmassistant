import { createClient } from "@supabase/supabase-js";

function createPublicCheckInServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role key is not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const supabase = createPublicCheckInServiceClient();

    const { data: checkIn, error: checkInError } = await supabase
      .from("checkin_instances")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (checkInError || !checkIn) {
      return Response.json({ error: "Invalid link" }, { status: 404 });
    }

    const { data: patient } = await supabase
      .from("patients")
      .select("id, display_name")
      .eq("id", checkIn.patient_id)
      .maybeSingle();

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
      return Response.json({ error: questionsError.message }, { status: 500 });
    }

    const sortedQuestions = questionIds
      .map((questionId: string) => (questions ?? []).find((question) => question.id === questionId))
      .filter(Boolean);

    return Response.json({
      checkIn,
      patient,
      questions: sortedQuestions,
      template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
