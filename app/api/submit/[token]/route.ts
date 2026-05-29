import { createClient } from "@supabase/supabase-js";
import { badRequest, readJsonObject } from "../../../../lib/api/json";

function createLegacyServiceClient() {
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

export async function POST(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  const token = new URL(request.url).pathname.split("/").pop();

  if (!token) {
    return badRequest(new Error("token is required"));
  }

  const answers = body.answers;

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return badRequest(new Error("answers must be an object"));
  }

  try {
    const supabase = createLegacyServiceClient();

    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("*")
      .eq("token", token)
      .single();

    if (assignmentError || !assignment) {
      return Response.json({ error: "Invalid link" }, { status: 404 });
    }

    const { error: submissionError } = await supabase.from("submissions").insert({
      answers,
      basket_id: assignment.basket_id,
      patient_id: assignment.patient_id,
    });

    if (submissionError) {
      return Response.json({ error: submissionError.message }, { status: 500 });
    }

    const { error: assignmentUpdateError } = await supabase
      .from("assignments")
      .update({
        completed: true,
        response_status: "responded",
      })
      .eq("id", assignment.id);

    if (assignmentUpdateError) {
      return Response.json({ error: assignmentUpdateError.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
