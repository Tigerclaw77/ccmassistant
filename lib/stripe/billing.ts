import type Stripe from "stripe";
import type { ServerSupabaseClient } from "../auth";
import type { PracticeBillingAccount } from "./types";
import { practiceStripeMetadata } from "./metadata.ts";

export type StripeEventClaim = "claimed" | "duplicate";

export type StripeSubscriptionState = {
  activePriceIds: string[];
  cancelAtPeriodEnd: boolean;
  currentPatientQuantity: number;
  currentPeriodEnd: string | null;
  practiceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
};

export interface StripeBillingStore {
  claimEvent(event: Pick<Stripe.Event, "id" | "livemode" | "type">): Promise<StripeEventClaim>;
  completeEvent(eventId: string): Promise<void>;
  failEvent(eventId: string, errorCode: string): Promise<void>;
  getAccount(practiceId: string): Promise<PracticeBillingAccount | null>;
  saveCustomer(practiceId: string, customerId: string): Promise<void>;
  saveSubscription(state: StripeSubscriptionState): Promise<void>;
}

function throwDatabaseError(message: string): never {
  throw new Error(`Stripe billing persistence failed: ${message}`);
}

export function createSupabaseStripeBillingStore(
  supabase: ServerSupabaseClient,
): StripeBillingStore {
  return {
    async claimEvent(event) {
      const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
        event_type: event.type,
        livemode: event.livemode,
        processing_status: "processing",
        stripe_event_id: event.id,
      });

      if (!insertError) return "claimed";
      if (insertError.code !== "23505") throwDatabaseError(insertError.message);

      const { data: existing, error: existingError } = await supabase
        .from("stripe_webhook_events")
        .select("*")
        .eq("stripe_event_id", event.id)
        .single();
      if (existingError || !existing) {
        throwDatabaseError(existingError?.message ?? "Webhook event claim was not found");
      }

      const staleProcessing =
        existing.processing_status === "processing" &&
        Date.now() - new Date(existing.updated_at).getTime() > 5 * 60 * 1000;
      if (existing.processing_status === "completed" || (!staleProcessing && existing.processing_status === "processing")) {
        return "duplicate";
      }

      const { error: retryError } = await supabase
        .from("stripe_webhook_events")
        .update({
          attempt_count: existing.attempt_count + 1,
          last_error_code: null,
          processing_status: "processing",
          processed_at: null,
        })
        .eq("stripe_event_id", event.id);
      if (retryError) throwDatabaseError(retryError.message);
      return "claimed";
    },

    async completeEvent(eventId) {
      const { error } = await supabase
        .from("stripe_webhook_events")
        .update({
          last_error_code: null,
          processed_at: new Date().toISOString(),
          processing_status: "completed",
        })
        .eq("stripe_event_id", eventId);
      if (error) throwDatabaseError(error.message);
    },

    async failEvent(eventId, errorCode) {
      const sanitizedCode = errorCode.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80) || "unknown";
      const { error } = await supabase
        .from("stripe_webhook_events")
        .update({
          last_error_code: sanitizedCode,
          processing_status: "failed",
        })
        .eq("stripe_event_id", eventId);
      if (error) throwDatabaseError(error.message);
    },

    async getAccount(practiceId) {
      const { data, error } = await supabase
        .from("practice_billing_accounts")
        .select("*")
        .eq("practice_id", practiceId)
        .maybeSingle();
      if (error) throwDatabaseError(error.message);
      return data;
    },

    async saveCustomer(practiceId, customerId) {
      const { error } = await supabase.from("practice_billing_accounts").upsert(
        {
          practice_id: practiceId,
          stripe_customer_id: customerId,
        },
        { onConflict: "practice_id" },
      );
      if (error) throwDatabaseError(error.message);
    },

    async saveSubscription(state) {
      const { error } = await supabase.from("practice_billing_accounts").upsert(
        {
          active_price_ids: state.activePriceIds,
          cancel_at_period_end: state.cancelAtPeriodEnd,
          current_patient_quantity: state.currentPatientQuantity,
          current_period_end: state.currentPeriodEnd,
          practice_id: state.practiceId,
          stripe_customer_id: state.stripeCustomerId,
          stripe_subscription_id: state.stripeSubscriptionId,
          subscription_status: state.subscriptionStatus,
        },
        { onConflict: "practice_id" },
      );
      if (error) throwDatabaseError(error.message);
    },
  };
}

type CustomerCreator = Pick<Stripe, "customers">;

export async function getOrCreateStripeCustomer(
  stripe: CustomerCreator,
  store: StripeBillingStore,
  practiceId: string,
): Promise<string> {
  const existing = await store.getAccount(practiceId);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create(
    { metadata: practiceStripeMetadata(practiceId) },
    { idempotencyKey: `ccm-assistant:practice-customer:${practiceId}` },
  );
  await store.saveCustomer(practiceId, customer.id);
  return customer.id;
}

function stripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === "string" ? customer : customer.id;
}

export function stripeSubscriptionState(
  subscription: Stripe.Subscription,
): StripeSubscriptionState {
  const practiceId = subscription.metadata.practice_id;
  practiceStripeMetadata(practiceId);

  const items = subscription.items.data;
  const activePriceIds = Array.from(new Set(items.map((item) => item.price.id))).sort();
  const patientPriceId = subscription.metadata.patient_price_id;
  const patientItem = patientPriceId
    ? items.find((item) => item.price.id === patientPriceId)
    : undefined;
  const periodEnds = items
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  return {
    activePriceIds,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPatientQuantity: patientItem?.quantity ?? 0,
    currentPeriodEnd: periodEnds.length
      ? new Date(Math.min(...periodEnds) * 1000).toISOString()
      : null,
    practiceId,
    stripeCustomerId: stripeCustomerId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
  };
}

type WebhookStripeClient = Pick<Stripe, "subscriptions">;

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  stripe: WebhookStripeClient,
  store: StripeBillingStore,
): Promise<StripeEventClaim> {
  if (event.livemode) throw new Error("Live-mode Stripe events are forbidden");

  const claim = await store.claimEvent(event);
  if (claim === "duplicate") return claim;

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await store.saveSubscription(
        stripeSubscriptionState(event.data.object as Stripe.Subscription),
      );
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "setup") {
        const practiceId = session.metadata?.practice_id;
        if (!practiceId) throw new Error("Setup Checkout session has no practice metadata");
        practiceStripeMetadata(practiceId);
        if (!session.customer) throw new Error("Setup Checkout session has no customer");
        await store.saveCustomer(
          practiceId,
          typeof session.customer === "string" ? session.customer : session.customer.id,
        );
      } else {
        if (!session.subscription) throw new Error("Checkout session has no subscription");
        const subscription =
          typeof session.subscription === "string"
            ? await stripe.subscriptions.retrieve(session.subscription)
            : session.subscription;
        await store.saveSubscription(stripeSubscriptionState(subscription));
      }
    }

    await store.completeEvent(event.id);
    return "claimed";
  } catch (error) {
    await store.failEvent(event.id, error instanceof Error ? error.name : "unknown");
    throw error;
  }
}
