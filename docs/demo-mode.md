# Demo Mode Preparation

The public `/demo` route is reserved for a future no-signup product demonstration.

## Current State

- Public landing-page links point to `/demo`.
- The route is excluded from authenticated practice routing.
- No synthetic patients, clinical records, or practice data are generated.
- No production or staging records are exposed.

## Future Demo Requirements

- Use a dedicated synthetic practice and non-identifying records.
- Keep demo data isolated from real practice data and billing activity.
- Provide role-focused views for owner, administrator, provider, coordinator, and billing staff.
- Reset the demo state deterministically between sessions.
- Never connect the demo to live Stripe billing or patient communications.

Demo implementation requires a separate approved sprint.
