export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type PracticeRole =
  | "owner"
  | "provider"
  | "coordinator"
  | "billing_staff"
  | "admin";

export const ACCESS_ROLES = [
  "organization_owner",
  "practice_administrator",
  "department_administrator",
  "compliance_administrator",
  "billing_administrator",
  "provider",
  "clinical_staff",
  "coordinator",
  "front_desk",
  "read_only",
  "patient",
] as const;

export type AccessRole = (typeof ACCESS_ROLES)[number];

export const BILLING_PRACTITIONER_TYPES = [
  "physician",
  "nurse_practitioner",
  "physician_assistant",
  "clinical_nurse_specialist",
  "certified_nurse_midwife",
  "registered_nurse",
  "medical_assistant",
  "other",
] as const;

export type BillingPractitionerType = (typeof BILLING_PRACTITIONER_TYPES)[number];

export const SUPPORTED_BILLING_PRACTITIONER_TYPES = [
  "physician",
  "nurse_practitioner",
  "physician_assistant",
  "clinical_nurse_specialist",
  "certified_nurse_midwife",
] as const satisfies readonly BillingPractitionerType[];

export const PROVIDER_MANUAL_REVIEW_STATUSES = [
  "not_required",
  "needs_review",
  "reviewed",
] as const;

export type ProviderManualReviewStatus = (typeof PROVIDER_MANUAL_REVIEW_STATUSES)[number];

export function isSupportedBillingPractitionerType(
  type: BillingPractitionerType | string | null | undefined,
): boolean {
  return SUPPORTED_BILLING_PRACTITIONER_TYPES.includes(
    type as (typeof SUPPORTED_BILLING_PRACTITIONER_TYPES)[number],
  );
}

export type MembershipStatus = "invited" | "active" | "inactive";
export type ContactMethod = "phone" | "sms" | "email" | "portal" | "none";
export const CONTACT_METHODS = ["phone", "sms", "email", "portal", "none"] as const;
export type EligibilityStatus = "needs_review" | "eligible" | "ineligible";
export const ELIGIBILITY_STATUSES = ["needs_review", "eligible", "ineligible"] as const;
export type ConsentStatus = "not_collected" | "obtained" | "declined" | "revoked";
export const CONSENT_STATUSES = ["not_collected", "obtained", "declined", "revoked"] as const;
export type ConsentMethod = "verbal" | "written" | "electronic" | "unknown";
export const CONSENT_METHODS = ["verbal", "written", "electronic", "unknown"] as const;
export type EnrollmentStatus = "pending" | "active" | "paused" | "inactive" | "declined";
export const ENROLLMENT_STATUSES = ["pending", "active", "paused", "inactive", "declined"] as const;
export type QuestionSource = "global" | "practice" | "provider" | "ai_candidate";
export type QuestionStatus = "draft" | "active" | "archived" | "rejected";
export type AnswerType = "yes_no" | "text" | "number" | "scale" | "multi_choice" | "date";
export type QuestionPreference = "favorite" | "preferred" | "avoid";

export const CONDITION_NORMALIZATION_STATUSES = [
  "normalized",
  "manual",
  "unverified",
] as const;

export type ConditionNormalizationStatus =
  (typeof CONDITION_NORMALIZATION_STATUSES)[number];

export const CLINICAL_ANSWER_TYPES = [
  "yes_no",
  "multiple_choice",
  "numeric",
  "free_text",
  "date",
  "scale_1_10",
  "blood_pressure",
  "blood_sugar",
  "weight",
  "temperature",
  "pulse",
  "pulse_ox",
  "medication_list",
  "structured_measurement",
] as const;

export type ClinicalAnswerType = (typeof CLINICAL_ANSWER_TYPES)[number];

export const CLINICAL_IMPORTANCE_LEVELS = [
  "routine",
  "elevated",
  "high",
  "critical",
] as const;

export type ClinicalImportance = (typeof CLINICAL_IMPORTANCE_LEVELS)[number];

