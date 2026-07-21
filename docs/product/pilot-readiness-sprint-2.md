# Pilot Readiness Sprint 2

## Follow-on coordinator workflow

The task-driven coordinator queue and deterministic suggested-care detector are specified in [coordinator-workflow-and-opportunity-detector.md](./coordinator-workflow-and-opportunity-detector.md). They preserve the Sprint 2 role hierarchy and PRP ownership model while adding scoped work execution, multi-clinician routing, and immutable suggestion/decision history.

## Scope

Sprint 2 establishes first-run onboarding, guided MFA, self-service practice creation, and the durable role and clinical-ownership model. It deliberately does not implement department management or replace the existing permission checks throughout the application.

## First-run onboarding

The authenticated entry flow is:

1. Create an account.
2. Verify the email address through Supabase Auth.
3. Configure or challenge a TOTP authenticator factor (AAL2).
4. Create the organization and practice.
5. Complete the essential practice profile and defaults.
6. Receive Organization Owner and active practice membership records.
7. Enter the patient workspace.

`resolve_practice_access` now returns `bootstrap` whenever an AAL2 user has no active membership. It does not inspect whether another organization already exists. A stale requested practice ID falls back to another active membership for the user.

Practice creation is one `SECURITY DEFINER` transaction through `bootstrap_user_practice`. It is serialized per user, idempotently returns an existing membership, and atomically creates:

- the organization;
- the Organization Owner membership;
- the practice and setup profile;
- the backward-compatible active `owner` practice membership;
- the canonical Practice Administrator role assignment; and
- an onboarding audit event.

The function requires an authenticated AAL2 session. Execute privileges are revoked from `public` and `anon` and granted only to `authenticated`.

## MFA onboarding

The MFA wizard explains what MFA is and why it protects patient information, then guides the user through:

1. installing or opening an authenticator app;
2. scanning the QR code (with a manual key fallback);
3. entering the current six-digit code; and
4. confirming successful enrollment before entering the application.

Recommended apps are Microsoft Authenticator, Google Authenticator, 2FAS, Authy, and 1Password.

Unverified TOTP factors and locally persisted QR details are reconciled on return. If setup was interrupted, the user sees what was preserved and can Continue, Restart, or Cancel. Restart removes only unverified factors before creating one replacement. Cancel removes unfinished enrollment but never removes a verified factor.

## Practice setup

Initial setup collects only:

- practice name;
- organization type;
- IANA time zone;
- optional primary address;
- phone;
- optional logo URL;
- default coordinator assignment mode; and
- notification defaults.

Billing attestations, provider setup, subscription details, and advanced clinical configuration remain in later settings workflows. Required security notifications are not controlled by the notification-default checkboxes.

## Role architecture

The current `practice_members.role` enum remains intact so existing authorization and invitations continue to work. Sprint 2 adds a canonical, multi-role assignment layer:

| Canonical role | Scope | Hierarchy rank |
| --- | --- | ---: |
| Organization Owner | Organization | 100 |
| Practice Administrator | Practice | 90 |
| Department Administrator | Department (future) | 80 |
| Compliance Administrator | Practice | 75 |
| Billing Administrator | Practice | 70 |
| Provider | Clinical | 60 |
| Clinical Staff | Clinical | 50 |
| Coordinator | Clinical | 40 |
| Front Desk | Practice | 30 |
| Read Only | Practice | 20 |
| Patient | Patient | 10 |

Existing roles are backfilled as follows:

| Legacy role | Canonical role |
| --- | --- |
| owner | Practice Administrator, plus Organization Owner for the existing practice owner |
| admin | Practice Administrator |
| provider | Provider |
| coordinator | Coordinator |
| billing_staff | Billing Administrator |

`department_id` is reserved on role assignments for the future Department Administrator scope. No department CRUD, navigation, or permission management is included in this sprint.

Patients are represented separately in `patient_access_memberships`; they are never practice staff members. Patient-facing authorization is intentionally not enabled yet.

## Practice ownership versus clinical ownership

Practice ownership is administrative. It is represented by Organization Owner, Practice Administrator, and the backward-compatible practice owner membership.

Clinical ownership is independent. Every patient has exactly one current Primary Responsible Provider (PRP), enforced by a non-null `patients.primary_provider_id`. Each initial assignment or reassignment appends an event to `patient_primary_provider_history`. History rows cannot be updated or deleted.

Provider lifecycle follows one enforced sequence: transfer every active PRP assignment, deactivate the provider, then archive the provider. Providers cannot be deleted, and the patient foreign key uses `ON DELETE RESTRICT`; ownership can therefore never be nulled or orphaned. Reactivation clears lifecycle timestamps. Immutable ownership history is retained even after the provider is archived.

Provider supervision and staff responsibility are modeled separately in `provider_staff_assignments`:

- one provider can supervise multiple staff;
- one staff member can work with multiple providers;
- responsibility assignments can end and be reassigned; and
- changing a staff assignment does not change the patient's PRP.

Authorization must use role assignments and practice membership, not the PRP field. The PRP represents accountable clinical ownership, not broad access permission.

## Security boundaries

All new public tables have RLS enabled. Anonymous, authenticated, and service-role defaults are revoked before exact privileges are granted. Authenticated grants are limited to operations backed by policies. Immutable PRP history is written by a trigger-only function, while application users receive select-only access to that history.

Composite foreign keys bind role assignments, patient access, provider/staff responsibilities, and PRP history to the practice carried by their parent rows. Independent UUID references cannot be combined to forge a cross-tenant relationship.

The bootstrap function retains the same AAL2 requirement as normal server authorization. It is an intentional `SECURITY DEFINER` transaction because a user with no practice membership cannot yet receive ordinary table-write access. It has a fixed trusted search path, fully qualified application relations, authenticated-only execute access, and an explicit database comment. The membership resolver and organization-membership RLS helper have the same documented, narrowly scoped treatment. No application default bypasses MFA, validation, membership checks, or RLS.

## Future extensibility

The canonical assignment table supports multiple roles per staff member and future department scope without changing the legacy role column during the pilot. Later work can:

- add departments and bind `department_id` to a department foreign key;
- migrate API permission checks from legacy roles to canonical capabilities;
- add invitation choices for all canonical roles;
- provide patient portal authorization against `patient_access_memberships`;
- add logo upload storage while retaining `logo_url`; and
- add UI for provider/staff assignment and PRP reassignment reasons.

These extensions do not require using clinical ownership as an authorization mechanism.
