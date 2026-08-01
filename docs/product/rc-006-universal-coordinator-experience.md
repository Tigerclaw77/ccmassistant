# RC-006 Universal Coordinator Experience

## Outcome

RC-006 strengthens one shared CCM workflow instead of creating separate experiences for contracted coordinators, in-house staff, nurses, physicians, or practice owners. The application now gives a first-time practice useful clinical defaults during setup and gives every authorized user one role-aware guide inside the patient workspace.

The guide consistently answers:

- what needs attention;
- why it matters;
- the next action;
- progress toward the configured monthly time threshold; and
- what can safely wait.

The underlying patient workflow, authorization model, audit behavior, and time-entry safeguards remain unchanged.

## First-run onboarding

Practice setup now includes a Clinical Starter Kits step before operational defaults. All eight starter kits are selected by default so a pilot practice is never presented with an empty clinical configuration. A practice may deselect kits during onboarding or customize the selection later in Settings.

Onboarding remains one continuous path:

1. Create the practice and profile.
2. Create or identify the first provider.
3. Select clinical starter kits.
4. Confirm coordinator and notification defaults.
5. Create and enroll the first patient.
6. Enter the patient workspace with a guided next action.

The final patient step is explicitly identified as the last onboarding step. Onboarding is only reported complete after the patient and enrollment have been created successfully.

## Clinical Starter Kits

RC-006 includes editable kits for:

- Diabetes
- Hypertension
- CHF
- COPD
- CKD
- Hyperlipidemia
- Depression
- Anxiety

Each kit provides curated defaults for monthly monitoring questions, education topics, coordinator reminders, provider review prompts, and escalation suggestions. Monitoring questions reuse the existing clinically reviewed question-bank modules; RC-006 does not create a second questionnaire system.

Selected kit IDs are stored in the existing `practices.coordinator_settings` JSON field. This is backward compatible: a practice without an explicit selection receives all starter kits. No database migration is required.

Starter-kit content is workflow guidance, not autonomous medical advice. Escalation suggestions always defer to practice protocol and human clinical judgment. Nothing is locked, and the practice can change its enabled kit selection later in the Question Bank settings page.

## Adaptive patient guidance

The patient workspace now resolves one primary action from current patient state. Prerequisites take precedence over time accumulation:

1. CCM eligibility
2. qualifying chronic conditions
3. consent
4. reviewed intake
5. care-plan creation, revision, or approval
6. monthly check-in
7. documented clinically appropriate work and actual time
8. evidence review after the monthly threshold is reached

The resolver uses the same workflow and destinations for every role. Presentation adapts to the current access role: providers receive concise review/decision wording, clinical staff and coordinators receive execution wording, and administrative roles receive operational wording. This is not a separate workflow and does not change permissions.

The workspace also shows starter guidance only for the patient's active conditions and only from the practice's selected kits. Less-frequent destinations are retained under a collapsed **More patient tools** section, reducing competing actions without removing functionality.

## AI coworker boundary

RC-006 does not add an autonomous coordinator or a new AI endpoint. Existing reviewed AI-assisted intake and deterministic explanations remain available. The new guide is rules-based and auditable. Any future assistant recommendations must continue to require human review and must never create clinical decisions, documentation, or billable time without an authorized user.

## Security and compatibility

- No migration or schema change.
- No authorization or RLS change.
- No role persistence change.
- No time-entry or audit safeguard change.
- Existing practices receive safe starter-kit defaults.
- Existing patient and coordinator workflows remain available.
- Practice administrators retain control of practice-level starter-kit selection.

## Remaining work

The following items are intentionally deferred because they require a larger product or clinical-validation scope:

- in-place editing of individual kit questions, education topics, reminders, and prompts;
- practice-specific escalation thresholds and clinical protocol approval;
- a human-reviewed AI coworker for “What am I missing?”, monthly-change summaries, and suggested improvements;
- richer owner-level operational summaries across providers and coordinators;
- prospective usability testing with contracted coordinators, in-house clinical staff, and physician-coordinators;
- hosted end-to-end validation of email and pilot operations described in the release checklists.

## Recommended RC-007 priorities

1. Validate starter-kit clinical content and escalation language with a practicing clinician, then support controlled practice customization.
2. Add a human-reviewed assistant panel for explain, summarize, and suggest actions using the same authorization and audit boundaries.
3. Run task-based usability sessions across coordinator, nurse, and physician personas and resolve only observed continuity problems.
4. Add concise owner workload and compliance summaries using existing work-item and documentation evidence.
