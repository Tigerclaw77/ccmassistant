import type {
  CarePlan,
  CarePlanReviewStatus,
  CcmEnrollment,
  CheckinInstance,
  MonthlyBillability,
  Patient,
  PatientCondition,
  PatientIntakeSummary,
  Provider,
  QuestionSessionRecord,
} from "./types.ts";
import { allConsentElementsComplete } from "./consent.ts";
import { allEligibilityFactsComplete, allProviderAttestationsComplete } from "./eligibility.ts";
import { sessionStateFromJson } from "./session-integration.ts";
import { classifyStaffQueues, remainingMinutes, type StaffQueueKey } from "./staff-experience.ts";
import { prioritizeWork, type WorkQueueGroup } from "./opportunity-detector.ts";

export type WorklistPriority = "urgent" | "high" | "normal" | "low" | "none";

export type WorklistRow = {
  assignedCoordinatorId: string | null;
  billingMonth: string;
  carePlanReviewStatus: CarePlanReviewStatus | null;
  documentedMinutes: number;
  dob: string | null;
  externalId: string | null;
  nextAction: string;
  nextActionUrl: string;
  owner: string;
  patientId: string;
  patientName: string;
  phone: string | null;
  practitioner: string | null;
  priority: WorklistPriority;
  priorityReason: string;
  queueGroup: WorkQueueGroup;
  queueKeys: StaffQueueKey[];
  reasonCodes: string[];
  readinessStatus: string;
  remainingMinutes: number;
};

export type WorklistSource = {
  billability: MonthlyBillability[];
  carePlans: CarePlan[];
  checkIns: CheckinInstance[];
  conditions: PatientCondition[];
  enrollments: CcmEnrollment[];
  intakeSummaries: PatientIntakeSummary[];
  minutesByPatientId: Record<string, number>;
  monthEnd?: boolean;
  patients: Patient[];
  practiceAttestationComplete: boolean;
  providers: Provider[];
  sessions: QuestionSessionRecord[];
};

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 5,
  HIGH: 4,
  NORMAL: 3,
  LOW: 2,
  NONE: 1,
};

const REASON_ACTIONS: Record<string, { action: string; path: string; priority: WorklistPriority }> = {
  incomplete_practice_attestation: { action: "Complete practice billing attestations", path: "/settings#practice", priority: "high" },
  missing_enrollment: { action: "Activate CCM enrollment", path: "patient", priority: "high" },
  ineligible_enrollment: { action: "Complete eligibility review", path: "eligibility", priority: "high" },
  missing_eligibility_facts: { action: "Complete eligibility facts", path: "eligibility", priority: "high" },
  missing_provider_attestation: { action: "Await provider eligibility attestation", path: "eligibility", priority: "high" },
  missing_consent: { action: "Record CCM consent", path: "patient", priority: "high" },
  missing_consent_date: { action: "Add consent date", path: "patient", priority: "high" },
  missing_consent_method: { action: "Record consent method", path: "patient", priority: "high" },
  missing_consent_elements: { action: "Complete consent documentation", path: "patient", priority: "high" },
  missing_condition: { action: "Add qualifying chronic conditions", path: "patient", priority: "high" },
  insufficient_chronic_conditions: { action: "Add another qualifying chronic condition", path: "patient", priority: "high" },
  missing_provider: { action: "Assign billing practitioner", path: "patient", priority: "high" },
  provider_manual_review_required: { action: "Resolve practitioner review", path: "/settings#providers", priority: "high" },
  missing_reviewed_intake: { action: "Complete patient intake", path: "intake", priority: "normal" },
  missing_care_plan: { action: "Create care plan", path: "care-plan", priority: "normal" },
  incomplete_care_plan: { action: "Complete care plan review", path: "care-plan", priority: "normal" },
  missing_checkin: { action: "Create monthly check-in", path: "checkin", priority: "normal" },
  missing_checkin_response: { action: "Complete monthly check-in", path: "checkin", priority: "normal" },
};

