import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { navigationForAccessRoles } from "../lib/mvp-navigation.ts";

const ROOT = new URL("../", import.meta.url);

function labels(roles) {
  return navigationForAccessRoles(roles).map((item) => item.label);
}

test("a treating founder retains the complete MVP path", () => {
  assert.deepEqual(labels(["organization_owner", "practice_administrator", "provider"]), [
    "Worklist",
    "Patients",
    "Provider review",
    "Billing",
    "Settings",
  ]);
});

test("production navigation exposes only role-required pilot destinations", () => {
  assert.deepEqual(labels(["provider"]), ["Attention", "Patients"]);
  assert.deepEqual(labels(["coordinator"]), ["Worklist", "Patients"]);
  assert.deepEqual(labels(["clinical_staff"]), ["Worklist", "Patients"]);
  assert.deepEqual(labels(["billing_administrator"]), ["Billing"]);
  assert.deepEqual(labels(["compliance_administrator"]), ["Compliance", "Patients"]);
  assert.deepEqual(labels(["front_desk"]), ["Patients"]);
  assert.deepEqual(labels(["read_only"]), ["Patients"]);
});

test("the patient registry hides patient creation from read-only operational roles", async () => {
  const registry = await readFile(new URL("app/patients/page.tsx", ROOT), "utf8");
  assert.match(registry, /PATIENT_CREATE_ROLES/);
  assert.match(registry, /canAddPatient \? <Link href="\/patients\/new"/);
  assert.doesNotMatch(registry, /billing_administrator[\s\S]*PATIENT_CREATE_ROLES/);
  assert.doesNotMatch(registry, /compliance_administrator[\s\S]*PATIENT_CREATE_ROLES/);
  assert.doesNotMatch(registry, /front_desk[\s\S]*PATIENT_CREATE_ROLES/);
  assert.doesNotMatch(registry, /read_only[\s\S]*PATIENT_CREATE_ROLES/);
});

test("new-patient enrollment cannot create an orphan through an impossible active state", async () => {
  const [form, detail] = await Promise.all([
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
    readFile(new URL("app/patients/[patientId]/page.tsx", ROOT), "utf8"),
  ]);

  assert.match(form, /mode === "create"[\s\S]*status !== "active"/);
  assert.match(form, /Save the patient as pending, complete structured eligibility, then activate enrollment/);
  assert.match(form, /setupRecovery=conditions/);
  assert.match(form, /setupRecovery=enrollment/);
  assert.match(detail, /update the existing patient instead of creating a duplicate/);
});

test("the required patient path presents deterministic clinical intake without an AI dependency", async () => {
  const [intake, form, workspace, carePlan, evidence, labelsSource, environment] = await Promise.all([
    readFile(new URL("app/patients/[patientId]/intake/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientWorkspace.tsx", ROOT), "utf8"),
    readFile(new URL("app/patients/[patientId]/care-plan/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/dashboard/billing/[patientId]/[month]/page.tsx", ROOT), "utf8"),
    readFile(new URL("lib/ccm/labels.ts", ROOT), "utf8"),
    readFile(new URL(".env.example", ROOT), "utf8"),
  ]);

  assert.match(intake, /deterministic intake review/i);
  for (const source of [form, workspace, carePlan, evidence, labelsSource]) {
    assert.doesNotMatch(source, /AI intake|Reviewed AI/i);
  }
  assert.match(workspace, /Clinical Intake/);
  assert.match(evidence, /Reviewed clinical intake/);
  assert.match(environment, /Optional\. Without this key, intake generation uses the deterministic fallback/i);
});

test("the locked MVP document classifies scope and keeps external gates separate", async () => {
  const definition = await readFile(new URL("docs/product/mvp-definition.md", ROOT), "utf8");
  for (const heading of [
    "Exact MVP feature list — MUST HAVE",
    "SHOULD HAVE",
    "NICE TO HAVE",
    "POST-MVP",
    "Remaining software blockers",
    "Remaining operational blockers",
    "Engineering estimates",
    "Recommended implementation order",
  ]) {
    assert.match(definition, new RegExp(heading));
  }
  assert.match(definition, /require an AI service/i);
  assert.match(definition, /No known application feature is missing/i);
  assert.match(definition, /one-month workflow with separate owner, coordinator, and provider identities/i);
});
