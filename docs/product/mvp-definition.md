# CCM Assistant MVP Definition

Status: RC-007 MVP lock  
Authority: This document supersedes earlier MVP scope proposals where they conflict.  
Pilot boundary: one primary-care practice completes one CCM month using synthetic patients.

## Decision rule

Every feature is evaluated with one question:

> Would the first synthetic-patient pilot fail without this?

`MUST HAVE` means **yes**. Every other classification means **no**; `SHOULD HAVE`, `NICE TO HAVE`, and `POST-MVP` only describe how firmly the feature is deferred. Existing deferred features may remain available for compatibility, but they are not part of the supported pilot path and must not create setup requirements.

## Smallest complete product

The MVP is one guided loop:

1. An owner creates and secures an account.
2. The owner creates a practice, identifies the first provider, and accepts recommended starter kits.
3. The owner adds a coordinator when work will be delegated.
4. Staff creates a patient, assigns the Primary Responsible Provider, records qualifying conditions, eligibility, consent, and active enrollment.
5. Staff completes a deterministic clinical intake and care plan.
6. The provider reviews the care plan and any routed clinical work.
7. The coordinator contacts the patient through a secure check-in link or documents a non-response.
8. The coordinator performs patient-benefiting work, documents the outcome, and records actual time.
9. The system explains detected care opportunities; a human accepts, defers, routes, or dismisses them.
10. Billing review verifies the evidence, preserves the reviewed snapshot, and records the external billing disposition.

The MVP ends at billing-ready documentation. It does not submit a claim, make clinical decisions, invent work to reach a time threshold, or require an AI service.

## Exact MVP feature list — MUST HAVE

| Area | Feature | Why the pilot fails without it | Current state |
| --- | --- | --- | --- |
| Access | Signup, confirmation, login, logout, recovery, and expired-link recovery | No secure first-run or account recovery path | Implemented; hosted delivery proof remains operational |
| Access | TOTP MFA | The current security and authorization contract requires AAL2 | Implemented |
| Practice | Guided first-practice creation | No tenant context for staff or patient data | Implemented |
| Practice | Practice name, organization type, timezone, phone, and recommended defaults | The practice cannot establish a usable operating context | Implemented |
| Practice | First-provider bootstrap | Patient enrollment otherwise reaches an empty PRP list | Implemented |
| Practice | Add and maintain provider profiles | A practice cannot assign clinical responsibility | Implemented |
| Staff | Invite a coordinator and assign/remove operational access | A delegated pilot cannot create the care team it is testing | Implemented; hosted email delivery is operational |
| Staff | Founder override and least-privilege role enforcement | Owner recovery and multi-role safety fail without it | Implemented |
| Clinical defaults | Select curated starter kits with safe defaults | A new practice otherwise begins from blank clinical configuration | Implemented in RC-006 |
| Patient | Patient creation and basic contact/demographic data | There is no patient to manage or contact | Implemented |
| Ownership | Exactly one active Primary Responsible Provider with immutable history | Clinical responsibility and evidence attribution are ambiguous without it | Implemented |
| Enrollment | Two qualifying chronic conditions | CCM eligibility cannot be supported | Implemented |
| Enrollment | Structured eligibility facts and provider attestation | The system cannot substitute for the provider eligibility decision | Implemented |
| Enrollment | Consent status, method, date, required elements, and audit history | The patient-month cannot become billing-ready | Implemented |
| Enrollment | Active CCM enrollment and coordinator assignment | The patient cannot enter the active monthly workflow | Implemented |
| Intake | Deterministic clinical intake questionnaire and human-reviewed summary | The care team lacks a shared clinical baseline | Implemented; no AI key required |
| Care plan | Create/edit goals, interventions, barriers, and notes | CCM work lacks an active plan | Implemented |
| Care plan | Route provider review, request revision, and approve | The plan cannot become reviewed clinical evidence | Implemented |
| Daily work | Role-scoped worklist with one next action | Coordinators cannot reliably identify or continue work | Implemented |
| Opportunities | Explainable detection from patient evidence | The required pilot workflow cannot identify patient-specific follow-up | Implemented; human disposition required |
| Tasks | Accept/defer/route/complete work inside the patient workspace | Accepted work otherwise becomes a dead end | Implemented |
| Contact | Create a monthly check-in and copy a secure public link | The practice cannot contact a synthetic patient without an integration | Implemented |
| Contact | Capture response or document non-response closure | Monthly contact remains permanently incomplete | Implemented |
| Documentation | Record outcome, actual date, actual minutes, and follow-up | The month lacks defensible work evidence | Implemented |
| Time | Patient/month time accumulation with no automatic time | Billing readiness cannot be calculated safely | Implemented |
| Continuity | Return to worklist and select the next patient | The daily workflow stalls after documentation | Implemented |
| Billing | Recalculate billability and show plain-language blockers | Staff cannot know what prevents completion | Implemented |
| Billing | Patient-month evidence view and immutable reviewed snapshot | The practice cannot defend the readiness result | Implemented |
| Billing | Human mark-reviewed, hold, and mark-billed states | The operational month cannot be closed without claiming automatic billing | Implemented |
| Security | Tenant isolation, RLS, least-privilege grants, audit records, and server-only privileged keys | A practice pilot would be unsafe without them | Implemented locally; hosted verification remains operational |

