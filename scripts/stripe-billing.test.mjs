import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getOrCreateStripeCustomer,
  processStripeWebhookEvent,
} from "../lib/stripe/billing.ts";
import { buildPracticeCheckoutSession } from "../lib/stripe/checkout.ts";
import { assertStripeSandboxSecretKey } from "../lib/stripe/config.ts";
import { assertSafeStripeMetadata } from "../lib/stripe/metadata.ts";
import { assertPracticeBillingScope } from "../lib/stripe/scope.ts";
import { constructStripeWebhookEvent } from "../lib/stripe/webhook.ts";
import {
  maskStripeSecretKey,
  parseCatalogOptions,
  setupStripeSandboxCatalog,
} from "./setup-stripe-sandbox.mjs";

const PRACTICE_ID = "11111111-1111-4111-8111-111111111111";

function account(customerId = null) {
  return {
    active_price_ids: [],
    cancel_at_period_end: false,
    created_at: "2026-07-15T00:00:00.000Z",
    current_patient_quantity: 0,
    current_period_end: null,
    practice_id: PRACTICE_ID,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    subscription_status: null,
    updated_at: "2026-07-15T00:00:00.000Z",
  };
}

test("Checkout and Portal routes require canonical owner/admin authorization", async () => {
  const [checkout, checkoutBuilder, portal, settings] = await Promise.all([
    readFile(new URL("../app/api/stripe/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/stripe/checkout.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stripe/portal/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/settings/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /requirePracticeBillingAdmin\(request, practiceId\)/);
  assert.match(portal, /requirePracticeBillingAdmin\(request, practiceId\)/);
  assert.match(checkoutBuilder, /practiceStripeMetadata\(practiceId\)/);
  assert.match(settings, /fetch\(`\/api\/stripe\/\$\{destination\}`/);
  assert.match(settings, /JSON\.stringify\(\{ practiceId \}\)/);
  assert.match(checkout, /\.eq\("status", "active"\)/);
  assert.doesNotMatch(checkout, /body[^\n]+quantity|requiredString\(body, "quantity"\)/);
  assert.doesNotMatch(checkout, /patient_name|date_of_birth|diagnosis|icd_code|patient_email|patient_phone/i);
});

test("zero-patient Checkout collects a payment method without a charge or subscription", () => {
  const session = buildPracticeCheckoutSession({
    config: {
      appUrl: "http://localhost:3000",
      patientPriceId: "price_patient",
      platformPriceId: null,
    },
    customerId: "cus_test",
    patientCount: 0,
    practiceId: PRACTICE_ID,
  });
  assert.equal(session.mode, "setup");
  assert.equal(session.customer, "cus_test");
  assert.equal(session.line_items, undefined);
  assert.equal(session.subscription_data, undefined);
  assert.deepEqual(session.payment_method_types, ["card"]);
});

test("positive Checkout quantity is server-derived and not customer-adjustable", () => {
  const session = buildPracticeCheckoutSession({
    config: {
      appUrl: "http://localhost:3000",
      patientPriceId: "price_patient",
      platformPriceId: null,
    },
    customerId: "cus_test",
    patientCount: 3,
    practiceId: PRACTICE_ID,
  });
  assert.equal(session.mode, "subscription");
  assert.deepEqual(session.line_items, [{ price: "price_patient", quantity: 3 }]);
  assert.equal(session.line_items[0].adjustable_quantity, undefined);
});

test("cross-practice commercial billing scope is denied", async () => {
  assert.doesNotThrow(() => assertPracticeBillingScope(PRACTICE_ID, PRACTICE_ID));
  assert.throws(
    () => assertPracticeBillingScope(PRACTICE_ID, "22222222-2222-4222-8222-222222222222"),
    /Cross-practice billing access is forbidden/,
  );
  const source = await readFile(new URL("../lib/stripe/authorization.ts", import.meta.url), "utf8");
  assert.match(source, /PRACTICE_ADMIN_ROLES/);
  assert.match(source, /PracticeAuthorizationError\(error.status, error.message\)/);
});

test("webhook signatures are required and invalid signatures are rejected", () => {
  assert.throws(
    () => constructStripeWebhookEvent("{}", null, "whsec_test", () => ({})),
    /Stripe-Signature header is required/,
  );
  assert.throws(
    () => constructStripeWebhookEvent("{}", "bad", "whsec_test", () => { throw new Error("bad"); }),
    /signature is invalid/,
  );
});

test("webhook event processing is idempotent", async () => {
  let completed = 0;
  let subscriptionWrites = 0;
  const claimed = new Set();
  const store = {
    async claimEvent(event) {
      if (claimed.has(event.id)) return "duplicate";
      claimed.add(event.id);
      return "claimed";
    },
    async completeEvent() { completed += 1; },
    async failEvent() {},
    async getAccount() { return null; },
    async saveCustomer() {},
    async saveSubscription() { subscriptionWrites += 1; },
  };
  const subscription = {
    cancel_at_period_end: false,
    customer: "cus_test",
    id: "sub_test",
    items: { data: [{ current_period_end: 1784073600, price: { id: "price_patient" }, quantity: 3 }] },
    metadata: { patient_price_id: "price_patient", practice_id: PRACTICE_ID },
    status: "active",
  };
  const event = {
    data: { object: subscription },
    id: "evt_once",
    livemode: false,
    type: "customer.subscription.updated",
  };
  const stripe = { subscriptions: { retrieve: async () => subscription } };

  assert.equal(await processStripeWebhookEvent(event, stripe, store), "claimed");
  assert.equal(await processStripeWebhookEvent(event, stripe, store), "duplicate");
  assert.equal(subscriptionWrites, 1);
  assert.equal(completed, 1);
});

test("setup Checkout webhook persists the customer without creating a subscription", async () => {
  let savedCustomer = null;
  let subscriptionWrites = 0;
  const store = {
    async claimEvent() { return "claimed"; },
    async completeEvent() {},
    async failEvent() {},
    async getAccount() { return null; },
    async saveCustomer(practiceId, customerId) { savedCustomer = { customerId, practiceId }; },
    async saveSubscription() { subscriptionWrites += 1; },
  };
  const event = {
    data: {
      object: {
        customer: "cus_setup",
        metadata: { practice_id: PRACTICE_ID },
        mode: "setup",
      },
    },
    id: "evt_setup",
    livemode: false,
    type: "checkout.session.completed",
  };
  const stripe = { subscriptions: { retrieve: async () => { throw new Error("not used"); } } };

  assert.equal(await processStripeWebhookEvent(event, stripe, store), "claimed");
  assert.deepEqual(savedCustomer, { customerId: "cus_setup", practiceId: PRACTICE_ID });
  assert.equal(subscriptionWrites, 0);
});

test("one Stripe customer is reused per practice", async () => {
  let createCalls = 0;
  const stripe = {
    customers: {
      async create() {
        createCalls += 1;
        return { id: "cus_new" };
      },
    },
  };
  const existingStore = {
    async getAccount() { return account("cus_existing"); },
    async saveCustomer() { throw new Error("should not save"); },
  };
  assert.equal(await getOrCreateStripeCustomer(stripe, existingStore, PRACTICE_ID), "cus_existing");
  assert.equal(createCalls, 0);

  let savedCustomer;
  const emptyStore = {
    async getAccount() { return account(); },
    async saveCustomer(_practiceId, customerId) { savedCustomer = customerId; },
  };
  assert.equal(await getOrCreateStripeCustomer(stripe, emptyStore, PRACTICE_ID), "cus_new");
  assert.equal(savedCustomer, "cus_new");
  assert.equal(createCalls, 1);
});

test("catalog setup refuses live mode and requires approved amount inputs", () => {
  assert.throws(() => assertStripeSandboxSecretKey("sk_live_forbidden"), /Live Stripe/);
  assert.equal(maskStripeSecretKey("sk_test_1234567890abcd"), "sk_test_12...abcd");
  assert.throws(
    () => parseCatalogOptions(["--catalog-version", "test-v1"], {}),
    /Provide --patient-amount/,
  );
  assert.deepEqual(
    parseCatalogOptions(["--patient-amount", "500", "--catalog-version", "test-v1"], {}),
    {
      catalogVersion: "test-v1",
      currency: "usd",
      patientAmount: 500,
      platformAmount: null,
    },
  );
});

test("catalog executable loads Next environment files before reading the Stripe key", async () => {
  const source = await readFile(
    new URL("./setup-stripe-sandbox.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /from "@next\/env"/);
  assert.match(source, /loadCatalogEnvironment\(\);\s*const secretKey/);
  assert.match(source, /Stripe test key:.*maskStripeSecretKey/);
  assert.doesNotMatch(source, /console\.log\(secretKey\)/);
});

test("catalog setup is idempotent for one version and amount", async () => {
  const products = [];
  const prices = [];
  let productCreates = 0;
  let priceCreates = 0;
  const stripe = {
    prices: {
      async create(input) {
        priceCreates += 1;
        const price = { id: `price_${priceCreates}`, ...input };
        prices.push(price);
        return price;
      },
      async list({ lookup_keys }) {
        return { data: prices.filter((price) => lookup_keys.includes(price.lookup_key)) };
      },
    },
    products: {
      async create(input) {
        productCreates += 1;
        const product = { id: `prod_${productCreates}`, ...input };
        products.push(product);
        return product;
      },
      async list() { return { data: products, has_more: false }; },
    },
  };
  const options = { catalogVersion: "test-v1", currency: "usd", patientAmount: 500, platformAmount: null };
  const first = await setupStripeSandboxCatalog(stripe, options);
  const second = await setupStripeSandboxCatalog(stripe, options);
  assert.deepEqual(second, first);
  assert.equal(productCreates, 1);
  assert.equal(priceCreates, 1);
});

test("PHI-like Stripe metadata is rejected", () => {
  assert.doesNotThrow(() => assertSafeStripeMetadata({ practice_id: PRACTICE_ID }));
  assert.doesNotThrow(() => assertSafeStripeMetadata({ patient_price_id: "price_test" }));
  assert.throws(
    () => assertSafeStripeMetadata({ patient_name: "Synthetic Person" }),
    /not permitted/,
  );
  assert.throws(
    () => assertSafeStripeMetadata({ catalog_key: "person@example.invalid" }),
    /PHI-like/,
  );
});

test("migration stores only minimal Stripe identifiers and event state", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/021_stripe_billing_foundation.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /practice_billing_accounts/);
  assert.match(migration, /stripe_event_id text primary key/);
  assert.doesNotMatch(migration, /payload|patient_id|email|phone|diagnos/i);
  assert.match(migration, /revoke all[^;]+authenticated/i);
});
