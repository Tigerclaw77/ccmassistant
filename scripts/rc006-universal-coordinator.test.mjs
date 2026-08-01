import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CLINICAL_STARTER_KITS,
  DEFAULT_CLINICAL_STARTER_KIT_IDS,
  clinicalStarterKitIdsFromSettings,
  starterKitsForConditions,
  validateClinicalStarterKitIds,
} from "../lib/ccm/clinical-starter-kits.ts";
import { createUniversalCareGuidance } from "../lib/ccm/universal-care-guidance.ts";

const ROOT = new URL("../", import.meta.url);

const BASE_GUIDANCE = {
  accessRoles: ["coordinator"],
  billingHref: "/billing",
  carePlanHref: "/care-plan",
  carePlanReviewStatus: "approved",
  checkInComplete: true,
  checkInExists: true,
  checkInHref: "/check-in",
  consentComplete: true,
  documentedMinutes: 10,
  eligibilityComplete: true,
  eligibilityHref: "/eligibility",
  intakeComplete: true,
  intakeHref: "/intake",
  logTimeHref: "/log-time",
  patientEditHref: "/patient/edit",
  qualifyingConditionCount: 2,
  thresholdMinutes: 20,
};

test("eight selectable clinical starter kits provide every required guidance category", () => {
  assert.equal(CLINICAL_STARTER_KITS.length, 8);
  assert.deepEqual(DEFAULT_CLINICAL_STARTER_KIT_IDS, CLINICAL_STARTER_KITS.map((kit) => kit.id));
  for (const kit of CLINICAL_STARTER_KITS) {
    assert.ok(kit.monthlyQuestionIds.length > 0, `${kit.id} monthly questions`);
    assert.ok(kit.educationTopics.length > 0, `${kit.id} education`);
    assert.ok(kit.coordinatorReminders.length > 0, `${kit.id} coordinator reminders`);
    assert.ok(kit.providerReviewPrompts.length > 0, `${kit.id} provider prompts`);
    assert.ok(kit.escalationSuggestions.length > 0, `${kit.id} escalation suggestions`);
    assert.ok(kit.monthlyQuestionIds.every((id) => id.startsWith("ccm.")));
  }
});

test("starter kit settings are safe, ordered, and backwards compatible", () => {
  assert.deepEqual(validateClinicalStarterKitIds(["copd", "diabetes", "copd"]), ["diabetes", "copd"]);
  assert.throws(() => validateClinicalStarterKitIds([]), /at least one/i);
  assert.throws(() => validateClinicalStarterKitIds(["invented"]), /unsupported/i);
  assert.deepEqual(clinicalStarterKitIdsFromSettings({}), DEFAULT_CLINICAL_STARTER_KIT_IDS);
  assert.deepEqual(clinicalStarterKitIdsFromSettings({ clinical_starter_kit_ids: ["anxiety", "ckd"] }), ["ckd", "anxiety"]);
});

test("patient conditions activate only selected matching starter guidance", () => {
  const kits = starterKitsForConditions({
    conditionNames: ["Type 2 diabetes", "Chronic obstructive pulmonary disease", "Arthritis"],
    selectedIds: ["diabetes", "hypertension", "copd"],
  });
  assert.deepEqual(kits.map((kit) => kit.id), ["diabetes", "copd"]);
});

test("the universal guide chooses one prerequisite before monthly time context", () => {
  const eligibility = createUniversalCareGuidance({ ...BASE_GUIDANCE, documentedMinutes: 20, eligibilityComplete: false });
  assert.equal(eligibility.actionHref, "/eligibility");
  assert.match(eligibility.needsAttention, /eligibility/i);

  const consent = createUniversalCareGuidance({ ...BASE_GUIDANCE, consentComplete: false, documentedMinutes: 20 });
  assert.equal(consent.actionHref, "/patient/edit");
  assert.match(consent.needsAttention, /consent/i);

  const activeCycle = createUniversalCareGuidance(BASE_GUIDANCE);
  assert.equal(activeCycle.actionHref, "/log-time");
  assert.match(activeCycle.canWait, /do not create work only/i);
  assert.equal(activeCycle.monthlyProgressPercent, 50);
});

test("the same guide adapts provider presentation without creating a separate workflow", () => {
  const provider = createUniversalCareGuidance({
    ...BASE_GUIDANCE,
    accessRoles: ["provider"],
    carePlanReviewStatus: "provider_review_required",
  });
  const coordinator = createUniversalCareGuidance({
    ...BASE_GUIDANCE,
    carePlanReviewStatus: "provider_review_required",
  });
  assert.equal(provider.actionHref, coordinator.actionHref);
  assert.equal(provider.audienceLabel, "Provider view");
  assert.equal(coordinator.audienceLabel, "Coordinator view");
  assert.match(provider.actionLabel, /review/i);
  assert.match(coordinator.actionLabel, /complete/i);
});

test("first-run setup, first patient, and workspace remain one guided path", async () => {
  const [setup, bootstrap, activePractice, questionBankSettings, newPatient, patientForm, patientPage, workspace] = await Promise.all([
    readFile(new URL("app/setup/practice/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/api/practices/bootstrap/route.ts", ROOT), "utf8"),
    readFile(new URL("app/api/practices/active/route.ts", ROOT), "utf8"),
    readFile(new URL("app/settings/question-banks/page.tsx", ROOT), "utf8"),
    readFile(new URL("app/patients/new/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientForm.tsx", ROOT), "utf8"),
    readFile(new URL("app/patients/[patientId]/page.tsx", ROOT), "utf8"),
    readFile(new URL("components/patients/PatientWorkspace.tsx", ROOT), "utf8"),
  ]);
  assert.match(setup, /ClinicalStarterKitPicker/);
  assert.match(setup, /clinicalStarterKitIds/);
  assert.match(bootstrap, /clinical_starter_kit_ids: clinicalStarterKitIds/);
  assert.match(bootstrap, /DEFAULT_CLINICAL_STARTER_KIT_IDS/);
  assert.match(activePractice, /PRACTICE_ADMIN_ROLES/);
  assert.match(activePractice, /recordAuditEvent/);
  assert.match(questionBankSettings, /canAdministerClinic/);
  assert.match(questionBankSettings, /Save starter kits/);
  assert.match(newPatient, /Final onboarding step/);
  assert.match(newPatient, /firstPatientOnboarding/);
  assert.match(patientForm, /onboarding=complete/);
  assert.match(patientPage, /Onboarding complete/);
  assert.match(workspace, /Guided next action/);
  assert.match(workspace, /What can wait:/);
  assert.match(workspace, /More patient tools/);
  assert.match(workspace, /Clinical starter guidance/);
});