## SHOULD HAVE

The pilot can finish without these, but existing versions may reduce supervision or recovery effort. They are frozen unless a pilot-blocking defect is found.

| Feature | MVP treatment |
| --- | --- |
| Compliance evidence investigation | Keep the existing dashboard; do not expand it |
| Practice management summary | Keep available by direct route; exclude from primary MVP navigation |
| Provider attention queue pagination and prioritization | Keep existing implementation |
| Manual patient communication templates | Keep copyable invitation/reminder/follow-up text |
| Invitation resend/cancel and staff disable/re-enable | Keep as operational recovery controls |
| Clinical knowledge lookup and ICD classification | Keep available; starter kits and patient conditions remain the primary path |
| Duplicate-patient warning | Keep existing warning; no merge workflow |
| Care-plan revision history and PRP ownership history | Preserve existing evidence; no new history UI |
| Billing CPT review suggestions | Keep review-only; never automate coding or claims |
| Responsive desktop/mobile behavior | Maintain current support; no mobile redesign |

## NICE TO HAVE

These do not affect whether the first pilot can complete one month.

| Feature | MVP treatment |
| --- | --- |
| Management dashboard detail and staffing analytics | Defer |
| Advanced compliance dashboard filters | Defer |
| Full question-bank browsing | Keep available outside primary navigation |
| Per-practice editing of every starter-kit prompt | Defer; selection is sufficient |
| Formal PDF/CSV exports | Defer; the HTML evidence view is sufficient |
| Theme, logo, and presentation polish beyond current setup | Defer |
| Public marketing demo and request-demo automation | Defer from pilot operations |
| Developer Persona Mode and audit overlays | Retain as development tools, never expose in production |

## POST-MVP

These are explicitly outside the locked product. They must not become pilot prerequisites.

| Feature | Reason deferred |
| --- | --- |
| AI intake generation, chatbot, coworker prompts, summaries, or recommendations | The deterministic intake completes the MVP; AI adds vendor, privacy, validation, and clinical-governance work |
| Advanced analytics or new dashboards | One synthetic month is proven by the worklist and evidence view |
| EHR, payer, clearinghouse, fax, or claims integrations | Manual evidence handoff is sufficient |
| Automatic claims submission or automatic billing | The practice retains the billing decision and uses its existing process |
| Automated SMS | Secure-link copy is sufficient |
| In-app patient email provider integration | Manual secure-link delivery is sufficient; Supabase Auth SMTP remains an account-lifecycle dependency |
| Patient portal/accounts | Public tokenized check-ins cover the pilot patient interaction |
| Autonomous clinical decisions, escalation, or documentation | Human judgment is mandatory |
| Automatic work creation based only on time threshold | Time is context, never a reason to invent work |
| Department management and custom role builders | Existing practice roles cover the pilot |
| Multi-practice enterprise administration | One practice is the pilot boundary |
| Custom clinical protocol engine and escalation thresholds | Requires clinical governance beyond the pilot |
| Stripe subscription operations | Commercial billing is unrelated to completing a CCM month |
| Rich file storage, consent uploads, and e-signature | Structured consent evidence is sufficient for the synthetic pilot |
| Recurring scheduler/cron automation | A single month can be initiated through the existing workflow |

