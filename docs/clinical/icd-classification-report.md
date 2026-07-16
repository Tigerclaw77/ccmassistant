# ICD-10-CM CCM Classification Report

## Release

- Source: Centers for Medicare & Medicaid Services, FY 2026 April 1, 2026 Code Descriptions in Tabular Order
- Effective dates: 2026-04-01 through 2026-09-30
- Source file: `april-1-2026-code-descriptions-tabular-order.zip`
- Source entry: `Code Descriptions/icd10cm_order_2026.txt`
- Imported at: 2026-07-15T01:19:26.074Z
- Source SHA-256: `4fd9d8b37f02ab42827c7e7be30595c005b0cc3a6bae7a515e3f4c86b6918688`

CMS has published FY 2027 files, but those codes are not effective until October 1, 2026. This catalog intentionally uses the currently effective April 1, 2026 release.

## Counts

| Metric | Count |
| --- | ---: |
| Total imported records | 98,186 |
| Billable codes | 74,719 |
| Non-billable headers | 23,467 |
| PASS | 11,192 |
| FAIL | 36,452 |
| UNSURE | 50,542 |
| Mapped PASS | 6,609 |
| Unmapped PASS | 4,583 |
| Canonical conditions | 81 |
| Clinical content groups | 301 |
| Duplicate/shared groups | 244 |
| Laterality-collapsed groups | 71 |

## Grouping Model

Every CMS row retains its exact diagnosis code, official title, and billable status. A canonical condition is the broad chronic-care concept. A clinical content group is the future reusable question and care-plan unit. Laterality, encounter extensions, anatomical subsite, and coding specificity collapse when they do not change CCM monitoring or interventions. Stage, severity, complication profile, organ involvement, treatment burden, and red-flag state remain separate variants when deterministic rules identify a management difference.

No question banks, goals, interventions, education, or care-plan content were generated in this sprint.

### Collapsed Laterality Examples

| ICD code | Official title | Classification | Shared clinical content group |
| --- | --- | --- | --- |
| H40.1111 | Primary open-angle glaucoma, right eye, mild stage | PASS | glaucoma__open_angle_mild |
| H40.1121 | Primary open-angle glaucoma, left eye, mild stage | PASS | glaucoma__open_angle_mild |
| M17.0 | Bilateral primary osteoarthritis of knee | PASS | osteoarthritis__general |
| M17.11 | Unilateral primary osteoarthritis, right knee | PASS | osteoarthritis__general |
| M17.12 | Unilateral primary osteoarthritis, left knee | PASS | osteoarthritis__general |

### Intentionally Separate Variants

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
| E11.22 | Type 2 diabetes mellitus with diabetic chronic kidney disease | PASS | type_2_diabetes__kidney_complication |
| E11.9 | Type 2 diabetes mellitus without complications | PASS | type_2_diabetes__general |
| H40.1111 | Primary open-angle glaucoma, right eye, mild stage | PASS | glaucoma__open_angle_mild |
| H40.1113 | Primary open-angle glaucoma, right eye, severe stage | PASS | glaucoma__open_angle_severe |
| N18.31 | Chronic kidney disease, stage 3a | PASS | chronic_kidney_disease__general |
| N18.5 | Chronic kidney disease, stage 5 | PASS | chronic_kidney_disease__advanced_stage |
| N18.6 | End stage renal disease | PASS | chronic_kidney_disease__dialysis_considerations |

CKD general, advanced-stage, and dialysis considerations remain distinct. Diabetes complication modules remain distinct from uncomplicated diabetes. Glaucoma severity stages remain distinct while right/left/bilateral codes at the same stage collapse.

## Top Code Families

| Family | Imported rows |
| --- | ---: |
| S82 | 3,346 |
| S52 | 3,034 |
| S72 | 2,660 |
| S62 | 2,230 |
| S42 | 1,644 |
| S92 | 1,631 |
| S63 | 1,283 |
| M84 | 1,121 |
| S32 | 1,024 |
| T23 | 945 |
| S06 | 815 |
| S61 | 811 |
| S31 | 781 |
| T22 | 769 |
| S66 | 761 |
| S60 | 746 |
| T63 | 656 |
| S56 | 617 |
| S02 | 553 |
| S12 | 529 |

## Representative Samples

### PASS

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
| A04.71 | Enterocolitis due to Clostridium difficile, recurrent | PASS | - |
| A04.72 | Enterocolitis due to Clostridium difficile, not specified as recurrent | PASS | - |
| A06.1 | Chronic intestinal amebiasis | PASS | - |
| A24.2 | Subacute and chronic melioidosis | PASS | - |
| A39.3 | Chronic meningococcemia | PASS | - |
| B18.0 | Chronic viral hepatitis B with delta-agent | PASS | chronic_viral_hepatitis__general |
| B18.1 | Chronic viral hepatitis B without delta-agent | PASS | chronic_viral_hepatitis__general |
| B18.2 | Chronic viral hepatitis C | PASS | chronic_viral_hepatitis__general |
| B18.8 | Other chronic viral hepatitis | PASS | chronic_viral_hepatitis__general |
| B18.9 | Chronic viral hepatitis, unspecified | PASS | chronic_viral_hepatitis__general |

