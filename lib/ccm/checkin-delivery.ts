import type { CheckinDelivery, CheckinDeliveryStatus } from "./types";

export const CHECKIN_DELIVERY_METHODS = ["email", "sms", "link"] as const;
export type CheckinDeliveryMethod = (typeof CHECKIN_DELIVERY_METHODS)[number];

export function checkinDeliveryMethod(value: unknown): CheckinDeliveryMethod {
  if (typeof value !== "string" || !CHECKIN_DELIVERY_METHODS.includes(value as CheckinDeliveryMethod)) {
    throw new Error("Delivery method must be email, SMS, or link");
  }
  return value as CheckinDeliveryMethod;
}

export function effectiveDeliveryStatus(
  delivery: Pick<CheckinDelivery, "status" | "token_expires_at">,
  now = new Date(),
): CheckinDeliveryStatus {
  if (
    ["pending", "delivered", "opened"].includes(delivery.status)
    && new Date(delivery.token_expires_at).getTime() <= now.getTime()
  ) return "expired";
  return delivery.status;
}

export function maskDeliveryDestination(method: CheckinDeliveryMethod, destination?: string | null): string | null {
  if (!destination || method === "link") return null;
  if (method === "email") {
    const [local, domain] = destination.trim().split("@");
    if (!local || !domain) throw new Error("Patient email is invalid");
    return `${local.slice(0, 1)}***@${domain}`;
  }
  const digits = destination.replace(/\D/g, "");
  if (digits.length < 4) throw new Error("Patient phone number is invalid");
  return `***-***-${digits.slice(-4)}`;
}

export function deliveryCanBeResent(delivery: Pick<CheckinDelivery, "status" | "token_expires_at">, now = new Date()): boolean {
  return ["pending", "delivered", "opened", "failed"].includes(effectiveDeliveryStatus(delivery, now));
}

export function genericCheckinEmail(practiceName: string, actionUrl: string) {
  return {
    html: `<p>${escapeHtml(practiceName)} has sent you a secure monthly check-in.</p><p><a href="${escapeHtml(actionUrl)}">Open secure check-in</a></p><p>This link expires automatically. Do not forward it.</p>`,
    subject: `Secure monthly check-in from ${practiceName}`,
    text: `${practiceName} has sent you a secure monthly check-in.\n\nOpen it here: ${actionUrl}\n\nThis link expires automatically. Do not forward it.`,
  };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
