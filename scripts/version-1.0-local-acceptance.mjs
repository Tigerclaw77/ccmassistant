import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getQuestion } from "../lib/ccm/question-bank/questions.ts";

const APP_ORIGIN = "http://127.0.0.1:3000";
const BILLING_MONTH = "2026-08-01";
const OCCURRENCE_DATE = "2026-08-01";
const PRACTICE_ID = "1cb213c3-fed0-43ea-be0a-8e2f56667fe9";
const SHARED_PASSWORD = "Acceptance!2026-Staff";
const PANEL_SIZE = 50;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase().replaceAll("=", "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("TOTP secret is invalid");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpCode(secret, now = Date.now()) {
  const counter = Math.floor(now / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

function jwtAal(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")).aal;
}

async function api(path, { body, expected = [200], method = "GET", token } = {}) {
  const response = await fetch(`${APP_ORIGIN}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  assert.ok(
    expected.includes(response.status),
    `${method} ${path} returned ${response.status}: ${data?.error ?? "unexpected response"}`,
  );
  return { data, status: response.status };
}

async function authenticateExistingOwner(url, anonKey) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const signedIn = await client.auth.signInWithPassword({
    email: requiredEnvironment("CCM_ACCEPTANCE_OWNER_EMAIL"),
    password: requiredEnvironment("CCM_ACCEPTANCE_OWNER_PASSWORD"),
  });
  if (signedIn.error) throw signedIn.error;
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) throw factors.error;
  const factor = factors.data.all.find((item) => item.status === "verified" && item.factor_type === "totp");
  assert.ok(factor, "Owner verified TOTP factor is missing");
  const verified = await client.auth.mfa.challengeAndVerify({
    code: totpCode(requiredEnvironment("CCM_ACCEPTANCE_OWNER_TOTP_SECRET")),
    factorId: factor.id,
  });
  if (verified.error) throw verified.error;
  const token = verified.data.session?.access_token ?? (await client.auth.getSession()).data.session?.access_token;
  assert.ok(token && jwtAal(token) === "aal2", "Owner did not reach AAL2");
  return { client, token };
}

async function authenticateNewIdentity(url, anonKey, email) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const signedIn = await client.auth.signInWithPassword({ email, password: SHARED_PASSWORD });
  if (signedIn.error) throw signedIn.error;
  const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: `CCM acceptance ${email}` });
  if (enrolled.error || !enrolled.data?.totp?.secret) throw enrolled.error ?? new Error("MFA secret missing");
  const verified = await client.auth.mfa.challengeAndVerify({
    code: totpCode(enrolled.data.totp.secret),
    factorId: enrolled.data.id,
  });
  if (verified.error) throw verified.error;
  const token = verified.data.session?.access_token ?? (await client.auth.getSession()).data.session?.access_token;
  assert.ok(token && jwtAal(token) === "aal2", `${email} did not reach AAL2`);
  return { client, email, secret: enrolled.data.totp.secret, token };
}

async function inviteAndAcceptRole({ admin, anonKey, ownerToken, role, slug, supabaseUrl }) {
  const email = `acceptance.${slug}@example.test`;
  const directory = await api(`/api/practice-members?practiceId=${PRACTICE_ID}`, { token: ownerToken });
  const existingMember = directory.data.members.find((member) =>
    (member.user_email ?? member.invited_email)?.toLowerCase() === email,
  );
  const existingInvitation = directory.data.invitations.find((invitation) =>
    invitation.email.toLowerCase() === email && invitation.status === "pending",
  );
  if (existingMember) {
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (users.error) throw users.error;
    const user = users.data.users.find((item) => item.email?.toLowerCase() === email);
    assert.ok(user, `${role} Auth user is missing`);
    const factors = await admin.auth.admin.mfa.listFactors({ userId: user.id });
    if (factors.error) throw factors.error;
    for (const factor of factors.data.factors) {
      const deleted = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
      if (deleted.error) throw deleted.error;
    }
    const updated = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      password: SHARED_PASSWORD,
      user_metadata: { display_name: slug.replaceAll("-", " "), synthetic_acceptance: true },
    });
    if (updated.error) throw updated.error;
    const identity = await authenticateNewIdentity(supabaseUrl, anonKey, email);
    if (existingMember.status === "active") return { ...identity, memberId: existingMember.id, role };
    assert.ok(existingInvitation, `${role} pending invitation is missing`);
    const accepted = await api("/api/staff-invitations/accept", {
      body: { invitationId: existingInvitation.id }, method: "POST", token: identity.token,
    });
    return { ...identity, memberId: accepted.data.member.id, role };
  }
  const invitationResponse = await api("/api/practice-members", {
    body: { email, practiceId: PRACTICE_ID, role },
    expected: [201],
    method: "POST",
    token: ownerToken,
  });
  const invitation = invitationResponse.data.invitation;
  assert.ok(invitation?.auth_user_id, `${role} invitation did not create an Auth user`);
  const updated = await admin.auth.admin.updateUserById(invitation.auth_user_id, {
    email_confirm: true,
    password: SHARED_PASSWORD,
    user_metadata: { display_name: slug.replaceAll("-", " "), synthetic_acceptance: true },
  });
  if (updated.error) throw updated.error;
  const identity = await authenticateNewIdentity(supabaseUrl, anonKey, email);
  const accepted = await api("/api/staff-invitations/accept", {
    body: { invitationId: invitation.id },
    method: "POST",
    token: identity.token,
  });
  assert.equal(accepted.data.member.status, "active");
  return { ...identity, memberId: accepted.data.member.id, role };
}

function safeAnswer(questionView, occurrenceDate, abnormal = false) {
  const question = getQuestion(questionView.questionId);
  assert.ok(question, `Question not found: ${questionView.questionId}`);
  if (abnormal) {
    if (question.id.includes("systolic")) return 185;
    if (question.id.includes("glucose") && question.answerType === "number") return 350;
    if (question.id.includes("sob_severity")) return "severe";
    if (question.id.includes("hypoglycemia") || question.id.includes("foot_concern") || question.id.includes("weight_gain") || question.id.includes("swelling")) return true;
  }
  if (question.answerType === "yes_no") return false;
  if (question.answerType === "date") return occurrenceDate;
  if (question.answerType === "text") return "No material changes reported during the synthetic monthly review.";
  if (question.answerType === "number") {
    if (question.id.includes("systolic")) return 120;
    if (question.id.includes("glucose")) return 110;
    if (question.id.includes("rescue_frequency")) return 0;
    if (question.id.includes("pain.severity")) return 2;
    const minimum = question.validation.min ?? 0;
    const maximum = question.validation.max ?? Math.max(10, minimum + 10);
    const value = minimum + (maximum - minimum) / 2;
    return question.validation.integer ? Math.round(value) : value;
  }
  const values = (question.validation.options ?? []).map((option) => option.value);
  const preferred = ["none", "no", "not_at_all", "about_the_same", "stable", "good", "on_track", "better"].find((value) => values.includes(value));
  const value = preferred ?? values[0];
  assert.ok(value, `Question options are unavailable: ${question.id}`);
  return question.answerType === "multi_select" ? [value] : value;
}

async function completeAuthenticatedSession(session, token, abnormal = false) {
  let current = session;
  let count = 0;
  let abnormalUsed = false;
  while (current.currentQuestion) {
    assert.ok(count++ < 100, "Question session exceeded answer limit");
    const answer = safeAnswer(current.currentQuestion, OCCURRENCE_DATE, abnormal && !abnormalUsed);
    const definition = getQuestion(current.currentQuestion.questionId);
    if (abnormal && definition && answer !== safeAnswer(current.currentQuestion, OCCURRENCE_DATE, false)) abnormalUsed = true;
    const response = await api("/api/question-sessions", {
      body: {
        action: "answer",
        answer,
        practiceId: PRACTICE_ID,
        questionId: current.currentQuestion.questionId,
        recordId: current.recordId,
        stateVersion: current.stateVersion,
      },
      method: "PATCH",
      token,
    });
    current = response.data.session;
  }
  assert.equal(current.status, "completed");
  return current;
}

async function completePublicSession(checkInToken, session, abnormal = false) {
  let current = session;
  let count = 0;
  let abnormalUsed = false;
  while (current.currentQuestion) {
    assert.ok(count++ < 100, "Public check-in exceeded answer limit");
    const answer = safeAnswer(current.currentQuestion, OCCURRENCE_DATE, abnormal && !abnormalUsed);
    const normal = safeAnswer(current.currentQuestion, OCCURRENCE_DATE, false);
    if (abnormal && JSON.stringify(answer) !== JSON.stringify(normal)) abnormalUsed = true;
    const response = await api(`/api/check-ins/public/${checkInToken}/submit`, {
      body: { action: "answer", answer, questionId: current.currentQuestion.questionId, stateVersion: current.stateVersion },
      method: "POST",
    });
    current = response.data.session;
  }
  assert.equal(current.status, "completed");
  return { abnormalUsed, session: current };
}

const CONDITION_PAIRS = [
  [["Essential Hypertension", "I10"], ["Type 2 Diabetes Mellitus", "E11.9"]],
  [["Essential Hypertension", "I10"], ["Congestive Heart Failure", "I50.9"]],
  [["Chronic Obstructive Pulmonary Disease", "J44.9"], ["Essential Hypertension", "I10"]],
  [["Chronic Kidney Disease", "N18.9"], ["Type 2 Diabetes Mellitus", "E11.9"]],
  [["Hyperlipidemia", "E78.5"], ["Essential Hypertension", "I10"]],
  [["Depression", "F32.A"], ["Anxiety", "F41.9"]],
  [["Congestive Heart Failure", "I50.9"], ["Chronic Kidney Disease", "N18.9"]],
  [["Type 2 Diabetes Mellitus", "E11.9"], ["Hyperlipidemia", "E78.5"]],
];

function conditionItems(index) {
  return CONDITION_PAIRS[index % CONDITION_PAIRS.length].map(([name, code]) => ({
    canonicalName: name,
    ccmQualifying: true,
    code,
    codeSystem: "ICD-10",
    displayName: name,
    isActive: true,
    normalizationStatus: "normalized",
    userEnteredText: name,
  }));
}

const ELIGIBILITY_FACTS = {
  conditions_expected_12_months: true,
  medicare_information_reviewed: true,
  no_known_duplicate_ccm: true,
  significant_risk: true,
  two_or_more_chronic_conditions: true,
};
const PROVIDER_ATTESTATIONS = {
  care_plan_needed: true,
  ccm_criteria_met: true,
  medical_necessity: true,
  provider_reviewed_conditions: true,
};
const CONSENT_ELEMENTS = {
  cost_sharing_explained: true,
  information_sharing_authorized: true,
  one_practitioner_explained: true,
  right_to_stop_explained: true,
  services_explained: true,
};

async function createOrRepairPatient({ coordinator, index, nurse, providerId, providerToken }) {
  const externalId = `SYN-${String(index + 1).padStart(4, "0")}`;
  const assigned = index >= 40 ? nurse : coordinator;
  let patient;
  let enrollment = null;
  if (index === 0) {
    const listed = await api(`/api/patients?practiceId=${PRACTICE_ID}&search=${externalId}`, { token: coordinator.token });
    patient = listed.data.patients.find((item) => item.external_id === externalId);
    assert.ok(patient, "Browser-created first patient is missing");
    const detail = await api(`/api/patients?practiceId=${PRACTICE_ID}&patientId=${patient.id}`, { token: coordinator.token });
    enrollment = detail.data.enrollment;
    const updated = await api("/api/patients", {
      body: {
        careCoordinatorMemberId: assigned.memberId,
        displayName: "Eleanor Brooks",
        dob: "1948-03-14",
        email: null,
        externalId,
        firstName: "Eleanor",
        lastName: "Brooks",
        patientId: patient.id,
        phone: "312-555-1001",
        practiceId: PRACTICE_ID,
        preferredContactMethod: "phone",
        primaryProviderId: providerId,
        status: "active",
      },
      method: "PATCH",
      token: coordinator.token,
    });
    patient = updated.data.patient;
  } else {
    const year = 1938 + (index % 25);
    const response = await api("/api/patients", {
      body: {
        careCoordinatorMemberId: assigned.memberId,
        displayName: `Synthetic Patient ${String(index + 1).padStart(2, "0")}`,
        dob: `${year}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
        externalId,
        firstName: "Synthetic",
        lastName: `Patient ${String(index + 1).padStart(2, "0")}`,
        phone: `312-555-${String(1001 + index).padStart(4, "0")}`,
        practiceId: PRACTICE_ID,
        preferredContactMethod: index % 4 === 0 ? "sms" : "phone",
        primaryProviderId: providerId,
        status: "active",
      },
      expected: [201],
      method: "POST",
      token: assigned.token,
    });
    patient = response.data.patient;
  }

  await api("/api/patient-conditions", {
    body: { conditionItems: conditionItems(index), patientId: patient.id, practiceId: PRACTICE_ID },
    method: "PUT",
    token: assigned.token,
  });

  const enrollmentResponse = await api("/api/enroll", {
    body: {
      assignedProviderId: providerId,
      careCoordinatorMemberId: assigned.memberId,
      consentDate: OCCURRENCE_DATE,
      consentElements: CONSENT_ELEMENTS,
      consentMethod: index % 2 ? "verbal" : "written",
      consentStatus: "obtained",
      eligibilityFacts: ELIGIBILITY_FACTS,
      eligibilityNotes: "Synthetic eligibility reviewed for Version 1.0 acceptance.",
      eligibilityStatus: "eligible",
      enrolledAt: `${OCCURRENCE_DATE}T14:00:00.000Z`,
      ...(enrollment?.id ? { enrollmentId: enrollment.id } : {}),
      patientId: patient.id,
      practiceId: PRACTICE_ID,
      providerAttestations: PROVIDER_ATTESTATIONS,
      status: "active",
    },
    expected: enrollment?.id ? [200] : [201],
    method: enrollment?.id ? "PATCH" : "POST",
    token: providerToken,
  });
  enrollment = enrollmentResponse.data.enrollment;

  const existingIntakes = await api(`/api/patient-intake?practiceId=${PRACTICE_ID}&patientId=${patient.id}`, { token: assigned.token });
  if (!existingIntakes.data.intakes.some((item) => item.status === "accepted")) {
    const intakeSession = await api("/api/question-sessions", {
      body: { patientId: patient.id, practiceId: PRACTICE_ID, workflow: "intake" },
      expected: [201],
      method: "POST",
      token: assigned.token,
    });
    const completedIntake = await completeAuthenticatedSession(intakeSession.data.session, assigned.token);
    const intake = await api("/api/patient-intake", {
      body: {
        enrollmentId: enrollment.id,
        manualCorrections: {},
        patientId: patient.id,
        practiceId: PRACTICE_ID,
        sourceQuestionSessionId: completedIntake.recordId,
      },
      expected: [201],
      method: "POST",
      token: assigned.token,
    });
    assert.equal(intake.data.intake.status, "accepted");
  }

  const currentPlans = await api(`/api/care-plans?practiceId=${PRACTICE_ID}&patientId=${patient.id}`, { token: assigned.token });
  let carePlan = currentPlans.data.carePlans.find((item) => item.status === "active");
  if (!carePlan) {
    carePlan = (await api("/api/care-plans", {
      body: {
        barriers: index % 5 === 0 ? ["Transportation planning discussed."] : ["No current barriers identified."],
        enrollmentId: enrollment.id,
        goals: ["Maintain condition stability and complete monthly monitoring."],
        interventions: ["Review symptoms, medication access, and condition-specific monitoring monthly."],
        lastReviewedDate: OCCURRENCE_DATE,
        notes: "Synthetic Version 1.0 acceptance care plan.",
        patientId: patient.id,
        practiceId: PRACTICE_ID,
        providerId,
        status: "active",
      },
      expected: [201],
      method: "POST",
      token: providerToken,
    })).data.carePlan;
  }
  assert.equal(carePlan.review_status, "approved");

  const checkInResponse = await api("/api/check-ins", {
    body: { billingMonth: BILLING_MONTH, patientId: patient.id, practiceId: PRACTICE_ID },
    expected: [200, 201],
    method: "POST",
    token: assigned.token,
  });
  const checkIn = checkInResponse.data.checkIn;
  let abnormalUsed = (checkInResponse.data.responses ?? []).some((response) => response.flagged === true);
  if (checkIn.status !== "closed") {
    const publicSession = await api(`/api/check-ins/public/${checkIn.token}`);
    const completed = await completePublicSession(checkIn.token, publicSession.data.session, index === 0);
    abnormalUsed ||= completed.abnormalUsed;
    await api("/api/check-ins/status", {
      body: { checkinInstanceId: checkIn.id, practiceId: PRACTICE_ID, status: "closed" },
      method: "PATCH",
      token: assigned.token,
    });
  }

  const minutes = 20 + (index % 4) * 5;
  await api("/api/interaction-logs", {
    body: {
      activityType: index % 3 === 0 ? "call" : "care_coordination",
      checkinInstanceId: checkIn.id,
      enrollmentId: enrollment.id,
      minutes,
      notes: "Completed synthetic monthly outreach, monitoring, education, and care coordination.",
      occurrenceDate: OCCURRENCE_DATE,
      patientId: patient.id,
      practiceId: PRACTICE_ID,
      providerId,
      requestId: randomUUID(),
    },
    expected: [201],
    method: "POST",
    token: assigned.token,
  });
  return { abnormalUsed, assigned, carePlan, checkIn, enrollment, minutes, patient };
}

