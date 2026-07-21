# Migration Audit

Updated on 2026-07-20 from repository files and the hosted development migration ledger.

## Inventory

| Version | File | Purpose | Ordering and dependency finding |
| --- | --- | --- | --- |
| `001`-`005` | Legacy placeholders | Empty files | Harmless ledger placeholders; contain no schema. |
| `006` | `006_ccm_assistant_initial_schema.sql` | Base enums, CCM tables, triggers, indexes, RLS, membership helper | Must run first; non-idempotent by design and must be ledger-controlled. |
| `007` | `007_billing_evidence_snapshots.sql` | Immutable billing evidence | Depends on `006` practice, patient, enrollment, and monthly objects. |
| `008` | `008_clinical_knowledge_base.sql` | Reviewed knowledge-base schema and seed | Depends on `006`; seed uses conflict handling where repeat-safe behavior is appropriate. |
| `009` | `009_vertical_slice_sprint1.sql` | Provider and consent additions | Depends on `006`; alters existing objects. |
| `010` | `010_vertical_slice_sprint2_intake.sql` | Structured intake persistence | Depends on prior patient/enrollment schema. |
| `011` | `011_clinical_condition_manager.sql` | Condition-management persistence | Depends on patient and condition objects. |
| `012` | `012_launch_security_and_integrity.sql` | Security, role, integrity, audit, and evidence hardening | Depends on `006`-`011`; introduces policies/functions and some `NOT VALID` checks. |
| `013` | `013_question_session_integration.sql` | Question-session persistence and RLS | Depends on practice, membership, patient, and question objects. |
| `014` | `014_coordinator_efficiency.sql` | Worklist/search indexes and functions | Depends on prior CCM tables; requires `pg_trgm` availability. |
| `015` | `015_question_bank_customization.sql` | Scoped customization and contribution records | Depends on canonical question-bank and trigger/helper objects. |
| `016` | `016_hosted_production_hardening.sql` | Token expiry, tenant referential integrity, and AAL2 RLS helpers | Forward-only fix; depends on `006`-`015`. |
| `017` | `017_security_advisor_hardening.sql` | Trigger-function RPC revocation and fixed search paths | Forward-only security fix based on hosted Supabase advisor results; depends on `012` and `015`. |
| `018` | `018_first_practice_bootstrap.sql` | Atomic, AAL2-gated first-owner practice bootstrap | Forward-only onboarding authorization fix; serializes the one permitted initial bootstrap and depends on `006`, `012`, and `016`. |
| `019` | `019_practice_access_resolution.sql` | Historical AAL2-gated bootstrap/member/forbidden access resolution | Forward-only response to missing table grants in the fresh hosted project; its global first-practice restriction is superseded by `025`. |
| `020` | `020_least_privilege_application_grants.sql` | Explicit route-operation grants behind existing RLS | Forward-only authorization-layer completion; grants no schema-wide, anonymous, immutable-update, or audit-delete privileges and depends on `019`. |
| `021` | `021_stripe_billing_foundation.sql` | Practice-scoped Stripe customer, subscription, and idempotent webhook persistence | Forward-only sandbox billing foundation; depends on practice authorization and immutable tenant ownership established by prior migrations. |
| `022` | `022_interaction_occurrence_date.sql` | Canonical interaction occurrence date and request-id persistence | Forward-only hosted workflow correction; separates calendar-date validation from timestamps and supports retry-safe requests. |
| `023` | `023_question_bank_customization_grants.sql` | Explicit customization-table grants behind existing RLS | Forward-only hosted correction; permits only the operations already constrained by migration `015` policies and preserves immutable history. |
| `024` | `024_pilot_readiness_sprint_1.sql` | Pilot staff, care-plan review, and check-in delivery foundations | Additive Sprint 1 schema required by the existing pilot UI and authorization tests. |
| `025` | `025_pilot_readiness_sprint_2.sql` | Per-user onboarding, organization roles, practice setup, and immutable PRP history | Supersedes the global first-practice restriction while preserving legacy memberships and role checks. |
| `026` | `026_pilot_readiness_sprint_2_function_hardening.sql` | Trigger-function RPC revocation | Removes direct anonymous and authenticated execute access from Sprint 2 trigger-only security-definer functions. |
| `027` | `027_task_driven_coordinator_workflow.sql` | Deterministic opportunities, scoped work items, dispositions, routing, provider lifecycle, time linkage, and immutable audit | Unpublished forward migration; normalizes shared-development grants and constraints and gives fresh installs the same final invariants without changing applied files. |

