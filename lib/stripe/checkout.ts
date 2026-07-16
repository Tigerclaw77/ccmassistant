import type Stripe from "stripe";
import type { StripeServerConfig } from "./config";
import { assertSafeStripeMetadata, practiceStripeMetadata } from "./metadata.ts";

type CheckoutConfig = Pick<
  StripeServerConfig,
  "appUrl" | "patientPriceId" | "platformPriceId"
>;

type CheckoutInput = {
  config: CheckoutConfig;
  customerId: string;
  patientCount: number;
  practiceId: string;
};

export function buildPracticeCheckoutSession(
  input: CheckoutInput,
): Stripe.Checkout.SessionCreateParams {
  const { config, customerId, patientCount, practiceId } = input;
  if (!Number.isSafeInteger(patientCount) || patientCount < 0) {
    throw new Error("Server-derived patient count must be a non-negative integer");
  }

  const metadata = practiceStripeMetadata(practiceId);
  const common = {
    cancel_url: `${config.appUrl}/settings?billing=cancelled`,
    client_reference_id: practiceId,
    customer: customerId,
    metadata,
    success_url: `${config.appUrl}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
  } as const;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (config.platformPriceId) {
    lineItems.push({ price: config.platformPriceId, quantity: 1 });
  }
  if (config.patientPriceId && patientCount > 0) {
    lineItems.push({ price: config.patientPriceId, quantity: patientCount });
  }

  if (lineItems.length === 0) {
    return {
      ...common,
      mode: "setup",
      payment_method_types: ["card"],
      setup_intent_data: { metadata },
    };
  }

  const subscriptionMetadata = assertSafeStripeMetadata({
    ...metadata,
    ...(config.patientPriceId ? { patient_price_id: config.patientPriceId } : {}),
    ...(config.platformPriceId ? { platform_price_id: config.platformPriceId } : {}),
  });
  return {
    ...common,
    line_items: lineItems,
    mode: "subscription",
    subscription_data: { metadata: subscriptionMetadata },
  };
}
