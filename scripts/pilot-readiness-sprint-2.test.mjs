import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isAdministrativeRole,
  LEGACY_ROLE_TO_ACCESS_ROLE,
  outranks,
  ROLE_HIERARCHY,
} from "../lib/role-architecture.ts";

const migrationUrl = new URL("../supabase/migrations/025_pilot_readiness_sprint_2.sql", import.meta.url);
const functionHardeningUrl = new URL(
  "../supabase/migrations/026_pilot_readiness_sprint_2_function_hardening.sql",
  import.meta.url,
);
const workflowHardeningUrl = new URL(
  "../supabase/migrations/027_task_driven_coordinator_workflow.sql",
  import.meta.url,
);

async function readFinalPilotSchema() {
  const migrations = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(functionHardeningUrl, "utf8"),
    readFile(workflowHardeningUrl, "utf8"),
  ]);
  return migrations.join("\n");
}

test("canonical roles cover pilot roles while retaining deterministic legacy mappings", () => {
  assert.equal(LEGACY_ROLE_TO_ACCESS_ROLE.owner, "practice_administrator");
  assert.equal(LEGACY_ROLE_TO_ACCESS_ROLE.billing_staff, "billing_administrator");
  assert.equal(isAdministrativeRole("organization_owner"), true);
  assert.equal(isAdministrativeRole("provider"), false);
  assert.equal(outRanksAll(), true);

  function outRanksAll() {
    return outranks("organization_owner", "practice_administrator")
      && outranks("practice_administrator", "department_administrator")
      && ROLE_HIERARCHY.patient < ROLE_HIERARCHY.read_only;
  }
});

test("bootstrap is AAL2-gated, per-user serialized, atomic, and idempotent", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /function public\.bootstrap_user_practice/i);
  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'aal'.*'aal2'/s);
  assert.match(migration, /user-practice:.*current_user_id/s);
  assert.match(migration, /if found then[\s\S]*'created', false/i);
  assert.match(migration, /insert into public\.organizations/i);
  assert.match(migration, /insert into public\.organization_members[\s\S]*'organization_owner'/i);
  assert.match(migration, /insert into public\.practice_members[\s\S]*'owner'[\s\S]*'active'/i);
  assert.match(migration, /practice_member_role_assignments[\s\S]*'practice_administrator'/i);
  assert.match(migration, /practice\.onboarding_completed/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on function public\.bootstrap_user_practice/i);
});

test("clinical ownership is required, historical, immutable, and separate from staff responsibility", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /alter column primary_provider_id set not null/i);
  assert.match(migration, /create table public\.patient_primary_provider_history/i);
  assert.match(migration, /record_patient_primary_provider_history/i);
  assert.match(migration, /patient_primary_provider_history_immutable/i);
  assert.match(migration, /prevent_immutable_record_change/i);
  assert.match(migration, /create table public\.provider_staff_assignments/i);
  assert.match(migration, /create table public\.patient_access_memberships/i);
});

test("new public tables use RLS and explicit privileges", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  for (const table of [
    "organizations",
    "organization_members",
    "practice_member_role_assignments",
    "patient_access_memberships",
    "provider_staff_assignments",
    "patient_primary_provider_history",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from anon`, "i"));
  }
});

test("trigger-only security definer functions cannot be invoked as RPCs", async () => {
  const hardening = await readFinalPilotSchema();
  assert.match(hardening, /record_patient_primary_provider_history\(\).*from public, anon, authenticated/i);
  assert.match(hardening, /enforce_provider_staff_practice_match\(\).*from public, anon, authenticated/i);
  assert.match(hardening, /enforce_provider_lifecycle\(\).*from public, anon, authenticated, service_role/i);
});

test("tenant relationships use composite practice constraints", async () => {
  const migration = await readFinalPilotSchema();
  assert.match(migration, /practice_member_role_member_practice_fk[\s\S]*foreign key \(practice_id, member_id\)/i);
  assert.match(migration, /practice_member_role_member_user_fk[\s\S]*foreign key \(member_id, user_id\)/i);
  assert.match(migration, /patient_access_patient_practice_fk[\s\S]*foreign key \(practice_id, patient_id\)/i);
  assert.match(migration, /provider_staff_provider_practice_fk[\s\S]*foreign key \(practice_id, provider_id\)/i);
  assert.match(migration, /patient_prp_history_provider_practice_fk[\s\S]*foreign key \(practice_id, provider_id\)/i);
});

test("provider ownership follows transfer then deactivate then archive", async () => {
  const migration = await readFinalPilotSchema();
  assert.match(migration, /patients_primary_provider_id_fkey[\s\S]*on delete restrict/i);
  assert.match(migration, /function public\.enforce_provider_lifecycle/i);
  assert.match(migration, /Providers cannot be deleted/i);
  assert.match(migration, /Transfer all Primary Responsible Provider assignments before deactivating or archiving/i);
  assert.match(migration, /Deactivate the provider before archiving/i);
  assert.match(migration, /patient_primary_provider_history_immutable/i);
});

test("first-run navigation and guided wizards expose no membership dead end", async () => {
  const [gate, setup, mfa] = await Promise.all([
    readFile(new URL("../components/auth/AuthGate.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/setup/practice/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mfa/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(gate, /response\.status === 404 \|\| response\.status === 403/);
  assert.match(gate, /router\.replace\(SETUP_PATH\)/);
  assert.match(setup, /Organization Owner/);
  assert.match(setup, /Practice Administrator/);
  assert.match(setup, /OnboardingProgress/);
  assert.match(mfa, /Microsoft Authenticator/);
  assert.match(mfa, /Setup was interrupted/);
  assert.match(mfa, /Continue setup/);
  assert.match(mfa, /Restart/);
  assert.match(mfa, /Cancel/);
  assert.match(mfa, /MFA is configured/);
});
