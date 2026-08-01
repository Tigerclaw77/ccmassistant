# RC1 external-pilot launch-day checklist

Pilot scope: one practice, one provider, one coordinator, one administrator, 50–100 patients.

Decision rule: every **Hard gate** must be checked PASS against the same signed tag, SHA, Vercel deployment, Supabase project, and migration level. A missing result is a failure, not an assumed pass. Until the final GO is signed, use synthetic data only.

## Release identity and freeze — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Record change ID, UTC window, release operator, database operator, reviewer, rollback owner, security lead, and support channel. | Every role has a named, reachable person; no one self-approves all evidence. | Stop. Reschedule when owners and communications are available. |
| □ Review the final file inventory and confirm feature freeze. | Only approved RC1 implementation, migrations, tests, and documentation are present. | Stop. Remove unrelated work through a separately reviewed change; do not tag. |
| □ Confirm a clean checkout and clean `git status`. | No modified/untracked file; dependencies installed from lockfile. | Stop. Do not hide or discard unknown changes; reconcile the inventory. |
| □ Complete an approved full-history secret scan. | No live secret or unexplained high-confidence finding in current/history. | Stop. Revoke/rotate exposed credentials, remove through the approved history procedure, and rerun. |
| □ Run `npm ci`, release validation, fresh 30-migration replay, pgTAP, regression, TypeScript, ESLint, production build, DB lint, and `git diff --check`. | Every command passes from the exact clean SHA; warnings are reviewed. | Stop. Fix only a proven release blocker under a new reviewed candidate, then restart certification. |
| □ Create and verify annotated/signed tag `v1.0.0-rc.1`. | Tag resolves to the reviewed SHA and signature/annotation is valid. | Delete/recreate only an unpublished incorrect tag; if published, use an incremented RC tag and document supersession. |
| □ Confirm local SHA, GitHub `main`, GitHub tag, and release record match. | One immutable candidate identity everywhere. | Stop. Do not deploy until the mismatch is reconciled without rewriting published history. |

## Legal, security, and practice approval — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Verify signed pilot agreement, scope, and CCM responsibilities. | Practice, population, users, support, exit, and data handling are approved. | Stop external launch; continue synthetic internal rehearsal only. |
| □ Verify required BAA/PHI eligibility for Supabase. | Executed agreement and approved HIPAA/High Compliance project configuration are retained. | Stop. No PHI or external user invitation. |
| □ Verify required BAA/PHI eligibility for Vercel. | Executed agreement/approved account and shared-responsibility controls are retained. | Stop. No PHI or external user invitation. |
| □ Verify email-provider and any enabled vendor agreement. | Custom SMTP and optional Resend use are approved for the actual message content. | Disable the unapproved optional integration; if Auth SMTP is unapproved, stop launch. |
| □ Approve risk analysis, incident/breach, retention, backup access, support, training, and access-review procedures. | Named owner, version, approval date, contact paths, and exception register exist. | Stop. Do not replace policy approval with an engineering assumption. |
| □ Verify all operators and pilot users have individual MFA-protected accounts. | No shared account; founder/service credentials are restricted; recovery access is tested. | Disable shared/unprotected access and stop until independent MFA identities exist. |

## Recovery readiness — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Verify approved backup/PITR tier and retention. | Recovery points meet approved RPO; monitoring has a named owner. | Stop before PHI. Enable/repair the control and capture evidence. |
| □ Record the pre-release recovery point, ledger, key counts, and UTC time. | A specific recoverable boundary is documented without PHI in evidence. | Stop the change until a valid recovery point is available. |
| □ Complete isolated restore drill. | Schema, data integrity, Auth/config recreation, RLS/grants, audit/evidence, RPO, and RTO all pass with reviewer signoff. | Stop external launch. Correct recovery controls and rerun the isolated drill; never test over production. |
| □ Test the incident contact tree and vendor escalation paths. | Supabase, Vercel, email, security/privacy, founder, and practice contacts respond or acknowledge. | Stop or reschedule to a supported window. |

