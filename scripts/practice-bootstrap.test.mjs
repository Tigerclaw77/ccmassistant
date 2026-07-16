import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  classifyPracticeAccess,
  hasInitialOwnerClaim,
} from "../lib/practice-bootstrap.ts";

test("an empty system routes an authenticated user to first-practice bootstrap", () => {
  assert.equal(
    classifyPracticeAccess({ membershipExists: false, practiceExists: false }),
    "bootstrap",
  );
});

test("an existing practice without membership is forbidden", () => {
  assert.equal(
    classifyPracticeAccess({ membershipExists: false, practiceExists: true }),
    "forbidden",
  );
});

test("an existing active membership permits normal application access", () => {
  assert.equal(
    classifyPracticeAccess({ membershipExists: true, practiceExists: true }),
    "member",
  );
});

test("only server-controlled owner metadata authorizes initial owner creation", () => {
  assert.equal(hasInitialOwnerClaim({ app_metadata: { onboarding_role: "owner" } }), true);
  assert.equal(hasInitialOwnerClaim({ app_metadata: { onboarding_role: "provider" } }), false);
  assert.equal(
    hasInitialOwnerClaim({
      app_metadata: {},
      user_metadata: { onboarding_role: "owner" },
    }),
    false,
  );
});

test("bootstrap migration atomically creates the owner membership and audit event", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/018_first_practice_bootstrap.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'aal'.*'aal2'/s);
  assert.match(migration, /'app_metadata'\s*->>\s*'onboarding_role'.*'owner'/s);
  assert.match(migration, /insert into public\.practices/i);
  assert.match(migration, /insert into public\.practice_members[\s\S]*'owner'[\s\S]*'active'/i);
  assert.match(migration, /insert into public\.audit_events/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /grant execute[\s\S]*to authenticated/i);
  assert.match(migration, /revoke all[\s\S]*from public, anon/i);
});

test("duplicate first-practice bootstrap is serialized and rejected", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/018_first_practice_bootstrap.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /if exists \(select 1 from public\.practices\)/i);
  assert.match(migration, /Initial practice bootstrap is closed/i);
});

test("bootstrap route uses the authenticated RPC and never a service-role write", async () => {
  const route = await readFile(
    new URL("../app/api/practices/bootstrap/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /requireAuthenticatedUser/);
  assert.match(route, /hasInitialOwnerClaim/);
  assert.match(route, /\.rpc\("bootstrap_first_practice"/);
  assert.doesNotMatch(route, /createServiceRoleSupabaseClient/);
});

test("practice access resolution exposes only bootstrap, member, or authorization failure", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/019_practice_access_resolution.sql", import.meta.url),
    "utf8",
  );
  const context = await readFile(
    new URL("../lib/practice-context.ts", import.meta.url),
    "utf8",
  );

  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'aal'.*'aal2'/s);
  assert.match(migration, /return jsonb_build_object\('state', 'bootstrap'\)/i);
  assert.match(migration, /'state', 'member'/i);
  assert.match(migration, /Active practice membership required[\s\S]*42501/i);
  assert.match(migration, /member\.user_id = current_user_id/i);
  assert.doesNotMatch(context, /createServiceRoleSupabaseClient/);
  assert.match(context, /resolvePracticeAuthorization/);
  assert.doesNotMatch(context, /\.rpc\("resolve_practice_access"/);
});
