import type { ServerSupabaseClient } from "../auth";
import type { JsonValue, UUID } from "./types";

type AuditEventInput = {
  practiceId: UUID;
  actorUserId: UUID | null;
  entityType: string;
  entityId?: UUID | null;
  action: string;
  beforeData?: JsonValue | null;
  afterData?: JsonValue | null;
  metadata?: JsonValue;
};

export async function recordAuditEvent(
  supabase: ServerSupabaseClient,
  event: AuditEventInput,
): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    action: event.action,
    actor_user_id: event.actorUserId,
    after_data: sanitizeAuditValue(event.afterData ?? null),
    before_data: sanitizeAuditValue(event.beforeData ?? null),
    entity_id: event.entityId ?? null,
    entity_type: event.entityType,
    metadata: sanitizeAuditValue(event.metadata ?? {}),
    practice_id: event.practiceId,
  });

  if (error) {
    throw new Error("Failed to record audit event");
  }
}

export function sanitizeAuditValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "token" && key !== "publicToken")
      .map(([key, nestedValue]) => [
        key,
        sanitizeAuditValue(nestedValue as JsonValue),
      ]),
  );
}