## Supabase database — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Capture production migration ledger and compare with the signed repository manifest. | Ledger is an exact ordered prefix with no duplicate, missing-middle, unknown, or hash-conflicting migration. | Stop. Reconcile history with database owner; never edit an applied file or ledger row casually. |
| □ Apply only the missing contiguous suffix in order. | Each pending migration succeeds once; no previous migration is reapplied. | Stop on first error, preserve transaction/log evidence, and follow failed-migration recovery. |
| □ Verify final migration level `20260801193000`. | All 30 repository migrations are recorded once and in order. | Keep application closed; do not mark failed versions as applied. |
| □ Run hosted migration contracts and pgTAP. | All schema, tenant, ownership, opportunity, work-item, audit/evidence, and role assertions pass. | Stop. Restore only if approved; otherwise prepare the smallest reviewed forward correction. |
| □ Verify RLS and least-privilege grants. | PHI/tenant tables have RLS; anon/authenticated/service-role/function grants match the contract. | Stop. Do not weaken a policy to make a test pass. |
| □ Review every SECURITY DEFINER function. | Safe fixed `search_path`, justified definer rights, and intended execute roles only. | Revoke exposed execution where safely possible and stop until a reviewed forward fix passes. |
| □ Run Supabase database/security advisers. | No unexplained release-blocking finding; every accepted exception has owner/expiry/control. | Stop for P0/P1; record and approve lower findings before launch. |
| □ Confirm no unexpected Supabase Storage bucket/object. | Empty or exact approved inventory; no public PHI object. | Make affected data inaccessible, preserve evidence, notify security, and stop. |

## Supabase Auth and SMTP — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Verify Site URL and redirects. | Site URL is `https://www.ccmassistant.com`; exact `/login`, `/reset-password`, and `/accept-invitation` production redirects are allowed; no broad wildcard. | Restore the last approved URL configuration and stop Auth testing. |
| □ Verify password, MFA, session, rate-limit, and CAPTCHA policy. | Minimum 12 characters, leaked-password protection where supported, TOTP enabled, and approved session/rate controls. | Stop. Correct configuration and rerun all Auth lifecycle tests. |
| □ Verify approved Auth email templates. | Confirmation, invitation, recovery, and change templates use safe current links and expose no secret/PHI. | Restore approved templates; invalidate/resend affected links and retest. |
| □ Verify custom SMTP, sender, SPF, DKIM, and DMARC. | Supabase uses approved custom SMTP; DNS/provider status is verified; credentials are not exposed. | Stop external launch. Do not fall back to default Supabase email. |
| □ Test new-owner confirmation and resend. | Auth user/request, provider message ID/final delivery, link, confirmation, MFA, and practice setup all succeed. | Classify browser/Auth/SMTP/provider/inbox/link failure; fix config and restart with a fresh identity. |
| □ Test invitation for administrator, provider, and coordinator. | Pending member, provider delivery, newest-link acceptance, MFA, activation, and role assignment all match. | Cancel bad invitations, retain evidence, fix the exact failing layer, and resend a new invitation. |
| □ Test password reset plus expired/used link recovery. | Enumeration-safe request, provider delivery, valid reset, old-session handling, and actionable expired/used errors pass. | Revoke affected sessions if needed, restore config/templates, and retest with a fresh link. |
| □ Test invalid recipient and provider defer/reject handling. | Exact provider reason/status is visible to operators; application does not claim delivery without evidence. | Stop email launch and fix routing/domain/provider monitoring. |

## Vercel environment and deployment — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Verify required Production variable names, scopes, sensitivity, and associations. | Four core values are present for the production Supabase project/origin; service key is Sensitive/server-only; no value is exposed. | Stop. Correct values, rotate any exposed secret, and create a new deployment. |
| □ Verify optional-variable policy. | Audit mode absent/false; OpenAI and Stripe absent; Resend present only if approved; Preview cannot access production. | Remove or rescope the variable and deploy a new candidate; do not reuse an already-built deployment. |
| □ Allow GitHub to build the signed SHA. | Vercel deployment is `READY`, Node 24, build passed, and source SHA equals the tag. | Do not assign production aliases; correct the blocker in a new reviewed candidate. |
| □ Verify canonical domains and TLS. | `https://www.ccmassistant.com` serves the RC; apex permanently redirects to `www`; valid TLS. | Keep or restore aliases on the prior approved deployment and stop. |
| □ Verify Persona Mode is absent. | `/dev/personas` and persona overlay/header behavior are unavailable in production. | Roll back deployment, remove the production flag, and investigate the build before reopening. |
| □ Review build/function logs after representative traffic. | No unexplained application, Auth, database, or service-role error; IDs/times retained. | Stop traffic and use Instant Rollback only if the old build is forward-schema-compatible. |

