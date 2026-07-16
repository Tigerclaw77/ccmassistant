import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hasAuthorizedPracticeRole } from "../lib/practice-authorization.ts";

const owner = { role: "owner" };
const provider = { role: "provider" };
const coordinator = { role: "coordinator" };
const billingStaff = { role: "billing_staff" };

const adminRoles = ["owner", "admin"];
const patientWriteRoles = ["owner", "admin", "provider", "coordinator"];
const billingWriteRoles = ["owner", "admin", "billing_staff"];

test("owner, provider, coordinator, and billing role boundaries are deterministic", () => {
  assert.equal(hasAuthorizedPracticeRole(owner, adminRoles), true);
  assert.equal(hasAuthorizedPracticeRole(provider, adminRoles), false);
  assert.equal(hasAuthorizedPracticeRole(provider, patientWriteRoles), true);
  assert.equal(hasAuthorizedPracticeRole(coordinator, patientWriteRoles), true);
  assert.equal(hasAuthorizedPracticeRole(coordinator, billingWriteRoles), false);
  assert.equal(hasAuthorizedPracticeRole(billingStaff, billingWriteRoles), true);
  assert.equal(hasAuthorizedPracticeRole(billingStaff, patientWriteRoles), false);
});

test("all current-user membership and role resolution uses one canonical service", async () => {
  const auth = await readFile(new URL("../lib/auth.ts", import.meta.url), "utf8");
  const context = await readFile(new URL("../lib/practice-context.ts", import.meta.url), "utf8");
  const authorization = await readFile(
    new URL("../lib/practice-authorization.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(auth, /\.from\("practice_members"\)/);
  assert.doesNotMatch(context, /\.from\("practice_members"\)|\.rpc\("resolve_practice_access"/);
  assert.match(auth, /requirePracticeAuthorization/);
  assert.match(context, /resolvePracticeAuthorization/);
  assert.equal((authorization.match(/\.rpc\("resolve_practice_access"/g) ?? []).length, 1);
});

test("authorization RPC requires AAL2 and scopes membership to auth.uid", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/019_practice_access_resolution.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /current_user_id is null[\s\S]*'aal2'/i);
  assert.match(migration, /member\.user_id = current_user_id/i);
  assert.match(migration, /requested_practice_id is null or member\.practice_id = requested_practice_id/i);
  assert.match(migration, /Active practice membership required[\s\S]*42501/i);
});

test("provider, coordinator, and billing routes use canonical role enforcement", async () => {
  const providers = await readFile(new URL("../app/api/providers/route.ts", import.meta.url), "utf8");
  const members = await readFile(
    new URL("../app/api/practice-members/route.ts", import.meta.url),
    "utf8",
  );
  const billing = await readFile(
    new URL("../app/api/billing/month/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(providers, /requirePracticeMembership[\s\S]*PRACTICE_ADMIN_ROLES/);
  assert.match(members, /requirePracticeMembership[\s\S]*PRACTICE_ADMIN_ROLES/);
  assert.match(billing, /requirePracticeMembership[\s\S]*BILLING_WRITE_ROLES/);
});

test("authenticated grants are operation-specific and remain behind RLS", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/020_least_privilege_application_grants.sql", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(migration, /grant all|on all tables|disable row level security/i);
  assert.match(migration, /grant select, insert, update on table public\.practice_members to authenticated/i);
  assert.match(migration, /grant select, insert, update on table public\.providers to authenticated/i);
  assert.match(migration, /grant select, insert, update on table public\.patients to authenticated/i);
  assert.doesNotMatch(migration, /grant delete on table public\.audit_events/i);
  assert.doesNotMatch(migration, /grant update on table public\.billing_evidence_snapshots/i);
});

test("anonymous access stays revoked and service-role grants are narrowly enumerated", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/020_least_privilege_application_grants.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /revoke all on table public\.practice_members from anon/i);
  assert.doesNotMatch(migration, /to anon/i);
  assert.doesNotMatch(migration, /all tables[\s\S]*service_role/i);
  assert.match(migration, /public check-in reads and writes/i);
  assert.match(migration, /billability preservation and upsert/i);
});

test("authorization inventory documents every direct membership consumer", async () => {
  const inventory = await readFile(
    new URL("../docs/audit/authorization-inventory.md", import.meta.url),
    "utf8",
  );

  assert.match(inventory, /practice-members\/route\.ts/);
  assert.match(inventory, /worklist\/route\.ts/);
  assert.match(inventory, /No other application module queries `practice_members` directly/);
  assert.match(inventory, /no schema-wide grants/i);
});
