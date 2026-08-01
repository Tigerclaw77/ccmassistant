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
import {
  ACCESS_ROLE_TO_LEGACY_ROLE,
  LEGACY_ROLE_TO_ACCESS_ROLE,
  type AssignableOperationalRole,
} from "../../../lib/access-roles";

const INVITATION_TTL_MINUTES = Number(process.env.STAFF_INVITATION_TTL_MINUTES ?? "60");

function parseRole(value: unknown): AssignableStaffRole {
  if (!isAssignableStaffRole(value)) {
    throw new Error("role must be a supported operational role");
  }
  return value;
}

async function memberDirectoryEntry(
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  member: PracticeMember & { access_role: AssignableOperationalRole | "organization_owner" },
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

async function operationalRolesByMember(
  service: ReturnType<typeof createServiceRoleSupabaseClient>,
  practiceId: string,
) {
  const { data, error } = await service
    .from("practice_member_role_assignments")
    .select("member_id,role")
    .eq("practice_id", practiceId)
    .eq("status", "active")
    .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);
  if (error) throw error;
  return new Map((data ?? []).map((assignment) => [assignment.member_id, assignment.role as AssignableOperationalRole]));
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

    const canManage = context.accessRoles.some((role) => role === "organization_owner" || role === "practice_administrator");
    const roleByMember = await operationalRolesByMember(service, practiceId);
    const resolvedMembers = (members ?? []).map((member) => ({
      ...member,
      access_role: member.role === "owner" ? "organization_owner" as const : roleByMember.get(member.id) ?? LEGACY_ROLE_TO_ACCESS_ROLE[member.role],
    }));
    const directory = canManage
      ? await Promise.all(resolvedMembers.map((member) => memberDirectoryEntry(service, member)))
      : resolvedMembers;
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
        role: ACCESS_ROLE_TO_LEGACY_ROLE[role],
        status: "invited",
        updated_by: user.id,
        user_id: null,
      })
      .select()
      .single();
    if (memberError || !member) {
      return Response.json({ error: memberError?.message ?? "Unable to create invitation" }, { status: 500 });
    }

    const { error: assignmentError } = await service.from("practice_member_role_assignments").insert({
      assigned_by: user.id,
      member_id: member.id,
      practice_id: practiceId,
      role,
      status: "invited",
      user_id: null,
    });
    if (assignmentError) {
      await service.from("practice_members").delete().eq("id", member.id).eq("practice_id", practiceId);
      return Response.json({ error: assignmentError.message }, { status: 500 });
    }

    const expiresAt = invitationExpiration(new Date(), INVITATION_TTL_MINUTES);
    const { data: invitation, error: invitationError } = await service
      .from("practice_staff_invitations")
      .insert({
        email,
        access_role: role,
        expires_at: expiresAt,
        invited_by: user.id,
        member_id: member.id,
        practice_id: practiceId,
        role: ACCESS_ROLE_TO_LEGACY_ROLE[role],
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
        await service.from("practice_member_role_assignments").update({ status: "inactive", valid_until: now }).eq("practice_id", practiceId).eq("member_id", memberId);
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
    let auditAction = "practice_member.updated";

    if (action === "change_role") {
      const role = parseRole(body.role);
      const legacyRole = ACCESS_ROLE_TO_LEGACY_ROLE[role];
      if (wouldRemoveFinalAdministrator(allMembers ?? [], member.id, legacyRole)) {
        return Response.json({ error: "The final active administrator cannot be reassigned" }, { status: 409 });
      }
      auditAction = "practice_member.role_changed";
    } else if (action === "disable" || action === "remove") {
      if (wouldRemoveFinalAdministrator(allMembers ?? [], member.id, undefined, "inactive")) {
        return Response.json({ error: "The final active administrator cannot be disabled or removed" }, { status: 409 });
      }
      auditAction = action === "remove" ? "practice_member.removed" : "practice_member.disabled";
    } else if (action === "enable") {
      if (member.removed_at) return Response.json({ error: "A removed member cannot be re-enabled; send a new invitation" }, { status: 409 });
      auditAction = "practice_member.enabled";
    } else {
      return badRequest(new Error("Unsupported staff action"));
    }

    const requestedRole = action === "change_role" ? parseRole(body.role) : null;
    if (requestedRole === "provider" && member.user_id) {
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

    const { data: savedData, error: saveError } = await service.rpc("update_practice_member_access", {
      access_role_value: requestedRole,
      action_value: action,
      actor_user_id: user.id,
      target_member_id: memberId,
      target_practice_id: practiceId,
    });
    const saved = savedData as unknown as PracticeMember | null;
    if (saveError || !saved) return Response.json({ error: saveError?.message ?? "Unable to update member" }, { status: 500 });
    await recordAuditEvent(service, { action: auditAction, actorUserId: user.id, afterData: saved, beforeData: member, entityId: memberId, entityType: "practice_member", practiceId });
    return Response.json({ member: saved });
  } catch (error) {
    return authErrorResponse(error);
  }
}
