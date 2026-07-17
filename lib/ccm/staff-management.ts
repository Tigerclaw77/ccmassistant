import type { PracticeMember, PracticeRole } from "./types";

export const ASSIGNABLE_STAFF_ROLES = ["admin", "coordinator", "provider"] as const;
export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

export function isAssignableStaffRole(value: unknown): value is AssignableStaffRole {
  return typeof value === "string" && ASSIGNABLE_STAFF_ROLES.includes(value as AssignableStaffRole);
}

export function normalizedStaffEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("A valid staff email is required");
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("A valid staff email is required");
  }
  return email;
}

export function invitationExpiration(now = new Date(), ttlMinutes = 60): string {
  if (!Number.isInteger(ttlMinutes) || ttlMinutes < 5 || ttlMinutes > 1440) {
    throw new Error("Staff invitation TTL must be between 5 and 1440 minutes");
  }
  return new Date(now.getTime() + ttlMinutes * 60_000).toISOString();
}

export function wouldRemoveFinalAdministrator(
  members: readonly Pick<PracticeMember, "id" | "removed_at" | "role" | "status">[],
  targetMemberId: string,
  nextRole?: PracticeRole,
  nextStatus?: PracticeMember["status"],
): boolean {
  const activeAdministrators = members.filter(
    (member) =>
      member.removed_at === null &&
      member.status === "active" &&
      (member.role === "owner" || member.role === "admin"),
  );
  const target = activeAdministrators.find((member) => member.id === targetMemberId);
  if (!target) return false;
  const remainsAdministrator =
    (nextRole ?? target.role) === "owner" || (nextRole ?? target.role) === "admin";
  const remainsActive = (nextStatus ?? target.status) === "active";
  return activeAdministrators.length === 1 && (!remainsAdministrator || !remainsActive);
}
