import type { AccessRole, CarePlanReviewStatus } from "./types.ts";

export type UniversalCareGuidance = {
  actionHref: string;
  actionLabel: string;
  audienceLabel: string;
  canWait: string;
  monthlyProgressLabel: string;
  monthlyProgressPercent: number;
  needsAttention: string;
  why: string;
};

export type UniversalCareGuidanceInput = {
  accessRoles: readonly AccessRole[];
  billingHref: string;
  carePlanHref: string;
  carePlanReviewStatus: CarePlanReviewStatus | null;
  checkInComplete: boolean;
  checkInExists: boolean;
  checkInHref: string;
  consentComplete: boolean;
  documentedMinutes: number;
  eligibilityComplete: boolean;
  eligibilityHref: string;
  intakeComplete: boolean;
  intakeHref: string;
  logTimeHref: string;
  patientEditHref: string;
  qualifyingConditionCount: number;
  thresholdMinutes: number;
};

function audienceLabel(accessRoles: readonly AccessRole[]): string {
  if (accessRoles.includes("provider")) return "Provider view";
  if (accessRoles.includes("clinical_staff")) return "Clinical staff view";
  if (accessRoles.includes("coordinator")) return "Coordinator view";
  if (accessRoles.includes("front_desk")) return "Front desk view";
  if (accessRoles.includes("compliance_administrator")) return "Compliance view";
  if (accessRoles.includes("billing_administrator")) return "Billing view";
  return "Practice operations view";
}

function withMonthlyProgress(
  input: UniversalCareGuidanceInput,
  guidance: Omit<UniversalCareGuidance, "audienceLabel" | "monthlyProgressLabel" | "monthlyProgressPercent">,
): UniversalCareGuidance {
  const threshold = Math.max(1, input.thresholdMinutes);
  const documented = Math.max(0, input.documentedMinutes);
  return {
    ...guidance,
    audienceLabel: audienceLabel(input.accessRoles),
    monthlyProgressLabel: `${documented} of ${threshold} CCM minutes documented`,
    monthlyProgressPercent: Math.min(100, Math.round((documented / threshold) * 100)),
  };
}

export function createUniversalCareGuidance(input: UniversalCareGuidanceInput): UniversalCareGuidance {
  const providerView = input.accessRoles.includes("provider");

  if (!input.eligibilityComplete) {
    return withMonthlyProgress(input, {
      actionHref: input.eligibilityHref,
      actionLabel: providerView ? "Review eligibility attestations" : "Complete eligibility review",
      canWait: "Monthly outreach and billing review can wait until eligibility is documented.",
      needsAttention: providerView ? "Eligibility needs a provider decision" : "Eligibility is incomplete",
      why: "CCM work should begin from documented eligibility facts and the required provider attestations.",
    });
  }

  if (input.qualifyingConditionCount < 2) {
    return withMonthlyProgress(input, {
      actionHref: input.patientEditHref,
      actionLabel: "Document qualifying conditions",
      canWait: "Questionnaire customization and billing review can wait until the condition list is complete.",
      needsAttention: "The CCM condition list is incomplete",
      why: "The patient needs at least two documented qualifying chronic conditions before the monthly workflow can be trusted.",
    });
  }

  if (!input.consentComplete) {
    return withMonthlyProgress(input, {
      actionHref: input.patientEditHref,
      actionLabel: "Document patient consent",
      canWait: "Routine monthly tasks can wait until consent status, date, method, and required elements are recorded.",
      needsAttention: "Patient consent needs documentation",
      why: "The care team needs a complete consent record before relying on the CCM workflow.",
    });
  }

  if (!input.intakeComplete) {
    return withMonthlyProgress(input, {
      actionHref: input.intakeHref,
      actionLabel: "Complete and review intake",
      canWait: "Billing preparation can wait. Capture the clinical baseline before building the ongoing plan.",
      needsAttention: "The clinical baseline is not yet reviewed",
      why: "A reviewed intake gives the care team the shared context needed for a useful care plan and monthly follow-up.",
    });
  }

  if (input.carePlanReviewStatus === "revision_requested") {
    return withMonthlyProgress(input, {
      actionHref: input.carePlanHref,
      actionLabel: providerView ? "Review care-plan revision" : "Address requested care-plan changes",
      canWait: "Routine documentation can wait until the requested clinical revision is resolved.",
      needsAttention: "The care plan needs revision",
      why: "A provider requested changes, so the current care plan should not be treated as complete.",
    });
  }

  if (!input.carePlanReviewStatus || ["draft", "coordinator_ready", "provider_review_required"].includes(input.carePlanReviewStatus)) {
    return withMonthlyProgress(input, {
      actionHref: input.carePlanHref,
      actionLabel: providerView ? "Review the care plan" : "Complete the care plan",
      canWait: "Billing preparation can wait until the plan contains the agreed goals and interventions.",
      needsAttention: providerView ? "The care plan is ready for your review" : "The care plan is not complete",
      why: "The monthly workflow needs an active, reviewed plan that tells the team what it is working toward.",
    });
  }

  if (!input.checkInExists) {
    return withMonthlyProgress(input, {
      actionHref: input.checkInHref,
      actionLabel: "Start this month's check-in",
      canWait: "Billing review can wait. Start the patient contact cycle while there is time to follow up.",
      needsAttention: "This month's patient check-in has not started",
      why: "A current check-in helps the care team identify changes, barriers, and work that requires follow-up.",
    });
  }

  if (!input.checkInComplete) {
    return withMonthlyProgress(input, {
      actionHref: input.checkInHref,
      actionLabel: "Continue the patient check-in",
      canWait: "Non-urgent configuration can wait until the current outreach outcome is documented.",
      needsAttention: "The patient check-in needs an outcome",
      why: "The contact attempt remains open until the response or an appropriate non-response outcome is documented.",
    });
  }

  if (input.documentedMinutes < input.thresholdMinutes) {
    return withMonthlyProgress(input, {
      actionHref: input.logTimeHref,
      actionLabel: "Continue clinically appropriate CCM work",
      canWait: "Billing review can wait. Do not create work only to reach a time threshold.",
      needsAttention: "The care cycle is active",
      why: "The required clinical steps are in place. Continue only patient-benefiting work and document actual time as it occurs.",
    });
  }

  return withMonthlyProgress(input, {
    actionHref: input.billingHref,
    actionLabel: providerView ? "Review patient summary" : "Review monthly evidence",
    canWait: "No new task should be invented. Respond only to new patient evidence or an assigned follow-up.",
    needsAttention: "The documented monthly workflow is ready for review",
    why: "Eligibility, consent, clinical planning, patient contact, and operational time are present for this month.",
  });
}
