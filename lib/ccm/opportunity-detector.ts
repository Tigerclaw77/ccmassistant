export const OPPORTUNITY_DETECTOR_VERSION = "ccm-opportunity-rules-v1";
export const CLINICAL_TRIGGER_CATALOG_VERSION = "ccm-clinical-trigger-catalog-v1";

export const OPPORTUNITY_TYPES = [
  "medication_follow_up",
  "hospital_discharge",
  "educational_reminder",
  "month_end_operational_reminder",
  "abnormal_questionnaire",
  "home_monitoring",
  "provider_review",
  "care_plan_revision",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const DEFAULT_OPPORTUNITY_EXPIRATION_DAYS: Record<OpportunityType, number> = {
  abnormal_questionnaire: 1,
  care_plan_revision: 7,
  educational_reminder: 14,
  home_monitoring: 7,
  hospital_discharge: 2,
  medication_follow_up: 7,
  month_end_operational_reminder: 3,
  provider_review: 3,
};

export const WORK_QUEUE_GROUPS = [
  "needs_attention",
  "ready_to_contact",
  "awaiting_patient",
  "awaiting_provider",
  "documentation_needed",
  "completed_today",
] as const;

export type WorkQueueGroup = (typeof WORK_QUEUE_GROUPS)[number];
export type WorkPriority = "urgent" | "high" | "normal" | "low" | "none";
export type OpportunityDisposition =
  | "accepted"
  | "different_action"
  | "provider_review"
  | "deferred"
  | "no_intervention";

export type EvidenceFact = {
  observedAt: string;
  sourceId: string;
  sourceType: "checkin_response" | "question_session_task" | "care_plan" | "communication" | "transition";
  summary: string;
};

export type DetectorInput = {
  abnormalResponses?: EvidenceFact[];
  carePlanRevisionRequested?: EvidenceFact;
  conditionName?: string | null;
  generatedAt: string;
  expirationDays?: Partial<Record<OpportunityType, number>>;
  monthEndUnresolvedCare?: EvidenceFact;
  openWorkflowTasks?: Array<EvidenceFact & {
    code: string;
    priority: "URGENT" | "HIGH" | "NORMAL" | "LOW" | "NONE";
    reviewTarget?: "coordinator" | "provider";
  }>;
  patientId: string;
  practiceId: string;
};

export type DetectedOpportunity = {
  benefitRationale: string;
  conditionOrWorkflowItem: string;
  detectorVersion: typeof OPPORTUNITY_DETECTOR_VERSION;
  eligiblePerformers: Array<"coordinator" | "clinical_staff" | "provider">;
  evidence: EvidenceFact[];
  generatedAt: string;
  expiresAt: string;
  inputFacts: Record<string, string | number | boolean | null>;
  patientId: string;
  practiceId: string;
  opportunityType: OpportunityType;
  providerInvolvement: "not_required" | "review_if_escalated" | "required";
  suggestedActivity: string;
  ruleIdentifier: string;
  ruleVersion: typeof CLINICAL_TRIGGER_CATALOG_VERSION;
  triggerCode: string;
  triggerSummary: string;
};

type RuleDefinition = Omit<DetectedOpportunity, "detectorVersion" | "evidence" | "expiresAt" | "generatedAt" | "inputFacts" | "patientId" | "practiceId" | "ruleVersion" | "triggerSummary">;

const TASK_RULES: Record<string, RuleDefinition> = {
  medication_access: {
    benefitRationale: "Addressing the documented medication barrier may improve access and adherence.",
    conditionOrWorkflowItem: "Medication access or adherence",
    eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
    providerInvolvement: "review_if_escalated",
    opportunityType: "medication_follow_up",
    ruleIdentifier: "CCM-MEDICATION-ACCESS-001",
    suggestedActivity: "Review the documented medication barrier and coordinate the appropriate follow-up.",
    triggerCode: "medication_access_barrier",
  },
  medication_adherence: {
    benefitRationale: "Following up on a documented adherence concern can identify a resolvable barrier.",
    conditionOrWorkflowItem: "Medication adherence",
    eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
    providerInvolvement: "review_if_escalated",
    opportunityType: "medication_follow_up",
    ruleIdentifier: "CCM-MEDICATION-ADHERENCE-001",
    suggestedActivity: "Review the adherence concern and document the patient-specific next step.",
    triggerCode: "medication_adherence_concern",
  },
  home_monitoring: {
    benefitRationale: "Reviewing the documented home-monitoring issue can clarify whether follow-up is needed.",
    conditionOrWorkflowItem: "Home monitoring log",
    eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
    providerInvolvement: "review_if_escalated",
    opportunityType: "home_monitoring",
    ruleIdentifier: "CCM-HOME-MONITORING-001",
    suggestedActivity: "Review the available home-monitoring information and resolve the documented barrier.",
    triggerCode: "home_monitoring_follow_up",
  },
  transition_of_care: {
    benefitRationale: "Timely follow-up after a documented care transition can reduce unresolved care-plan gaps.",
    conditionOrWorkflowItem: "Transition of care",
    eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
    providerInvolvement: "required",
    opportunityType: "hospital_discharge",
    ruleIdentifier: "CCM-TRANSITION-OF-CARE-001",
    suggestedActivity: "Reconcile the documented transition details and route clinical questions to the responsible provider.",
    triggerCode: "transition_of_care_follow_up",
  },
  provider_review: {
    benefitRationale: "The documented item requires clinical review before the workflow can safely continue.",
    conditionOrWorkflowItem: "Provider review",
    eligiblePerformers: ["provider"],
    providerInvolvement: "required",
    opportunityType: "provider_review",
    ruleIdentifier: "CCM-PROVIDER-REVIEW-001",
    suggestedActivity: "Review the documented clinical item and return instructions to the care team.",
    triggerCode: "provider_review_required",
  },
};

export function opportunityExpirationDays(
  opportunityType: OpportunityType,
  overrides: Partial<Record<OpportunityType, number>> = {},
): number {
  const override = overrides[opportunityType];
  return Number.isInteger(override) && Number(override) >= 1 && Number(override) <= 90
    ? Number(override)
    : DEFAULT_OPPORTUNITY_EXPIRATION_DAYS[opportunityType];
}

function expiresAt(generatedAt: string, opportunityType: OpportunityType, overrides: Partial<Record<OpportunityType, number>>): string {
  return new Date(new Date(generatedAt).getTime() + opportunityExpirationDays(opportunityType, overrides) * 86_400_000).toISOString();
}

function ruleForCode(code: string) {
  const normalized = code.toLowerCase();
  if (/medication.*(cost|access)/.test(normalized)) return TASK_RULES.medication_access;
  if (/medication.*(adherence|missed|taking)/.test(normalized)) return TASK_RULES.medication_adherence;
  if (/(blood_pressure|glucose|weight|home_monitor|log)/.test(normalized)) return TASK_RULES.home_monitoring;
  if (/(hospital|emergency|transition|discharge)/.test(normalized)) return TASK_RULES.transition_of_care;
  if (/(provider|clinical)_review/.test(normalized)) return TASK_RULES.provider_review;
  return null;
}

export function detectClinicalOpportunities(input: DetectorInput): DetectedOpportunity[] {
  const results: DetectedOpportunity[] = [];
  for (const response of input.abnormalResponses ?? []) {
    results.push({
      benefitRationale: "Reviewing a patient-reported abnormal response can identify whether timely follow-up or escalation is needed.",
      conditionOrWorkflowItem: input.conditionName ?? "Patient-reported response",
      detectorVersion: OPPORTUNITY_DETECTOR_VERSION,
      eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
      evidence: [response],
      generatedAt: input.generatedAt,
      expiresAt: expiresAt(input.generatedAt, "abnormal_questionnaire", input.expirationDays ?? {}),
      inputFacts: { abnormalResponse: true, evidenceSource: response.sourceType },
      patientId: input.patientId,
      practiceId: input.practiceId,
      opportunityType: "abnormal_questionnaire",
      providerInvolvement: "review_if_escalated",
      suggestedActivity: "Review the flagged response, contact the patient if appropriate, and route clinical findings when needed.",
      ruleIdentifier: "CCM-ABNORMAL-QUESTIONNAIRE-001",
      ruleVersion: CLINICAL_TRIGGER_CATALOG_VERSION,
      triggerCode: "abnormal_patient_response",
      triggerSummary: response.summary,
    });
  }

  for (const task of input.openWorkflowTasks ?? []) {
    const rule = ruleForCode(task.code) ?? (task.reviewTarget === "provider" ? TASK_RULES.provider_review : null);
    if (!rule) continue;
    results.push({
      ...rule,
      detectorVersion: OPPORTUNITY_DETECTOR_VERSION,
      evidence: [task],
      generatedAt: input.generatedAt,
      expiresAt: expiresAt(input.generatedAt, rule.opportunityType, input.expirationDays ?? {}),
      inputFacts: { evidenceSource: task.sourceType, priority: task.priority, taskCode: task.code },
      patientId: input.patientId,
      practiceId: input.practiceId,
      ruleVersion: CLINICAL_TRIGGER_CATALOG_VERSION,
      triggerSummary: task.summary,
    });
  }

  if (input.carePlanRevisionRequested) {
    results.push({
      benefitRationale: "Resolving the requested revision keeps the care plan aligned with the provider's documented instructions.",
      conditionOrWorkflowItem: "Care-plan revision",
      detectorVersion: OPPORTUNITY_DETECTOR_VERSION,
      eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
      evidence: [input.carePlanRevisionRequested],
      generatedAt: input.generatedAt,
      expiresAt: expiresAt(input.generatedAt, "care_plan_revision", input.expirationDays ?? {}),
      inputFacts: { revisionRequested: true },
      patientId: input.patientId,
      practiceId: input.practiceId,
      opportunityType: "care_plan_revision",
      providerInvolvement: "required",
      suggestedActivity: "Review the requested revision, update the care plan, and return it for provider review.",
      ruleIdentifier: "CCM-CARE-PLAN-REVISION-001",
      ruleVersion: CLINICAL_TRIGGER_CATALOG_VERSION,
      triggerCode: "care_plan_revision_requested",
      triggerSummary: input.carePlanRevisionRequested.summary,
    });
  }

  if (input.monthEndUnresolvedCare && !results.some((item) => item.evidence.some((evidence) => evidence.sourceId === input.monthEndUnresolvedCare?.sourceId))) {
    results.push({
      benefitRationale: "Resolving an already documented care activity before the monthly care cycle closes may prevent a clinically relevant follow-up from carrying forward unnecessarily.",
      conditionOrWorkflowItem: "Unresolved monthly care activity",
      detectorVersion: OPPORTUNITY_DETECTOR_VERSION,
      eligiblePerformers: ["coordinator", "clinical_staff", "provider"],
      evidence: [input.monthEndUnresolvedCare],
      expiresAt: expiresAt(input.generatedAt, "month_end_operational_reminder", input.expirationDays ?? {}),
      generatedAt: input.generatedAt,
      inputFacts: { monthEnd: true, unresolvedCareActivity: true },
      opportunityType: "month_end_operational_reminder",
      patientId: input.patientId,
      practiceId: input.practiceId,
      providerInvolvement: "review_if_escalated",
      ruleIdentifier: "CCM-MONTH-END-UNRESOLVED-CARE-001",
      ruleVersion: CLINICAL_TRIGGER_CATALOG_VERSION,
      suggestedActivity: "Review whether the unresolved care activity remains clinically appropriate to complete this month.",
      triggerCode: "month_end_unresolved_care_activity",
      triggerSummary: input.monthEndUnresolvedCare.summary,
    });
  }

  return results.filter((item, index, all) =>
    all.findIndex((candidate) => candidate.ruleIdentifier === item.ruleIdentifier && candidate.evidence[0]?.sourceId === item.evidence[0]?.sourceId) === index,
  );
}

export type PriorityFactor = {
  code: string;
  explanation: string;
  weight: number;
};

export type PriorityInput = {
  abnormalResponse?: boolean;
  awaitingPatient?: boolean;
  completedToday?: boolean;
  documentationIncomplete?: boolean;
  manualOverride?: Exclude<WorkPriority, "none"> | null;
  manualOverrideReason?: string | null;
  monthEnd?: boolean;
  openCarePlanTask?: boolean;
  overdueOutreach?: boolean;
  providerRevision?: boolean;
  providerReview?: boolean;
  thresholdProximity?: boolean;
  transitionOfCare?: boolean;
  urgent?: boolean;
};

export type PrioritizedWork = {
  explanation: string;
  factors: PriorityFactor[];
  group: WorkQueueGroup;
  priority: WorkPriority;
  score: number;
};

export function prioritizeWork(input: PriorityInput): PrioritizedWork {
  const factors: PriorityFactor[] = [];
  const add = (enabled: boolean | undefined, code: string, weight: number, explanation: string) => {
    if (enabled) factors.push({ code, explanation, weight });
  };
  add(input.urgent, "urgent_response", 1000, "Urgent response or red flag");
  add(input.abnormalResponse, "abnormal_response", 850, "Unanswered or abnormal patient response");
  add(input.transitionOfCare, "transition_of_care", 800, "Recent transition of care requires follow-up");
  add(input.providerRevision, "provider_revision", 750, "Provider requested a revision");
  add(input.overdueOutreach, "overdue_outreach", 600, "Patient outreach is overdue");
  add(input.providerReview, "provider_review", 550, "Provider review is pending");
  add(input.openCarePlanTask, "open_care_plan_task", 450, "Care-plan task remains open");
  add(input.documentationIncomplete, "documentation_incomplete", 350, "Documentation is incomplete");
  const supported = factors.length > 0;
  add(input.monthEnd && supported, "month_end", 75, "Month-end timing increases operational urgency");
  add(input.thresholdProximity && supported, "threshold_proximity", 25, "Monthly threshold is nearby; shown only as secondary context");
  if (input.manualOverride) {
    if (!input.manualOverrideReason?.trim()) throw new Error("Manual priority requires a reason");
    const weights: Record<Exclude<WorkPriority, "none">, number> = { urgent: 1100, high: 700, normal: 300, low: 100 };
    factors.push({ code: "manual_override", explanation: input.manualOverrideReason.trim(), weight: weights[input.manualOverride] });
  }
  factors.sort((left, right) => right.weight - left.weight || left.code.localeCompare(right.code));
  const score = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const priority: WorkPriority = input.manualOverride ?? (score >= 900 ? "urgent" : score >= 550 ? "high" : score >= 300 ? "normal" : score > 0 ? "low" : "none");
  const group: WorkQueueGroup = input.completedToday
    ? "completed_today"
    : input.providerReview || input.providerRevision
      ? "awaiting_provider"
      : input.awaitingPatient
        ? "awaiting_patient"
        : input.documentationIncomplete
          ? "documentation_needed"
          : input.overdueOutreach
            ? "ready_to_contact"
            : "needs_attention";
  return { explanation: factors[0]?.explanation ?? "No clinically or operationally supported activity", factors, group, priority, score };
}

export function dispositionCreatesTask(disposition: OpportunityDisposition): boolean {
  return ["accepted", "different_action", "provider_review"].includes(disposition);
}

export function validateActualReviewTime(minutes: number | null, affirmed: boolean): void {
  if (minutes === null) return;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error("Actual review time must be a whole number from 1 to 1440");
  if (!affirmed) throw new Error("Actual review time requires affirmative attestation");
}

export function isStaleOpportunity(generatedAt: string, expiresAt: string | null, now: string): boolean {
  const boundary = expiresAt ?? new Date(new Date(generatedAt).getTime() + 7 * 86_400_000).toISOString();
  return new Date(now).getTime() >= new Date(boundary).getTime();
}

export function ordinaryEmailNotification(): { body: string; containsPhi: false; subject: string } {
  return {
    body: "A secure CCM Assistant item is ready for your review. Sign in to the secure workspace to view details.",
    containsPhi: false,
    subject: "Secure CCM Assistant item ready for review",
  };
}
