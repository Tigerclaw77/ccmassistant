import type { ServerSupabaseClient } from "../auth";
import { recordAuditEvent } from "./audit";

export async function markLatestCheckinDeliveryOpened(
  supabase: ServerSupabaseClient,
  checkinInstanceId: string,
  practiceId: string,
): Promise<void> {
  const { data: delivery } = await supabase
    .from("checkin_deliveries")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("checkin_instance_id", checkinInstanceId)
    .in("status", ["pending", "delivered"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!delivery) return;
  const openedAt = new Date().toISOString();
  const { data: saved } = await supabase.from("checkin_deliveries").update({ opened_at: openedAt, status: "opened" }).eq("id", delivery.id).in("status", ["pending", "delivered"]).select("id").maybeSingle();
  if (!saved) return;
  await recordAuditEvent(supabase, { action: "checkin.delivery_opened", actorUserId: null, afterData: { method: delivery.method, status: "opened" }, entityId: delivery.id, entityType: "checkin_delivery", metadata: { checkinInstanceId }, practiceId });
}

export async function markLatestCheckinDeliveryCompleted(
  supabase: ServerSupabaseClient,
  checkinInstanceId: string,
  practiceId: string,
): Promise<void> {
  const { data: delivery } = await supabase
    .from("checkin_deliveries")
    .select("*")
    .eq("practice_id", practiceId)
    .eq("checkin_instance_id", checkinInstanceId)
    .in("status", ["pending", "delivered", "opened"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!delivery) return;
  const completedAt = new Date().toISOString();
  const { data: saved } = await supabase.from("checkin_deliveries").update({ completed_at: completedAt, status: "completed" }).eq("id", delivery.id).in("status", ["pending", "delivered", "opened"]).select("id").maybeSingle();
  if (!saved) return;
  await recordAuditEvent(supabase, { action: "checkin.delivery_completed", actorUserId: null, afterData: { method: delivery.method, status: "completed" }, entityId: delivery.id, entityType: "checkin_delivery", metadata: { checkinInstanceId, coordinatorWorklistStatus: "responded" }, practiceId });
}
