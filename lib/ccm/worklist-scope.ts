import { WORK_QUEUE_GROUPS, type WorkQueueGroup } from "./opportunity-detector.ts";
import type { StaffQueueKey } from "./staff-experience.ts";
import type { WorklistRow } from "./worklist.ts";
import type { PracticeRole } from "./types.ts";

export type ProviderAttentionCounts = {
  alerts: number;
  approvals: number;
  carePlans: number;
  other: number;
};

export function resolveWorklistAssignment(
  requestedAssignment: string,
  membership: Pick<{ id: string; role: PracticeRole }, "id" | "role">,
): string {
  if (requestedAssignment === "practice") return "";
  return requestedAssignment || (membership.role === "coordinator" ? membership.id : "");
}

export function summarizeAndPageWorklistRows(
  allRows: WorklistRow[],
  options: {
    group: WorkQueueGroup | null;
    page: number;
    pageSize: number;
    queueKey: StaffQueueKey | null;
  },
) {
  const groupCounts = Object.fromEntries(WORK_QUEUE_GROUPS.map((key) => [
    key,
    allRows.filter((row) => row.queueGroup === key).length,
  ])) as Record<WorkQueueGroup, number>;
  const providerAttentionRows = allRows.filter((row) => row.queueKeys.includes("provider_review"));
  const providerAttentionCounts: ProviderAttentionCounts = {
    alerts: providerAttentionRows.filter((row) => row.priority === "urgent").length,
    approvals: providerAttentionRows.filter((row) =>
      row.priority !== "urgent" && row.reasonCodes.includes("missing_provider_attestation"),
    ).length,
    carePlans: providerAttentionRows.filter((row) =>
      row.priority !== "urgent" && row.reasonCodes.includes("incomplete_care_plan"),
    ).length,
    other: providerAttentionRows.filter((row) =>
      row.priority !== "urgent"
      && !row.reasonCodes.includes("missing_provider_attestation")
      && !row.reasonCodes.includes("incomplete_care_plan"),
    ).length,
  };
  const scopedRows = allRows.filter((row) =>
    (!options.group || row.queueGroup === options.group)
    && (!options.queueKey || row.queueKeys.includes(options.queueKey)),
  );
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
  if (options.group || options.queueKey) {
    scopedRows.sort((left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority]
      || left.patientName.localeCompare(right.patientName)
      || left.patientId.localeCompare(right.patientId),
    );
  }
  const start = (options.page - 1) * options.pageSize;

  return {
    groupCounts,
    providerAttentionCounts,
    rows: scopedRows.slice(start, start + options.pageSize),
    total: scopedRows.length,
  };
}
