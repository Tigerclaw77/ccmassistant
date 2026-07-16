import { createServiceRoleSupabaseClient } from "../../../../lib/auth";
import {
  createSupabaseStripeBillingStore,
  processStripeWebhookEvent,
} from "../../../../lib/stripe/billing";
import { getStripeClient } from "../../../../lib/stripe/client";
import {
  loadStripeServerConfig,
  StripeConfigurationError,
} from "../../../../lib/stripe/config";
import {
  constructStripeWebhookEvent,
  StripeWebhookSignatureError,
} from "../../../../lib/stripe/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const config = loadStripeServerConfig(process.env, { webhook: true });
    const stripe = getStripeClient();
    const payload = await request.text();
    const event = constructStripeWebhookEvent(
      payload,
      request.headers.get("stripe-signature"),
      config.webhookSecret!,
      (body, signature, secret) => stripe.webhooks.constructEvent(body, signature, secret),
    );
    const store = createSupabaseStripeBillingStore(createServiceRoleSupabaseClient());
    const claim = await processStripeWebhookEvent(event, stripe, store);
    return Response.json({ duplicate: claim === "duplicate", received: true });
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StripeConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    return Response.json({ error: "Stripe webhook processing failed" }, { status: 500 });
  }
}