## Synthetic production smoke test — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Complete owner onboarding and provider bootstrap. | Active practice, owner membership, active provider, and guided first-patient action; no manual SQL. | Stop, preserve correlations, and fix only the proven defect/configuration before retry. |
| □ Create and enroll one new synthetic patient. | PRP list populated; eligibility, consent, starter kit, care plan, and active enrollment behave correctly. | Inactivate the synthetic record if necessary; do not delete audit/evidence; stop launch. |
| □ Complete coordinator task workflow. | Queue → action → outcome → actual time → route/defer/complete → automatic return works. | Stop. Preserve the patient/task IDs and do not manufacture terminal state in SQL. |
| □ Complete provider review. | Independent provider approves or requests changes; decision is attributable and terminal state correct. | Stop; return workflow through the UI after the defect/config is corrected. |
| □ Complete compliance and billing review. | Evidence is readable/immutable; readiness recalculates; review/hold/billed controls reflect actual status. | Place the synthetic month on hold, preserve evidence, and stop. |
| □ Test patient withdrawal. | Consent/enrollment/inactive transitions stop future work while history remains intact. | Stop and correct through supported state transitions; never delete the patient. |
| □ Verify independent-role allow/deny matrix. | Owner, administrator, provider, coordinator, compliance, billing, front desk, and read-only accounts have least privilege. | Disable the affected identity, stop launch, preserve audit/log evidence, and correct authorization before retest. |
| □ Verify audit and immutable evidence. | Actor/time/action/tenant chronology exists; protected evidence rejects update/delete. | Stop, restrict access, and begin security/integrity incident handling. |

## Pilot-practice activation — Hard gate

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Confirm practice roster and coverage. | Exactly named owner, administrator, provider, coordinator, backups, and least-privilege roles. | Delay invitations/patient entry until coverage is complete. |
| □ Complete role-specific orientation using synthetic data. | Each user can sign in with MFA and complete their real workflow without founder impersonation. | Keep accounts disabled or synthetic-only; provide targeted training and rerun. |
| □ Verify support and failed-email procedures with the practice. | Users know secure support channel, severity path, and that delivery requires provider evidence. | Delay live communication and retrain. |
| □ Verify no PHI in ordinary email/chat/tickets/screenshots. | Practice acknowledges approved secure-link and incident procedures. | Stop PHI processing; remove unauthorized copies under policy and assess incident. |
| □ Confirm initial patient batch and go-live window. | Approved 50–100-patient maximum, small-batch entry plan, named checkpoint, and stop authority. | Reduce/delay batch and retain synthetic-only operation. |

## Final GO decision

| Check | Expected result | Rollback or stop action if unsuccessful |
| --- | --- | --- |
| □ Review all hard gates and open exceptions. | Every row above is checked; no open P0/P1; lower exceptions have owner, expiry, control, and written approval. | Decision is NO-GO. Do not invite external users or enter PHI. |
| □ Record final release identity. | Tag, SHA, Vercel deployment ID, Supabase project ref, final migration, evidence folder, and UTC time are complete. | Stop until one consistent identity is proven. |
| □ Obtain founder/release approval. | Signed GO. | NO-GO. |
| □ Obtain security/compliance approval. | Signed GO. | NO-GO. |
| □ Obtain pilot-practice approval. | Signed GO. | NO-GO. |
| □ Obtain technical release-operator approval. | Signed GO and on-call ownership. | NO-GO. |
| □ Begin pilot in small batch and monitor. | First users/patients operate normally; logs, email, database, backups, queue, and support are watched. | Pause onboarding/work, preserve evidence, and execute the appropriate rollback/incident procedure. |

## Approval record

Candidate tag: `______________________________`

Candidate SHA: `______________________________`

Vercel deployment ID: `______________________________`

Supabase project ref: `______________________________`

Final migration: `______________________________`

Evidence package: `______________________________`

Pre-release recovery point: `______________________________`

Open P0/P1: `________`

Approved exceptions: `______________________________`

| Approver | Decision | Name | UTC timestamp | Evidence/signature |
| --- | --- | --- | --- | --- |
| Founder/release owner | GO / NO-GO |  |  |  |
| Security/compliance owner | GO / NO-GO |  |  |  |
| Pilot-practice approver | GO / NO-GO |  |  |  |
| Technical release operator | GO / NO-GO |  |  |  |

Final decision: `GO / NO-GO`

Pilot start: `______________________________`

Rollback owner: `______________________________`

Incident/support channel: `______________________________`

