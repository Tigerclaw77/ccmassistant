import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

function validateLocalEnvironment(environment) {
  const errors = [];
  const warnings = [];

  for (const name of required) {
    if (!environment[name]?.trim()) errors.push(`${name} is required`);
  }

  if (environment.NEXT_PUBLIC_SUPABASE_ANON_KEY === environment.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("Supabase anon and service-role keys must differ");
  }

  if (environment.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(environment.NEXT_PUBLIC_APP_URL);
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
        warnings.push("NEXT_PUBLIC_APP_URL is hosted; local auth and callback links will return to that origin");
      }
      if (url.origin !== environment.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) {
        errors.push("NEXT_PUBLIC_APP_URL must be an origin without a path, query, or fragment");
      }
    } catch {
      errors.push("NEXT_PUBLIC_APP_URL must be a valid absolute URL");
    }
  }

  const stripeSecret = environment.STRIPE_SECRET_KEY?.trim();
  if (stripeSecret && !stripeSecret.startsWith("sk_test_")) {
    errors.push("STRIPE_SECRET_KEY must be a Stripe test-mode key in local development");
  }

  const stripePublishable = environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (stripePublishable && !stripePublishable.startsWith("pk_test_")) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe test-mode key in local development");
  }

  return { errors, warnings };
}

const { errors, warnings } = validateLocalEnvironment(process.env);
for (const warning of warnings) console.warn(`Local environment warning: ${warning}`);
if (errors.length) {
  console.error("Local environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Local environment validation passed for ${required.length} required variables.`);
}