function patientPath(patientId: string, path: string): string {
  if (path.startsWith("/")) return path;
  if (path === "patient") return `/patients/${patientId}?edit=1`;
  if (path === "log") return `/dashboard/log/${patientId}`;
  return `/patients/${patientId}/${path}`;
}

function latestByPatient<T extends { patient_id: string; updated_at: string }>(rows: T[]): Map<string, T> {
  const result = new Map<string, T>();
  for (const row of rows) {
    const current = result.get(row.patient_id);
    if (!current || row.updated_at > current.updated_at) result.set(row.patient_id, row);
  }
  return result;
}

function highestSessionTask(sessions: QuestionSessionRecord[], patientId: string) {
  return sessions
    .filter((record) => record.patient_id === patientId && record.status !== "cancelled")
    .flatMap((record) => sessionStateFromJson(record.session_state).tasks)
    .filter((task) => task.status === "open")
    .sort((a, b) => (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0))[0];
}

function fallbackReasonCodes(args: {
  carePlan?: CarePlan;
  checkIn?: CheckinInstance;
  conditions: PatientCondition[];
  enrollment?: CcmEnrollment;
  intake?: PatientIntakeSummary;
  minutes: number;
  patient: Patient;
  provider?: Provider;
  threshold: number;
}): string[] {
  const reasons: string[] = [];
  const enrollment = args.enrollment;
  if (enrollment?.status !== "active") reasons.push("missing_enrollment");
  if (enrollment?.eligibility_status !== "eligible") reasons.push("ineligible_enrollment");
  if (!allEligibilityFactsComplete(enrollment?.eligibility_metadata)) reasons.push("missing_eligibility_facts");
  if (!allProviderAttestationsComplete(enrollment?.eligibility_metadata)) reasons.push("missing_provider_attestation");
  if (enrollment?.consent_status !== "obtained") reasons.push("missing_consent");
  if (!enrollment?.consent_date) reasons.push("missing_consent_date");
  if (!enrollment || !["verbal", "written", "electronic"].includes(enrollment.consent_method)) reasons.push("missing_consent_method");
  if (!allConsentElementsComplete(enrollment?.consent_metadata)) reasons.push("missing_consent_elements");
  const conditionCount = args.conditions.filter((item) => item.is_active && item.ccm_qualifying).length;
  if (conditionCount < 2) reasons.push(conditionCount ? "insufficient_chronic_conditions" : "missing_condition");
  if (!(enrollment?.assigned_provider_id || args.patient.primary_provider_id)) reasons.push("missing_provider");
  if (args.provider?.manual_review_status === "needs_review") reasons.push("provider_manual_review_required");
  if (!args.intake) reasons.push("missing_reviewed_intake");
  if (!args.carePlan) reasons.push("missing_care_plan");
  else if (
    !args.carePlan.last_reviewed_at ||
    ((!Array.isArray(args.carePlan.goals) || args.carePlan.goals.length === 0) &&
      (!Array.isArray(args.carePlan.interventions) || args.carePlan.interventions.length === 0))
  ) reasons.push("incomplete_care_plan");
  if (!args.checkIn) reasons.push("missing_checkin");
  else if (!["responded", "closed"].includes(args.checkIn.status)) reasons.push("missing_checkin_response");
  return reasons;
}

