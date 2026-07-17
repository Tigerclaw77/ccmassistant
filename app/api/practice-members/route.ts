import {
  authErrorResponse,
  createServiceRoleSupabaseClient,
  PRACTICE_ADMIN_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import { badRequest, optionalString, readJsonObject, requiredString } from "../../../lib/api/json";
import { authRedirectUrl } from "../../../lib/auth-redirect";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  invitationExpiration,
  isAssignableStaffRole,
  normalizedStaffEmail,
  wouldRemoveFinalAdministrator,
  type AssignableStaffRole,
} from "../../../lib/ccm/staff-management";
import type { PracticeMember } from "../../../lib/ccm/types";
import { ensureProviderProfileForMember } from "../../../lib/ccm/provider-membership";

const INVITATION_TTL_MINUTES = Number(process.env.STAFF_INVITATION_TTL_MINUTES ?? "60");

function parseRole(value: unknown): AssignableStaffRole {
  if (!isAssignableStaffRole(value)) {
    throw new Error("role must be admin, coordinator, or provider");
  }
  return value;
}

async function memberDirectoryEntry(
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  member: PracticeMember,
) {
  if (!member.user_id) {
    return { ...member, last_login_at: null, mfa_status: "not_enrolled" as const, user_email: member.invited_email };
  }

  const [userResult, factorsResult] = await Promise.all([
    service.auth.admin.getUserById(member.user_id),
    service.auth.admin.mfa.listFactors({ userId: member.user_id }),
  ]);
  const verifiedFactors = factorsResult.data?.factors?.filter((factor) => factor.status === "verified") ?? [];
  return {
    ...member,
    last_login_at: userResult.data.user?.last_sign_in_at ?? null,
    mfa_status: verifiedFactors.length ? "verified" as const : "not_enrolled" as const,
    user_email: userResult.data.user?.email ?? member.invited_email,
  };
}

