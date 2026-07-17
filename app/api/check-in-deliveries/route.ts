import { randomUUID } from "crypto";
import {
  authErrorResponse,
  createServiceRoleSupabaseClient,
  PATIENT_WRITE_ROLES,
  requirePracticeMembership,
} from "../../../lib/auth";
import { badRequest, readJsonObject, requiredString } from "../../../lib/api/json";
import { recordAuditEvent } from "../../../lib/ccm/audit";
import {
  checkinDeliveryMethod,
  deliveryCanBeResent,
  effectiveDeliveryStatus,
  genericCheckinEmail,
  maskDeliveryDestination,
} from "../../../lib/ccm/checkin-delivery";
import { publicCheckinTokenExpiresAt } from "../../../lib/ccm/public-checkin";
import type { CheckinDelivery } from "../../../lib/ccm/types";
import { sendEmailWithResend } from "../../../lib/email/resend";

const ACTIONS = ["send", "resend", "regenerate"] as const;
type DeliveryAction = (typeof ACTIONS)[number];

function deliveryAction(value: unknown): DeliveryAction {
  if (typeof value !== "string" || !ACTIONS.includes(value as DeliveryAction)) throw new Error("Unsupported delivery action");
  return value as DeliveryAction;
}

function publicCheckinUrl(token: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!origin) throw new Error("NEXT_PUBLIC_APP_URL is required for patient delivery");
  return `${origin}/f/${token}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId");
  const checkinInstanceId = searchParams.get("checkinInstanceId");
  if (!practiceId || !checkinInstanceId) return badRequest(new Error("practiceId and checkinInstanceId are required"));
  try {
    await requirePracticeMembership(request, practiceId);
    const service = createServiceRoleSupabaseClient();
    const { data: checkIn } = await service.from("checkin_instances").select("id").eq("practice_id", practiceId).eq("id", checkinInstanceId).maybeSingle();
    if (!checkIn) return Response.json({ error: "Check-in not found" }, { status: 404 });
    const { data = [], error } = await service.from("checkin_deliveries").select("*").eq("practice_id", practiceId).eq("checkin_instance_id", checkinInstanceId).order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const now = new Date();
    const deliveries = data ?? [];
    const expiredIds = deliveries.filter((delivery) => effectiveDeliveryStatus(delivery, now) === "expired" && delivery.status !== "expired").map((delivery) => delivery.id);
    if (expiredIds.length) await service.from("checkin_deliveries").update({ expired_at: now.toISOString(), status: "expired" }).eq("practice_id", practiceId).in("id", expiredIds);
    return Response.json({ deliveries: deliveries.map((delivery) => expiredIds.includes(delivery.id) ? { ...delivery, expired_at: now.toISOString(), status: "expired" } : delivery) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body;
  try { body = await readJsonObject(request); } catch (error) { return badRequest(error); }
  let practiceId: string;
  let checkinInstanceId: string;
  let action: DeliveryAction;
  let method: ReturnType<typeof checkinDeliveryMethod>;
  let requestKey: string;
  try {
    practiceId = requiredString(body, "practiceId");
    checkinInstanceId = requiredString(body, "checkinInstanceId");
    action = deliveryAction(body.action);
    method = checkinDeliveryMethod(body.method);
    requestKey = requiredString(body, "requestKey");
  } catch (error) { return badRequest(error); }

  try {
    const { user } = await requirePracticeMembership(request, practiceId, PATIENT_WRITE_ROLES);
    if (method === "sms") return Response.json({ error: "SMS delivery is not configured. Use email or a secure link." }, { status: 501 });
    const service = createServiceRoleSupabaseClient();
    const { data: priorRequest } = await service.from("checkin_deliveries").select("*").eq("practice_id", practiceId).eq("request_key", requestKey).maybeSingle();
    if (priorRequest) return Response.json({ delivery: priorRequest, duplicate: true });

    const { data: checkIn } = await service.from("checkin_instances").select("*").eq("practice_id", practiceId).eq("id", checkinInstanceId).maybeSingle();
    if (!checkIn) return Response.json({ error: "Check-in not found" }, { status: 404 });
    if (["responded", "closed"].includes(checkIn.status)) return Response.json({ error: "Completed or closed check-ins cannot be sent" }, { status: 409 });
    const [{ data: patient }, { data: practice }, { data: prior = [] }] = await Promise.all([
      service.from("patients").select("id, email, phone").eq("practice_id", practiceId).eq("id", checkIn.patient_id).maybeSingle(),
      service.from("practices").select("id, name").eq("id", practiceId).maybeSingle(),
      service.from("checkin_deliveries").select("*").eq("practice_id", practiceId).eq("checkin_instance_id", checkIn.id).order("attempt_number", { ascending: false }),
    ]);
    if (!patient || !practice) return Response.json({ error: "Patient or practice not found" }, { status: 404 });
    const priorDeliveries = prior ?? [];
    const latest = priorDeliveries[0] as CheckinDelivery | undefined;
    if (action === "resend" && (!latest || !checkIn.token || !checkIn.token_expires_at || !deliveryCanBeResent(latest))) {
      return Response.json({ error: "The secure link expired. Regenerate it before sending again." }, { status: 409 });
    }

    const destination = method === "email" ? patient.email : null;
    if (method === "email" && !destination) return Response.json({ error: "The patient does not have an email address" }, { status: 409 });
    const now = new Date();
    const rotateToken = action !== "resend" || !checkIn.token || !checkIn.token_expires_at;
    const token: string = rotateToken ? randomUUID().replaceAll("-", "") : checkIn.token!;
    const expiresAt: string = rotateToken ? publicCheckinTokenExpiresAt(now) : checkIn.token_expires_at!;
    const attemptNumber = (latest?.attempt_number ?? 0) + 1;
    const { data: inserted, error: insertError } = await service.from("checkin_deliveries").insert({
      attempt_number: attemptNumber,
      checkin_instance_id: checkIn.id,
      created_by: user.id,
      destination_masked: maskDeliveryDestination(method, destination),
      method,
      patient_id: checkIn.patient_id,
      practice_id: practiceId,
      request_key: requestKey,
      status: "pending",
      token_expires_at: expiresAt,
    }).select().single();
    if (insertError || !inserted) {
      const { data: duplicate } = await service.from("checkin_deliveries").select("*").eq("practice_id", practiceId).eq("request_key", requestKey).maybeSingle();
      if (duplicate) return Response.json({ delivery: duplicate, duplicate: true });
      return Response.json({ error: insertError?.message ?? "Unable to create delivery" }, { status: 500 });
    }

    if (action === "regenerate") {
      const activeIds = priorDeliveries.filter((delivery) => ["pending", "delivered", "opened", "failed"].includes(delivery.status)).map((delivery) => delivery.id);
      if (activeIds.length) await service.from("checkin_deliveries").update({ expired_at: now.toISOString(), status: "expired" }).eq("practice_id", practiceId).in("id", activeIds);
    }
    const { error: tokenError } = await service.from("checkin_instances").update({ sent_at: now.toISOString(), status: "sent", token, token_expires_at: expiresAt, updated_by: user.id }).eq("practice_id", practiceId).eq("id", checkIn.id);
    if (tokenError) {
      await service.from("checkin_deliveries").update({ failure_code: "token_update_failed", status: "failed" }).eq("id", inserted.id);
      return Response.json({ error: "Unable to activate the secure link" }, { status: 500 });
    }

    let delivery = inserted;
    try {
      if (method === "email") {
        const from = process.env.PATIENT_EMAIL_FROM;
        if (!from) throw new Error("Patient email delivery is not configured");
        const email = genericCheckinEmail(practice.name, publicCheckinUrl(token));
        const sent = await sendEmailWithResend({ ...email, from, idempotencyKey: `checkin-${inserted.id}`, to: destination! });
        const { data: saved } = await service.from("checkin_deliveries").update({ delivered_at: now.toISOString(), provider_message_id: sent.id, status: "delivered" }).eq("id", inserted.id).select().single();
        if (saved) delivery = saved;
      } else {
        const { data: saved } = await service.from("checkin_deliveries").update({ delivered_at: now.toISOString(), status: "delivered" }).eq("id", inserted.id).select().single();
        if (saved) delivery = saved;
      }
    } catch (error) {
      await service.from("checkin_deliveries").update({ failure_code: "provider_delivery_failed", status: "failed" }).eq("id", inserted.id);
      await recordAuditEvent(service, { action: "checkin.delivery_failed", actorUserId: user.id, afterData: { attemptNumber, method, status: "failed" }, entityId: inserted.id, entityType: "checkin_delivery", practiceId });
      return Response.json({ error: error instanceof Error ? error.message : "Patient delivery failed" }, { status: 503 });
    }
    await recordAuditEvent(service, { action: `checkin.delivery_${action}`, actorUserId: user.id, afterData: { attemptNumber, destinationMasked: delivery.destination_masked, method, status: delivery.status }, entityId: delivery.id, entityType: "checkin_delivery", metadata: { checkinInstanceId: checkIn.id }, practiceId });
    return Response.json({ delivery, publicUrl: method === "link" ? publicCheckinUrl(token) : undefined }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
