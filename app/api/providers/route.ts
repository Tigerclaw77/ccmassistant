import {
  authErrorResponse,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import { badRequest, optionalString, readJsonObject, requiredString } from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";

export async function GET(request: Request) {
  const practiceId = new URL(request.url).searchParams.get("practiceId");

  if (!practiceId) {
    return badRequest(new Error("practiceId is required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ providers: data ?? [] });
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
  let fullName: string;

  try {
    practiceId = requiredString(body, "practiceId");
    fullName = requiredString(body, "fullName");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );

    const { data, error } = await supabase
      .from("providers")
      .insert({
        created_by: user.id,
        credentials: optionalString(body, "credentials"),
        email: optionalString(body, "email"),
        full_name: fullName,
        is_active: true,
        is_billing_provider: true,
        npi: optionalString(body, "npi"),
        phone: optionalString(body, "phone"),
        practice_id: practiceId,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "provider.created",
      actorUserId: user.id,
      afterData: data,
      entityId: data.id,
      entityType: "provider",
      practiceId,
    });

    return Response.json({ provider: data }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
