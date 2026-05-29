# Implementation Backlog

## P0 Critical

### Auth

- Description: Implement Supabase login/signup, session handling, and authenticated navigation.
- Dependencies: Supabase project, auth env vars, practice bootstrap decision.
- Estimated complexity: Medium.
- Why it matters: Every secure workflow depends on knowing the current user.
- Status: Initial Supabase email/password UI and route gate implemented; still needs live auth testing and any password reset/email confirmation UX.

### RLS

- Description: Apply and test the draft RLS policies with multiple practices and roles.
- Dependencies: Schema migration applied to Supabase.
- Estimated complexity: High.
- Why it matters: CCM data is PHI-like and must be practice-scoped.

### Practice Membership

- Description: Build practice creation, owner bootstrap, invitations, active/inactive membership, and role management.
- Dependencies: Auth and RLS.
- Estimated complexity: High.
- Why it matters: Every server mutation now requires active practice membership.
- Status: First-practice owner bootstrap and minimal member API foundation implemented; invitations are structure-only.

### Patients

- Description: Replace legacy patient UI with new `patients` table fields and server-owned create/update flows.
- Dependencies: Auth, practice membership.
- Estimated complexity: Medium.
- Why it matters: Patients are the anchor record for every CCM ledger item.
- Status: Patient list reads now use practice-scoped API; create/edit UI still needs implementation.

### Enrollment

- Description: Build CCM enrollment UI for eligibility, consent, initiating visit, assigned provider, and coordinator.
- Dependencies: Patients, providers, practice membership.
- Estimated complexity: Medium.
- Why it matters: A patient cannot be billable without enrollment and consent evidence.

### Time Ledger

- Description: Build server-owned interaction log creation and month rollup against `interaction_logs`.
- Dependencies: Patients, enrollment, practice membership.
- Estimated complexity: Medium.
- Why it matters: CCM billability depends on documented monthly time.

## P1 Important

### Provider Preferences

- Description: Build provider profiles, default preferences, favorite questions, and condition-specific preferences.
- Dependencies: Practice membership, providers.
- Estimated complexity: Medium.
- Why it matters: Provider preferences make outreach clinically relevant without AI.

### Question Bank

- Description: Build global/practice questions, tags, answer types, soft caps, and template selection.
- Dependencies: Providers, practice membership.
- Estimated complexity: Medium.
- Why it matters: Check-ins need reusable, condition-aware questions before automation.

### Care Plans

- Description: Build simple structured care plan create/update/review screens.
- Dependencies: Patients, enrollment, providers.
- Estimated complexity: Medium.
- Why it matters: CCM billing evidence requires care plan support.

### Check-ins

- Description: Replace legacy assignments/submissions with `checkin_templates`, `checkin_instances`, and `checkin_responses`.
- Dependencies: Question bank, patients, enrollment.
- Estimated complexity: High.
- Why it matters: Monthly outreach needs status, response, and follow-up evidence.

### Billability Engine

- Description: Calculate monthly status from consent, enrollment, care plan, time, and check-in evidence.
- Dependencies: Enrollment, time ledger, care plans, check-ins.
- Estimated complexity: High.
- Why it matters: This is the core product promise.

## P2 Later

### Billing Export

- Description: Export ready-to-bill patients and reason codes as CSV.
- Dependencies: Billability engine.
- Estimated complexity: Medium.
- Why it matters: Billing staff need a practical output, not just a dashboard.

### Audit Packet

- Description: Build per-patient monthly evidence pages with consent, care plan, logs, check-ins, and summary.
- Dependencies: Billability engine, time ledger, care plans, check-ins.
- Estimated complexity: Medium.
- Why it matters: Practices need confidence that billed CCM work is defensible.

### AI Question Generation

- Description: Generate candidate questions for provider approval, with approve/reject and soft caps.
- Dependencies: Stable question bank, provider preferences, check-in templates.
- Estimated complexity: Medium.
- Why it matters: Helpful later, but unsafe before the manual ledger works.

### AI Summaries

- Description: Draft summaries from time logs, care plans, and check-in responses.
- Dependencies: Clean ledger data and audit packet.
- Estimated complexity: Medium.
- Why it matters: Could reduce documentation burden after evidence data is reliable.

## P3 Future

### RPM

- Description: Remote physiologic monitoring module.
- Dependencies: Core CCM ledger success and device/data strategy.
- Estimated complexity: High.
- Why it matters: Expansion only; not needed for one clean CCM billing month.

### AWV

- Description: Annual wellness visit assistant.
- Dependencies: Stable practice/patient architecture.
- Estimated complexity: High.
- Why it matters: Adjacent revenue workflow, not current focus.

### APCM

- Description: Advanced Primary Care Management support.
- Dependencies: Billing engine abstraction and regulatory review.
- Estimated complexity: High.
- Why it matters: Future no-time-tracking model, but it would distract now.

### Population Analytics

- Description: Aggregated practice-level insights.
- Dependencies: Clean longitudinal ledger data.
- Estimated complexity: High.
- Why it matters: Only valuable after enough trusted operational data exists.

### Theme Systems

- Description: Nonessential visual theme expansion.
- Dependencies: None.
- Estimated complexity: Low.
- Why it matters: It does not improve billing utility and should stay deprioritized.

### Expansion Modules

- Description: CHI, PIN, TCM, and other care-management modules.
- Dependencies: Successful CCM ledger MVP.
- Estimated complexity: High.
- Why it matters: These are plausible later products but not Phase 1.