### FAIL

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
| D78.11 | Accidental puncture and laceration of the spleen during a procedure on the spleen | FAIL | - |
| D78.12 | Accidental puncture and laceration of the spleen during other procedure | FAIL | - |
| E36.11 | Accidental puncture and laceration of an endocrine system organ or structure during an endocrine system procedure | FAIL | - |
| E36.12 | Accidental puncture and laceration of an endocrine system organ or structure during other procedure | FAIL | - |
| G97.41 | Accidental puncture or laceration of dura during a procedure | FAIL | - |
| G97.48 | Accidental puncture and laceration of other nervous system organ or structure during a nervous system procedure | FAIL | - |
| G97.49 | Accidental puncture and laceration of other nervous system organ or structure during other procedure | FAIL | - |
| H02.811 | Retained foreign body in right upper eyelid | FAIL | - |
| H02.812 | Retained foreign body in right lower eyelid | FAIL | - |
| H02.813 | Retained foreign body in right eye, unspecified eyelid | FAIL | - |

### UNSURE

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
| A00.0 | Cholera due to Vibrio cholerae 01, biovar cholerae | UNSURE | - |
| A00.1 | Cholera due to Vibrio cholerae 01, biovar eltor | UNSURE | - |
| A00.9 | Cholera, unspecified | UNSURE | - |
| A01.00 | Typhoid fever, unspecified | UNSURE | - |
| A01.01 | Typhoid meningitis | UNSURE | - |
| A01.02 | Typhoid fever with heart involvement | UNSURE | - |
| A01.03 | Typhoid pneumonia | UNSURE | - |
| A01.04 | Typhoid arthritis | UNSURE | - |
| A01.05 | Typhoid osteomyelitis | UNSURE | - |
| A01.09 | Typhoid fever with other complications | UNSURE | - |

## Potential False-FAIL Review Sample

This deterministic sample is intentionally provided for clinical review. FAIL is recoverable through the existing authorized override path and does not remove a code from exact search.

| ICD code | Official title | Classification | Clinical content group |
| --- | --- | --- | --- |
| D78.11 | Accidental puncture and laceration of the spleen during a procedure on the spleen | FAIL | - |
| S00.421D | Blister (nonthermal) of right ear, subsequent encounter | FAIL | - |
| S01.551A | Open bite of lip, initial encounter | FAIL | - |
| S02.610G | Fracture of condylar process of mandible, unspecified side, subsequent encounter for fracture with delayed healing | FAIL | - |
| S04.892A | Injury of other cranial nerves, left side, initial encounter | FAIL | - |
| S06.36AD | Traumatic hemorrhage of cerebrum, unspecified, with loss of consciousness status unknown, subsequent encounter | FAIL | - |
| S09.301A | Unspecified injury of right middle and inner ear, initial encounter | FAIL | - |
| S12.130D | Unspecified traumatic displaced spondylolisthesis of second cervical vertebra, subsequent encounter for fracture with routine healing | FAIL | - |
| S12.690G | Other displaced fracture of seventh cervical vertebra, subsequent encounter for fracture with delayed healing | FAIL | - |
| S15.292A | Other specified injury of left external jugular vein, initial encounter | FAIL | - |
| S20.94XD | External constriction of unspecified parts of thorax, subsequent encounter | FAIL | - |
| S22.020D | Wedge compression fracture of second thoracic vertebra, subsequent encounter for fracture with routine healing | FAIL | - |
| S23.111A | Dislocation of T1/T2 thoracic vertebra, initial encounter | FAIL | - |
| S25.899D | Other specified injury of other blood vessels of thorax, unspecified side, subsequent encounter | FAIL | - |
| S30.844A | External constriction of vagina and vulva, initial encounter | FAIL | - |
| S31.41XD | Laceration without foreign body of vagina and vulva, subsequent encounter | FAIL | - |
| S32.020A | Wedge compression fracture of second lumbar vertebra, initial encounter for closed fracture | FAIL | - |
| S32.399B | Other fracture of unspecified ilium, initial encounter for open fracture | FAIL | - |
| S32.485D | Nondisplaced dome fracture of left acetabulum, subsequent encounter for fracture with routine healing | FAIL | - |
| S34.9XXA | Injury of unspecified nerves at abdomen, lower back and pelvis level, initial encounter | FAIL | - |
| S36.32XD | Contusion of stomach, subsequent encounter | FAIL | - |
| S37.62XA | Contusion of uterus, initial encounter | FAIL | - |
| S41.121D | Laceration with foreign body of right upper arm, subsequent encounter | FAIL | - |
| S42.126A | Nondisplaced fracture of acromial process, unspecified shoulder, initial encounter for closed fracture | FAIL | - |
| S42.242P | 4-part fracture of surgical neck of left humerus, subsequent encounter for fracture with malunion | FAIL | - |

## Data Quality Warnings

- 4,583 PASS records are intentionally unmapped and require canonical review before content generation.

## Clinical Review Risk

The classification is deliberately conservative and is not clinically perfect. Broad chapter and title heuristics may leave many plausible conditions as UNSURE, and some chronic-condition families remain PASS but unmapped. The highest-value review queues are unmapped PASS, low-confidence grouping, stage/severity variants, and the potential false-FAIL sample. Later content generation should run once per `clinicalContentGroupId`, never once per exact ICD code.

Generated content groups represented in this report: 301. Shared duplicate groups represented: 244.
