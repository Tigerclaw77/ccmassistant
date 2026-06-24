import { createClient } from "@supabase/supabase-js";
import { badRequest, readJsonObject } from "../../../../../../lib/api/json";

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

  const answers = body.answers;

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return badRequest(new Error("answers must be an object"));
  }

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

    if (checkIn.status === "responded" || checkIn.status === "closed") {
      return Response.json(
        { error: "This check-in has already been submitted." },
        { status: 409 },
      );
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
      return Response.json({ error: insertError.message }, { status: 500 });
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
      })
      .eq("id", checkIn.id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
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
      metadata: { publicToken: token },
      practice_id: checkIn.practice_id,
    });

    return Response.json({ checkIn: updatedCheckIn, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
