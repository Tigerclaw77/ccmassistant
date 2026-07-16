-- Explicit application privileges. RLS remains the row-level authorization boundary.

revoke all on table public.practices from anon;
revoke all on table public.practice_members from anon;
revoke all on table public.providers from anon;
revoke all on table public.patients from anon;
revoke all on table public.patient_conditions from anon;
revoke all on table public.ccm_enrollments from anon;
revoke all on table public.checkin_instances from anon;
revoke all on table public.checkin_responses from anon;
revoke all on table public.interaction_logs from anon;
revoke all on table public.care_plans from anon;
revoke all on table public.patient_intake_summaries from anon;
revoke all on table public.monthly_billability from anon;
revoke all on table public.billing_evidence_snapshots from anon;
revoke all on table public.audit_events from anon;
revoke all on table public.question_sessions from anon;

grant select, update on table public.practices to authenticated;
grant select, insert, update on table public.practice_members to authenticated;
grant select, insert, update on table public.providers to authenticated;
grant select, insert, update on table public.patients to authenticated;
grant select, insert, update on table public.patient_conditions to authenticated;
grant select, insert, update on table public.ccm_enrollments to authenticated;
grant select, insert, update on table public.checkin_instances to authenticated;
grant select, insert on table public.checkin_responses to authenticated;
grant select, insert, update on table public.interaction_logs to authenticated;
grant select, insert, update on table public.care_plans to authenticated;
grant select, insert, update on table public.patient_intake_summaries to authenticated;
grant select, insert, update on table public.monthly_billability to authenticated;
grant select, insert on table public.billing_evidence_snapshots to authenticated;
grant select, insert on table public.audit_events to authenticated;
grant select, insert, update on table public.question_sessions to authenticated;

grant select on table public.questions to authenticated;
grant select on table public.question_tags to authenticated;
grant select on table public.checkin_templates to authenticated;

grant select on table public.icd10_codes to authenticated;
grant select on table public.management_clusters to authenticated;
grant select on table public.cluster_icd10_map to authenticated;
grant select on table public.clinical_objectives to authenticated;
grant select on table public.cluster_objective_map to authenticated;
grant select on table public.question_families to authenticated;
grant select on table public.objective_family_map to authenticated;
grant select on table public.clinical_questions to authenticated;
grant select on table public.question_family_members to authenticated;
grant select on table public.clinical_question_tags to authenticated;
grant select on table public.question_versions to authenticated;
grant select on table public.question_dependencies to authenticated;
grant select on table public.question_rotation_rules to authenticated;

-- Server-only public check-in reads and writes.
grant select, update on table public.checkin_instances to service_role;
grant select on table public.patients to service_role;
grant select on table public.practices to service_role;
grant select on table public.providers to service_role;
grant select on table public.checkin_templates to service_role;
grant select on table public.questions to service_role;
grant select, update on table public.question_sessions to service_role;
grant select, insert on table public.checkin_responses to service_role;
grant insert on table public.audit_events to service_role;

-- Server-only billability preservation and upsert.
grant select, insert, update on table public.monthly_billability to service_role;
