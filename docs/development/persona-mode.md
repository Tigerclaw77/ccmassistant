# Development Persona Mode

Development Persona Mode is a local-only founder and developer aid for reviewing CCM Assistant from multiple team perspectives without creating additional accounts, changing database roles, or repeatedly signing out.

## Security boundary

The mode is available only when both conditions are true:

```text
NODE_ENV=development
NEXT_PUBLIC_CCM_AUDIT_MODE=true
```

The `/dev/personas` route returns the normal not-found experience unless both gates are satisfied. The server also ignores persona headers in production, even if a caller fabricates one or a production environment accidentally contains the public flag.

Persona Mode does not replace authentication. Every API request still requires the real Supabase access token, a server-confirmed user, configured MFA at AAL2, and a real active practice membership. The canonical resolver obtains that real membership first and then, in the gated development runtime only, returns a copied membership with the selected effective persona role. Supabase RLS continues to evaluate the real JWT and real database membership.

The overlay never uses the service-role key. Switching or resetting personas performs no database mutation, membership update, role assignment, or audit write.

## Enable

In `.env.local`:

```dotenv
NEXT_PUBLIC_CCM_AUDIT_MODE=true
```

Start the development server normally, authenticate with a local development user, complete MFA, and open:

```text
http://localhost:3000/dev/personas
```

Restart the development server after changing the environment flag.

## Disable

Set `NEXT_PUBLIC_CCM_AUDIT_MODE=false`, remove the variable, or run a production build. Resetting from the toolbar immediately removes the current session overlay and restores the original active practice and real authorization context.

## Supported personas

- Dr. Paul — Organization Owner
- Practice Administrator
- Chris — Compliance Administrator
- Nancy — Billing Administrator
- Dr. Paul — Provider
- Clinical Staff
- Mary — Remote Coordinator
- Polly — Clinic Coordinator
- Front Desk
- Read Only
- Patient
- Developer — full application visibility

The floating toolbar switches the persona, practice, patient, provider, and coordinator context. It also shows the organization and assigned patient scope and links directly to the current user, current patient, current queue, coordinator queue, provider review, billing, compliance, and settings.

All overlay state is stored in browser `sessionStorage`. It lasts only for the current tab session and is never written to local storage, Supabase, or an audit table. The existing `activePracticeId` preference is temporarily changed when switching practices; the toolbar remembers and restores its original value on reset.

## Limitations

- This is a workflow and authorization-context simulator, not user impersonation.
- Provider and coordinator selections provide shared workflow context but do not forge a Supabase identity or database membership.
- RLS continues to use the real developer account. Use separate real accounts and database contract tests for final RLS verification.
- The patient persona opens the selected patient-centered workspace. A dedicated patient portal remains future work and must eventually authorize through `patient_access_memberships`.
- Switching personas itself is read-only. Existing application actions still behave normally and may write data when intentionally submitted; use synthetic local data only.
- Never enable the flag against hosted production data.

## Validation expectations

Run:

```powershell
npm.cmd run test:persona-mode
npm.cmd run test:authorization
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The production build must omit the toolbar, return not-found for `/dev/personas`, and ignore any supplied persona header.
