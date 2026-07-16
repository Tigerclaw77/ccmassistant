import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import Stripe from "stripe";
import { assertStripeSandboxSecretKey } from "../lib/stripe/config.ts";
import { assertSafeStripeMetadata } from "../lib/stripe/metadata.ts";

const COMPONENTS = {
  patient: {
    amountArgument: "--patient-amount",
    amountEnvironment: "STRIPE_PATIENT_AMOUNT_CENTS",
    catalogKey: "ccm-assistant-patient-management",
    name: "CCM Assistant Patient Management",
  },
  platform: {
    amountArgument: "--platform-amount",
    amountEnvironment: "STRIPE_PLATFORM_AMOUNT_CENTS",
    catalogKey: "ccm-assistant-platform",
    name: "CCM Assistant Platform",
  },
};

const { loadEnvConfig } = nextEnv;

export function loadCatalogEnvironment(projectDirectory = process.cwd()) {
  loadEnvConfig(projectDirectory, process.env.NODE_ENV !== "production");
}

export function maskStripeSecretKey(secretKey) {
  if (secretKey.length < 14) return "[invalid Stripe key]";
  return `${secretKey.slice(0, 10)}...${secretKey.slice(-4)}`;
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : "Stripe catalog setup failed";
  return message.replace(/sk_(?:test|live)_[A-Za-z0-9_]+/g, maskStripeSecretKey);
}

function argumentValue(argumentsList, name) {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : undefined;
}

function optionalPositiveInteger(value, name) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer number of cents`);
  }
  return parsed;
}

export function parseCatalogOptions(argumentsList = process.argv.slice(2), environment = process.env) {
  const currency = (
    argumentValue(argumentsList, "--currency") ??
    environment.STRIPE_CURRENCY ??
    "usd"
  ).toLowerCase();
  const catalogVersion =
    argumentValue(argumentsList, "--catalog-version") ??
    environment.STRIPE_CATALOG_VERSION;

  if (!/^[a-z]{3}$/.test(currency)) throw new Error("currency must be a three-letter code");
  if (!catalogVersion || !/^[a-z0-9][a-z0-9_-]{0,31}$/i.test(catalogVersion)) {
    throw new Error("--catalog-version is required and must be a stable version label");
  }

  const patientAmount = optionalPositiveInteger(
    argumentValue(argumentsList, COMPONENTS.patient.amountArgument) ??
      environment[COMPONENTS.patient.amountEnvironment],
    COMPONENTS.patient.amountArgument,
  );
  const platformAmount = optionalPositiveInteger(
    argumentValue(argumentsList, COMPONENTS.platform.amountArgument) ??
      environment[COMPONENTS.platform.amountEnvironment],
    COMPONENTS.platform.amountArgument,
  );
  if (!patientAmount && !platformAmount) {
    throw new Error("Provide --patient-amount and/or --platform-amount after pricing approval");
  }

  return { catalogVersion, currency, patientAmount, platformAmount };
}

async function listAllProducts(stripe) {
  const products = [];
  let startingAfter;
  do {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return products;
}

export async function ensureProduct(stripe, component, catalogVersion) {
  const metadata = assertSafeStripeMetadata({
    catalog_key: component.catalogKey,
    catalog_version: catalogVersion,
    component: component.catalogKey,
  });
  const matches = (await listAllProducts(stripe)).filter(
    (product) => product.metadata?.catalog_key === component.catalogKey,
  );
  if (matches.length > 1) {
    throw new Error(`Duplicate Stripe products found for ${component.catalogKey}`);
  }
  if (matches[0]) return matches[0];

  return stripe.products.create(
    { metadata, name: component.name },
    { idempotencyKey: `ccm-assistant:product:${component.catalogKey}` },
  );
}

export async function ensurePrice(
  stripe,
  { amount, catalogVersion, component, currency, productId },
) {
  const lookupKey = `${component.catalogKey}-monthly-${catalogVersion}`;
  const existing = await stripe.prices.list({ active: true, limit: 100, lookup_keys: [lookupKey] });
  if (existing.data.length > 1) throw new Error(`Duplicate Stripe prices found for ${lookupKey}`);

  const price = existing.data[0];
  if (price) {
    const existingProductId = typeof price.product === "string" ? price.product : price.product.id;
    if (
      existingProductId !== productId ||
      price.currency !== currency ||
      price.unit_amount !== amount ||
      price.recurring?.interval !== "month"
    ) {
      throw new Error(
        `Price ${lookupKey} exists with different terms; use a new --catalog-version`,
      );
    }
    return price;
  }

  return stripe.prices.create(
    {
      currency,
      lookup_key: lookupKey,
      metadata: assertSafeStripeMetadata({
        catalog_key: lookupKey,
        catalog_version: catalogVersion,
        component: component.catalogKey,
      }),
      product: productId,
      recurring: { interval: "month", usage_type: "licensed" },
      unit_amount: amount,
    },
    { idempotencyKey: `ccm-assistant:price:${lookupKey}:${currency}:${amount}` },
  );
}

export async function setupStripeSandboxCatalog(stripe, options) {
  const result = {};
  for (const [key, component] of Object.entries(COMPONENTS)) {
    const amount = key === "patient" ? options.patientAmount : options.platformAmount;
    if (!amount) continue;
    const product = await ensureProduct(stripe, component, options.catalogVersion);
    const price = await ensurePrice(stripe, {
      amount,
      catalogVersion: options.catalogVersion,
      component,
      currency: options.currency,
      productId: product.id,
    });
    result[key] = { priceId: price.id, productId: product.id };
  }
  return result;
}

async function main() {
  loadCatalogEnvironment();
  const secretKey = assertStripeSandboxSecretKey(process.env.STRIPE_SECRET_KEY);
  console.log(`Stripe test key: ${maskStripeSecretKey(secretKey)}`);
  const options = parseCatalogOptions();
  const stripe = new Stripe(secretKey, { maxNetworkRetries: 2 });
  const result = await setupStripeSandboxCatalog(stripe, options);
  console.log(JSON.stringify({ catalogVersion: options.catalogVersion, currency: options.currency, ...result }, null, 2));
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(safeErrorMessage(error));
    process.exitCode = 1;
  });
}