async function main() {
  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  assert.equal(new URL(supabaseUrl).hostname, "127.0.0.1", "Acceptance must use local Supabase only");
  assert.ok((await fetch(APP_ORIGIN)).ok, "Local application is not running");

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const owner = await authenticateExistingOwner(supabaseUrl, anonKey);
  const roleSpecs = [
    ["practice_administrator", "office-manager"],
    ["coordinator", "remote-coordinator"],
    ["clinical_staff", "nurse"],
    ["provider", "provider"],
    ["compliance_administrator", "compliance"],
    ["billing_administrator", "billing"],
    ["front_desk", "front-desk"],
    ["read_only", "read-only"],
  ];
  const identities = {};
  for (const [role, slug] of roleSpecs) {
    identities[role] = await inviteAndAcceptRole({ admin, anonKey, ownerToken: owner.token, role, slug, supabaseUrl });
  }

  const directory = await api(`/api/practice-members?practiceId=${PRACTICE_ID}`, { token: owner.token });
  assert.equal(directory.data.members.filter((member) => member.status === "active").length, 9);
  assert.ok(directory.data.members.every((member) => member.mfa_status === "verified"));

  await api("/api/practices/active", {
    body: {
      address: "1000 Lakeview Avenue, Chicago, IL 60601",
      ccmMonthlyMinMinutes: 20,
      cmsEligibilityAttested: true,
      defaultTimezone: "America/Chicago",
      medicareEnrollmentAttested: true,
      name: "Lakeside Primary Care Acceptance",
      phone: "312-555-0100",
      practiceId: PRACTICE_ID,
    },
    method: "PATCH",
    token: owner.token,
  });

  let providers = (await api(`/api/providers?practiceId=${PRACTICE_ID}&includeInactive=true`, { token: owner.token })).data.providers;
  const providerMember = identities.provider;
  let provider = providers.find((item) => item.member_id === providerMember.memberId);
  assert.ok(provider, "Invited provider profile was not linked to the provider membership");
  provider = (await api("/api/providers", {
    body: {
      billingPractitionerType: "physician",
      credentials: "MD",
      email: provider.email,
      fullName: "Dr. Samuel Ortiz",
      isActive: true,
      manualReviewReason: "",
      manualReviewStatus: "not_required",
      npi: "1234567893",
      phone: "312-555-0199",
      practiceId: PRACTICE_ID,
      providerId: provider.id,
    },
    method: "PATCH",
    token: owner.token,
  })).data.provider;

  const panel = [];
  for (let index = 0; index < PANEL_SIZE; index += 1) {
    panel.push(await createOrRepairPatient({
      coordinator: identities.coordinator,
      index,
      nurse: identities.clinical_staff,
      providerId: provider.id,
      providerToken: identities.provider.token,
    }));
    if ((index + 1) % 5 === 0) console.log(`Completed clinical workflow for ${index + 1}/${PANEL_SIZE} patients`);
  }

  const first = panel[0];
  const detected = await api("/api/opportunities", {
    body: { patientId: first.patient.id, practiceId: PRACTICE_ID },
    expected: [201],
    method: "POST",
    token: identities.coordinator.token,
  });
  assert.ok(first.abnormalUsed, "The synthetic abnormal response was not exercised");
  assert.ok(detected.data.suggestions.length > 0, "Opportunity detector produced no suggestion from abnormal evidence");
  const opportunity = detected.data.suggestions[0];
  await api(`/api/opportunities/${opportunity.id}/disposition`, {
    body: {
      disposition: "provider_review",
      note: "Provider review requested after the synthetic abnormal response.",
      practiceId: PRACTICE_ID,
      taskTitle: "Review synthetic abnormal response",
    },
    expected: [201],
    method: "POST",
    token: identities.coordinator.token,
  });
  const opportunityState = await api(`/api/opportunities?practiceId=${PRACTICE_ID}&patientId=${first.patient.id}`, { token: identities.coordinator.token });
  const workItem = opportunityState.data.workItems.find((item) => item.opportunity_id === opportunity.id);
  assert.ok(workItem, "Provider-review disposition did not create a work item");
  await api("/api/clinical-reports", {
    body: {
      conditionOrWorkflowItem: opportunity.condition_or_workflow_item,
      deliveryMethod: "secure_workspace",
      patientId: first.patient.id,
      practiceId: PRACTICE_ID,
      purpose: "Review the documented synthetic abnormal response and recommended follow-up.",
      recipientProviderId: provider.id,
      recipientType: "primary_responsible_provider",
      workItemId: workItem.id,
    },
    expected: [201],
    method: "POST",
    token: identities.coordinator.token,
  });
  await api(`/api/work-items/${workItem.id}`, {
    body: {
      outcome: "Abnormal response documented and routed securely to the responsible provider.",
      practiceId: PRACTICE_ID,
      status: "awaiting_provider",
    },
    method: "PATCH",
    token: identities.coordinator.token,
  });
  await api(`/api/work-items/${workItem.id}`, {
    body: {
      outcome: "Responsible provider reviewed the synthetic response and accepted the documented follow-up plan.",
      practiceId: PRACTICE_ID,
      status: "completed",
    },
    method: "PATCH",
    token: identities.provider.token,
  });

  for (let index = 0; index < panel.length; index += 1) {
    const item = panel[index];
    const recalculated = await api("/api/billability/recalculate", {
      body: { billingMonth: BILLING_MONTH, patientId: item.patient.id, practiceId: PRACTICE_ID },
      method: "POST",
      token: item.assigned.token,
    });
    assert.equal(recalculated.data.billability.status, "ready_to_bill", `Patient ${index + 1} is not billing ready`);
    assert.equal(Number(recalculated.data.billability.total_minutes), item.minutes);
    await api("/api/billing/month", {
      body: { action: "reviewed", billingMonth: BILLING_MONTH, patientId: item.patient.id, practiceId: PRACTICE_ID },
      method: "PATCH",
      token: identities.practice_administrator.token,
    });
    await api("/api/billing/month", {
      body: { action: "billed", billingMonth: BILLING_MONTH, patientId: item.patient.id, practiceId: PRACTICE_ID },
      method: "PATCH",
      token: identities.billing_administrator.token,
    });
    if ((index + 1) % 10 === 0) console.log(`Completed billing review for ${index + 1}/${PANEL_SIZE} patients`);
  }

  const billing = await api(`/api/billing/month?practiceId=${PRACTICE_ID}&billingMonth=${BILLING_MONTH}`, { token: identities.billing_administrator.token });
  assert.equal(billing.data.rows.length, PANEL_SIZE);
  assert.ok(billing.data.rows.every((row) => row.billability.status === "billed"));
  const compliance = await api(`/api/compliance/workflow?practiceId=${PRACTICE_ID}`, { token: identities.compliance_administrator.token });
  assert.ok(compliance.data.opportunities.length > 0);
  assert.ok(compliance.data.dispositions.length > 0);
  assert.ok(compliance.data.events.length > 0);
  assert.ok(compliance.data.reports.length > 0);

  await api(`/api/patients?practiceId=${PRACTICE_ID}`, { token: identities.front_desk.token });
  await api(`/api/patients?practiceId=${PRACTICE_ID}`, { token: identities.read_only.token });
  await api("/api/patients", {
    body: { displayName: "Forbidden", practiceId: PRACTICE_ID, primaryProviderId: provider.id },
    expected: [403],
    method: "POST",
    token: identities.front_desk.token,
  });
  await api("/api/patients", {
    body: { displayName: "Forbidden", practiceId: PRACTICE_ID, primaryProviderId: provider.id },
    expected: [403],
    method: "POST",
    token: identities.read_only.token,
  });
  await api(`/api/compliance/workflow?practiceId=${PRACTICE_ID}`, { expected: [403], token: identities.coordinator.token });
  await api("/api/billing/month", {
    body: { action: "reviewed", billingMonth: BILLING_MONTH, patientId: first.patient.id, practiceId: PRACTICE_ID },
    expected: [403],
    method: "PATCH",
    token: identities.coordinator.token,
  });

  const packet = await api(`/api/audit-packet?practiceId=${PRACTICE_ID}&patientId=${first.patient.id}&billingMonth=${BILLING_MONTH}`, { token: identities.compliance_administrator.token });
  assert.ok(packet.data.evidenceSnapshot?.id);

  console.log(JSON.stringify({
    complete: true,
    billingMonth: BILLING_MONTH,
    evidence: {
      auditSnapshot: true,
      billedPatients: billing.data.rows.length,
      clinicalReport: compliance.data.reports.length,
      opportunities: compliance.data.opportunities.length,
      workItemEvents: compliance.data.events.length,
    },
    navigationIdentities: Object.fromEntries(Object.entries(identities).filter(([role]) => ["coordinator", "provider", "compliance_administrator", "practice_administrator"].includes(role)).map(([role, identity]) => [role, { email: identity.email }])),
    panel: { nurseAssigned: 10, remoteCoordinatorAssigned: 40, total: panel.length },
    permissions: { billingLeastPrivilege: true, complianceLeastPrivilege: true, frontDeskReadOnly: true, readOnlyRole: true },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