export const CHECKIN_STATUSES = [
  "draft",
  "ready",
  "sent",
  "responded",
  "no_response",
  "follow_up_needed",
  "closed",
] as const;

export type CheckinStatus = (typeof CHECKIN_STATUSES)[number];

export const LEGACY_ASSIGNMENT_STATUS_MAP = {
  pending: "sent",
  responded: "responded",
  no_response_confirmed: "no_response",
  completed: "responded",
} as const satisfies Record<string, CheckinStatus>;

export type ActivityType =
  | "call"
  | "voicemail"
  | "failed_attempt"
  | "care_review"
  | "care_coordination"
  | "checkin_review"
  | "portal_message"
  | "documentation"
  | "other";

export const ACTIVITY_TYPES = [
  "call",
  "voicemail",
  "failed_attempt",
  "care_review",
  "care_coordination",
  "checkin_review",
  "portal_message",
  "documentation",
  "other",
] as const;

export type InteractionSource =
  | "manual"
  | "check_in"
  | "call"
  | "portal"
  | "care_coordination"
  | "import";

export const INTERACTION_SOURCES = [
  "manual",
  "check_in",
  "call",
  "portal",
  "care_coordination",
  "import",
] as const;

export type CarePlanStatus = "draft" | "active" | "archived";
export const CARE_PLAN_STATUSES = ["draft", "active", "archived"] as const;
export type BillabilityStatus = "not_ready" | "ready_to_bill" | "billed" | "hold" | "ineligible";

