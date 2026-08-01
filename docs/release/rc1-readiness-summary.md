# CCM Assistant RC1 readiness

Assessment date: 2026-08-01

Decision: **READY FOR INTERNAL PILOT**

The RC1 software has passed the local acceptance and adversarial certification exercises, including a fresh 30-migration replay, 93 pgTAP assertions, the 37-command regression suite, TypeScript, ESLint, a production build, database linting, least-privilege checks, and a synthetic 50-patient CCM month. No known software P0 or P1 remains.

RC1 is not yet ready for an external practice or PHI. The tested application candidate is still an uncommitted 41-path change set. This operations package adds five documentation files, bringing the current working tree to 46 changed paths. The hosted application is the earlier `93cbd8d2ae62f466d4229920c2c5b27e9ef2c69a` release, and the final hosted database, authentication, email, recovery, and compliance gates have not been evidenced against one immutable candidate.

## Release-freeze findings

| Control | Result | Evidence or required action |
| --- | --- | --- |
| Experimental code | **Needs release action** | Before this runbook package, the validated RC1 change set contained 29 modified and 12 untracked RC006, RC007, acceptance, migration, test, and documentation paths. The five files in this package bring the current tree to 29 modified and 17 untracked paths. Review the inventory, commit it as the frozen candidate, then require a clean tree. |
| Unfinished migrations | **No unfinished SQL found** | The repository has 30 ordered migrations. `001`–`005` are intentional zero-byte historical ledger placeholders. The three timestamped migrations after `027` are forward migrations and must be verified on hosted production. |
| Production TODOs | **No release-blocking TODO found** | Remaining TODOs and alert-based behavior are in unused legacy form components. Unused legacy API endpoints should be denied at the edge for the pilot rather than changed during feature freeze. |
| Debug behavior | **Pass with production configuration** | No production `console.log`, `console.debug`, or `debugger` was found. Persona Mode requires both `NODE_ENV=development` and `NEXT_PUBLIC_CCM_AUDIT_MODE=true`; the public production flag must remain absent or `false`. |
| Development secrets | **Pass** | Only `.env.example` is tracked; `.env.local` is ignored. Gitleaks `v8.30.1` scanned the complete intended tree and all 25 Git commits. The only two findings were reviewed synthetic false positives: an eligibility object key and deliberately fake Stripe rejection/masking strings. No production credential or PHI was identified. |
| Reproducible build | **Pass locally** | Node `24.x`, lockfile installation, TypeScript, ESLint, tests, fresh migrations, and `next build` passed. Run the same pipeline once more from the final clean commit. |

## Immutable candidate

Recommended tag: **`v1.0.0-rc.1`**

Create an annotated, preferably signed tag only after:

1. the 41-path RC1 inventory is reviewed and committed;
2. the completed current-tree and full-history secret-scan evidence is retained with the release record;
3. `npm ci` and the complete release validation pass from a clean checkout;
4. GitHub `main`, the local commit, the tag, and the Vercel deployment all identify the same SHA.

Do not tag the current `93cbd8d` commit; it does not contain the validated RC1 working tree.

## Remaining operational blockers

These are external-pilot blockers, not requests for more product development.

1. **No immutable RC1 artifact.** The validated work is not committed or tagged.
2. **Hosted database level is unverified.** Repository evidence last showed hosted development through `027`; the three timestamped forward migrations require an explicit production ledger check and controlled application.
3. **Hosted candidate is behind.** Vercel production deployment `dpl_9NBuRX9cBKfQGY4vyEjR9qjw6q1L` is healthy but serves SHA `93cbd8d`, not RC1.
4. **Production Supabase configuration is not evidenced.** Live Supabase reads were unavailable to this audit. Auth redirects, TOTP, session policy, leaked-password protection, SSL enforcement, network restrictions, database logging, RLS advisers, and final grants must be captured.
5. **Custom SMTP is not proven.** Confirmation, invitation, password-recovery, expired-link, rejection, and defer paths need provider message IDs and final delivery results against the RC1 deployment.
6. **Recovery is not proven.** Enable the approved backup/PITR tier and complete an isolated restore drill with measured RPO/RTO before PHI.
7. **PHI agreements and operating policies are not evidenced.** Supabase, Vercel, and any email provider must be covered by appropriate agreements/BAAs; the organization also needs approved risk analysis, retention, incident, access-review, training, and support procedures.
8. **Production environment values are not independently verified.** Verify names, scopes, project association, sensitivity, and post-deployment behavior without exposing values.

## Required external dependencies

| Dependency | Requirement before external pilot |
| --- | --- |
| Supabase | Paid plan/features appropriate for the selected backup and security controls; signed BAA and HIPAA add-on/High Compliance configuration when PHI is stored; custom SMTP; Auth, database, RLS, logging, and recovery evidence. |
| Vercel | Account/plan and BAA appropriate for PHI; Production-only secrets; Node 24; canonical domains; access controls; deployment and rollback evidence. |
| Email provider | Custom SMTP with approved sender domain, SPF, DKIM, DMARC, provider logs, message IDs, and an agreement/BAA or documented determination appropriate to message content. |
| DNS/domain | Control of `ccmassistant.com`; `www` canonical HTTPS; apex redirect; verified SMTP records. |
| Pilot practice | Signed pilot scope and BAA, named owner/provider/coordinator/administrator, synthetic-data rehearsal, training acknowledgement, support contacts, and go-live approval. |
| Security/compliance owner | Approved risk analysis, minimum-necessary access, incident/breach procedure, retention policy, backup access, periodic access review, and exception register. |
| Release operators | Named deployment, database, rollback, security, and incident owners with access protected by MFA. |

## Known pilot boundaries

- One practice, one provider, one coordinator, one administrator, and 50–100 patients.
- No live Stripe billing in RC1 unless separately approved and validated; keep Stripe variables absent or test-only.
- No OpenAI dependency is required; omit the optional key to use deterministic behavior.
- In-application patient email is optional. If Resend is not approved, use the documented secure-link/manual delivery procedure.
- Supabase Storage is not used by RC1. Verify that no unexpected bucket exists; practice logos are URLs rather than managed uploads.
- Email and ordinary support channels must not contain PHI. Use only approved secure channels.

## Final recommendation

**READY FOR INTERNAL PILOT**

The application is ready for a controlled internal synthetic-data rehearsal using the frozen workflow. It becomes **READY FOR EXTERNAL PILOT** only when every launch-day hard gate in `rc1-launch-day-checklist.md` passes against one tagged SHA and the signed approval record is complete. No real patient or PHI may be entered before then.
