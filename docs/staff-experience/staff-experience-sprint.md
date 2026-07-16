# CCM Assistant Staff Experience Sprint

Prepared: 2026-07-16

## Scope

This sprint improves daily staff navigation and presentation over the existing authorization, ICD, question-bank, session, customization, billability, evidence, and hosted foundations. It does not add an engine, change billing transitions, alter clinical content, or automate billing.

## Coordinator improvements

Implemented:

- A single-call worklist now groups urgent, blocked, overdue, provider-review, near-threshold, one-more-interaction, ready-to-bill, and billed work.
- Minutes show current progress, remaining time, and threshold completion without opening the patient workspace.
- Priority sorting puts urgent and high-priority tasks first while preserving the selected month, assignment, search, and readiness context.
- Check-in creation copies a complete patient invitation; invitation, reminder, follow-up, and link-only actions remain explicit.
- Patient Workspace remains the canonical detailed record and continues to link eligibility, intake, care plan, check-in, time, and evidence.

Next high-ROI refinement: persist due dates and contact-attempt scheduling so “overdue” is based on practice policy rather than an incomplete monthly contact state.

## Provider improvements

Implemented:

- A provider workspace shows only clinical alerts, eligibility approvals, care-plan reviews, and other provider-owned work.
- Clinical alerts are visually distinct and lead directly to the affected patient action.
- Role-aware navigation makes the provider attention queue the provider’s primary destination.

Next high-ROI refinement: provider-specific assignment filtering after every pilot provider account is linked one-to-one with a provider record.

## Billing improvements

Implemented:

- Dedicated review queues: ready to bill, ready after one small action, missing evidence, missing minutes, provider review pending, consent issue, eligibility issue, hold, and billed.
- Every row shows minutes against the practice threshold, missing evidence, review state, and direct evidence access.
- Display-only CPT review suggestions appear only after the existing billability engine returns ready or billed. They never submit a claim or change status.
- All reviewed, hold, release, and billed actions retain existing authorization, confirmation, and audit behavior.

The current coding display covers standard CCM `99490` and additional 20-minute `99439` review only. Complex CCM, practitioner-only CCM, payer-specific rules, claims, CMS-1500, and automatic billing remain outside scope.

## Management improvements

Implemented:

- An owner/admin-only operations dashboard shows active CCM patients, eligible-not-enrolled patients, monthly enrollment, check-in completion, patients at risk, staff workload, monthly billing flow, and documented minutes.
- Documentation bottlenecks, diagnoses, session-derived question-bank usage, canonical question usage, and custom-question usage are ranked.
- The view prints as a monthly operational report without showing charges or claims.

Next high-ROI refinement: add trend snapshots after at least three complete pilot months exist; avoid presenting one-month noise as a trend.

## Patient communication improvements

Implemented templates:

- Program invitation
- Monthly check-in invitation
- Check-in reminder
- Follow-up reminder
- Completed check-in confirmation
- Enrollment confirmation
- Password reset
- Account verification
- Disabled future SMS placeholders

Templates use short paragraphs, one prominent action, secure-link language, support contact fallback, and urgent-care boundaries. They contain no marketing. Supabase Auth email templates still require configuration in the hosted Auth dashboard; the repository catalog is the approved copy source.

## Question-bank management improvements

Implemented:

- Global, clinic, provider, personal, candidate, and version-history views.
- Favorites appear before search results and persist at clinic, provider, or coordinator scope.
- Clinic administrators can create and retire versioned custom questions.
- Candidate questions remain separate, require no-PHI attestation, and support explicit anonymous contribution opt-in.
- Canonical banks remain immutable and internal identifiers are not rendered in the UI.
- Existing contexts and review state serve as searchable tags.

Medium priority: visual include/exclude, reorder, selection-level, and replace controls over the existing override records. Future: versioned bulk clinic tags and saved cross-condition combinations after usage research confirms their shape.

## Favorites design

Current sources:

- Diagnoses: existing condition favorites shown before ICD search.
- Question banks: clinic, provider, and coordinator versioned favorites.
- Questions: existing provider question-preference foundation; administrative bulk controls remain medium priority.
- Frequently used combinations: management shows session-derived bank usage; explicit saved combinations remain future work.

Precedence remains System, Clinic, Provider, Coordinator. A later scoped favorite version supersedes the earlier version without deleting history.

## Reporting improvements

| Audience | Immediate report | Decision supported |
| --- | --- | --- |
| Coordinator | Daily action queue and patient-month progress | Who needs contact or documentation next |
| Provider | Attention and approval queue | Which clinical items require practitioner action |
| Biller | Monthly billing review and evidence queue | Which patient-months can proceed to manual billing |
| Management | Monthly operations dashboard | Capacity, completion, bottlenecks, and enrollment |
| Patient | Check-in completion confirmation | Whether the care team received the submission |

High ROI next reports are coordinator aging, provider turnaround time, unresolved non-response, and month-over-month billable completion. Financial revenue reporting should wait for approved pricing and claims reconciliation inputs.

## Prioritized roadmap

| Priority | Improvement | Engineering effort | Workflow benefit |
| --- | --- | ---: | --- |
| Critical | Validate role queues, communications, scoped favorites, and management RLS in hosted staging | 1-2 days | Prevents staff confusion and tenant-access regressions |
| Critical | Configure approved verification/reset copy in hosted Supabase Auth | 2-4 hours | Makes production account recovery understandable |
| High ROI | Persist outreach due dates and reminder history | 2-3 days | Makes daily/overdue work precise and reduces missed contact |
| High ROI | Link each provider membership to one provider record and filter provider attention | 1-2 days | Removes irrelevant physician work |
| High ROI | Add override editor for include, order, default, required/recommended/optional, retire, and replace | 4-6 days | Makes existing customization usable without database tools |
| High ROI | Add coordinator and provider turnaround reports | 2-3 days | Reveals operational bottlenecks |
| Medium | Versioned bulk tags for clinic questions and banks | 2-3 days | Improves administration at scale |
| Medium | Export operational CSV with minimum necessary fields | 1-2 days | Supports offline practice review |
| Medium | Three-month trend dashboard | 3-4 days | Supports staffing and enrollment decisions |
| Future | Saved cross-condition question combinations | 3-5 days after workflow research | Speeds repeated complex sessions |
| Future | SMS delivery adapter and consent/preferences | 5-8 days plus vendor review | Adds another patient contact channel |
| Future | Patient-facing monthly summary | 3-5 days plus clinical/legal review | Improves patient understanding |

## Immediate sprint recommendation

Run the complete regression/build suite, then perform one hosted role walkthrough each as coordinator, provider, biller, and owner using synthetic data. Validate navigation, queue membership, cross-practice denial, favorite precedence, custom-question retirement history, patient copy/paste rendering on mobile, and manual billing confirmations. Fix only observed workflow defects before adding medium-priority controls.