## Validation findings

- Ordering is numeric and dependencies are consistent. Apply once through the Supabase migration ledger; manually rerunning base migrations is expected to fail.
- Migrations `024`-`026` exactly match the SQL already recorded in shared development. Migration `027` contains the compatible forward grant, tenant-integrity, fixed-search-path, provider-lifecycle, and security-documentation normalization needed to reach the final schema without rewriting the applied ledger.
- RLS is enabled on CCM data tables by the base and feature migrations. Migration `012` tightens role policies; `016` makes shared membership helper functions require an AAL2 JWT so policies cannot be satisfied by password-only sessions.
- Security-definer functions set an empty or `pg_catalog`-only trusted `search_path`; application relations are schema-qualified, execute grants are narrowed to the intended context, trigger-only execution is revoked, and each intentional elevation is documented in SQL.
- Opportunity and evidence creation is service-role-only and atomic. Authenticated users cannot forge detector records or their evidence. Exact detector retries return the immutable existing row; changed detector versions, rule versions, or input fingerprints create a new row.
- Provider ownership is non-null and uses `ON DELETE RESTRICT`. A trigger enforces transfer, then deactivate, then archive, and provider deletion is prohibited.
- Composite foreign keys bind role, patient-access, provider/staff, and PRP-history records to their practice, preventing independent UUIDs from producing cross-tenant relationships.
- `set_updated_at` and immutable-record triggers are introduced before later migrations depend on them.
- Indexes cover tenant/month/status worklists and search paths. Migration `016` adds active public-token lookup, legacy-response uniqueness, and composite parent keys needed for tenant-consistent foreign keys.
- Cross-practice IDs were a first-deployment risk because several child rows carried both `practice_id` and a foreign ID without a composite relationship. Migration `016` adds composite foreign keys.
- Public check-in tokens previously had no database expiry. Migration `016` adds and backfills a 14-day expiry, requires expiry when a token exists, and supports active-token lookup.
- Constraints added to legacy tables are `NOT VALID` where an immediate scan could block deployment. They protect new writes immediately, but existing rows must be checked and every constraint validated before onboarding.
- Migration `014` creates `pg_trgm` in the managed `extensions` schema. Verify this extension is allowed in the selected Supabase project before apply.
- No migration creates Supabase Storage buckets/policies or a cron/background job because the application does not use them.
- No destructive down migrations exist. Production correction must be a reviewed forward migration.

## First hosted deployment risks

1. A project with partial/manual schema objects may conflict with ledger-controlled `create type`, `create table`, or policy statements. Start from an isolated clean staging project and inspect `supabase migration list` before apply.
2. Existing data may violate `012` or `016` unvalidated constraints. Query violations, use an approved correction record, and validate each constraint before pilot onboarding.
3. Missing `pg_trgm` support or insufficient migration privileges can stop `014`. Confirm extension availability during dry run.
4. A password-only authenticated session will stop satisfying CCM RLS after `016`. Configure and test TOTP MFA before promoting the migration to a live user population.
5. Existing public tokens are assigned an expiry based on their sent/created timestamp and may become immediately expired. Communicate this intentional invalidation and issue new check-ins when needed.

## Verification commands

```powershell
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

After apply, run the unvalidated-constraint query in the production runbook and require zero rows before pilot onboarding. The hosted development migration ledger was verified through `026` on 2026-07-20. Production application, a production restore drill, and production constraint evidence remain separate release gates; local static checks and application tests do not substitute for them.
