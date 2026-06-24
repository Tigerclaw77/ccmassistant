# RLS Inventory

Generated on 2026-05-31 from `supabase/migrations/006_ccm_assistant_initial_schema.sql`.

## Summary

- RLS-enabled tables: 18
- RLS policies: 22
- Core predicate: `public.is_practice_member(practice_id)`
- User identity source: Supabase Auth `auth.uid()`
- Global exception: `questions` may be selected when `practice_id is null`
- Special linked authorization: `question_tags` authorizes through its parent `questions` row

## Helper Function

`public.is_practice_member(target_practice_id uuid)` returns true when the current `auth.uid()` has an active `practice_members` row for the target practice.

The migration revokes public function access and grants execute to `authenticated`.

## Enabled Tables

| Table | RLS enabled | Policy count |
| --- | --- | ---: |
| `practices` | yes | 1 |
| `practice_members` | yes | 3 |
| `providers` | yes | 1 |
| `provider_preferences` | yes | 1 |
| `patients` | yes | 1 |
| `patient_conditions` | yes | 1 |
| `ccm_enrollments` | yes | 1 |
| `questions` | yes | 2 |
| `question_tags` | yes | 2 |
| `provider_question_preferences` | yes | 1 |
| `patient_question_preferences` | yes | 1 |
| `checkin_templates` | yes | 1 |
| `checkin_instances` | yes | 1 |
| `checkin_responses` | yes | 1 |
| `interaction_logs` | yes | 1 |
| `care_plans` | yes | 1 |
| `monthly_billability` | yes | 1 |
| `audit_events` | yes | 1 |

## Policies

| Policy | Table | Commands | Predicate summary |
| --- | --- | --- | --- |
| `practices_member_select` | `practices` | `select` | User must be an active member of the practice row. |
| `practice_members_member_select` | `practice_members` | `select` | User must be active member of the practice or selecting their own membership row. |
| `practice_members_member_insert` | `practice_members` | `insert` | Insert allowed when current user is an active member of the target practice. |
| `practice_members_member_update` | `practice_members` | `update` | Update allowed when current user is an active member of the target practice. |
| `provider_rows_member_access` | `providers` | `all` | Any active practice member can select/insert/update/delete provider rows. |
| `provider_preference_rows_member_access` | `provider_preferences` | `all` | Any active practice member can select/insert/update/delete provider preference rows. |
| `patient_rows_member_access` | `patients` | `all` | Any active practice member can select/insert/update/delete patient rows. |
| `patient_condition_rows_member_access` | `patient_conditions` | `all` | Any active practice member can select/insert/update/delete condition rows. |
| `ccm_enrollment_rows_member_access` | `ccm_enrollments` | `all` | Any active practice member can select/insert/update/delete enrollment rows. |
| `questions_select_global_or_member` | `questions` | `select` | Global questions are selectable; practice questions require active membership. |
| `questions_member_write` | `questions` | `all` | Practice question writes require non-null practice and active membership. |
| `question_tags_select_global_or_member` | `question_tags` | `select` | Select allowed when linked question is global or in a member practice. |
| `question_tags_member_write` | `question_tags` | `all` | Writes require linked non-global question in same active-member practice. |
| `provider_question_preference_rows_member_access` | `provider_question_preferences` | `all` | Any active practice member can select/insert/update/delete provider question preferences. |
| `patient_question_preference_rows_member_access` | `patient_question_preferences` | `all` | Any active practice member can select/insert/update/delete patient question preferences. |
| `checkin_template_rows_member_access` | `checkin_templates` | `all` | Any active practice member can select/insert/update/delete check-in templates. |
| `checkin_instance_rows_member_access` | `checkin_instances` | `all` | Any active practice member can select/insert/update/delete check-in instances. |
| `checkin_response_rows_member_access` | `checkin_responses` | `all` | Any active practice member can select/insert/update/delete check-in responses. |
| `interaction_log_rows_member_access` | `interaction_logs` | `all` | Any active practice member can select/insert/update/delete interaction logs. |
| `care_plan_rows_member_access` | `care_plans` | `all` | Any active practice member can select/insert/update/delete care plans. |
| `monthly_billability_rows_member_access` | `monthly_billability` | `all` | Any active practice member can select/insert/update/delete monthly billability rows. |
| `audit_event_rows_member_access` | `audit_events` | `all` | Any active practice member can select/insert/update/delete audit events. |

## RLS Risks

- Many policies use `for all`, which includes delete. This permits direct Supabase clients to delete practice-scoped rows when the user is an active member, even if no application API exposes deletes.
- RLS does not enforce role-specific write authorization. Application route handlers restrict owners/admins/providers/coordinators in code, but the database policies generally allow any active member to write.
- `practice_members_member_insert` and `practice_members_member_update` are broader than the application rule. At the RLS layer, any active member can insert/update membership rows.
- `audit_events` is mutable through a `for all` member policy. Audit records should normally be append-only and tightly restricted.
- There are no explicit service-role-only audit insert policies; service role bypasses RLS by design.
- The legacy tables still read by prototype UI are not created or protected in the new migration, so their live RLS state is unknown from repo evidence.

## RLS Test Matrix Needed

- Member of Practice A cannot select Practice B rows.
- Member of Practice A cannot write Practice B rows.
- Non-admin active member cannot create/update `practice_members`.
- Billing-only member cannot write patient/enrollment/care-plan/time rows unless product rules allow it.
- Provider/coordinator can perform intended patient/time/care-plan mutations only.
- `audit_events` cannot be updated or deleted by normal clients.
- Global questions are selectable by authenticated users, while practice questions stay practice-scoped.
- Public check-in token flow does not expose unrelated assignment, basket, or patient data.
