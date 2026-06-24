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
};

export type PracticeMember = PracticeScopedRow & {
  user_id: UUID | null;
  invited_email: string | null;
  role: PracticeRole;
  status: MembershipStatus;
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
  code_system: string | null;
  code: string | null;
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
  sent_at: ISODateTimeString | null;
  responded_at: ISODateTimeString | null;
  followup_due_at: ISODateTimeString | null;
  no_response_at: ISODateTimeString | null;
  closed_at: ISODateTimeString | null;
  metadata: JsonValue;
};

export type CheckinResponse = {
  id: UUID;
  practice_id: UUID;
  checkin_instance_id: UUID;
  patient_id: UUID;
  question_id: UUID | null;
  response_value: JsonValue | null;
  response_text: string | null;
  flagged: boolean;
  created_at: ISODateTimeString;
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
  billing_month: ISODateString;
  notes: string | null;
  correction_of_id: UUID | null;
  deleted_at: ISODateTimeString | null;
};

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
  checkins: Array<CheckinInstance & { responses: CheckinResponse[] }>;
  interactions: InteractionLog[];
};
