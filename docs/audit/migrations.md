# Migration Inventory

Generated on 2026-05-31 from repository files only. This is not a live Supabase schema dump.

## Summary

- Migration directory: `supabase/migrations/`
- Migration files found: 6
- Empty placeholder migrations: 5
- Non-empty schema migration: 1
- Consolidated generated schema artifact: `schema.sql`
- Storage migrations found: none
- Seed files found: none
- Migration application status: unknown from repo evidence

## Files

| Migration | Size | SHA-256 | Inventory status |
| --- | ---: | --- | --- |
| `001_profiles.sql` | 0 bytes | `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855` | Empty placeholder |
| `002_orgs.sql` | 0 bytes | `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855` | Empty placeholder |
| `003_patients.sql` | 0 bytes | `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855` | Empty placeholder |
| `004_baskets.sql` | 0 bytes | `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855` | Empty placeholder |
| `005_submissions.sql` | 0 bytes | `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855` | Empty placeholder |
| `006_ccm_assistant_initial_schema.sql` | 26,968 bytes | `6FB3DD1180955D11D5D0622F3C47F7D44D8987D2CB7949D747BAB963A88FB891` | Initial CCM Assistant schema draft |

## `006` Contents

- Extension: `pgcrypto`
- Enums: 16
- Tables: 18
- Functions: 2
- `set_updated_at` triggers: 15 tables
- RLS-enabled tables: 18
- RLS policies: 22
- Indexes: 19

## Database Objects Introduced By `006`

Enums:

- `ccm_member_role`
- `ccm_membership_status`
- `ccm_contact_method`
- `ccm_eligibility_status`
- `ccm_consent_status`
- `ccm_consent_method`
- `ccm_enrollment_status`
- `ccm_question_source`
- `ccm_question_status`
- `ccm_answer_type`
- `ccm_question_preference`
- `ccm_checkin_status`
- `ccm_activity_type`
- `ccm_interaction_source`
- `ccm_care_plan_status`
- `ccm_billability_status`

Tables:

- `practices`
- `practice_members`
- `providers`
- `provider_preferences`
- `patients`
- `patient_conditions`
- `ccm_enrollments`
- `questions`
- `question_tags`
- `provider_question_preferences`
- `patient_question_preferences`
- `checkin_templates`
- `checkin_instances`
- `checkin_responses`
- `interaction_logs`
- `care_plans`
- `monthly_billability`
- `audit_events`

Functions:

- `set_updated_at()`
- `is_practice_member(target_practice_id uuid)`

## Gaps

- The first five migrations are empty but named for legacy/prototype tables.
- There is no repo evidence that migration `006` has been applied to the hosted Supabase project.
- There are no rollback/down migrations.
- There are no storage bucket migrations or storage policies.
- The schema draft does not create the legacy tables still read by prototype pages: `baskets`, `assignments`, `submissions`, `interactions`.