export async function GET(request: Request) {
  const practiceId = new URL(request.url).searchParams.get("practiceId");
  if (!practiceId) return badRequest(new Error("practiceId is required"));

  try {
    const context = await requirePracticeMembership(request, practiceId);
    const service = createServiceRoleSupabaseClient();
    const { data: members, error } = await service
      .from("practice_members")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const canManage = PRACTICE_ADMIN_ROLES.includes(context.membership.role as "owner" | "admin");
    const directory = canManage
      ? await Promise.all((members ?? []).map((member) => memberDirectoryEntry(service, member)))
      : members ?? [];
    const { data: invitations } = canManage
      ? await service
          .from("practice_staff_invitations")
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })
      : { data: [] };

    const now = Date.now();
    const expiredIds = (invitations ?? [])
      .filter((invitation) => invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= now)
      .map((invitation) => invitation.id);
    if (expiredIds.length) {
      await service.from("practice_staff_invitations").update({ status: "expired" }).eq("practice_id", practiceId).in("id", expiredIds);
    }
    const resolvedInvitations = (invitations ?? []).map((invitation) => ({
      ...invitation,
      status:
        invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= now
          ? "expired"
          : invitation.status,
    }));

    return Response.json({ canManage, invitations: resolvedInvitations, members: directory });
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
  let email: string;
  let role: AssignableStaffRole;
  try {
    practiceId = requiredString(body, "practiceId");
    email = normalizedStaffEmail(body.email ?? body.invitedEmail);
    role = parseRole(body.role);
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { user } = await requirePracticeMembership(request, practiceId, PRACTICE_ADMIN_ROLES);
    const service = createServiceRoleSupabaseClient();
    const { data: existing } = await service
      .from("practice_members")
      .select("*")
      .eq("practice_id", practiceId)
      .ilike("invited_email", email)
      .is("removed_at", null)
      .maybeSingle();
    if (existing) {
      return Response.json({ error: "This email already has a current practice membership or invitation" }, { status: 409 });
    }

    const { data: member, error: memberError } = await service
      .from("practice_members")
      .insert({
        created_by: user.id,
        invited_email: email,
        practice_id: practiceId,
        role,
        status: "invited",
        updated_by: user.id,
        user_id: null,
      })
      .select()
      .single();
    if (memberError || !member) {
      return Response.json({ error: memberError?.message ?? "Unable to create invitation" }, { status: 500 });
    }

    const expiresAt = invitationExpiration(new Date(), INVITATION_TTL_MINUTES);
    const { data: invitation, error: invitationError } = await service
      .from("practice_staff_invitations")
      .insert({
        email,
        expires_at: expiresAt,
        invited_by: user.id,
        member_id: member.id,
        practice_id: practiceId,
        role,
        status: "pending",
      })
      .select()
      .single();
    if (invitationError || !invitation) {
      await service.from("practice_members").delete().eq("id", member.id).eq("practice_id", practiceId).eq("status", "invited");
      return Response.json({ error: invitationError?.message ?? "Unable to create invitation" }, { status: 500 });
    }

    const redirectTo = authRedirectUrl(`/accept-invitation?invitation=${encodeURIComponent(invitation.id)}`);
    const invited = await service.auth.admin.inviteUserByEmail(email, {
      data: { practice_invitation_id: invitation.id },
      redirectTo,
    });
    const sentAt = new Date().toISOString();
    const { data: savedInvitation } = await service
      .from("practice_staff_invitations")
      .update({
        auth_user_id: invited.data.user?.id ?? null,
        sent_at: invited.error ? null : sentAt,
        status: invited.error ? "delivery_failed" : "pending",
      })
      .eq("id", invitation.id)
      .eq("practice_id", practiceId)
      .select()
      .single();

    await recordAuditEvent(service, {
      action: invited.error ? "practice_member.invitation_delivery_failed" : "practice_member.invited",
      actorUserId: user.id,
      afterData: { invitationId: invitation.id, memberId: member.id, role, status: invited.error ? "delivery_failed" : "pending" },
      entityId: member.id,
      entityType: "practice_member",
      practiceId,
    });

    if (invited.error) {
      return Response.json({ error: "Invitation was recorded but the email could not be delivered", invitation: savedInvitation, member }, { status: 502 });
    }
    return Response.json({ invitation: savedInvitation, member }, { status: 201 });
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
  try {
    practiceId = requiredString(body, "practiceId");
    memberId = requiredString(body, "memberId");
  } catch (error) {
    return badRequest(error);
  }

  try {
    const { user } = await requirePracticeMembership(request, practiceId, PRACTICE_ADMIN_ROLES);
    const service = createServiceRoleSupabaseClient();
    const { data: member } = await service
      .from("practice_members")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("id", memberId)
      .maybeSingle();
    if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

    const requestedStatus = optionalString(body, "status");
    const action = optionalString(body, "action") ?? (requestedStatus === "active" ? "enable" : requestedStatus === "inactive" ? "disable" : "change_role");

    if (action === "resend" || action === "cancel") {
      const invitationId = requiredString(body, "invitationId");
      const { data: invitation } = await service
        .from("practice_staff_invitations")
        .select("*")
        .eq("id", invitationId)
        .eq("member_id", memberId)
        .eq("practice_id", practiceId)
        .maybeSingle();
      if (!invitation) return Response.json({ error: "Invitation not found" }, { status: 404 });
      if (!["pending", "delivery_failed", "expired"].includes(invitation.status)) {
        return Response.json({ error: "Only an active invitation can be resent or cancelled" }, { status: 409 });
      }

      if (action === "cancel") {
        if (!["pending", "delivery_failed"].includes(invitation.status)) {
          return Response.json({ error: "Only a pending invitation can be cancelled" }, { status: 409 });
        }
        const now = new Date().toISOString();
        const { data: cancelled } = await service
          .from("practice_staff_invitations")
          .update({ cancelled_at: now, status: "cancelled" })
          .eq("id", invitation.id)
          .eq("practice_id", practiceId)
          .select()
          .single();
        await service.from("practice_members").update({ removed_at: now, status: "inactive", updated_by: user.id }).eq("id", memberId).eq("practice_id", practiceId);
        await recordAuditEvent(service, { action: "practice_member.invitation_cancelled", actorUserId: user.id, afterData: { invitationId, status: "cancelled" }, entityId: memberId, entityType: "practice_member", practiceId });
        return Response.json({ invitation: cancelled });
      }

      const expiresAt = invitationExpiration(new Date(), INVITATION_TTL_MINUTES);
      const redirectTo = authRedirectUrl(`/accept-invitation?invitation=${encodeURIComponent(invitation.id)}`);
      const invited = await service.auth.admin.inviteUserByEmail(invitation.email, {
        data: { practice_invitation_id: invitation.id },
        redirectTo,
      });
      const { data: resent } = await service
        .from("practice_staff_invitations")
        .update({
          auth_user_id: invited.data.user?.id ?? invitation.auth_user_id,
          expires_at: expiresAt,
          resend_count: invitation.resend_count + 1,
          sent_at: invited.error ? invitation.sent_at : new Date().toISOString(),
          status: invited.error ? "delivery_failed" : "pending",
        })
        .eq("id", invitation.id)
        .eq("practice_id", practiceId)
        .select()
        .single();
      await recordAuditEvent(service, { action: invited.error ? "practice_member.invitation_delivery_failed" : "practice_member.invitation_resent", actorUserId: user.id, afterData: { invitationId, resendCount: invitation.resend_count + 1 }, entityId: memberId, entityType: "practice_member", practiceId });
      if (invited.error) return Response.json({ error: "Invitation email could not be delivered", invitation: resent }, { status: 502 });
      return Response.json({ invitation: resent });
    }

    if (member.role === "owner" && (action === "remove" || action === "change_role")) {
      return Response.json({ error: "The practice owner cannot be removed or reassigned" }, { status: 409 });
    }

    const { data: allMembers } = await service.from("practice_members").select("*").eq("practice_id", practiceId);
    let update: Partial<Omit<PracticeMember, "id" | "created_at">> & { updated_by: string } = { updated_by: user.id };
    let auditAction = "practice_member.updated";

    if (action === "change_role") {
      const role = parseRole(body.role);
      if (wouldRemoveFinalAdministrator(allMembers ?? [], member.id, role)) {
        return Response.json({ error: "The final active administrator cannot be reassigned" }, { status: 409 });
      }
      update = { ...update, last_role_changed_at: new Date().toISOString(), role };
      auditAction = "practice_member.role_changed";
    } else if (action === "disable" || action === "remove") {
      if (wouldRemoveFinalAdministrator(allMembers ?? [], member.id, undefined, "inactive")) {
        return Response.json({ error: "The final active administrator cannot be disabled or removed" }, { status: 409 });
      }
      const now = new Date().toISOString();
      update = { ...update, disabled_at: now, status: "inactive", ...(action === "remove" ? { removed_at: now } : {}) };
      auditAction = action === "remove" ? "practice_member.removed" : "practice_member.disabled";
    } else if (action === "enable") {
      if (member.removed_at) return Response.json({ error: "A removed member cannot be re-enabled; send a new invitation" }, { status: 409 });
      update = { ...update, disabled_at: null, status: "active" };
      auditAction = "practice_member.enabled";
    } else {
      return badRequest(new Error("Unsupported staff action"));
    }

    if (action === "change_role" && update.role === "provider" && member.user_id) {
      const account = await service.auth.admin.getUserById(member.user_id);
      const providerEmail = account.data.user?.email ?? member.invited_email;
      if (!providerEmail) return Response.json({ error: "The provider account does not have an email address" }, { status: 409 });
      await ensureProviderProfileForMember(service, {
        actorUserId: user.id,
        displayName: typeof account.data.user?.user_metadata?.display_name === "string" ? account.data.user.user_metadata.display_name : null,
        email: providerEmail,
        memberId: member.id,
        practiceId,
      });
    }

    const { data: saved, error: saveError } = await service
      .from("practice_members")
      .update(update)
      .eq("practice_id", practiceId)
      .eq("id", memberId)
      .select()
      .single();
    if (saveError || !saved) return Response.json({ error: saveError?.message ?? "Unable to update member" }, { status: 500 });
    await recordAuditEvent(service, { action: auditAction, actorUserId: user.id, afterData: saved, beforeData: member, entityId: memberId, entityType: "practice_member", practiceId });
    return Response.json({ member: saved });
  } catch (error) {
    return authErrorResponse(error);
  }
}
