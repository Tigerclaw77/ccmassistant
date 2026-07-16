import Stripe from "stripe";
import { assertStripeSandboxSecretKey, loadStripeServerConfig } from "./config.ts";

let cachedClient: Stripe | null = null;
let cachedSecretKey: string | null = null;

export function createStripeClient(secretKey: string): Stripe {
  const sandboxKey = assertStripeSandboxSecretKey(secretKey);
  return new Stripe(sandboxKey, {
    appInfo: {
      name: "CCM Assistant",
      version: "0.1.0",
    },
    maxNetworkRetries: 2,
  });
}

export function getStripeClient(): Stripe {
  const { secretKey } = loadStripeServerConfig();
  if (!cachedClient || cachedSecretKey !== secretKey) {
    cachedClient = createStripeClient(secretKey);
    cachedSecretKey = secretKey;
  }
  return cachedClient;
}