export function composeWorklistRows(source: WorklistSource, billingMonth: string, threshold: number): WorklistRow[] {
  const enrollments = latestByPatient(source.enrollments);
  const carePlans = latestByPatient(source.carePlans);
  const intakes = latestByPatient(source.intakeSummaries.filter((row) => row.status === "accepted"));
  const checkIns = latestByPatient(source.checkIns.filter((row) => row.billing_month === billingMonth));
  const billability = new Map(source.billability.map((row) => [row.patient_id, row]));
  const providers = new Map(source.providers.map((row) => [row.id, row]));

  return source.patients.map((patient) => {
    const enrollment = enrollments.get(patient.id);
    const providerId = enrollment?.assigned_provider_id ?? patient.primary_provider_id;
    const provider = providerId ? providers.get(providerId) : undefined;
    const minutes = source.minutesByPatientId[patient.id] ?? 0;
    const monthly = billability.get(patient.id);
    const task = highestSessionTask(source.sessions, patient.id);
    const carePlan = carePlans.get(patient.id);
    const reasons = monthly?.reason_codes?.length ? monthly.reason_codes : [
      ...(source.practiceAttestationComplete ? [] : ["incomplete_practice_attestation"]),
      ...fallbackReasonCodes({
      carePlan,
      checkIn: checkIns.get(patient.id),
      conditions: source.conditions.filter((row) => row.patient_id === patient.id),
      enrollment,
      intake: intakes.get(patient.id),
      minutes,
      patient,
      provider,
      threshold,
      }),
    ];
    const reasonAction = REASON_ACTIONS[reasons[0]];
    const taskAction = task ? {
      action: task.type.replaceAll("_", " "),
      path: task.reviewTarget === "provider" ? "patient" : "checkin",
      priority: task.priority.toLowerCase() as WorklistPriority,
    } : null;
    const next = taskAction && (PRIORITY_ORDER[task?.priority ?? "NONE"] ?? 0) >= 4
      ? taskAction
      : reasonAction;
    const ready = monthly?.status === "ready_to_bill" || monthly?.status === "billed";
    const taskCode = task?.type?.toLowerCase() ?? "";
    const priorityResult = prioritizeWork({
      abnormalResponse: Boolean(task && task.priority === "URGENT"),
      awaitingPatient: reasons.includes("missing_checkin_response"),
      documentationIncomplete: reasons.some((code) => ["missing_reviewed_intake", "missing_care_plan", "incomplete_care_plan"].includes(code)),
      monthEnd: source.monthEnd === true,
      openCarePlanTask: Boolean(task && /(care_plan|goal|barrier)/.test(taskCode)),
      overdueOutreach: reasons.includes("missing_checkin") || reasons.includes("missing_checkin_response"),
      providerRevision: carePlan?.review_status === "revision_requested",
      providerReview: task?.reviewTarget === "provider" || reasons.includes("missing_provider_attestation"),
      thresholdProximity: minutes < threshold && threshold - minutes <= 5,
      transitionOfCare: /(hospital|emergency|transition|discharge)/.test(taskCode),
      urgent: task?.priority === "URGENT",
    });

    const baseRow = {
      assignedCoordinatorId: enrollment?.care_coordinator_member_id ?? patient.care_coordinator_member_id,
      billingMonth,
      carePlanReviewStatus: carePlan?.review_status ?? null,
      documentedMinutes: minutes,
      dob: patient.dob,
      externalId: patient.external_id,
      nextAction: next?.action ?? (ready ? "Review billing evidence" : "Recalculate billing readiness"),
      nextActionUrl: next
        ? patientPath(patient.id, next.path)
        : `/dashboard/billing/${patient.id}/${billingMonth}`,
      owner: task?.reviewTarget === "provider" ? "Provider" : "Coordinator",
      patientId: patient.id,
      patientName: patient.display_name,
      phone: patient.phone,
      practitioner: provider?.full_name ?? null,
      priority: priorityResult.priority === "none" ? next?.priority ?? "none" : priorityResult.priority,
      priorityReason: priorityResult.explanation,
      queueGroup: priorityResult.group,
      reasonCodes: reasons,
      readinessStatus: monthly?.status ?? "not_calculated",
      remainingMinutes: remainingMinutes(minutes, threshold),
    };

    return {
      ...baseRow,
      queueKeys: classifyStaffQueues(baseRow, threshold),
    };
  });
}
