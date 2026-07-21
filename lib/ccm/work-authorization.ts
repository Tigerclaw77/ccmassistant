import type { PracticeRole } from "./types.ts";

export function canExecuteClinicalWork(args: {
  assignedCoordinatorId: string | null;
  membershipId: string;
  role: PracticeRole;
  workLocation?: "remote" | "in_office";
}): boolean {
  if (["owner", "admin", "provider"].includes(args.role)) return true;
  if (args.role !== "coordinator") return false;
  return args.assignedCoordinatorId === args.membershipId;
}

export function assertClinicalWorkAccess(args: Parameters<typeof canExecuteClinicalWork>[0]): void {
  if (!canExecuteClinicalWork(args)) throw new Error("This clinical work item is outside your assigned scope");
}
