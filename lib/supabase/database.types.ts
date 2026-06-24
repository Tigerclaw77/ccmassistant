import type {
  ActivityType,
  AnswerType,
  AuditEvent,
  BillingEvidenceSnapshot,
  BillabilityStatus,
  CarePlan,
  CarePlanStatus,
  CheckinInstance,
  CheckinResponse,
  CheckinStatus,
  CheckinTemplate,
  CcmEnrollment,
  ConsentMethod,
  ConsentStatus,
  ContactMethod,
  EligibilityStatus,
  EnrollmentStatus,
  InteractionLog,
  InteractionSource,
  JsonValue,
  MembershipStatus,
  MonthlyBillability,
  Patient,
  PatientCondition,
  PatientQuestionPreference,
  Practice,
  PracticeMember,
  PracticeRole,
  Provider,
  ProviderPreferences,
  ProviderQuestionPreference,
  Question,
  QuestionPreference,
  QuestionSource,
  QuestionStatus,
  QuestionTag,
} from "../ccm/types";

type Insertable<T extends object> = Partial<T>;
type Updatable<T extends object> = Partial<Omit<T, "id" | "created_at">>;

type TableDefinition<Row extends object> = {
  Row: Row;
  Insert: Insertable<Row>;
  Update: Updatable<Row>;
  Relationships: [];
};

export type Json = JsonValue;

export type Database = {
  public: {
    Tables: {
      practices: TableDefinition<Practice>;
      practice_members: TableDefinition<PracticeMember>;
      providers: TableDefinition<Provider>;
      provider_preferences: TableDefinition<ProviderPreferences>;
      patients: TableDefinition<Patient>;
      patient_conditions: TableDefinition<PatientCondition>;
      ccm_enrollments: TableDefinition<CcmEnrollment>;
      questions: TableDefinition<Question>;
      question_tags: TableDefinition<QuestionTag>;
      provider_question_preferences: TableDefinition<ProviderQuestionPreference>;
      patient_question_preferences: TableDefinition<PatientQuestionPreference>;
      checkin_templates: TableDefinition<CheckinTemplate>;
      checkin_instances: TableDefinition<CheckinInstance>;
      checkin_responses: TableDefinition<CheckinResponse>;
      interaction_logs: TableDefinition<InteractionLog>;
      care_plans: TableDefinition<CarePlan>;
      monthly_billability: TableDefinition<MonthlyBillability>;
      billing_evidence_snapshots: TableDefinition<BillingEvidenceSnapshot>;
      audit_events: TableDefinition<AuditEvent>;
    };
    Views: Record<string, never>;
    Functions: {
      is_practice_member: {
        Args: {
          target_practice_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      ccm_member_role: PracticeRole;
      ccm_membership_status: MembershipStatus;
      ccm_contact_method: ContactMethod;
      ccm_eligibility_status: EligibilityStatus;
      ccm_consent_status: ConsentStatus;
      ccm_consent_method: ConsentMethod;
      ccm_enrollment_status: EnrollmentStatus;
      ccm_question_source: QuestionSource;
      ccm_question_status: QuestionStatus;
      ccm_answer_type: AnswerType;
      ccm_question_preference: QuestionPreference;
      ccm_checkin_status: CheckinStatus;
      ccm_activity_type: ActivityType;
      ccm_interaction_source: InteractionSource;
      ccm_care_plan_status: CarePlanStatus;
      ccm_billability_status: BillabilityStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