## Friction removed at MVP lock

- Owner and Practice Administrator roles now take navigation precedence over secondary provider/compliance assignments. A treating founder retains Worklist, Patients, Provider review, Billing, and Settings.
- Primary navigation contains only the role's required pilot destinations. Knowledge, Question Banks, Management, and other optional pages remain available outside the primary path.
- The required intake is presented as **Clinical Intake**, not **AI Intake**. Its active workflow is deterministic and does not require `OPENAI_API_KEY`.
- The RC-006 patient workspace retains one guided action; secondary tools remain progressively disclosed.
- Recommended starter kits eliminate blank configuration and can be changed later.

## Remaining software blockers

No known application feature is missing from the locked synthetic-patient MVP.

Before declaring the software candidate immutable, one release-level proof remains: execute the complete one-month workflow with separate owner, coordinator, and provider identities against the final local candidate and retain the evidence. Any failure found there is a blocker; new feature requests are not.

## Remaining operational blockers

These prevent a hosted external pilot but do not expand the MVP:

1. Freeze, review, secret-scan, commit, and push the current RC-006/RC-007 candidate.
2. Apply the two already-approved pending migrations after backup/change-window approval; hosted development currently ends at migration `027`.
3. Verify the four required Vercel variables against the same Supabase project and canonical application origin.
4. Configure Supabase Auth Site URL, narrow redirects, email confirmation, password/leaked-password policy, TOTP/session controls, and rate limits.
5. Configure and prove approved custom SMTP for confirmation, invitation, and password recovery, including provider message IDs and final outcomes.
6. Run the hosted synthetic lifecycle and one-month workflow against the exact deployed SHA.
7. Complete backup/restore evidence, security/compliance/vendor approvals, support ownership, and the signed founder/practice GO decision before PHI.

## Engineering estimates

Estimates assume no new feature scope and no hidden hosted failure.

| Target | Engineering effort | Included |
| --- | ---: | --- |
| Immutable local MVP candidate | 6–10 hours | Separate-role one-month acceptance run, evidence capture, regression-only fixes, final inventory, secret scan, and release packaging |
| Hosted synthetic pilot candidate | Additional 10–18 hours | Migration/change-window execution, environment/Auth/SMTP configuration verification, deployment, hosted workflow validation, restore evidence, and release report |

External approvals, vendor contracting, DNS propagation, SMTP reputation, and founder/practice scheduling are calendar-time dependencies and are not engineering-hour estimates.

## Recommended implementation order

1. Keep the feature freeze active and accept this document as the product boundary.
2. Complete RC-007 navigation and clinical-intake terminology regression checks.
3. Run the final local separate-role, one-month synthetic acceptance workflow.
4. Fix only failures that prevent that workflow; classify everything else as deferred.
5. Freeze and package the immutable candidate after founder approval.
6. Complete hosted migrations, environment, Auth, SMTP, backup, and deployment gates in the existing release checklists.
7. Run the hosted synthetic workflow and collect evidence against the exact SHA.
8. Obtain the signed GO decision before inviting an external user or entering PHI.

## MVP acceptance test

The MVP passes only when a first-time practice can, in under one hour and without product documentation:

- secure the owner account;
- create the practice and first provider;
- accept starter-kit defaults;
- add a coordinator when needed;
- create and enroll a synthetic patient;
- complete eligibility, consent, clinical intake, and an approved care plan;
- send or copy a secure monthly check-in and close the response cycle;
- act on or dismiss explained care opportunities;
- document actual work and time;
- route and complete provider review;
- reach billing-ready status; and
- preserve reviewed evidence and record the external billing disposition.

Any requested capability beyond this test is deferred unless its absence demonstrably causes the test to fail.
