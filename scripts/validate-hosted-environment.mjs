import { pathToFileURL } from "node:url";

export const HOSTED_ENVIRONMENT_VARIABLES = {
  required: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ],
  optional: ["OPENAI_API_KEY", "OPENAI_MODEL"],
};

export function validateHostedEnvironment(environment) {
  const errors = [];

  for (const name of HOSTED_ENVIRONMENT_VARIABLES.required) {
    if (!environment[name]?.trim()) errors.push(`${name} is required`);
  }

  validateHttpsOrigin(
    "NEXT_PUBLIC_SUPABASE_URL",
    environment.NEXT_PUBLIC_SUPABASE_URL,
    errors,
  );
  validateHttpsOrigin(
    "NEXT_PUBLIC_APP_URL",
    environment.NEXT_PUBLIC_APP_URL,
    errors,
  );

  if (
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    environment.SUPABASE_SERVICE_ROLE_KEY &&
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY ===
      environment.SUPABASE_SERVICE_ROLE_KEY
  ) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must differ",
    );
  }

  return errors;
}

function validateHttpsOrigin(name, value, errors) {
  if (!value) return;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${name} must use HTTPS`);
    if (url.origin !== value.replace(/\/$/, "")) {
      errors.push(`${name} must be an origin without a path, query, or fragment`);
    }
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    ) {
      errors.push(`${name} must not use a local hostname`);
    }
  } catch {
    errors.push(`${name} must be a valid absolute URL`);
  }
}

function main() {
  const errors = validateHostedEnvironment(process.env);
  if (errors.length > 0) {
    console.error("Hosted environment validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Hosted environment validation passed for ${HOSTED_ENVIRONMENT_VARIABLES.required.length} required variables.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
