# RC-005 pilot gate closure

## Scope

RC-005 closes the two RC-004 P0 software findings without redesigning unrelated workflows.

## Authentication lifecycle

- Owner confirmation redirects to a recoverable sign-in destination and supports confirmation resend.
- Auth callback errors, including expired or already-used links, are shown as actionable recovery messages.
- Password recovery is permitted before MFA only on the reset page. A successful reset signs the recovery session out; normal sign-in and MFA are still required before workspace access.
- Invitations preserve their identifier through MFA, reject wrong-email/expired/reused links, and support administrator resend/cancel.
- The UI reports an invitation **request**, not unverified provider delivery.
- Hosted SMTP, templates, redirects, delivery, rejection, defer, and link-expiry evidence follow `docs/operations/hosted-auth-validation.md`.

## Operational roles

`practice_member_role_assignments` is now the application authorization source. `practice_members.role` remains a compatibility projection while old routes and data migrate.

| Role | Provisioning | Effective pilot access |
| --- | --- | --- |
| Founder / Organization Owner | First owner only; protected | Organization override and practice administration |
| Practice Administrator | Invite/change/remove | Practice and staff administration |
| Provider | Invite/change/remove | Provider and clinical workflows |
| Clinical Staff | Invite/change/remove | Assigned clinical workflows |
| Coordinator | Invite/change/remove | Assigned workflow; optional unassigned-patient claim |
| Compliance Administrator | Invite/change/remove | Compliance evidence read workflow |
| Billing Administrator | Invite/change/remove | Billing workflow |
| Front Desk | Invite/change/remove | Patient registry read access |
| Read Only | Invite/change/remove | Patient and knowledge read access |

Invitation acceptance binds the canonical assignment to the authenticated user. Disable/remove expires active assignments; re-enable restores the last role; role changes close the old assignment and create the new one. Founder removal and reassignment remain blocked. Persona Mode overlays the same returned access-role context only in its existing development-only gate and does not persist roles.

## Database

`20260801170717_rc005_operational_role_provisioning.sql` adds the invitation access role, an AAL2 canonical-role helper with explicit founder override, and canonical role enforcement for legacy RLS policy checks and coordinator patient scope. Anonymous execution remains revoked and security-definer functions use an empty `search_path`.

## Remaining external gates

- Configure and prove custom SMTP in hosted development.
- Run the complete hosted lifecycle matrix against the exact release SHA and retain provider message IDs/outcomes.
- Complete the existing legal, vendor, backup/restore, edge-protection, and PHI approvals before any live-patient use.

These are operational gates. No hosted success is claimed by repository validation.

## Validation record

- TypeScript: pass.
- ESLint: pass, no warnings.
- Production build: pass, 64 routes/pages generated.
- Full regression suite: pass, 35 commands.
- Fresh local migration replay: pass, all 29 migration versions applied in order without seed data.
- pgTAP: pass, 93 assertions across five contract files.
- Local database lint: pass, no schema or function warnings.
- `git diff --check`: pass.

The repository-side pilot readiness estimate is **95/100**. End-to-end external-pilot readiness is **88/100** until hosted SMTP and authentication lifecycle evidence are complete.

## Gate recommendation

**NO-GO for the first external pilot today.** There is no known remaining P0 application implementation blocker, but hosted authentication delivery is a P0 operational dependency and has not been proven. Change this recommendation to GO only after the hosted lifecycle matrix passes against the exact release SHA and all pre-existing legal/PHI approvals required for the pilot are recorded.
