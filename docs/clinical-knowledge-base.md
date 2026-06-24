# Clinical Knowledge Base

Sprint 2 adds the shared clinical model that future questionnaire generation will use. It is intentionally separate from the current first-billable-month workflow and does not change billability, patient check-ins, or recommendation behavior.

## Hierarchy

The normalized hierarchy is:

1. ICD-10 code
2. Management cluster
3. Clinical objective
4. Question family
5. Clinical question

The model is many-to-many at each layer where reuse matters:

- Many ICD-10 codes can map to one management cluster.
- One ICD-10 code can map to multiple clusters when clinically useful.
- One cluster can map to multiple clinical objectives.
- One objective can map to multiple reusable question families.
- One family can contain many questions.
- One question can belong to multiple families.

## Why Each Layer Exists

`icd10_codes` stores imported or representative diagnosis codes. Sprint 2 seeds only representative codes so development can validate the model without loading thousands of ICD rows.

`management_clusters` group clinically similar diagnoses. This avoids duplicating question sets for ICD-10 variants such as laterality, location, severity, or coding detail when the management task is the same.

`clinical_objectives` describe why the practice is asking questions: medication adherence, symptom monitoring, home measurements, barriers, hospitalization screening, follow-up compliance, education, and related care-management needs.

`question_families` group reusable questions by task, such as blood pressure, blood glucose, medication access, respiratory symptoms, falls, nutrition, and care coordination.

`clinical_questions` stores reusable question content and metadata: answer type, required flag, severity, clinical importance, cadence, follow-up trigger, provider review flag, active/retired flags, version, language, and structured metadata.

## Future Questionnaire Generation

Future generation should follow this deterministic path:

1. Start with the patient diagnosis ICD-10 codes.
2. Resolve matching management clusters through `cluster_icd10_map`.
3. Resolve objectives through `cluster_objective_map`.
4. Resolve question families through `objective_family_map`.
5. Resolve candidate questions through `question_family_members`.
6. Apply `question_rotation_rules` to prevent asking every reusable question every month.
7. Apply `question_dependencies` to show follow-up questions only when their parent answer requires them.
8. Present the resulting set for provider/practice approval before using it in patient-facing check-ins.

This sprint does not implement generation, AI selection, provider preference logic, or patient-facing intelligence.

## Adding ICD Clusters

For a new condition:

1. Add or import the ICD-10 code into `icd10_codes`.
2. Reuse an existing `management_clusters` row if the management approach is already covered.
3. Create a new cluster only when the management objectives are meaningfully different.
4. Add mappings in `cluster_icd10_map`.
5. Map the cluster to objectives in `cluster_objective_map`.
6. Reuse existing families before creating a new `question_families` row.

## Complete ICD Import Later

A full ICD import should be a separate migration or admin import job:

1. Load official ICD-10 code, description, billable status, and chapter/category into a staging table.
2. Normalize code formatting and validate uniqueness.
3. Upsert into `icd10_codes`.
4. Use clinician-reviewed mapping rules to populate `cluster_icd10_map`.
5. Mark imported mappings with `mapping_type = 'imported'`.
6. Keep manually reviewed mappings distinguishable from automated/imported mappings.

Do not generate new clusters for every ICD-10 code. Cluster first by management needs.

## Question Versioning

`clinical_questions.version` stores the current active version number.

`question_versions` stores immutable snapshots of question text, answer type, options, and change notes. When a question changes materially:

1. Insert a new `question_versions` row with the next version.
2. Update `clinical_questions.version`.
3. Retire the old question only if it should no longer be selectable.
4. Prefer versioning over overwriting when wording changes affect clinical meaning or auditability.

Minor typo fixes can update the current question text, but clinical wording changes should be versioned.

## Administration

The read-only admin browser is available at `/clinical-knowledge`.

It supports:

- Browsing clusters, objectives, families, and questions.
- Searching across names, slugs, question text, answer types, and tags.
- Viewing representative ICD mappings.
- Viewing cluster-to-objective, objective-to-family, and family-to-question relationships.
- Viewing question metadata, tags, and version history.

Advanced editing is intentionally deferred.

## Future Work

- Full ICD-10 import pipeline.
- Clinical editor with review/approval workflow.
- Question authoring and version approval UI.
- Provider specialty preferences.
- Practice-level overrides.
- Patient-specific rotation history.
- Deterministic questionnaire generation.
- Clinical safety review process.
- AI-assisted suggestion workflow after deterministic generation exists.
