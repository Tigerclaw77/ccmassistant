# UX Backlog

Status: product backlog  
Goal: capture usability improvements discovered during hands-on testing without implementing them yet  
Scope: UX refinement after the functional Vertical Slice MVP is complete  
Non-goals: implementation plan, data-model changes, UI redesign, new feature development

Governing philosophy: UX improvements should follow `docs/product/product-principles.md`. Reduce cognitive load before reducing clicks, and do not remove meaningful review steps merely to make the workflow feel faster.

# High Priority (Before Physician Pilot)

## 1. Contrast & Readability

| Area | Details |
| --- | --- |
| Problem | Labels and secondary text can appear too light, muted, or disabled even when they are actionable or important. This makes the app harder to scan during normal staff work and lowers confidence in clinical/billing screens. |
| Proposed solution | Increase label and helper-text contrast throughout the application. Make required labels, field labels, blocker text, and status descriptions visibly active and readable. Reserve disabled styling only for truly disabled controls. |
| Expected benefit | Improves all-day readability for coordinators and staff, reduces input errors, and makes the product feel more mature during a physician pilot. |
| Classification | MVP |

## 2. Chronic Condition Entry

| Area | Details |
| --- | --- |
| Problem | The current free-text condition textarea is fast for prototyping but too ambiguous for practice use. It does not clearly show how many qualifying chronic conditions are recorded, does not support removal one by one, and requires staff to understand condition naming and coding. |
| Proposed solution | Replace the textarea with a structured condition manager. Conditions should appear as removable tags or compact cards. Add an `Add Condition` action and allow unlimited conditions. Show an immediate qualification indicator: `0 qualifying chronic conditions`, `1 qualifying chronic condition`, or `2+ qualifying chronic conditions (CCM requirement satisfied)`. |
| Expected benefit | Makes CCM eligibility status obvious, reduces accidental under-documentation, and makes condition capture feel like a deliberate clinical workflow rather than raw data entry. |
| Classification | MVP |

Each condition should support:

- Free-text entry.
- ICD-10 search.
- AI normalization.
- Canonical stored condition.

Example:

```text
Type:
high blood pressure

Normalize to:
Essential Hypertension (I10)
```

The staff user should not need to know ICD-10 in order to enter a usable condition.

## 3. Condition Banks

| Area | Details |
| --- | --- |
| Problem | Staff will repeatedly enter the same conditions, but a large always-visible condition library would clutter the patient workflow and distract from enrollment. |
| Proposed solution | Design three optional, collapsible condition banks: Recent, Favorites, and Search. All banks should be collapsed by default, remember each user's expand/collapse preference, and avoid permanently consuming screen space. |
| Expected benefit | Speeds up condition entry for common cases while keeping the main patient form calm and focused. |
| Classification | Phase 2 |

Condition banks:

- Recent: automatically generated from recent selections.
- Favorites: practice-configured commonly used conditions.
- Search: full searchable condition library.

Future enhancement:

- Automatically learn provider-specific frequently used conditions and surface them as intelligent suggestions.

## 4. Provider Experience

| Area | Details |
| --- | --- |
| Problem | Provider editing currently feels database-like. It exposes fields functionally, but does not frame the provider as a billing practitioner whose readiness affects CCM billing. |
| Proposed solution | Replace raw provider editing with a provider profile experience. Present key information in readable groups: name, provider type, credentials, NPI, Medicare billing eligibility, and manual review status. Keep editing simple, but make the profile read like an operational credentialing summary rather than a table row. |
| Expected benefit | Improves trust for administrators and physicians, makes manual review status easier to understand, and reduces the chance that billing readiness blockers feel mysterious. |
| Classification | MVP |

# Medium Priority

## Executive Experience

| Area | Details |
| --- | --- |
| Problem | Practice owners, administrators, compliance reviewers, and financial stakeholders need a different information density than daily coordinators. Current screens mainly serve the operator workflow. |
| Proposed solution | Define an executive presentation layer over the same workflow: billing readiness summaries, compliance status, practice-level blockers, and financial oversight views. |
| Expected benefit | Helps decision-makers understand value and risk without working through every patient task screen. |
| Classification | Phase 2 |

## Staff Experience

| Area | Details |
| --- | --- |
| Problem | Front desk staff, care coordinators, and nurses need screens that are comfortable for 8-hour daily use. Dense forms, unclear labels, or repeated scrolling can become fatiguing. |
| Proposed solution | Refine the staff-facing workflow for low cognitive load: stronger contrast, clearer next actions, compact status summaries, fewer unnecessary clicks, and form sections optimized for repeated use. |
| Expected benefit | Makes CCM Assistant more realistic as a daily operations tool rather than a demo-only workflow. |
| Classification | MVP / Phase 2 |

## Patient Experience

| Area | Details |
| --- | --- |
| Problem | Patient-facing check-ins must feel trustworthy and easy, especially for older patients or patients managing chronic illness. Small text, clinical jargon, or sparse reassurance can reduce completion. |
| Proposed solution | Keep patient screens plain-language, accessible, and reassuring. Use large typography, clear required indicators, practice/provider context, support contact, and a friendly completion state. |
| Expected benefit | Improves completion rates and reduces calls caused by confusion or mistrust. |
| Classification | MVP |

These are different presentation experiences over the same CCM workflow, not separate products. The system should preserve one shared operational source of truth while tailoring each presentation to the user's job.

# Future Ideas

## Seasonal Themes

| Area | Details |
| --- | --- |
| Problem | The product may eventually benefit from a lighter emotional tone, but theme work does not help complete the first billable month. |
| Proposed solution | Offer subtle seasonal appearance options after the core workflow is stable. |
| Expected benefit | Adds delight for practices that use the product daily without changing workflow behavior. |
| Classification | Future |

## Holiday Themes

| Area | Details |
| --- | --- |
| Problem | Holiday styling could be charming but risks distracting from clinical and billing tasks if introduced too early. |
| Proposed solution | Consider optional, restrained holiday themes as a user-selectable appearance layer. |
| Expected benefit | Gives practices personality without altering documentation or billing workflows. |
| Classification | Future |

## User-Selectable Appearance Packs

| Area | Details |
| --- | --- |
| Problem | Users may have different readability preferences, but appearance customization can quickly become a distraction from core usability. |
| Proposed solution | Later, provide a small set of accessible appearance packs, prioritizing contrast and readability over decoration. |
| Expected benefit | Supports comfort for long daily sessions and gives practices modest control over their workspace. |
| Classification | Future |

## AI-Assisted Condition Suggestions

| Area | Details |
| --- | --- |
| Problem | Staff may enter informal condition names or miss common canonical mappings. |
| Proposed solution | Suggest normalized condition names and ICD-10 codes from free-text entry, with staff approval before storing. |
| Expected benefit | Reduces coding friction and improves consistency without requiring staff to memorize ICD-10. |
| Classification | Phase 2 |

## Adaptive Personalization By Provider Usage

| Area | Details |
| --- | --- |
| Problem | Different providers and specialties will repeatedly use different condition sets, but manually configuring favorites may be tedious. |
| Proposed solution | Learn provider-specific frequently used conditions and surface intelligent suggestions in the condition manager. |
| Expected benefit | Speeds up enrollment over time while preserving staff control. |
| Classification | Future |

## Backlog Principle

Do not implement these improvements until the functional Vertical Slice MVP is complete and stable. UX refinement should make the existing workflow easier, clearer, and more credible without expanding into unrelated product areas.
