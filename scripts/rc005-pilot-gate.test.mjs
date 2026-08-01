import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { ASSIGNABLE_OPERATIONAL_ROLES, ACCESS_ROLE_TO_LEGACY_ROLE, hasAnyAccessRole } from "../lib/access-roles.ts";
import { authCallbackError } from "../lib/auth-redirect.ts";

const ROOT = new URL("../", import.meta.url);

test("every pilot operational role is assignable with a legacy compatibility projection", () => {
  assert.deepEqual(ASSIGNABLE_OPERATIONAL_ROLES, ["practice_administrator","compliance_administrator","billing_administrator","provider","clinical_staff","coordinator","front_desk","read_only"]);
  for (const role of ASSIGNABLE_OPERATIONAL_ROLES) assert.ok(ACCESS_ROLE_TO_LEGACY_ROLE[role]);
  assert.equal(hasAnyAccessRole(["front_desk"], ["billing_administrator"]), false);
  assert.equal(hasAnyAccessRole(["organization_owner"], ["organization_owner","practice_administrator"]), true);
});

test("expired and provider callback failures are converted into actionable recovery messages", () => {
  assert.match(authCallbackError({ hash: "#error_code=otp_expired", search: "" }), /expired or was already used/);
  assert.equal(authCallbackError({ hash: "#error_description=Provider+rejected+request", search: "" }), "Provider rejected request");
  assert.equal(authCallbackError({ hash: "", search: "" }), null);
});

test("password recovery is allowed before MFA but protected pages are not", async () => {
  const [gate, reset] = await Promise.all([
    readFile(new URL("components/auth/AuthGate.tsx", ROOT), "utf8"),
    readFile(new URL("app/reset-password/page.tsx", ROOT), "utf8"),
  ]);
  assert.match(gate, /allowsPreMfaRecovery = pathname === "\/reset-password"/);
  assert.match(gate, /pathname !== MFA_PATH && !allowsPreMfaRecovery/);
  assert.match(reset, /updateUser\(\{ password \}\)/);
  assert.match(reset, /auth\.signOut\(\)/);
});

test("invitation provisioning persists, activates, changes, and removes canonical roles", async () => {
  const route = await readFile(new URL("app/api/practice-members/route.ts", ROOT), "utf8");
  const accept = await readFile(new URL("app/api/staff-invitations/accept/route.ts", ROOT), "utf8");
  assert.match(route, /practice_member_role_assignments/);
  assert.match(route, /access_role: role/);
  assert.match(route, /update_practice_member_access/);
  assert.match(route, /action === "disable" \|\| action === "remove"/);
  assert.match(accept, /role", invitation\.access_role/);
  assert.match(accept, /status: "active", user_id: user\.id/);
});

test("the RC-005 migration uses canonical roles and explicit grants", async () => {
  const names = await readdir(new URL("supabase/migrations/", ROOT));
  const name = names.find((value) => value.endsWith("_rc005_operational_role_provisioning.sql"));
  assert.ok(name);
  const migration = await readFile(new URL(`supabase/migrations/${name}`, ROOT), "utf8");
  assert.match(migration, /create or replace function public\.has_access_role/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /grant execute on function public\.has_access_role/);
  assert.match(migration, /grant execute on function public\.update_practice_member_access[\s\S]*to service_role/);
  assert.doesNotMatch(migration, /disable row level security|grant all/i);
});

test("the server-side invitation lifecycle has explicit practice membership privileges", async () => {
  const names = await readdir(new URL("supabase/migrations/", ROOT));
  const name = names.find((value) => value.endsWith("_version_1_0_practice_member_service_grant.sql"));
  assert.ok(name);
  const migration = await readFile(new URL(`supabase/migrations/${name}`, ROOT), "utf8");
  assert.match(
    migration,
    /grant select, insert, update, delete on table public\.practice_members to service_role;/,
  );
  assert.match(
    migration,
    /grant select, insert, update on table public\.practice_member_role_assignments to service_role;/,
  );
  assert.match(migration, /alter function public\.snapshot_care_plan_version\(\) security definer;/);
  assert.match(migration, /revoke all on function public\.snapshot_care_plan_version\(\) from public, anon, authenticated, service_role;/);
  assert.doesNotMatch(migration, /grant all|to authenticated|to anon/i);
});

test("the invitation acceptance page preserves its invitation id through server rendering", async () => {
  const page = await readFile(new URL("app/accept-invitation/page.tsx", ROOT), "utf8");
  assert.match(page, /setInvitationId\(resolvedInvitationId\)/);
  assert.match(page, /new URLSearchParams\(window\.location\.search\)\.get\("invitation"\)/);
  assert.doesNotMatch(page, /useState\(\(\) => typeof window/);
  assert.doesNotMatch(page, /useSearchParams/);
});
