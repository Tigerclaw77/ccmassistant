import {
  authErrorResponse,
  createServiceRoleSupabaseClient,
  requireAuthenticatedUser,
} from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function POST(request: Request) {
  let body;

  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let name: string;

  try {
    name = requiredString(body, "name");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { user } = await requireAuthenticatedUser(request);
    const serviceSupabase = createServiceRoleSupabaseClient();

    const { data: existingMembership, error: existingMembershipError } = await serviceSupabase
      .from("practice_members")
      .select("id, practice_id, role, status, user_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingMembershipError) {
      return Response.json({ error: existingMembershipError.message }, { status: 500 });
    }

    if (existingMembership) {
      const { data: existingPractice, error: existingPracticeError } = await serviceSupabase
        .from("practices")
        .select("*")
        .eq("id", existingMembership.practice_id)
        .single();

      if (existingPracticeError) {
        return Response.json({ error: existingPracticeError.message }, { status: 500 });
      }

      return Response.json({
        membership: existingMembership,
        practice: existingPractice,
      });
    }

    const { data: practice, error: practiceError } = await serviceSupabase
      .from("practices")
      .insert({
        created_by: user.id,
        name,
        slug: `${slugify(name)}-${user.id.slice(0, 8)}`,
        updated_by: user.id,
      })
      .select()
      .single();

    if (practiceError) {
      return Response.json({ error: practiceError.message }, { status: 500 });
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .from("practice_members")
      .insert({
        created_by: user.id,
        practice_id: practice.id,
        role: "owner",
        status: "active",
        updated_by: user.id,
        user_id: user.id,
      })
      .select()
      .single();

    if (membershipError) {
      return Response.json({ error: membershipError.message }, { status: 500 });
    }

    await serviceSupabase.from("audit_events").insert({
      action: "practice.bootstrapped",
      actor_user_id: user.id,
      after_data: { membership, practice },
      entity_id: practice.id,
      entity_type: "practice",
      practice_id: practice.id,
    });

    return Response.json({ membership, practice }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

