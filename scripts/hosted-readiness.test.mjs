import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  HOSTED_ENVIRONMENT_VARIABLES,
  validateHostedEnvironment,
} from "./validate-hosted-environment.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const validEnvironment = {
  NEXT_PUBLIC_APP_URL: "https://ccm.example.com",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-test-key",
};

test("hosted environment gate rejects missing, local, and shared credentials", () => {
  assert.equal(HOSTED_ENVIRONMENT_VARIABLES.required.length, 4);
  assert.deepEqual(validateHostedEnvironment(validEnvironment), []);
  assert.match(validateHostedEnvironment({})[0], /required/);
  assert.match(
    validateHostedEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }).join(" "),
    /HTTPS|local hostname/,
  );
  assert.match(
    validateHostedEnvironment({
      ...validEnvironment,
      SUPABASE_SERVICE_ROLE_KEY: "public-test-key",
    }).join(" "),
    /must differ/,
  );
});

test("migrations 006 through 023 are ordered and non-empty", async () => {
  const names = (await readdir(resolve(root, "supabase/migrations")))
    .filter((name) => /^(00[6-9]|01[0-9]|02[0-3])_/.test(name))
    .sort();
  assert.deepEqual(
    names.map((name) => name.slice(0, 3)),
    ["006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023"],
  );
  for (const name of names) {
    assert.ok((await readFile(resolve(root, "supabase/migrations", name), "utf8")).trim());
  }
});

test("customization grants reach RLS without mutable-history privileges", async () => {
  const migration = await readFile(
    resolve(root, "supabase/migrations/023_question_bank_customization_grants.sql"),
    "utf8",
  );

  assert.match(migration, /grant select, insert on table public\.question_bank_override_versions to authenticated/i);
  assert.match(migration, /grant select, insert on table public\.question_bank_custom_question_versions to authenticated/i);
  assert.match(migration, /grant select, insert on table public\.question_bank_favorite_versions to authenticated/i);
  assert.match(migration, /grant select, insert, update on table public\.question_contribution_candidates to authenticated/i);
  assert.doesNotMatch(migration, /grant[^;]*(delete|truncate)/i);
  assert.doesNotMatch(migration, /grant[^;]*update[^;]*question_bank_(override|custom_question|favorite)_versions/i);
});

test("hosted hardening enforces AAL2, expiring tokens, and practice references", async () => {
  const migration = await readFile(
    resolve(root, "supabase/migrations/016_hosted_production_hardening.sql"),
    "utf8",
  );
  assert.match(migration, /auth\.jwt\(\) ->> 'aal'\) = 'aal2'/);
  assert.match(migration, /token_expires_at/);
  assert.match(migration, /foreign key \(practice_id, provider_id\)/);
  assert.match(migration, /foreign key \(practice_id, patient_id\)/);

  const auth = await readFile(resolve(root, "lib/auth.ts"), "utf8");
  assert.match(auth, /getAuthenticatorAssuranceLevel/);
  assert.match(auth, /currentLevel !== "aal2"/);

  const publicRoute = await readFile(
    resolve(root, "app/api/check-ins/public/[token]/route.ts"),
    "utf8",
  );
  const submitRoute = await readFile(
    resolve(root, "app/api/check-ins/public/[token]/submit/route.ts"),
    "utf8",
  );
  const sessionStore = await readFile(
    resolve(root, "lib/ccm/session-store.ts"),
    "utf8",
  );
  assert.match(publicRoute, /token_expires_at/);
  assert.match(publicRoute, /Cache-Control/);
  assert.match(submitRoute, /token_expires_at/);
  assert.match(submitRoute, /token: null/);
  assert.match(sessionStore, /token: null, token_expires_at: null/);
  assert.doesNotMatch(submitRoute, /publicToken/);
  assert.doesNotMatch(publicRoute, /questionsError\.message/);
  assert.doesNotMatch(submitRoute, /insertError\.message|updateError\.message|responseError\.message/);
});

test("audit serialization removes public bearer tokens recursively", async () => {
  const { sanitizeAuditValue } = await import("../lib/ccm/audit.ts");
  assert.deepEqual(
    sanitizeAuditValue({
      nested: { publicToken: "secret-2", safe: true },
      safe: "value",
      token: "secret-1",
    }),
    { nested: { safe: true }, safe: "value" },
  );
});
