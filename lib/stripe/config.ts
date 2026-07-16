export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigurationError";
  }
}

export type StripeEnvironment = Record<string, string | undefined>;

export type StripeServerConfig = {
  appUrl: string | null;
  patientPriceId: string | null;
  platformPriceId: string | null;
  publishableKey: string | null;
  secretKey: string;
  webhookSecret: string | null;
};

type StripeConfigRequirements = {
  appUrl?: boolean;
  prices?: boolean;
  webhook?: boolean;
};

function optionalValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function assertStripeSandboxSecretKey(secretKey: string | null | undefined): string {
  const normalized = optionalValue(secretKey ?? undefined);
  if (!normalized) {
    throw new StripeConfigurationError("STRIPE_SECRET_KEY is required");
  }
  if (normalized.startsWith("sk_live_")) {
    throw new StripeConfigurationError("Live Stripe secret keys are forbidden");
  }
  if (!normalized.startsWith("sk_test_")) {
    throw new StripeConfigurationError("STRIPE_SECRET_KEY must be a Stripe test secret key");
  }
  return normalized;
}

function validateOptionalKey(value: string | null, prefix: string, name: string): string | null {
  if (value && !value.startsWith(prefix)) {
    throw new StripeConfigurationError(`${name} must start with ${prefix}`);
  }
  return value;
}

function validateAppUrl(value: string | null, required: boolean): string | null {
  if (!value) {
    if (required) throw new StripeConfigurationError("NEXT_PUBLIC_APP_URL is required");
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new StripeConfigurationError("NEXT_PUBLIC_APP_URL must be an absolute URL");
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new StripeConfigurationError("NEXT_PUBLIC_APP_URL must use HTTPS outside local development");
  }

  return url.origin;
}

export function loadStripeServerConfig(
  environment: StripeEnvironment = process.env,
  requirements: StripeConfigRequirements = {},
): StripeServerConfig {
  const platformPriceId = validateOptionalKey(
    optionalValue(environment.STRIPE_PLATFORM_PRICE_ID),
    "price_",
    "STRIPE_PLATFORM_PRICE_ID",
  );
  const patientPriceId = validateOptionalKey(
    optionalValue(environment.STRIPE_PATIENT_PRICE_ID),
    "price_",
    "STRIPE_PATIENT_PRICE_ID",
  );
  const webhookSecret = validateOptionalKey(
    optionalValue(environment.STRIPE_WEBHOOK_SECRET),
    "whsec_",
    "STRIPE_WEBHOOK_SECRET",
  );
  const publishableKey = validateOptionalKey(
    optionalValue(environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    "pk_test_",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  );

  if (requirements.prices && !platformPriceId && !patientPriceId) {
    throw new StripeConfigurationError(
      "At least one Stripe recurring price ID is required",
    );
  }
  if (requirements.webhook && !webhookSecret) {
    throw new StripeConfigurationError("STRIPE_WEBHOOK_SECRET is required");
  }

  return {
    appUrl: validateAppUrl(optionalValue(environment.NEXT_PUBLIC_APP_URL), Boolean(requirements.appUrl)),
    patientPriceId,
    platformPriceId,
    publishableKey,
    secretKey: assertStripeSandboxSecretKey(environment.STRIPE_SECRET_KEY),
    webhookSecret,
  };
}
