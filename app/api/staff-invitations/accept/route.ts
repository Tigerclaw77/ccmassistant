import { authErrorResponse, createServiceRoleSupabaseClient, requireAuthenticatedUser } from "../../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../../lib/api/json";
import { recordAuditEvent } from "../../../../lib/ccm/audit";
import { ensureProviderProfileForMember } from "../../../../lib/ccm/provider-membership";

export async function POST(request: Request) {
  let body;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return badRequest(error);
  }

  let invitationId: string;
  try {
    invitationId = requiredString(body, "invitationId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { user } = await requireAuthenticatedUser(request);
    const email = user.email?.trim().toLowerCase();
    if (!email) return Response.json({ error: "The signed-in account does not have an email address" }, { status: 409 });
    const service = createServiceRoleSupabaseClient();
    const { data: invitation } = await service
      .from("practice_staff_invitations")
      .select("*")
      .eq("id", invitationId)
      .maybeSingle();
    if (!invitation) return Response.json({ error: "Invitation not found" }, { status: 404 });
    if (invitation.email.toLowerCase() !== email) return Response.json({ error: "This invitation belongs to a different email address" }, { status: 403 });
    if (invitation.status !== "pending" || new Date(invitation.expires_at).getTime() <= Date.now()) {
      return Response.json({ error: "This invitation is no longer active. Ask the administrator to resend it." }, { status: 410 });
    }

    const { data: existingMembership } = await service
      .from("practice_members")
      .select("id")
      .eq("practice_id", invitation.practice_id)
      .eq("user_id", user.id)
      .neq("id", invitation.member_id)
      .maybeSingle();
    if (existingMembership) return Response.json({ error: "This account already belongs to the practice" }, { status: 409 });

    if (invitation.role === "provider") {
      await ensureProviderProfileForMember(service, {
        actorUserId: user.id,
        displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null,
        email,
        memberId: invitation.member_id,
        practiceId: invitation.practice_id,
      });
    }

    const now = new Date().toISOString();
    const { data: member, error: memberError } = await service
      .from("practice_members")
      .update({ disabled_at: null, invited_email: email, removed_at: null, status: "active", updated_by: user.id, user_id: user.id })
      .eq("id", invitation.member_id)
      .eq("practice_id", invitation.practice_id)
      .select()
      .single();
    if (memberError || !member) return Response.json({ error: memberError?.message ?? "Unable to activate membership" }, { status: 500 });

    await service
      .from("practice_staff_invitations")
      .update({ accepted_at: now, auth_user_id: user.id, status: "accepted" })
      .eq("id", invitation.id)
      .eq("practice_id", invitation.practice_id);
    await recordAuditEvent(service, { action: "practice_member.invitation_accepted", actorUserId: user.id, afterData: { invitationId: invitation.id, memberId: member.id, role: member.role, status: "active" }, entityId: member.id, entityType: "practice_member", practiceId: invitation.practice_id });
    return Response.json({ member, practiceId: invitation.practice_id });
  } catch (error) {
    return authErrorResponse(error);
  }
}
