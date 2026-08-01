# RC1 backup and recovery runbook

This runbook governs production data once PHI may exist. Recovery is an incident operation: preserve evidence, minimize access, and obtain the named incident lead's approval before any destructive action.

## Recovery objectives and ownership

Recommended first-pilot targets, subject to founder/security approval:

- **RPO:** 15 minutes or less.
- **RTO:** 4 hours or less for the core CCM workflow.
- **PITR retention:** at least 7 days, with longer retention selected if the approved risk and retention analysis requires it.
- **Restore drill:** before the first PHI and at least quarterly, plus after material database/recovery changes.

Name a primary and backup recovery operator. Require MFA, least-privilege access, separate approval for production restore, and an audit record for every backup export, restore, download, and deletion.

## Required controls before PHI

1. Supabase account and project are covered by the required BAA/HIPAA configuration.
2. Point-in-time recovery or the approved equivalent is enabled and retention is recorded.
3. Daily platform backup status is monitored by a named operator.
4. Database SSL enforcement, network restrictions, and Postgres connection logging are enabled as required by the approved HIPAA project configuration.
5. A logical export procedure exists for cases where downloadable platform backups are unavailable.
6. Backup/export files containing PHI are encrypted, access-controlled, time-limited, inventoried, and stored only in an approved location.
7. The recovery contact tree, incident channel, and vendor escalation paths are tested.
8. Restore evidence contains no raw PHI in tickets, chat, screenshots, or ordinary email.

Backups are recovery controls, not the medical-record retention policy. Legal/compliance owners must separately define clinical, billing, audit, and deletion retention.

## Routine verification

Daily operator check:

1. review latest platform backup/PITR status and alerts;
2. confirm no failed database operation or unexpected storage growth;
3. record UTC time, project ref, newest recoverable point, oldest retained point, and operator;
4. escalate any missed objective immediately.

Before each release:

1. record a pre-change recovery point and database ledger;
2. capture key row counts and integrity checks without exporting PHI into the release record;
3. verify the isolated-restore path is available;
4. identify the exact acceptable data-loss boundary if rollback becomes necessary.

## Logical database export

When an approved logical export is needed, use the Supabase CLI or `pg_dump` from a hardened operator workstation and a short-lived least-privilege connection. Do not embed the password in the command or shell history.

Required handling:

- write only to an encrypted approved volume;
- encrypt again with the organization-approved backup key before transfer;
- generate and record a SHA-256 checksum;
- record source project, source timestamp, schema/migration level, tool versions, operator, purpose, retention expiry, and destination;
- verify the encrypted artifact can be opened in the isolated restore drill;
- securely remove expired temporary copies under the approved media policy.

Do not place production dumps in the repository, Codex workspace, Downloads, consumer cloud storage, or ordinary email.

## Isolated restore verification

Never test a restore over the live project.

1. Open an incident/change record and obtain approval for an isolated recovery project.
2. Restrict the project to the recovery team; disable public invitations, external email, webhooks, cron jobs, and other outbound integrations.
3. Restore from the chosen platform backup/PITR point or verified logical export.
4. Recreate project-level settings that the database backup does not restore, including Auth configuration, API keys, SMTP, redirect URLs, Edge Functions, Realtime settings, network controls, and Storage objects/settings if any.
5. Keep application access disabled until security checks pass.
6. Verify migration ledger, database version, extensions, schemas, row counts, foreign keys, indexes, triggers, functions, RLS, grants, and adviser results.
7. Run the migration contract and authorization suites against the isolated project.
8. Compare representative audit, patient, time-entry, opportunity, provider-review, compliance, and billing-evidence records to the source integrity manifest.
9. Verify immutable records remain immutable and tenant isolation remains enforced.
10. Measure achieved RPO and RTO; record discrepancies and corrective owners.
11. Have an independent reviewer sign the evidence.
12. Delete the isolated PHI copy only under the approved process and retain proof of deletion. Do not assume project deletion is instantaneous data erasure without vendor confirmation.

## Accidental deletion or corruption

1. Stop the affected workflow; do not let users recreate records before scope is known.
2. Record detection time, suspected event time, actor, object type, affected practice/patients, request IDs, and current migration level.
3. Preserve application, Supabase Auth/database, Vercel, and audit logs.
4. Revoke compromised access if applicable; do not alter the immutable evidence being investigated.
5. Determine whether the application offers a safe state transition instead of deletion recovery (for example re-enabling staff). Never recreate audit/evidence rows manually.
6. Identify the latest clean PITR point and calculate the possible data-loss window.
7. Restore that point into isolation and prove scope/integrity.
8. Choose one reviewed recovery method:
   - surgical re-insertion from an isolated restore when constraints, ownership, audit meaning, and immutable evidence can be preserved; or
   - full project recovery when corruption is broad and the accepted RPO justifies it.
9. Validate with two operators before production writes.
10. Notify compliance/privacy owners and follow the incident/breach decision procedure when PHI may be involved.

## Failed migration

Applied migrations are immutable. Do not edit an applied file, delete a ledger row, or improvise a down script.

1. Stop deployment and preserve the exact SQL error, transaction state, migration hash, ledger, database logs, and application status.
2. Determine whether Supabase rolled back the entire migration transaction.
3. If the migration did not apply, return to the previous application release and prepare a reviewed corrected forward migration.
4. If it partially or fully applied, keep incompatible application traffic stopped.
5. Prefer the smallest reviewed forward correction when data integrity can be demonstrated.
6. Use PITR/full restore only when forward correction is unsafe. State the accepted RPO and lost-write window before approval.
7. Re-run fresh replay, contract, authorization, regression, and representative hosted workflows before reopening.

## Regional or project disaster

1. Declare the incident and make the application unavailable or read-only; do not silently serve stale data.
2. Engage Supabase and Vercel through the contracted support channels and record case IDs.
3. Select the most recent verified recovery point within the approved RPO.
4. Recover into a new restricted project if the original cannot be safely restored.
5. Recreate settings that database restore does not include: project/API configuration, Auth/SMTP/redirects, secrets, network controls, functions, Realtime, and Storage.
6. Rotate Supabase and integration credentials if compromise is possible; update Vercel secrets and create a new deployment because environment changes are not retroactive.
7. Run the full isolated verification before moving the canonical application to the new project.
8. Repoint application configuration only in an approved deployment, then validate Auth and all role/workflow paths with synthetic data.
9. Reopen incrementally and monitor logs, queues, email, audit deltas, and database health.
10. Complete privacy/breach analysis, practice communication, post-incident review, and corrective-action tracking.

## Recovery acceptance record

Record for every drill or incident:

- incident/change ID;
- source project and recovery target;
- selected backup/PITR time;
- earliest affected event and recovery decision time;
- achieved RPO and RTO;
- source and restored migration levels;
- checksum/integrity summary;
- Auth/configuration items re-created;
- tests and reviewer;
- records intentionally excluded or lost;
- PHI access/deletion evidence;
- final decision and approvers.

## Official references

- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase point-in-time recovery](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)
- [Supabase restore to a new project](https://supabase.com/docs/guides/platform/clone-project)
- [Supabase HIPAA projects](https://supabase.com/docs/guides/platform/hipaa-projects)

