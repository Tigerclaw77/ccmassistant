import {
  authErrorResponse,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import { badRequest, optionalString, readJsonObject, requiredString } from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import type { MembershipStatus, PracticeRole } from "../../../lib/ccm/types";

const MANAGEABLE_ROLES = [
  "provider",
  "coordinator",
  "billing_staff",
  "admin",
] as const satisfies readonly PracticeRole[];

function parseManageableRole(value: unknown): PracticeRole {
  if (
    typeof value !== "string" ||
    !MANAGEABLE_ROLES.includes(value as (typeof MANAGEABLE_ROLES)[number])
  ) {
    throw new Error("role must be provider, coordinator, billing_staff, or admin");
  }

  return value as PracticeRole;
}

function parseEditableStatus(value: unknown): MembershipStatus {
  if (value !== "active" && value !== "inactive") {
    throw new Error("status must be active or inactive");
  }

  return value;
}

export async function GET(request: Request) {
  const practiceId = new URL(request.url).searchParams.get("practiceId");

  if (!practiceId) {
    return badRequest(new Error("practiceId is required"));
  }

  try {
    const { supabase } = await requirePracticeMembership(request, practiceId);
    const { data, error } = await supabase
      .from("practice_members")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ members: data });
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
  let role: PracticeRole;

  try {
    practiceId = requiredString(body, "practiceId");
    role = parseManageableRole(body.role);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );
    const userId = optionalString(body, "userId");
    const invitedEmail = optionalString(body, "invitedEmail");

    if (!userId && !invitedEmail) {
      return badRequest(new Error("userId or invitedEmail is required"));
    }

    const { data, error } = await supabase
      .from("practice_members")
      .insert({
        created_by: user.id,
        invited_email: invitedEmail,
        practice_id: practiceId,
        role,
        status: userId ? "active" : "invited",
        updated_by: user.id,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ member: data }, { status: 201 });
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
  let memberId: string;
  let status: MembershipStatus;

  try {
    practiceId = requiredString(body, "practiceId");
    memberId = requiredString(body, "memberId");
    status = parseEditableStatus(body.status);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { supabase, user } = await requirePracticeMembership(
      request,
      practiceId,
      PRACTICE_ADMIN_ROLES,
    );

    const { data: beforeData, error: beforeError } = await supabase
      .from("practice_members")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", memberId)
      .single();

    if (beforeError || !beforeData) {
      return Response.json({ error: beforeError?.message ?? "Member not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("practice_members")
      .update({
        status,
        updated_by: user.id,
      })
      .eq("practice_id", practiceId)
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      action: "practice_member.updated",
      actorUserId: user.id,
      afterData: data,
      beforeData,
      entityId: memberId,
      entityType: "practice_member",
      practiceId,
    });

    return Response.json({ member: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
