import type Stripe from "stripe";

export class StripeWebhookSignatureError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "StripeWebhookSignatureError";
  }
}
type StripeEventVerifier = (
  payload: string,
  signature: string,
  secret: string,
) => Stripe.Event;

export function constructStripeWebhookEvent(
  payload: string,
  signature: string | null,
  webhookSecret: string,
  verify: StripeEventVerifier,
): Stripe.Event {
  if (!signature) {
    throw new StripeWebhookSignatureError("Stripe-Signature header is required");
  }

  try {
    return verify(payload, signature, webhookSecret);
  } catch {
    throw new StripeWebhookSignatureError("Stripe webhook signature is invalid");
  }
}