export type TimestampedRow = {
  id: UUID;
  created_by: UUID | null;
  updated_by: UUID | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type PracticeScopedRow = TimestampedRow & {
  practice_id: UUID;
};

export type Practice = TimestampedRow & {
  organization_id: UUID;
  name: string;
  slug: string | null;
  npi: string | null;
  tax_id: string | null;
  default_timezone: string;
  ccm_monthly_min_minutes: number;
  billing_settings: JsonValue;
  account_status: string;
  subscription_provider: string | null;
  subscription_external_id: string | null;
  primary_address: JsonValue | null;
  phone: string | null;
  logo_url: string | null;
  coordinator_settings: JsonValue;
  notification_defaults: JsonValue;
  ccm_month_end_awareness_day: number;
  allow_coordinator_claiming: boolean;
  opportunity_expiration_overrides: JsonValue;
  setup_completed_at: ISODateTimeString | null;
};

export type Organization = TimestampedRow & {
  name: string;
  slug: string;
  organization_type:
    | "independent_practice"
    | "group_practice"
    | "health_system"
    | "fqhc"
    | "other";
};

export type OrganizationMember = TimestampedRow & {
  organization_id: UUID;
  user_id: UUID;
  role: "organization_owner";
  status: MembershipStatus;
};

export type PracticeMember = PracticeScopedRow & {
  user_id: UUID | null;
  invited_email: string | null;
  role: PracticeRole;
  status: MembershipStatus;
  disabled_at: ISODateTimeString | null;
  removed_at: ISODateTimeString | null;
  last_role_changed_at: ISODateTimeString | null;
};

export type PracticeMemberRoleAssignment = {
  id: UUID;
  practice_id: UUID;
  member_id: UUID;
  user_id: UUID | null;
  role: Exclude<AccessRole, "organization_owner" | "patient">;
  department_id: UUID | null;
  status: MembershipStatus;
  valid_from: ISODateTimeString;
  valid_until: ISODateTimeString | null;
  assigned_by: UUID | null;
  created_at: ISODateTimeString;
};

export type ProviderStaffAssignment = {
  id: UUID;
  practice_id: UUID;
  provider_id: UUID;
  staff_member_id: UUID;
  responsibility: string | null;
  active_from: ISODateTimeString;
  active_until: ISODateTimeString | null;
  assigned_by: UUID | null;
  created_at: ISODateTimeString;
};

export type PatientAccessMembership = {
  id: UUID;
  practice_id: UUID;
  patient_id: UUID;
  user_id: UUID;
  role: "patient";
  status: MembershipStatus;
  created_by: UUID | null;
  created_at: ISODateTimeString;
};

export type PatientPrimaryProviderHistory = {
  id: UUID;
  practice_id: UUID;
  patient_id: UUID;
  previous_provider_id: UUID | null;
  provider_id: UUID;
  effective_at: ISODateTimeString;
  changed_by: UUID | null;
  change_reason: string | null;
  created_at: ISODateTimeString;
};

export type StaffInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired"
  | "delivery_failed";

export type PracticeStaffInvitation = {
  id: UUID;
  practice_id: UUID;
  member_id: UUID;
  email: string;
  role: PracticeRole;
  status: StaffInvitationStatus;
  expires_at: ISODateTimeString;
  sent_at: ISODateTimeString | null;
  accepted_at: ISODateTimeString | null;
  cancelled_at: ISODateTimeString | null;
  resend_count: number;
  auth_user_id: UUID | null;
  invited_by: UUID;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type Provider = PracticeScopedRow & {
  member_id: UUID | null;
  full_name: string;
  credentials: string | null;
  npi: string | null;
  phone: string | null;
  email: string | null;
  is_billing_provider: boolean;
  is_active: boolean;
  deactivated_at: ISODateTimeString | null;
  archived_at: ISODateTimeString | null;
  billing_practitioner_type: BillingPractitionerType;
  manual_review_status: ProviderManualReviewStatus;
  manual_review_reason: string | null;
};

export type ProviderPreferences = PracticeScopedRow & {
  provider_id: UUID;
  monthly_question_soft_cap: number;
  condition_question_soft_cap: number;
  settings: JsonValue;
};

export type Patient = PracticeScopedRow & {
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  dob: ISODateString | null;
  phone: string | null;
  email: string | null;
  preferred_contact_method: ContactMethod;
  status: string;
  primary_provider_id: UUID | null;
  care_coordinator_member_id: UUID | null;
  metadata: JsonValue;
};

export type PatientCondition = PracticeScopedRow & {
  patient_id: UUID;
  condition_name: string;
  display_name: string | null;
  canonical_name: string | null;
  user_entered_text: string | null;
  code_system: string | null;
  code: string | null;
  ccm_qualifying: boolean;
  normalization_status: ConditionNormalizationStatus;
  is_active: boolean;
  diagnosed_on: ISODateString | null;
  notes: string | null;
};

export type CcmEnrollment = PracticeScopedRow & {
  patient_id: UUID;
  status: EnrollmentStatus;
  eligibility_status: EligibilityStatus;
  eligibility_notes: string | null;
  eligibility_metadata: JsonValue;
  consent_status: ConsentStatus;
  consent_date: ISODateString | null;
  consent_method: ConsentMethod;
  consent_document_url: string | null;
  consent_metadata: JsonValue;
  initiating_visit_date: ISODateString | null;
  assigned_provider_id: UUID | null;
  care_coordinator_member_id: UUID | null;
  enrolled_at: ISODateTimeString | null;
  ended_at: ISODateTimeString | null;
};

export type Question = TimestampedRow & {
  practice_id: UUID | null;
  provider_id: UUID | null;
  source: QuestionSource;
  status: QuestionStatus;
  prompt: string;
  answer_type: AnswerType;
  options: JsonValue;
  monthly_soft_cap: number;
  ai_candidate_metadata: JsonValue;
  approved_by: UUID | null;
  approved_at: ISODateTimeString | null;
};

export type QuestionTag = {
  id: UUID;
  practice_id: UUID | null;
  question_id: UUID;
  tag: string;
  tag_type: string;
  condition_code: string | null;
  created_at: ISODateTimeString;
};

export type Icd10Code = {
  code: string;
  description: string;
  category: string | null;
  is_billable: boolean;
  active: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type ManagementCluster = {
  id: UUID;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  active: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type ClusterIcd10Map = {
  cluster_id: UUID;
  icd10_code: string;
  mapping_type: string;
  notes: string | null;
  created_at: ISODateTimeString;
};

export type ClinicalObjective = {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type ClusterObjectiveMap = {
  cluster_id: UUID;
  objective_id: UUID;
  priority: number;
  created_at: ISODateTimeString;
};

export type QuestionFamily = {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  suggested_cadence: string;
  active: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type ObjectiveFamilyMap = {
  objective_id: UUID;
  family_id: UUID;
  priority: number;
  created_at: ISODateTimeString;
};

export type ClinicalQuestion = {
  id: UUID;
  slug: string;
  question_text: string;
  description: string | null;
  answer_type: ClinicalAnswerType;
  options: JsonValue;
  required: boolean;
  severity: number;
  clinical_importance: ClinicalImportance;
  suggested_cadence: string;
  follow_up_trigger: JsonValue;
  provider_review_required: boolean;
  retired: boolean;
  version: number;
  active: boolean;
  language: string;
  metadata: JsonValue;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type QuestionFamilyMember = {
  family_id: UUID;
  question_id: UUID;
  sort_order: number;
  required_override: boolean | null;
  created_at: ISODateTimeString;
};

export type ClinicalQuestionTag = {
  question_id: UUID;
  tag: string;
  tag_type: string;
  created_at: ISODateTimeString;
};

export type QuestionVersion = {
  id: UUID;
  question_id: UUID;
  version: number;
  question_text: string;
  description: string | null;
  answer_type: ClinicalAnswerType;
  options: JsonValue;
  change_note: string | null;
  created_at: ISODateTimeString;
};

export type QuestionDependency = {
  id: UUID;
  question_id: UUID;
  depends_on_question_id: UUID;
  operator: string;
  expected_value: JsonValue;
  action: string;
  metadata: JsonValue;
  created_at: ISODateTimeString;
};

export type QuestionRotationRule = {
  id: UUID;
  family_id: UUID | null;
  question_id: UUID | null;
  rule_type: string;
  cadence: string;
  max_questions_per_checkin: number | null;
  min_days_between: number | null;
  metadata: JsonValue;
  created_at: ISODateTimeString;
};

export type ProviderQuestionPreference = PracticeScopedRow & {
  provider_id: UUID;
  question_id: UUID;
  preference: QuestionPreference;
  condition_tag: string | null;
  sort_order: number;
  monthly_soft_cap: number | null;
  is_active: boolean;
};

export type PatientQuestionPreference = PracticeScopedRow & {
  patient_id: UUID;
  question_id: UUID;
  patient_condition_id: UUID | null;
  preference: QuestionPreference;
  notes: string | null;
  is_active: boolean;
};

export type QuestionBankCustomizationScope = "clinic" | "provider" | "coordinator";
export type QuestionBankCustomizationState = "active" | "retired";

export type QuestionBankOverrideVersionRecord = {
  id: UUID;
  practice_id: UUID;
  scope: QuestionBankCustomizationScope;
  provider_id: UUID | null;
  coordinator_member_id: UUID | null;
  bank_id: string;
  canonical_condition_id: string;
  version: number;
  state: QuestionBankCustomizationState;
  changes: JsonValue;
  change_note: string | null;
  created_by: UUID;
  created_at: ISODateTimeString;
};

export type QuestionBankCustomQuestionVersionRecord = {
  id: UUID;
  question_key: string;
  practice_id: UUID;
  owner_id: UUID;
  scope: "clinic";
  canonical_condition_id: string;
  question_text: string;
  helper_text: string;
  answer_type: string;
  contexts: string[];
  version: number;
  state: QuestionBankCustomizationState;
  created_by: UUID;
  created_at: ISODateTimeString;
};

export type QuestionBankFavoriteVersionRecord = {
  id: UUID;
  practice_id: UUID;
  scope: QuestionBankCustomizationScope;
  provider_id: UUID | null;
  coordinator_member_id: UUID | null;
  canonical_condition_id: string;
  favorite: boolean;
  display_order: number;
  version: number;
  state: QuestionBankCustomizationState;
  created_by: UUID;
  created_at: ISODateTimeString;
};

export type QuestionContributionCandidateRecord = {
  id: UUID;
  practice_id: UUID;
  canonical_condition_id: string;
  question_text: string;
  context: string;
  usage_count: number;
  opt_in_status: "not_opted_in" | "opted_in" | "withdrawn";
  anonymous: boolean;
  no_phi_attested: boolean;
  created_by: UUID | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type CheckinTemplate = PracticeScopedRow & {
  provider_id: UUID | null;
  name: string;
  description: string | null;
  cadence: string;
  status: string;
  default_question_ids: UUID[];
};

export type CheckinInstance = PracticeScopedRow & {
  patient_id: UUID;
  enrollment_id: UUID | null;
  template_id: UUID | null;
  provider_id: UUID | null;
  billing_month: ISODateString;
  status: CheckinStatus;
  token: string | null;
  token_expires_at: ISODateTimeString | null;
  sent_at: ISODateTimeString | null;
  responded_at: ISODateTimeString | null;
  followup_due_at: ISODateTimeString | null;
  no_response_at: ISODateTimeString | null;
  closed_at: ISODateTimeString | null;
  metadata: JsonValue;
};

export type CheckinDeliveryStatus =
  | "pending"
  | "delivered"
  | "opened"
  | "completed"
  | "expired"
  | "failed"
  | "cancelled";

export type CheckinDelivery = {
  id: UUID;
  practice_id: UUID;
  checkin_instance_id: UUID;
  patient_id: UUID;
  method: "email" | "sms" | "link";
  status: CheckinDeliveryStatus;
  destination_masked: string | null;
  provider_message_id: string | null;
  request_key: string;
  attempt_number: number;
  token_expires_at: ISODateTimeString;
  delivered_at: ISODateTimeString | null;
  opened_at: ISODateTimeString | null;
  completed_at: ISODateTimeString | null;
  expired_at: ISODateTimeString | null;
  failure_code: string | null;
  created_by: UUID | null;
  created_at: ISODateTimeString;
};

export type CheckinResponse = {
  canonical_question_id: string | null;
  id: UUID;
  practice_id: UUID;
  checkin_instance_id: UUID;
  patient_id: UUID;
  question_id: UUID | null;
  question_session_id: UUID | null;
  question_version: number | null;
  response_value: JsonValue | null;
  response_text: string | null;
  flagged: boolean;
  created_at: ISODateTimeString;
};

export type QuestionSessionStatus = "draft" | "paused" | "completed" | "cancelled";

export type QuestionSessionRecord = TimestampedRow & {
  cancelled_at: ISODateTimeString | null;
  care_plan_id: UUID | null;
  checkin_instance_id: UUID | null;
  completed_at: ISODateTimeString | null;
  patient_id: UUID;
  paused_at: ISODateTimeString | null;
  practice_id: UUID;
  session_state: JsonValue;
  started_at: ISODateTimeString;
  state_version: number;
  status: QuestionSessionStatus;
  workflow: "intake" | "monthly_checkin" | "annual_review" | "care_plan_review";
};

export type InteractionLog = PracticeScopedRow & {
  patient_id: UUID;
  enrollment_id: UUID | null;
  provider_id: UUID | null;
  staff_member_id: UUID | null;
  checkin_instance_id: UUID | null;
  activity_type: ActivityType;
  source: InteractionSource;
  minutes: number;
  occurred_at: ISODateTimeString;
  occurrence_date: ISODateString | null;
  billing_month: ISODateString;
  notes: string | null;
  correction_of_id: UUID | null;
  request_id: UUID | null;
  deleted_at: ISODateTimeString | null;
  work_item_id?: UUID | null;
  opportunity_disposition_id?: UUID | null;
  actual_time_affirmed?: boolean;
};

export type CcmOpportunity = {
  id: UUID;
  practice_id: UUID;
  patient_id: UUID;
  detector_version: string;
  rule_version: string;
  rule_identifier: string;
  opportunity_type: import("./opportunity-detector").OpportunityType;
  trigger_code: string;
  trigger_summary: string;
  benefit_rationale: string;
  condition_or_workflow_item: string;
  suggested_activity: string;
  eligible_performers: string[];
  provider_involvement: "not_required" | "review_if_escalated" | "required";
  input_facts: JsonValue;
  evidence_fingerprint: string;
  generated_at: ISODateTimeString;
  expires_at: ISODateTimeString;
  generated_by: UUID | null;
  created_at: ISODateTimeString;
};

export type CcmOpportunityEvidence = {
  id: UUID;
  practice_id: UUID;
  opportunity_id: UUID;
  source_type: string;
  source_id: UUID | null;
  observed_at: ISODateTimeString;
  summary: string;
  facts: JsonValue;
  created_at: ISODateTimeString;
};

export type CcmWorkItem = PracticeScopedRow & {
  patient_id: UUID;
  opportunity_id: UUID | null;
  primary_provider_id: UUID;
  assigned_member_id: UUID | null;
  related_condition_id: UUID | null;
  queue_group: "needs_attention" | "ready_to_contact" | "awaiting_patient" | "awaiting_provider" | "documentation_needed" | "completed_today";
  status: "open" | "in_progress" | "deferred" | "awaiting_patient" | "awaiting_provider" | "completed" | "cancelled";
  priority: "urgent" | "high" | "normal" | "low" | "none";
  priority_score: number;
  title: string;
  reason: string;
  due_at: ISODateTimeString | null;
  outcome: string | null;
  escalation_status: "none" | "requested" | "acknowledged" | "resolved";
  manual_priority: "urgent" | "high" | "normal" | "low" | null;
  manual_priority_reason: string | null;
  completed_at: ISODateTimeString | null;
};

export type CcmWorkItemPriorityFactor = {
  id: UUID; practice_id: UUID; work_item_id: UUID; factor_code: string; weight: number;
  explanation: string; input_fact: JsonValue; created_at: ISODateTimeString;
};
export type CcmOpportunityDisposition = {
  id: UUID; practice_id: UUID; opportunity_id: UUID;
  disposition: "accepted" | "different_action" | "provider_review" | "deferred" | "no_intervention";
  note: string | null; actual_review_minutes: number | null; actual_time_affirmed: boolean;
  resulting_work_item_id: UUID | null; provider_escalation_required: boolean;
  created_by: UUID; created_at: ISODateTimeString;
};
export type CcmWorkItemDeviation = {
  id: UUID; practice_id: UUID; work_item_id: UUID; complexity_note: string; actual_impact: string | null;
  recorded_by: UUID; created_at: ISODateTimeString;
};
export type CcmClinicalReport = {
  id: UUID; practice_id: UUID; patient_id: UUID; work_item_id: UUID | null; primary_provider_id: UUID;
  recipient_type: string; recipient_provider_id: UUID | null; recipient_member_id: UUID | null;
  purpose: string; condition_or_workflow_item: string; delivery_method: "secure_workspace" | "secure_link" | "approved_secure_message" | "export";
  contains_phi: boolean; delivery_status: "draft" | "queued" | "sent" | "acknowledged" | "failed";
  follow_up_due_at: ISODateTimeString | null; sent_at: ISODateTimeString | null; sent_by: UUID | null; created_at: ISODateTimeString;
};
export type CcmWorkItemEvent = {
  id: UUID; practice_id: UUID; work_item_id: UUID | null; opportunity_id: UUID | null;
  event_type: string; event_data: JsonValue; actor_user_id: UUID | null; created_at: ISODateTimeString;
};

export type CarePlanReviewStatus =
  | "draft"
  | "coordinator_ready"
  | "provider_review_required"
  | "approved"
  | "revision_requested";

export type CarePlan = PracticeScopedRow & {
  patient_id: UUID;
  patient_condition_id: UUID | null;
  enrollment_id: UUID | null;
  provider_id: UUID | null;
  status: CarePlanStatus;
  goals: JsonValue;
  interventions: JsonValue;
  barriers: JsonValue;
  notes: string | null;
  last_reviewed_at: ISODateTimeString | null;
  review_status: CarePlanReviewStatus;
  version: number;
  coordinator_ready_by: UUID | null;
  coordinator_ready_at: ISODateTimeString | null;
  provider_review_requested_by: UUID | null;
  provider_review_requested_at: ISODateTimeString | null;
  approved_by: UUID | null;
  approved_at: ISODateTimeString | null;
  revision_requested_at: ISODateTimeString | null;
  review_comments: string | null;
};

export type CarePlanVersion = {
  id: UUID;
  practice_id: UUID;
  care_plan_id: UUID;
  version: number;
  patient_id: UUID;
  provider_id: UUID | null;
  goals: JsonValue;
  interventions: JsonValue;
  barriers: JsonValue;
  notes: string | null;
  created_by: UUID | null;
  created_at: ISODateTimeString;
};

export type CarePlanReview = {
  id: UUID;
  practice_id: UUID;
  care_plan_id: UUID;
  care_plan_version: number;
  decision: "coordinator_ready" | "submitted" | "approved" | "changes_requested" | "superseded";
  comments: string | null;
  reviewer_user_id: UUID;
  snapshot: JsonValue;
  created_at: ISODateTimeString;
};

export type PatientIntakeSummary = PracticeScopedRow & {
  patient_id: UUID;
  enrollment_id: UUID | null;
  status: "draft" | "accepted" | "archived";
  input_snapshot: JsonValue;
  missing_information: JsonValue;
  follow_up_questions: JsonValue;
  draft_summary: JsonValue;
  reviewed_summary: JsonValue | null;
  confidence_score: number | null;
  quality_flags: string[];
  generated_by: "openai" | "fallback" | "session_engine";
  accepted_by: UUID | null;
  accepted_at: ISODateTimeString | null;
};

export type MonthlyBillability = PracticeScopedRow & {
  patient_id: UUID;
  enrollment_id: UUID | null;
  billing_month: ISODateString;
  total_minutes: number;
  qualifying_interaction_count: number;
  checkin_instance_id: UUID | null;
  consent_valid: boolean;
  care_plan_current: boolean;
  eligibility_valid: boolean;
  status: BillabilityStatus;
  reason_codes: string[];
  reviewed_by: UUID | null;
  reviewed_at: ISODateTimeString | null;
  billed_at: ISODateTimeString | null;
  exported_at: ISODateTimeString | null;
};

export type BillingEvidenceSnapshot = {
  id: UUID;
  practice_id: UUID;
  patient_id: UUID;
  monthly_billability_id: UUID | null;
  billing_month: ISODateString;
  snapshot: JsonValue;
  created_by: UUID | null;
  created_at: ISODateTimeString;
};

export type AuditEvent = {
  id: UUID;
  practice_id: UUID;
  actor_user_id: UUID | null;
  entity_type: string;
  entity_id: UUID | null;
  action: string;
  before_data: JsonValue | null;
  after_data: JsonValue | null;
  metadata: JsonValue;
  created_at: ISODateTimeString;
};

export type AuditPacket = {
  practice_id: UUID;
  patient: Patient;
  enrollment: CcmEnrollment | null;
  billing: MonthlyBillability;
  care_plans: CarePlan[];
  intake_summary?: PatientIntakeSummary | null;
  checkins: Array<CheckinInstance & { responses: CheckinResponse[] }>;
  interactions: InteractionLog[];
};
