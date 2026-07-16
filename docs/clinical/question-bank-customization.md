# Question Bank Customization Layer

## Purpose

This layer customizes suggested question banks without changing the canonical clinical catalog. The system bank is cloned for each resolution; clinic, provider, and coordinator records are then applied in order.

```mermaid
flowchart LR
  System["Immutable system bank"] --> Clinic["Clinic override"]
  Clinic --> Provider["Provider override"]
  Provider --> Coordinator["Coordinator preference"]
  Coordinator --> Resolved["Resolved suggested bank"]
```

The persisted `practice_id` is the clinic boundary used elsewhere in CCM Assistant.

## Records

`question_bank_override_versions` stores include/exclude, order, default-selection, selection-level, and context changes. Records are append-only. The highest version for one scope owner and bank is effective; a latest `retired` version removes that layer and falls back to its parent.

`question_bank_custom_question_versions` stores clinic-owned `custom.*` question definitions. Each version records owner, clinic scope, canonical condition, text, helper text, answer type, contexts, creator, version, and active/retired state. Custom questions do not enter the canonical registry.

`question_bank_favorite_versions` stores condition-bank favorites at clinic, provider, and coordinator scopes. Lower scopes can add or hide inherited favorites. Resolved favorites are emitted before deduplicated ICD search results.

`question_contribution_candidates` stores optional contribution candidates separately. It records only canonical condition, generic question text, context, aggregate usage count, opt-in state, anonymity, and no-PHI attestation. There is no foreign key, trigger, or resolver path that merges a candidate into the canonical library.

## Runtime Flow

1. Resolve the immutable system bank and any system-owned clinical variant.
2. Clone every reference and definition used by that bank.
3. Select the highest version for the matching clinic scope.
4. Apply the matching provider version on top.
5. Apply the matching coordinator version last.
6. Filter by runtime context, reject duplicate final display orders, and return the ordered bank plus an applied-version trace.

An excluded question remains addressable during resolution, so a lower scope can explicitly restore it. Required questions are always default-selected. A clinic custom question must be active, owned by the same clinic, and attached to the same canonical condition before it can be included.

## Validation

Application validation rejects orphan banks, conditions, canonical questions, and custom questions; duplicate history versions; duplicate changes; malformed selection/context changes; and conflicting owner shapes. Coordinator scope requires both a provider and coordinator, provider scope cannot name a coordinator, and clinic scope cannot name either.

Database checks repeat the scope-shape rules and use a trigger to verify provider and coordinator ownership within the selected clinic. Override, favorite, and custom-question rows are immutable after insert, preserving complete audit history. Row-level security limits clinic records to clinic members and restricts scope writes to clinic administrators or the matching provider/coordinator owner.

## Anonymous Contributions

Anonymous payload construction requires explicit opt-in and no-PHI attestation. The payload allowlist contains only candidate ID, canonical condition, question, context, and aggregate usage count. Creator, clinic, patient, response, encounter, and free-form metadata fields are not accepted. Obvious email, phone, SSN, MRN, patient-ID, and birth-date patterns are blocked before a payload can be produced.

Contribution candidates always require independent review. They are never automatically promoted, merged, or used by the runtime resolver.
